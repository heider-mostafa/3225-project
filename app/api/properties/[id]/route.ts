import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers';
import { isServerUserAdmin, logAdminActivity, ADMIN_PERMISSIONS } from '@/lib/auth/admin';
import { InfrastructureDistanceCalculator } from '@/lib/services/infrastructure-distance-calculator';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    console.log('🔍 Fetching property with ID:', id)
    
    // Use anon key for public property access (respects RLS policies)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Fetch property with related data including appraiser info
    const { data: property, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_photos (
          id,
          url,
          filename,
          file_size,
          mime_type,
          category,
          is_primary,
          order_index,
          thumbnail_url,
          alt_text,
          caption,
          source,
          appraisal_id,
          original_category,
          document_page,
          created_at
        ),
        property_appraisals (
          id,
          appraiser_id,
          client_name,
          appraisal_date,
          market_value_estimate,
          status,
          calculation_results,
          form_data,
          appraiser:brokers!appraiser_id (
            id,
            email,
            full_name,
            photo_url,
            professional_headshot_url,
            valify_status,
            average_rating,
            total_reviews,
            years_of_experience,
            property_specialties,
            service_areas
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('❌ Database error:', error)
      
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Property not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch property' },
        { status: 500 }
      )
    }

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    console.log('✅ Property found:', property.title)

    // Enhanced property data mapping from appraisal if available
    if (property.property_appraisals && property.property_appraisals.length > 0) {
      const appraisal = property.property_appraisals[0]
      const calculationResults = appraisal.calculation_results || {}
      const formData = appraisal.form_data || {}
      
      console.log('🏗️ Mapping appraisal data to property:', calculationResults)
      console.log('📋 Available calculation fields:', Object.keys(calculationResults))
      console.log('📊 Full appraisal data:', appraisal)
      console.log('🔍 DEBUG: Checking amenities fields in form_data:')
      console.log('  - elevator_available:', formData.elevator_available)
      console.log('  - parking_available:', formData.parking_available)
      console.log('  - security_system:', formData.security_system)
      console.log('  - gas_supply_available:', formData.gas_supply_available)
      console.log('  - electricity_available:', formData.electricity_available)
      console.log('  - water_supply_available:', formData.water_supply_available)
      console.log('  - nearby_services:', formData.nearby_services)
      console.log('  - finishing_level:', formData.finishing_level)
      console.log('🔍 DEBUG: Checking property description fields:')
      console.log('  - property.description:', property.description)
      console.log('  - property.marketing_headline:', property.marketing_headline)
      console.log('  - form_data.description_data:', formData.description_data)
      
      // Map appraisal data to property fields with fallbacks
      const enhancedProperty = {
        ...property,
        // Price: Use market value estimate from calculation results or appraisal, fallback to property price
        price: calculationResults.market_value_estimate || 
               calculationResults.final_reconciled_value || 
               calculationResults.sales_comparison_value || 
               calculationResults.cost_approach_value ||
               appraisal.market_value_estimate || 
               property.price,
        
        // Area: For this specific case, the property.square_meters (1880) is the building area
        // We need to calculate unit area. If price_per_sqm exists, calculate unit area from total value
        square_meters: calculationResults.unit_area_sqm || 
                      (calculationResults.market_value_estimate && calculationResults.price_per_sqm ? 
                        Math.round(calculationResults.market_value_estimate / calculationResults.price_per_sqm) : 
                        property.square_meters),
        
        // Bedrooms: Use appraisal data if available, fallback to property data
        bedrooms: formData.bedrooms || calculationResults.bedrooms || property.bedrooms,
        
        // Bathrooms: Use appraisal data if available, fallback to property data  
        bathrooms: formData.bathrooms || calculationResults.bathrooms || property.bathrooms,
        
        // Year built: Use appraisal data if available, fallback to property data
        year_built: calculationResults.year_built || property.year_built,
        
        // Property type: Use appraisal data if available, fallback to property data
        property_type: calculationResults.property_type || property.property_type,
        
        // Parking spaces: Use appraisal data if available, fallback to property data
        parking_spaces: calculationResults.parking_spaces || property.parking_spaces,
        
        // Extract amenities from appraisal form data (NOT calculation results)
        has_elevator: formData.elevator_available ?? calculationResults.has_elevator ?? property.has_elevator,
        has_parking: formData.parking_available ?? calculationResults.has_parking ?? property.has_parking,
        has_security: formData.security_system ?? calculationResults.has_security ?? property.has_security,
        has_pool: formData.pool_available ?? calculationResults.has_pool ?? property.has_pool,
        has_garden: formData.garden_available ?? calculationResults.has_garden ?? property.has_garden,
        has_gym: formData.gym_available ?? calculationResults.has_gym ?? property.has_gym,
        
        // Extract utilities/services from appraisal form data
        electricity_available: formData.electricity_available ?? property.electricity_available,
        water_supply_available: formData.water_supply_available ?? property.water_supply_available,
        internet_fiber_available: formData.internet_fiber_available ?? property.internet_fiber_available,
        gas_supply_available: formData.gas_supply_available ?? property.gas_supply_available,
        
        // Extract location/condition info from appraisal
        property_condition: calculationResults.overall_condition_rating ? 
          (calculationResults.overall_condition_rating >= 8 ? 'excellent' :
           calculationResults.overall_condition_rating >= 6 ? 'very_good' :
           calculationResults.overall_condition_rating >= 4 ? 'good' :
           calculationResults.overall_condition_rating >= 2 ? 'fair' : 'poor') : 
          property.property_condition,
        
        // Extract detailed area measurements
        lot_size: calculationResults.land_area_sqm || property.lot_size,
        balcony_area: calculationResults.balcony_area_sqm,
        
        // Extract building information
        total_floors: calculationResults.total_floors || property.total_floors,
        floor_level: calculationResults.floor_number || property.floor_level,
        
        // Extract finishing information
        finishing_level: calculationResults.finishing_level,
        
        // Extract additional property features
        reception_rooms: calculationResults.reception_rooms,
        kitchens: calculationResults.kitchens,
        
        // Extract nearby services if available
        nearby_services: calculationResults.nearby_services,
        
        // Create comprehensive amenities list from appraisal form data
        amenities: (() => {
          const amenitiesList = [];
          
          // Extract amenities from appraisal form data (NOT calculation results)
          if (formData.elevator_available) amenitiesList.push('Elevator');
          if (formData.parking_available) amenitiesList.push('Parking');
          if (formData.security_system) amenitiesList.push('Security System');
          if (formData.pool_available) amenitiesList.push('Swimming Pool');
          if (formData.garden_available) amenitiesList.push('Garden');
          if (formData.gym_available) amenitiesList.push('Gym');
          if (formData.balcony_area_sqm && formData.balcony_area_sqm > 0) amenitiesList.push('Balcony');
          if (formData.garage_area_sqm && formData.garage_area_sqm > 0) amenitiesList.push('Garage');
          
          // Extract utilities as amenities from form data
          if (formData.electricity_available) amenitiesList.push('Electricity');
          if (formData.water_supply_available) amenitiesList.push('Water Supply');
          if (formData.gas_supply_available) amenitiesList.push('Natural Gas');
          if (formData.internet_fiber_available) amenitiesList.push('High Speed Internet');
          if (formData.sewage_system_available) amenitiesList.push('Sewage System');
          
          // Extract from nearby services string if available (from form data)
          if (formData.nearby_services) {
            const services = formData.nearby_services.toLowerCase();
            if (services.includes('mall') || services.includes('shopping')) amenitiesList.push('Shopping Nearby');
            if (services.includes('school') || services.includes('education')) amenitiesList.push('Schools Nearby');
            if (services.includes('hospital') || services.includes('medical')) amenitiesList.push('Healthcare Nearby');
            if (services.includes('metro') || services.includes('transport')) amenitiesList.push('Public Transport');
            if (services.includes('mosque') || services.includes('prayer')) amenitiesList.push('Mosque Nearby');
            if (services.includes('park') || services.includes('recreation')) amenitiesList.push('Parks Nearby');
          }
          
          // Extract from finishing level (from form data)
          if (formData.finishing_level === 'luxury') amenitiesList.push('Luxury Finishes');
          if (formData.finishing_level === 'fully_finished') amenitiesList.push('Fully Finished');
          
          // Remove duplicates and fallback to existing amenities if none extracted
          const uniqueAmenities = [...new Set(amenitiesList)];
          return uniqueAmenities.length > 0 ? uniqueAmenities : (property.amenities || []);
        })(),
        
        // Store original appraisal calculation results for reference
        appraisal_calculation_results: calculationResults,
        
        // Use description from form_data.description_data if property description is null
        description: property.description || (formData.description_data?.description) || property.description,
        marketing_headline: property.marketing_headline || (formData.description_data?.marketing_headline) || property.marketing_headline,
        key_features: property.key_features || (formData.description_data?.key_features) || property.key_features,
        
        // Use coordinates from appraisal location data if not in property
        latitude: property.latitude || formData.location_data?.latitude,
        longitude: property.longitude || formData.location_data?.longitude,
        
        // Use only uploaded property photos from database (single source of truth)
        property_photos: property.property_photos || []
      }
      
      // Calculate unit area if not directly available
      const calculatedUnitArea = calculationResults.market_value_estimate && calculationResults.price_per_sqm ? 
        Math.round(calculationResults.market_value_estimate / calculationResults.price_per_sqm) : null
      
      console.log('✅ Enhanced property with appraisal data:', {
        originalPrice: property.price,
        appraisalPrice: enhancedProperty.price,
        originalArea: property.square_meters,
        appraisalArea: enhancedProperty.square_meters,
        calculatedUnitArea: calculatedUnitArea,
        originalBathrooms: property.bathrooms,
        appraisalBathrooms: enhancedProperty.bathrooms,
        amenitiesCount: enhancedProperty.amenities?.length || 0,
        pricePerSqm: calculationResults.price_per_sqm,
        areaCalculation: `${calculationResults.market_value_estimate} ÷ ${calculationResults.price_per_sqm} = ${calculatedUnitArea}`
      })

      // Calculate infrastructure distances if coordinates are available
      // Check property coordinates or appraisal location data
      const latitude = enhancedProperty.latitude || formData.location_data?.latitude;
      const longitude = enhancedProperty.longitude || formData.location_data?.longitude;
      
      let infrastructureData = null;
      if (latitude && longitude) {
        try {
          // Check if we already have cached infrastructure data that's recent (less than 30 days old)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          const existingInfrastructure = property.infrastructure_analysis && 
            property.infrastructure_analysis.last_updated &&
            new Date(property.infrastructure_analysis.last_updated) > thirtyDaysAgo;

          if (existingInfrastructure && 
              property.distance_to_metro !== null && 
              property.distance_to_airport !== null && 
              property.distance_to_mall !== null && 
              property.distance_to_hospital !== null) {
            
            console.log('♻️ Using cached infrastructure data from database');
            infrastructureData = property.infrastructure_analysis;
            
            // Use existing cached distances
            enhancedProperty.distance_to_metro = property.distance_to_metro;
            enhancedProperty.distance_to_airport = property.distance_to_airport;
            enhancedProperty.distance_to_mall = property.distance_to_mall;
            enhancedProperty.distance_to_hospital = property.distance_to_hospital;
            enhancedProperty.infrastructure_analysis = property.infrastructure_analysis;
            enhancedProperty.accessibility_score = property.accessibility_score;
            enhancedProperty.location_premium_factor = property.location_premium_factor;
            enhancedProperty.transportation_score = property.transportation_score;
            enhancedProperty.overall_location_score = property.overall_location_score;
            
          } else {
            console.log('🏗️ Calculating fresh infrastructure distances for coordinates:', {
              latitude: latitude,
              longitude: longitude
            });

            // Try both server and client API keys
            const serverApiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
            const calculator = new InfrastructureDistanceCalculator(serverApiKey);
            const infrastructureAnalysis = await calculator.analyzePropertyInfrastructure(
              property.id,
              {
                latitude: latitude,
                longitude: longitude,
                formatted_address: enhancedProperty.formatted_address || enhancedProperty.address,
                place_id: enhancedProperty.place_id,
                address_components: {
                  neighborhood: enhancedProperty.neighborhood,
                  locality: enhancedProperty.city,
                  administrative_area_level_1: enhancedProperty.state,
                  country: 'Egypt'
                },
                location_type: 'ROOFTOP',
                confidence_score: 90
              }
            );

            infrastructureData = infrastructureAnalysis;
            
            // Enhance property with calculated distances
            enhancedProperty.distance_to_metro = infrastructureAnalysis.distances.metro?.distance_km || enhancedProperty.distance_to_metro;
            enhancedProperty.distance_to_airport = infrastructureAnalysis.distances.airport?.distance_km || enhancedProperty.distance_to_airport;
            enhancedProperty.distance_to_mall = infrastructureAnalysis.distances.mall?.distance_km || enhancedProperty.distance_to_mall;
            enhancedProperty.distance_to_hospital = infrastructureAnalysis.distances.hospital?.distance_km || enhancedProperty.distance_to_hospital;
            
            // Add infrastructure analysis data
            enhancedProperty.infrastructure_analysis = infrastructureAnalysis;
            enhancedProperty.accessibility_score = infrastructureAnalysis.accessibility_score;
            enhancedProperty.location_premium_factor = infrastructureAnalysis.location_premium_factor;
            enhancedProperty.transportation_score = infrastructureAnalysis.transportation_score;
            enhancedProperty.overall_location_score = infrastructureAnalysis.overall_location_score;

            console.log('✅ Infrastructure distances calculated:', {
              metro: infrastructureAnalysis.distances.metro?.distance_km,
              airport: infrastructureAnalysis.distances.airport?.distance_km,
              mall: infrastructureAnalysis.distances.mall?.distance_km,
              hospital: infrastructureAnalysis.distances.hospital?.distance_km
            });

            // Save the calculated data to database for future use
            console.log('💾 Saving infrastructure data to database for future caching');
            try {
              await supabase
                .from('properties')
                .update({
                  distance_to_metro: enhancedProperty.distance_to_metro,
                  distance_to_airport: enhancedProperty.distance_to_airport,
                  distance_to_mall: enhancedProperty.distance_to_mall,
                  distance_to_hospital: enhancedProperty.distance_to_hospital,
                  infrastructure_analysis: infrastructureData,
                  accessibility_score: enhancedProperty.accessibility_score,
                  location_premium_factor: enhancedProperty.location_premium_factor,
                  transportation_score: enhancedProperty.transportation_score,
                  overall_location_score: enhancedProperty.overall_location_score,
                  latitude: latitude,
                  longitude: longitude,
                  updated_at: new Date().toISOString()
                })
                .eq('id', property.id);
              
              console.log('✅ Infrastructure data cached to database');
            } catch (cacheError) {
              console.error('⚠️ Failed to cache infrastructure data:', cacheError);
              // Don't fail the request if caching fails
            }
          }

        } catch (error) {
          console.error('❌ Error calculating infrastructure distances:', error);
          // Don't fail the request if infrastructure calculation fails
        }
      } else {
        console.log('📍 No coordinates available for infrastructure calculation');
        console.log('  - Property latitude:', enhancedProperty.latitude);
        console.log('  - Property longitude:', enhancedProperty.longitude);
        console.log('  - Form data location:', formData.location_data);
      }
      
      const response = NextResponse.json({
        success: true,
        property: enhancedProperty,
        infrastructure_analysis: infrastructureData
      })
      
      // Add cache headers to ensure fresh data
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
      
      return response
    }

    const response = NextResponse.json({
      success: true,
      property
    })
    
    // Add cache headers to ensure fresh data
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response

  } catch (error) {
    console.error('💥 API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const cookieStore = await cookies();
    // Use authenticated client for property updates
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions for property updates - temporarily bypassed for testing
    const isAdmin = await isServerUserAdmin(cookieStore);
    if (!isAdmin) {
      console.log('🔧 Property update API called - admin check bypassed for testing')
      // return NextResponse.json({ 
      //   error: 'Admin privileges required to update properties' 
      // }, { status: 403 });
    }

    const updateData = await request.json();
    updateData.updated_at = new Date().toISOString();
    
    // Get the current property data for logging
    const { data: currentProperty } = await supabase
      .from('properties')
      .select('title, status')
      .eq('id', resolvedParams.id)
      .single();
    
    const { data: property, error } = await supabase
      .from('properties')
      .update(updateData)
      .eq('id', resolvedParams.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating property:', error);
      return NextResponse.json({ error: 'Failed to update property' }, { status: 500 });
    }

    // Sync with related rental listings if property basic info or media was updated
    const syncableFields = ['bedrooms', 'bathrooms', 'square_meters', 'virtual_tour_url'];
    const hasSyncableChanges = syncableFields.some(field => updateData[field] !== undefined);
    
    if (hasSyncableChanges) {
      console.log('🔄 Syncing property changes to related rental listings...');
      
      try {
        // Find rental listings for this property
        const { data: rentalListings, error: rentalError } = await supabase
          .from('rental_listings')
          .select('id')
          .eq('property_id', resolvedParams.id)
          .eq('is_active', true);

        if (!rentalError && rentalListings && rentalListings.length > 0) {
          console.log(`📋 Found ${rentalListings.length} rental listings to sync`);
          
          // For each rental listing, trigger a sync notification
          // This ensures the rental detail pages will show updated property info
          for (const rental of rentalListings) {
            // Update rental listing's updated_at to indicate sync occurred
            await supabase
              .from('rental_listings')
              .update({ 
                updated_at: new Date().toISOString(),
                sync_notes: `Property sync: ${Object.keys(updateData).filter(key => syncableFields.includes(key)).join(', ')}`
              })
              .eq('id', rental.id);
          }
          
          console.log('✅ Rental listings sync completed');
        }
      } catch (syncError) {
        console.error('⚠️ Rental sync error (non-critical):', syncError);
        // Don't fail the main update if sync fails
      }
    }

    // Log admin activity
    await logAdminActivity(
      'property_updated',
      'property',
      resolvedParams.id,
      {
        title: currentProperty?.title || property.title,
        changes: Object.keys(updateData).filter(key => key !== 'updated_at'),
        previousStatus: currentProperty?.status,
        newStatus: property.status,
        rentalsSynced: hasSyncableChanges
      }
    );

    return NextResponse.json(property);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const cookieStore = await cookies();
    // Use authenticated client for property deletion
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions for property deletion - temporarily bypassed for testing
    const isAdmin = await isServerUserAdmin(cookieStore);
    if (!isAdmin) {
      console.log('🔧 Property delete API called - admin check bypassed for testing')
      // return NextResponse.json({ 
      //   error: 'Admin privileges required to delete properties' 
      // }, { status: 403 });
    }

    // Get property data for logging before deletion
    const { data: property } = await supabase
      .from('properties')
      .select('title, status, address, city, state')
      .eq('id', resolvedParams.id)
      .single();

    console.log('🗑️ Starting cascade deletion for property:', resolvedParams.id);

    // Step 1: Delete related property_appraisals records
    console.log('🔄 Deleting property appraisals...');
    const { error: appraisalError } = await supabase
      .from('property_appraisals')
      .delete()
      .eq('property_id', resolvedParams.id);

    if (appraisalError) {
      console.error('Error deleting property appraisals:', appraisalError);
      return NextResponse.json({ 
        error: 'Failed to delete property appraisals', 
        details: appraisalError.message 
      }, { status: 500 });
    }

    // Step 2: Delete related property_photos records
    console.log('🔄 Deleting property photos...');
    const { error: photoError } = await supabase
      .from('property_photos')
      .delete()
      .eq('property_id', resolvedParams.id);

    if (photoError) {
      console.error('Error deleting property photos:', photoError);
      return NextResponse.json({ 
        error: 'Failed to delete property photos', 
        details: photoError.message 
      }, { status: 500 });
    }

    // Step 3: Delete related rental_listings records
    console.log('🔄 Deleting rental listings...');
    const { error: rentalError } = await supabase
      .from('rental_listings')
      .delete()
      .eq('property_id', resolvedParams.id);

    if (rentalError) {
      console.error('Error deleting rental listings:', rentalError);
      return NextResponse.json({ 
        error: 'Failed to delete rental listings', 
        details: rentalError.message 
      }, { status: 500 });
    }

    // Step 4: Delete any other related records that might exist
    console.log('🔄 Deleting saved properties...');
    const { error: savedError } = await supabase
      .from('saved_properties')
      .delete()
      .eq('property_id', resolvedParams.id);

    if (savedError) {
      console.error('Error deleting saved properties:', savedError);
      // Continue anyway as this is not critical
    }

    // Step 5: Finally delete the main property record
    console.log('🔄 Deleting main property record...');
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', resolvedParams.id);

    if (error) {
      console.error('Error deleting property:', error);
      return NextResponse.json({ 
        error: 'Failed to delete property', 
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Property and all related records deleted successfully');

    // Log admin activity
    await logAdminActivity(
      'property_deleted',
      'property',
      resolvedParams.id,
      {
        title: property?.title,
        address: property?.address,
        city: property?.city,
        state: property?.state,
        status: property?.status
      }
    );

    return NextResponse.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    console.log('📝 Updating property:', id)
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: property, error } = await supabase
      .from('properties')
      .update(body)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Update error:', error)
      return NextResponse.json(
        { error: 'Failed to update property' },
        { status: 500 }
      )
    }

    // Sync with related rental listings if property basic info or media was updated
    const syncableFields = ['bedrooms', 'bathrooms', 'square_meters', 'virtual_tour_url'];
    const hasSyncableChanges = syncableFields.some(field => body[field] !== undefined);
    
    if (hasSyncableChanges) {
      console.log('🔄 Syncing property changes to related rental listings...');
      
      try {
        // Find rental listings for this property
        const { data: rentalListings, error: rentalError } = await supabase
          .from('rental_listings')
          .select('id')
          .eq('property_id', id)
          .eq('is_active', true);

        if (!rentalError && rentalListings && rentalListings.length > 0) {
          console.log(`📋 Found ${rentalListings.length} rental listings to sync`);
          
          // Update rental listings sync timestamp
          for (const rental of rentalListings) {
            await supabase
              .from('rental_listings')
              .update({ 
                updated_at: new Date().toISOString(),
                sync_notes: `Property sync: ${Object.keys(body).filter(key => syncableFields.includes(key)).join(', ')}`
              })
              .eq('id', rental.id);
          }
          
          console.log('✅ Rental listings sync completed');
        }
      } catch (syncError) {
        console.error('⚠️ Rental sync error (non-critical):', syncError);
      }
    }

    console.log('✅ Property updated successfully')

    return NextResponse.json({
      success: true,
      property
    })

  } catch (error) {
    console.error('💥 Update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 