import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { createServerSupabaseClient } from '@/lib/supabase/server'
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const { property_id, broker_id, is_primary = false } = await request.json()

    if (!property_id || !broker_id) {
      return NextResponse.json(
        { error: 'Property ID and Broker ID are required' },
        { status: 400 }
      )
    }

    // Use service role key for this operation
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

    // Check if assignment already exists
    const { data: existing } = await supabase
      .from('property_brokers')
      .select('*')
      .eq('property_id', property_id)
      .eq('broker_id', broker_id)
      .eq('is_active', true)
      .single()

    if (existing) {
      return NextResponse.json({
        message: 'Broker already assigned to this property',
        assignment: existing
      })
    }

    // Create the assignment
    const { data: assignment, error } = await supabase
      .from('property_brokers')
      .insert({
        property_id,
        broker_id,
        is_primary,
        assignment_type: 'direct',
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error assigning broker:', error)
      return NextResponse.json(
        { error: 'Failed to assign broker: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Broker assigned successfully',
      assignment
    })

  } catch (error) {
    console.error('Error in assign-broker:', error)
    return NextResponse.json(
      { error: 'Failed to assign broker' },
      { status: 500 }
    )
  }
}

// GET - List current assignments
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const property_id = searchParams.get('property_id')

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
      .from('property_brokers')
      .select(`
        *,
        brokers (
          id,
          full_name,
          email,
          phone,
          license_number,
          specialties,
          rating
        ),
        properties (
          id,
          title,
          address,
          property_photos (
            id,
            url,
            is_primary,
            order_index
          )
        )
      `)
      .eq('is_active', true)

    if (property_id) {
      query = query.eq('property_id', property_id)
    }

    const { data: assignments, error } = await query

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch assignments: ' + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ assignments })

  } catch (error) {
    console.error('Error fetching assignments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch assignments' },
      { status: 500 }
    )
  }
} 