import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { createServerSupabaseClient } from '@/lib/supabase/server'
// GET /api/profile/viewing-history - Get current user's property viewing history
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Get user's property viewing activity with property details
    const { data: viewingHistory, error } = await supabase
      .from('user_activity_log')
      .select(`
        id,
        created_at,
        entity_id,
        activity_data,
        properties:entity_id (
          id,
          title,
          price,
          address,
          city,
          state,
          bedrooms,
          bathrooms,
          square_meters,
          property_type,
          status,
          property_photos (
            url,
            is_primary,
            order_index
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('activity_type', 'property_view')
      .eq('entity_type', 'property')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching viewing history:', error)
      return NextResponse.json(
        { error: 'Failed to fetch viewing history' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('user_activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('activity_type', 'property_view')
      .eq('entity_type', 'property')

    // Transform the data to match expected structure
    const transformedHistory = viewingHistory?.map(item => ({
      id: item.id,
      property_id: item.entity_id,
      viewed_at: item.created_at,
      view_source: item.activity_data?.view_source || 'unknown',
      properties: item.properties
    })) || []

    return NextResponse.json({
      viewingHistory: transformedHistory,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (totalCount || 0) > offset + limit
      }
    })

  } catch (error) {
    console.error('Error fetching viewing history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 