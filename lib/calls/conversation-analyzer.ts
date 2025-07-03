import { OpenAI } from 'openai'

export interface ConversationAnalysis {
  summary: string
  keyInformation: {
    propertyDetails?: {
      exactLocation?: string
      bedrooms?: number
      bathrooms?: number
      sizeSqm?: number
      propertyCondition?: string
      renovationsNeeded?: string
    }
    sellingMotivation?: {
      reasonForSelling?: string
      urgencyLevel?: 'low' | 'medium' | 'high' | 'urgent'
      timelineWeeks?: number
      priceExpectation?: number
    }
    additionalInfo?: {
      currentLivingSituation?: string
      previousSellingAttempts?: boolean
      decisionMaker?: boolean
      financialSituation?: string
    }
  }
  qualificationScore: number
  nextAction: 'qualified' | 'potential' | 'unqualified' | 'callback'
  recommendedFollowUp: string
  redFlags: string[]
  positiveSignals: string[]
}

export class ConversationAnalyzer {
  private openai: OpenAI | null = null

  private getOpenAI(): OpenAI {
    if (!this.openai) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    }
    return this.openai
  }

  async analyzeConversation(transcript: string, leadInfo: any): Promise<ConversationAnalysis> {
    const analysisPrompt = `
You are an expert real estate lead analyst. Analyze this phone conversation transcript between an AI agent and a potential property seller.

LEAD INFORMATION:
- Name: ${leadInfo.name}
- Property Type: ${leadInfo.property_type}
- Location: ${leadInfo.location}
- Price Range: ${leadInfo.price_range}
- Timeline: ${leadInfo.timeline}

CONVERSATION TRANSCRIPT:
${transcript}

ANALYSIS INSTRUCTIONS:
1. Extract all property details mentioned
2. Identify selling motivation and urgency
3. Assess lead quality and likelihood to convert
4. Note any red flags or positive signals
5. Recommend next action

Provide a comprehensive analysis in JSON format with the following structure:
{
  "summary": "Brief summary of the conversation",
  "keyInformation": {
    "propertyDetails": {
      "exactLocation": "specific address or area",
      "bedrooms": number,
      "bathrooms": number,
      "sizeSqm": number,
      "propertyCondition": "excellent/good/fair/poor",
      "renovationsNeeded": "description of needed work"
    },
    "sellingMotivation": {
      "reasonForSelling": "why they're selling",
      "urgencyLevel": "low/medium/high/urgent",
      "timelineWeeks": number,
      "priceExpectation": number
    },
    "additionalInfo": {
      "currentLivingSituation": "occupied/vacant/rental",
      "previousSellingAttempts": true/false,
      "decisionMaker": true/false,
      "financialSituation": "description"
    }
  },
  "qualificationScore": 1-10,
  "nextAction": "qualified/potential/unqualified/callback",
  "recommendedFollowUp": "specific next steps",
  "redFlags": ["list of concerns"],
  "positiveSignals": ["list of positive indicators"]
}

SCORING CRITERIA (1-10):
- Property value and condition (0-3 points)
- Selling motivation and urgency (0-2 points)
- Realistic timeline (0-2 points)
- Decision maker authority (0-1 point)
- Cooperation and interest (0-2 points)

RED FLAGS:
- Unrealistic price expectations
- No decision-making authority
- Property in poor condition
- Financial distress
- Previous bad experiences
- Reluctant to proceed

POSITIVE SIGNALS:
- Motivated seller
- Realistic timeline
- Good property condition
- Clear decision maker
- Interested in service
- Asks good questions
`

    try {
      const openaiClient = this.getOpenAI()
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert real estate lead analyst. Provide detailed, accurate analysis in valid JSON format.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })

      const analysisText = response.choices[0]?.message?.content
      if (!analysisText) {
        throw new Error('No analysis generated')
      }

      // Parse the JSON response
      try {
        const analysis = JSON.parse(analysisText)
        return this.validateAnalysis(analysis)
      } catch (parseError) {
        console.error('Failed to parse analysis JSON:', parseError)
        // Return fallback analysis
        return this.createFallbackAnalysis(transcript, leadInfo)
      }

    } catch (error) {
      console.error('OpenAI analysis error:', error)
      return this.createFallbackAnalysis(transcript, leadInfo)
    }
  }

  private validateAnalysis(analysis: any): ConversationAnalysis {
    // Ensure all required fields exist with defaults
    return {
      summary: analysis.summary || 'Conversation analysis completed',
      keyInformation: {
        propertyDetails: analysis.keyInformation?.propertyDetails || {},
        sellingMotivation: analysis.keyInformation?.sellingMotivation || {},
        additionalInfo: analysis.keyInformation?.additionalInfo || {}
      },
      qualificationScore: Math.max(1, Math.min(10, analysis.qualificationScore || 5)),
      nextAction: ['qualified', 'potential', 'unqualified', 'callback'].includes(analysis.nextAction) 
        ? analysis.nextAction 
        : 'potential',
      recommendedFollowUp: analysis.recommendedFollowUp || 'Standard follow-up required',
      redFlags: Array.isArray(analysis.redFlags) ? analysis.redFlags : [],
      positiveSignals: Array.isArray(analysis.positiveSignals) ? analysis.positiveSignals : []
    }
  }

  private createFallbackAnalysis(transcript: string, leadInfo: any): ConversationAnalysis {
    // Simple fallback analysis based on transcript length and keywords
    const transcriptLength = transcript.length
    const hasPositiveKeywords = /interested|yes|definitely|sure|sounds good/i.test(transcript)
    const hasNegativeKeywords = /not interested|no|busy|later|maybe/i.test(transcript)
    
    let score = 5
    if (hasPositiveKeywords) score += 2
    if (hasNegativeKeywords) score -= 2
    if (transcriptLength > 1000) score += 1 // Longer conversation usually better
    
    score = Math.max(1, Math.min(10, score))

    return {
      summary: `Conversation with ${leadInfo.name} regarding ${leadInfo.property_type} in ${leadInfo.location}`,
      keyInformation: {
        propertyDetails: {},
        sellingMotivation: {},
        additionalInfo: {}
      },
      qualificationScore: score,
      nextAction: score >= 7 ? 'qualified' : score >= 5 ? 'potential' : 'unqualified',
      recommendedFollowUp: 'Manual review required - automated analysis failed',
      redFlags: hasNegativeKeywords ? ['Negative response detected'] : [],
      positiveSignals: hasPositiveKeywords ? ['Positive response detected'] : []
    }
  }

  async extractQuickInsights(transcript: string): Promise<{
    duration: string
    sentiment: 'positive' | 'neutral' | 'negative'
    keyTopics: string[]
    needsFollowUp: boolean
  }> {
    const words = transcript.split(' ').length
    const estimatedDuration = Math.ceil(words / 150) // ~150 words per minute

    // Simple sentiment analysis
    const positiveWords = (transcript.match(/\b(yes|interested|definitely|great|good|perfect|sure)\b/gi) || []).length
    const negativeWords = (transcript.match(/\b(no|not|never|bad|terrible|awful|busy)\b/gi) || []).length
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
    if (positiveWords > negativeWords + 2) sentiment = 'positive'
    else if (negativeWords > positiveWords + 2) sentiment = 'negative'

    // Extract key topics
    const topicKeywords = {
      'Property Details': /\b(bedrooms?|bathrooms?|size|square|meters|condition|renovations?)\b/gi,
      'Selling Motivation': /\b(sell|selling|move|moving|relocat|urgent|timeline|when)\b/gi,
      'Price Discussion': /\b(price|cost|expensive|cheap|afford|budget|money|dollars?|pounds?)\b/gi,
      'Next Steps': /\b(viewing|visit|photographer|photos?|schedule|appointment|call back)\b/gi
    }

    const keyTopics = Object.entries(topicKeywords)
      .filter(([_, pattern]) => pattern.test(transcript))
      .map(([topic, _]) => topic)

    return {
      duration: `${estimatedDuration} minutes`,
      sentiment,
      keyTopics,
      needsFollowUp: sentiment !== 'negative' && transcript.length > 200
    }
  }
}

export const conversationAnalyzer = new ConversationAnalyzer()