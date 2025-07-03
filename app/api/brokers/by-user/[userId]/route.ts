import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { createServerSupabaseClient } from '@/lib/supabase/server'
// GET - Get broker by user ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    )

    const { data: broker, error } = await supabase
      .from('brokers')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Broker not found for this user' },
          { status: 404 }
        )
      }
      console.error('Error fetching broker by user ID:', error)
      return NextResponse.json(
        { error: 'Failed to fetch broker: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ broker })

  } catch (error) {
    console.error('Error in GET /api/brokers/by-user/[userId]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch broker' },
      { status: 500 }
    )
  }
} 