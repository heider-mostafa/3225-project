import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { heygenManager } from '@/lib/heygen/HeygenAgentManager';

import { createServerSupabaseClient } from '@/lib/supabase/server'
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = await createServerSupabaseClient();

    const { 
      propertyId, 
      agentType = 'general',
      userId,
      question 
    } = await request.json();

    if (!propertyId) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Verify property exists
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, title, address, city')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Get user session if available
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = userId || session?.user?.id;

    try {
      // Check if HeyGen/N8N services are available
      const heygenApiKey = process.env.HEYGEN_API_KEY;
      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
      
      if (!heygenApiKey || !n8nWebhookUrl) {
        console.log('HeyGen/N8N not configured, using mock session');
        
        // Create mock session for development/testing
        const mockSession = {
          session_id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          access_token: 'mock_token',
          websocket_url: 'wss://mock.heygen.com/websocket',
          agent_type: agentType,
          agent_name: 'Sarah (Demo Agent)',
          expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          property_id: propertyId,
          success: true
        };

        // Log the analytics
        await supabase
          .from('property_analytics')
          .insert({
            property_id: propertyId,
            event_type: 'heygen_live_call_started_mock',
            event_data: {
              agent_type: agentType,
              session_id: mockSession.session_id,
              question: question || null,
              property_title: property.title,
              property_city: property.city,
              mode: 'mock_development'
            },
            user_agent: request.headers.get('user-agent'),
            ip_address: request.headers.get('x-forwarded-for')
          });

        return NextResponse.json({
          message: 'Mock HeyGen session created for development',
          session: {
            sessionId: mockSession.session_id,
            accessToken: mockSession.access_token,
            websocketUrl: mockSession.websocket_url,
            agentType: mockSession.agent_type,
            agentName: mockSession.agent_name,
            expiresAt: mockSession.expires_at,
            propertyId,
            propertyTitle: property.title,
            propertyAddress: property.address,
            isMockSession: true
          }
        });
      }

      // Use the existing sophisticated HeyGen system to create session
      const heygenSession = await heygenManager.createSpecializedSession(
        propertyId,
        agentType,
        currentUserId,
        question
      );

      // Log the interaction for analytics using the property_analytics table
      await supabase
        .from('property_analytics')
        .insert({
          property_id: propertyId,
          event_type: 'heygen_live_call_started',
          event_data: {
            agent_type: agentType,
            session_id: heygenSession.session_id,
            question: question || null,
            property_title: property.title,
            property_city: property.city
          },
          user_agent: request.headers.get('user-agent'),
          ip_address: request.headers.get('x-forwarded-for')
        });

      // Track session using the existing manager's tracking system
      await heygenManager.trackSessionInteraction(
        heygenSession.session_id,
        'live_call_session_created',
        {
          propertyId,
          agentType,
          userId: currentUserId,
          question,
          timestamp: new Date().toISOString(),
          source: 'virtual_tour_talk_to_sales'
        }
      );

      return NextResponse.json({
        message: 'HeyGen live video session created successfully',
        session: {
          sessionId: heygenSession.session_id,
          accessToken: heygenSession.access_token,
          websocketUrl: heygenSession.websocket_url,
          agentType: heygenSession.agent_type,
          agentName: heygenSession.agent_name,
          expiresAt: heygenSession.expires_at,
          propertyId,
          propertyTitle: property.title,
          propertyAddress: property.address
        }
      });

    } catch (heygenError) {
      console.error('HeyGen session creation failed:', heygenError);
      
      // Return structured error response
      return NextResponse.json({
        error: 'Failed to create HeyGen live session',
        details: heygenError instanceof Error ? heygenError.message : 'Unknown HeyGen error',
        propertyId,
        fallback: {
          message: 'HeyGen service is currently unavailable. Please try the regular chat or contact us directly.',
          contactOptions: [
            { type: 'phone', value: '+1-555-REALESTATE' },
            { type: 'email', value: 'sales@virtualestate.com' },
            { type: 'whatsapp', value: 'https://wa.me/15555555555' }
          ]
        }
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Unexpected error in HeyGen live call creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Use the existing HeyGen manager to properly end the session
    await heygenManager.endSession(sessionId);

    // Track session end
    await heygenManager.trackSessionInteraction(
      sessionId,
      'live_call_session_ended',
      {
        endTime: new Date().toISOString(),
        reason: 'user_initiated'
      }
    );

    return NextResponse.json({
      message: 'HeyGen live session ended successfully',
      sessionId
    });

  } catch (error) {
    console.error('Error ending HeyGen session:', error);
    return NextResponse.json(
      { error: 'Failed to end session' },
      { status: 500 }
    );
  }
}

// GET endpoint to check session status
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = heygenManager.getSession(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    const isExpired = heygenManager.isSessionExpired(sessionId);

    return NextResponse.json({
      sessionId,
      status: isExpired ? 'expired' : 'active',
      expiresAt: session.expires_at,
      agentType: session.agent_type,
      propertyId: session.property_id
    });

  } catch (error) {
    console.error('Error checking session status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get agent name by type
function getAgentName(agentType: string): string {
  const agentNames = {
    general: 'Alex - General Sales Agent',
    financial: 'Sarah - Financial Consultant', 
    legal: 'Marcus - Real Estate Attorney',
    condition: 'Jake - Property Inspector',
    location: 'Maria - Area Expert',
    scheduling: 'David - Showing Coordinator'
  };
  
  return agentNames[agentType as keyof typeof agentNames] || 'Sales Agent';
} 