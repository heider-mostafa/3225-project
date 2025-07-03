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
    const area = searchParams.get('area')
    const status = searchParams.get('status')
    const availability = searchParams.get('availability') === 'true'

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

    // Build query for photographers
    let query = supabase
      .from('photographers')
      .select(`
        *,
        assignments:photographer_assignments!photographer_id (
          id,
          lead_id,
          scheduled_time,
          duration_minutes,
          status,
          leads:lead_id (
            name,
            location,
            property_type
          )
        )
      `)

    if (area) {
      query = query.contains('preferred_areas', [area])
    }

    if (status) {
      query = query.eq('is_active', status === 'active')
    }

    query = query.order('rating', { ascending: false })

    const { data: photographers, error } = await query

    if (error) {
      console.error('Error fetching photographers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch photographers' },
        { status: 500 }
      )
    }

    // Process photographer data with availability if requested
    const processedPhotographers = photographers?.map(photographer => {
      const activeAssignments = photographer.assignments?.filter(
        (a: any) => a.status === 'assigned' || a.status === 'confirmed'
      ) || []

      return {
        ...photographer,
        active_assignments: activeAssignments.length,
        next_assignment: activeAssignments
          .sort((a: any, b: any) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime())[0],
        is_available_today: availability ? checkTodayAvailability(photographer, activeAssignments) : undefined
      }
    })

    // Get photographer statistics
    const { data: assignmentStats } = await supabase
      .from('photographer_assignments')
      .select('photographer_id, status, scheduled_time')

    const stats = {
      total_photographers: photographers?.length || 0,
      active_photographers: photographers?.filter(p => p.is_active).length || 0,
      total_assignments: assignmentStats?.length || 0,
      completed_assignments: assignmentStats?.filter(a => a.status === 'completed').length || 0,
      pending_assignments: assignmentStats?.filter(a => a.status === 'assigned' || a.status === 'confirmed').length || 0
    }

    return NextResponse.json({
      success: true,
      photographers: processedPhotographers,
      stats
    })

  } catch (error) {
    console.error('Photographers API error:', error)
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
      email, 
      name, 
      phone, 
      preferred_areas, 
      equipment, 
      skills, 
      languages,
      pricing 
    } = body

    if (!email || !name || !phone) {
      return NextResponse.json(
        { error: 'Email, name, and phone are required' },
        { status: 400 }
      )
    }

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

    // Create new photographer
    const { data: photographer, error } = await supabase
      .from('photographers')
      .insert({
        email,
        name,
        phone,
        preferred_areas: preferred_areas || [],
        equipment: equipment || '',
        skills: skills || [],
        languages: languages || ['Arabic', 'English'],
        pricing: pricing || {},
        is_active: true,
        rating: 5.0,
        total_shoots: 0
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating photographer:', error)
      return NextResponse.json(
        { error: 'Failed to create photographer: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      photographer
    })

  } catch (error) {
    console.error('Create photographer error:', error)
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
    const { photographer_id, is_active, ...updateData } = body

    if (!photographer_id) {
      return NextResponse.json(
        { error: 'Photographer ID is required' },
        { status: 400 }
      )
    }

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

    // Update photographer
    const { data: photographer, error } = await supabase
      .from('photographers')
      .update({
        is_active: is_active !== undefined ? is_active : undefined,
        ...updateData
      })
      .eq('id', photographer_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating photographer:', error)
      return NextResponse.json(
        { error: 'Failed to update photographer: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      photographer
    })

  } catch (error) {
    console.error('Update photographer error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to check today's availability
function checkTodayAvailability(photographer: any, assignments: any[]): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Check if photographer has assignments today
  const todayAssignments = assignments.filter((a: any) => {
    const assignmentDate = new Date(a.scheduled_time)
    return assignmentDate >= today && assignmentDate < tomorrow
  })

  // Simple availability check - if less than 2 assignments today, consider available
  return todayAssignments.length < 2
}