import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server'
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();
  const supabase = await createServerSupabaseClient();
  
  const body = await request.json();
  const { event_type, event_data } = body;

  // Record analytics event
  const { data: analytics, error } = await supabase
    .from('property_analytics')
    .insert({
      property_id: params.id,
      event_type,
      event_data,
      user_agent: request.headers.get('user-agent'),
      ip_address: request.headers.get('x-forwarded-for')
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(analytics);
} 