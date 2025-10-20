/**
 * Meta Conversation Tracker
 * Phase 2.3: OpenAI Realtime Conversation Meta Integration
 * 
 * Integrates with existing conversation systems:
 * - OpenAI Realtime API (/app/api/realtime/token/route.ts)
 * - Conversation Analyzer (/lib/calls/conversation-analyzer.ts)
 * - Call webhook system (/app/api/calls/webhook/route.ts)
 * - HeyGen avatar conversations
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { metaConversions } from './meta-conversions'
import type { ConversationAnalysis } from '@/lib/calls/conversation-analyzer'

export interface ConversationEventData {
  sessionId: string
  eventType: 'started' | 'message_sent' | 'qualified' | 'completed' | 'high_intent'
  conversationType: 'openai_realtime' | 'heygen_avatar' | 'text_chat' | 'phone_call'
  propertyId?: string
  userId?: string
  
  // Conversation analytics
  qualificationScore?: number // 1-10 scale from conversation analyzer
  engagementQuality?: number // 0-100 calculated score
  nextAction?: 'qualified' | 'potential' | 'unqualified' | 'callback'
  conversationDuration?: number // seconds
  sentimentScore?: number // -1 to 1
  
  // Intent detection
  buyingIntent?: 'high' | 'medium' | 'low' | 'unknown'
  timelineUrgency?: 'immediate' | 'soon' | 'exploring' | 'unknown'
  budgetDiscussed?: boolean
  financingMentioned?: boolean
  viewingRequested?: boolean
  
  // Conversation content
  keyTopics?: string[]
  positiveSignals?: string[]
  redFlags?: string[]
  conversationSummary?: string
  
  // User info for Meta tracking
  userEmail?: string
  userPhone?: string
  facebookClickId?: string
  facebookBrowserId?: string
  
  // Additional metadata
  eventData?: Record<string, any>
}

export interface MetaConversationInsights {
  conversionProbability: number
  engagementScore: number
  intentSignals: string[]
  valueEstimate: number
  recommendedMetaEvent: string
  metaValue: number
}

export class MetaConversationTracker {
  
  /**
   * Track a conversation event and send to Meta if qualified
   */
  async trackConversationEvent(eventData: ConversationEventData): Promise<{
    success: boolean
    conversationEventId?: string
    metaEventSent?: boolean
    metaEventId?: string
    insights?: MetaConversationInsights
  }> {
    try {
      const supabase = await createServerSupabaseClient()
      
      // Calculate Meta insights
      const insights = this.calculateMetaInsights(eventData)
      
      // Store conversation event
      const { data: conversationEvent, error } = await supabase
        .from('conversation_events')
        .insert({
          session_id: eventData.sessionId,
          event_type: eventData.eventType,
          conversation_type: eventData.conversationType,
          property_id: eventData.propertyId,
          user_id: eventData.userId,
          qualification_score: eventData.qualificationScore || 0,
          engagement_quality: insights.engagementScore,
          next_action: eventData.nextAction,
          conversation_duration: eventData.conversationDuration || 0,
          sentiment_score: eventData.sentimentScore || 0,
          buying_intent: eventData.buyingIntent || 'unknown',
          timeline_urgency: eventData.timelineUrgency || 'unknown',
          budget_discussed: eventData.budgetDiscussed || false,
          financing_mentioned: eventData.financingMentioned || false,
          viewing_requested: eventData.viewingRequested || false,
          key_topics: eventData.keyTopics || [],
          positive_signals: eventData.positiveSignals || [],
          red_flags: eventData.redFlags || [],
          conversation_summary: eventData.conversationSummary,
          facebook_click_id: eventData.facebookClickId,
          facebook_browser_id: eventData.facebookBrowserId,
          user_email: eventData.userEmail,
          user_phone: eventData.userPhone,
          event_data: eventData.eventData || {}
        })
        .select('id, meta_event_name, meta_event_value')
        .single()
      
      if (error) {
        console.error('Failed to store conversation event:', error)
        return { success: false }
      }
      
      // Send to Meta if qualified
      let metaEventSent = false
      let metaEventId = undefined
      
      if (this.shouldSendMetaEvent(eventData, insights)) {
        const metaResult = await this.sendConversationToMeta(
          eventData,
          insights,
          conversationEvent.meta_event_name,
          conversationEvent.meta_event_value
        )
        
        if (metaResult.success) {
          metaEventSent = true
          metaEventId = metaResult.eventId
          
          // Update conversation event with Meta tracking info
          await supabase
            .from('conversation_events')
            .update({
              meta_event_sent: true,
              meta_event_id: metaEventId
            })
            .eq('id', conversationEvent.id)
        }
      }
      
      return {
        success: true,
        conversationEventId: conversationEvent.id,
        metaEventSent,
        metaEventId,
        insights
      }
      
    } catch (error) {
      console.error('Conversation tracking error:', error)
      return { success: false }
    }
  }
  
  /**
   * Track OpenAI Realtime session creation
   */
  async trackOpenAIRealtimeSession(params: {
    sessionId: string
    propertyId: string
    userInfo?: { email?: string; phone?: string }
    trackingParams?: { fbclid?: string; fbc?: string }
  }): Promise<{ success: boolean }> {
    
    const eventData: ConversationEventData = {
      sessionId: params.sessionId,
      eventType: 'started',
      conversationType: 'openai_realtime',
      propertyId: params.propertyId,
      userEmail: params.userInfo?.email,
      userPhone: params.userInfo?.phone,
      facebookClickId: params.trackingParams?.fbclid,
      facebookBrowserId: params.trackingParams?.fbc,
      eventData: {
        model: 'gpt-4o-realtime-preview-2024-12-17',
        voice: 'alloy',
        agent_type: 'elite_sales_specialist'
      }
    }
    
    const result = await this.trackConversationEvent(eventData)
    return { success: result.success }
  }
  
  /**
   * Track conversation completion with analysis results
   */
  async trackConversationCompletion(params: {
    sessionId: string
    conversationType: 'openai_realtime' | 'heygen_avatar' | 'text_chat' | 'phone_call'
    analysis: ConversationAnalysis
    duration: number
    propertyId?: string
    userInfo?: { email?: string; phone?: string; userId?: string }
    trackingParams?: { fbclid?: string; fbc?: string }
  }): Promise<{ success: boolean; metaEventSent: boolean }> {
    
    const eventData: ConversationEventData = {
      sessionId: params.sessionId,
      eventType: 'completed',
      conversationType: params.conversationType,
      propertyId: params.propertyId,
      userId: params.userInfo?.userId,
      qualificationScore: params.analysis.qualificationScore,
      nextAction: params.analysis.nextAction,
      conversationDuration: params.duration,
      buyingIntent: this.determineBuyingIntent(params.analysis),
      timelineUrgency: this.determineTimelineUrgency(params.analysis),
      budgetDiscussed: this.hasBudgetDiscussion(params.analysis),
      financingMentioned: this.hasFinancingMentions(params.analysis),
      viewingRequested: this.hasViewingRequest(params.analysis),
      keyTopics: this.extractKeyTopics(params.analysis),
      positiveSignals: params.analysis.positiveSignals || [],
      redFlags: params.analysis.redFlags || [],
      conversationSummary: params.analysis.summary,
      userEmail: params.userInfo?.email,
      userPhone: params.userInfo?.phone,
      facebookClickId: params.trackingParams?.fbclid,
      facebookBrowserId: params.trackingParams?.fbc,
      eventData: {
        recommended_follow_up: params.analysis.recommendedFollowUp,
        key_information: params.analysis.keyInformation
      }
    }
    
    const result = await this.trackConversationEvent(eventData)
    return { 
      success: result.success, 
      metaEventSent: result.metaEventSent || false 
    }
  }
  
  /**
   * Track HeyGen avatar conversation interactions
   */
  async trackHeyGenConversation(params: {
    sessionId: string
    propertyId: string
    agentType: string
    duration: number
    interactionData: any
    qualificationScore?: number
    userInfo?: { email?: string; phone?: string; userId?: string }
  }): Promise<{ success: boolean }> {
    
    const eventData: ConversationEventData = {
      sessionId: params.sessionId,
      eventType: 'completed',
      conversationType: 'heygen_avatar',
      propertyId: params.propertyId,
      userId: params.userInfo?.userId,
      qualificationScore: params.qualificationScore || 0,
      conversationDuration: params.duration,
      engagementQuality: this.calculateHeyGenEngagement(params.interactionData),
      userEmail: params.userInfo?.email,
      userPhone: params.userInfo?.phone,
      eventData: {
        agent_type: params.agentType,
        interaction_data: params.interactionData
      }
    }
    
    const result = await this.trackConversationEvent(eventData)
    return { success: result.success }
  }
  
  /**
   * Calculate Meta insights from conversation data
   */
  private calculateMetaInsights(eventData: ConversationEventData): MetaConversationInsights {
    const qualificationScore = eventData.qualificationScore || 0
    const engagementQuality = this.calculateEngagementScore(eventData)
    
    // Calculate conversion probability (0-100)
    let conversionProbability = qualificationScore * 10 // Convert 1-10 to 0-100
    
    // Boost based on intent signals
    const intentSignals = []
    if (eventData.viewingRequested) {
      conversionProbability += 20
      intentSignals.push('viewing_requested')
    }
    if (eventData.financingMentioned) {
      conversionProbability += 15
      intentSignals.push('financing_discussed')
    }
    if (eventData.budgetDiscussed) {
      conversionProbability += 10
      intentSignals.push('budget_discussed')
    }
    if (eventData.buyingIntent === 'high') {
      conversionProbability += 25
      intentSignals.push('high_buying_intent')
    }
    if (eventData.timelineUrgency === 'immediate') {
      conversionProbability += 20
      intentSignals.push('urgent_timeline')
    }
    
    conversionProbability = Math.min(conversionProbability, 100)
    
    // Calculate value estimate
    const baseValue = qualificationScore * 50 // 50 EGP per qualification point
    const intentMultiplier = eventData.buyingIntent === 'high' ? 2 : 
                           eventData.buyingIntent === 'medium' ? 1.5 : 1
    const valueEstimate = baseValue * intentMultiplier
    
    // Determine recommended Meta event
    const recommendedMetaEvent = this.determineMetaEventType(eventData)
    
    // Calculate Meta value (in EGP)
    const metaValue = this.calculateMetaValue(conversionProbability, valueEstimate, eventData.propertyId)
    
    return {
      conversionProbability,
      engagementScore: engagementQuality,
      intentSignals,
      valueEstimate,
      recommendedMetaEvent,
      metaValue
    }
  }
  
  /**
   * Calculate engagement score based on conversation data
   */
  private calculateEngagementScore(eventData: ConversationEventData): number {
    let score = 0
    
    // Duration scoring (max 30 points)
    const duration = eventData.conversationDuration || 0
    if (duration > 300) score += 30      // 5+ minutes
    else if (duration > 180) score += 20 // 3+ minutes
    else if (duration > 60) score += 10  // 1+ minute
    
    // Qualification scoring (max 30 points)
    score += (eventData.qualificationScore || 0) * 3
    
    // Intent signals (max 40 points)
    if (eventData.viewingRequested) score += 15
    if (eventData.financingMentioned) score += 10
    if (eventData.budgetDiscussed) score += 8
    if (eventData.buyingIntent === 'high') score += 7
    
    return Math.min(score, 100)
  }
  
  /**
   * Calculate Meta value for the event
   */
  private calculateMetaValue(conversionProbability: number, valueEstimate: number, propertyId?: string): number {
    // Base value from conversion probability and estimate
    const baseValue = (conversionProbability / 100) * valueEstimate
    
    // Minimum value for any qualified conversation
    const minValue = 25 // 25 EGP minimum
    
    return Math.max(baseValue, minValue)
  }
  
  /**
   * Determine Meta event type based on conversation data
   */
  private determineMetaEventType(eventData: ConversationEventData): string {
    const score = eventData.qualificationScore || 0
    
    // High-value events for qualified conversations
    if (score >= 8 || eventData.buyingIntent === 'high') {
      return 'Purchase'
    }
    
    // Viewing requests are high intent
    if (eventData.viewingRequested) {
      return 'Schedule'
    }
    
    // Financing discussions indicate serious interest
    if (eventData.financingMentioned) {
      return 'AddPaymentInfo'
    }
    
    // Qualified conversations
    if (score >= 6 || eventData.buyingIntent === 'medium') {
      return 'CompleteRegistration'
    }
    
    // General engagement
    if (score >= 4 || eventData.eventType === 'completed') {
      return 'Lead'
    }
    
    // Default to ViewContent for any conversation interaction
    return 'ViewContent'
  }
  
  /**
   * Check if event should be sent to Meta
   */
  private shouldSendMetaEvent(eventData: ConversationEventData, insights: MetaConversationInsights): boolean {
    // Send for high engagement or qualified conversations
    return insights.engagementScore >= 40 || 
           (eventData.qualificationScore || 0) >= 5 ||
           eventData.viewingRequested ||
           eventData.buyingIntent === 'high' ||
           eventData.buyingIntent === 'medium'
  }
  
  /**
   * Send conversation event to Meta Conversions API
   */
  private async sendConversationToMeta(
    eventData: ConversationEventData,
    insights: MetaConversationInsights,
    metaEventName: string,
    metaEventValue: number
  ): Promise<{ success: boolean; eventId?: string }> {
    
    try {
      const result = await metaConversions.trackConversion({
        eventName: metaEventName,
        userEmail: eventData.userEmail,
        userPhone: eventData.userPhone,
        value: metaEventValue,
        currency: 'EGP',
        customData: {
          content_category: 'conversation_engagement',
          conversation_type: eventData.conversationType,
          qualification_score: eventData.qualificationScore,
          buying_intent: eventData.buyingIntent,
          engagement_score: insights.engagementScore,
          conversion_probability: insights.conversionProbability,
          property_id: eventData.propertyId,
          session_id: eventData.sessionId,
          intent_signals: insights.intentSignals.join(','),
          next_action: eventData.nextAction
        },
        facebookClickId: eventData.facebookClickId,
        facebookBrowserId: eventData.facebookBrowserId
      })
      
      return {
        success: result.success,
        eventId: result.eventId
      }
      
    } catch (error) {
      console.error('Meta conversation event error:', error)
      return { success: false }
    }
  }
  
  // Helper methods for extracting insights from ConversationAnalysis
  
  private determineBuyingIntent(analysis: ConversationAnalysis): 'high' | 'medium' | 'low' | 'unknown' {
    if (analysis.qualificationScore >= 8) return 'high'
    if (analysis.qualificationScore >= 6) return 'medium'
    if (analysis.qualificationScore >= 4) return 'low'
    return 'unknown'
  }
  
  private determineTimelineUrgency(analysis: ConversationAnalysis): 'immediate' | 'soon' | 'exploring' | 'unknown' {
    const timeline = analysis.keyInformation?.sellingMotivation?.urgencyLevel
    switch (timeline) {
      case 'urgent': return 'immediate'
      case 'high': return 'soon'
      case 'medium': return 'exploring'
      default: return 'unknown'
    }
  }
  
  private hasBudgetDiscussion(analysis: ConversationAnalysis): boolean {
    return !!(analysis.keyInformation?.sellingMotivation?.priceExpectation ||
             analysis.keyInformation?.additionalInfo?.financialSituation)
  }
  
  private hasFinancingMentions(analysis: ConversationAnalysis): boolean {
    const content = analysis.summary.toLowerCase()
    return /\b(financing|loan|mortgage|bank|payment|installment)\b/.test(content)
  }
  
  private hasViewingRequest(analysis: ConversationAnalysis): boolean {
    const content = analysis.summary.toLowerCase()
    return /\b(viewing|visit|see|show|appointment|schedule)\b/.test(content)
  }
  
  private extractKeyTopics(analysis: ConversationAnalysis): string[] {
    const topics = []
    if (analysis.keyInformation?.propertyDetails) topics.push('property_details')
    if (analysis.keyInformation?.sellingMotivation) topics.push('selling_motivation')
    if (this.hasFinancingMentions(analysis)) topics.push('financing')
    if (this.hasViewingRequest(analysis)) topics.push('viewing_request')
    return topics
  }
  
  private calculateHeyGenEngagement(interactionData: any): number {
    // Calculate engagement based on HeyGen interaction data
    let score = 0
    
    if (interactionData?.duration > 60) score += 20  // Longer interaction
    if (interactionData?.questions_asked > 3) score += 15  // Active participation
    if (interactionData?.agent_responses > 5) score += 10  // Good conversation
    if (interactionData?.follow_up_requested) score += 25  // High intent
    
    return Math.min(score, 100)
  }
}

export const metaConversationTracker = new MetaConversationTracker()