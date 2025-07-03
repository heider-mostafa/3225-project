import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const leadId = params.id
    const body = await request.json()
    const { status, notes, reason } = body

    // Get current lead to track previous status
    const { data: currentLead, error: fetchError } = await supabase
      .from('leads')
      .select('status, metadata')
      .eq('lead_id', leadId)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Update lead status with tracking metadata
    const { data, error } = await supabase
      .from('leads')
      .update({
        status,
        updated_at: new Date().toISOString(),
        metadata: {
          ...currentLead.metadata,
          status_history: [
            ...(currentLead.metadata?.status_history || []),
            {
              previous_status: currentLead.status,
              new_status: status,
              notes,
              reason,
              changed_at: new Date().toISOString(),
              changed_by: 'admin'
            }
          ]
        }
      })
      .eq('lead_id', leadId)
      .select()
      .single()

    if (error) {
      console.error('Error updating lead status:', error)
      return NextResponse.json({ error: 'Failed to update lead status' }, { status: 500 })
    }

    // If approved, trigger WhatsApp notification
    if (status === 'property_approved') {
      try {
        // Send approval notification via WhatsApp
        await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: data.whatsapp_number,
            message_type: 'property_approved',
            variables: {
              name: data.name,
              property_type: data.property_type,
              location: data.location
            }
          })
        })
      } catch (whatsappError) {
        console.error('Error sending WhatsApp notification:', whatsappError)
        // Don't fail the status update if WhatsApp fails
      }
    }

    // If rejected, send rejection notification
    if (status === 'rejected') {
      try {
        await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: data.whatsapp_number,
            message_type: 'property_rejected',
            variables: {
              name: data.name,
              reason: reason || 'Does not meet our current listing criteria'
            }
          })
        })
      } catch (whatsappError) {
        console.error('Error sending WhatsApp rejection notification:', whatsappError)
      }
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: `Lead status updated to ${status}`
    })

  } catch (error) {
    console.error('Error in lead status update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}