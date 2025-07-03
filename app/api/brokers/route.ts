import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { createServerSupabaseClient } from '@/lib/supabase/server'
// GET - List all brokers
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('include_inactive') === 'true'

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    )

    let query = supabase
      .from('brokers')
      .select('*')

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: brokers, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching brokers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch brokers: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ brokers })

  } catch (error) {
    console.error('Error in GET /api/brokers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch brokers' },
      { status: 500 }
    )
  }
}

// POST - Create a new broker
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const body = await request.json()
    
    const {
      user_id,
      full_name,
      email,
      phone,
      license_number,
      bio,
      specialties = [],
      languages = ['English'],
      years_experience = 0,
      commission_rate,
      profile_image_url
    } = body

    if (!user_id || !full_name || !email) {
      return NextResponse.json(
        { error: 'User ID, full name, and email are required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check if broker already exists for this user
    const { data: existingBroker } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user_id)
      .single()

    if (existingBroker) {
      return NextResponse.json(
        { error: 'Broker profile already exists for this user' },
        { status: 400 }
      )
    }

    // Create the broker
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .insert({
        user_id,
        full_name,
        email,
        phone,
        license_number,
        bio,
        specialties,
        languages,
        years_experience,
        commission_rate,
        profile_image_url,
        is_active: true,
        rating: 5.0,
        total_reviews: 0
      })
      .select()
      .single()

    if (brokerError) {
      console.error('Error creating broker:', brokerError)
      return NextResponse.json(
        { error: 'Failed to create broker: ' + brokerError.message },
        { status: 500 }
      )
    }

    // Assign broker role to the user
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id,
        role: 'broker'
      })

    if (roleError) {
      console.error('Error assigning broker role:', roleError)
      // Don't fail the broker creation if role assignment fails
      // but log it for debugging
    }

    return NextResponse.json({
      success: true,
      message: 'Broker created successfully',
      broker
    })

  } catch (error) {
    console.error('Error in POST /api/brokers:', error)
    return NextResponse.json(
      { error: 'Failed to create broker' },
      { status: 500 }
    )
  }
}

// PUT - Update a broker
export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies()
    const body = await request.json()
    
    const {
      id,
      full_name,
      email,
      phone,
      license_number,
      bio,
      specialties,
      languages,
      years_experience,
      commission_rate,
      profile_image_url,
      is_active
    } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Broker ID is required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const updateData: any = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (license_number !== undefined) updateData.license_number = license_number
    if (bio !== undefined) updateData.bio = bio
    if (specialties !== undefined) updateData.specialties = specialties
    if (languages !== undefined) updateData.languages = languages
    if (years_experience !== undefined) updateData.years_experience = years_experience
    if (commission_rate !== undefined) updateData.commission_rate = commission_rate
    if (profile_image_url !== undefined) updateData.profile_image_url = profile_image_url
    if (is_active !== undefined) updateData.is_active = is_active

    const { data: broker, error } = await supabase
      .from('brokers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating broker:', error)
      return NextResponse.json(
        { error: 'Failed to update broker: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Broker updated successfully',
      broker
    })

  } catch (error) {
    console.error('Error in PUT /api/brokers:', error)
    return NextResponse.json(
      { error: 'Failed to update broker' },
      { status: 500 }
    )
  }
} 