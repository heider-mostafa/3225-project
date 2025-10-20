import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isServerUserAdmin } from '@/lib/auth/admin';

// GET /api/appraisers/availability - Get appraiser availability
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appraiser_id = searchParams.get('appraiser_id');
    const day_of_week = searchParams.get('day_of_week');
    const available_only = searchParams.get('available_only') === 'true';

    const supabase = await createServerSupabaseClient();

    // Build query
    let query = supabase
      .from('appraiser_availability')
      .select(`
        id,
        appraiser_id,
        day_of_week,
        start_time,
        end_time,
        is_available,
        timezone,
        break_start_time,
        break_end_time,
        notes,
        created_at,
        updated_at
      `);

    // Apply filters
    if (appraiser_id) {
      query = query.eq('appraiser_id', appraiser_id);
    }

    if (day_of_week !== null && day_of_week !== undefined) {
      query = query.eq('day_of_week', parseInt(day_of_week));
    }

    if (available_only) {
      query = query.eq('is_available', true);
    }

    // Order by day of week, then start time
    query = query.order('day_of_week', { ascending: true })
                 .order('start_time', { ascending: true });

    const { data: availability, error } = await query;

    if (error) {
      console.error('Error fetching availability:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch availability' 
      }, { status: 500 });
    }

    // If specific appraiser, also calculate current availability status
    let status = null;
    if (appraiser_id && availability) {
      const now = new Date();
      const currentDay = now.getDay(); // 0=Sunday, 1=Monday, etc.
      const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
      
      const todaySchedule = availability.filter(a => 
        a.day_of_week === currentDay && a.is_available
      );

      let isAvailableNow = false;
      let nextAvailable = null;

      for (const schedule of todaySchedule) {
        if (currentTime >= schedule.start_time && currentTime <= schedule.end_time) {
          // Check if not in break time
          if (schedule.break_start_time && schedule.break_end_time) {
            if (currentTime < schedule.break_start_time || currentTime > schedule.break_end_time) {
              isAvailableNow = true;
              break;
            }
          } else {
            isAvailableNow = true;
            break;
          }
        }
      }

      // If not available now, find next available slot
      if (!isAvailableNow) {
        // Look for next available slot in the next 7 days
        for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
          const checkDay = (currentDay + dayOffset) % 7;
          const daySchedules = availability.filter(a => 
            a.day_of_week === checkDay && a.is_available
          );

          for (const schedule of daySchedules) {
            if (dayOffset === 0 && schedule.start_time <= currentTime) {
              continue; // Skip past times for today
            }
            
            nextAvailable = {
              day_of_week: checkDay,
              start_time: schedule.start_time,
              days_from_now: dayOffset
            };
            break;
          }

          if (nextAvailable) break;
        }
      }

      status = {
        is_available_now: isAvailableNow,
        next_available: nextAvailable,
        timezone: availability[0]?.timezone || 'Africa/Cairo'
      };
    }

    // Transform availability into weekly schedule format
    const weeklySchedule = availability ? 
      [0, 1, 2, 3, 4, 5, 6].map(day => {
        const daySchedules = availability.filter(a => a.day_of_week === day);
        return {
          day_of_week: day,
          day_name: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
          schedules: daySchedules
        };
      }) : [];

    return NextResponse.json({
      success: true,
      data: {
        availability: availability || [],
        weekly_schedule: weeklySchedule,
        current_status: status
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/appraisers/availability - Create availability schedule
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      appraiser_id,
      day_of_week,
      start_time,
      end_time,
      is_available = true,
      timezone = 'Africa/Cairo',
      break_start_time,
      break_end_time,
      notes
    } = body;

    // Validate required fields
    if (day_of_week === undefined || !start_time || !end_time) {
      return NextResponse.json({
        error: 'Day of week, start time, and end time are required'
      }, { status: 400 });
    }

    // Validate day of week (0-6)
    if (day_of_week < 0 || day_of_week > 6) {
      return NextResponse.json({
        error: 'Day of week must be between 0 (Sunday) and 6 (Saturday)'
      }, { status: 400 });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return NextResponse.json({
        error: 'Invalid time format. Use HH:MM (24-hour format)'
      }, { status: 400 });
    }

    // Validate that end_time is after start_time
    if (start_time >= end_time) {
      return NextResponse.json({
        error: 'End time must be after start time'
      }, { status: 400 });
    }

    // Validate break times if provided
    if (break_start_time && break_end_time) {
      if (!timeRegex.test(break_start_time) || !timeRegex.test(break_end_time)) {
        return NextResponse.json({
          error: 'Invalid break time format. Use HH:MM (24-hour format)'
        }, { status: 400 });
      }

      if (break_start_time >= break_end_time) {
        return NextResponse.json({
          error: 'Break end time must be after break start time'
        }, { status: 400 });
      }

      // Check that break times are within working hours
      if (break_start_time < start_time || break_end_time > end_time) {
        return NextResponse.json({
          error: 'Break times must be within working hours'
        }, { status: 400 });
      }
    }

    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine target appraiser ID
    let targetAppraiserId: string;
    const isAdmin = await isServerUserAdmin();

    if (isAdmin && appraiser_id) {
      // Admin can manage any appraiser
      targetAppraiserId = appraiser_id;
      
      // Verify appraiser exists
      const { data: appraiser, error: appraiserError } = await supabase
        .from('brokers')
        .select('id, full_name')
        .eq('id', targetAppraiserId)
        .eq('is_active', true)
        .single();

      if (appraiserError || !appraiser) {
        return NextResponse.json({
          error: 'Appraiser not found'
        }, { status: 404 });
      }
    } else {
      // Regular user - must be the appraiser owner
      const { data: broker, error: brokerError } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (brokerError || !broker) {
        return NextResponse.json({
          error: 'Appraiser profile not found. Only the appraiser can manage availability.'
        }, { status: 404 });
      }

      targetAppraiserId = broker.id;
    }

    // Check for existing availability on the same day (we'll update if exists)
    const { data: existingAvailability, error: existingError } = await supabase
      .from('appraiser_availability')
      .select('id')
      .eq('appraiser_id', targetAppraiserId)
      .eq('day_of_week', day_of_week)
      .single();

    const availabilityData = {
      appraiser_id: targetAppraiserId,
      day_of_week,
      start_time,
      end_time,
      is_available,
      timezone,
      break_start_time,
      break_end_time,
      notes
    };

    let result;
    
    if (existingAvailability) {
      // Update existing availability
      const { data: updatedAvailability, error: updateError } = await supabase
        .from('appraiser_availability')
        .update({
          ...availabilityData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAvailability.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating availability:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update availability: ' + updateError.message 
        }, { status: 500 });
      }

      result = {
        success: true,
        message: 'Availability updated successfully',
        data: updatedAvailability
      };
    } else {
      // Create new availability
      const { data: newAvailability, error: insertError } = await supabase
        .from('appraiser_availability')
        .insert(availabilityData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating availability:', insertError);
        return NextResponse.json({ 
          error: 'Failed to create availability: ' + insertError.message 
        }, { status: 500 });
      }

      result = {
        success: true,
        message: 'Availability created successfully',
        data: newAvailability
      };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Unexpected error in POST availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/appraisers/availability - Update availability
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      availability_id,
      day_of_week,
      start_time,
      end_time,
      is_available,
      timezone,
      break_start_time,
      break_end_time,
      notes
    } = body;

    if (!availability_id) {
      return NextResponse.json({
        error: 'Availability ID is required'
      }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get availability details
    const { data: availability, error: availabilityError } = await supabase
      .from('appraiser_availability')
      .select('appraiser_id')
      .eq('id', availability_id)
      .single();

    if (availabilityError || !availability) {
      return NextResponse.json({
        error: 'Availability record not found'
      }, { status: 404 });
    }

    // Check permissions
    const isAdmin = await isServerUserAdmin();
    let canUpdate = false;
    
    if (isAdmin) {
      canUpdate = true;
    } else {
      // Check if user is the appraiser owner
      const { data: broker } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', availability.appraiser_id)
        .single();
      
      canUpdate = !!broker;
    }

    if (!canUpdate) {
      return NextResponse.json({
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (day_of_week !== undefined) updateData.day_of_week = day_of_week;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (is_available !== undefined) updateData.is_available = is_available;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (break_start_time !== undefined) updateData.break_start_time = break_start_time;
    if (break_end_time !== undefined) updateData.break_end_time = break_end_time;
    if (notes !== undefined) updateData.notes = notes;

    const { data: updatedAvailability, error: updateError } = await supabase
      .from('appraiser_availability')
      .update(updateData)
      .eq('id', availability_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating availability:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update availability: ' + updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Availability updated successfully',
      data: updatedAvailability
    });

  } catch (error) {
    console.error('Unexpected error in PUT availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/appraisers/availability - Delete availability
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const availability_id = searchParams.get('availability_id');

    if (!availability_id) {
      return NextResponse.json({
        error: 'Availability ID is required'
      }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get availability details
    const { data: availability, error: availabilityError } = await supabase
      .from('appraiser_availability')
      .select('appraiser_id')
      .eq('id', availability_id)
      .single();

    if (availabilityError || !availability) {
      return NextResponse.json({
        error: 'Availability record not found'
      }, { status: 404 });
    }

    // Check permissions
    const isAdmin = await isServerUserAdmin();
    let canDelete = false;
    
    if (isAdmin) {
      canDelete = true;
    } else {
      // Check if user is the appraiser owner
      const { data: broker } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', availability.appraiser_id)
        .single();
      
      canDelete = !!broker;
    }

    if (!canDelete) {
      return NextResponse.json({
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    // Delete availability record
    const { error: deleteError } = await supabase
      .from('appraiser_availability')
      .delete()
      .eq('id', availability_id);

    if (deleteError) {
      console.error('Error deleting availability:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete availability: ' + deleteError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Availability deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error in DELETE availability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}