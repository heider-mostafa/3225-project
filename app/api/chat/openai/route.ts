import { NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import OpenAI from 'openai';

import { createServerSupabaseClient } from '@/lib/supabase/server'

// Lazy OpenAI initialization
let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export async function POST(request: Request) {
  try {
    const { message, propertyId, currentRoom, tourContext, propertyData } = await request.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Get property knowledge from database if propertyId is provided
    let propertyKnowledge = "";
    if (propertyId) {
      const cookieStore = await cookies();
      const supabase = await createServerSupabaseClient();

      // Fetch comprehensive property data
      const { data: property, error } = await supabase
        .from('properties')
        .select(`
          *,
          property_photos (
            id,
            url,
            is_primary
          )
        `)
        .eq('id', propertyId)
        .single();

      if (property && !error) {
        propertyKnowledge = formatPropertyKnowledge(property, currentRoom, tourContext);
      }
    }

    // Build the system prompt
    const systemPrompt = buildSystemPrompt(propertyKnowledge, currentRoom, tourContext);

    // Make OpenAI API call
    const openaiClient = getOpenAI();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user", 
          content: message
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({ 
      response,
      propertyId,
      currentRoom 
    });

  } catch (error) {
    console.error("Error in OpenAI chat API:", error);
    
    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: "OpenAI API key not configured. Please set NEXT_PUBLIC_OPENAI_API_KEY in your environment." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

function formatPropertyKnowledge(property: any, currentRoom?: string, tourContext?: any): string {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const photos = property.property_photos || [];
  const primaryPhoto = photos.find((p: any) => p.is_primary) || photos[0];

  return `
PROPERTY DETAILS:
- Title: ${property.title}
- Price: ${formatPrice(property.price)}
- Type: ${property.property_type}
- Status: ${property.status}
- Bedrooms: ${property.bedrooms}
- Bathrooms: ${property.bathrooms}
- Square Meters: ${property.square_meters}
- Address: ${property.address}, ${property.city}, ${property.state}
- Description: ${property.description}
- Year Built: ${property.year_built || 'Not specified'}
- Features: ${property.features ? property.features.join(', ') : 'Standard features'}
- Amenities: ${property.amenities ? property.amenities.join(', ') : 'Standard amenities'}

${currentRoom ? `CURRENT LOCATION: The user is currently viewing the ${currentRoom.replace('-', ' ')}` : ''}

${tourContext ? `
TOUR CONTEXT:
- Time spent in current room: ${Math.floor(tourContext.timeInRoom / 60)} minutes ${tourContext.timeInRoom % 60} seconds
- Rooms visited: ${tourContext.visitedRooms.join(', ')}
- Total time in property: ${Math.floor(tourContext.totalTimeSpent / 60)} minutes
` : ''}

PHOTO INFORMATION:
${photos.length > 0 ? `This property has ${photos.length} photos available. ${primaryPhoto ? `The main photo shows: ${primaryPhoto.url}` : ''}` : 'No photos available.'}

ADDITIONAL INFO:
- View count: ${property.view_count || 0} people have viewed this property
- Listed on: ${new Date(property.created_at).toLocaleDateString()}
- Last updated: ${new Date(property.updated_at).toLocaleDateString()}
`;
}

function buildSystemPrompt(propertyKnowledge: string, currentRoom?: string, tourContext?: any): string {
  return `You are an expert real estate AI assistant helping users learn about a specific property. You have access to comprehensive property data and user context.

${propertyKnowledge}

INSTRUCTIONS:
1. Always provide helpful, accurate information based on the property data above
2. Be conversational and engaging, but professional
3. If asked about specific room details and the user is currently in that room, acknowledge their location
4. Use the tour context to provide personalized insights (e.g., "I notice you've spent quite a bit of time in the kitchen...")
5. For questions about price, features, location, or amenities, refer to the specific data provided
6. If asked about something not in the property data, politely explain what information is available
7. Keep responses concise but informative (aim for 2-3 sentences)
8. Always relate answers back to this specific property when possible
9. If asked about viewing or buying, encourage them to contact the agent or schedule a showing

TONE: Friendly, knowledgeable, and helpful real estate professional

Remember: You are specifically helping with THIS property, not giving general real estate advice.`;
} 