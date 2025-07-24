import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { query, message, userId, maxResults = 3, isPropertySearch = false } = await request.json();

    // Handle both query and message parameters for flexibility
    const searchQuery = query || message;
    
    if (!searchQuery) {
      return NextResponse.json(
        { error: 'Query or message is required' },
        { status: 400 }
      );
    }

    // Parse search criteria from natural language query
    const searchCriteria = parseSearchQuery(searchQuery);
    console.log('Parsed search criteria:', searchCriteria);
    
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
        has_pool,
        has_garden,
        has_parking,
        has_gym,
        has_balcony,
        has_elevator,
        has_security,
        furnished,
        property_photos (
          url,
          is_primary,
          order_index
        )
      `)
      .in('status', ['for_sale', 'for_rent', 'For Sale', 'available', 'active']) // Include all possible status values
      .limit(maxResults);

    // Apply filters based on search criteria
    if (searchCriteria.bedrooms) {
      dbQuery = dbQuery.eq('bedrooms', searchCriteria.bedrooms);
    }
    
    if (searchCriteria.bathrooms) {
      dbQuery = dbQuery.eq('bathrooms', searchCriteria.bathrooms);
    }
    
    if (searchCriteria.propertyType) {
      // Use case-insensitive matching for property types
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
    
    if (searchCriteria.hasBalcony) {
      dbQuery = dbQuery.eq('has_balcony', true);
    }
    
    if (searchCriteria.hasElevator) {
      dbQuery = dbQuery.eq('has_elevator', true);
    }
    
    if (searchCriteria.hasSecurity) {
      dbQuery = dbQuery.eq('has_security', true);
    }

    // Apply sorting based on criteria
    if (searchCriteria.sortBy === 'price_asc') {
      dbQuery = dbQuery.order('price', { ascending: true });
    } else {
      dbQuery = dbQuery.order('price', { ascending: true }); // Default to cheapest first
    }

    // Execute query
    const { data: properties, error } = await dbQuery;

    if (error) {
      console.error('Database query error:', error);
      return NextResponse.json({ 
        error: 'Database connection issue',
        recommendations: [],
        responseText: "I'm having trouble accessing our property database right now. Please try again in a moment or contact support.",
        count: 0,
        searchCriteria
      }, { status: 500 });
    }

    // Handle empty results with helpful message
    if (!properties || properties.length === 0) {
      return NextResponse.json({
        query: searchQuery,
        recommendations: [],
        responseText: `I couldn't find any properties matching "${searchQuery}". Try adjusting your search criteria - perhaps a different location, price range, or property type?`,
        count: 0,
        searchCriteria,
        canShareViaWhatsApp: false
      });
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
      // FIX: ChatBot component expects 'image' field, not 'photos' array
      image: property.property_photos?.find(p => p.is_primary)?.url || '/placeholder-property.jpg',
      link: `/property/${property.id}`,
      // FIX: Add features array that ChatBot component expects
      features: extractFeatures(property),
      pricePerSqm: Math.round((property.price || 0) / (property.square_meters || 100))
    })) || [];

    // Generate AI response text
    const responseText = generateRecommendationResponse(searchQuery, recommendations, searchCriteria);

    return NextResponse.json({
      query: searchQuery,
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
    criteria.propertyType = 'apartment';
  } else if (lowerQuery.includes('villa') || lowerQuery.includes('house')) {
    criteria.propertyType = 'villa'; // Map house to villa as it's more appropriate
  } else if (lowerQuery.includes('penthouse')) {
    criteria.propertyType = 'penthouse';
  } else if (lowerQuery.includes('studio')) {
    criteria.propertyType = 'studio';
  } else if (lowerQuery.includes('townhouse')) {
    criteria.propertyType = 'townhouse';
  } else if (lowerQuery.includes('commercial') || lowerQuery.includes('office') || lowerQuery.includes('retail')) {
    criteria.propertyType = 'commercial';
  }

  // Extract price range - support multiple formats including millions
  const priceMatch = lowerQuery.match(/under\s*\$?(\d+(?:\.\d+)?)\s*(million|mil|m)\b/) ||
                    lowerQuery.match(/below\s*\$?(\d+(?:\.\d+)?)\s*(million|mil|m)\b/) ||
                    lowerQuery.match(/maximum\s*\$?(\d+(?:\.\d+)?)\s*(million|mil|m)\b/) ||
                    lowerQuery.match(/budget\s*\$?(\d+(?:\.\d+)?)\s*(million|mil|m)\b/) ||
                    lowerQuery.match(/under\s*\$?(\d+(?:,\d+)*(?:k|000)?)/) || 
                    lowerQuery.match(/below\s*\$?(\d+(?:,\d+)*(?:k|000)?)/) ||
                    lowerQuery.match(/maximum\s*\$?(\d+(?:,\d+)*(?:k|000)?)/) ||
                    lowerQuery.match(/budget\s*\$?(\d+(?:,\d+)*(?:k|000)?)/); 
  if (priceMatch) {
    let price = priceMatch[1].replace(/,/g, '');
    const unit = priceMatch[2];
    
    // Handle millions
    if (unit && (unit === 'million' || unit === 'mil' || unit === 'm')) {
      criteria.maxPrice = parseFloat(price) * 1000000;
    } else {
      // Handle thousands
      if (price.endsWith('k')) {
        price = price.slice(0, -1) + '000';
      }
      criteria.maxPrice = parseInt(price);
    }
  }

  // Handle "cheapest" queries - sort by price ascending
  if (lowerQuery.includes('cheapest') || lowerQuery.includes('lowest price') || lowerQuery.includes('most affordable')) {
    criteria.sortBy = 'price_asc';
  }

  // Handle "down payment" queries - these usually want lowest price options
  if (lowerQuery.includes('down payment') || lowerQuery.includes('downpayment')) {
    criteria.sortBy = 'price_asc';
    criteria.isDownPaymentQuery = true;
  }

  // Extract cities (order matters - check more specific names first)
  if (lowerQuery.includes('new cairo')) criteria.city = 'New Cairo';
  else if (lowerQuery.includes('sheikh zayed') || lowerQuery.includes('zayed')) criteria.city = 'Sheikh Zayed';
  else if (lowerQuery.includes('new administrative capital') || lowerQuery.includes('new capital')) criteria.city = 'New Administrative Capital';
  else if (lowerQuery.includes('6th of october') || lowerQuery.includes('sixth of october')) criteria.city = '6th of October';
  else if (lowerQuery.includes('north coast') || lowerQuery.includes('sahel')) criteria.city = 'North Coast';
  else if (lowerQuery.includes('sidi bishr')) criteria.city = 'Sidi Bishr';
  else if (lowerQuery.includes('zamalek')) criteria.city = 'Zamalek';
  else if (lowerQuery.includes('marina')) criteria.city = 'Marina';
  else if (lowerQuery.includes('maadi')) criteria.city = 'Maadi';
  else if (lowerQuery.includes('downtown')) criteria.city = 'Downtown';
  else if (lowerQuery.includes('degla')) criteria.city = 'Degla';
  else if (lowerQuery.includes('heliopolis')) criteria.city = 'Heliopolis';
  else if (lowerQuery.includes('mohandessin')) criteria.city = 'Mohandessin';
  else if (lowerQuery.includes('alexandria')) criteria.city = 'Alexandria';
  else if (lowerQuery.includes('cairo')) criteria.city = 'Cairo';
  else if (lowerQuery.includes('giza')) criteria.city = 'Giza';

  // Extract amenities - with more variations
  if (lowerQuery.includes('pool') || lowerQuery.includes('swimming')) {
    criteria.hasPool = true;
    console.log('🏊 Pool amenity detected in query:', lowerQuery);
  }
  if (lowerQuery.includes('garden') || lowerQuery.includes('yard')) criteria.hasGarden = true;
  if (lowerQuery.includes('parking') || lowerQuery.includes('garage')) criteria.hasParking = true;
  if (lowerQuery.includes('gym') || lowerQuery.includes('fitness')) criteria.hasGym = true;
  if (lowerQuery.includes('furnished') || lowerQuery.includes('furniture')) criteria.furnished = true;
  if (lowerQuery.includes('balcony')) criteria.hasBalcony = true;
  if (lowerQuery.includes('elevator') || lowerQuery.includes('lift')) criteria.hasElevator = true;
  if (lowerQuery.includes('security')) criteria.hasSecurity = true;

  return criteria;
}

// Helper function to extract property features
function extractFeatures(property: any): string[] {
  const features = [];
  
  if (property.has_pool) features.push('Swimming Pool');
  if (property.has_garden) features.push('Garden');
  if (property.has_parking) features.push('Parking');
  if (property.has_gym) features.push('Gym');
  if (property.has_balcony) features.push('Balcony');
  if (property.has_elevator) features.push('Elevator');
  if (property.has_security) features.push('Security');
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
    .filter(([key, value]) => value && !['sortBy', 'isDownPaymentQuery'].includes(key))
    .map(([key, value]) => {
      switch (key) {
        case 'bedrooms': return `${value as number} bedroom${(value as number) > 1 ? 's' : ''}`;
        case 'bathrooms': return `${value as number} bathroom${(value as number) > 1 ? 's' : ''}`;
        case 'hasPool': return 'with pool';
        case 'hasGarden': return 'with garden';
        case 'hasParking': return 'with parking';
        case 'hasGym': return 'with gym';
        case 'hasBalcony': return 'with balcony';
        case 'hasElevator': return 'with elevator';
        case 'hasSecurity': return 'with security';
        case 'furnished': return 'furnished';
        case 'city': return `in ${value as string}`;
        case 'propertyType': return (value as string).toLowerCase();
        case 'maxPrice': return `under $${(value as number).toLocaleString()}`;
        default: return '';
      }
    })
    .filter(Boolean)
    .join(', ');

  // Special handling for down payment queries
  if (criteria.isDownPaymentQuery) {
    const lowestPrice = Math.min(...recommendations.map(r => r.price));
    return `Perfect! I found ${recommendations.length} option${recommendations.length > 1 ? 's' : ''} ${criteriaText ? `(${criteriaText}) ` : ''}with the lowest down payment starting from $${lowestPrice.toLocaleString()}. These are sorted by most affordable first:\n\nWould you like me to send these property links to your WhatsApp?`;
  }

  // Special handling for "cheapest" queries
  if (criteria.sortBy === 'price_asc' && query.toLowerCase().includes('cheapest')) {
    const lowestPrice = Math.min(...recommendations.map(r => r.price));
    return `Great! I found the ${recommendations.length} most affordable propert${recommendations.length > 1 ? 'ies' : 'y'} ${criteriaText ? `matching your criteria (${criteriaText})` : 'for you'}, starting from $${lowestPrice.toLocaleString()}:\n\nWould you like me to send these property links to your WhatsApp?`;
  }

  return `Great! I found ${recommendations.length} propert${recommendations.length > 1 ? 'ies' : 'y'} ${criteriaText ? `matching your criteria (${criteriaText})` : 'for you'}. Here are my top recommendations:\n\nWould you like me to send these property links to your WhatsApp?`;
} 