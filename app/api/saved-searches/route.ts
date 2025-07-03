import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { createServerSupabaseClient } from '@/lib/supabase/server'
// GET /api/saved-searches - Get current user's saved searches
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's saved searches
    const { data: savedSearches, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching saved searches:', error)
      return NextResponse.json(
        { error: 'Failed to fetch saved searches' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      savedSearches: savedSearches || []
    })

  } catch (error) {
    console.error('Error fetching saved searches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/saved-searches - Create a new saved search
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      search_criteria,
      search_url,
      alert_frequency = 'daily'
    } = body

    if (!name || !search_criteria) {
      return NextResponse.json(
        { error: 'Name and search criteria are required' },
        { status: 400 }
      )
    }

    // Create saved search
    const { data: savedSearch, error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: user.id,
        name,
        search_criteria,
        search_url,
        alert_frequency,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating saved search:', error)
      return NextResponse.json(
        { error: 'Failed to create saved search' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('user_activity_log')
      .insert({
        user_id: user.id,
        activity_type: 'create_saved_search',
        entity_type: 'saved_search',
        entity_id: savedSearch.id,
        activity_data: { search_name: name }
      })

    return NextResponse.json({ savedSearch })

  } catch (error) {
    console.error('Error creating saved search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 