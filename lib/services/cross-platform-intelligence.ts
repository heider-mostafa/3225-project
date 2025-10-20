/**
 * Cross-Platform Intelligence Service
 * Unified tracking and correlation across tours, conversations, and rentals
 * for comprehensive Meta algorithm optimization
 */

import { createClient } from '@/utils/supabase/client'
import { metaTrackingService } from './meta-tracking-service'

interface UserJourney {
  user_id: string
  session_id: string
  journey_start: Date
  journey_end?: Date
  touchpoints: TouchPoint[]
  total_value: number
  conversion_score: number
  platform_intelligence: {
    tour_engagement?: number
    conversation_quality?: number
    rental_interest?: number
    overall_intent_score: number
  }
}

interface TouchPoint {
  timestamp: Date
  type: 'property_view' | 'tour_started' | 'conversation_initiated' | 'rental_search' | 'booking_attempt' | 'conversion'
  source: string
  property_id?: string
  value_score: number
  meta_event: string
  metadata: any
}

interface CrossPlatformEvent {
  user_id: string
  property_id?: string
  event_type: string
  platform: 'property' | 'tour' | 'conversation' | 'rental'
  engagement_data: any
  value_indicators: {
    immediate_value: number
    predicted_ltv: number
    intent_signal_strength: number
  }
  correlation_opportunities: string[]
}

class CrossPlatformIntelligenceService {
  private supabase = createClient()

  /**
   * Track unified user journey across all platforms
   */
  async trackCrossPlatformEvent(event: CrossPlatformEvent): Promise<{
    success: boolean
    journey_updated: boolean
    meta_events_sent: number
    intelligence_insights?: any
  }> {
    try {
      // Find or create user journey
      let journey = await this.getOrCreateUserJourney(event.user_id)
      
      // Add touchpoint to journey
      const touchpoint: TouchPoint = {
        timestamp: new Date(),
        type: this.mapEventToTouchPointType(event.event_type, event.platform),
        source: event.platform,
        property_id: event.property_id,
        value_score: event.value_indicators.immediate_value,
        meta_event: this.generateMetaEventName(event),
        metadata: event.engagement_data
      }

      journey.touchpoints.push(touchpoint)
      
      // Update platform intelligence scores
      journey = await this.updatePlatformIntelligence(journey, event)
      
      // Calculate overall journey value and conversion probability
      const journeyAnalysis = this.analyzeJourneyValue(journey)
      
      // Send optimized Meta events based on cross-platform intelligence
      const metaEventsSent = await this.sendIntelligentMetaEvents(journey, event, journeyAnalysis)
      
      // Save updated journey
      await this.saveUserJourney(journey)
      
      // Generate actionable insights
      const insights = await this.generateActionableInsights(journey, journeyAnalysis)
      
      return {
        success: true,
        journey_updated: true,
        meta_events_sent: metaEventsSent,
        intelligence_insights: insights
      }

    } catch (error) {
      console.error('❌ Cross-platform intelligence error:', error)
      return {
        success: false,
        journey_updated: false,
        meta_events_sent: 0
      }
    }
  }

  /**
   * Get or create user journey tracking
   */
  private async getOrCreateUserJourney(userId: string): Promise<UserJourney> {
    const { data: existingJourney } = await this.supabase
      .from('user_journeys')
      .select('*')
      .eq('user_id', userId)
      .is('journey_end', null)
      .order('journey_start', { ascending: false })
      .limit(1)
      .single()

    if (existingJourney) {
      return {
        user_id: userId,
        session_id: existingJourney.session_id,
        journey_start: new Date(existingJourney.journey_start),
        touchpoints: JSON.parse(existingJourney.touchpoints || '[]'),
        total_value: existingJourney.total_value || 0,
        conversion_score: existingJourney.conversion_score || 0,
        platform_intelligence: JSON.parse(existingJourney.platform_intelligence || '{}')
      }
    }

    // Create new journey
    const newJourney: UserJourney = {
      user_id: userId,
      session_id: `journey_${userId}_${Date.now()}`,
      journey_start: new Date(),
      touchpoints: [],
      total_value: 0,
      conversion_score: 0,
      platform_intelligence: {
        overall_intent_score: 0
      }
    }

    return newJourney
  }

  /**
   * Update platform-specific intelligence scores
   */
  private async updatePlatformIntelligence(journey: UserJourney, event: CrossPlatformEvent): Promise<UserJourney> {
    const intel = journey.platform_intelligence

    switch (event.platform) {
      case 'tour':
        // Update tour engagement score based on actions
        const tourEngagement = event.engagement_data.engagement_score || 0
        intel.tour_engagement = Math.max(intel.tour_engagement || 0, tourEngagement)
        break

      case 'conversation':
        // Update conversation quality score
        const qualityScore = event.engagement_data.qualification_score || 0
        intel.conversation_quality = Math.max(intel.conversation_quality || 0, qualityScore)
        break

      case 'rental':
        // Update rental interest based on search depth and booking behavior
        const rentalInterest = this.calculateRentalInterestScore(event.engagement_data)
        intel.rental_interest = Math.max(intel.rental_interest || 0, rentalInterest)
        break

      case 'property':
        // Property viewing contributes to overall engagement
        const viewDepth = event.engagement_data.time_spent || 0
        const baseScore = Math.min(10, viewDepth / 30) // 0-10 based on time spent
        break
    }

    // Calculate overall intent score using weighted average
    intel.overall_intent_score = this.calculateOverallIntentScore(intel)
    
    return journey
  }

  /**
   * Calculate rental interest score from engagement data
   */
  private calculateRentalInterestScore(engagementData: any): number {
    let score = 0
    
    // Search depth indicators
    if (engagementData.search_filters_used) score += 2
    if (engagementData.date_range_specified) score += 3
    if (engagementData.location_specified) score += 2
    if (engagementData.price_range_specified) score += 1
    
    // Booking behavior indicators
    if (engagementData.booking_initiated) score += 5
    if (engagementData.payment_info_added) score += 7
    if (engagementData.booking_confirmed) score += 10
    
    return Math.min(10, score)
  }

  /**
   * Calculate overall intent score using weighted platform scores
   */
  private calculateOverallIntentScore(intel: any): number {
    const weights = {
      tour_engagement: 0.3,
      conversation_quality: 0.4,
      rental_interest: 0.3
    }

    let weightedSum = 0
    let totalWeight = 0

    if (intel.tour_engagement !== undefined) {
      weightedSum += intel.tour_engagement * weights.tour_engagement
      totalWeight += weights.tour_engagement
    }

    if (intel.conversation_quality !== undefined) {
      weightedSum += intel.conversation_quality * weights.conversation_quality
      totalWeight += weights.conversation_quality
    }

    if (intel.rental_interest !== undefined) {
      weightedSum += intel.rental_interest * weights.rental_interest
      totalWeight += weights.rental_interest
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }

  /**
   * Analyze journey value and conversion probability
   */
  private analyzeJourneyValue(journey: UserJourney): {
    predicted_ltv: number
    conversion_probability: number
    next_best_action: string
    value_multipliers: any
  } {
    const touchpointCount = journey.touchpoints.length
    const platforms = [...new Set(journey.touchpoints.map(tp => tp.source))]
    const totalEngagementTime = journey.touchpoints.reduce((sum, tp) => 
      sum + (tp.metadata?.duration || tp.metadata?.time_spent || 0), 0
    )

    // Calculate predicted LTV based on cross-platform signals
    let predictedLTV = 0
    
    // Base value from engagement depth
    predictedLTV += touchpointCount * 500 // $500 per meaningful touchpoint
    
    // Platform multipliers
    if (platforms.includes('conversation')) predictedLTV *= 1.8 // AI conversation high intent
    if (platforms.includes('tour')) predictedLTV *= 1.5 // Virtual tour shows serious interest
    if (platforms.includes('rental')) predictedLTV *= 2.2 // Rental interest = high value
    
    // Engagement time multiplier
    if (totalEngagementTime > 300) predictedLTV *= 1.3 // 5+ minutes of engagement
    
    // Calculate conversion probability
    const baseConversionRate = 0.05 // 5% base rate
    let conversionMultiplier = 1

    // Intelligence score impact
    const intentScore = journey.platform_intelligence.overall_intent_score || 0
    conversionMultiplier += (intentScore / 10) * 2 // Up to 3x multiplier for perfect score
    
    // Cross-platform bonus
    if (platforms.length >= 3) conversionMultiplier += 0.5 // Multi-platform engagement bonus
    
    const conversionProbability = Math.min(0.95, baseConversionRate * conversionMultiplier)

    // Determine next best action
    const nextBestAction = this.determineNextBestAction(journey, platforms, intentScore)

    return {
      predicted_ltv: Math.round(predictedLTV),
      conversion_probability: Math.round(conversionProbability * 100) / 100,
      next_best_action: nextBestAction,
      value_multipliers: {
        platform_count: platforms.length,
        intent_score: intentScore,
        engagement_time: totalEngagementTime
      }
    }
  }

  /**
   * Determine next best action for user
   */
  private determineNextBestAction(journey: UserJourney, platforms: string[], intentScore: number): string {
    const hasConversation = platforms.includes('conversation')
    const hasTour = platforms.includes('tour')
    const hasRental = platforms.includes('rental')
    
    if (intentScore >= 8) {
      return 'direct_contact' // High intent - direct broker contact
    }
    
    if (!hasConversation && intentScore >= 5) {
      return 'initiate_ai_conversation' // Medium intent - start AI chat
    }
    
    if (!hasTour && platforms.includes('property')) {
      return 'suggest_virtual_tour' // Property viewer - suggest tour
    }
    
    if (!hasRental && intentScore >= 3) {
      return 'explore_rental_options' // Some interest - show rentals
    }
    
    return 'nurture_with_content' // Low intent - content marketing
  }

  /**
   * Send intelligent Meta events based on cross-platform analysis
   */
  private async sendIntelligentMetaEvents(
    journey: UserJourney, 
    currentEvent: CrossPlatformEvent, 
    analysis: any
  ): Promise<number> {
    const events = []
    const intel = journey.platform_intelligence

    // Core event for current action
    events.push({
      event_name: this.generateMetaEventName(currentEvent),
      event_value: currentEvent.value_indicators.immediate_value,
      user_data: {
        predicted_ltv: analysis.predicted_ltv,
        intent_score: intel.overall_intent_score,
        conversion_probability: analysis.conversion_probability
      },
      custom_data: {
        platform: currentEvent.platform,
        cross_platform_touchpoints: journey.touchpoints.length,
        next_best_action: analysis.next_best_action
      }
    })

    // High-value user events
    if (analysis.predicted_ltv > 10000) {
      events.push({
        event_name: 'HighValueUser',
        event_value: analysis.predicted_ltv,
        user_data: {
          value_tier: 'premium',
          platforms_engaged: [...new Set(journey.touchpoints.map(tp => tp.source))].length
        }
      })
    }

    // Cross-platform engagement milestone
    if (journey.touchpoints.length >= 5) {
      events.push({
        event_name: 'CrossPlatformEngagement',
        event_value: journey.touchpoints.length * 100,
        custom_data: {
          engagement_depth: 'deep',
          platforms: [...new Set(journey.touchpoints.map(tp => tp.source))]
        }
      })
    }

    // Send all events
    let sentCount = 0
    for (const event of events) {
      try {
        await metaTrackingService.trackEvent(event.event_name, {
          eventValue: event.event_value,
          userData: event.user_data,
          customData: event.custom_data
        })
        sentCount++
      } catch (error) {
        console.error('❌ Failed to send Meta event:', event.event_name, error)
      }
    }

    return sentCount
  }

  /**
   * Generate actionable insights from journey analysis
   */
  private async generateActionableInsights(journey: UserJourney, analysis: any): Promise<{
    recommendations: string[]
    optimization_opportunities: string[]
    marketing_adjustments: string[]
  }> {
    const recommendations = []
    const optimizations = []
    const marketingAdjustments = []

    const intel = journey.platform_intelligence
    const platforms = [...new Set(journey.touchpoints.map(tp => tp.source))]

    // Recommendations based on intent score
    if (intel.overall_intent_score >= 8) {
      recommendations.push('High-intent user: Priority for direct broker outreach')
      marketingAdjustments.push('Increase bid for similar high-intent profiles')
    } else if (intel.overall_intent_score >= 5) {
      recommendations.push('Medium-intent user: Retarget with conversion campaigns')
    } else {
      recommendations.push('Low-intent user: Nurture with educational content')
    }

    // Platform-specific insights
    if (!platforms.includes('conversation') && intel.overall_intent_score >= 4) {
      optimizations.push('Suggest AI conversation for users with 4+ intent score')
    }

    if (!platforms.includes('tour') && platforms.includes('property')) {
      optimizations.push('Promote virtual tours to property viewers')
    }

    if (intel.rental_interest && intel.rental_interest >= 6) {
      recommendations.push('Strong rental interest: Fast-track to booking funnel')
      marketingAdjustments.push('Increase rental marketplace ad spend for similar profiles')
    }

    // Cross-platform optimization
    if (platforms.length >= 3) {
      optimizations.push('Multi-platform engagement detected: Create lookalike audiences')
    }

    return {
      recommendations,
      optimization_opportunities: optimizations,
      marketing_adjustments: marketingAdjustments
    }
  }

  /**
   * Save user journey to database
   */
  private async saveUserJourney(journey: UserJourney): Promise<void> {
    const { error } = await this.supabase
      .from('user_journeys')
      .upsert({
        user_id: journey.user_id,
        session_id: journey.session_id,
        journey_start: journey.journey_start.toISOString(),
        journey_end: journey.journey_end?.toISOString(),
        touchpoints: JSON.stringify(journey.touchpoints),
        total_value: journey.total_value,
        conversion_score: journey.conversion_score,
        platform_intelligence: JSON.stringify(journey.platform_intelligence),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'session_id'
      })

    if (error) {
      console.error('❌ Failed to save user journey:', error)
    }
  }

  /**
   * Map platform events to touchpoint types
   */
  private mapEventToTouchPointType(eventType: string, platform: string): TouchPoint['type'] {
    const mapping: Record<string, TouchPoint['type']> = {
      'property_view': 'property_view',
      'tour_started': 'tour_started',
      'conversation_initiated': 'conversation_initiated',
      'rental_search': 'rental_search',
      'booking_initiated': 'booking_attempt',
      'booking_confirmed': 'conversion',
      'purchase': 'conversion'
    }

    return mapping[eventType] || 'property_view'
  }

  /**
   * Generate Meta event name based on cross-platform context
   */
  private generateMetaEventName(event: CrossPlatformEvent): string {
    const baseEvents: Record<string, string> = {
      'property_view': 'ViewContent',
      'tour_started': 'InitiateCheckout',
      'conversation_initiated': 'Lead',
      'rental_search': 'Search',
      'booking_initiated': 'AddPaymentInfo',
      'booking_confirmed': 'Purchase',
      'high_engagement': 'CompleteRegistration'
    }

    return baseEvents[event.event_type] || 'ViewContent'
  }

  /**
   * Get comprehensive analytics for cross-platform intelligence
   */
  async getCrossPlatformAnalytics(dateRange: { start: Date; end: Date }): Promise<{
    journey_metrics: any
    platform_correlation: any
    conversion_insights: any
  }> {
    try {
      const { data: journeys } = await this.supabase
        .from('user_journeys')
        .select('*')
        .gte('journey_start', dateRange.start.toISOString())
        .lte('journey_start', dateRange.end.toISOString())

      if (!journeys?.length) {
        return {
          journey_metrics: {},
          platform_correlation: {},
          conversion_insights: {}
        }
      }

      // Analyze journey patterns
      const journeyMetrics = {
        total_journeys: journeys.length,
        avg_touchpoints: journeys.reduce((sum, j) => sum + (JSON.parse(j.touchpoints || '[]').length), 0) / journeys.length,
        multi_platform_journeys: journeys.filter(j => {
          const touchpoints = JSON.parse(j.touchpoints || '[]')
          const platforms = [...new Set(touchpoints.map((tp: any) => tp.source))]
          return platforms.length >= 2
        }).length,
        high_intent_journeys: journeys.filter(j => {
          const intel = JSON.parse(j.platform_intelligence || '{}')
          return (intel.overall_intent_score || 0) >= 7
        }).length
      }

      return {
        journey_metrics: journeyMetrics,
        platform_correlation: {}, // Would implement detailed correlation analysis
        conversion_insights: {} // Would implement conversion pattern analysis
      }

    } catch (error) {
      console.error('❌ Cross-platform analytics error:', error)
      return {
        journey_metrics: {},
        platform_correlation: {},
        conversion_insights: {}
      }
    }
  }
}

export const crossPlatformIntelligence = new CrossPlatformIntelligenceService()
export default crossPlatformIntelligence