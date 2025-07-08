/**
 * Unified VirtualEstate Contract Template
 * Combines all contract types into a single comprehensive agreement
 */

export interface UnifiedContractData {
  // Client Information
  client_name: string
  client_email: string
  client_phone: string
  client_id_number?: string
  
  // Property Information
  property_address: string
  property_type: string
  property_size_sqm: string | number
  property_condition: string
  property_description?: string
  listing_price: number
  
  // Contract Terms
  contract_type: 'exclusive_listing' | 'sale_agreement' | 'marketing_authorization' | 'commission_agreement' | 'standard'
  commission_rate: number
  contract_duration: number
  start_date: string
  end_date: string
  termination_notice: number
  notice_period: number
  
  // Marketing & Sales Authorization
  marketing_authorization: boolean
  online_marketing: boolean
  social_media_marketing: boolean
  photography_authorization: boolean
  virtual_tour_authorization: boolean
  signage_authorization: boolean
  
  // Commission & Payment Terms
  commission_structure: 'percentage' | 'flat_fee' | 'tiered'
  payment_terms: string
  payment_due_date: string
  additional_fees?: string
  
  // Legal & Compliance
  legal_jurisdiction: string
  governing_law: string
  dispute_resolution: 'arbitration' | 'court' | 'mediation'
  
  // Additional Services
  property_management: boolean
  maintenance_coordination: boolean
  tenant_screening?: boolean
  
  // Generated Metadata
  contract_id: string
  generated_at: string
  generated_by: string
}

export const createUnifiedContract = (leadData: any, customVariables?: Record<string, any>): UnifiedContractData => {
  const currentDate = new Date()
  const endDate = new Date(currentDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000) // 6 months later
  
  return {
    // Client Information
    client_name: leadData.name || '',
    client_email: leadData.email || '',
    client_phone: leadData.whatsapp_number || '',
    client_id_number: customVariables?.client_id_number || '',
    
    // Property Information
    property_address: `${leadData.location || ''}, Egypt`,
    property_type: leadData.property_type || '',
    property_size_sqm: leadData.property_size_sqm || 'To be determined',
    property_condition: leadData.property_condition || 'As inspected',
    property_description: customVariables?.property_description || '',
    listing_price: extractEstimatedValue(leadData.price_range) || 0,
    
    // Contract Terms
    contract_type: customVariables?.contract_type || 'standard',
    commission_rate: customVariables?.commission_rate || 2.5,
    contract_duration: customVariables?.contract_duration || 6,
    start_date: currentDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    termination_notice: customVariables?.termination_notice || 30,
    notice_period: customVariables?.notice_period || 24,
    
    // Marketing & Sales Authorization
    marketing_authorization: customVariables?.marketing_authorization !== false,
    online_marketing: customVariables?.online_marketing !== false,
    social_media_marketing: customVariables?.social_media_marketing !== false,
    photography_authorization: customVariables?.photography_authorization !== false,
    virtual_tour_authorization: customVariables?.virtual_tour_authorization !== false,
    signage_authorization: customVariables?.signage_authorization !== false,
    
    // Commission & Payment Terms
    commission_structure: customVariables?.commission_structure || 'percentage',
    payment_terms: customVariables?.payment_terms || 'Due upon successful sale completion',
    payment_due_date: customVariables?.payment_due_date || 'Upon transaction closing',
    additional_fees: customVariables?.additional_fees || '',
    
    // Legal & Compliance
    legal_jurisdiction: customVariables?.legal_jurisdiction || 'Egypt',
    governing_law: customVariables?.governing_law || 'Egyptian Real Estate Law',
    dispute_resolution: customVariables?.dispute_resolution || 'mediation',
    
    // Additional Services
    property_management: customVariables?.property_management || false,
    maintenance_coordination: customVariables?.maintenance_coordination || true,
    tenant_screening: customVariables?.tenant_screening || false,
    
    // Generated Metadata
    contract_id: `VE-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    generated_at: currentDate.toISOString(),
    generated_by: 'VirtualEstate AI Contract Generator'
  }
}

export const generateUnifiedContractHTML = (contractData: UnifiedContractData): string => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>VirtualEstate Property Agreement</title>
      <style>
        ${getUnifiedContractStyles()}
      </style>
    </head>
    <body>
      <div class="contract-container">
        <!-- Header -->
        <div class="contract-header">
          <div class="company-info">
            <h1 class="company-name">VirtualEstate</h1>
            <p class="company-tagline">Premium Real Estate Solutions</p>
            <p class="company-details">Licensed Real Estate Services | Egypt</p>
          </div>
          <div class="contract-info">
            <h2 class="contract-title">Property Service Agreement</h2>
            <p class="contract-id">Contract ID: ${contractData.contract_id}</p>
            <p class="generation-date">Generated: ${currentDate}</p>
          </div>
        </div>

        <!-- Parties Section -->
        <div class="section">
          <h3 class="section-title">Parties to Agreement</h3>
          <div class="parties-grid">
            <div class="party">
              <h4>Property Owner (Client)</h4>
              <p><strong>Name:</strong> ${contractData.client_name || 'To be filled'}</p>
              <p><strong>Email:</strong> ${contractData.client_email || 'To be filled'}</p>
              <p><strong>Phone:</strong> ${contractData.client_phone || 'To be filled'}</p>
              ${contractData.client_id_number ? `<p><strong>ID Number:</strong> ${contractData.client_id_number}</p>` : ''}
            </div>
            <div class="party">
              <h4>Real Estate Agent</h4>
              <p><strong>Company:</strong> VirtualEstate</p>
              <p><strong>License:</strong> Licensed Real Estate Services</p>
              <p><strong>Jurisdiction:</strong> ${contractData.legal_jurisdiction}</p>
            </div>
          </div>
        </div>

        <!-- Property Details Section -->
        <div class="section">
          <h3 class="section-title">Property Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Property Address:</span>
              <span class="value">${contractData.property_address || 'To be specified'}</span>
            </div>
            <div class="info-item">
              <span class="label">Property Type:</span>
              <span class="value">${contractData.property_type || 'To be specified'}</span>
            </div>
            <div class="info-item">
              <span class="label">Size:</span>
              <span class="value">${contractData.property_size_sqm} square meters</span>
            </div>
            <div class="info-item">
              <span class="label">Condition:</span>
              <span class="value">${contractData.property_condition}</span>
            </div>
            <div class="info-item">
              <span class="label">Listing Price:</span>
              <span class="value price">${formatPrice(contractData.listing_price)} EGP</span>
            </div>
            ${contractData.property_description ? `
            <div class="info-item full-width">
              <span class="label">Description:</span>
              <span class="value">${contractData.property_description}</span>
            </div>` : ''}
          </div>
        </div>

        <!-- Service Terms Section -->
        <div class="section">
          <h3 class="section-title">Service Agreement Terms</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Service Duration:</span>
              <span class="value">${contractData.contract_duration} months</span>
            </div>
            <div class="info-item">
              <span class="label">Start Date:</span>
              <span class="value">${contractData.start_date}</span>
            </div>
            <div class="info-item">
              <span class="label">End Date:</span>
              <span class="value">${contractData.end_date}</span>
            </div>
            <div class="info-item">
              <span class="label">Termination Notice:</span>
              <span class="value">${contractData.termination_notice} days</span>
            </div>
          </div>
        </div>

        <!-- Marketing Authorization Section -->
        <div class="section">
          <h3 class="section-title">Marketing Authorization</h3>
          <div class="clause-content">
            <p>The Property Owner hereby authorizes VirtualEstate to market the above-mentioned property through the following channels:</p>
            <div class="authorization-grid">
              <div class="auth-item ${contractData.marketing_authorization ? 'authorized' : 'not-authorized'}">
                <span class="auth-status">${contractData.marketing_authorization ? '✓' : '✗'}</span>
                <span>General Marketing Authorization</span>
              </div>
              <div class="auth-item ${contractData.online_marketing ? 'authorized' : 'not-authorized'}">
                <span class="auth-status">${contractData.online_marketing ? '✓' : '✗'}</span>
                <span>Online Property Portals</span>
              </div>
              <div class="auth-item ${contractData.social_media_marketing ? 'authorized' : 'not-authorized'}">
                <span class="auth-status">${contractData.social_media_marketing ? '✓' : '✗'}</span>
                <span>Social Media Marketing</span>
              </div>
              <div class="auth-item ${contractData.photography_authorization ? 'authorized' : 'not-authorized'}">
                <span class="auth-status">${contractData.photography_authorization ? '✓' : '✗'}</span>
                <span>Professional Photography</span>
              </div>
              <div class="auth-item ${contractData.virtual_tour_authorization ? 'authorized' : 'not-authorized'}">
                <span class="auth-status">${contractData.virtual_tour_authorization ? '✓' : '✗'}</span>
                <span>Virtual Tours & 3D Imagery</span>
              </div>
              <div class="auth-item ${contractData.signage_authorization ? 'authorized' : 'not-authorized'}">
                <span class="auth-status">${contractData.signage_authorization ? '✓' : '✗'}</span>
                <span>Property Signage</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Commission & Payment Section -->
        <div class="section">
          <h3 class="section-title">Commission & Payment Terms</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Commission Rate:</span>
              <span class="value">${contractData.commission_rate}%</span>
            </div>
            <div class="info-item">
              <span class="label">Commission Structure:</span>
              <span class="value">${contractData.commission_structure}</span>
            </div>
            <div class="info-item">
              <span class="label">Payment Terms:</span>
              <span class="value">${contractData.payment_terms}</span>
            </div>
            <div class="info-item">
              <span class="label">Payment Due:</span>
              <span class="value">${contractData.payment_due_date}</span>
            </div>
            ${contractData.additional_fees ? `
            <div class="info-item full-width">
              <span class="label">Additional Fees:</span>
              <span class="value">${contractData.additional_fees}</span>
            </div>` : ''}
          </div>
        </div>

        <!-- Additional Services Section -->
        ${(contractData.property_management || contractData.maintenance_coordination || contractData.tenant_screening) ? `
        <div class="section">
          <h3 class="section-title">Additional Services</h3>
          <div class="authorization-grid">
            ${contractData.property_management ? `
            <div class="auth-item authorized">
              <span class="auth-status">✓</span>
              <span>Property Management Services</span>
            </div>` : ''}
            ${contractData.maintenance_coordination ? `
            <div class="auth-item authorized">
              <span class="auth-status">✓</span>
              <span>Maintenance Coordination</span>
            </div>` : ''}
            ${contractData.tenant_screening ? `
            <div class="auth-item authorized">
              <span class="auth-status">✓</span>
              <span>Tenant Screening Services</span>
            </div>` : ''}
          </div>
        </div>` : ''}

        <!-- Terms and Conditions -->
        <div class="section">
          <h3 class="section-title">Terms and Conditions</h3>
          <div class="clause-content">
            <ol class="terms-list">
              <li><strong>Exclusive Authorization:</strong> The Property Owner grants VirtualEstate the authority to market and facilitate the sale/lease of the above property for the specified duration.</li>
              <li><strong>Marketing Commitment:</strong> VirtualEstate will use professional marketing techniques to maximize property exposure through authorized channels.</li>
              <li><strong>Commission Payment:</strong> Commission is payable upon successful completion of the sale/lease transaction as per the agreed terms.</li>
              <li><strong>Good Faith:</strong> Both parties agree to act in good faith and provide necessary cooperation throughout the contract period.</li>
              <li><strong>Property Access:</strong> The Property Owner shall provide reasonable access to the property for showings, photography, and inspections.</li>
              <li><strong>Modifications:</strong> Any modifications to this contract must be made in writing and signed by both parties.</li>
              <li><strong>Termination:</strong> Either party may terminate this agreement with ${contractData.termination_notice} days written notice.</li>
              <li><strong>Governing Law:</strong> This contract is governed by ${contractData.governing_law} and regulations.</li>
              <li><strong>Dispute Resolution:</strong> Any disputes shall be resolved through ${contractData.dispute_resolution}.</li>
            </ol>
          </div>
        </div>

        <!-- Legal Disclaimers -->
        <div class="section">
          <h3 class="section-title">Legal Disclaimers</h3>
          <div class="clause-content">
            <p class="disclaimer">This contract has been generated by VirtualEstate's AI contract system and reviewed for legal compliance. Both parties are advised to review all terms carefully and seek independent legal counsel if needed.</p>
          </div>
        </div>

        <!-- Signature Section -->
        <div class="signature-section">
          <div class="signature-grid">
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-label">
                <strong>Property Owner Signature</strong><br>
                ${contractData.client_name}<br>
                Date: ___________
              </div>
            </div>
            <div class="signature-block">
              <div class="signature-line"></div>
              <div class="signature-label">
                <strong>VirtualEstate Representative</strong><br>
                Authorized Agent<br>
                Date: ___________
              </div>
            </div>
          </div>
          <div class="witness-section">
            <div class="signature-grid">
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">
                  <strong>Witness 1</strong><br>
                  Name: ___________<br>
                  Date: ___________
                </div>
              </div>
              <div class="signature-block">
                <div class="signature-line"></div>
                <div class="signature-label">
                  <strong>Witness 2</strong><br>
                  Name: ___________<br>
                  Date: ___________
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// Helper Functions
export function extractEstimatedValue(priceRange: string): number {
  if (!priceRange) return 0
  
  const matches = priceRange.match(/[\d,.]+/)
  if (!matches) return 0
  
  const numStr = matches[0].replace(/,/g, '')
  let value = parseFloat(numStr)
  
  if (priceRange.toLowerCase().includes('m') || priceRange.toLowerCase().includes('million')) {
    value *= 1000000
  }
  
  return value
}

export function formatPrice(price: number | string): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price
  if (isNaN(numPrice)) return '0'
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numPrice)
}

export function getUnifiedContractStyles(): string {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
    }

    .contract-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .contract-header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .company-info {
      flex: 1;
    }

    .company-name {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 5px;
    }

    .company-tagline {
      font-size: 14px;
      color: #6b7280;
      font-style: italic;
    }

    .company-details {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 5px;
    }

    .contract-info {
      text-align: right;
      flex: 1;
    }

    .contract-title {
      font-size: 20px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 5px;
    }

    .contract-id {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 5px;
    }

    .generation-date {
      font-size: 12px;
      color: #9ca3af;
    }

    .section {
      margin-bottom: 30px;
      break-inside: avoid;
    }

    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #1f2937;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }

    .parties-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 20px;
    }

    .party {
      padding: 15px;
      background: #f9fafb;
      border-radius: 8px;
    }

    .party h4 {
      color: #2563eb;
      margin-bottom: 10px;
      font-size: 16px;
    }

    .party p {
      font-size: 14px;
      margin-bottom: 5px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }

    .label {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }

    .value {
      font-size: 14px;
      font-weight: 500;
      color: #1f2937;
    }

    .value.price {
      font-size: 16px;
      font-weight: bold;
      color: #059669;
    }

    .clause-content {
      font-size: 14px;
      line-height: 1.8;
      color: #374151;
    }

    .authorization-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 15px 0;
    }

    .auth-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 14px;
    }

    .auth-item.authorized {
      background: #ecfdf5;
      color: #065f46;
    }

    .auth-item.not-authorized {
      background: #fef2f2;
      color: #991b1b;
    }

    .auth-status {
      font-weight: bold;
      margin-right: 8px;
      font-size: 16px;
    }

    .terms-list {
      margin: 15px 0;
      padding-left: 20px;
    }

    .terms-list li {
      margin-bottom: 12px;
      line-height: 1.7;
    }

    .disclaimer {
      background: #fef3c7;
      padding: 15px;
      border-radius: 6px;
      font-size: 13px;
      color: #92400e;
      border-left: 4px solid #f59e0b;
    }

    .signature-section {
      margin-top: 50px;
      padding-top: 30px;
      border-top: 1px solid #e5e7eb;
    }

    .signature-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 60px;
      margin-bottom: 30px;
    }

    .signature-block {
      text-align: center;
    }

    .signature-line {
      border-bottom: 2px solid #374151;
      width: 100%;
      height: 40px;
      margin-bottom: 10px;
    }

    .signature-label {
      font-size: 12px;
      color: #6b7280;
      line-height: 1.4;
    }

    .witness-section {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }

    /* Print-specific styles */
    @media print {
      .contract-container {
        max-width: none;
        margin: 0;
        padding: 0;
      }
      
      .section {
        break-inside: avoid;
      }
      
      .signature-section {
        break-inside: avoid;
      }
    }

    @media (max-width: 768px) {
      .contract-header {
        flex-direction: column;
        text-align: center;
      }
      
      .contract-info {
        text-align: center;
        margin-top: 20px;
      }
      
      .parties-grid,
      .info-grid,
      .authorization-grid,
      .signature-grid {
        grid-template-columns: 1fr;
        gap: 15px;
      }
    }
  `
}