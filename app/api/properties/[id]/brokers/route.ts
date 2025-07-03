import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { createServerSupabaseClient } from '@/lib/supabase/server'
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId } = await params;

    // Use service role for this operation to bypass RLS
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    );

    // Get all brokers assigned to this property
    const { data: propertyBrokers, error } = await supabase
      .from('property_brokers')
      .select(`
        id,
        is_primary,
        assignment_type,
        commission_split,
        assigned_at,
        brokers (
          id,
          full_name,
          email,
          phone,
          photo_url,
          bio,
          specialties,
          languages,
          rating,
          total_reviews,
          years_experience,
          is_active,
          timezone
        )
      `)
      .eq('property_id', propertyId)
      .eq('is_active', true)
      .eq('brokers.is_active', true)
      .order('is_primary', { ascending: false })
      .order('assigned_at', { ascending: true });

    if (error) {
      console.error('Error fetching property brokers:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch brokers' },
        { status: 500 }
      );
    }

    // Transform the data to match our expected format
    const brokers = propertyBrokers?.map(pb => ({
      ...pb.brokers,
      is_primary: pb.is_primary,
      assignment_type: pb.assignment_type,
      commission_split: pb.commission_split,
      assigned_at: pb.assigned_at
    })) || [];

    // Get availability summary for each broker (next 7 days)
    const brokersWithAvailability = await Promise.all(
      brokers.map(async (broker: any) => {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const today = new Date().toISOString().split('T')[0];
        const nextWeekStr = nextWeek.toISOString().split('T')[0];
        
        const { data: availabilitySlots, error: availError } = await supabase
          .from('broker_availability')
          .select('date, start_time, current_bookings, max_bookings')
          .eq('broker_id', broker.id)
          .eq('is_available', true)
          .gte('date', today)
          .lte('date', nextWeekStr);

        // Filter slots where current_bookings < max_bookings
        const availability = availabilitySlots?.filter(slot => 
          slot.current_bookings < slot.max_bookings
        ) || [];

        return {
          ...broker,
          next_available_slots: availability.length,
          has_availability: availability.length > 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      brokers: brokersWithAvailability
    });

  } catch (error) {
    console.error('Unexpected error in get property brokers:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 