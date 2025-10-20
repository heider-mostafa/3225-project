import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// PUT /api/appraisers/profile - Update appraiser profile
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      full_name,
      profile_headline,
      profile_summary,
      languages,
      service_areas,
      years_of_experience,
      appraiser_license_number
    } = body;

    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get appraiser ID for current user
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (brokerError || !broker) {
      return NextResponse.json({
        error: 'Appraiser profile not found'
      }, { status: 404 });
    }

    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (full_name !== undefined) updateData.full_name = full_name;
    if (profile_headline !== undefined) updateData.profile_headline = profile_headline;
    if (profile_summary !== undefined) updateData.profile_summary = profile_summary;
    if (languages !== undefined) updateData.languages = languages;
    if (service_areas !== undefined) updateData.service_areas = service_areas;
    if (years_of_experience !== undefined) updateData.years_of_experience = years_of_experience;
    if (appraiser_license_number !== undefined) updateData.appraiser_license_number = appraiser_license_number;

    // Update broker record
    const { data: updatedBroker, error: updateError } = await supabase
      .from('brokers')
      .update(updateData)
      .eq('id', broker.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating appraiser profile:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update profile: ' + updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedBroker
    });

  } catch (error) {
    console.error('Unexpected error in PUT appraiser profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}