import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isServerUserAdmin } from '@/lib/auth/admin'

const VALID_STATUSES = [
  'new_lead',
  'whatsapp_sent', 
  'responded',
  'time_selected',
  'custom_time_suggested',
  'call_scheduled',
  'called',
  'qualified',
  'property_approved',
  'photographer_scheduled',
  'completed',
  'rejected'
]

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { lead_id, status, notes, admin_id } = body

    if (!lead_id) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    // Validate admin access
    const supabase = await createServerSupabaseClient()
    const isAdmin = await isServerUserAdmin()
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if lead exists
    const { data: existingLead, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .eq('lead_id', lead_id)
      .single()

    if (fetchError || !existingLead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData = {
      status: status,
      updated_at: new Date().toISOString(),
      ...(notes && { notes: notes }),
      ...(admin_id && { last_updated_by: admin_id })
    }

    // Update lead status
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update(updateData)
      .eq('lead_id', lead_id)
      .select()
      .single()

    if (updateError) {
      console.error('Status update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update lead status' },
        { status: 500 }
      )
    }

    // Log the status change
    console.log(`Lead ${lead_id} status updated from ${existingLead.status} to ${status} by admin`)

    // Trigger additional actions based on status change
    try {
      if (status === 'property_approved') {
        // Send property approved WhatsApp message
        await fetch(`${request.nextUrl.origin}/api/whatsapp/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: existingLead.whatsapp_number,
            message_type: 'property_approved',
            variables: {
              name: existingLead.name,
              property_type: existingLead.property_type,
              location: existingLead.location
            }
          })
        })
      } else if (status === 'rejected') {
        // Send rejection message
        await fetch(`${request.nextUrl.origin}/api/whatsapp/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: existingLead.whatsapp_number,
            message_type: 'property_rejected',
            variables: {
              name: existingLead.name,
              property_type: existingLead.property_type,
              location: existingLead.location
            }
          })
        })
      }
    } catch (whatsappError) {
      console.error('WhatsApp message failed during status update:', whatsappError)
    }

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      message: `Lead status updated to ${status}`
    })

  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Check admin access
    const isAdmin = await isServerUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    // Fetch lead data
    const { data: lead, error } = await supabase
      .from('leads')
      .select('*')
      .eq('lead_id', leadId)
      .single()

    if (error || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      lead: lead,
      available_statuses: VALID_STATUSES
    })

  } catch (error) {
    console.error('Lead fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}