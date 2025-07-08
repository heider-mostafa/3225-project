/**
 * VirtualEstate Contract Generation Service
 * AI-powered contract generation with legal risk assessment
 * Integrates with existing leads system and OpenAI infrastructure
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { pdfGenerator } from './pdf-generator'
import { createUnifiedContract, generateUnifiedContractHTML, UnifiedContractData } from './unified-template'

// Lazy OpenAI initialization to avoid build-time errors
let openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
  return openai
}

// Types for contract generation
export interface ContractGenerationRequest {
  leadId: string
  contractType: 'exclusive_listing' | 'sale_agreement' | 'marketing_authorization' | 'commission_agreement' | 'standard'
  expedited?: boolean
  manualReview?: boolean
  customVariables?: Record<string, any>
}

export interface ContractGenerationResult {
  success: boolean
  contractId?: string
  documentUrl?: string
  aiConfidenceScore: number
  legalRiskScore: number
  autoApproved: boolean
  requiresManualReview: boolean
  estimatedValue?: number
  errors?: string[]
  warnings?: string[]
  generationTimeMs: number
}

export interface ContractPreviewResult {
  success: boolean
  leadData: LeadData
  contractData: any
  template: ContractTemplate
  aiReview: {
    confidenceScore: number
    riskFactors: string[]
    recommendations: string[]
    warnings: string[]
    complianceCheck: any
  }
  htmlContent: string
  errors?: string[]
}

export interface LeadData {
  id: string
  lead_id: string
  name: string
  email: string
  whatsapp_number: string
  location: string
  price_range: string
  property_type: string
  timeline: string
  property_size_sqm?: number
  property_condition?: string
  urgency_reason?: string
  decision_authority?: string
  legal_risk_score?: number
  contract_template_id?: string
}

export interface ContractTemplate {
  id: string
  name: string
  template_type: string
  property_type: string
  jurisdiction: string
  ownership_type: string
  template_content: any
  legal_requirements: any
  variable_definitions: any
  success_rate: number
}

export class ContractGenerator {
  private startTime: number = 0

  /**
   * Generate contract preview without saving to database
   */
  async generateContractPreview(request: ContractGenerationRequest): Promise<ContractPreviewResult> {
    this.startTime = Date.now()

    try {
      // 1. Validate and fetch lead data
      const leadData = await this.getLeadData(request.leadId)
      if (!leadData) {
        return {
          success: false,
          errors: ['Lead not found'],
          leadData: {} as LeadData,
          contractData: {},
          template: {} as ContractTemplate,
          aiReview: {
            confidenceScore: 0,
            riskFactors: [],
            recommendations: [],
            warnings: [],
            complianceCheck: {}
          },
          htmlContent: ''
        }
      }

      // 2. Perform legal risk assessment
      const riskAssessment = await this.assessLegalRisk(leadData)

      // 3. Create unified contract template
      const unifiedTemplate = {
        id: 'unified-standard',
        name: 'VirtualEstate Standard Agreement',
        template_type: request.contractType || 'standard',
        property_type: 'all',
        description: 'Comprehensive property service agreement covering all contract types',
        success_rate: 95
      }

      // 4. Generate unified contract data
      let contractData
      try {
        contractData = createUnifiedContract(leadData, {
          contract_type: request.contractType || 'standard',
          ...request.customVariables
        })
        console.log('Contract data generated successfully:', contractData.contract_id)
      } catch (contractError) {
        console.error('Error creating unified contract:', contractError)
        throw new Error(`Failed to create contract data: ${contractError instanceof Error ? contractError.message : 'Unknown error'}`)
      }

      // 5. Perform AI legal review
      const aiReview = await this.performAILegalReview(contractData, unifiedTemplate, leadData)

      // 6. Generate HTML content for preview
      const htmlContent = generateUnifiedContractHTML(contractData)

      return {
        success: true,
        leadData,
        contractData,
        template: unifiedTemplate,
        aiReview,
        htmlContent
      }

    } catch (error) {
      console.error('Contract preview generation failed:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        leadId: request.leadId,
        contractType: request.contractType
      })
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
        leadData: {} as LeadData,
        contractData: {},
        template: {} as ContractTemplate,
        aiReview: {
          confidenceScore: 0,
          riskFactors: [],
          recommendations: [],
          warnings: [],
          complianceCheck: {}
        },
        htmlContent: ''
      }
    }
  }

  /**
   * Main contract generation method
   */
  async generateContract(request: ContractGenerationRequest): Promise<ContractGenerationResult> {
    this.startTime = Date.now()

    try {
      // 1. Validate and fetch lead data
      const leadData = await this.getLeadData(request.leadId)
      if (!leadData) {
        return this.createErrorResult('Lead not found', 0)
      }

      // 2. Perform legal risk assessment
      const riskAssessment = await this.assessLegalRisk(leadData)

      // 3. Create unified contract template
      const unifiedTemplate = {
        id: 'unified-standard',
        name: 'VirtualEstate Standard Agreement',
        template_type: request.contractType || 'standard',
        property_type: 'all',
        description: 'Comprehensive property service agreement covering all contract types',
        success_rate: 95
      }

      // 4. Generate unified contract data
      let contractData
      try {
        contractData = createUnifiedContract(leadData, {
          contract_type: request.contractType || 'standard',
          ...request.customVariables
        })
        console.log('Contract data generated successfully for generation:', contractData.contract_id)
      } catch (contractError) {
        console.error('Error creating unified contract for generation:', contractError)
        throw new Error(`Failed to create contract data: ${contractError instanceof Error ? contractError.message : 'Unknown error'}`)
      }

      // 5. Perform AI legal review
      const aiReview = await this.performAILegalReview(contractData, unifiedTemplate, leadData)

      // 6. Generate PDF document
      const documentUrl = await this.generatePDFDocument(contractData, unifiedTemplate)

      // 7. Store contract in database
      const contractId = await this.storeContract(leadData, unifiedTemplate, contractData, aiReview, documentUrl, riskAssessment)

      // 8. Determine if auto-approval is possible
      const autoApproved = this.shouldAutoApprove(aiReview, riskAssessment, request.expedited)
      const requiresManualReview = request.manualReview || !autoApproved || riskAssessment.riskScore > 70

      // 9. Update lead status
      await this.updateLeadStatus(request.leadId, contractId, autoApproved, requiresManualReview)

      // 10. Send notifications
      await this.sendContractNotifications(leadData, contractId, autoApproved, requiresManualReview)

      return {
        success: true,
        contractId,
        documentUrl,
        aiConfidenceScore: aiReview.confidenceScore,
        legalRiskScore: riskAssessment.riskScore,
        autoApproved,
        requiresManualReview,
        estimatedValue: this.extractEstimatedValue(leadData.price_range),
        warnings: aiReview.warnings,
        generationTimeMs: Date.now() - this.startTime
      }

    } catch (error) {
      console.error('Contract generation failed:', error)
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown error occurred',
        0
      )
    }
  }

  /**
   * Fetch lead data from database
   */
  private async getLeadData(leadId: string): Promise<LeadData | null> {
    try {
      console.log('Fetching lead data for ID:', leadId)
      const supabase = await createServerSupabaseClient()
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single()

      if (error) {
        console.error('Database error fetching lead:', error)
        return null
      }

      if (!data) {
        console.error('No lead found with ID:', leadId)
        return null
      }

      console.log('Lead data fetched successfully:', {
        id: data.id,
        name: data.name,
        email: data.email,
        location: data.location,
        property_type: data.property_type,
        price_range: data.price_range
      })

      return data as LeadData
    } catch (error) {
      console.error('Exception in getLeadData:', error)
      return null
    }
  }

  /**
   * Assess legal risk for the property/lead
   */
  private async assessLegalRisk(leadData: LeadData): Promise<{
    riskScore: number
    riskFactors: string[]
    recommendations: string[]
  }> {
    const riskFactors: string[] = []
    const recommendations: string[] = []
    let riskScore = 10 // Base risk

    // Location-based risk assessment
    const location = leadData.location.toLowerCase()
    if (location.includes('new cairo') || location.includes('sheikh zayed') || location.includes('new capital')) {
      riskScore += 5 // Lower risk areas
    } else if (location.includes('downtown') || location.includes('old cairo')) {
      riskScore += 20 // Higher risk due to complex ownership
      riskFactors.push('Complex ownership history in older areas')
      recommendations.push('Verify property ownership history and title')
    } else {
      riskScore += 10 // Medium risk
    }

    // Price-based risk assessment
    const priceRange = leadData.price_range.toLowerCase()
    if (priceRange.includes('m') || priceRange.includes('million')) {
      riskScore += 15 // High-value properties
      riskFactors.push('High-value property requires additional documentation')
      recommendations.push('Consider additional legal review for high-value transaction')
    }

    // Property type risk assessment
    switch (leadData.property_type?.toLowerCase()) {
      case 'commercial':
        riskScore += 25
        riskFactors.push('Commercial properties have complex regulations')
        recommendations.push('Verify commercial licensing and zoning compliance')
        break
      case 'land':
        riskScore += 30
        riskFactors.push('Land sales have the highest legal complexity')
        recommendations.push('Mandatory survey and title verification required')
        break
      case 'luxury':
        riskScore += 20
        riskFactors.push('Luxury properties may have additional restrictions')
        recommendations.push('Check for any covenant restrictions or HOA requirements')
        break
      default:
        riskScore += 5 // Residential is lower risk
    }

    // Timeline urgency risk
    if (leadData.urgency_reason?.includes('emergency') || leadData.timeline?.includes('immediate')) {
      riskScore += 15
      riskFactors.push('Urgent timeline may prevent thorough due diligence')
      recommendations.push('Ensure all documentation is properly verified despite timeline pressure')
    }

    // Decision authority risk
    if (leadData.decision_authority === 'needs_approval') {
      riskScore += 10
      riskFactors.push('Decision maker not directly involved')
      recommendations.push('Obtain written authorization from property owner')
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100)

    return {
      riskScore,
      riskFactors,
      recommendations
    }
  }

  /**
   * Select the optimal contract template
   */
  private async selectOptimalTemplate(
    leadData: LeadData, 
    contractType: string,
    riskAssessment: any
  ): Promise<ContractTemplate | null> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('contract_templates')
      .select('*')
      .eq('template_type', contractType)
      .eq('is_active', true)
      .or(`property_type.eq.${leadData.property_type},property_type.eq.all`)
      .or(`jurisdiction.eq.${leadData.location},jurisdiction.eq.all`)
      .order('success_rate', { ascending: false })
      .limit(1)

    if (error || !data || data.length === 0) {
      console.error('Failed to fetch contract template:', error)
      return null
    }

    return data[0] as ContractTemplate
  }

  /**
   * Generate contract content using AI
   */
  private async generateContractContent(
    leadData: LeadData,
    template: ContractTemplate,
    customVariables?: Record<string, any>
  ): Promise<any> {
    // Prepare variables for template population
    const variables = {
      // Lead data
      owner_name: leadData.name,
      property_address: `${leadData.location}, Egypt`,
      property_type: leadData.property_type,
      property_size_sqm: leadData.property_size_sqm || 'TBD',
      property_condition: leadData.property_condition || 'to be inspected',
      
      // Derived from price range
      listing_price: this.extractEstimatedValue(leadData.price_range),
      
      // Standard VirtualEstate terms
      commission_rate: 2.5,
      contract_duration: 6,
      termination_notice: 30,
      notice_period: 24,
      
      // Dates
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      
      // Contact information
      seller_phone: leadData.whatsapp_number,
      seller_email: leadData.email,
      
      // Custom variables override defaults
      ...customVariables
    }

    // Use AI to enhance and customize the contract
    const aiPrompt = `
    You are a legal expert specializing in Egyptian real estate law. Please review and enhance this contract template with the provided variables.

    Template: ${JSON.stringify(template.template_content)}
    Variables: ${JSON.stringify(variables)}
    Lead Information: Property in ${leadData.location}, ${leadData.property_type}, price range ${leadData.price_range}

    Please:
    1. Fill in all template variables appropriately
    2. Ensure all clauses are appropriate for this specific property type and location
    3. Add any missing clauses required by Egyptian law
    4. Ensure language is clear and legally sound
    5. Return a complete, ready-to-sign contract in JSON format

    Focus on accuracy, completeness, and legal compliance for Egyptian real estate transactions.
    `

    try {
      const openaiClient = getOpenAI()
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Egyptian real estate lawyer who generates legally compliant property contracts.'
          },
          {
            role: 'user',
            content: aiPrompt
          }
        ],
        temperature: 0.1, // Low temperature for consistency
        max_tokens: 4000
      })

      const aiContent = response.choices[0]?.message?.content
      if (!aiContent) {
        throw new Error('AI failed to generate contract content')
      }

      // Try to parse AI response as JSON, fallback to template + variables
      try {
        return JSON.parse(aiContent)
      } catch {
        // Fallback: manually populate template
        return this.populateTemplate(template.template_content, variables)
      }

    } catch (error) {
      console.error('AI contract generation failed, using template fallback:', error)
      // Fallback to manual template population
      return this.populateTemplate(template.template_content, variables)
    }
  }

  /**
   * Perform AI legal review of generated contract
   */
  private async performAILegalReview(
    contractData: any,
    template: ContractTemplate,
    leadData: LeadData
  ): Promise<{
    confidenceScore: number
    riskFactors: string[]
    recommendations: string[]
    warnings: string[]
    complianceCheck: any
  }> {
    const reviewPrompt = `
    As an Egyptian real estate legal expert, please review this contract for:
    1. Legal compliance with Egyptian real estate law
    2. Completeness of required clauses
    3. Internal consistency
    4. Potential risk factors
    5. Overall quality and enforceability

    Contract: ${JSON.stringify(contractData)}
    Property Type: ${leadData.property_type}
    Location: ${leadData.location}
    Value Range: ${leadData.price_range}

    Provide a detailed analysis with:
    - Confidence score (0-100)
    - Risk factors identified
    - Recommendations for improvement
    - Compliance status
    - Any warnings

    Respond in JSON format.
    `

    try {
      const openaiClient = getOpenAI()
      const response = await openaiClient.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert legal reviewer specializing in Egyptian real estate contracts. Provide thorough, accurate legal analysis.'
          },
          {
            role: 'user',
            content: reviewPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })

      const reviewContent = response.choices[0]?.message?.content
      if (!reviewContent) {
        throw new Error('AI legal review failed')
      }

      try {
        return JSON.parse(reviewContent)
      } catch {
        // Fallback review
        return this.createFallbackReview(contractData, leadData)
      }

    } catch (error) {
      console.error('AI legal review failed:', error)
      return this.createFallbackReview(contractData, leadData)
    }
  }

  /**
   * Generate PDF document from contract data
   */
  private async generatePDFDocument(contractData: any, template: any): Promise<string> {
    try {
      // Generate unique filename
      const fileName = `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // Generate HTML content for unified contract
      const htmlContent = generateUnifiedContractHTML(contractData)
      
      // Generate and upload PDF using our PDF generator
      const { url } = await pdfGenerator.generateAndUploadPDF(
        htmlContent,
        fileName,
        {
          format: 'A4',
          orientation: 'portrait',
          printBackground: true,
          displayHeaderFooter: true
        }
      )
      
      return url
    } catch (error) {
      console.error('PDF generation failed:', error)
      
      // Fallback: return a data URL with the HTML content
      const htmlContent = generateUnifiedContractHTML(contractData)
      const base64Content = Buffer.from(htmlContent).toString('base64')
      return `data:text/html;base64,${base64Content}`
    }
  }

  /**
   * Generate PDF from HTML content (for preview downloads)
   */
  async generatePDFFromHTML(htmlContent: string, fileName?: string): Promise<string> {
    try {
      const pdfBuffer = await pdfGenerator.generatePDFFromHTML(htmlContent, {
        format: 'A4',
        orientation: 'portrait',
        printBackground: true,
        displayHeaderFooter: true
      })

      if (fileName) {
        // Upload to storage and return URL
        const supabase = await createServerSupabaseClient()
        const filePath = `contracts/previews/${fileName}.pdf`
        
        const { data, error } = await supabase.storage
          .from('documents')
          .upload(filePath, pdfBuffer, {
            contentType: 'application/pdf',
            cacheControl: '3600'
          })

        if (!error) {
          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath)
          return publicUrl
        }
      }

      // Return as data URL for immediate download
      const base64Content = pdfBuffer.toString('base64')
      return `data:application/pdf;base64,${base64Content}`
    } catch (error) {
      console.error('PDF generation from HTML failed:', error)
      throw error
    }
  }

  /**
   * Generate HTML content for the contract
   */
  private generateHTMLContract(contractData: any, template: ContractTemplate): string {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Real Estate Contract - ${template.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
          .header { text-align: center; margin-bottom: 40px; }
          .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; }
          .clause { margin-bottom: 15px; }
          .signature-line { border-bottom: 1px solid #000; width: 200px; margin: 20px 0; }
          .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">${template.name || 'Real Estate Contract'}</div>
          <div>Contract Type: ${template.template_type}</div>
          <div>Generated on: ${currentDate}</div>
        </div>

        <div class="section">
          <div class="section-title">Property Details</div>
          <div class="clause">
            Property Address: ${contractData.property_address || 'Not specified'}<br>
            Property Type: ${contractData.property_type || 'Not specified'}<br>
            Size: ${contractData.property_size_sqm || 'Not specified'} square meters<br>
            Listing Price: ${contractData.listing_price || 'Not specified'} EGP
          </div>
        </div>

        <div class="section">
          <div class="section-title">Client Information</div>
          <div class="clause">
            Client Name: ${contractData.owner_name || 'Not specified'}<br>
            Phone: ${contractData.seller_phone || 'Not specified'}<br>
            Email: ${contractData.seller_email || 'Not specified'}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Contract Terms</div>
          <div class="clause">
            Commission Rate: ${contractData.commission_rate || '2.5'}%<br>
            Contract Duration: ${contractData.contract_duration || '6'} months<br>
            Start Date: ${contractData.start_date || currentDate}<br>
            End Date: ${contractData.end_date || 'Not specified'}
          </div>
        </div>

        <div class="section">
          <div class="section-title">Marketing Authorization</div>
          <div class="clause">
            VirtualEstate is hereby authorized to market the above property through all available channels including:
            <ul>
              <li>Virtual tours and 3D photography</li>
              <li>Online property portals</li>
              <li>Social media marketing</li>
              <li>Broker network distribution</li>
              <li>Print and digital advertising</li>
            </ul>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Signatures</div>
          <div style="display: flex; justify-content: space-between; margin-top: 40px;">
            <div>
              <div class="signature-line"></div>
              <div>Client Signature</div>
              <div>Date: ___________</div>
            </div>
            <div>
              <div class="signature-line"></div>
              <div>VirtualEstate Representative</div>
              <div>Date: ___________</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>This contract was generated by VirtualEstate AI Contract Generation System</p>
          <p>For questions or modifications, please contact our legal department</p>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Store contract in database
   */
  private async storeContract(
    leadData: LeadData,
    template: ContractTemplate,
    contractData: any,
    aiReview: any,
    documentUrl: string,
    riskAssessment: any
  ): Promise<string> {
    try {
      const supabase = await createServerSupabaseClient()
      // Store main contract
      const { data: contract, error: contractError } = await supabase
        .from('lead_contracts')
        .insert({
          lead_id: leadData.id,
          contract_type: template.template_type,
          template_id: template.id,
          generation_time_ms: Date.now() - this.startTime,
          ai_confidence_score: aiReview.confidenceScore,
          legal_risk_score: riskAssessment.riskScore,
          contract_data: contractData,
          document_url: documentUrl,
          status: 'generated'
        })
        .select()
        .single()

      if (contractError) {
        console.error('Contract storage error:', contractError)
        throw new Error(`Failed to store contract: ${contractError.message}`)
      }

      if (!contract) {
        throw new Error('Contract was not returned from database')
      }

      // Store AI review
      try {
        const { error: reviewError } = await supabase
          .from('contract_ai_reviews')
          .insert({
            contract_id: contract.id,
            confidence_score: aiReview.confidenceScore,
            risk_factors: aiReview.riskFactors || [],
            compliance_check: aiReview.complianceCheck || {},
            recommendations: aiReview.recommendations || [],
            manual_review_required: riskAssessment.riskScore > 70 || aiReview.confidenceScore < 85
          })

        if (reviewError) {
          console.error('AI review storage error:', reviewError)
          // Don't fail the whole process if AI review storage fails
        }
      } catch (reviewError) {
        console.error('Failed to store AI review:', reviewError)
        // Continue without failing the contract generation
      }

      return contract.id
    } catch (error) {
      console.error('Database error in storeContract:', error)
      throw error
    }
  }

  /**
   * Update lead status after contract generation
   */
  private async updateLeadStatus(
    leadId: string,
    contractId: string,
    autoApproved: boolean,
    requiresManualReview: boolean
  ): Promise<void> {
    const supabase = await createServerSupabaseClient()
    const newStatus = autoApproved ? 'approved' : (requiresManualReview ? 'pending_review' : 'generated')
    
    await supabase
      .from('leads')
      .update({
        contract_status: newStatus,
        contract_generated_at: new Date().toISOString(),
        manual_contract_review: requiresManualReview
      })
      .eq('id', leadId)
  }

  /**
   * Send notifications about contract generation
   */
  private async sendContractNotifications(
    leadData: LeadData,
    contractId: string,
    autoApproved: boolean,
    requiresManualReview: boolean
  ): Promise<void> {
    const supabase = await createServerSupabaseClient()
    // This would integrate with your existing WhatsApp/notification system
    // For now, just log the notification
    console.log(`Contract notification: ${leadData.name} - Contract ${contractId} ${autoApproved ? 'auto-approved' : 'pending review'}`)
    
    // Store notification record
    await supabase
      .from('contract_notifications')
      .insert({
        contract_id: contractId,
        lead_id: leadData.id,
        notification_type: autoApproved ? 'contract_approved' : 'contract_generated',
        delivery_method: 'whatsapp',
        recipient_type: 'client',
        recipient_phone: leadData.whatsapp_number,
        message_content: autoApproved 
          ? `Great news! Your property contract is ready and approved. We'll send it to you shortly.`
          : `Your property contract has been generated and is under review. We'll update you soon.`,
        status: 'pending'
      })
  }

  // Helper methods
  private populateTemplate(template: any, variables: Record<string, any>): any {
    let content = JSON.stringify(template)
    
    // Replace all {{variable}} placeholders
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      content = content.replace(regex, String(value))
    })
    
    return JSON.parse(content)
  }

  private extractEstimatedValue(priceRange: string): number {
    // Extract numeric value from price range string
    const matches = priceRange.match(/[\d,.]+/)
    if (!matches) return 0
    
    const numStr = matches[0].replace(/,/g, '')
    let value = parseFloat(numStr)
    
    // Handle millions
    if (priceRange.toLowerCase().includes('m') || priceRange.toLowerCase().includes('million')) {
      value *= 1000000
    }
    
    return value
  }

  private shouldAutoApprove(aiReview: any, riskAssessment: any, expedited?: boolean): boolean {
    return (
      aiReview.confidenceScore >= 90 &&
      riskAssessment.riskScore <= 50 &&
      !expedited // Expedited contracts should be manually reviewed
    )
  }

  private createFallbackReview(contractData: any, leadData: LeadData) {
    return {
      confidenceScore: 75, // Conservative confidence for fallback
      riskFactors: ['AI review unavailable - manual review recommended'],
      recommendations: ['Have a legal specialist review this contract'],
      warnings: ['Automated legal review failed - manual review required'],
      complianceCheck: { basic_clauses: 'present', legal_review: 'required' }
    }
  }

  private createErrorResult(message: string, riskScore: number): ContractGenerationResult {
    return {
      success: false,
      aiConfidenceScore: 0,
      legalRiskScore: riskScore,
      autoApproved: false,
      requiresManualReview: true,
      errors: [message],
      generationTimeMs: Date.now() - this.startTime
    }
  }
}

// Export singleton instance
export const contractGenerator = new ContractGenerator()