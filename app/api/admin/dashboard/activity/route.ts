import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isServerUserAdmin } from '@/lib/auth/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // Re-enable admin check now that authentication is working
    const isAdmin = await isServerUserAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }
    
    console.log('✅ Admin activity API - authentication confirmed')

    // Use shared server utility
    const supabase = await createServerSupabaseClient()

    console.log('📊 Fetching recent activity...')

    // For now, return mock activity data since we're testing
    const mockActivity = [
      {
        id: '1',
        action: 'Property Created',
        description: 'New property "Luxury New Capital Penthouse" was added',
        timestamp: new Date().toISOString(),
        admin_user: {
          email: 'admin@example.com',
          full_name: 'Admin User'
        }
      },
      {
        id: '2', 
        action: 'Broker Assigned',
        description: 'Broker assigned to property in Downtown Cairo',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        admin_user: {
          email: 'admin@example.com',
          full_name: 'Admin User'
        }
      },
      {
        id: '3',
        action: 'User Role Updated',
        description: 'User role changed from user to broker',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        admin_user: {
          email: 'admin@example.com',
          full_name: 'Admin User'
        }
      }
    ]

    console.log('✅ Activity data compiled:', mockActivity.length, 'items')
    return NextResponse.json(mockActivity)

  } catch (error) {
    console.error('💥 Error fetching dashboard activity:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 