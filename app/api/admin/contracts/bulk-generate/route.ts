/**
 * Bulk Contract Generation API Endpoint
 * Generates contracts for multiple leads simultaneously
 */

import { NextRequest, NextResponse } from 'next/server'
import { contractGenerator, type ContractGenerationRequest } from '@/lib/contracts/generator'
import { authorizeAdminRequest } from '@/lib/auth/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Request validation schema
const bulkGenerateSchema = z.object({
  leadIds: z.array(z.string().uuid()).min(1).max(50), // Limit to 50 leads per batch
  contractType: z.enum(['exclusive_listing', 'sale_agreement', 'marketing_authorization', 'commission_agreement', 'standard']).default('standard'),
  expedited: z.boolean().optional().default(false),
  manualReview: z.boolean().optional().default(false),
  batchSize: z.number().min(1).max(10).optional().default(5), // Process in batches of 5
  customVariables: z.record(z.any()).optional()
})

interface BulkGenerationResult {
  totalRequested: number
  successful: number
  failed: number
  results: Array<{
    leadId: string
    success: boolean
    contractId?: string
    error?: string
    generationTimeMs: number
  }>
  totalTimeMs: number
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Validate admin permissions
    const authResult = await authorizeAdminRequest(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = bulkGenerateSchema.safeParse(body)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    const { leadIds, contractType, expedited, manualReview, batchSize, customVariables } = validationResult.data

    // Validate that all leads exist and are eligible for contract generation
    const supabase = await createServerSupabaseClient()
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name, status, contract_status')
      .in('id', leadIds)

    if (leadsError) {
      throw leadsError
    }

    if (!leads || leads.length !== leadIds.length) {
      const foundIds = leads?.map(l => l.id) || []
      const missingIds = leadIds.filter(id => !foundIds.includes(id))
      
      return NextResponse.json(
        { 
          error: 'Some leads not found',
          missingLeadIds: missingIds
        },
        { status: 400 }
      )
    }

    // Check for leads that already have contracts or are not ready
    const ineligibleLeads = leads.filter(lead => 
      lead.contract_status !== 'pending' || 
      !['completed', 'qualified'].includes(lead.status)
    )

    if (ineligibleLeads.length > 0) {
      return NextResponse.json(
        {
          error: 'Some leads are not eligible for contract generation',
          ineligibleLeads: ineligibleLeads.map(lead => ({
            id: lead.id,
            name: lead.name,
            status: lead.status,
            contractStatus: lead.contract_status,
            reason: lead.contract_status !== 'pending' ? 'Already has contract' : 'Lead not completed'
          }))
        },
        { status: 400 }
      )
    }

    // Log bulk generation start
    console.log(`Bulk contract generation initiated:`, {
      leadCount: leadIds.length,
      contractType,
      expedited,
      manualReview,
      batchSize,
      timestamp: new Date().toISOString()
    })

    // Process leads in batches to avoid overwhelming the system
    const results: BulkGenerationResult['results'] = []
    const batches = chunkArray(leadIds, batchSize)

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex]
      console.log(`Processing batch ${batchIndex + 1}/${batches.length} with ${batch.length} leads`)

      // Process batch in parallel
      const batchPromises = batch.map(async (leadId) => {
        const leadStartTime = Date.now()
        
        try {
          const generationRequest: ContractGenerationRequest = {
            leadId,
            contractType,
            expedited,
            manualReview,
            customVariables
          }

          const result = await contractGenerator.generateContract(generationRequest)
          
          return {
            leadId,
            success: result.success,
            contractId: result.contractId,
            error: result.success ? undefined : result.errors?.join(', '),
            generationTimeMs: Date.now() - leadStartTime
          }

        } catch (error) {
          console.error(`Failed to generate contract for lead ${leadId}:`, error)
          
          return {
            leadId,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            generationTimeMs: Date.now() - leadStartTime
          }
        }
      })

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Small delay between batches to prevent overwhelming the system
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Calculate summary statistics
    const successful = results.filter(r => r.success).length
    const failed = results.length - successful
    const totalTimeMs = Date.now() - startTime

    const bulkResult: BulkGenerationResult = {
      totalRequested: leadIds.length,
      successful,
      failed,
      results,
      totalTimeMs
    }

    // Log completion
    console.log(`Bulk contract generation completed:`, {
      totalRequested: leadIds.length,
      successful,
      failed,
      totalTimeMs,
      averageTimePerContract: Math.round(totalTimeMs / leadIds.length)
    })

    return NextResponse.json({
      success: true,
      data: bulkResult
    }, { status: 201 })

  } catch (error) {
    console.error('Bulk contract generation API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during bulk contract generation',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        totalTimeMs: Date.now() - startTime
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check bulk generation status
export async function GET(request: NextRequest) {
  try {
    // Validate admin permissions
    const authResult = await authorizeAdminRequest(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const eligibleOnly = searchParams.get('eligibleOnly') === 'true'

    // Get leads that are eligible for bulk contract generation
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('leads')
      .select('id, name, email, location, property_type, price_range, status, contract_status, created_at')
      .in('status', ['completed', 'qualified'])

    if (eligibleOnly) {
      query = query.eq('contract_status', 'pending')
    }

    const { data: leads, error } = await query
      .order('created_at', { ascending: false })
      .limit(100) // Limit to most recent 100 leads

    if (error) {
      throw error
    }

    const eligibleLeads = leads?.filter(lead => 
      lead.contract_status === 'pending' && 
      ['completed', 'qualified'].includes(lead.status)
    ) || []

    return NextResponse.json({
      success: true,
      data: {
        totalLeads: leads?.length || 0,
        eligibleLeads: eligibleLeads.length,
        leads: eligibleOnly ? eligibleLeads : leads,
        recommendations: {
          suggestedBatchSize: Math.min(Math.max(Math.ceil(eligibleLeads.length / 10), 3), 10),
          estimatedTimeMinutes: Math.ceil(eligibleLeads.length * 2 / 60) // 2 minutes per contract average
        }
      }
    })

  } catch (error) {
    console.error('Bulk contract status check error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check bulk generation status',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * Helper function to split array into chunks
 */
function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}