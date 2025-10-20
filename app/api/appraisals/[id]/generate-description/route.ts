import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { generatePropertyDescription, PropertyDescriptionOptions } from '@/lib/services/property-description-generator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const resolvedParams = await params;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAccess = userRoles?.some(role => 
      ['appraiser', 'admin', 'super_admin'].includes(role.role)
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied. Appraiser role required.' },
        { status: 403 }
      );
    }

    // Parse request body for options
    const body = await request.json();
    const options: PropertyDescriptionOptions = {
      language: body.language || 'ar-en',
      tone: body.tone || 'professional',
      target_audience: body.target_audience || 'family',
      include_technical_details: body.include_technical_details ?? true,
      include_market_analysis: body.include_market_analysis ?? false,
      max_length: body.max_length || 800,
      ...body.options
    };

    // Get appraisal data
    const { data: appraisal, error: appraisalError } = await supabase
      .from('property_appraisals')
      .select(`
        *,
        properties:property_id (
          id,
          title,
          address
        ),
        brokers:appraiser_id (
          user_id
        )
      `)
      .eq('id', resolvedParams.id)
      .single();

    if (appraisalError || !appraisal) {
      return NextResponse.json(
        { error: 'Appraisal not found' },
        { status: 404 }
      );
    }

    // Check ownership
    const isAdmin = userRoles?.some(role => 
      ['admin', 'super_admin'].includes(role.role)
    );
    const isOwner = appraisal.brokers?.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Access denied to this appraisal' },
        { status: 403 }
      );
    }

    if (!appraisal.form_data) {
      return NextResponse.json(
        { error: 'No form data available for description generation' },
        { status: 400 }
      );
    }

    // Generate description(s)
    const generateMultiple = body.generate_multiple || false;
    
    if (generateMultiple) {
      // Generate multiple variations
      const variations = [];
      const tones = ['professional', 'casual', 'luxury'] as const;
      const audiences = ['family', 'investor', 'first_time_buyer'] as const;
      
      for (let i = 0; i < 3; i++) {
        const variationOptions = {
          ...options,
          tone: tones[i % tones.length],
          target_audience: audiences[i % audiences.length]
        };
        
        const description = generatePropertyDescription(appraisal.form_data, variationOptions);
        variations.push({
          ...description,
          variation_name: `${variationOptions.tone}_${variationOptions.target_audience}`
        });
      }

      return NextResponse.json({
        success: true,
        appraisal_id: resolvedParams.id,
        property_id: appraisal.property_id,
        variations,
        options_used: options
      });
    } else {
      // Generate single description
      const descriptionResult = generatePropertyDescription(appraisal.form_data, options);

      // Auto-update property if requested
      if (body.auto_update && appraisal.property_id) {
        const { error: updateError } = await supabase
          .from('properties')
          .update({
            description: descriptionResult.description,
            marketing_headline: descriptionResult.marketing_headline,
            key_features: descriptionResult.key_features,
            updated_at: new Date().toISOString()
          })
          .eq('id', appraisal.property_id);

        if (updateError) {
          console.error('Failed to auto-update property:', updateError);
          return NextResponse.json({
            success: true,
            description: descriptionResult,
            property_updated: false,
            update_error: updateError.message
          });
        } else {
          console.log('✅ Property description auto-updated');
        }
      }

      return NextResponse.json({
        success: true,
        appraisal_id: resolvedParams.id,
        property_id: appraisal.property_id,
        description: descriptionResult,
        property_updated: body.auto_update && appraisal.property_id ? true : false,
        options_used: options
      });
    }

  } catch (error) {
    console.error('Description generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    );
  }
}