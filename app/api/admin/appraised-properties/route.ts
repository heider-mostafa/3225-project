import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isServerUserAdmin } from '@/lib/auth/admin';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check admin permissions
    const isAdmin = await isServerUserAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    console.log('📋 Fetching appraised properties...');

    // Fetch properties with appraised statuses
    const { data: properties, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_photos (
          id,
          url,
          is_primary,
          category
        ),
        property_appraisals!inner (
          id,
          client_name,
          market_value_estimate,
          appraisal_date,
          status as appraisal_status,
          calculation_results,
          appraiser:brokers!appraiser_id (
            id,
            full_name,
            email,
            photo_url,
            professional_headshot_url,
            valify_status,
            years_of_experience,
            property_specialties
          )
        )
      `)
      .in('status', ['appraised_pending_review', 'awaiting_photos', 'pending_approval'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appraised properties' },
        { status: 500 }
      );
    }

    console.log(`✅ Found ${properties.length} appraised properties`);

    // Transform the data to include appraisal information and enhanced property data
    const enhancedProperties = properties.map((property: any) => {
      // Safely access property_appraisals with type checking
      const appraisal = property.property_appraisals?.[0] || null;
      const calculationResults = (appraisal?.calculation_results as any) || {};

      // Enhance property data with appraisal information
      return {
        ...property,
        // Add appraisal info for easy access in the UI
        appraisal,
        
        // Override property fields with appraisal data for more accurate display
        price: calculationResults.market_value_estimate || 
               calculationResults.final_reconciled_value || 
               calculationResults.sales_comparison_value || 
               appraisal?.market_value_estimate || 
               property.price || 0,
        
        square_meters: calculationResults.unit_area_sqm || 
                      calculationResults.built_area_sqm ||
                      calculationResults.land_area_sqm ||
                      calculationResults.total_area_sqm ||
                      property.square_meters || 0,
        
        bedrooms: calculationResults.bedrooms || property.bedrooms || 0,
        bathrooms: calculationResults.bathrooms || property.bathrooms || 0,
        
        // Add amenities count for admin overview
        amenities_count: calculationResults ? Object.keys(calculationResults).filter((key: string) => 
          key.includes('_available') && calculationResults[key] === true
        ).length : 0,
        
        // Add condition rating for admin filtering
        condition_rating: calculationResults.overall_condition_rating || null,
        finishing_level: calculationResults.finishing_level || null,
        
        // Add appraisal-specific metadata
        appraisal_completeness: calculationResults.final_reconciled_value ? 'complete' : 'partial',
        has_detailed_analysis: !!(calculationResults.comparable_sale_1_price || 
                                 calculationResults.cost_approach_value || 
                                 calculationResults.income_approach_value)
      };
    });

    return NextResponse.json({
      success: true,
      properties: enhancedProperties,
      count: properties.length
    });

  } catch (error) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check admin permissions
    const isAdmin = await isServerUserAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { propertyId, status, adminNotes } = body;

    if (!propertyId || !status) {
      return NextResponse.json(
        { error: 'Property ID and status are required' },
        { status: 400 }
      );
    }

    console.log('📝 Updating appraised property status:', { propertyId, status, adminNotes });

    // Update property status
    const { data: updatedProperty, error: updateError } = await supabase
      .from('properties')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(adminNotes && { internal_notes: adminNotes })
      })
      .eq('id', propertyId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update property status' },
        { status: 500 }
      );
    }

    console.log('✅ Property status updated successfully');

    return NextResponse.json({
      success: true,
      property: updatedProperty,
      message: 'Property status updated successfully'
    });

  } catch (error) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check admin permissions
    const isAdmin = await isServerUserAdmin();
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { propertyId, action, photographerId, scheduledDate, adminNotes } = body;

    if (!propertyId || !action) {
      return NextResponse.json(
        { error: 'Property ID and action are required' },
        { status: 400 }
      );
    }

    console.log('🔄 Processing appraised property action:', { propertyId, action, photographerId, scheduledDate });

    switch (action) {
      case 'approve':
        // Approve property - change status to available/published
        const { data: approvedProperty, error: approveError } = await supabase
          .from('properties')
          .update({
            status: 'available',
            updated_at: new Date().toISOString(),
            ...(adminNotes && { internal_notes: adminNotes })
          })
          .eq('id', propertyId)
          .select()
          .single();

        if (approveError) {
          console.error('❌ Approve error:', approveError);
          return NextResponse.json(
            { error: 'Failed to approve property' },
            { status: 500 }
          );
        }

        console.log('✅ Property approved and published');
        return NextResponse.json({
          success: true,
          property: approvedProperty,
          message: 'Property approved and published successfully'
        });

      case 'schedule_photographer':
        if (!photographerId || !scheduledDate) {
          return NextResponse.json(
            { error: 'Photographer ID and scheduled date are required for scheduling' },
            { status: 400 }
          );
        }

        // Create photographer assignment for appraised property
        const { data: assignment, error: assignmentError } = await supabase
          .from('photographer_assignments')
          .insert({
            photographer_id: photographerId,
            property_id: propertyId, // Use property_id for appraised properties
            assignment_date: scheduledDate,
            scheduled_time: scheduledDate,
            status: 'assigned',
            preparation_notes: `Photography assignment for appraised property`,
            lead_id: null // Appraised properties don't have leads
          })
          .select()
          .single();

        if (assignmentError) {
          console.error('❌ Assignment creation error:', assignmentError);
          return NextResponse.json(
            { error: 'Failed to create photographer assignment' },
            { status: 500 }
          );
        }

        // Update property status to awaiting_photos
        const { error: statusError } = await supabase
          .from('properties')
          .update({
            status: 'awaiting_photos',
            updated_at: new Date().toISOString()
          })
          .eq('id', propertyId);

        if (statusError) {
          console.error('❌ Status update error:', statusError);
          return NextResponse.json(
            { error: 'Failed to update property status' },
            { status: 500 }
          );
        }

        console.log('✅ Photographer scheduled and property status updated');
        return NextResponse.json({
          success: true,
          assignment,
          message: 'Photographer scheduled successfully'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('💥 Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}