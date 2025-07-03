import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isServerUserAdmin } from '@/lib/auth/admin'

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const isAdmin = await isServerUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const limit = parseInt(searchParams.get('limit') || '20')

    const supabase = await createServerSupabaseClient()

    // Get qualified leads awaiting approval
    let query = supabase
      .from('leads')
      .select(`
        *,
        call_logs:call_logs!lead_id (
          id,
          call_status,
          call_duration,
          lead_qualification_score,
          next_action,
          conversation_summary,
          key_information,
          transcript,
          call_started_at,
          call_ended_at
        )
      `)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (status === 'pending') {
      query = query.eq('status', 'qualified')
    } else if (status === 'approved') {
      query = query.eq('status', 'property_approved')
    } else if (status === 'rejected') {
      query = query.eq('status', 'rejected')
    }

    const { data: leads, error } = await query

    if (error) {
      console.error('Error fetching leads for approval:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    // Process leads with additional approval metadata
    const processedLeads = leads?.map(lead => {
      const latestCall = lead.call_logs?.[0]
      
      return {
        ...lead,
        approval_status: status,
        call_summary: latestCall ? {
          duration: latestCall.call_duration ? `${Math.floor(latestCall.call_duration / 60)}m ${latestCall.call_duration % 60}s` : 'Unknown',
          qualification_score: latestCall.lead_qualification_score || 0,
          conversation_summary: latestCall.conversation_summary || 'No summary available',
          key_property_info: latestCall.key_information || {},
          call_completed_at: latestCall.call_ended_at,
          transcript_available: !!latestCall.transcript
        } : null,
        approval_factors: {
          price_range_score: calculatePriceRangeScore(lead.price_range),
          location_score: calculateLocationScore(lead.location),
          timeline_score: calculateTimelineScore(lead.timeline),
          call_score: latestCall?.lead_qualification_score || 0
        }
      }
    })

    // Get approval statistics
    const { data: approvalStats } = await supabase
      .from('leads')
      .select('status')
      .in('status', ['qualified', 'property_approved', 'rejected'])

    const stats = {
      pending_approval: approvalStats?.filter(l => l.status === 'qualified').length || 0,
      approved: approvalStats?.filter(l => l.status === 'property_approved').length || 0,
      rejected: approvalStats?.filter(l => l.status === 'rejected').length || 0,
      total: approvalStats?.length || 0
    }

    return NextResponse.json({
      success: true,
      leads: processedLeads,
      stats,
      pagination: {
        limit,
        count: processedLeads?.length || 0
      }
    })

  } catch (error) {
    console.error('Property approval API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const isAdmin = await isServerUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      lead_id, 
      action, // 'approve' or 'reject'
      reason,
      admin_notes,
      admin_id 
    } = body

    if (!lead_id || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Lead ID and valid action (approve/reject) are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Get the lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('lead_id', lead_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    if (lead.status !== 'qualified') {
      return NextResponse.json(
        { error: 'Lead must be qualified to approve/reject' },
        { status: 400 }
      )
    }

    // Update lead status
    const newStatus = action === 'approve' ? 'property_approved' : 'rejected'
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        metadata: {
          ...lead.metadata,
          approval_decision: {
            action: action,
            reason: reason || '',
            admin_notes: admin_notes || '',
            admin_id: admin_id,
            decided_at: new Date().toISOString()
          }
        }
      })
      .eq('lead_id', lead_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating lead approval status:', updateError)
      return NextResponse.json(
        { error: 'Failed to update lead status' },
        { status: 500 }
      )
    }

    // Send appropriate WhatsApp message
    try {
      const messageType = action === 'approve' ? 'property_approved' : 'property_rejected'
      
      await fetch(`${request.nextUrl.origin}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lead.whatsapp_number,
          message_type: messageType,
          variables: {
            name: lead.name,
            property_type: lead.property_type,
            location: lead.location
          }
        })
      })

      // If approved, the property will be available for photographer assignment in admin panel
      if (action === 'approve') {
        console.log(`Property approved for ${lead.name} - ready for photographer assignment`)
      }

    } catch (whatsappError) {
      console.error('WhatsApp notification failed:', whatsappError)
    }

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      action: action,
      message: `Property ${action}d successfully`
    })

  } catch (error) {
    console.error('Property approval decision error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper functions for scoring
function calculatePriceRangeScore(priceRange: string): number {
  const scores: Record<string, number> = {
    "Below 1.5M EGP": 3,
    "1.5M-3M EGP": 5,
    "3M-5M EGP": 7,
    "5M-8M EGP": 8,
    "8M-15M EGP": 9,
    "15M+ EGP": 10
  }
  return scores[priceRange] || 5
}

function calculateLocationScore(location: string): number {
  const scores: Record<string, number> = {
    "Zamalek": 10,
    "New Cairo": 9,
    "Maadi": 8,
    "Heliopolis": 8,
    "6th October": 6,
    "Sheikh Zayed": 6,
    "Giza": 5,
    "Other": 4
  }
  return scores[location] || 5
}

function calculateTimelineScore(timeline: string): number {
  const scores: Record<string, number> = {
    "Immediately (0-2 months)": 10,
    "Soon (2-4 months)": 8,
    "Later this year (4-8 months)": 6,
    "Just exploring options": 3
  }
  return scores[timeline] || 5
}