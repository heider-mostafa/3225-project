import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { filter_id, filter_name } = await request.json()
    const supabase = await createServerSupabaseClient()
    
    // Log quick filter usage for analytics
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      await supabase
        .from('search_analytics')
        .insert({
          user_id: user.id,
          event_type: 'quick_filter_click',
          filter_id,
          filter_name,
          timestamp: new Date().toISOString()
        })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Quick filter analytics error:', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}