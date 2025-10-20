/**
 * Meta Conversions API Service
 * Integrates with OpenBeit's existing real estate platform infrastructure
 * Sends conversion events to Meta to optimize advertising algorithm
 */

import crypto from 'crypto'

interface UserData {
  em?: string[]  // Hashed email
  ph?: string[]  // Hashed phone
  client_ip_address?: string
  client_user_agent?: string
  fbc?: string   // Facebook click ID
  fbp?: string   // Facebook browser ID
}

interface CustomData {
  value?: number
  currency?: string
  content_name?: string
  content_category?: string
  content_ids?: string[]
  num_items?: number
  // OpenBeit specific fields
  lead_score?: number
  property_type?: string
  property_id?: string
  location?: string
  viewing_type?: string
  party_size?: number
  lead_quality_score?: number
  timeline?: string
  conversion_probability?: number
  broker_id?: string
  rental_nights?: number
  appraisal_type?: string
}

interface ConversionEvent {
  event_name: string
  event_time: number
  action_source: 'website' | 'email' | 'phone_call' | 'chat'
  event_source_url?: string
  user_data: UserData
  custom_data?: CustomData
  event_id?: string
}

interface ConversionRequest {
  data: ConversionEvent[]
  partner_agent?: string
  test_event_code?: string
}

export class MetaConversionsService {
  private readonly accessToken: string
  private readonly pixelId: string
  private readonly isProduction: boolean
  private readonly apiUrl: string

  constructor() {
    this.accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN || ''
    this.pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || ''
    this.isProduction = process.env.NODE_ENV === 'production'
    this.apiUrl = `https://graph.facebook.com/v18.0/${this.pixelId}/events`

    if (!this.accessToken || !this.pixelId) {
      console.warn('Meta Conversions API: Missing required environment variables')
    }
  }

  /**
   * Hash personal data for privacy compliance
   */
  private hashData(data: string): string {
    return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex')
  }

  /**
   * Normalize and hash email address
   */
  private hashEmail(email: string): string {
    if (!email) return ''
    return this.hashData(email)
  }

  /**
   * Normalize and hash phone number (remove non-digits, add country code for Egypt)
   */
  private hashPhone(phone: string): string {
    if (!phone) return ''
    
    // Remove all non-digit characters
    let cleanPhone = phone.replace(/\D/g, '')
    
    // Add Egypt country code if missing
    if (cleanPhone.startsWith('01')) {
      cleanPhone = '20' + cleanPhone
    } else if (cleanPhone.startsWith('201')) {
      // Already has country code
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('1')) {
      cleanPhone = '20' + cleanPhone
    }
    
    return this.hashData(cleanPhone)
  }

  /**
   * Generate unique event ID to prevent duplicate events
   */
  private generateEventId(baseData: string): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2)
    return this.hashData(`${baseData}_${timestamp}_${random}`).substring(0, 32)
  }

  /**
   * Calculate Meta event value based on OpenBeit's scoring system
   */
  private calculateEventValue(leadScore?: number, propertyType?: string, priceRange?: string): number {
    let baseValue = 0

    // Base value from lead score (your existing 0-65 scoring system)
    if (leadScore) {
      if (leadScore >= 50) baseValue = 500      // High-quality leads
      else if (leadScore >= 35) baseValue = 250 // Medium-quality leads
      else if (leadScore >= 20) baseValue = 100 // Basic leads
      else baseValue = 25                       // Low-quality leads
    }

    // Property type multiplier
    const typeMultipliers: Record<string, number> = {
      'villa': 1.5,
      'penthouse': 2.0,
      'compound': 1.3,
      'apartment': 1.0,
      'studio': 0.8,
      'commercial': 1.8,
      'land': 1.2
    }
    
    if (propertyType && typeMultipliers[propertyType.toLowerCase()]) {
      baseValue *= typeMultipliers[propertyType.toLowerCase()]
    }

    // Price range multiplier (based on your existing price ranges)
    if (priceRange) {
      if (priceRange.includes('5M+') || priceRange.includes('10M+')) baseValue *= 2.0
      else if (priceRange.includes('3M') || priceRange.includes('4M')) baseValue *= 1.5
      else if (priceRange.includes('2M')) baseValue *= 1.2
    }

    return Math.round(baseValue)
  }

  /**
   * Main method to track conversion events
   */
  async trackConversion(params: {
    eventName: string
    userEmail?: string
    userPhone?: string
    ipAddress?: string
    userAgent?: string
    facebookClickId?: string
    facebookBrowserId?: string
    customData?: CustomData
    eventSourceUrl?: string
    actionSource?: 'website' | 'email' | 'phone_call' | 'chat'
  }): Promise<{ success: boolean; error?: string }> {
    
    if (!this.accessToken || !this.pixelId) {
      console.warn('Meta Conversions API: Not configured, skipping event')
      return { success: false, error: 'Not configured' }
    }

    try {
      // Prepare user data with proper hashing
      const userData: UserData = {
        client_ip_address: params.ipAddress,
        client_user_agent: params.userAgent,
        fbc: params.facebookClickId,
        fbp: params.facebookBrowserId
      }

      if (params.userEmail) {
        userData.em = [this.hashEmail(params.userEmail)]
      }

      if (params.userPhone) {
        userData.ph = [this.hashPhone(params.userPhone)]
      }

      // Calculate event value if not provided
      let eventValue = params.customData?.value
      if (!eventValue && params.customData) {
        eventValue = this.calculateEventValue(
          params.customData.lead_score,
          params.customData.property_type,
          undefined // We'll add price range logic later
        )
      }

      // Prepare custom data
      const customData: CustomData = {
        currency: 'EGP',
        value: eventValue || 0,
        ...params.customData
      }

      // Create conversion event
      const event: ConversionEvent = {
        event_name: params.eventName,
        event_time: Math.floor(Date.now() / 1000),
        action_source: params.actionSource || 'website',
        event_source_url: params.eventSourceUrl || 'https://openbeit.com',
        user_data: userData,
        custom_data: customData,
        event_id: this.generateEventId(`${params.eventName}_${params.userEmail || params.userPhone || 'anonymous'}`)
      }

      // Prepare request
      const requestData: ConversionRequest = {
        data: [event],
        partner_agent: 'openbeit-platform-v1.0'
      }

      // Add test event code for development
      if (!this.isProduction && process.env.META_TEST_EVENT_CODE) {
        requestData.test_event_code = process.env.META_TEST_EVENT_CODE
      }

      // Send to Meta Conversions API
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('Meta Conversions API Error:', result)
        return { success: false, error: result.error?.message || 'API Error' }
      }

      // Log success in development
      if (!this.isProduction) {
        console.log('Meta Conversion Event Sent:', {
          event_name: params.eventName,
          value: eventValue,
          user_id: params.userEmail ? 'email_provided' : 'no_email',
          result: result
        })
      }

      return { success: true }

    } catch (error) {
      console.error('Meta Conversions API Exception:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Track lead capture (your main conversion event)
   */
  async trackLead(params: {
    userEmail?: string
    userPhone: string
    leadScore: number
    propertyType: string
    location: string
    timeline: string
    priceRange: string
    ipAddress?: string
    userAgent?: string
    utmSource?: string
    utmMedium?: string
    utmCampaign?: string
  }) {
    const eventName = params.leadScore > 40 ? 'CompleteRegistration' : 'Lead'
    
    return this.trackConversion({
      eventName,
      userEmail: params.userEmail,
      userPhone: params.userPhone,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      customData: {
        content_category: 'lead_capture',
        content_name: 'Virtual Tour Request',
        lead_score: params.leadScore,
        property_type: params.propertyType,
        location: params.location,
        timeline: params.timeline,
        value: this.calculateEventValue(params.leadScore, params.propertyType, params.priceRange)
      }
    })
  }

  /**
   * Track property viewing booking (your highest intent event)
   */
  async trackPropertyViewing(params: {
    userEmail: string
    userPhone?: string
    propertyId: string
    propertyValue: number
    viewingType: string
    partySize: number
    leadQualityScore: number
    brokerId: string
    ipAddress?: string
    userAgent?: string
  }) {
    return this.trackConversion({
      eventName: 'Purchase', // Highest intent in your funnel
      userEmail: params.userEmail,
      userPhone: params.userPhone,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      customData: {
        content_category: 'property_viewing_scheduled',
        content_name: 'Property Viewing Scheduled',
        property_id: params.propertyId,
        viewing_type: params.viewingType,
        party_size: params.partySize,
        lead_quality_score: params.leadQualityScore,
        broker_id: params.brokerId,
        conversion_probability: Math.min(params.leadQualityScore * 10, 100),
        value: Math.round(params.propertyValue * 0.025) // 2.5% commission estimate
      }
    })
  }

  /**
   * Track virtual tour engagement
   */
  async trackTourEngagement(params: {
    userEmail?: string
    propertyId: string
    engagementScore: number
    tourType: 'realsee' | 'virtual_3d' | 'video'
    duration: number
    completed: boolean
    ipAddress?: string
    userAgent?: string
  }) {
    let eventName = 'ViewContent'
    let eventValue = 10

    // Determine event type based on engagement quality
    if (params.completed && params.engagementScore > 70) {
      eventName = 'AddToCart'
      eventValue = 100
    } else if (params.engagementScore > 50) {
      eventName = 'ViewContent'
      eventValue = 50
    }

    return this.trackConversion({
      eventName,
      userEmail: params.userEmail,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      customData: {
        content_category: 'virtual_tour_engagement',
        content_name: `${params.tourType} Tour`,
        property_id: params.propertyId,
        value: eventValue
      }
    })
  }

  /**
   * Track rental booking
   */
  async trackRentalBooking(params: {
    userEmail: string
    userPhone?: string
    propertyId: string
    checkIn: string
    checkOut: string
    nights: number
    totalAmount: number
    guestCount: number
    ipAddress?: string
    userAgent?: string
  }) {
    return this.trackConversion({
      eventName: 'Purchase',
      userEmail: params.userEmail,
      userPhone: params.userPhone,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      customData: {
        content_category: 'rental_booking',
        content_name: 'Rental Property Booking',
        property_id: params.propertyId,
        rental_nights: params.nights,
        value: params.totalAmount
      }
    })
  }
}

// Export singleton instance only if environment variables are available
export const metaConversions = process.env.META_CONVERSIONS_API_ACCESS_TOKEN && process.env.NEXT_PUBLIC_META_PIXEL_ID
  ? new MetaConversionsService()
  : null