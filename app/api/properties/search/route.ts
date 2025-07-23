import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase/server'
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = await createServerSupabaseClient();

    const { searchParams } = new URL(request.url);
    
    // Extract all possible filter parameters
    const search_query = searchParams.get('search_query') || searchParams.get('q');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const propertyTypes = searchParams.getAll('propertyType');
    const bedrooms = searchParams.getAll('bedrooms');
    const bathrooms = searchParams.getAll('bathrooms');
    const minSqm = searchParams.get('minSqm');
    const maxSqm = searchParams.get('maxSqm');
    const cities = searchParams.getAll('city');
    const state = searchParams.get('state');
    const compound = searchParams.get('compound');
    const furnished = searchParams.get('furnished');
    
    console.log('Search API params:', {
      search_query, minPrice, maxPrice, propertyTypes, bedrooms, bathrooms,
      cities, state, compound, furnished
    });
    
    // Amenity filters (using our new database schema)
    const amenityFilters = [
      'has_pool', 'has_garden', 'has_security', 'has_parking', 
      'has_gym', 'has_playground', 'has_community_center'
    ];
    const selectedAmenities = amenityFilters.filter(amenity => 
      searchParams.get(amenity) === 'true'
    );
    
    // Distance filters
    const maxDistanceToMetro = searchParams.get('maxDistanceToMetro');
    const maxDistanceToAirport = searchParams.get('maxDistanceToAirport');
    const maxDistanceToMall = searchParams.get('maxDistanceToMall');
    const maxDistanceToHospital = searchParams.get('maxDistanceToHospital');
    
    // Geographic search parameters
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const radius_km = searchParams.get('radius_km') || '10';
    
    // Sorting and pagination
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    let properties: any[] = [];
    let count = 0;

    // If we have geographic coordinates, use spatial search
    if (latitude && longitude) {
      try {
        const { data: spatialResults, error: spatialError } = await supabase
          .rpc('search_properties_near_point', {
            lat: parseFloat(latitude),
            lng: parseFloat(longitude),
            radius_km: parseFloat(radius_km),
            limit_count: 100
          });

        if (spatialError) {
          console.error('Spatial search error:', spatialError);
          // Fall back to regular search
        } else {
          // Get full property details for spatial results
          const propertyIds = spatialResults?.map((r: any) => r.property_id) || [];
          if (propertyIds.length > 0) {
            let spatialQuery = supabase
              .from('properties')
              .select(`
                *,
                property_photos(*)
              `)
              .in('id', propertyIds);

            // Apply additional filters to spatial results
            if (minPrice) spatialQuery = spatialQuery.gte('price', minPrice);
            if (maxPrice) spatialQuery = spatialQuery.lte('price', maxPrice);
            if (propertyTypes.length > 0) {
              // Use case-insensitive matching for property types  
              const typeFilter = propertyTypes.map(type => `property_type.ilike.${type}`).join(',');
              spatialQuery = spatialQuery.or(typeFilter);
            }
            if (bedrooms.length > 0) spatialQuery = spatialQuery.in('bedrooms', bedrooms.map(b => parseInt(b)));
            if (bathrooms.length > 0) spatialQuery = spatialQuery.in('bathrooms', bathrooms.map(b => parseInt(b)));

            const { data, error } = await spatialQuery;
            if (!error && data) {
              properties = data;
              count = data.length;
            }
          }
        }
      } catch (error) {
        console.error('Geographic search error:', error);
      }
    }

    // If no geographic search or it failed, use regular search
    if (properties.length === 0) {
      let regularQuery = supabase
        .from('properties')
        .select(`
          *,
          property_photos(*)
        `, { count: 'exact' });

      // Text search
      if (search_query) {
        regularQuery = regularQuery.or(
          `title.ilike.%${search_query}%,description.ilike.%${search_query}%,address.ilike.%${search_query}%,city.ilike.%${search_query}%,state.ilike.%${search_query}%`
        );
      }

      // Apply filters
      if (minPrice) regularQuery = regularQuery.gte('price', minPrice);
      if (maxPrice) regularQuery = regularQuery.lte('price', maxPrice);
      if (propertyTypes.length > 0) {
        // Use case-insensitive matching for property types
        const typeFilter = propertyTypes.map(type => `property_type.ilike.${type}`).join(',');
        regularQuery = regularQuery.or(typeFilter);
      }
      if (bedrooms.length > 0) regularQuery = regularQuery.in('bedrooms', bedrooms.map(b => parseInt(b)));
      if (bathrooms.length > 0) regularQuery = regularQuery.in('bathrooms', bathrooms.map(b => parseInt(b)));
      if (minSqm) regularQuery = regularQuery.gte('square_meters', minSqm);
      if (maxSqm) regularQuery = regularQuery.lte('square_meters', maxSqm);
      if (cities.length > 0) {
        // Use case-insensitive matching for cities to handle formatting differences
        const cityFilter = cities.map(city => `city.ilike.%${city}%`).join(',');
        regularQuery = regularQuery.or(cityFilter);
      }
      if (state) regularQuery = regularQuery.eq('state', state);
      if (compound) regularQuery = regularQuery.ilike('compound', `%${compound}%`);
      if (furnished) regularQuery = regularQuery.eq('furnished', furnished === 'true');

      // Amenity filters
      selectedAmenities.forEach(amenity => {
        regularQuery = regularQuery.eq(amenity, true);
      });

      // Distance filters (if columns exist)
      if (maxDistanceToMetro) regularQuery = regularQuery.lte('distance_to_metro', maxDistanceToMetro);
      if (maxDistanceToAirport) regularQuery = regularQuery.lte('distance_to_airport', maxDistanceToAirport);
      if (maxDistanceToMall) regularQuery = regularQuery.lte('distance_to_mall', maxDistanceToMall);
      if (maxDistanceToHospital) regularQuery = regularQuery.lte('distance_to_hospital', maxDistanceToHospital);

      // Apply sorting
      regularQuery = regularQuery.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      regularQuery = regularQuery.range(from, to);

      console.log('About to execute query with filters:', {
        cities, propertyTypes, bedrooms, bathrooms, minPrice, maxPrice
      });

      const { data, error, count: totalCount } = await regularQuery;

      if (error) {
        console.error('Supabase query error:', error);
        return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
      }

      console.log('Query results:', { count: totalCount, propertiesFound: data?.length });

      properties = data || [];
      count = totalCount || 0;
    }

    // Log search activity if user is authenticated
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && (search_query || latitude)) {
        const filters = {
          minPrice, maxPrice, propertyTypes, bedrooms, bathrooms,
          cities, amenities: selectedAmenities, latitude, longitude, radius_km
        };

        await supabase.rpc('log_search_activity', {
          p_user_id: session.user.id,
          p_search_query: search_query || `Location: ${latitude},${longitude}`,
          p_filters: filters,
          p_results_count: count
        });
      }
    } catch (logError) {
      console.error('Error logging search activity:', logError);
      // Don't fail the search if logging fails
    }

    return NextResponse.json({
      properties,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
      searchType: latitude && longitude ? 'geographic' : 'text',
      filters: {
        search_query, minPrice, maxPrice, propertyTypes, bedrooms, bathrooms,
        cities, amenities: selectedAmenities, latitude, longitude, radius_km
      }
    });
  } catch (error) {
    console.error('Unexpected error in search endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 