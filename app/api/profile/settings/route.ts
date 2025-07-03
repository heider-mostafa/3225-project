import { NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET /api/profile/settings - Get current user's settings
export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      console.error('Error fetching settings:', settingsError)
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ settings: settings || null })

  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/profile/settings - Update current user's settings
export async function PUT(request: Request) {
  try {
    const cookieStore = cookies()
    const supabase = createServerComponentClient({ cookies: () => cookieStore })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      email_notifications,
      sms_notifications,
      push_notifications,
      theme,
      language,
      currency,
      profile_visibility,
      show_activity,
      allow_contact,
      default_search_radius,
      default_property_types,
      price_range_preference
    } = body

    // Update user settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        email_notifications,
        sms_notifications,
        push_notifications,
        theme,
        language,
        currency,
        profile_visibility,
        show_activity,
        allow_contact,
        default_search_radius,
        default_property_types,
        price_range_preference,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (settingsError) {
      console.error('Error updating settings:', settingsError)
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      )
    }

    // Log activity
    await supabase
      .from('user_activity_log')
      .insert({
        user_id: user.id,
        activity_type: 'settings_update',
        entity_type: 'settings',
        entity_id: user.id,
        activity_data: { updated_fields: Object.keys(body) }
      })

    return NextResponse.json({ settings })

  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 