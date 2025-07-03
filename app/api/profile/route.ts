import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// GET /api/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    console.log('🔐 Profile GET: Starting request...')
    
    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient()
    
    // Debug: Log all cookies
    const allCookies = cookieStore.getAll()
    console.log('🍪 API Profile - All cookies:', allCookies.map(c => ({ name: c.name, hasValue: !!c.value, length: c.value?.length })))
    
    // Debug: Check for specific Supabase cookies
    const supabaseCookies = allCookies.filter(c => c.name.includes('sb') || c.name.includes('supabase'))
    console.log('🔐 API Profile - Supabase cookies:', supabaseCookies.map(c => ({ name: c.name, length: c.value?.length })))
    
    console.log('🔍 API Profile - About to call supabase.auth.getUser()')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    console.log('🔍 API Profile - Auth result:', {
      hasUser: !!user,
      userEmail: user?.email,
      errorMessage: authError?.message,
      errorCode: authError?.status
    })
    
    if (authError || !user) {
      console.error('❌ Auth error in GET /api/profile:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get user settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Get saved searches count (our new feature)
    const { count: savedSearchesCount } = await supabase
      .from('saved_searches')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get activity count from our new user_activity_log
    const { count: activityCount } = await supabase
      .from('user_activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        email_confirmed_at: user.email_confirmed_at,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      profile: profile || null,
      settings: settings || null,
      stats: {
        savedSearches: savedSearchesCount || 0,
        activityCount: activityCount || 0
      }
    })

  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    console.log('🔐 Profile PUT: Starting request...')
    
    const cookieStore = await cookies()
    const supabase = await createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error in PUT /api/profile:', authError)
      console.error('User:', user)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Authenticated user:', user.id, user.email)

    const body = await request.json()
    const {
      full_name,
      phone,
      date_of_birth,
      gender,
      nationality,
      occupation,
      company,
      bio,
      profile_photo_url,
      address,
      emergency_contact
    } = body

    console.log('Updating profile for user:', user.id, 'with data:', Object.keys(body))

    // Update user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: user.id,
        full_name,
        phone,
        date_of_birth,
        gender,
        nationality,
        occupation,
        company,
        bio,
        profile_photo_url,
        address,
        emergency_contact,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error updating profile:', profileError)
      console.error('Profile error details:', {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint
      })
      return NextResponse.json(
        { error: 'Failed to update profile: ' + profileError.message },
        { status: 500 }
      )
    }

    console.log('Profile updated successfully:', profile?.id)

    // Log activity using our new activity tracking
    try {
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: user.id,
          activity_type: 'profile_update',
          entity_type: 'profile',
          entity_id: user.id,
          activity_data: { updated_fields: Object.keys(body) }
        })
    } catch (activityError) {
      console.error('Error logging activity (non-critical):', activityError)
      // Don't fail the request if activity logging fails
    }

    return NextResponse.json({ profile })

  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 