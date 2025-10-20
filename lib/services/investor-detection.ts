/**
 * Investor Detection and Portfolio Intelligence
 * Analyzes user behavior patterns to identify potential property investors
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { metaConversions } from '@/lib/services/meta-conversions'

export interface InvestorProfile {
  user_id: string
  investor_type: 'first_time' | 'experienced' | 'professional' | 'institutional'
  investment_signals: {
    multiple_property_interest: boolean
    diverse_location_targeting: boolean
    price_range_analysis: boolean
    roi_focused_behavior: boolean
    market_timing_awareness: boolean
    financing_inquiries: boolean
  }
  portfolio_metrics: {
    estimated_buying_power: number
    likely_transaction_count: number
    total_commission_potential: number
    expected_timeline_months: number
    investment_focus: string[]
  }
  behavioral_indicators: {
    saved_properties_count: number
    property_types_interested: string[]
    locations_targeted: string[]
    price_ranges_explored: string[]
    engagement_quality: number
    viewing_booking_rate: number
  }
  meta_value_score: number // 0-100 score for Meta algorithm optimization
}

export class InvestorDetectionService {

  /**
   * Analyze user to create comprehensive investor profile
   */
  async analyzeInvestorProfile(userId: string): Promise<InvestorProfile | null> {
    const supabase = await createServerSupabaseClient()

    try {
      // Get comprehensive user activity data
      const [savedProperties, tourSessions, propertyViewings, leads] = await Promise.all([
        this.getUserSavedProperties(userId, supabase),
        this.getUserTourSessions(userId, supabase),
        this.getUserPropertyViewings(userId, supabase),
        this.getUserLeads(userId, supabase)
      ])

      if (!savedProperties || savedProperties.length === 0) {
        return null // No data to analyze
      }

      // Analyze investment signals
      const investmentSignals = this.detectInvestmentSignals(savedProperties, tourSessions, propertyViewings)
      
      // Calculate behavioral indicators
      const behavioralIndicators = this.calculateBehavioralIndicators(savedProperties, tourSessions, propertyViewings)
      
      // Determine investor type
      const investorType = this.classifyInvestorType(investmentSignals, behavioralIndicators)
      
      // Calculate portfolio metrics
      const portfolioMetrics = this.calculatePortfolioMetrics(savedProperties, investorType, behavioralIndicators)
      
      // Calculate Meta optimization score
      const metaValueScore = this.calculateMetaValueScore(investorType, portfolioMetrics, behavioralIndicators)

      return {
        user_id: userId,
        investor_type: investorType,
        investment_signals: investmentSignals,
        portfolio_metrics: portfolioMetrics,
        behavioral_indicators: behavioralIndicators,
        meta_value_score: metaValueScore
      }

    } catch (error) {
      console.error('Investor analysis failed:', error)
      return null
    }
  }

  /**
   * Get user's saved properties with property details
   */
  private async getUserSavedProperties(userId: string, supabase: any) {
    const { data } = await supabase
      .from('saved_properties')
      .select(`
        *,
        properties (
          id,
          price,
          property_type,
          city,
          bedrooms,
          bathrooms,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return data || []
  }

  /**
   * Get user's virtual tour sessions
   */
  private async getUserTourSessions(userId: string, supabase: any) {
    const { data } = await supabase
      .from('tour_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

    return data || []
  }

  /**
   * Get user's property viewing bookings
   */
  private async getUserPropertyViewings(userId: string, supabase: any) {
    const { data } = await supabase
      .from('property_viewings')
      .select('*')
      .eq('user_id', userId)
      .order('viewing_date', { ascending: false })

    return data || []
  }

  /**
   * Get user's lead capture data
   */
  private async getUserLeads(userId: string, supabase: any) {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return data || []
  }

  /**
   * Detect investment behavior signals
   */
  private detectInvestmentSignals(savedProperties: any[], tourSessions: any[], viewings: any[]) {
    const properties = savedProperties.map(sp => sp.properties).filter(Boolean)
    
    // Analyze property diversity
    const propertyTypes = new Set(properties.map(p => p.property_type))
    const locations = new Set(properties.map(p => p.city))
    const priceRanges = this.categorizePriceRanges(properties.map(p => p.price))

    return {
      multiple_property_interest: savedProperties.length >= 5,
      diverse_location_targeting: locations.size >= 3,
      price_range_analysis: priceRanges.size >= 2,
      roi_focused_behavior: this.detectROIFocus(tourSessions, viewings),
      market_timing_awareness: this.detectMarketTiming(savedProperties),
      financing_inquiries: this.detectFinancingInterest(viewings)
    }
  }

  /**
   * Calculate behavioral indicators
   */
  private calculateBehavioralIndicators(savedProperties: any[], tourSessions: any[], viewings: any[]) {
    const properties = savedProperties.map(sp => sp.properties).filter(Boolean)
    
    const avgEngagement = tourSessions.length > 0 ? 
      tourSessions.reduce((sum, session) => sum + (session.engagement_score || 0), 0) / tourSessions.length : 0

    const viewingBookingRate = savedProperties.length > 0 ? 
      viewings.length / savedProperties.length : 0

    return {
      saved_properties_count: savedProperties.length,
      property_types_interested: [...new Set(properties.map(p => p.property_type))],
      locations_targeted: [...new Set(properties.map(p => p.city))],
      price_ranges_explored: this.categorizePriceRanges(properties.map(p => p.price)),
      engagement_quality: Math.round(avgEngagement),
      viewing_booking_rate: Math.round(viewingBookingRate * 100) / 100
    }
  }

  /**
   * Classify investor type based on signals and behavior
   */
  private classifyInvestorType(signals: any, behavior: any): InvestorProfile['investor_type'] {
    const signalCount = Object.values(signals).filter(Boolean).length
    const { saved_properties_count, engagement_quality, viewing_booking_rate } = behavior

    if (saved_properties_count >= 15 && signalCount >= 4 && viewing_booking_rate >= 0.3) {
      return 'professional'
    }

    if (saved_properties_count >= 8 && signalCount >= 3 && engagement_quality >= 60) {
      return 'experienced'
    }

    if (saved_properties_count >= 3 && signalCount >= 2) {
      return 'first_time'
    }

    // Very high activity might indicate institutional investor
    if (saved_properties_count >= 25 || (signals.diverse_location_targeting && signals.price_range_analysis)) {
      return 'institutional'
    }

    return 'first_time'
  }

  /**
   * Calculate portfolio investment metrics
   */
  private calculatePortfolioMetrics(savedProperties: any[], investorType: string, behavior: any) {
    const properties = savedProperties.map(sp => sp.properties).filter(Boolean)
    const avgPrice = properties.length > 0 ? 
      properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length : 0

    // Estimate buying power based on investor type and behavior
    const buyingPowerMultipliers = {
      'institutional': 5.0,
      'professional': 3.0,
      'experienced': 2.0,
      'first_time': 1.0
    }

    const estimatedBuyingPower = avgPrice * buyingPowerMultipliers[investorType as keyof typeof buyingPowerMultipliers] * behavior.saved_properties_count

    // Estimate transaction likelihood
    const transactionMultipliers = {
      'institutional': 0.6,
      'professional': 0.4,
      'experienced': 0.25,
      'first_time': 0.15
    }

    const likelyTransactionCount = Math.ceil(
      behavior.saved_properties_count * transactionMultipliers[investorType as keyof typeof transactionMultipliers]
    )

    // Calculate commission potential (2.5% average)
    const totalCommissionPotential = estimatedBuyingPower * 0.025

    // Estimate timeline based on engagement and investor type
    const timelineMonths = {
      'institutional': 3,
      'professional': 6,
      'experienced': 9,
      'first_time': 12
    }

    return {
      estimated_buying_power: Math.round(estimatedBuyingPower),
      likely_transaction_count: likelyTransactionCount,
      total_commission_potential: Math.round(totalCommissionPotential),
      expected_timeline_months: timelineMonths[investorType as keyof typeof timelineMonths],
      investment_focus: behavior.property_types_interested.slice(0, 3) // Top 3 focus areas
    }
  }

  /**
   * Calculate Meta optimization value score
   */
  private calculateMetaValueScore(investorType: string, metrics: any, behavior: any): number {
    let score = 0

    // Base score by investor type
    const typeScores = {
      'institutional': 90,
      'professional': 75,
      'experienced': 60,
      'first_time': 40
    }
    score += typeScores[investorType as keyof typeof typeScores]

    // Engagement quality bonus
    score += Math.min(behavior.engagement_quality * 0.3, 30)

    // High-value portfolio bonus
    if (metrics.total_commission_potential > 100000) score += 10
    if (metrics.total_commission_potential > 500000) score += 10

    // Activity level bonus
    if (behavior.saved_properties_count >= 10) score += 5
    if (behavior.viewing_booking_rate >= 0.3) score += 5

    return Math.min(score, 100)
  }

  /**
   * Send Meta events for investor milestones
   */
  async trackInvestorMilestone(userId: string, milestone: string, investorProfile: InvestorProfile) {
    const milestoneEvents = {
      'portfolio_threshold_5': { event: 'AddToCart', value: 200 },
      'portfolio_threshold_10': { event: 'Purchase', value: 500 },
      'portfolio_threshold_15': { event: 'Purchase', value: 1000 },
      'investor_type_upgrade': { event: 'CompleteRegistration', value: investorProfile.meta_value_score * 5 },
      'high_engagement_pattern': { event: 'Subscribe', value: 300 },
      'multi_location_interest': { event: 'Search', value: 150 },
      'luxury_focus_detected': { event: 'AddToCart', value: 400 }
    }

    const eventConfig = milestoneEvents[milestone as keyof typeof milestoneEvents]
    if (!eventConfig) return

    try {
      const result = await metaConversions.trackConversion({
        eventName: eventConfig.event,
        customData: {
          content_category: 'investor_milestone',
          content_name: `Investor ${milestone}`,
          investor_type: investorProfile.investor_type,
          meta_value_score: investorProfile.meta_value_score,
          commission_potential: investorProfile.portfolio_metrics.total_commission_potential,
          value: eventConfig.value
        }
      })

      if (result.success) {
        console.log('✅ Investor milestone tracked:', {
          user_id: userId,
          milestone,
          investor_type: investorProfile.investor_type,
          meta_value: eventConfig.value
        })
      }

      return result
    } catch (error) {
      console.error('❌ Investor milestone tracking failed:', error)
      return { success: false, error: 'Tracking failed' }
    }
  }

  /**
   * Helper functions
   */
  private categorizePriceRanges(prices: number[]): string[] {
    const ranges = new Set<string>()
    
    prices.forEach(price => {
      if (price < 2000000) ranges.add('under_2M')
      else if (price < 5000000) ranges.add('2M_5M')
      else if (price < 10000000) ranges.add('5M_10M')
      else if (price < 20000000) ranges.add('10M_20M')
      else ranges.add('luxury_20M+')
    })

    return Array.from(ranges)
  }

  private detectROIFocus(tourSessions: any[], viewings: any[]): boolean {
    // Look for patterns indicating ROI-focused behavior
    const highEngagementSessions = tourSessions.filter(s => s.engagement_score >= 70).length
    const viewingToTourRatio = tourSessions.length > 0 ? viewings.length / tourSessions.length : 0
    
    return highEngagementSessions >= 3 || viewingToTourRatio >= 0.4
  }

  private detectMarketTiming(savedProperties: any[]): boolean {
    if (savedProperties.length < 3) return false
    
    // Check if user is saving properties in bursts (market timing behavior)
    const recentSaves = savedProperties.filter(sp => {
      const saveDate = new Date(sp.created_at)
      const daysSinceLastSave = (Date.now() - saveDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceLastSave <= 7
    })

    return recentSaves.length >= 3
  }

  private detectFinancingInterest(viewings: any[]): boolean {
    // Look for financing-related questions in viewing metadata
    return viewings.some(viewing => 
      viewing.special_requests?.toLowerCase().includes('financing') ||
      viewing.special_requests?.toLowerCase().includes('mortgage') ||
      viewing.special_requests?.toLowerCase().includes('payment')
    )
  }
}

// Export singleton instance
export const investorDetection = new InvestorDetectionService()