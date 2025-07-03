/**
 * Contract Generation API Endpoint
 * Generates contracts for leads using AI-powered contract generation service
 */

import { NextRequest, NextResponse } from 'next/server'
import { contractGenerator, type ContractGenerationRequest } from '@/lib/contracts/generator'
import { authorizeAdminRequest } from '@/lib/auth/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Request validation schema
const generateContractSchema = z.object({
  leadId: z.string().uuid('Invalid lead ID format'),
  contractType: z.enum(['exclusive_listing', 'sale_agreement', 'marketing_authorization', 'commission_agreement'], {
    errorMap: () => ({ message: 'Invalid contract type' })
  }),
  expedited: z.boolean().optional().default(false),
  manualReview: z.boolean().optional().default(false),
  customVariables: z.record(z.any()).optional()
})

export async function POST(request: NextRequest) {
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
    const validationResult = generateContractSchema.safeParse(body)
    
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

    const { leadId, contractType, expedited, manualReview, customVariables } = validationResult.data

    // Check if lead exists and is eligible for contract generation
    const supabase = await createServerSupabaseClient()
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found or inaccessible' },
        { status: 404 }
      )
    }

    // Log contract generation attempt
    console.log(`Contract generation initiated:`, {
      leadId,
      contractType,
      expedited,
      manualReview,
      leadName: lead.name,
      timestamp: new Date().toISOString()
    })

    // Generate contract
    const generationRequest: ContractGenerationRequest = {
      leadId,
      contractType,
      expedited,
      manualReview,
      customVariables
    }

    const result = await contractGenerator.generateContract(generationRequest)

    // Log result
    console.log(`Contract generation completed:`, {
      leadId,
      success: result.success,
      contractId: result.contractId,
      autoApproved: result.autoApproved,
      generationTimeMs: result.generationTimeMs
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contract generation failed',
          details: result.errors,
          generationTimeMs: result.generationTimeMs
        },
        { status: 500 }
      )
    }

    // Return success response with download capability
    return NextResponse.json({
      success: true,
      data: {
        contractId: result.contractId,
        documentUrl: result.documentUrl,
        downloadUrl: `/api/admin/contracts/${result.contractId}/download`,
        aiConfidenceScore: result.aiConfidenceScore,
        legalRiskScore: result.legalRiskScore,
        autoApproved: result.autoApproved,
        requiresManualReview: result.requiresManualReview,
        estimatedValue: result.estimatedValue,
        warnings: result.warnings || [],
        generationTimeMs: result.generationTimeMs
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Contract generation API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    
    // Handle specific error types
    if (errorMessage.includes('contract_templates')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contract templates not found. Please ensure the database is properly initialized.',
          hint: 'Run the contract automation migration to create required tables.'
        },
        { status: 500 }
      )
    }
    
    if (errorMessage.includes('lead_contracts')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Contract storage tables not found. Please ensure the database is properly initialized.',
          hint: 'Run the contract automation migration to create required tables.'
        },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error during contract generation',
        message: errorMessage,
        hint: 'Check server logs for more details.'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check generation status
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
    const leadId = searchParams.get('leadId')

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    // Get contract status for lead
    const supabase = await createServerSupabaseClient()
    
    const { data: contracts, error } = await supabase
      .from('lead_contracts')
      .select(`
        id,
        contract_type,
        status,
        ai_confidence_score,
        legal_risk_score,
        auto_approved,
        document_url,
        created_at,
        sent_at,
        signed_at,
        contract_ai_reviews (
          confidence_score,
          manual_review_required,
          risk_factors,
          recommendations
        )
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching contracts:', error)
      throw error
    }

    // Add download URLs to contracts
    const contractsWithDownload = contracts?.map(contract => ({
      ...contract,
      downloadUrl: `/api/admin/contracts/${contract.id}/download`
    })) || []

    return NextResponse.json({
      success: true,
      data: {
        leadId,
        contracts: contractsWithDownload,
        hasActiveContract: contractsWithDownload.length > 0,
        latestContract: contractsWithDownload.length > 0 ? contractsWithDownload[0] : null
      }
    })

  } catch (error) {
    console.error('Contract status check error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check contract status',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}