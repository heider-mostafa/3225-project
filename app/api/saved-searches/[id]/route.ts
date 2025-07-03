import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// PUT /api/saved-searches/[id] - Update a saved search
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      name,
      search_criteria,
      search_url,
      alert_frequency,
      is_active
    } = body

    // Update saved search (only if user owns it)
    const { data: savedSearch, error: searchError } = await supabase
      .from('saved_searches')
      .update({
        name,
        search_criteria,
        search_url,
        alert_frequency,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (searchError) {
      console.error('Error updating saved search:', searchError)
      return NextResponse.json(
        { error: 'Failed to update saved search' },
        { status: 500 }
      )
    }

    if (!savedSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    // Log activity
    await supabase
      .from('user_activity_log')
      .insert({
        user_id: user.id,
        activity_type: 'update_search',
        entity_type: 'search',
        entity_id: savedSearch.id,
        activity_data: { search_name: name, updated_fields: Object.keys(body) }
      })

    return NextResponse.json({ savedSearch })

  } catch (error) {
    console.error('Error updating saved search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/saved-searches/[id] - Delete a saved search
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Delete saved search (only if user owns it)
    const { data: deletedSearch, error: deleteError } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (deleteError) {
      console.error('Error deleting saved search:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete saved search' },
        { status: 500 }
      )
    }

    if (!deletedSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    // Log activity
    await supabase
      .from('user_activity_log')
      .insert({
        user_id: user.id,
        activity_type: 'delete_search',
        entity_type: 'search',
        entity_id: deletedSearch.id,
        activity_data: { search_name: deletedSearch.name }
      })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting saved search:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 