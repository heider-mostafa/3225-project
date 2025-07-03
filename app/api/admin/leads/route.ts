import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isServerUserAdmin } from '@/lib/auth/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check admin authorization
    const isAdmin = await isServerUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const location = searchParams.get('location')
    const searchTerm = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Calculate pagination
    const offset = (page - 1) * limit

    // Build the query
    let query = supabase
      .from('leads')
      .select(`
        id,
        lead_id,
        name,
        email,
        whatsapp_number,
        location,
        price_range,
        property_type,
        timeline,
        initial_score,
        final_score,
        status,
        recommendation,
        call_completed_at,
        call_duration_seconds,
        photographer_id,
        shoot_scheduled_at,
        shoot_completed_at,
        virtual_tour_url,
        tour_processing_status,
        tour_views,
        unique_visitors,
        broker_inquiries,
        viewing_requests,
        followup_count,
        source,
        utm_source,
        utm_medium,
        utm_campaign,
        created_at,
        updated_at
      `)

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (location && location !== 'all') {
      query = query.eq('location', location)
    }

    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,whatsapp_number.ilike.%${searchTerm}%`)
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: leads, error, count } = await query

    if (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    // Get additional statistics
    const { data: statsData } = await supabase
      .from('leads')
      .select('status, initial_score, final_score, created_at')

    const stats = {
      total: count || 0,
      new_leads: statsData?.filter(l => l.status === 'new_lead').length || 0,
      qualified: statsData?.filter(l => l.status === 'qualified').length || 0,
      called: statsData?.filter(l => l.status === 'called').length || 0,
      booked: statsData?.filter(l => l.status === 'booked').length || 0,
      completed: statsData?.filter(l => l.status === 'completed').length || 0,
      avg_initial_score: statsData && statsData.length > 0 
        ? statsData.reduce((sum, l) => sum + (l.initial_score || 0), 0) / statsData.length 
        : 0,
      avg_final_score: statsData && statsData.length > 0 
        ? (() => {
            const withFinalScore = statsData.filter(l => l.final_score)
            return withFinalScore.length > 0 
              ? withFinalScore.reduce((sum, l) => sum + (l.final_score || 0), 0) / withFinalScore.length
              : 0
          })()
        : 0,
      today_leads: statsData?.filter(l => {
        const today = new Date().toDateString()
        return new Date(l.created_at).toDateString() === today
      }).length || 0
    }

    // Get unique locations for filter dropdown
    const { data: locationsData } = await supabase
      .from('leads')
      .select('location')
      .not('location', 'is', null)

    const uniqueLocations = [...new Set(locationsData?.map(l => l.location) || [])]

    return NextResponse.json({
      success: true,
      leads,
      stats,
      locations: uniqueLocations,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })

  } catch (error) {
    console.error('Admin leads API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Check admin authorization
    const isAdmin = await isServerUserAdmin()
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { lead_id, updates } = body

    if (!lead_id || !updates) {
      return NextResponse.json(
        { error: 'Lead ID and updates are required' },
        { status: 400 }
      )
    }

    // Update the lead
    const { data: updatedLead, error } = await supabase
      .from('leads')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', lead_id)
      .select()
      .single()

    if (error) {
      console.error('Error updating lead:', error)
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      lead: updatedLead
    })

  } catch (error) {
    console.error('Admin lead update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 