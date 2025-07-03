/**
 * Contract Review API Endpoint
 * Manages contract review queue and approval workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdminRequest } from '@/lib/auth/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

// Request validation schemas
const reviewQuerySchema = z.object({
  status: z.enum(['pending_review', 'approved', 'rejected', 'all']).optional().default('pending_review'),
  priority: z.enum(['high', 'medium', 'low', 'all']).optional().default('all'),
  contractType: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  offset: z.coerce.number().min(0).optional().default(0)
})

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

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = Object.fromEntries(searchParams.entries())
    const validationResult = reviewQuerySchema.safeParse(queryParams)
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters',
          details: validationResult.error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      )
    }

    const { status, priority, contractType, limit, offset } = validationResult.data

    // Build query
    const supabase = await createServerSupabaseClient()
    let query = supabase
      .from('lead_contracts')
      .select(`
        id,
        lead_id,
        contract_type,
        status,
        ai_confidence_score,
        legal_risk_score,
        auto_approved,
        document_url,
        created_at,
        updated_at,
        leads!inner (
          id,
          name,
          email,
          whatsapp_number,
          location,
          price_range,
          property_type,
          urgency_reason,
          expedited_contract
        ),
        contract_ai_reviews (
          id,
          confidence_score,
          risk_factors,
          recommendations,
          manual_review_required,
          specialist_notes,
          approved_by,
          approved_at
        )
      `)

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (contractType) {
      query = query.eq('contract_type', contractType)
    }

    // Priority filtering based on risk score and urgency
    if (priority !== 'all') {
      switch (priority) {
        case 'high':
          query = query.or('legal_risk_score.gte.70,leads.expedited_contract.eq.true,leads.urgency_reason.ilike.%emergency%')
          break
        case 'medium':
          query = query.gte('legal_risk_score', 40).lt('legal_risk_score', 70)
          break
        case 'low':
          query = query.lt('legal_risk_score', 40)
          break
      }
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: contracts, error, count } = await query

    if (error) {
      throw error
    }

    // Calculate priority for each contract
    const contractsWithPriority = contracts?.map(contract => ({
      ...contract,
      priority: calculateContractPriority(contract),
      timeInQueue: Math.round((Date.now() - new Date(contract.created_at).getTime()) / (1000 * 60)) // minutes
    })) || []

    // Get summary statistics
    const { data: stats } = await supabase
      .from('lead_contracts')
      .select('status, legal_risk_score')
      .not('status', 'in', '(completed,cancelled)')

    const summary = {
      totalPending: stats?.filter(s => s.status === 'pending_review').length || 0,
      totalGenerated: stats?.filter(s => s.status === 'generated').length || 0,
      totalApproved: stats?.filter(s => s.status === 'approved').length || 0,
      highRisk: stats?.filter(s => s.legal_risk_score >= 70).length || 0,
      mediumRisk: stats?.filter(s => s.legal_risk_score >= 40 && s.legal_risk_score < 70).length || 0,
      lowRisk: stats?.filter(s => s.legal_risk_score < 40).length || 0
    }

    return NextResponse.json({
      success: true,
      data: {
        contracts: contractsWithPriority,
        pagination: {
          limit,
          offset,
          total: count || 0,
          hasMore: (count || 0) > offset + limit
        },
        summary,
        filters: {
          status,
          priority,
          contractType
        }
      }
    })

  } catch (error) {
    console.error('Contract review API error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch contracts for review',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

/**
 * Calculate priority level for contract review
 */
function calculateContractPriority(contract: any): 'high' | 'medium' | 'low' {
  const riskScore = contract.legal_risk_score || 0
  const isExpedited = contract.leads?.expedited_contract
  const isUrgent = contract.leads?.urgency_reason?.toLowerCase().includes('emergency')
  const isHighValue = contract.leads?.price_range?.toLowerCase().includes('m') // Million+
  
  // High priority conditions
  if (riskScore >= 70 || isExpedited || isUrgent || isHighValue) {
    return 'high'
  }
  
  // Medium priority conditions
  if (riskScore >= 40 || contract.ai_confidence_score < 85) {
    return 'medium'
  }
  
  // Low priority (most contracts)
  return 'low'
}

// POST endpoint for updating review status
const updateReviewSchema = z.object({
  contractId: z.string().uuid(),
  action: z.enum(['approve', 'reject', 'request_changes']),
  notes: z.string().optional(),
  modifications: z.record(z.any()).optional()
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
    const validationResult = updateReviewSchema.safeParse(body)
    
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

    const { contractId, action, notes, modifications } = validationResult.data

    // Get current user info
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      )
    }

    // Update contract status based on action
    let newStatus = 'pending_review'
    switch (action) {
      case 'approve':
        newStatus = 'approved'
        break
      case 'reject':
        newStatus = 'rejected'
        break
      case 'request_changes':
        newStatus = 'pending_review'
        break
    }

    // Update contract
    const { error: contractError } = await supabase
      .from('lead_contracts')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', contractId)

    if (contractError) {
      throw contractError
    }

    // Update AI review record
    const { error: reviewError } = await supabase
      .from('contract_ai_reviews')
      .update({
        specialist_notes: notes,
        specialist_modifications: modifications || {},
        approved_by: user.id,
        approved_at: action === 'approve' ? new Date().toISOString() : null
      })
      .eq('contract_id', contractId)

    if (reviewError) {
      throw reviewError
    }

    // Update lead status if approved
    if (action === 'approve') {
      await supabase
        .from('leads')
        .update({
          contract_status: 'approved',
          manual_contract_review: false
        })
        .eq('id', (await supabase
          .from('lead_contracts')
          .select('lead_id')
          .eq('id', contractId)
          .single()
        ).data?.lead_id)
    }

    // Log the review action
    console.log(`Contract review action:`, {
      contractId,
      action,
      reviewedBy: user.email,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      data: {
        contractId,
        action,
        newStatus,
        reviewedAt: new Date().toISOString(),
        reviewedBy: user.email
      }
    })

  } catch (error) {
    console.error('Contract review update error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update contract review',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}