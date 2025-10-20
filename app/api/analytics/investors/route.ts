import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { investorDetection } from '@/lib/services/investor-detection'

/**
 * Get investor analytics and profiles
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const includeRecommendations = searchParams.get('include_recommendations') === 'true'
    const minSavedProperties = parseInt(searchParams.get('min_saved_properties') || '3')

    const supabase = await createServerSupabaseClient()

    if (userId) {
      // Get specific user investor profile
      const profile = await investorDetection.analyzeInvestorProfile(userId)
      
      if (!profile) {
        return NextResponse.json({
          success: false,
          error: 'User not found or insufficient data'
        }, { status: 404 })
      }

      let recommendations = []
      if (includeRecommendations) {
        recommendations = generateInvestorRecommendations(profile)
      }

      return NextResponse.json({
        success: true,
        investor_profile: profile,
        recommendations
      })
    }

    // Get all potential investors
    const potentialInvestors = await getPotentialInvestors(supabase, minSavedProperties)

    return NextResponse.json({
      success: true,
      potential_investors: potentialInvestors,
      summary: {
        total_potential_investors: potentialInvestors.length,
        high_value_investors: potentialInvestors.filter(p => p.meta_value_score >= 80).length,
        total_commission_potential: potentialInvestors.reduce((sum, p) => sum + p.total_commission_potential, 0)
      }
    })

  } catch (error) {
    console.error('Investor analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Update investor profile and trigger Meta events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, trigger_milestone } = body

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Analyze current investor profile
    const profile = await investorDetection.analyzeInvestorProfile(user_id)
    
    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'User not found or insufficient data for analysis'
      }, { status: 404 })
    }

    // Check for milestone triggers
    const milestones = detectMilestones(profile)
    
    // Trigger Meta events for detected milestones
    const metaResults = []
    for (const milestone of milestones) {
      const result = await investorDetection.trackInvestorMilestone(user_id, milestone, profile)
      metaResults.push({ milestone, success: result.success })
    }

    // If specific milestone requested, trigger it
    if (trigger_milestone) {
      const specificResult = await investorDetection.trackInvestorMilestone(user_id, trigger_milestone, profile)
      metaResults.push({ milestone: trigger_milestone, success: specificResult.success })
    }

    return NextResponse.json({
      success: true,
      investor_profile: profile,
      milestones_triggered: metaResults,
      recommendations: generateInvestorRecommendations(profile)
    })

  } catch (error) {
    console.error('Investor profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get potential investors from database
 */
async function getPotentialInvestors(supabase: any, minSavedProperties: number) {
  // Get users with multiple saved properties
  const { data: usersWithMultipleProperties } = await supabase
    .from('saved_properties')
    .select(`
      user_id,
      count(*) as saved_count,
      users (
        id,
        email,
        created_at
      )
    `)
    .gte('saved_count', minSavedProperties)
    .group('user_id')

  if (!usersWithMultipleProperties || usersWithMultipleProperties.length === 0) {
    return []
  }

  const investors = []

  // Analyze each potential investor
  for (const userData of usersWithMultipleProperties) {
    if (!userData.user_id) continue

    try {
      const profile = await investorDetection.analyzeInvestorProfile(userData.user_id)
      if (profile) {
        investors.push({
          user_id: profile.user_id,
          investor_type: profile.investor_type,
          meta_value_score: profile.meta_value_score,
          saved_properties_count: profile.behavioral_indicators.saved_properties_count,
          total_commission_potential: profile.portfolio_metrics.total_commission_potential,
          expected_timeline_months: profile.portfolio_metrics.expected_timeline_months,
          investment_focus: profile.portfolio_metrics.investment_focus,
          user_email: userData.users?.email || null,
          last_activity: userData.users?.created_at
        })
      }
    } catch (error) {
      console.error(`Failed to analyze investor ${userData.user_id}:`, error)
    }
  }

  // Sort by Meta value score (highest first)
  return investors.sort((a, b) => b.meta_value_score - a.meta_value_score)
}

/**
 * Detect milestones based on investor profile
 */
function detectMilestones(profile: any): string[] {
  const milestones = []
  const { saved_properties_count } = profile.behavioral_indicators
  const { investor_type, meta_value_score } = profile

  // Portfolio size milestones
  if (saved_properties_count === 5) milestones.push('portfolio_threshold_5')
  if (saved_properties_count === 10) milestones.push('portfolio_threshold_10')
  if (saved_properties_count === 15) milestones.push('portfolio_threshold_15')

  // Investor type upgrade milestones
  if (investor_type === 'experienced' || investor_type === 'professional') {
    milestones.push('investor_type_upgrade')
  }

  // High engagement milestones
  if (profile.behavioral_indicators.engagement_quality >= 80) {
    milestones.push('high_engagement_pattern')
  }

  // Multi-location interest
  if (profile.behavioral_indicators.locations_targeted.length >= 3) {
    milestones.push('multi_location_interest')
  }

  // Luxury focus detection
  const luxuryTypes = ['villa', 'penthouse']
  if (profile.behavioral_indicators.property_types_interested.some(type => luxuryTypes.includes(type))) {
    milestones.push('luxury_focus_detected')
  }

  return milestones
}

/**
 * Generate actionable recommendations for investors
 */
function generateInvestorRecommendations(profile: any) {
  const recommendations = []
  const { investor_type, meta_value_score, behavioral_indicators, portfolio_metrics } = profile

  // High-value investor recommendations
  if (meta_value_score >= 80) {
    recommendations.push({
      type: 'vip_treatment',
      priority: 'high',
      action: 'Assign dedicated relationship manager and offer private viewings',
      reason: 'High-value investor with significant commission potential',
      estimated_value: portfolio_metrics.total_commission_potential
    })
  }

  // Portfolio consultation recommendations
  if (investor_type === 'professional' || investor_type === 'institutional') {
    recommendations.push({
      type: 'portfolio_consultation',
      priority: 'high',
      action: 'Offer comprehensive portfolio analysis and market insights',
      reason: 'Professional investor likely to appreciate market intelligence',
      timeline: 'Within 48 hours'
    })
  }

  // Investment focus recommendations
  if (behavioral_indicators.property_types_interested.length === 1) {
    const focusType = behavioral_indicators.property_types_interested[0]
    recommendations.push({
      type: 'specialized_inventory',
      priority: 'medium',
      action: `Create curated ${focusType} property feed and market updates`,
      reason: 'Clear preference for specific property type detected',
      focus_type: focusType
    })
  }

  // Location expansion recommendations
  if (behavioral_indicators.locations_targeted.length >= 2) {
    recommendations.push({
      type: 'market_expansion',
      priority: 'medium',
      action: 'Suggest properties in similar/emerging areas for portfolio diversification',
      reason: 'Multi-location interest indicates expansion strategy',
      current_locations: behavioral_indicators.locations_targeted
    })
  }

  // Financing assistance recommendations
  if (portfolio_metrics.estimated_buying_power > 10000000) {
    recommendations.push({
      type: 'financing_partnership',
      priority: 'medium',
      action: 'Introduce to preferred banking partners for investment financing',
      reason: 'High buying power suggests need for institutional financing',
      estimated_buying_power: portfolio_metrics.estimated_buying_power
    })
  }

  // Urgent follow-up recommendations
  if (meta_value_score >= 70 && portfolio_metrics.expected_timeline_months <= 6) {
    recommendations.push({
      type: 'urgent_follow_up',
      priority: 'high',
      action: 'Schedule immediate consultation call within 24 hours',
      reason: 'High-intent investor with short timeline',
      timeline: portfolio_metrics.expected_timeline_months
    })
  }

  return recommendations
}