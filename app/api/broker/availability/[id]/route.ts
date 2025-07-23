import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { createServerSupabaseClient } from '@/lib/supabase/server'
// PUT /api/broker/availability/[id] - Update specific availability slot
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const body = await request.json()
    const availabilityId = params.id
    
    const {
      date,
      start_time,
      end_time,
      max_bookings,
      slot_duration_minutes,
      break_between_slots,
      booking_type,
      notes,
      is_available
    } = body

    // Validate availability ID
    if (!availabilityId) {
      return NextResponse.json({
        error: 'Availability ID is required'
      }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get broker ID for current user
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (brokerError || !broker) {
      return NextResponse.json({ 
        error: 'Broker profile not found' 
      }, { status: 404 })
    }

    // Verify ownership of availability slot
    const { data: existingAvailability, error: ownershipError } = await supabase
      .from('broker_availability')
      .select('id, broker_id, current_bookings, date, start_time, end_time')
      .eq('id', availabilityId)
      .eq('broker_id', broker.id)
      .single()

    if (ownershipError || !existingAvailability) {
      return NextResponse.json({
        error: 'Availability slot not found or access denied'
      }, { status: 404 })
    }

    // Validate that we're not editing past dates
    if (date) {
      const selectedDate = new Date(date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        return NextResponse.json({
          error: 'Cannot edit availability in the past'
        }, { status: 400 })
      }
    }

    // Validate time constraints if updating times
    if (start_time && end_time && start_time >= end_time) {
      return NextResponse.json({
        error: 'End time must be after start time'
      }, { status: 400 })
    }

    // Check for conflicts if changing date/time
    if (date || start_time || end_time) {
      const checkDate = date || existingAvailability.date
      const checkStartTime = start_time || existingAvailability.start_time
      const checkEndTime = end_time || existingAvailability.end_time

      const { data: conflicts, error: conflictError } = await supabase
        .from('broker_availability')
        .select('id, start_time, end_time')
        .eq('broker_id', broker.id)
        .eq('date', checkDate)
        .neq('id', availabilityId) // Exclude current record
        .or(`start_time.lt.${checkEndTime},end_time.gt.${checkStartTime}`)

      if (conflictError) {
        console.error('Error checking conflicts:', conflictError)
        return NextResponse.json({ 
          error: 'Failed to validate availability' 
        }, { status: 500 })
      }

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json({
          error: 'Time slot conflicts with existing availability',
          conflicts: conflicts
        }, { status: 409 })
      }
    }

    // Prevent reducing max_bookings below current bookings
    if (max_bookings !== undefined && max_bookings < existingAvailability.current_bookings) {
      return NextResponse.json({
        error: `Cannot reduce max bookings below current bookings (${existingAvailability.current_bookings})`
      }, { status: 400 })
    }

    // Build update object with only provided fields
    const updateData: any = { updated_at: new Date().toISOString() }
    
    if (date !== undefined) updateData.date = date
    if (start_time !== undefined) updateData.start_time = start_time
    if (end_time !== undefined) updateData.end_time = end_time
    if (max_bookings !== undefined) updateData.max_bookings = max_bookings
    if (slot_duration_minutes !== undefined) updateData.slot_duration_minutes = slot_duration_minutes
    if (break_between_slots !== undefined) updateData.break_between_slots = break_between_slots
    if (booking_type !== undefined) updateData.booking_type = booking_type
    if (notes !== undefined) updateData.notes = notes
    if (is_available !== undefined) updateData.is_available = is_available

    // Update availability
    const { data: updatedAvailability, error: updateError } = await supabase
      .from('broker_availability')
      .update(updateData)
      .eq('id', availabilityId)
      .eq('broker_id', broker.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating availability:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update availability: ' + updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Availability updated successfully',
      availability: updatedAvailability
    })

  } catch (error) {
    console.error('Unexpected error in update availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/broker/availability/[id] - Delete specific availability slot
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const availabilityId = params.id

    // Validate availability ID
    if (!availabilityId) {
      return NextResponse.json({
        error: 'Availability ID is required'
      }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get broker ID for current user
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (brokerError || !broker) {
      return NextResponse.json({ 
        error: 'Broker profile not found' 
      }, { status: 404 })
    }

    // Verify ownership and check for existing bookings
    const { data: existingAvailability, error: ownershipError } = await supabase
      .from('broker_availability')
      .select('id, broker_id, current_bookings, date, start_time, end_time')
      .eq('id', availabilityId)
      .eq('broker_id', broker.id)
      .single()

    if (ownershipError || !existingAvailability) {
      return NextResponse.json({
        error: 'Availability slot not found or access denied'
      }, { status: 404 })
    }

    // Check if there are existing bookings
    if (existingAvailability.current_bookings > 0) {
      return NextResponse.json({
        error: `Cannot delete availability slot with ${existingAvailability.current_bookings} existing booking(s). Please cancel bookings first.`
      }, { status: 409 })
    }

    // Check if we're trying to delete past availability
    const slotDate = new Date(existingAvailability.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (slotDate < today) {
      return NextResponse.json({
        error: 'Cannot delete past availability slots'
      }, { status: 400 })
    }

    // Delete availability
    const { error: deleteError } = await supabase
      .from('broker_availability')
      .delete()
      .eq('id', availabilityId)
      .eq('broker_id', broker.id)

    if (deleteError) {
      console.error('Error deleting availability:', deleteError)
      return NextResponse.json({ 
        error: 'Failed to delete availability: ' + deleteError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Availability deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error in delete availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/broker/availability/[id] - Get specific availability slot details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const availabilityId = params.id

    const supabase = await createServerSupabaseClient()

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get broker ID for current user
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (brokerError || !broker) {
      return NextResponse.json({ 
        error: 'Broker profile not found' 
      }, { status: 404 })
    }

    // Get availability details with related bookings
    const { data: availability, error } = await supabase
      .from('broker_availability')
      .select(`
        *,
        property_viewings (
          id,
          property_id,
          user_id,
          visitor_name,
          visitor_email,
          viewing_time,
          status,
          properties (
            id,
            title,
            address
          )
        )
      `)
      .eq('id', availabilityId)
      .eq('broker_id', broker.id)
      .single()

    if (error || !availability) {
      return NextResponse.json({
        error: 'Availability slot not found or access denied'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      availability
    })

  } catch (error) {
    console.error('Unexpected error in get availability details:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 