import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { createServerSupabaseClient } from '@/lib/supabase/server'
// GET - Get a specific broker by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
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
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Broker not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching broker:', error)
      return NextResponse.json(
        { error: 'Failed to fetch broker: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ broker })

  } catch (error) {
    console.error('Error in GET /api/brokers/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to fetch broker' },
      { status: 500 }
    )
  }
}

// PUT - Update a specific broker
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()
    const body = await request.json()
    
    const {
      full_name,
      email,
      phone,
      license_number,
      appraiser_license_number,
      appraiser_certification_authority,
      bio,
      specialties,
      languages,
      years_experience,
      commission_rate,
      property_specialties,
      max_property_value_limit,
      professional_headshot_url,
      profile_headline,
      profile_summary,
      service_areas,
      profile_image_url,
      is_active,
      average_rating,
      total_reviews,
      response_time_hours,
      certifications,
      pricing_info
    } = body

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
    if (appraiser_license_number !== undefined) updateData.appraiser_license_number = appraiser_license_number
    if (appraiser_certification_authority !== undefined) updateData.appraiser_certification_authority = appraiser_certification_authority
    if (bio !== undefined) updateData.bio = bio
    if (specialties !== undefined) updateData.specialties = specialties
    if (languages !== undefined) updateData.languages = languages
    if (years_experience !== undefined) updateData.years_experience = years_experience
    if (commission_rate !== undefined) updateData.commission_rate = commission_rate
    if (property_specialties !== undefined) updateData.property_specialties = property_specialties
    if (max_property_value_limit !== undefined) updateData.max_property_value_limit = max_property_value_limit
    if (professional_headshot_url !== undefined) updateData.professional_headshot_url = professional_headshot_url
    if (profile_headline !== undefined) updateData.profile_headline = profile_headline
    if (profile_summary !== undefined) updateData.profile_summary = profile_summary
    if (service_areas !== undefined) updateData.service_areas = service_areas
    if (profile_image_url !== undefined) updateData.profile_image_url = profile_image_url
    if (is_active !== undefined) updateData.is_active = is_active
    if (average_rating !== undefined) updateData.average_rating = average_rating
    if (total_reviews !== undefined) updateData.total_reviews = total_reviews
    if (response_time_hours !== undefined) updateData.response_time_hours = response_time_hours
    if (certifications !== undefined) updateData.certifications = certifications
    if (pricing_info !== undefined) updateData.pricing_info = pricing_info

    const { data: broker, error } = await supabase
      .from('brokers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Broker not found' },
          { status: 404 }
        )
      }
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
    console.error('Error in PUT /api/brokers/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to update broker' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a specific broker (soft delete by setting is_active = false)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const cookieStore = await cookies()

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

    // Soft delete by setting is_active = false
    const { data: broker, error } = await supabase
      .from('brokers')
      .update({ is_active: false })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Broker not found' },
          { status: 404 }
        )
      }
      console.error('Error deleting broker:', error)
      return NextResponse.json(
        { error: 'Failed to delete broker: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Broker deleted successfully',
      broker
    })

  } catch (error) {
    console.error('Error in DELETE /api/brokers/[id]:', error)
    return NextResponse.json(
      { error: 'Failed to delete broker' },
      { status: 500 }
    )
  }
} 