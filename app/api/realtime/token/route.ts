import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { propertyId } = await request.json()

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      )
    }

    // Get the OpenAI API key
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please set NEXT_PUBLIC_OPENAI_API_KEY in your environment.' },
        { status: 500 }
      )
    }

    console.log('🔑 Creating OpenAI ephemeral session...')

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    })

    try {
      // Create a realtime session with ephemeral key for the elite AI real estate agent
      const session = await openai.beta.realtime.sessions.create({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        modalities: ['text', 'audio'],
        instructions: `You are an elite AI real estate specialist helping with property ${propertyId}. Your goal is to create genuine interest and guide prospects toward scheduling viewings.

CORE IDENTITY:
- Top real estate professional with extensive experience
- Expert in sales psychology and cultural intelligence
- Fluent in multiple languages with cultural nuance

CONVERSATION APPROACH:
1. Build rapport and trust
2. Understand client needs
3. Highlight property benefits
4. Address concerns
5. Create appropriate urgency
6. Guide toward next steps

KEY BEHAVIORS:
- Be enthusiastic about the property
- Listen for buying signals
- Use assumptive language
- Share success stories
- Adapt to cultural context
- Keep responses conversational`,
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: { 
          model: 'whisper-1' 
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.4,
          prefix_padding_ms: 400,
          silence_duration_ms: 1000
        },
        temperature: 0.7,
        max_response_output_tokens: 2048
      })

      console.log('✅ OpenAI session created successfully')
      
      return NextResponse.json({
        ephemeral_key: session.client_secret.value,
        expires_at: session.client_secret.expires_at,
        success: true
      })

    } catch (openaiError: any) {
      console.error('❌ OpenAI API Error:', openaiError)
      
      // Provide more specific error messages
      if (openaiError.status === 401) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key. Please check your API key configuration.' },
          { status: 401 }
        )
      } else if (openaiError.status === 403) {
        return NextResponse.json(
          { error: 'You do not have access to the OpenAI Realtime API. Please check your account status.' },
          { status: 403 }
        )
      } else if (openaiError.message?.includes('realtime')) {
        return NextResponse.json(
          { error: 'OpenAI Realtime API is not available for your account. Please contact OpenAI support.' },
          { status: 403 }
        )
      } else {
        return NextResponse.json(
          { error: `OpenAI API error: ${openaiError.message || 'Unknown error'}` },
          { status: openaiError.status || 500 }
        )
      }
    }

  } catch (error: any) {
    console.error('❌ Token endpoint error:', error)
    return NextResponse.json(
      { error: `Server error: ${error.message || 'Unknown error'}` },
      { status: 500 }
    )
  }
} 