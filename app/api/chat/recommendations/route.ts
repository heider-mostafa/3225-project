import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { query, userId, maxResults = 3 } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Parse search criteria from natural language query
    const searchCriteria = parseSearchQuery(query);
    
    // Build database query based on parsed criteria
    let dbQuery = supabase
      .from('properties')
      .select(`
        id,
        title,
        price,
        bedrooms,
        bathrooms,
        square_meters,
        address,
        city,
        state,
        property_type,
        status,
        compound,
        property_photos (
          url,
          is_primary,
          order_index
        )
      `)
      .eq('status', 'For Sale') // Only show available properties
      .limit(maxResults);

    // Apply filters based on search criteria
    if (searchCriteria.bedrooms) {
      dbQuery = dbQuery.eq('bedrooms', searchCriteria.bedrooms);
    }
    
    if (searchCriteria.bathrooms) {
      dbQuery = dbQuery.eq('bathrooms', searchCriteria.bathrooms);
    }
    
    if (searchCriteria.propertyType) {
      dbQuery = dbQuery.ilike('property_type', `%${searchCriteria.propertyType}%`);
    }
    
    if (searchCriteria.maxPrice) {
      dbQuery = dbQuery.lte('price', searchCriteria.maxPrice);
    }
    
    if (searchCriteria.minPrice) {
      dbQuery = dbQuery.gte('price', searchCriteria.minPrice);
    }
    
    if (searchCriteria.city) {
      dbQuery = dbQuery.ilike('city', `%${searchCriteria.city}%`);
    }
    
    if (searchCriteria.hasPool) {
      dbQuery = dbQuery.eq('has_pool', true);
    }
    
    if (searchCriteria.hasGarden) {
      dbQuery = dbQuery.eq('has_garden', true);
    }
    
    if (searchCriteria.hasParking) {
      dbQuery = dbQuery.eq('has_parking', true);
    }
    
    if (searchCriteria.hasGym) {
      dbQuery = dbQuery.eq('has_gym', true);
    }
    
    if (searchCriteria.furnished) {
      dbQuery = dbQuery.eq('furnished', true);
    }

    // Execute query
    const { data: properties, error } = await dbQuery;

    if (error) {
      console.error('Error fetching property recommendations:', error);
      return NextResponse.json({ error: 'Failed to fetch recommendations' }, { status: 500 });
    }

    // Format properties for chat response
    const recommendations = properties?.map(property => ({
      id: property.id,
      title: property.title,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      sqm: property.square_meters,
      address: property.address,
      city: property.city,
      state: property.state,
      propertyType: property.property_type,
      status: property.status,
      compound: property.compound,
      photos: property.property_photos?.filter(p => p.is_primary).map(p => p.url) || [],
      pricePerSqm: Math.round((property.price || 0) / (property.square_meters || 100))
    })) || [];

    // Generate AI response text
    const responseText = generateRecommendationResponse(query, recommendations, searchCriteria);

    return NextResponse.json({
      query,
      recommendations,
      responseText,
      count: recommendations.length,
      searchCriteria,
      // Flag to show WhatsApp sharing option
      canShareViaWhatsApp: true
    });

  } catch (error) {
    console.error('Unexpected error in recommendations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to parse natural language search queries
function parseSearchQuery(query: string): any {
  const lowerQuery = query.toLowerCase();
  const criteria: any = {};

  // Extract bedrooms
  const bedroomMatch = lowerQuery.match(/(\d+)\s*bedroom/);
  if (bedroomMatch) {
    criteria.bedrooms = parseInt(bedroomMatch[1]);
  }

  // Extract bathrooms
  const bathroomMatch = lowerQuery.match(/(\d+)\s*bathroom/);
  if (bathroomMatch) {
    criteria.bathrooms = parseInt(bathroomMatch[1]);
  }

  // Extract property type
  if (lowerQuery.includes('apartment') || lowerQuery.includes('flat')) {
    criteria.propertyType = 'Apartment';
  } else if (lowerQuery.includes('villa')) {
    criteria.propertyType = 'Villa';
  } else if (lowerQuery.includes('house')) {
    criteria.propertyType = 'House';
  } else if (lowerQuery.includes('penthouse')) {
    criteria.propertyType = 'Penthouse';
  } else if (lowerQuery.includes('studio')) {
    criteria.propertyType = 'Studio';
  }

  // Extract price range
  const priceMatch = lowerQuery.match(/under\s*\$?(\d+(?:,\d+)*(?:k|000)?)/);
  if (priceMatch) {
    let price = priceMatch[1].replace(/,/g, '');
    if (price.endsWith('k')) {
      price = price.slice(0, -1) + '000';
    }
    criteria.maxPrice = parseInt(price);
  }

  // Extract cities
  if (lowerQuery.includes('cairo')) criteria.city = 'Cairo';
  if (lowerQuery.includes('giza')) criteria.city = 'Giza';
  if (lowerQuery.includes('alexandria')) criteria.city = 'Alexandria';
  if (lowerQuery.includes('sheikh zayed')) criteria.city = 'Sheikh Zayed';
  if (lowerQuery.includes('new cairo')) criteria.city = 'New Cairo';

  // Extract amenities
  if (lowerQuery.includes('pool')) criteria.hasPool = true;
  if (lowerQuery.includes('garden')) criteria.hasGarden = true;
  if (lowerQuery.includes('parking')) criteria.hasParking = true;
  if (lowerQuery.includes('gym')) criteria.hasGym = true;
  if (lowerQuery.includes('furnished')) criteria.furnished = true;

  return criteria;
}

// Helper function to extract property features
function extractFeatures(property: any): string[] {
  const features = [];
  
  if (property.has_pool) features.push('Swimming Pool');
  if (property.has_garden) features.push('Garden');
  if (property.has_parking) features.push('Parking');
  if (property.has_gym) features.push('Gym');
  if (property.furnished) features.push('Furnished');
  
  // Add amenities if they exist
  if (property.amenities && Array.isArray(property.amenities)) {
    features.push(...property.amenities);
  }
  
  return features;
}

// Helper function to generate WhatsApp sharing URL
function generateWhatsAppUrl(property: any): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://virtualestate.com';
  const propertyUrl = `${baseUrl}/property/${property.id}`;
  const message = `Check out this ${property.property_type} in ${property.city}!\n\n${property.title}\nPrice: ${property.price}\n${property.bedrooms} bed, ${property.bathrooms} bath\n\n${propertyUrl}`;
  
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// Helper function to generate AI response text
function generateRecommendationResponse(query: string, recommendations: any[], criteria: any): string {
  if (recommendations.length === 0) {
    return `I couldn't find any properties matching "${query}". Would you like me to search with different criteria or show you similar options?`;
  }

  const criteriaText = Object.entries(criteria)
    .filter(([key, value]) => value)
    .map(([key, value]) => {
      switch (key) {
        case 'bedrooms': return `${value as number} bedroom${(value as number) > 1 ? 's' : ''}`;
        case 'bathrooms': return `${value as number} bathroom${(value as number) > 1 ? 's' : ''}`;
        case 'hasPool': return 'with pool';
        case 'hasGarden': return 'with garden';
        case 'hasParking': return 'with parking';
        case 'hasGym': return 'with gym';
        case 'furnished': return 'furnished';
        case 'city': return `in ${value as string}`;
        case 'propertyType': return (value as string).toLowerCase();
        case 'maxPrice': return `under $${(value as number).toLocaleString()}`;
        default: return '';
      }
    })
    .filter(Boolean)
    .join(', ');

  return `Great! I found ${recommendations.length} propert${recommendations.length > 1 ? 'ies' : 'y'} ${criteriaText ? `matching your criteria (${criteriaText})` : 'for you'}. Here are my top recommendations:\n\nWould you like me to send these property links to your WhatsApp?`;
} 