import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { suggestion_type, suggestion_text, original_query } = await request.json()
    const supabase = await createServerSupabaseClient()
    
    // Log suggestion click for analytics
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase
        .from('search_analytics')
        .insert({
          user_id: user.id,
          event_type: 'suggestion_click',
          suggestion_type,
          suggestion_text,
          original_query,
          timestamp: new Date().toISOString()
        })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Search suggestion analytics error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}