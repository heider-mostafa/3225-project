/**
 * Contract Download API Endpoint
 * Allows downloading of generated contracts as PDF or JSON
 */

import { NextRequest, NextResponse } from 'next/server'
import { authorizeAdminRequest } from '@/lib/auth/admin'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate admin permissions
    const authResult = await authorizeAdminRequest(request)
    if (!authResult.authorized) {
      return NextResponse.json(
        { error: authResult.error || 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const contractId = params.id
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf'

    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      )
    }

    // Get contract data from database
    const supabase = await createServerSupabaseClient()
    
    const { data: contract, error } = await supabase
      .from('lead_contracts')
      .select(`
        *,
        contract_templates (
          name,
          template_type
        ),
        leads (
          name,
          email,
          location,
          property_type
        )
      `)
      .eq('id', contractId)
      .single()

    if (error || !contract) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      )
    }

    // Generate downloadable content based on format
    if (format === 'json') {
      // Return JSON format
      const jsonData = {
        contractId: contract.id,
        contractType: contract.contract_type,
        templateName: contract.contract_templates?.name,
        leadInfo: contract.leads,
        contractData: contract.contract_data,
        status: contract.status,
        createdAt: contract.created_at,
        aiConfidenceScore: contract.ai_confidence_score,
        legalRiskScore: contract.legal_risk_score,
        autoApproved: contract.auto_approved
      }

      const fileName = `contract_${contractId}_${new Date().toISOString().split('T')[0]}.json`
      
      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      })
    } else {
      // Return HTML/PDF content
      const htmlContent = generateContractHTML(contract)
      const fileName = `contract_${contractId}_${new Date().toISOString().split('T')[0]}.html`
      
      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      })
    }

  } catch (error) {
    console.error('Contract download error:', error)
    
    return NextResponse.json(
      {
        error: 'Failed to download contract',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

function generateContractHTML(contract: any): string {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const contractData = contract.contract_data || {}
  const leadData = contract.leads || {}
  const templateName = contract.contract_templates?.name || 'Real Estate Contract'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${templateName}</title>
      <meta charset="UTF-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 40px; 
          line-height: 1.6; 
          color: #333;
        }
        .header { 
          text-align: center; 
          margin-bottom: 40px; 
          border-bottom: 2px solid #000;
          padding-bottom: 20px;
        }
        .title { 
          font-size: 28px; 
          font-weight: bold; 
          margin-bottom: 10px; 
          color: #2c3e50;
        }
        .subtitle {
          font-size: 16px;
          color: #7f8c8d;
          margin-bottom: 5px;
        }
        .section { 
          margin-bottom: 30px; 
          page-break-inside: avoid;
        }
        .section-title { 
          font-size: 18px; 
          font-weight: bold; 
          margin-bottom: 15px; 
          color: #2c3e50;
          border-bottom: 1px solid #bdc3c7;
          padding-bottom: 5px;
        }
        .clause { 
          margin-bottom: 15px; 
          text-align: justify;
        }
        .highlight {
          background-color: #f8f9fa;
          padding: 10px;
          border-left: 4px solid #3498db;
          margin: 10px 0;
        }
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
        }
        .signature-box {
          text-align: center;
          min-width: 200px;
        }
        .signature-line { 
          border-bottom: 2px solid #000; 
          width: 200px; 
          margin: 20px auto; 
          height: 40px;
        }
        .footer { 
          margin-top: 50px; 
          text-align: center; 
          font-size: 12px; 
          color: #7f8c8d;
          border-top: 1px solid #bdc3c7;
          padding-top: 20px;
        }
        .metadata {
          background-color: #ecf0f1;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 30px;
          font-size: 14px;
        }
        @media print {
          body { margin: 20px; }
          .page-break { page-break-before: always; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">${templateName}</div>
        <div class="subtitle">Contract ID: ${contract.id}</div>
        <div class="subtitle">Generated on: ${currentDate}</div>
        <div class="subtitle">Status: ${contract.status?.toUpperCase() || 'GENERATED'}</div>
      </div>

      <div class="metadata">
        <strong>Contract Details:</strong><br>
        Type: ${contract.contract_type}<br>
        AI Confidence Score: ${contract.ai_confidence_score || 'N/A'}%<br>
        Legal Risk Score: ${contract.legal_risk_score || 'N/A'}%<br>
        Auto-Approved: ${contract.auto_approved ? 'Yes' : 'No'}
      </div>

      <div class="section">
        <div class="section-title">Property Information</div>
        <div class="clause">
          <strong>Property Address:</strong> ${contractData.property_address || leadData.location || 'Not specified'}<br>
          <strong>Property Type:</strong> ${contractData.property_type || leadData.property_type || 'Not specified'}<br>
          <strong>Property Size:</strong> ${contractData.property_size_sqm || contractData.size_sqm || 'Not specified'} square meters<br>
          <strong>Property Condition:</strong> ${contractData.property_condition || 'As-is, where-is'}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Financial Terms</div>
        <div class="highlight">
          <strong>Listing Price:</strong> ${contractData.listing_price || 'To be determined'} EGP<br>
          <strong>Commission Rate:</strong> ${contractData.commission_rate || '2.5'}%<br>
          <strong>Estimated Property Value:</strong> ${contract.estimated_value || 'Based on market analysis'}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Client Information</div>
        <div class="clause">
          <strong>Client Name:</strong> ${contractData.owner_name || leadData.name || 'Not specified'}<br>
          <strong>Phone Number:</strong> ${contractData.seller_phone || leadData.whatsapp_number || 'Not specified'}<br>
          <strong>Email Address:</strong> ${contractData.seller_email || leadData.email || 'Not specified'}
        </div>
      </div>

      <div class="section">
        <div class="section-title">Contract Duration & Terms</div>
        <div class="clause">
          <strong>Contract Duration:</strong> ${contractData.contract_duration || '6'} months<br>
          <strong>Start Date:</strong> ${contractData.start_date || currentDate}<br>
          <strong>End Date:</strong> ${contractData.end_date || 'To be calculated'}<br>
          <strong>Termination Notice:</strong> ${contractData.termination_notice || '30'} days written notice required
        </div>
      </div>

      <div class="section">
        <div class="section-title">Marketing Authorization</div>
        <div class="clause">
          The undersigned hereby grants VirtualEstate exclusive authorization to market the above-described property through all available channels, including but not limited to:
        </div>
        <div class="highlight">
          <ul>
            <li>Professional photography and virtual tours</li>
            <li>3D property walkthroughs and staging</li>
            <li>Online property portals and websites</li>
            <li>Social media marketing campaigns</li>
            <li>Broker network distribution</li>
            <li>Print and digital advertising</li>
            <li>AI-powered lead matching and qualification</li>
          </ul>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Terms and Conditions</div>
        <div class="clause">
          1. <strong>Exclusive Rights:</strong> VirtualEstate shall have exclusive rights to market and sell the property during the contract period.<br><br>
          2. <strong>Commission Payment:</strong> Commission shall be paid upon successful completion of sale and transfer of title.<br><br>
          3. <strong>Property Access:</strong> Client agrees to provide reasonable access to the property for photography, virtual tours, and showings.<br><br>
          4. <strong>Marketing Standards:</strong> All marketing materials will maintain high professional standards and accurately represent the property.<br><br>
          5. <strong>Client Cooperation:</strong> Client agrees to cooperate with VirtualEstate's marketing efforts and respond promptly to inquiries.
        </div>
      </div>

      <div class="page-break"></div>

      <div class="section">
        <div class="section-title">Legal Compliance & Disclaimers</div>
        <div class="clause">
          This contract has been generated using VirtualEstate's AI-powered contract generation system and has been reviewed for compliance with Egyptian real estate law. All parties are encouraged to seek independent legal counsel before signing.
        </div>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div><strong>Property Owner Signature</strong></div>
          <div>Date: _______________</div>
          <div>Print Name: ${leadData.name || '_________________'}</div>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div><strong>VirtualEstate Representative</strong></div>
          <div>Date: _______________</div>
          <div>Print Name: _________________</div>
        </div>
      </div>

      <div class="footer">
        <p><strong>VirtualEstate AI Contract Generation System</strong></p>
        <p>This contract was automatically generated and reviewed by our AI legal system</p>
        <p>For questions, modifications, or legal review, please contact our legal department</p>
        <p>Contract ID: ${contract.id} | Generated: ${currentDate}</p>
      </div>
    </body>
    </html>
  `
} 