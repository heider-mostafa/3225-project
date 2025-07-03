import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

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
    const { data: assignments, error: assignmentsError } = await supabase
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

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
      return NextResponse.json(
        { error: 'Failed to fetch assignments' },
        { status: 500 }
      )
    }

    // Calculate performance metrics
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const allAssignments = assignments || []
    const thisMonthAssignments = allAssignments.filter(a => 
      new Date(a.created_at) >= currentMonth
    )
    const todaysAssignments = allAssignments.filter(a => {
      const assignmentDate = new Date(a.scheduled_time)
      return assignmentDate >= today && assignmentDate < tomorrow
    })

    const metrics = {
      shoots_completed_this_month: thisMonthAssignments.filter(a => a.status === 'completed').length,
      shoots_assigned_this_month: thisMonthAssignments.length,
      photos_uploaded_this_month: thisMonthAssignments
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (a.photos_count || 0), 0),
      average_rating: 0, // Will be calculated from photographer profile
      properties_created: thisMonthAssignments.filter(a => a.status === 'completed').length,
      current_streak: await calculatePhotographerStreak(supabase, photographerId),
      shoots_today_completed: todaysAssignments.filter(a => a.status === 'completed').length,
      shoots_today_upcoming: todaysAssignments.filter(a => 
        a.status === 'assigned' || a.status === 'confirmed'
      ).length
    }

    // Get photographer profile for rating
    const { data: photographer } = await supabase
      .from('photographers')
      .select('rating')
      .eq('id', photographerId)
      .single()

    if (photographer) {
      metrics.average_rating = photographer.rating || 0
    }

    return NextResponse.json({
      success: true,
      assignments: allAssignments,
      metrics
    })

  } catch (error) {
    console.error('Photographer dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate photographer streak
async function calculatePhotographerStreak(supabase: any, photographerId: string): Promise<number> {
  try {
    // Get completed assignments ordered by date
    const { data: completedAssignments } = await supabase
      .from('photographer_assignments')
      .select('scheduled_time')
      .eq('photographer_id', photographerId)
      .eq('status', 'completed')
      .order('scheduled_time', { ascending: false })

    if (!completedAssignments || completedAssignments.length === 0) {
      return 0
    }

    // Calculate consecutive days with completed assignments
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Group assignments by date
    const assignmentsByDate = new Map()
    completedAssignments.forEach(assignment => {
      const date = new Date(assignment.scheduled_time)
      date.setHours(0, 0, 0, 0)
      const dateKey = date.toISOString()
      assignmentsByDate.set(dateKey, true)
    })

    // Count consecutive days working backwards from today
    let currentDate = new Date(today)
    while (true) {
      const dateKey = currentDate.toISOString()
      if (assignmentsByDate.has(dateKey)) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  } catch (error) {
    console.error('Error calculating streak:', error)
    return 0
  }
}