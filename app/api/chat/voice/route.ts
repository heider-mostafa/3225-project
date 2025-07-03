import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

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

export async function POST(request: NextRequest) {
  try {
    const { propertyId, question, language = 'en', context } = await request.json()

    if (!propertyId || !question) {
      return NextResponse.json(
        { error: 'Property ID and question are required' },
        { status: 400 }
      )
    }

    // Get property data for context
    const propertyResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/properties/${propertyId}`)
    const propertyData = await propertyResponse.json()

    if (!propertyData.success) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    const property = propertyData.property

    // Create context-aware prompt based on language
    const systemPrompts = {
      en: `You are a professional real estate AI assistant helping with property inquiries. You have complete knowledge about this property and should provide helpful, accurate information. Be conversational and friendly.`,
      ar: `أنت مساعد ذكي عقاري محترف تساعد في استفسارات العقارات. لديك معرفة كاملة بهذا العقار ويجب أن تقدم معلومات مفيدة ودقيقة. كن ودودًا ومحادثيًا.`,
      fr: `Vous êtes un assistant IA immobilier professionnel aidant avec les demandes de propriété. Vous avez une connaissance complète de cette propriété et devez fournir des informations utiles et précises. Soyez conversationnel et amical.`,
      es: `Eres un asistente de IA inmobiliario profesional que ayuda con consultas de propiedades. Tienes conocimiento completo sobre esta propiedad y debes proporcionar información útil y precisa. Sé conversacional y amigable.`,
      de: `Sie sind ein professioneller Immobilien-KI-Assistent, der bei Immobilienanfragen hilft. Sie haben vollständiges Wissen über diese Immobilie und sollten hilfreiche, genaue Informationen bereitstellen. Seien Sie gesprächig und freundlich.`
    }

    const contextInfo = `
Property Details:
- Title: ${property.title}
- Price: $${property.price?.toLocaleString() || 'Contact for price'}
- Location: ${property.address}, ${property.city}, ${property.state}
- Type: ${property.property_type}
- Bedrooms: ${property.bedrooms}
- Bathrooms: ${property.bathrooms}
- Square Meters: ${property.square_meters}
- Features: ${property.features?.join(', ') || 'N/A'}
- Amenities: ${property.amenities?.join(', ') || 'N/A'}
${context?.currentRoom ? `- User is currently viewing: ${context.currentRoom}` : ''}
${context?.tourContext ? '- User is in virtual 3D tour mode' : ''}
- Status: ${property.status}
`

    // Generate AI response
    const openaiClient = getOpenAI();
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: systemPrompts[language as keyof typeof systemPrompts] || systemPrompts.en
        },
        {
          role: "system",
          content: contextInfo
        },
        {
          role: "user",
          content: question
        }
      ],
      max_tokens: 500,
      temperature: 0.7,
    })

    const responseText = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your question."

    // Convert text to speech
    const speech = await openaiClient.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: responseText,
      response_format: "mp3",
    })

    // Convert audio buffer to base64 URL
    const buffer = Buffer.from(await speech.arrayBuffer())
    const audioBase64 = buffer.toString('base64')
    const audioUrl = `data:audio/mp3;base64,${audioBase64}`

    return NextResponse.json({
      success: true,
      text: responseText,
      audioUrl: audioUrl,
      language: language
    })

  } catch (error) {
    console.error('Voice chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process voice request' },
      { status: 500 }
    )
  }
} 