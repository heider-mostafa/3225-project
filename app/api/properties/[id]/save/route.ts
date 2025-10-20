import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { trackPropertySave } from '@/lib/utils/meta-tracking'
import { extractTrackingParams } from '@/lib/utils/meta-tracking'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const propertyId = resolvedParams.id
    const body = await request.json()
    
    // Extract tracking parameters from request
    const trackingParams = extractTrackingParams(request, body)
    
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if property is already saved to avoid duplicate error
    const { data: existing } = await supabase
      .from('saved_properties')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', propertyId)
      .single();

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: 'Property already saved' 
      });
    }

    // Get property details for Meta tracking
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select(`
        id,
        title,
        price,
        property_type,
        city,
        bedrooms,
        bathrooms
      `)
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Calculate interest score based on user behavior and property characteristics
    const interestScore = await calculateInterestScore(user.id, property, supabase)
    
    // Get user's saved properties count for investor detection
    const { data: userSavedProperties } = await supabase
      .from('saved_properties')
      .select('id, property_id, created_at')
      .eq('user_id', user.id)

    const savedCount = userSavedProperties?.length || 0

    // Save the property with enhanced tracking
    const { data: savedProperty, error } = await supabase
      .from('saved_properties')
      .insert({
        user_id: user.id,
        property_id: propertyId,
        interest_score: interestScore,
        facebook_click_id: trackingParams.facebookClickId,
        facebook_browser_id: trackingParams.facebookBrowserId,
        source_page: body.source_page || 'property_details'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error saving property:', error);
      return NextResponse.json(
        { error: 'Failed to save property', details: error.message },
        { status: 500 }
      );
    }

    // Track with Meta based on user behavior patterns
    try {
      const metaResult = await trackPropertySave({
        propertyId,
        userId: user.id,
        interestScore,
        sourcePage: body.source_page,
        tracking: trackingParams
      })

      if (metaResult.success) {
        // Update saved property with Meta tracking info
        await supabase
          .from('saved_properties')
          .update({
            meta_event_sent: true,
            meta_event_id: `save_${propertyId}_${Date.now()}`
          })
          .eq('id', savedProperty.id)

        console.log('✅ Property save Meta event sent successfully')
      }
    } catch (metaError) {
      console.error('❌ Property save Meta tracking failed:', metaError)
      // Don't fail the save if Meta fails
    }

    // Analyze investment pattern for future recommendations
    const investmentPattern = analyzeInvestmentPattern(savedCount + 1, userSavedProperties, property)

    return NextResponse.json({ 
      success: true,
      analytics: {
        interest_score: interestScore,
        total_saved_properties: savedCount + 1,
        investment_pattern: investmentPattern,
        meta_tracked: true
      },
      recommendations: getRecommendations(interestScore, investmentPattern)
    });
  } catch (error) {
    console.error('Error saving property:', error);
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
    const resolvedParams = await params
    const propertyId = resolvedParams.id
    
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Remove the saved property
    const { error } = await supabase
      .from('saved_properties')
      .delete()
      .match({
        user_id: user.id,
        property_id: propertyId,
      });

    if (error) {
      console.error('Supabase error removing saved property:', error);
      return NextResponse.json(
        { error: 'Failed to remove saved property', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing saved property:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Calculate interest score based on user behavior and property characteristics
 */
async function calculateInterestScore(userId: string, property: any, supabase: any): Promise<number> {
  let score = 20 // Base score for saving a property

  try {
    // Check recent user activity for engagement signals
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Check virtual tour engagement for this property
    const { data: tourSessions } = await supabase
      .from('tour_sessions')
      .select('engagement_score, completed, total_duration_seconds')
      .eq('property_id', property.id)
      .eq('user_id', userId)
      .gte('started_at', thirtyDaysAgo.toISOString())

    if (tourSessions && tourSessions.length > 0) {
      const avgEngagement = tourSessions.reduce((sum, session) => sum + (session.engagement_score || 0), 0) / tourSessions.length
      score += Math.round(avgEngagement * 0.3) // Up to 30 points for high engagement
      
      if (tourSessions.some(s => s.completed)) score += 15 // Bonus for completed tours
      if (tourSessions.length > 1) score += 10 // Bonus for multiple tour sessions
    }

    // Check property viewing bookings for this property
    const { data: viewings } = await supabase
      .from('property_viewings')
      .select('status, lead_quality_score')
      .eq('property_id', property.id)
      .eq('user_id', userId)

    if (viewings && viewings.length > 0) {
      score += 25 // High value for having booked viewings
      const avgLeadQuality = viewings.reduce((sum, v) => sum + (v.lead_quality_score || 0), 0) / viewings.length
      score += Math.round(avgLeadQuality * 0.2) // Up to 13 more points
    }

    // Property value indicators
    if (property.price > 10000000) score += 5 // Luxury property interest
    if (property.property_type === 'villa' || property.property_type === 'penthouse') score += 5
    
    // Location desirability
    const premiumLocations = ['New Cairo', 'Zamalek', 'Maadi', 'Sheikh Zayed']
    if (premiumLocations.includes(property.city)) score += 5

  } catch (error) {
    console.error('Error calculating interest score:', error)
  }

  return Math.min(score, 100) // Cap at 100
}

/**
 * Analyze investment patterns from user's saved properties
 */
function analyzeInvestmentPattern(totalSaved: number, savedProperties: any[], currentProperty: any) {
  if (totalSaved === 1) {
    return {
      type: 'first_time_saver',
      likelihood: 'exploring',
      pattern: 'single_property_interest'
    }
  }

  if (totalSaved <= 3) {
    return {
      type: 'casual_browser',
      likelihood: 'low_intent',
      pattern: 'selective_interest'
    }
  }

  if (totalSaved <= 8) {
    // Analyze diversity of saved properties
    const propertyTypes = new Set(savedProperties?.map(p => p.property_type) || [])
    const locations = new Set(savedProperties?.map(p => p.city) || [])
    
    return {
      type: 'serious_buyer',
      likelihood: 'medium_intent',
      pattern: propertyTypes.size > 2 ? 'diversified_interest' : 'focused_interest',
      preferred_type: propertyTypes.size === 1 ? Array.from(propertyTypes)[0] : 'mixed',
      preferred_locations: Array.from(locations)
    }
  }

  // 9+ saved properties indicates potential investor
  return {
    type: 'potential_investor',
    likelihood: 'high_intent',
    pattern: 'portfolio_building',
    investment_indicators: {
      property_diversity: true,
      volume_indicator: true,
      professional_buyer_signals: true
    }
  }
}

/**
 * Generate recommendations based on interest score and investment pattern
 */
function getRecommendations(interestScore: number, investmentPattern: any) {
  const recommendations = []

  if (interestScore >= 70) {
    recommendations.push({
      type: 'immediate_follow_up',
      priority: 'high',
      action: 'Schedule broker call within 24 hours',
      reason: 'High engagement and interest score'
    })
  }

  if (investmentPattern.type === 'potential_investor') {
    recommendations.push({
      type: 'investor_consultation',
      priority: 'high',
      action: 'Offer portfolio consultation and bulk viewing discounts',
      reason: 'Multiple properties saved indicates investment interest'
    })
  }

  if (interestScore >= 50 && investmentPattern.likelihood !== 'exploring') {
    recommendations.push({
      type: 'property_alert',
      priority: 'medium',
      action: 'Enable alerts for similar properties',
      reason: 'Strong interest pattern detected'
    })
  }

  if (investmentPattern.pattern === 'focused_interest' && investmentPattern.preferred_type) {
    recommendations.push({
      type: 'similar_properties',
      priority: 'medium',
      action: `Show more ${investmentPattern.preferred_type} properties`,
      reason: 'Clear property type preference identified'
    })
  }

  return recommendations
} 