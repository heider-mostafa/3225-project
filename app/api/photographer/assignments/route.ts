import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const photographerId = searchParams.get('photographer_id')

    if (!photographerId) {
      return NextResponse.json(
        { error: 'Photographer ID is required' },
        { status: 400 }
      )
    }

    // Use service role for database operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    )

    // Get photographer assignments with lead details
    const { data: assignments, error } = await supabase
      .from('photographer_assignments')
      .select(`
        *,
        lead:leads!lead_id (
          id,
          name,
          location,
          property_type,
          whatsapp_number,
          price_range,
          timeline
        )
      `)
      .eq('photographer_id', photographerId)
      .order('scheduled_time', { ascending: true })

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      assignments: assignments || []
    })

  } catch (error) {
    console.error('Assignments API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { assignment_id, status, photographer_id, completion_notes } = body

    if (!assignment_id || !status || !photographer_id) {
      return NextResponse.json(
        { error: 'Assignment ID, status, and photographer ID are required' },
        { status: 400 }
      )
    }

    // Use service role for database operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    )

    // Verify the assignment belongs to this photographer
    const { data: assignment, error: checkError } = await supabase
      .from('photographer_assignments')
      .select('photographer_id, lead_id')
      .eq('id', assignment_id)
      .single()

    if (checkError || !assignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    if (assignment.photographer_id !== photographer_id) {
      return NextResponse.json(
        { error: 'Unauthorized - Assignment belongs to different photographer' },
        { status: 403 }
      )
    }

    // Update assignment status
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (completion_notes) {
      updateData.completion_notes = completion_notes
    }

    if (status === 'completed') {
      updateData.actual_duration_minutes = updateData.actual_duration_minutes || 120
    }

    const { data: updatedAssignment, error: updateError } = await supabase
      .from('photographer_assignments')
      .update(updateData)
      .eq('id', assignment_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating assignment:', updateError)
      return NextResponse.json(
        { error: 'Failed to update assignment' },
        { status: 500 }
      )
    }

    // If completed, update photographer's total shoots and lead status
    if (status === 'completed') {
      await Promise.all([
        // Update photographer stats
        supabase
          .from('photographers')
          .update({
            total_shoots: supabase.raw('total_shoots + 1'),
            updated_at: new Date().toISOString()
          })
          .eq('id', photographer_id),
        
        // Update lead status
        supabase
          .from('leads')
          .update({
            shoot_completed_at: new Date().toISOString(),
            status: 'photos_completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', assignment.lead_id)
      ])
    }

    return NextResponse.json({
      success: true,
      assignment: updatedAssignment
    })

  } catch (error) {
    console.error('Update assignment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}