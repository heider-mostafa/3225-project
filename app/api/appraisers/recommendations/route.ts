import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface RecommendationRequest {
  property_type: string;
  location: string;
  neighborhood?: string;
  property_size?: number;
  property_value?: number;
  limit?: number;
}

interface RecommendedAppraiser {
  id: string;
  full_name: string;
  profile_headline?: string;
  professional_headshot_url?: string;
  valify_status: string;
  average_rating?: number;
  total_reviews?: number;
  years_of_experience?: number;
  appraiser_license_number?: string;
  response_time_hours?: number;
  service_areas?: string[];
  property_types: string[];
  price_range: {
    min: number;
    max: number;
    currency: string;
  };
  distance?: number;
  location: {
    address: string;
  };
  is_available_now: boolean;
  specialization_match: number; // 0-100 match score
}

function calculateSpecializationMatch(
  appraiserPropertyTypes: string[],
  requestedPropertyType: string,
  appraiserServiceAreas: string[],
  requestedLocation: string,
  neighborhood?: string
): number {
  let score = 0;
  
  // Property type match (50% weight)
  if (appraiserPropertyTypes.includes(requestedPropertyType)) {
    score += 50;
  } else if (appraiserPropertyTypes.includes('all') || appraiserPropertyTypes.length === 0) {
    score += 25; // Partial match for general appraisers
  }
  
  // Location/service area match (30% weight)
  const locationLower = requestedLocation.toLowerCase();
  const neighborhoodLower = neighborhood?.toLowerCase();
  
  for (const area of appraiserServiceAreas) {
    const areaLower = area.toLowerCase();
    if (areaLower.includes(locationLower) || locationLower.includes(areaLower)) {
      score += 30;
      break;
    }
    if (neighborhoodLower && (areaLower.includes(neighborhoodLower) || neighborhoodLower.includes(areaLower))) {
      score += 15; // Neighborhood match gets half points
      break;
    }
  }
  
  // Experience bonus (20% weight)
  score += Math.min(20, 1); // Basic experience bonus for now
  
  return Math.min(100, score);
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
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
      'new cairo': { lat: 30.0330, lng: 31.4913 },
      'maadi': { lat: 29.9576, lng: 31.2644 },
      'zamalek': { lat: 30.0626, lng: 31.2208 },
      'dokki': { lat: 30.0383, lng: 31.2019 },
      'mohandessin': { lat: 30.0644, lng: 31.2053 },
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

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json();
    
    const {
      property_type,
      location,
      neighborhood,
      property_size,
      property_value,
      limit = 3
    } = body;

    if (!property_type || !location) {
      return NextResponse.json(
        { error: 'Property type and location are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get all active verified appraisers
    const { data: brokers, error } = await supabase
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
        public_profile_active,
        appraiser_license_number,
        languages,
        pricing_info
      `)
      .eq('public_profile_active', true)
      .eq('is_active', true)
      .gte('average_rating', 3.0); // Only recommend highly rated appraisers

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appraisers' },
        { status: 500 }
      );
    }

    if (!brokers || brokers.length === 0) {
      return NextResponse.json({
        appraisers: [],
        totalCount: 0,
        message: 'No qualified appraisers found'
      });
    }

    // Enhance appraisers with detailed data and calculate recommendations
    const propertyLocation = await geocodeLocation(location);
    
    const recommendedAppraisers = await Promise.all(
      brokers.map(async (broker): Promise<RecommendedAppraiser | null> => {
        // Get property statistics to determine specializations
        const { data: propertyStats } = await supabase
          .from('appraiser_property_statistics')
          .select('*')
          .eq('appraiser_id', broker.id);

        // Get services and pricing
        const { data: services } = await supabase
          .from('appraiser_services')
          .select('*')
          .eq('appraiser_id', broker.id)
          .eq('is_active', true);

        // Get availability
        const { data: availability } = await supabase
          .from('appraiser_availability')
          .select('*')
          .eq('appraiser_id', broker.id);

        // Determine property types from statistics
        const propertyTypes = propertyStats?.map(stat => stat.property_type) || ['all'];
        
        // Calculate price range from services
        let priceRange = { min: 1000, max: 5000, currency: 'EGP' };
        if (services && services.length > 0) {
          const prices = services.map(s => s.price_range).filter(Boolean);
          if (prices.length > 0) {
            const allPrices = prices.flatMap(p => [p.min, p.max]).filter(Boolean);
            priceRange = {
              min: Math.min(...allPrices),
              max: Math.max(...allPrices),
              currency: 'EGP'
            };
          }
        }

        // Check current availability
        const today = new Date().getDay();
        const todayAvailability = availability?.find(slot => slot.day_of_week === today && slot.is_available);
        const isAvailableNow = !!todayAvailability;

        // Calculate specialization match
        const specializationMatch = calculateSpecializationMatch(
          propertyTypes,
          property_type,
          broker.service_areas || [],
          location,
          neighborhood
        );

        // Only include appraisers with decent match (30%+)
        if (specializationMatch < 30) {
          return null;
        }

        // Mock location data - in production, store actual coordinates
        const mockLocation = {
          lat: 30.0444 + (Math.random() - 0.5) * 0.1, // Cairo area
          lng: 31.2357 + (Math.random() - 0.5) * 0.1,
          address: broker.service_areas?.[0] || 'Cairo, Egypt'
        };

        // Calculate distance if property location is available
        let distance: number | undefined;
        if (propertyLocation) {
          distance = calculateDistance(
            propertyLocation.lat,
            propertyLocation.lng,
            mockLocation.lat,
            mockLocation.lng
          );
        }

        return {
          id: broker.id,
          full_name: broker.full_name,
          profile_headline: broker.profile_headline,
          professional_headshot_url: broker.professional_headshot_url,
          valify_status: broker.valify_status,
          average_rating: broker.average_rating,
          total_reviews: broker.total_reviews,
          years_of_experience: broker.years_of_experience,
          appraiser_license_number: broker.appraiser_license_number,
          response_time_hours: broker.response_time_hours,
          service_areas: broker.service_areas,
          property_types: propertyTypes,
          price_range: priceRange,
          location: { address: mockLocation.address },
          is_available_now: isAvailableNow,
          specialization_match: specializationMatch,
          distance
        };
      })
    );

    // Filter out null results and sort by recommendation score
    const validRecommendations = recommendedAppraisers
      .filter((appraiser): appraiser is RecommendedAppraiser => appraiser !== null)
      .sort((a, b) => {
        // Sort by specialization match (primary), then rating, then distance
        if (b.specialization_match !== a.specialization_match) {
          return b.specialization_match - a.specialization_match;
        }
        if ((b.average_rating || 0) !== (a.average_rating || 0)) {
          return (b.average_rating || 0) - (a.average_rating || 0);
        }
        return (a.distance || 999) - (b.distance || 999);
      })
      .slice(0, limit);

    return NextResponse.json({
      appraisers: validRecommendations,
      totalCount: validRecommendations.length,
      criteria: {
        property_type,
        location,
        neighborhood,
        property_size,
        property_value
      }
    });

  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}