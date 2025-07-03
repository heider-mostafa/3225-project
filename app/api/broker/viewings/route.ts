import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { createServerSupabaseClient } from '@/lib/supabase/server'
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brokerId = searchParams.get('broker_id');

    if (!brokerId) {
      return NextResponse.json(
        { error: 'Broker ID is required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: viewingsData, error } = await supabase
      .from('property_viewings')
      .select(`
        *,
        properties (
          title,
          address
        )
      `)
      .eq('broker_id', brokerId)
      .gte('viewing_date', new Date().toISOString().split('T')[0])
      .in('status', ['scheduled', 'confirmed'])
      .order('viewing_date', { ascending: true })
      .order('viewing_time', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ viewings: viewingsData || [] });
  } catch (error) {
    console.error('Error loading booked viewings:', error);
    return NextResponse.json(
      { error: 'Failed to load viewings' },
      { status: 500 }
    );
  }
} 