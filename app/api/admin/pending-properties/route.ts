import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  try {
    // Use service role for database operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    )

    // Get all pending properties with related data
    const { data: pendingProperties, error } = await supabase
      .from('pending_properties')
      .select(`
        *,
        photos:pending_property_photos (*),
        lead:leads!lead_id (*),
        photographer:photographers!photographer_id (*)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching pending properties:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pending properties' },
        { status: 500 }
      )
    }

    console.log('Fetched pending properties:', pendingProperties?.map(p => ({ 
      id: p.id, 
      status: p.status, 
      admin_notes: p.admin_notes 
    })))

    return NextResponse.json({
      success: true,
      pending_properties: pendingProperties || []
    })

  } catch (error) {
    console.error('Error in pending properties GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { pending_property_id, status, admin_feedback, admin_notes } = body

    if (!pending_property_id || !status) {
      return NextResponse.json(
        { error: 'Pending property ID and status are required' },
        { status: 400 }
      )
    }

    // Use service role for database operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    )

    // Update pending property status
    const { error: updateError } = await supabase
      .from('pending_properties')
      .update({
        status,
        admin_feedback,
        admin_notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', pending_property_id)

    if (updateError) {
      console.error('Error updating pending property:', updateError)
      return NextResponse.json(
        { error: 'Failed to update pending property' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Pending property status updated to ${status}`
    })

  } catch (error) {
    console.error('Error in pending properties API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      pending_property_id,
      property_data 
    } = body

    if (!pending_property_id || !property_data) {
      return NextResponse.json(
        { error: 'Pending property ID and property data are required' },
        { status: 400 }
      )
    }

    // Use service role for database operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    )

    // Get pending property with all related data
    const { data: pendingProperty, error: fetchError } = await supabase
      .from('pending_properties')
      .select(`
        *,
        photos:pending_property_photos (*),
        lead:leads!lead_id (*)
      `)
      .eq('id', pending_property_id)
      .single()

    if (fetchError || !pendingProperty) {
      return NextResponse.json(
        { error: 'Pending property not found' },
        { status: 404 }
      )
    }

    // Create the main property
    console.log('Creating property with data:', property_data)
    const { data: newProperty, error: propertyError } = await supabase
      .from('properties')
      .insert({
        ...property_data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id')
      .single()

    if (propertyError || !newProperty) {
      console.error('Error creating property:', propertyError)
      console.error('Property data that failed:', property_data)
      return NextResponse.json(
        { error: 'Failed to create property', details: propertyError?.message },
        { status: 500 }
      )
    }

    // Transfer photos from pending to main property
    if (pendingProperty.photos && pendingProperty.photos.length > 0) {
      const photoInserts = pendingProperty.photos.map((photo: any) => ({
        property_id: newProperty.id,
        url: photo.photo_url,
        is_primary: photo.is_primary,
        order_index: photo.order_index,
        created_at: new Date().toISOString()
      }))

      const { error: photosError } = await supabase
        .from('property_photos')
        .insert(photoInserts)

      if (photosError) {
        console.error('Error transferring photos:', photosError)
        // Don't fail the whole operation, just log the error
      }
    }

    // Update pending property status to approved
    const updateData = {
      status: 'approved',
      admin_notes: `Property created successfully. Property ID: ${newProperty.id}. Created at: ${new Date().toISOString()}`,
      updated_at: new Date().toISOString()
    }
    
    console.log('Updating pending property with data:', updateData)
    
    const { error: pendingUpdateError } = await supabase
      .from('pending_properties')
      .update(updateData)
      .eq('id', pending_property_id)

    if (pendingUpdateError) {
      console.error('Error updating pending property status:', pendingUpdateError)
      // Don't fail the whole operation, just log the error
    } else {
      console.log('Successfully updated pending property status to approved')
    }

    // Update lead status to completed
    if (pendingProperty.lead) {
      await supabase
        .from('leads')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingProperty.lead_id)
    }

    return NextResponse.json({
      success: true,
      property_id: newProperty.id,
      message: 'Property created successfully from pending property'
    })

  } catch (error) {
    console.error('Error creating property from pending:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}