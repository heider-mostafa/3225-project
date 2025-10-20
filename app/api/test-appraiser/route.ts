import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Test appraiser data access
    const { data: appraisers, error } = await supabase
      .from('brokers')
      .select(`
        id,
        full_name,
        email,
        appraiser_license_number,
        user_id
      `)
      .limit(5);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Test role data access
    const { data: roles, error: roleError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('role', 'appraiser')
      .limit(5);

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Appraiser system test successful',
      appraisers,
      roles,
      rls_working: true
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error 
    }, { status: 500 });
  }
}