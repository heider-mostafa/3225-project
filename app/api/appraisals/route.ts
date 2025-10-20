import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PortfolioSyncService } from '@/lib/services/portfolio-sync-service';
import { generatePropertyDescription } from '@/lib/services/property-description-generator';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');
    const appraiserId = searchParams.get('appraiser_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Check user permissions
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (roleError) {
      return NextResponse.json(
        { error: 'Failed to check user permissions' },
        { status: 500 }
      );
    }

    const hasAppraisalAccess = userRoles?.some(role => 
      ['appraiser', 'admin', 'super_admin'].includes(role.role)
    );

    if (!hasAppraisalAccess) {
      return NextResponse.json(
        { error: 'Access denied. Appraiser role required.' },
        { status: 403 }
      );
    }

    // Build query
    let query = supabase
      .from('property_appraisals')
      .select(`
        *,
        properties:property_id (
          id,
          title,
          address,
          city,
          price,
          property_type
        ),
        brokers:appraiser_id (
          id,
          full_name,
          email,
          appraiser_license_number
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (propertyId) {
      query = query.eq('property_id', propertyId);
    }
    
    if (appraiserId) {
      query = query.eq('appraiser_id', appraiserId);
    }
    
    if (status) {
      const statusArray = status.split(',');
      if (statusArray.length > 1) {
        query = query.in('status', statusArray);
      } else {
        query = query.eq('status', status);
      }
    }

    // Portfolio sync filter - exclude appraisals already in portfolio
    const notInPortfolio = searchParams.get('not_in_portfolio');
    if (notInPortfolio === 'true') {
      query = query.is('source_appraisal_id', null);
    }

    // For non-admin users, only show their own appraisals
    const isAdmin = userRoles?.some(role => 
      ['admin', 'super_admin'].includes(role.role)
    );
    
    if (!isAdmin) {
      // Get user's broker ID if they are an appraiser
      const { data: brokerData } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (brokerData) {
        query = query.eq('appraiser_id', brokerData.id);
      } else {
        // If not an appraiser, return empty results
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, pages: 0 }
        });
      }
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('property_appraisals')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Count error:', countError);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: appraisals, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appraisals' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: appraisals,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check appraiser permissions using user_profiles (fixed recursion issue)
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.log('Profile check error:', profileError);
      // Fallback: Allow if they have a broker record
    }

    const userRole = userProfile?.preferences?.role;
    let hasAppraisalAccess = userRole && ['appraiser', 'admin', 'super_admin'].includes(userRole);

    // Fallback: Check if user has a broker record (is an appraiser)
    if (!hasAppraisalAccess) {
      const { data: brokerCheck } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      hasAppraisalAccess = !!brokerCheck;
    }

    if (!hasAppraisalAccess) {
      return NextResponse.json(
        { error: 'Access denied. Appraiser role required.' },
        { status: 403 }
      );
    }

    // Parse request body first to check if appraiser_id is provided
    const body = await request.json();
    
    // Use provided appraiser_id if available (for admin creating appraisals for other appraisers)
    // Otherwise, get user's broker ID (for direct appraiser access)
    let appraiser_id = body.appraiser_id || null;
    
    if (!appraiser_id) {
      const { data: brokerData, error: brokerError } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      appraiser_id = brokerData?.id || null; // Allow null for independent appraisers
      
      console.log('User broker lookup:', { 
        user_id: user.id, 
        broker_found: !!brokerData, 
        appraiser_id,
        error: brokerError?.message 
      });
    } else {
      console.log('Using provided appraiser_id:', appraiser_id);
    }
    
    console.log('Received appraisal creation request:', body);
    
    let propertyId = body.property_id;
    
    // PHASE 1: PDF-FIRST REVENUE MODEL TRANSFORMATION
    // ===============================================
    // COMMENTED OUT: Property auto-creation (can be re-enabled if needed)
    // Business partner decision: Stop auto-creating properties to preserve PDF report value
    
    /*
    // DISABLED: Simplified approach: if no property_id, create a minimal property record
    if (!propertyId) {
      const formData = body.form_data || {};
      
      // Validate required property fields
      const requiredFields = ['property_address_arabic', 'property_address_english', 'city_name', 'governorate'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        return NextResponse.json(
          { 
            error: 'Missing required property fields', 
            missing_fields: missingFields,
            message: 'Property address, city, and governorate are required to create a new property'
          },
          { status: 400 }
        );
      }

      // Validate basic property characteristics
      if (formData.property_type && !['apartment', 'villa', 'townhouse', 'penthouse', 'studio', 'duplex', 'commercial', 'industrial', 'land'].includes(formData.property_type)) {
        return NextResponse.json(
          { error: 'Invalid property type', valid_types: ['apartment', 'villa', 'townhouse', 'penthouse', 'studio', 'duplex', 'commercial', 'industrial', 'land'] },
          { status: 400 }
        );
      }

      // Validate room counts are non-negative
      if (formData.bedrooms && (formData.bedrooms < 0 || formData.bedrooms > 20)) {
        return NextResponse.json(
          { error: 'Bedrooms count must be between 0 and 20' },
          { status: 400 }
        );
      }

      if (formData.bathrooms && (formData.bathrooms < 0 || formData.bathrooms > 20)) {
        return NextResponse.json(
          { error: 'Bathrooms count must be between 0 and 20' },
          { status: 400 }
        );
      }
      
      // Create minimal property from available data (using only existing columns)
      const propertyData = {
        title: formData.property_address_arabic || formData.property_address_english || 'Appraisal Property',
        address: formData.property_address_arabic || formData.property_address_english || '',
        city: formData.city_name || 'Cairo',
        state: formData.governorate || 'Cairo', // Required field
        zip_code: '00000', // Required field - placeholder
        property_type: formData.property_type || 'apartment', // Use actual property type from form
        status: 'appraised_pending_review', // Changed: Properties from appraisals need admin review
        price: 0, // Will be updated with appraisal value
        neighborhood: formData.district_name || '', // Use neighborhood for district info
        bedrooms: formData.bedrooms || 0, // FIXED: Use correct field name
        bathrooms: formData.bathrooms || 0, // FIXED: Use correct field name
        square_meters: formData.built_area_sqm || 0,
        // NEW FIELDS: Add other basic property info from form
        parking_spaces: formData.parking_spaces || 0,
        total_floors: formData.total_floors || null,
        year_built: formData.year_built || null,
        // AMENITIES: Extract amenities from form data
        amenities: (() => {
          const amenitiesList = [];
          
          // Extract amenities from appraisal form data
          if (formData.elevator_available) amenitiesList.push('Elevator');
          if (formData.parking_available) amenitiesList.push('Parking');
          if (formData.security_system) amenitiesList.push('Security System');
          if (formData.pool_available) amenitiesList.push('Swimming Pool');
          if (formData.garden_available) amenitiesList.push('Garden');
          if (formData.gym_available) amenitiesList.push('Gym');
          if (formData.balcony_area_sqm && formData.balcony_area_sqm > 0) amenitiesList.push('Balcony');
          if (formData.garage_area_sqm && formData.garage_area_sqm > 0) amenitiesList.push('Garage');
          
          // Extract utilities as amenities
          if (formData.electricity_available) amenitiesList.push('Electricity');
          if (formData.water_supply_available) amenitiesList.push('Water Supply');
          if (formData.gas_supply_available) amenitiesList.push('Natural Gas');
          if (formData.internet_fiber_available) amenitiesList.push('High Speed Internet');
          if (formData.sewage_system_available) amenitiesList.push('Sewage System');
          
          console.log('📋 Extracted amenities from form data:', amenitiesList);
          return amenitiesList;
        })(),
        
        // LOCATION: Extract coordinates from location_data if available
        latitude: formData.location_data?.latitude || null,
        longitude: formData.location_data?.longitude || null
      };

      console.log('📍 Location data extraction:', {
        hasLocationData: !!formData.location_data,
        latitude: formData.location_data?.latitude,
        longitude: formData.location_data?.longitude,
        confidence_score: formData.location_data?.confidence_score,
        source: formData.location_data?.source
      });

      console.log('Property data being inserted:', JSON.stringify(propertyData, null, 2));

      const { data: newProperty, error: propertyError } = await supabase
        .from('properties')
        .insert(propertyData)
        .select('id')
        .single();

      if (propertyError) {
        console.error('Property creation error:', propertyError);
        return NextResponse.json(
          { error: 'Failed to create property record', details: propertyError.message },
          { status: 500 }
        );
      }

      propertyId = newProperty.id;
      console.log('Created property with ID:', propertyId);
      
      // Auto-generate description for newly created property from appraisal data
      if (formData && Object.keys(formData).length > 0) {
        try {
          console.log('🎯 Auto-generating description for newly created property...');
          
          const descriptionResult = generatePropertyDescription(formData, {
            language: 'ar-en',
            tone: 'professional',
            target_audience: 'family',
            include_technical_details: true,
            include_market_analysis: false,
            max_length: 800
          });

          const { error: updateError } = await supabase
            .from('properties')
            .update({
              description: descriptionResult.description,
              marketing_headline: descriptionResult.marketing_headline,
              key_features: descriptionResult.key_features,
              updated_at: new Date().toISOString()
            })
            .eq('id', propertyId);

          if (updateError) {
            console.error('Failed to update new property with description:', updateError);
          } else {
            console.log('✅ Successfully added auto-generated description to new property');
          }
        } catch (descriptionError) {
          console.error('Error generating description for new property:', descriptionError);
          // Don't fail the whole request if description generation fails
        }
      }
    }
    */
    
    // NEW: Market Intelligence Processing (instead of property creation)
    // Process appraisal data for market intelligence without creating individual properties
    if (!propertyId) {
      console.log('📊 Processing appraisal for market intelligence instead of creating property');
      
      // Validate we have minimum location data for market intelligence
      const formData = body.form_data || {};
      if (!formData.city_name && !formData.governorate && !formData.area && !formData.compound_name) {
        return NextResponse.json(
          { 
            error: 'Minimum location data required',
            message: 'At least one location field (city, governorate, area, or compound) must be provided for market intelligence processing'
          },
          { status: 400 }
        );
      }
      
      // Leave propertyId as null - this is valid for market intelligence appraisals
      // The appraisal will be stored with property_id = null and used for market analytics
      console.log('✅ Appraisal will be processed for market intelligence only (property_id = null)');
      console.log('📍 Location data available:', {
        city: formData.city_name,
        governorate: formData.governorate, 
        area: formData.area,
        compound: formData.compound_name,
        coordinates: formData.location_data?.latitude ? 'Yes' : 'No'
      });
    }

    // Prepare appraisal data (simplified)
    const formData = body.form_data || {};
    
    // Include extracted_images in form_data if provided
    if (body.extracted_images) {
      formData.extracted_images = body.extracted_images;
      console.log('💾 Including extracted images in form_data:', body.extracted_images.length, 'images');
    }
    
    const appraisalData = {
      property_id: propertyId,
      appraiser_id: appraiser_id, // Can be null for independent appraisers
      client_name: body.client_name || '',
      form_data: formData,
      market_value_estimate: body.market_value_estimate || null,
      confidence_level: body.confidence_level || null,
      calculation_results: body.calculation_results || {},
      status: body.status || 'draft',
      appraisal_date: body.appraisal_date || new Date().toISOString().split('T')[0]
      // Removed appraisal_valid_until - column doesn't exist
    };

    console.log('Prepared appraisal data:', appraisalData);

    // Insert new appraisal
    const { data: newAppraisal, error: insertError } = await supabase
      .from('property_appraisals')
      .insert(appraisalData)
      .select(`
        *,
        properties:property_id (
          id,
          title,
          address,
          city,
          price
        )
      `)
      .single();

    if (insertError) {
      console.error('Appraisal insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create appraisal', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('Successfully created appraisal:', newAppraisal.id);

    // Auto-upload extracted images if they exist
    if (propertyId && formData.extracted_images && formData.extracted_images.length > 0) {
      try {
        console.log(`🖼️ Auto-uploading ${formData.extracted_images.length} extracted images for new appraisal ${newAppraisal.id}`);
        
        // Import the appraisal image uploader
        const { appraisalImageUploader } = await import('@/lib/services/appraisal-image-uploader');
        
        // Transform extracted images to the format expected by the uploader
        const imagesToUpload = formData.extracted_images.map((img: any) => ({
          base64: img.data || img.base64,
          mimeType: img.mimeType || `image/${img.format || 'png'}`,
          filename: img.filename || `extracted_${Date.now()}.png`,
          category: img.category || 'appraisal_extracted',
          page: img.page
        }));

        // Upload images using the appraisal image uploader
        const uploadResult = await appraisalImageUploader.uploadExtractedImages(
          propertyId,
          imagesToUpload
        );

        if (uploadResult.success && uploadResult.uploadedImages.length > 0) {
          // Mark the appraisal as having uploaded images
          await supabase
            .from('property_appraisals')
            .update({
              form_data: {
                ...formData,
                images_uploaded: true,
                images_uploaded_at: new Date().toISOString(),
                uploaded_images_count: uploadResult.uploadedImages.length
              }
            })
            .eq('id', newAppraisal.id);

          console.log(`✅ Successfully auto-uploaded ${uploadResult.uploadedImages.length} images to property storage`);
        } else {
          console.error('❌ Failed to auto-upload extracted images:', uploadResult.errors);
        }
      } catch (imageUploadError) {
        console.error('Error auto-uploading extracted images:', imageUploadError);
        // Don't fail the creation if image upload fails
      }
    }

    // Handle property description data
    if (propertyId) {
      try {
        let shouldUpdateDescription = false;
        let descriptionUpdateData = {};

        // Priority 1: Use manually edited description data if provided
        if (body.description_data) {
          console.log('🎨 Using manually edited description data from form...');
          descriptionUpdateData = {
            description: body.description_data.description || '',
            marketing_headline: body.description_data.marketing_headline || '',
            key_features: body.description_data.key_features || [],
            updated_at: new Date().toISOString()
          };
          shouldUpdateDescription = true;
        }
        // Priority 2: Auto-generate if status is completed and no manual data
        else if (body.status === 'completed' && body.form_data) {
          console.log('🔄 Auto-generating property description from appraisal data...');
          
          const descriptionResult = generatePropertyDescription(body.form_data, {
            language: 'ar-en',
            tone: 'professional',
            target_audience: 'family',
            include_technical_details: true,
            include_market_analysis: false,
            max_length: 800
          });

          descriptionUpdateData = {
            description: descriptionResult.description,
            marketing_headline: descriptionResult.marketing_headline,
            key_features: descriptionResult.key_features,
            updated_at: new Date().toISOString()
          };
          shouldUpdateDescription = true;
        }

        // Update property with description data
        if (shouldUpdateDescription) {
          const { error: updateError } = await supabase
            .from('properties')
            .update(descriptionUpdateData)
            .eq('id', propertyId);

          if (updateError) {
            console.error('Failed to update property with description:', updateError);
          } else {
            console.log('✅ Successfully updated property description');
            console.log('Description source:', body.description_data ? 'Manual edit' : 'Auto-generated');
          }
        }
      } catch (descriptionError) {
        console.error('Error handling property description:', descriptionError);
        // Don't fail the whole request if description handling fails
      }
    }

    return NextResponse.json({
      success: true,
      data: newAppraisal,
      message: 'Appraisal created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Appraisal ID is required' },
        { status: 400 }
      );
    }

    // Check if user can update this appraisal
    const { data: existingAppraisal, error: fetchError } = await supabase
      .from('property_appraisals')
      .select(`
        *,
        brokers:appraiser_id (
          user_id
        )
      `)
      .eq('id', body.id)
      .single();

    if (fetchError || !existingAppraisal) {
      return NextResponse.json(
        { error: 'Appraisal not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const isAdmin = userRoles?.some(role => 
      ['admin', 'super_admin'].includes(role.role)
    );
    
    const isOwner = existingAppraisal.brokers?.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    const updatableFields = [
      'client_name',
      'form_data',
      'market_value_estimate',
      'confidence_level',
      'calculation_results',
      'status',
      'appraisal_date',
      'reports_generated'
    ];

    updatableFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Handle extracted_images - merge into form_data if provided
    if (body.extracted_images && updateData.form_data) {
      updateData.form_data.extracted_images = body.extracted_images;
      console.log('💾 Including extracted images in form_data update:', body.extracted_images.length, 'images');
    } else if (body.extracted_images) {
      // If no form_data in update but extracted_images provided, merge with existing
      updateData.form_data = { 
        ...existingAppraisal.form_data, 
        extracted_images: body.extracted_images 
      };
      console.log('💾 Merging extracted images with existing form_data:', body.extracted_images.length, 'images');
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update appraisal
    const { data: updatedAppraisal, error: updateError } = await supabase
      .from('property_appraisals')
      .update(updateData)
      .eq('id', body.id)
      .select(`
        *,
        properties:property_id (
          id,
          title,
          address,
          city,
          price
        ),
        brokers:appraiser_id (
          id,
          full_name,
          email
        )
      `)
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update appraisal' },
        { status: 500 }
      );
    }

    // Sync property data if form_data was updated (contains basic property info)
    if (updateData.form_data && existingAppraisal.property_id) {
      try {
        const formData = updateData.form_data;
        
        // Prepare property update data using same mapping as creation
        const propertyUpdateData: any = {};
        
        // Only update fields that have values in the form data
        if (formData.property_type) propertyUpdateData.property_type = formData.property_type;
        if (formData.bedrooms !== undefined) propertyUpdateData.bedrooms = formData.bedrooms || 0;
        if (formData.bathrooms !== undefined) propertyUpdateData.bathrooms = formData.bathrooms || 0;
        if (formData.built_area_sqm) propertyUpdateData.square_meters = formData.built_area_sqm;
        if (formData.parking_spaces !== undefined) propertyUpdateData.parking_spaces = formData.parking_spaces || 0;
        if (formData.total_floors) propertyUpdateData.total_floors = formData.total_floors;
        if (formData.year_built) propertyUpdateData.year_built = formData.year_built;
        
        // Update property address if changed
        if (formData.property_address_arabic || formData.property_address_english) {
          propertyUpdateData.title = formData.property_address_arabic || formData.property_address_english;
          propertyUpdateData.address = formData.property_address_arabic || formData.property_address_english;
        }
        if (formData.city_name) propertyUpdateData.city = formData.city_name;
        if (formData.governorate) propertyUpdateData.state = formData.governorate;
        if (formData.district_name) propertyUpdateData.neighborhood = formData.district_name;
        
        // Update property price if valuation changed
        if (updateData.market_value_estimate) {
          propertyUpdateData.price = updateData.market_value_estimate;
        }
        
        // Only perform update if there are fields to update
        if (Object.keys(propertyUpdateData).length > 0) {
          console.log('Syncing appraisal changes to property:', propertyUpdateData);
          
          const { error: propertyUpdateError } = await supabase
            .from('properties')
            .update(propertyUpdateData)
            .eq('id', existingAppraisal.property_id);
            
          if (propertyUpdateError) {
            console.error('Property sync error:', propertyUpdateError);
            // Don't fail the update if property sync fails
          } else {
            console.log('Property successfully synced with appraisal changes');
          }
        }
        
      } catch (syncError) {
        console.error('Property sync error:', syncError);
        // Don't fail the update if sync fails
      }
    }

    // Handle property description data on update
    if (existingAppraisal.property_id) {
      try {
        let shouldUpdateDescription = false;
        let descriptionUpdateData = {};

        console.log('🔍 DEBUG: Checking description update conditions...');
        console.log('  - body.description_data exists:', !!body.description_data);
        console.log('  - updateData.status:', updateData.status);
        console.log('  - updateData.form_data exists:', !!updateData.form_data);
        console.log('  - body.description_data value:', body.description_data);

        // Priority 1: Use manually edited description data if provided
        if (body.description_data) {
          console.log('🎨 Using manually edited description data from form update...');
          descriptionUpdateData = {
            description: body.description_data.description || '',
            marketing_headline: body.description_data.marketing_headline || '',
            key_features: body.description_data.key_features || [],
            updated_at: new Date().toISOString()
          };
          shouldUpdateDescription = true;
        }
        // Priority 2: Auto-generate if status changed to completed and no manual data
        else if (updateData.status === 'completed' && updateData.form_data) {
          console.log('🔄 Auto-generating property description from updated appraisal data...');
          
          const descriptionResult = generatePropertyDescription(updateData.form_data, {
            language: 'ar-en',
            tone: 'professional',
            target_audience: 'family',
            include_technical_details: true,
            include_market_analysis: false,
            max_length: 800
          });

          descriptionUpdateData = {
            description: descriptionResult.description,
            marketing_headline: descriptionResult.marketing_headline,
            key_features: descriptionResult.key_features,
            updated_at: new Date().toISOString()
          };
          shouldUpdateDescription = true;
        }

        // Update property with description data
        if (shouldUpdateDescription) {
          console.log('📝 Updating property description with data:', descriptionUpdateData);
          const { error: descUpdateError } = await supabase
            .from('properties')
            .update(descriptionUpdateData)
            .eq('id', existingAppraisal.property_id);

          if (descUpdateError) {
            console.error('Failed to update property with description:', descUpdateError);
          } else {
            console.log('✅ Successfully updated property description on appraisal update');
            console.log('Description source:', body.description_data ? 'Manual edit' : 'Auto-generated');
          }
        } else {
          console.log('⚠️ No description update performed - conditions not met');
        }
      } catch (descriptionError) {
        console.error('Error handling property description:', descriptionError);
        // Don't fail the whole request if description handling fails
      }
    }

    // Auto-sync portfolio if appraisal was completed/approved
    if (updateData.status && ['completed', 'approved'].includes(updateData.status)) {
      try {
        await PortfolioSyncService.onAppraisalCompleted(body.id, supabase);
      } catch (syncError) {
        console.error('Portfolio sync error:', syncError);
        // Don't fail the update if sync fails
      }
    }

    // Auto-upload extracted images if appraisal was completed and has extracted images
    if (updateData.status === 'completed' && existingAppraisal.property_id) {
      try {
        const extractedImages = updateData.form_data?.extracted_images || existingAppraisal.form_data?.extracted_images;
        const imagesAlreadyUploaded = updateData.form_data?.images_uploaded || existingAppraisal.form_data?.images_uploaded;
        
        if (extractedImages && extractedImages.length > 0 && !imagesAlreadyUploaded) {
          console.log(`🖼️ Auto-uploading ${extractedImages.length} extracted images for completed appraisal ${body.id}`);
          
          // Import the appraisal image uploader
          const { appraisalImageUploader } = await import('@/lib/services/appraisal-image-uploader');
          
          // Transform extracted images to the format expected by the uploader
          const imagesToUpload = extractedImages.map((img: any) => ({
            base64: img.data || img.base64,
            mimeType: img.mimeType || `image/${img.format || 'png'}`,
            filename: img.filename || `extracted_${Date.now()}.png`,
            category: img.category || 'appraisal_extracted',
            page: img.page
          }));

          // Upload images using the appraisal image uploader
          const uploadResult = await appraisalImageUploader.uploadExtractedImages(
            existingAppraisal.property_id,
            imagesToUpload
          );

          if (uploadResult.success && uploadResult.uploadedImages.length > 0) {
            // Mark the appraisal as having uploaded images
            await supabase
              .from('property_appraisals')
              .update({
                form_data: {
                  ...updateData.form_data,
                  images_uploaded: true,
                  images_uploaded_at: new Date().toISOString(),
                  uploaded_images_count: uploadResult.uploadedImages.length
                }
              })
              .eq('id', body.id);

            console.log(`✅ Successfully auto-uploaded ${uploadResult.uploadedImages.length} images to property storage`);
          } else {
            console.error('❌ Failed to auto-upload extracted images:', uploadResult.errors);
          }
        }
      } catch (imageUploadError) {
        console.error('Error auto-uploading extracted images:', imageUploadError);
        // Don't fail the update if image upload fails
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedAppraisal,
      message: 'Appraisal updated successfully'
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication and admin permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get appraisal ID from URL
    const { searchParams } = new URL(request.url);
    const appraisalId = searchParams.get('id');

    if (!appraisalId) {
      return NextResponse.json(
        { error: 'Appraisal ID is required' },
        { status: 400 }
      );
    }

    // Check admin permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const isAdmin = userRoles?.some(role => 
      ['admin', 'super_admin'].includes(role.role)
    );

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    // Soft delete - update status to archived instead of hard delete
    const { data: deletedAppraisal, error: deleteError } = await supabase
      .from('property_appraisals')
      .update({ status: 'archived' })
      .eq('id', appraisalId)
      .select()
      .single();

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to archive appraisal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Appraisal archived successfully'
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}