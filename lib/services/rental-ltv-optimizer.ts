/**
 * Rental LTV Optimizer
 * Phase 2.4: Rental Marketplace LTV Optimization
 * 
 * Leverages existing rental marketplace infrastructure:
 * - rental_bookings table with Paymob payment integration
 * - rental_reviews with guest rating system
 * - rental_listings with performance metrics
 * - Comprehensive guest behavior tracking
 */

import { createClient } from '@/utils/supabase/client'
import { metaConversions } from './meta-conversions'

export interface RentalCustomerProfile {
  customer_id: string
  customer_segment: 'budget_traveler' | 'business_traveler' | 'luxury_seeker' | 'local_resident' | 'property_investor' | 'repeat_family'
  
  ltv_metrics: {
    total_bookings: number
    total_revenue: number // EGP
    average_booking_value: number
    booking_frequency: number // bookings per year
    seasonal_patterns: string[]
    preferred_property_types: string[]
    booking_lead_time: number // days in advance
    average_stay_duration: number // nights
    cancellation_rate: number
    review_score_average: number
  }
  
  predictive_analytics: {
    predicted_ltv_12_months: number
    predicted_ltv_24_months: number
    churn_probability: number
    upsell_potential: number
    referral_likelihood: number
    next_booking_probability: number
    price_sensitivity: 'low' | 'medium' | 'high'
  }
  
  revenue_optimization: {
    optimal_pricing_tier: string
    best_marketing_channels: string[]
    preferred_communication_style: string
    seasonal_booking_windows: string[]
    investment_signals: {
      multiple_property_interest: boolean
      long_term_booking_patterns: boolean
      business_booking_indicators: boolean
      luxury_preference_signals: boolean
    }
  }
  
  meta_optimization: {
    meta_value_score: number // 0-100
    recommended_meta_events: string[]
    optimal_meta_value: number // EGP
    conversion_probability: number
  }
}

export interface RentalBookingMetaEvent {
  booking_id: string
  event_type: 'search_started' | 'property_viewed' | 'booking_initiated' | 'payment_started' | 'booking_confirmed' | 'stay_completed' | 'review_left'
  customer_profile: RentalCustomerProfile
  booking_value: number
  meta_event_name: string
  meta_value: number
}

export class RentalLTVOptimizer {
  
  /**
   * Calculate comprehensive customer LTV profile
   */
  async calculateCustomerLTV(customerId: string): Promise<RentalCustomerProfile | null> {
    try {
      const supabase = createClient()
      
      // Get customer booking history
      const { data: bookings, error: bookingsError } = await supabase
        .from('rental_bookings')
        .select(`
          *,
          rental_listings (
            *,
            properties (
              property_type,
              price,
              location,
              city
            )
          ),
          rental_reviews (
            overall_rating,
            review_text
          )
        `)
        .eq('guest_user_id', customerId)
        .order('created_at', { ascending: false })
      
      if (bookingsError || !bookings || bookings.length === 0) {
        console.log(`No booking history found for customer ${customerId}`)
        return null
      }
      
      // Calculate LTV metrics
      const ltvMetrics = this.calculateLTVMetrics(bookings)
      
      // Generate predictive analytics
      const predictiveAnalytics = this.generatePredictiveAnalytics(bookings, ltvMetrics)
      
      // Determine customer segment
      const customerSegment = this.segmentCustomer(bookings, ltvMetrics, predictiveAnalytics)
      
      // Calculate revenue optimization strategies
      const revenueOptimization = this.calculateRevenueOptimization(bookings, customerSegment, predictiveAnalytics)
      
      // Generate Meta optimization profile
      const metaOptimization = this.calculateMetaOptimization(customerSegment, ltvMetrics, predictiveAnalytics)
      
      return {
        customer_id: customerId,
        customer_segment: customerSegment,
        ltv_metrics: ltvMetrics,
        predictive_analytics: predictiveAnalytics,
        revenue_optimization: revenueOptimization,
        meta_optimization: metaOptimization
      }
      
    } catch (error) {
      console.error('LTV calculation error:', error)
      return null
    }
  }
  
  /**
   * Track rental booking event and send appropriate Meta events
   */
  async trackRentalBookingEvent(params: {
    eventType: 'search_started' | 'property_viewed' | 'booking_initiated' | 'payment_started' | 'booking_confirmed' | 'stay_completed' | 'review_left'
    customerId?: string
    bookingId?: string
    rentalListingId?: string
    bookingValue?: number
    searchFilters?: any
    userInfo?: { email?: string; phone?: string }
    trackingParams?: { fbclid?: string; fbc?: string }
  }): Promise<{ success: boolean; metaEventSent: boolean; customerProfile?: RentalCustomerProfile }> {
    
    try {
      let customerProfile: RentalCustomerProfile | null = null
      
      // Get customer profile if available
      if (params.customerId) {
        customerProfile = await this.calculateCustomerLTV(params.customerId)
      }
      
      // Determine Meta event details based on event type and customer profile
      const metaEventDetails = this.determineMetaEvent(params.eventType, customerProfile, params.bookingValue || 0)
      
      if (metaEventDetails.shouldSendEvent) {
        // Send to Meta Conversions API
        const metaResult = await metaConversions.trackConversion({
          eventName: metaEventDetails.eventName,
          userEmail: params.userInfo?.email,
          userPhone: params.userInfo?.phone,
          value: metaEventDetails.value,
          currency: 'EGP',
          customData: {
            content_category: 'rental_marketplace',
            rental_event_type: params.eventType,
            customer_segment: customerProfile?.customer_segment || 'unknown',
            ltv_score: customerProfile?.meta_optimization.meta_value_score || 0,
            predicted_ltv: customerProfile?.predictive_analytics.predicted_ltv_12_months || 0,
            booking_frequency: customerProfile?.ltv_metrics.booking_frequency || 0,
            rental_listing_id: params.rentalListingId,
            booking_id: params.bookingId,
            search_filters: params.searchFilters
          },
          facebookClickId: params.trackingParams?.fbclid,
          facebookBrowserId: params.trackingParams?.fbc
        })
        
        return {
          success: true,
          metaEventSent: metaResult.success,
          customerProfile: customerProfile || undefined
        }
      }
      
      return {
        success: true,
        metaEventSent: false,
        customerProfile: customerProfile || undefined
      }
      
    } catch (error) {
      console.error('Rental booking tracking error:', error)
      return { success: false, metaEventSent: false }
    }
  }
  
  /**
   * Get high-value rental customers for targeting
   */
  async getHighValueCustomers(params: {
    minLTV?: number
    minBookings?: number
    segments?: string[]
    limit?: number
  } = {}): Promise<Array<{
    customer_id: string
    customer_profile: RentalCustomerProfile
    contact_info: { email?: string; phone?: string }
    last_booking: Date
    recommended_actions: string[]
  }>> {
    
    try {
      const supabase = createClient()
      
      // Get customers with multiple bookings
      const { data: repeatCustomers } = await supabase
        .from('rental_bookings')
        .select(`
          guest_user_id,
          guest_email,
          guest_phone,
          created_at,
          total_amount,
          auth.users!inner(id, email, phone)
        `)
        .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()) // Last year
        .order('created_at', { ascending: false })
      
      if (!repeatCustomers) return []
      
      // Group by customer and calculate profiles
      const customerGroups = new Map()
      for (const booking of repeatCustomers) {
        const customerId = booking.guest_user_id
        if (!customerGroups.has(customerId)) {
          customerGroups.set(customerId, [])
        }
        customerGroups.get(customerId).push(booking)
      }
      
      const highValueCustomers = []
      
      for (const [customerId, bookings] of customerGroups) {
        // Only analyze customers with multiple bookings or high-value single bookings
        if (bookings.length >= (params.minBookings || 2) || 
            bookings.some(b => b.total_amount >= (params.minLTV || 5000))) {
          
          const customerProfile = await this.calculateCustomerLTV(customerId)
          
          if (customerProfile && 
              customerProfile.predictive_analytics.predicted_ltv_12_months >= (params.minLTV || 5000) &&
              (!params.segments || params.segments.includes(customerProfile.customer_segment))) {
            
            const recommendedActions = this.generateCustomerRecommendations(customerProfile)
            
            highValueCustomers.push({
              customer_id: customerId,
              customer_profile: customerProfile,
              contact_info: {
                email: bookings[0].guest_email || bookings[0].users?.email,
                phone: bookings[0].guest_phone || bookings[0].users?.phone
              },
              last_booking: new Date(bookings[0].created_at),
              recommended_actions: recommendedActions
            })
          }
        }
      }
      
      // Sort by LTV score descending
      highValueCustomers.sort((a, b) => 
        b.customer_profile.meta_optimization.meta_value_score - 
        a.customer_profile.meta_optimization.meta_value_score
      )
      
      return highValueCustomers.slice(0, params.limit || 50)
      
    } catch (error) {
      console.error('High-value customers query error:', error)
      return []
    }
  }
  
  /**
   * Calculate LTV metrics from booking history
   */
  private calculateLTVMetrics(bookings: any[]): RentalCustomerProfile['ltv_metrics'] {
    const totalRevenue = bookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0)
    const completedBookings = bookings.filter(b => b.booking_status === 'completed')
    const reviews = bookings.flatMap(b => b.rental_reviews || [])
    
    // Calculate seasonal patterns
    const bookingMonths = bookings.map(b => new Date(b.created_at).getMonth())
    const seasonalPatterns = this.calculateSeasonalPatterns(bookingMonths)
    
    // Calculate booking frequency (annualized)
    const oldestBooking = new Date(bookings[bookings.length - 1].created_at)
    const yearsSinceFirst = Math.max((Date.now() - oldestBooking.getTime()) / (365 * 24 * 60 * 60 * 1000), 1)
    const bookingFrequency = bookings.length / yearsSinceFirst
    
    // Extract property types preference
    const propertyTypes = bookings.map(b => b.rental_listings?.properties?.property_type).filter(Boolean)
    const preferredPropertyTypes = [...new Set(propertyTypes)]
    
    // Calculate average stay duration
    const avgStayDuration = bookings.reduce((sum, b) => sum + (b.number_of_nights || 0), 0) / bookings.length
    
    // Calculate cancellation rate
    const cancelledBookings = bookings.filter(b => b.booking_status === 'cancelled')
    const cancellationRate = cancelledBookings.length / bookings.length
    
    // Calculate average review score
    const avgReviewScore = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / reviews.length 
      : 0
    
    // Calculate booking lead time
    const leadTimes = bookings
      .filter(b => b.check_in_date && b.created_at)
      .map(b => {
        const checkIn = new Date(b.check_in_date)
        const booked = new Date(b.created_at)
        return Math.max(0, (checkIn.getTime() - booked.getTime()) / (24 * 60 * 60 * 1000))
      })
    const avgLeadTime = leadTimes.length > 0 ? leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length : 0
    
    return {
      total_bookings: bookings.length,
      total_revenue: totalRevenue,
      average_booking_value: totalRevenue / bookings.length,
      booking_frequency: bookingFrequency,
      seasonal_patterns: seasonalPatterns,
      preferred_property_types: preferredPropertyTypes,
      booking_lead_time: avgLeadTime,
      average_stay_duration: avgStayDuration,
      cancellation_rate: cancellationRate,
      review_score_average: avgReviewScore
    }
  }
  
  /**
   * Generate predictive analytics
   */
  private generatePredictiveAnalytics(bookings: any[], ltvMetrics: any): RentalCustomerProfile['predictive_analytics'] {
    // Simple predictive model based on booking patterns
    const recentBookings = bookings.filter(b => 
      new Date(b.created_at) > new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) // Last 6 months
    )
    
    // Predict 12-month LTV
    const predicted12MonthLTV = ltvMetrics.average_booking_value * ltvMetrics.booking_frequency * 1.2
    
    // Predict 24-month LTV (with growth factor)
    const predicted24MonthLTV = predicted12MonthLTV * 2 * 1.1
    
    // Calculate churn probability (higher for customers with declining activity)
    const hasRecentActivity = recentBookings.length > 0
    const churnProbability = hasRecentActivity ? 
      Math.max(0.1, 0.5 - (ltvMetrics.booking_frequency * 0.1)) : 0.8
    
    // Upsell potential based on booking value growth
    const avgRecentValue = recentBookings.length > 0 
      ? recentBookings.reduce((sum, b) => sum + b.total_amount, 0) / recentBookings.length
      : ltvMetrics.average_booking_value
    const upsellPotential = Math.min(1, Math.max(0, avgRecentValue / ltvMetrics.average_booking_value))
    
    // Referral likelihood based on review scores and booking frequency
    const referralLikelihood = Math.min(1, 
      (ltvMetrics.review_score_average / 5) * (ltvMetrics.booking_frequency / 2)
    )
    
    // Next booking probability
    const daysSinceLastBooking = bookings.length > 0 
      ? (Date.now() - new Date(bookings[0].created_at).getTime()) / (24 * 60 * 60 * 1000)
      : 999
    const nextBookingProbability = Math.max(0.1, 1 - (daysSinceLastBooking / 365))
    
    // Price sensitivity based on booking patterns
    const priceVariation = this.calculatePriceVariation(bookings)
    const priceSensitivity = priceVariation > 0.3 ? 'high' : priceVariation > 0.15 ? 'medium' : 'low'
    
    return {
      predicted_ltv_12_months: predicted12MonthLTV,
      predicted_ltv_24_months: predicted24MonthLTV,
      churn_probability: churnProbability,
      upsell_potential: upsellPotential,
      referral_likelihood: referralLikelihood,
      next_booking_probability: nextBookingProbability,
      price_sensitivity: priceSensitivity as 'low' | 'medium' | 'high'
    }
  }
  
  /**
   * Segment customer based on behavior patterns
   */
  private segmentCustomer(
    bookings: any[], 
    ltvMetrics: any, 
    predictiveAnalytics: any
  ): RentalCustomerProfile['customer_segment'] {
    
    // Property investor signals
    if (ltvMetrics.booking_frequency > 3 && 
        bookings.some(b => b.number_of_nights > 30) &&
        ltvMetrics.preferred_property_types.length > 1) {
      return 'property_investor'
    }
    
    // Business traveler signals
    if (ltvMetrics.booking_lead_time < 7 && 
        ltvMetrics.average_stay_duration < 5 &&
        ltvMetrics.booking_frequency > 2) {
      return 'business_traveler'
    }
    
    // Luxury seeker signals
    if (ltvMetrics.average_booking_value > 3000 &&
        ltvMetrics.review_score_average > 4.5) {
      return 'luxury_seeker'
    }
    
    // Repeat family signals
    if (ltvMetrics.booking_frequency > 1 && 
        ltvMetrics.average_stay_duration > 7 &&
        bookings.some(b => b.number_of_guests > 2)) {
      return 'repeat_family'
    }
    
    // Local resident signals
    if (bookings.some(b => 
      b.rental_listings?.properties?.city && 
      this.isLocalCity(b.rental_listings.properties.city)
    )) {
      return 'local_resident'
    }
    
    return 'budget_traveler'
  }
  
  /**
   * Calculate revenue optimization strategies
   */
  private calculateRevenueOptimization(
    bookings: any[], 
    segment: string, 
    predictiveAnalytics: any
  ): RentalCustomerProfile['revenue_optimization'] {
    
    const optimalPricingTier = predictiveAnalytics.upsell_potential > 0.7 ? 'premium' :
                             predictiveAnalytics.upsell_potential > 0.4 ? 'standard' : 'budget'
    
    const bestMarketingChannels = segment === 'luxury_seeker' ? ['instagram', 'facebook'] :
                                segment === 'business_traveler' ? ['linkedin', 'google_ads'] :
                                ['facebook', 'whatsapp']
    
    const preferredCommunication = segment === 'business_traveler' ? 'email' :
                                 segment === 'local_resident' ? 'whatsapp' : 'sms'
    
    // Extract seasonal windows from booking history
    const bookingMonths = bookings.map(b => new Date(b.created_at).getMonth())
    const seasonalWindows = this.identifySeasonalWindows(bookingMonths)
    
    const investmentSignals = {
      multiple_property_interest: bookings.length > 2 && 
        new Set(bookings.map(b => b.rental_listing_id)).size > 1,
      long_term_booking_patterns: bookings.some(b => b.number_of_nights > 30),
      business_booking_indicators: segment === 'business_traveler',
      luxury_preference_signals: segment === 'luxury_seeker'
    }
    
    return {
      optimal_pricing_tier: optimalPricingTier,
      best_marketing_channels: bestMarketingChannels,
      preferred_communication_style: preferredCommunication,
      seasonal_booking_windows: seasonalWindows,
      investment_signals: investmentSignals
    }
  }
  
  /**
   * Calculate Meta optimization profile
   */
  private calculateMetaOptimization(
    segment: string, 
    ltvMetrics: any, 
    predictiveAnalytics: any
  ): RentalCustomerProfile['meta_optimization'] {
    
    // Calculate Meta value score (0-100)
    let metaValueScore = 0
    
    // LTV contribution (40 points max)
    metaValueScore += Math.min(40, (predictiveAnalytics.predicted_ltv_12_months / 10000) * 40)
    
    // Booking frequency contribution (20 points max)
    metaValueScore += Math.min(20, ltvMetrics.booking_frequency * 5)
    
    // Segment contribution (20 points max)
    const segmentScores = {
      'property_investor': 20,
      'luxury_seeker': 18,
      'business_traveler': 15,
      'repeat_family': 12,
      'local_resident': 8,
      'budget_traveler': 5
    }
    metaValueScore += segmentScores[segment] || 5
    
    // Retention contribution (20 points max)
    metaValueScore += Math.min(20, (1 - predictiveAnalytics.churn_probability) * 20)
    
    // Determine recommended Meta events
    const recommendedMetaEvents = []
    if (metaValueScore >= 80) recommendedMetaEvents.push('Purchase')
    if (predictiveAnalytics.next_booking_probability > 0.6) recommendedMetaEvents.push('Subscribe')
    if (ltvMetrics.booking_frequency > 2) recommendedMetaEvents.push('AddToCart')
    recommendedMetaEvents.push('Lead')
    
    // Calculate optimal Meta value (EGP)
    const optimalMetaValue = Math.min(
      predictiveAnalytics.predicted_ltv_12_months * 0.1, // 10% of predicted LTV
      5000 // Cap at 5000 EGP
    )
    
    return {
      meta_value_score: Math.round(metaValueScore),
      recommended_meta_events: recommendedMetaEvents,
      optimal_meta_value: optimalMetaValue,
      conversion_probability: predictiveAnalytics.next_booking_probability
    }
  }
  
  /**
   * Determine Meta event details based on event type and customer profile
   */
  private determineMetaEvent(
    eventType: string, 
    customerProfile: RentalCustomerProfile | null, 
    bookingValue: number
  ): { shouldSendEvent: boolean; eventName: string; value: number } {
    
    const baseValue = bookingValue || 100
    const ltvMultiplier = customerProfile ? 
      Math.min(3, customerProfile.meta_optimization.meta_value_score / 50) : 1
    
    switch (eventType) {
      case 'search_started':
        return {
          shouldSendEvent: true,
          eventName: 'Search',
          value: 25 * ltvMultiplier
        }
        
      case 'property_viewed':
        return {
          shouldSendEvent: true,
          eventName: 'ViewContent',
          value: 50 * ltvMultiplier
        }
        
      case 'booking_initiated':
        return {
          shouldSendEvent: true,
          eventName: customerProfile?.customer_segment === 'property_investor' ? 'AddToCart' : 'InitiateCheckout',
          value: baseValue * 0.3 * ltvMultiplier
        }
        
      case 'payment_started':
        return {
          shouldSendEvent: true,
          eventName: 'AddPaymentInfo',
          value: baseValue * 0.5 * ltvMultiplier
        }
        
      case 'booking_confirmed':
        return {
          shouldSendEvent: true,
          eventName: customerProfile?.meta_optimization.meta_value_score >= 70 ? 'Purchase' : 'CompleteRegistration',
          value: baseValue * 0.8 * ltvMultiplier
        }
        
      case 'stay_completed':
        return {
          shouldSendEvent: true,
          eventName: 'Purchase',
          value: baseValue * ltvMultiplier
        }
        
      case 'review_left':
        return {
          shouldSendEvent: customerProfile?.ltv_metrics.booking_frequency > 1,
          eventName: 'Subscribe',
          value: 200 * ltvMultiplier
        }
        
      default:
        return { shouldSendEvent: false, eventName: 'ViewContent', value: 0 }
    }
  }
  
  // Helper methods
  
  private calculateSeasonalPatterns(bookingMonths: number[]): string[] {
    const seasonCounts = { winter: 0, spring: 0, summer: 0, fall: 0 }
    
    bookingMonths.forEach(month => {
      if (month >= 11 || month <= 1) seasonCounts.winter++
      else if (month >= 2 && month <= 4) seasonCounts.spring++
      else if (month >= 5 && month <= 7) seasonCounts.summer++
      else seasonCounts.fall++
    })
    
    const totalBookings = bookingMonths.length
    const patterns = []
    
    Object.entries(seasonCounts).forEach(([season, count]) => {
      if (count / totalBookings > 0.3) patterns.push(season)
    })
    
    return patterns
  }
  
  private calculatePriceVariation(bookings: any[]): number {
    if (bookings.length < 2) return 0
    
    const prices = bookings.map(b => b.nightly_rate || b.total_amount / (b.number_of_nights || 1))
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length
    
    return Math.sqrt(variance) / avgPrice
  }
  
  private isLocalCity(city: string): boolean {
    const localCities = ['cairo', 'alexandria', 'giza', 'luxor', 'aswan', 'hurghada', 'sharm el sheikh']
    return localCities.some(local => city.toLowerCase().includes(local))
  }
  
  private identifySeasonalWindows(bookingMonths: number[]): string[] {
    const windows = []
    const monthCounts = new Array(12).fill(0)
    
    bookingMonths.forEach(month => monthCounts[month]++)
    
    const avgCount = monthCounts.reduce((a, b) => a + b, 0) / 12
    
    monthCounts.forEach((count, month) => {
      if (count > avgCount * 1.5) {
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
        windows.push(monthNames[month])
      }
    })
    
    return windows
  }
  
  private generateCustomerRecommendations(profile: RentalCustomerProfile): string[] {
    const recommendations = []
    
    if (profile.meta_optimization.meta_value_score >= 80) {
      recommendations.push('VIP customer treatment - assign dedicated account manager')
    }
    
    if (profile.customer_segment === 'property_investor') {
      recommendations.push('Offer bulk booking discounts and investment consultation')
    }
    
    if (profile.predictive_analytics.churn_probability > 0.6) {
      recommendations.push('Send retention campaign with personalized offers')
    }
    
    if (profile.predictive_analytics.next_booking_probability > 0.7) {
      recommendations.push('Send proactive booking suggestions within 2 weeks')
    }
    
    if (profile.ltv_metrics.review_score_average > 4.5) {
      recommendations.push('Request referrals and testimonials')
    }
    
    return recommendations
  }
}

export const rentalLTVOptimizer = new RentalLTVOptimizer()