import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing photographers API without auth...')
    
    // Use service role to bypass RLS for testing
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Test basic table access
    const { data: photographers, error } = await supabase
      .from('photographers')
      .select('*')
      .limit(5)

    if (error) {
      console.error('❌ Database error:', error)
      return NextResponse.json(
        { 
          error: 'Database error', 
          details: error.message,
          code: error.code
        },
        { status: 500 }
      )
    }

    console.log('✅ Found photographers:', photographers?.length || 0)

    return NextResponse.json({
      success: true,
      photographers: photographers || [],
      count: photographers?.length || 0
    })

  } catch (error) {
    console.error('❌ Exception in test API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: (error as Error).message },
      { status: 500 }
    )
  }
}