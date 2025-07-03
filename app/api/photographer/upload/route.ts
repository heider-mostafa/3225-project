import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      assignment_id,
      photographer_id,
      photos,
      photographer_notes,
      recommended_shots,
      property_condition,
      best_features,
      shooting_challenges
    } = body

    if (!assignment_id || !photographer_id || !photos || photos.length === 0) {
      return NextResponse.json(
        { error: 'Assignment ID, photographer ID, and photos are required' },
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

    // Verify the assignment belongs to this photographer
    const { data: assignment, error: assignmentError } = await supabase
      .from('photographer_assignments')
      .select(`
        *,
        lead:leads!lead_id (
          id,
          name,
          location,
          property_type,
          whatsapp_number,
          price_range,
          timeline
        )
      `)
      .eq('id', assignment_id)
      .eq('photographer_id', photographer_id)
      .single()

    if (assignmentError || !assignment) {
      return NextResponse.json(
        { error: 'Assignment not found or unauthorized' },
        { status: 404 }
      )
    }

    // Check if pending property already exists for this assignment
    const { data: existingProperty, error: existingError } = await supabase
      .from('pending_properties')
      .select('id')
      .eq('assignment_id', assignment_id)
      .maybeSingle()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing pending property:', existingError)
      return NextResponse.json(
        { error: 'Failed to check existing pending property' },
        { status: 500 }
      )
    }

    let pendingPropertyId: string

    if (existingProperty) {
      // Update existing pending property
      pendingPropertyId = existingProperty.id
      
      const { error: updateError } = await supabase
        .from('pending_properties')
        .update({
          photographer_notes,
          recommended_shots,
          property_condition,
          best_features,
          shooting_challenges,
          updated_at: new Date().toISOString()
        })
        .eq('id', pendingPropertyId)

      if (updateError) {
        console.error('Error updating pending property:', updateError)
        return NextResponse.json(
          { error: 'Failed to update pending property' },
          { status: 500 }
        )
      }
    } else {
      // Create new pending property with auto-populated data from assignment
      const { data: newPendingProperty, error: createError } = await supabase
        .from('pending_properties')
        .insert({
          assignment_id,
          photographer_id,
          lead_id: assignment.lead.id,
          status: 'photos_uploaded',
          photographer_notes,
          recommended_shots,
          property_condition,
          best_features,
          shooting_challenges
        })
        .select('id')
        .single()

      if (createError || !newPendingProperty) {
        console.error('Error creating pending property:', createError)
        return NextResponse.json(
          { error: 'Failed to create pending property' },
          { status: 500 }
        )
      }

      pendingPropertyId = newPendingProperty.id
    }

    // Delete existing photos for this pending property if updating
    if (existingProperty) {
      await supabase
        .from('pending_property_photos')
        .delete()
        .eq('pending_property_id', pendingPropertyId)
    }

    // Insert new photos
    const photoInserts = photos.map((photo: any, index: number) => ({
      pending_property_id: pendingPropertyId,
      photo_url: photo.url,
      is_primary: index === 0, // First photo is primary
      order_index: index,
      photographer_caption: photo.caption || null
    }))

    const { error: photosError } = await supabase
      .from('pending_property_photos')
      .insert(photoInserts)

    if (photosError) {
      console.error('Error inserting photos:', photosError)
      return NextResponse.json(
        { error: 'Failed to save photos' },
        { status: 500 }
      )
    }

    // Update assignment with photo count and mark as completed if not already
    const { error: assignmentUpdateError } = await supabase
      .from('photographer_assignments')
      .update({
        photos_count: photos.length,
        status: assignment.status === 'completed' ? 'completed' : 'photos_uploaded',
        actual_duration_minutes: assignment.actual_duration_minutes || 120,
        completion_notes: `Photos uploaded: ${photos.length} images. ${photographer_notes || ''}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', assignment_id)

    if (assignmentUpdateError) {
      console.error('Error updating assignment:', assignmentUpdateError)
    }

    // Update lead status to indicate photos are ready for admin review
    await supabase
      .from('leads')
      .update({
        status: 'photos_completed',
        shoot_completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', assignment.lead.id)

    // Update photographer's total shoots if assignment wasn't already completed
    if (assignment.status !== 'completed') {
      const { error: photographerUpdateError } = await supabase
        .from('photographers')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', photographer_id)

      if (photographerUpdateError) {
        console.error('Error updating photographer:', photographerUpdateError)
      }
    }

    // Send notification to admin about pending property
    try {
      await fetch(`${request.nextUrl.origin}/api/admin/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'pending_property_created',
          message: `New pending property created from ${assignment.lead.name}'s ${assignment.lead.property_type} in ${assignment.lead.location}`,
          data: {
            pending_property_id: pendingPropertyId,
            assignment_id,
            lead_id: assignment.lead.id,
            photographer_id,
            photos_count: photos.length
          }
        })
      })
    } catch (notificationError) {
      console.error('Admin notification failed:', notificationError)
    }

    return NextResponse.json({
      success: true,
      pending_property_id: pendingPropertyId,
      photos_uploaded: photos.length,
      message: 'Photos uploaded successfully and pending property created for admin review'
    })

  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}