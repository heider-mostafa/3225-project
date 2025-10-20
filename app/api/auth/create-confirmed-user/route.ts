import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { email, password, full_name, phone, role } = await request.json();

    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Email, password, full name, and role are required' },
        { status: 400 }
      );
    }

    // Use service role for admin operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined }, // Don't use cookies with service role
        },
      }
    );

    console.log('🔧 Creating confirmed user:', { email, role });

    // Create user with email auto-confirmed
    const { data, error } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: full_name,
        phone: phone || '',
        role: role
      }
    });

    if (error) {
      console.error('🔧 Admin createUser error:', error);
      return NextResponse.json(
        { error: 'Failed to create user: ' + error.message },
        { status: 500 }
      );
    }

    console.log('🔧 User created successfully:', { 
      user_id: data.user.id, 
      email_confirmed: !!data.user.email_confirmed_at 
    });

    return NextResponse.json({
      success: true,
      user_id: data.user.id,
      email_confirmed: !!data.user.email_confirmed_at,
      message: 'User created with confirmed email'
    });

  } catch (error) {
    console.error('🔧 Error in create-confirmed-user:', error);
    return NextResponse.json(
      { error: 'Failed to create confirmed user' },
      { status: 500 }
    );
  }
}