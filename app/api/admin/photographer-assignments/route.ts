import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
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
    const photographerId = searchParams.get('photographer_id')
    const leadId = searchParams.get('lead_id')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const limit = parseInt(searchParams.get('limit') || '50')

    // Use service role for database operations since admin is authenticated
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    )

    // Build assignment query
    let query = supabase
      .from('photographer_assignments')
      .select(`
        *,
        photographer:photographer_id (
          id,
          name,
          email,
          phone,
          rating
        ),
        lead:lead_id (
          id,
          lead_id,
          name,
          whatsapp_number,
          location,
          property_type,
          status
        )
      `)
      .order('scheduled_time', { ascending: false })
      .limit(limit)

    if (photographerId) {
      query = query.eq('photographer_id', photographerId)
    }

    if (leadId) {
      query = query.eq('lead_id', leadId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (dateFrom) {
      query = query.gte('scheduled_time', dateFrom)
    }

    if (dateTo) {
      query = query.lte('scheduled_time', dateTo)
    }

    const { data: assignments, error } = await query

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch assignments: ' + error.message },
        { status: 500 }
      )
    }

    // Get assignment statistics
    const { data: allAssignments } = await supabase
      .from('photographer_assignments')
      .select('status, scheduled_time, actual_duration_minutes')

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const assignmentStats = allAssignments || []

    const stats = {
      total_assignments: assignmentStats.length,
      today_assignments: assignmentStats.filter(a => {
        const assignmentDate = new Date(a.scheduled_time)
        return assignmentDate >= today && assignmentDate < tomorrow
      }).length,
      pending: assignmentStats.filter(a => a.status === 'assigned' || a.status === 'confirmed').length,
      completed: assignmentStats.filter(a => a.status === 'completed').length,
      cancelled: assignmentStats.filter(a => a.status === 'cancelled').length,
      avg_duration: assignmentStats.filter(a => a.actual_duration_minutes).length > 0 ?
        Math.round(
          assignmentStats
            .filter(a => a.actual_duration_minutes)
            .reduce((sum, a) => sum + (a.actual_duration_minutes || 0), 0) /
          assignmentStats.filter(a => a.actual_duration_minutes).length
        ) : 0
    }

    return NextResponse.json({
      success: true,
      assignments,
      stats
    })

  } catch (error) {
    console.error('Photographer assignments API error:', error)
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
      property_id,
      property_data,
      photographer_id,
      scheduled_time,
      duration_minutes = 120,
      preparation_notes,
      auto_assign = false
    } = body

    // Use service role for database operations since admin is authenticated
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    )

    // Validate that either lead_id or property_id is provided (not both)
    if (lead_id && property_id) {
      return NextResponse.json(
        { error: 'Cannot provide both lead_id and property_id' },
        { status: 400 }
      )
    }

    if (!lead_id && !property_id) {
      return NextResponse.json(
        { error: 'Either lead_id or property_id must be provided' },
        { status: 400 }
      )
    }

    // If auto_assign is true, find best photographer
    let assignedPhotographerId = photographer_id

    if (auto_assign && !photographer_id) {
      let location = ''
      
      if (lead_id) {
        // Get lead location for matching
        const { data: lead } = await supabase
          .from('leads')
          .select('location, property_type')
          .eq('id', lead_id)
          .single()

        if (lead) {
          location = lead.location
        }
      } else if (property_id && property_data) {
        // Use property data for location matching
        location = `${property_data.address}, ${property_data.city}`
      }

      if (location) {
        assignedPhotographerId = await findBestPhotographer(supabase, location, scheduled_time)
      }
    }

    if (!assignedPhotographerId) {
      return NextResponse.json(
        { error: 'No photographer specified or available for auto-assignment' },
        { status: 400 }
      )
    }

    // Check for photographer availability conflicts
    const conflictCheck = await checkPhotographerAvailability(
      supabase, 
      assignedPhotographerId, 
      scheduled_time, 
      duration_minutes
    )

    if (!conflictCheck.available) {
      return NextResponse.json({
        error: 'Photographer has a scheduling conflict',
        conflict_details: conflictCheck.conflicts
      }, { status: 409 })
    }

    // Create the assignment (following constraint: either lead_id OR property_id, not both)
    const assignmentData = {
      photographer_id: assignedPhotographerId,
      assignment_date: new Date().toISOString(),
      scheduled_time,
      duration_minutes,
      preparation_notes: preparation_notes || '',
      status: 'assigned'
    }

    if (lead_id) {
      assignmentData.lead_id = lead_id
      assignmentData.property_id = null
    } else if (property_id) {
      assignmentData.lead_id = null
      assignmentData.property_id = property_id
    }

    const { data: assignment, error } = await supabase
      .from('photographer_assignments')
      .insert(assignmentData)
      .select(`
        *,
        photographer:photographer_id (
          id,
          name,
          email,
          phone,
          rating
        ),
        lead:lead_id (
          id,
          lead_id,
          name,
          whatsapp_number,
          location,
          property_type,
          status
        )
      `)
      .single()

    if (error) {
      console.error('Error creating assignment:', error)
      return NextResponse.json(
        { error: 'Failed to create assignment: ' + error.message },
        { status: 500 }
      )
    }

    // Update lead status and photographer_id (only if this is a lead-based assignment)
    if (lead_id) {
      await supabase
        .from('leads')
        .update({
          photographer_id: assignedPhotographerId,
          shoot_scheduled_at: scheduled_time,
          status: 'photographer_assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', lead_id)
    }

    // Update property status if this is a regular property assignment
    if (property_id) {
      await supabase
        .from('properties')
        .update({
          status: 'awaiting_photos',
          updated_at: new Date().toISOString(),
          internal_notes: `Photographer assigned: ${new Date(scheduled_time).toLocaleDateString()}`
        })
        .eq('id', property_id)
    }

    // Send WhatsApp notification to lead (only for real leads with assignments)
    try {
      if (lead_id && assignment.lead && assignment.lead.whatsapp_number && assignment.lead.whatsapp_number !== '+20100000000') {
        await fetch(`${request.nextUrl.origin}/api/whatsapp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: assignment.lead.whatsapp_number,
            message_type: 'photographer_scheduled',
            variables: {
              name: assignment.lead.name,
              photographer_name: assignment.photographer.name,
              scheduled_date: new Date(scheduled_time).toLocaleDateString('en-US', {
                timeZone: 'Africa/Cairo',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              scheduled_time: new Date(scheduled_time).toLocaleTimeString('en-US', {
                timeZone: 'Africa/Cairo',
                hour: '2-digit',
                minute: '2-digit'
              })
            }
          })
        })
      }
    } catch (whatsappError) {
      console.error('WhatsApp notification failed:', whatsappError)
    }

    return NextResponse.json({
      success: true,
      assignment,
      message: 'Photographer assigned and lead notified'
    })

  } catch (error) {
    console.error('Create assignment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
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
      assignment_id,
      status,
      completion_notes,
      actual_duration_minutes,
      photos_count,
      client_rating,
      photographer_rating
    } = body

    if (!assignment_id) {
      return NextResponse.json(
        { error: 'Assignment ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Get current assignment
    const { data: currentAssignment } = await supabase
      .from('photographer_assignments')
      .select('*, lead:lead_id (id, lead_id)')
      .eq('id', assignment_id)
      .single()

    if (!currentAssignment) {
      return NextResponse.json(
        { error: 'Assignment not found' },
        { status: 404 }
      )
    }

    // Update assignment
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (completion_notes) updateData.completion_notes = completion_notes
    if (actual_duration_minutes) updateData.actual_duration_minutes = actual_duration_minutes
    if (photos_count) updateData.photos_count = photos_count
    if (client_rating) updateData.client_rating = client_rating
    if (photographer_rating) updateData.photographer_rating = photographer_rating

    const { data: updatedAssignment, error } = await supabase
      .from('photographer_assignments')
      .update(updateData)
      .eq('id', assignment_id)
      .select(`
        *,
        photographer:photographer_id (name, email),
        lead:lead_id (id, lead_id, name, whatsapp_number)
      `)
      .single()

    if (error) {
      console.error('Error updating assignment:', error)
      return NextResponse.json(
        { error: 'Failed to update assignment' },
        { status: 500 }
      )
    }

    // Update lead status based on assignment status
    if (status === 'completed') {
      await supabase
        .from('leads')
        .update({
          shoot_completed_at: new Date().toISOString(),
          shoot_duration_minutes: actual_duration_minutes || null,
          status: 'photos_completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', currentAssignment.lead.id)
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

// Helper function to find best photographer for a location and time
async function findBestPhotographer(supabase: any, location: string, scheduledTime: string): Promise<string | null> {
  const { data: photographers } = await supabase
    .from('photographers')
    .select('*')
    .eq('is_active', true)
    .contains('preferred_areas', [location])
    .order('rating', { ascending: false })

  if (!photographers || photographers.length === 0) {
    // Fallback to any active photographer if no location match
    const { data: allPhotographers } = await supabase
      .from('photographers')
      .select('*')
      .eq('is_active', true)
      .order('rating', { ascending: false })

    if (!allPhotographers || allPhotographers.length === 0) return null
    photographers.push(...allPhotographers)
  }

  // Check availability for each photographer
  for (const photographer of photographers) {
    const availability = await checkPhotographerAvailability(
      supabase,
      photographer.id,
      scheduledTime,
      120 // default 2 hour duration
    )

    if (availability.available) {
      return photographer.id
    }
  }

  return null
}

// Helper function to check photographer availability
async function checkPhotographerAvailability(
  supabase: any, 
  photographerId: string, 
  scheduledTime: string, 
  durationMinutes: number
): Promise<{ available: boolean; conflicts: any[] }> {
  const startTime = new Date(scheduledTime)
  const endTime = new Date(startTime.getTime() + durationMinutes * 60000)

  // Check for overlapping assignments
  const { data: conflicts } = await supabase
    .from('photographer_assignments')
    .select('*')
    .eq('photographer_id', photographerId)
    .in('status', ['assigned', 'confirmed', 'in_progress'])
    .or(`and(scheduled_time.lte.${endTime.toISOString()},scheduled_time.gte.${startTime.toISOString()})`)

  return {
    available: !conflicts || conflicts.length === 0,
    conflicts: conflicts || []
  }
}