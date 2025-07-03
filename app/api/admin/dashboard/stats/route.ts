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
    
    console.log('✅ Admin stats API - authentication confirmed')

    // Use shared server utility
    const supabase = await createServerSupabaseClient()

    // Get basic counts with better error handling
    console.log('📊 Fetching dashboard statistics...')
    
    const [
      propertiesResult,
      usersResult,
      userRolesResult,
      brokersResult
    ] = await Promise.all([
      // Total properties
      supabase
        .from('properties')
        .select('id', { count: 'exact', head: true }),
      
      // Try to get users from RPC function
      supabase.rpc('get_users_simple'),
      
      // Total user roles
      supabase
        .from('user_roles')
        .select('id', { count: 'exact', head: true }),
      
      // Total brokers
      supabase
        .from('brokers')
        .select('id', { count: 'exact', head: true })
    ])

    console.log('📋 Properties result:', propertiesResult.count, propertiesResult.error)
    console.log('📋 Users result:', usersResult.data?.length, usersResult.error)
    console.log('📋 User roles result:', userRolesResult.count, userRolesResult.error)
    console.log('📋 Brokers result:', brokersResult.count, brokersResult.error)

    // Handle errors gracefully
    if (propertiesResult.error) {
      console.error('Error fetching properties count:', propertiesResult.error)
    }
    if (usersResult.error) {
      console.error('Error fetching users:', usersResult.error)
    }
    if (userRolesResult.error) {
      console.error('Error fetching user roles count:', userRolesResult.error)
    }
    if (brokersResult.error) {
      console.error('Error fetching brokers count:', brokersResult.error)
    }

    // Compile stats with fallbacks
    const stats = {
      totalProperties: propertiesResult.count || 0,
      totalUsers: usersResult.data?.length || 0,
      totalUserRoles: userRolesResult.count || 0,
      totalBrokers: brokersResult.count || 0,
      totalInquiries: 0, // Placeholder since inquiries table might not exist
      totalViews: 0, // Placeholder
      pendingInquiries: 0,
      activeHeygenSessions: 0,
      recentPropertyViews: 0,
      tourSessions: 0
    }

    console.log('✅ Dashboard stats compiled:', stats)
    return NextResponse.json(stats)

  } catch (error) {
    console.error('💥 Error fetching dashboard stats:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 