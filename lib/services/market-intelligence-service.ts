/**
 * Market Intelligence Service
 * Aggregates appraisal data for market insights without exposing individual properties
 */

import { createServerClient } from '@supabase/ssr'

export interface CompoundAnalytics {
  compound_name: string
  total_properties_appraised: number
  price_trends: {
    period: '1_year' | '6_months' | '1_month' | 'today'
    average_price_per_sqm: number
    price_change_percentage: number
    sample_size: number
  }[]
  property_type_distribution: {
    type: string
    count: number
    avg_price_per_sqm: number
  }[]
  market_velocity_indicators: {
    time_to_sell_estimate: number // days
    market_activity_score: number // 0-100
    supply_demand_ratio: number
  }
}

export interface AreaAnalytics {
  area_name: string
  district: string
  governance: string
  
  market_overview: {
    total_properties_analyzed: number
    date_range: { from: Date; to: Date }
    coverage_percentage: number // % of area covered by appraisals
  }
  
  price_analytics: {
    current_avg_price_per_sqm: number
    price_trends: TimePeriodTrend[]
    price_range_distribution: PriceRangeDistribution[]
  }
  
  investment_indicators: {
    roi_potential_score: number // 0-100
    rental_yield_estimate: number
    appreciation_trend: 'strong_growth' | 'moderate_growth' | 'stable' | 'declining'
    investment_risk_level: 'low' | 'medium' | 'high'
  }
}

interface TimePeriodTrend {
  period: string
  avg_price_per_sqm: number
  change_from_previous: number
  confidence_level: number // based on sample size
}

interface PriceRangeDistribution {
  min_price: number
  max_price: number
  property_count: number
  percentage_of_market: number
}

interface MarketPredictiveInsights {
  area_name: string
  
  // LEGAL DISCLAIMER REQUIRED
  disclaimer: "These insights are for informational purposes only and do not constitute financial advice"
  
  market_direction_indicators: {
    price_momentum: 'accelerating_up' | 'steady_up' | 'flat' | 'steady_down' | 'accelerating_down'
    confidence_score: number // 0-100 based on data quality
    contributing_factors: string[]
  }
  
  timing_indicators: {
    market_cycle_position: 'early_growth' | 'expansion' | 'peak' | 'contraction' | 'bottom'
    seasonal_patterns: SeasonalPattern[]
    optimal_transaction_timing: string // "Q1 2025" etc
  }
  
  comparative_analysis: {
    vs_similar_areas: ComparisonMetric[]
    vs_cairo_average: ComparisonMetric
    vs_national_average: ComparisonMetric
  }
}

interface SeasonalPattern {
  season: string
  typical_price_change: number
  activity_level: 'high' | 'medium' | 'low'
  historical_pattern_strength: number
}

interface ComparisonMetric {
  comparison_target: string
  price_differential_percentage: number
  growth_differential: number
  investment_attractiveness_relative: number
}

class MarketIntelligenceService {
  private createSupabaseClient() {
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {},
      }
    )
  }

  /**
   * Get compound-level market analytics
   */
  async getCompoundAnalytics(compoundName: string, dateRange?: { from: Date; to: Date }): Promise<CompoundAnalytics | null> {
    try {
      const endDate = dateRange?.to || new Date()
      const startDate = dateRange?.from || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // 1 year ago

      // Get appraisals for the compound within date range
      const supabase = this.createSupabaseClient()
      const { data: appraisals, error } = await supabase
        .from('property_appraisals')
        .select(`
          id,
          created_at,
          appraised_value,
          built_area_sqm,
          property_type,
          location_data,
          form_data
        `)
        .ilike('form_data->compound_name', `%${compoundName}%`)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('status', 'completed')

      if (error || !appraisals || appraisals.length === 0) {
        console.log(`No appraisal data found for compound: ${compoundName}`)
        return null
      }

      // Calculate price trends over different periods
      const priceTrends = this.calculatePriceTrends(appraisals, endDate)
      
      // Analyze property type distribution
      const propertyTypeDistribution = this.analyzePropertyTypeDistribution(appraisals)
      
      // Calculate market velocity indicators
      const marketVelocityIndicators = this.calculateMarketVelocity(appraisals, compoundName)

      return {
        compound_name: compoundName,
        total_properties_appraised: appraisals.length,
        price_trends: priceTrends,
        property_type_distribution: propertyTypeDistribution,
        market_velocity_indicators: marketVelocityIndicators
      }

    } catch (error) {
      console.error('Error getting compound analytics:', error)
      return null
    }
  }

  /**
   * Get area-level market analytics (broader than compound)
   */
  async getAreaAnalytics(areaName: string): Promise<AreaAnalytics | null> {
    try {
      // Get all appraisals in the area
      const supabase = this.createSupabaseClient()
      const { data: appraisals, error } = await supabase
        .from('property_appraisals')
        .select(`
          id,
          created_at,
          appraised_value,
          built_area_sqm,
          property_type,
          location_data,
          form_data
        `)
        .or(`form_data->area.ilike.%${areaName}%,form_data->district.ilike.%${areaName}%,form_data->city.ilike.%${areaName}%`)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })

      if (error || !appraisals || appraisals.length === 0) {
        return null
      }

      // Calculate market overview
      const marketOverview = {
        total_properties_analyzed: appraisals.length,
        date_range: {
          from: new Date(appraisals[appraisals.length - 1].created_at),
          to: new Date(appraisals[0].created_at)
        },
        coverage_percentage: this.estimateCoveragePercentage(appraisals, areaName)
      }

      // Calculate price analytics
      const priceAnalytics = this.calculateAreaPriceAnalytics(appraisals)
      
      // Calculate investment indicators
      const investmentIndicators = this.calculateInvestmentIndicators(appraisals, areaName)

      return {
        area_name: areaName,
        district: this.extractDistrict(appraisals[0]),
        governance: this.extractGovernance(appraisals[0]),
        market_overview: marketOverview,
        price_analytics: priceAnalytics,
        investment_indicators: investmentIndicators
      }

    } catch (error) {
      console.error('Error getting area analytics:', error)
      return null
    }
  }

  /**
   * Get predictive market insights with legal disclaimers
   */
  async getMarketPredictiveInsights(areaName: string): Promise<MarketPredictiveInsights | null> {
    try {
      // Get historical data for trend analysis
      const appraisals = await this.getHistoricalAppraisalData(areaName, 24) // 24 months

      if (!appraisals || appraisals.length < 10) {
        return null // Need minimum data for predictions
      }

      // Analyze market direction indicators
      const marketDirectionIndicators = this.analyzeMarketDirection(appraisals)
      
      // Calculate timing indicators
      const timingIndicators = this.calculateTimingIndicators(appraisals)
      
      // Perform comparative analysis
      const comparativeAnalysis = await this.performComparativeAnalysis(areaName, appraisals)

      return {
        area_name: areaName,
        disclaimer: "These insights are for informational purposes only and do not constitute financial advice",
        market_direction_indicators: marketDirectionIndicators,
        timing_indicators: timingIndicators,
        comparative_analysis: comparativeAnalysis
      }

    } catch (error) {
      console.error('Error generating predictive insights:', error)
      return null
    }
  }

  /**
   * Calculate price trends over different time periods
   */
  private calculatePriceTrends(appraisals: any[], endDate: Date): TimePeriodTrend[] {
    const periods = [
      { name: '1_year', months: 12 },
      { name: '6_months', months: 6 },
      { name: '1_month', months: 1 },
      { name: 'today', months: 0 }
    ]

    return periods.map(period => {
      const periodStart = new Date(endDate)
      periodStart.setMonth(periodStart.getMonth() - period.months)

      const periodAppraisals = period.months === 0 
        ? appraisals.filter(a => {
            const appraisalDate = new Date(a.created_at)
            return appraisalDate.toDateString() === endDate.toDateString()
          })
        : appraisals.filter(a => {
            const appraisalDate = new Date(a.created_at)
            return appraisalDate >= periodStart && appraisalDate <= endDate
          })

      if (periodAppraisals.length === 0) {
        return {
          period: period.name,
          avg_price_per_sqm: 0,
          change_from_previous: 0,
          confidence_level: 0
        }
      }

      const avgPricePerSqm = periodAppraisals.reduce((sum, appraisal) => {
        const pricePerSqm = appraisal.appraised_value / (appraisal.built_area_sqm || 1)
        return sum + pricePerSqm
      }, 0) / periodAppraisals.length

      return {
        period: period.name,
        avg_price_per_sqm: Math.round(avgPricePerSqm),
        change_from_previous: 0, // Would calculate based on previous period
        confidence_level: Math.min(100, (periodAppraisals.length / 5) * 100) // 5+ samples = 100% confidence
      }
    })
  }

  /**
   * Analyze property type distribution in the dataset
   */
  private analyzePropertyTypeDistribution(appraisals: any[]): any[] {
    const typeGroups = appraisals.reduce((groups, appraisal) => {
      const type = appraisal.property_type || 'unknown'
      if (!groups[type]) {
        groups[type] = []
      }
      groups[type].push(appraisal)
      return groups
    }, {})

    return Object.entries(typeGroups).map(([type, appraisals]: [string, any[]]) => {
      const avgPricePerSqm = appraisals.reduce((sum, appraisal) => {
        return sum + (appraisal.appraised_value / (appraisal.built_area_sqm || 1))
      }, 0) / appraisals.length

      return {
        type,
        count: appraisals.length,
        avg_price_per_sqm: Math.round(avgPricePerSqm)
      }
    })
  }

  /**
   * Calculate market velocity indicators
   */
  private calculateMarketVelocity(appraisals: any[], compoundName: string): any {
    // These would be enhanced with real market data
    // For now, provide estimates based on appraisal frequency and patterns
    
    const recentAppraisals = appraisals.filter(a => {
      const appraisalDate = new Date(a.created_at)
      const threeMonthsAgo = new Date()
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
      return appraisalDate >= threeMonthsAgo
    })

    const marketActivityScore = Math.min(100, (recentAppraisals.length / appraisals.length) * 200)

    return {
      time_to_sell_estimate: this.estimateTimeToSell(appraisals, compoundName),
      market_activity_score: Math.round(marketActivityScore),
      supply_demand_ratio: this.estimateSupplyDemandRatio(appraisals)
    }
  }

  /**
   * Estimate time to sell based on market activity
   */
  private estimateTimeToSell(appraisals: any[], compoundName: string): number {
    // Base estimate on appraisal frequency and property type
    const avgDaysBetweenAppraisals = this.calculateAvgDaysBetweenAppraisals(appraisals)
    
    // Higher frequency = faster market = shorter time to sell
    const baseTimeToSell = 90 // 3 months base
    const frequencyMultiplier = Math.max(0.5, Math.min(2, avgDaysBetweenAppraisals / 30))
    
    return Math.round(baseTimeToSell * frequencyMultiplier)
  }

  /**
   * Calculate average days between appraisals
   */
  private calculateAvgDaysBetweenAppraisals(appraisals: any[]): number {
    if (appraisals.length < 2) return 30 // Default 30 days

    const sortedAppraisals = appraisals.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    let totalDays = 0
    for (let i = 1; i < sortedAppraisals.length; i++) {
      const prevDate = new Date(sortedAppraisals[i - 1].created_at)
      const currDate = new Date(sortedAppraisals[i].created_at)
      const daysDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
      totalDays += daysDiff
    }

    return totalDays / (sortedAppraisals.length - 1)
  }

  /**
   * Estimate supply/demand ratio
   */
  private estimateSupplyDemandRatio(appraisals: any[]): number {
    // This would be enhanced with actual market data
    // For now, estimate based on appraisal patterns and property types
    
    const luxuryProperties = appraisals.filter(a => {
      const pricePerSqm = a.appraised_value / (a.built_area_sqm || 1)
      return pricePerSqm > 15000 // EGP per sqm
    })

    const luxuryRatio = luxuryProperties.length / appraisals.length
    
    // Higher luxury ratio often indicates supply > demand (need appraisals for pricing)
    // Lower luxury ratio might indicate demand > supply (standard properties moving fast)
    return Number((1 + luxuryRatio).toFixed(2))
  }

  // Additional helper methods would be implemented...
  
  private estimateCoveragePercentage(appraisals: any[], areaName: string): number {
    // Estimate what percentage of the area's properties we have appraisal data for
    // This would require external data sources for total property counts
    return Math.min(100, appraisals.length * 2) // Rough estimate
  }

  private calculateAreaPriceAnalytics(appraisals: any[]): any {
    // Implementation for detailed price analytics
    return {
      current_avg_price_per_sqm: 0,
      price_trends: [],
      price_range_distribution: []
    }
  }

  private calculateInvestmentIndicators(appraisals: any[], areaName: string): any {
    // Implementation for investment analysis
    return {
      roi_potential_score: 0,
      rental_yield_estimate: 0,
      appreciation_trend: 'stable' as const,
      investment_risk_level: 'medium' as const
    }
  }

  private async getHistoricalAppraisalData(areaName: string, months: number): Promise<any[] | null> {
    // Implementation for historical data retrieval
    return null
  }

  private analyzeMarketDirection(appraisals: any[]): any {
    // Implementation for market direction analysis
    return {
      price_momentum: 'steady_up' as const,
      confidence_score: 0,
      contributing_factors: []
    }
  }

  private calculateTimingIndicators(appraisals: any[]): any {
    // Implementation for timing analysis
    return {
      market_cycle_position: 'expansion' as const,
      seasonal_patterns: [],
      optimal_transaction_timing: 'Q1 2025'
    }
  }

  private async performComparativeAnalysis(areaName: string, appraisals: any[]): Promise<any> {
    // Implementation for comparative analysis
    return {
      vs_similar_areas: [],
      vs_cairo_average: { comparison_target: 'Cairo Average', price_differential_percentage: 0, growth_differential: 0, investment_attractiveness_relative: 0 },
      vs_national_average: { comparison_target: 'National Average', price_differential_percentage: 0, growth_differential: 0, investment_attractiveness_relative: 0 }
    }
  }

  private extractDistrict(appraisal: any): string {
    return appraisal.form_data?.district || 'Unknown District'
  }

  private extractGovernance(appraisal: any): string {
    return appraisal.form_data?.governance || 'Unknown Governance'
  }
}

export const marketIntelligenceService = new MarketIntelligenceService()
export default marketIntelligenceService