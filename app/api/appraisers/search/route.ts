import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface SearchFilters {
  query?: string;
  location?: string;
  propertyType?: string;
  minRating?: number;
  maxPrice?: number;
  verifiedOnly?: boolean;
  availableNow?: boolean;
  sortBy?: 'rating' | 'distance' | 'price' | 'experience' | 'reviews';
  radius?: number; // in km
  certifications?: string;
  specializations?: string;
  languages?: string;
  experienceYears?: number;
  responseTime?: number;
  limit?: number;
  offset?: number;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Use the existing Google Maps geocoding API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/geocode?address=${encodeURIComponent(location)}`);
    
    if (response.ok) {
      const data = await response.json();
      if (data.coordinates) {
        return {
          lat: data.coordinates.lat,
          lng: data.coordinates.lng
        };
      }
    }
    
    // Fallback to mock coordinates for Egyptian cities if geocoding fails
    const egyptianCities: Record<string, { lat: number; lng: number }> = {
      'cairo': { lat: 30.0444, lng: 31.2357 },
      'alexandria': { lat: 31.2001, lng: 29.9187 },
      'giza': { lat: 30.0131, lng: 31.2089 },
      'sharm el sheikh': { lat: 27.9158, lng: 34.3300 },
      'hurghada': { lat: 27.2574, lng: 33.8129 },
      'luxor': { lat: 25.6872, lng: 32.6396 },
      'aswan': { lat: 24.0889, lng: 32.8998 },
    };

    const normalizedLocation = location.toLowerCase().trim();
    
    for (const [city, coords] of Object.entries(egyptianCities)) {
      if (normalizedLocation.includes(city)) {
        return coords;
      }
    }
    
    // Default to Cairo if no match found
    return egyptianCities.cairo;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  console.log('🚀 SEARCH API RELOADED - NEW VERSION');
  try {
    const { searchParams } = new URL(request.url);
    
    const filters: SearchFilters = {
      query: searchParams.get('query') || '',
      location: searchParams.get('location') || '',
      propertyType: searchParams.get('propertyType') || 'all',
      minRating: Number(searchParams.get('minRating')) || 0,
      maxPrice: Number(searchParams.get('maxPrice')) || 50000,
      verifiedOnly: searchParams.get('verifiedOnly') === 'true',
      availableNow: searchParams.get('availableNow') === 'true',
      sortBy: (searchParams.get('sortBy') as any) || 'rating',
      radius: Number(searchParams.get('radius')) || 25,
      certifications: searchParams.get('certifications') || '',
      specializations: searchParams.get('specializations') || '',
      languages: searchParams.get('languages') || '',
      experienceYears: Number(searchParams.get('experienceYears')) || 0,
      responseTime: Number(searchParams.get('responseTime')) || 168,
      limit: Number(searchParams.get('limit')) || 20,
      offset: Number(searchParams.get('offset')) || 0,
    };

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Public API - no auth required
    console.log('🔍 SEARCH DEBUG - Using service role client for public search');

    // Build the query
    let query = supabase
      .from('brokers')
      .select(`
        id,
        full_name,
        profile_headline,
        profile_summary,
        professional_headshot_url,
        valify_status,
        average_rating,
        total_reviews,
        years_of_experience,
        response_time_hours,
        service_areas,
        certifications,
        social_media_links,
        public_profile_active,
        appraiser_license_number,
        languages,
        pricing_info,
        user_id,
        created_at,
        updated_at
      `)
      .eq('public_profile_active', true)
      .eq('is_active', true);

    console.log('🔍 SEARCH DEBUG - About to run initial query with filters:', {
      public_profile_active: true,
      is_active: true,
      verifiedOnly: filters.verifiedOnly
    });

    // First, let's check what we get WITHOUT verification filter
    const { data: allActiveBrokers, error: allError } = await supabase
      .from('brokers')
      .select('id, full_name, valify_status, public_profile_active, is_active')
      .eq('public_profile_active', true)
      .eq('is_active', true);
      
    console.log('🔍 SEARCH DEBUG - ALL active public brokers:', allActiveBrokers?.map(b => ({ 
      full_name: b.full_name, 
      valify_status: b.valify_status 
    })));

    // Apply verification filter
    if (filters.verifiedOnly) {
      console.log('🔍 SEARCH DEBUG - Applying valify_status = verified filter');
      query = query.eq('valify_status', 'verified');
    }

    // Apply rating filter
    if (filters.minRating > 0) {
      query = query.gte('average_rating', filters.minRating);
    }

    // Apply text search
    if (filters.query) {
      query = query.or(`full_name.ilike.%${filters.query}%,profile_headline.ilike.%${filters.query}%,profile_summary.ilike.%${filters.query}%`);
    }

    // Apply experience filter
    if (filters.experienceYears > 0) {
      query = query.gte('years_of_experience', filters.experienceYears);
    }

    // Apply response time filter
    if (filters.responseTime < 168) {
      query = query.lte('response_time_hours', filters.responseTime);
    }

    // Execute the base query
    const { data: brokers, error } = await query;

    console.log('🔍 SEARCH DEBUG - Filters applied:', filters);
    console.log('🔍 SEARCH DEBUG - Query error:', error);
    console.log('🔍 SEARCH DEBUG - Initial query result count:', brokers?.length || 0);
    console.log('🔍 SEARCH DEBUG - Initial brokers RAW data:', brokers);
    console.log('🔍 SEARCH DEBUG - Initial brokers SUMMARY:', brokers?.map(b => ({ 
      id: b.id, 
      full_name: b.full_name, 
      valify_status: b.valify_status,
      public_profile_active: b.public_profile_active,
      is_active: b.is_active 
    })));

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to search appraisers', details: error.message },
        { status: 500 }
      );
    }

    if (!brokers || brokers.length === 0) {
      console.log('🔍 SEARCH DEBUG - No brokers found after initial query');
      return NextResponse.json({
        appraisers: [],
        totalCount: 0,
        filters: filters
      });
    }

    // Get additional data for each appraiser
    const appraisersWithDetails = [];
    
    for (const broker of brokers) {
      try {
        console.log(`🔍 SEARCH DEBUG - Processing broker: ${broker.full_name} (${broker.id})`);
        
        // Get property statistics
        const { data: propertyStats, error: statsError } = await supabase
          .from('appraiser_property_statistics')
          .select('*')
          .eq('appraiser_id', broker.id);
        
        if (statsError) {
          console.log(`🔍 SEARCH DEBUG - Stats error for ${broker.full_name}:`, statsError);
        }

        // Get services and pricing
        const { data: services, error: servicesError } = await supabase
          .from('appraiser_services')
          .select('*')
          .eq('appraiser_id', broker.id)
          .eq('is_active', true);
          
        if (servicesError) {
          console.log(`🔍 SEARCH DEBUG - Services error for ${broker.full_name}:`, servicesError);
        }

        // Get availability
        const { data: availability, error: availabilityError } = await supabase
          .from('appraiser_availability')
          .select('*')
          .eq('appraiser_id', broker.id);
          
        if (availabilityError) {
          console.log(`🔍 SEARCH DEBUG - Availability error for ${broker.full_name}:`, availabilityError);
        }

        // Determine property types from statistics
        let propertyTypes = propertyStats?.map(stat => stat.property_type) || [];
        
        // If no property stats, assign default property types so they appear in searches
        if (propertyTypes.length === 0) {
          propertyTypes = ['residential', 'commercial']; // Default types for new appraisers
        }
        
        console.log(`🔍 SEARCH DEBUG - ${broker.full_name} property stats:`, propertyStats?.length || 0, 'resulting types:', propertyTypes);
        
        // Set default price range (no longer requiring services)
        const priceRange = { min: 1000, max: 5000, currency: 'EGP' };

        // Check current availability (handle null safely)
        const today = new Date().getDay();
        const todayAvailability = availability?.find(slot => slot.day_of_week === today && slot.is_available);
        const isAvailableNow = !!todayAvailability;

        // Mock location data - in production, store actual coordinates
        const mockLocation = {
          lat: 30.0444 + (Math.random() - 0.5) * 0.1, // Cairo area
          lng: 31.2357 + (Math.random() - 0.5) * 0.1,
          address: (broker.service_areas && broker.service_areas.length > 0) ? broker.service_areas[0] : 'Cairo, Egypt'
        };

        // Ensure all required fields are present and safe
        const enrichedBroker = {
          ...broker,
          // Safe defaults for null values
          average_rating: broker.average_rating || 0,
          total_reviews: broker.total_reviews || 0,
          years_of_experience: broker.years_of_experience || 0,
          response_time_hours: broker.response_time_hours || 24,
          certifications: broker.certifications || [],
          languages: broker.languages || [],
          service_areas: broker.service_areas || ['Cairo'],
          // Computed fields
          property_types: propertyTypes,
          price_range: priceRange,
          location: mockLocation,
          is_available_now: isAvailableNow,
          total_appraisals: propertyStats?.reduce((sum, stat) => sum + (stat.properties_appraised || 0), 0) || 0,
          next_available_date: isAvailableNow ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        
        console.log(`🔍 SEARCH DEBUG - Successfully processed ${broker.full_name}`);
        appraisersWithDetails.push(enrichedBroker);
        
      } catch (error) {
        console.error(`🔍 SEARCH DEBUG - Error processing ${broker.full_name}:`, error);
        // Continue with next broker even if this one fails
      }
    }

    console.log('🔍 SEARCH DEBUG - After data enrichment count:', appraisersWithDetails?.length || 0);
    console.log('🔍 SEARCH DEBUG - After data enrichment:', appraisersWithDetails?.map(a => ({ 
      id: a.id, 
      full_name: a.full_name, 
      valify_status: a.valify_status,
      is_available_now: a.is_available_now,
      property_types: a.property_types?.length || 0
    })));

    // Apply additional filters
    let filteredAppraisers = appraisersWithDetails;

    // Property type filter
    if (filters.propertyType && filters.propertyType !== 'all') {
      const beforeCount = filteredAppraisers.length;
      filteredAppraisers = filteredAppraisers.filter(appraiser => 
        appraiser.property_types.includes(filters.propertyType!)
      );
      console.log(`🔍 SEARCH DEBUG - Property type filter (${filters.propertyType}): ${beforeCount} → ${filteredAppraisers.length}`);
      console.log('🔍 SEARCH DEBUG - Remaining after property filter:', filteredAppraisers.map(a => ({ 
        full_name: a.full_name, 
        property_types: a.property_types 
      })));
    }

    // Price filter
    if (filters.maxPrice) {
      filteredAppraisers = filteredAppraisers.filter(appraiser => 
        appraiser.price_range.min <= filters.maxPrice!
      );
    }

    // Availability filter
    if (filters.availableNow) {
      filteredAppraisers = filteredAppraisers.filter(appraiser => 
        appraiser.is_available_now
      );
    }

    // Location-based filtering and distance calculation
    let userLocation: { lat: number; lng: number } | null = null;
    if (filters.location) {
      userLocation = await geocodeLocation(filters.location);
      
      if (userLocation) {
        // Calculate distances and filter by radius
        filteredAppraisers = filteredAppraisers
          .map(appraiser => ({
            ...appraiser,
            distance: calculateDistance(
              userLocation!.lat,
              userLocation!.lng,
              appraiser.location.lat,
              appraiser.location.lng
            )
          }))
          .filter(appraiser => appraiser.distance! <= filters.radius!);
      }
    }

    // Advanced filters for JSONB fields
    // Certifications filter
    if (filters.certifications) {
      const certNames = filters.certifications.split(',').map(cert => cert.trim());
      filteredAppraisers = filteredAppraisers.filter(appraiser => {
        const appraiserCerts = appraiser.certifications || [];
        return certNames.some(certName => 
          appraiserCerts.some((cert: any) => 
            cert.name && cert.name.toLowerCase().includes(certName.toLowerCase())
          )
        );
      });
    }

    // Specializations filter (property types)
    if (filters.specializations) {
      const specNames = filters.specializations.split(',').map(spec => spec.trim().toLowerCase());
      filteredAppraisers = filteredAppraisers.filter(appraiser => 
        specNames.some(specName => 
          appraiser.property_types.some(type => 
            type.toLowerCase().includes(specName)
          )
        )
      );
    }

    // Languages filter
    if (filters.languages) {
      const langNames = filters.languages.split(',').map(lang => lang.trim().toLowerCase());
      filteredAppraisers = filteredAppraisers.filter(appraiser => {
        const appraiserLangs = appraiser.languages || [];
        return langNames.some(langName => 
          appraiserLangs.some((lang: string) => 
            lang.toLowerCase().includes(langName)
          )
        );
      });
    }

    // Sorting
    switch (filters.sortBy) {
      case 'rating':
        filteredAppraisers.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        break;
      case 'distance':
        if (userLocation) {
          filteredAppraisers.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }
        break;
      case 'price':
        filteredAppraisers.sort((a, b) => a.price_range.min - b.price_range.min);
        break;
      case 'experience':
        filteredAppraisers.sort((a, b) => (b.years_of_experience || 0) - (a.years_of_experience || 0));
        break;
      case 'reviews':
        filteredAppraisers.sort((a, b) => (b.total_reviews || 0) - (a.total_reviews || 0));
        break;
    }

    // Pagination
    const totalCount = filteredAppraisers.length;
    const paginatedAppraisers = filteredAppraisers.slice(
      filters.offset!,
      filters.offset! + filters.limit!
    );

    console.log('🔍 SEARCH DEBUG - FINAL RESULTS:');
    console.log('🔍 SEARCH DEBUG - Total after all filters:', totalCount);
    console.log('🔍 SEARCH DEBUG - Final appraisers:', paginatedAppraisers.map(a => ({ 
      id: a.id, 
      full_name: a.full_name, 
      valify_status: a.valify_status 
    })));

    return NextResponse.json({
      appraisers: paginatedAppraisers,
      totalCount,
      filters,
      userLocation
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}