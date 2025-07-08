/**
 * PDF Generation Service
 * Handles PDF generation from HTML content using Puppeteer
 */

import puppeteer from 'puppeteer'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export interface PDFGenerationOptions {
  format?: 'A4' | 'A3' | 'Letter'
  orientation?: 'portrait' | 'landscape'
  margins?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
  printBackground?: boolean
  displayHeaderFooter?: boolean
  headerTemplate?: string
  footerTemplate?: string
}

export class PDFGenerator {
  private static instance: PDFGenerator | null = null
  private browser: puppeteer.Browser | null = null

  private constructor() {}

  static getInstance(): PDFGenerator {
    if (!PDFGenerator.instance) {
      PDFGenerator.instance = new PDFGenerator()
    }
    return PDFGenerator.instance
  }

  /**
   * Initialize browser instance
   */
  private async initBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--allow-running-insecure-content'
        ]
      })
    }
    return this.browser
  }

  /**
   * Generate PDF from HTML content
   */
  async generatePDFFromHTML(
    htmlContent: string,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    const browser = await this.initBrowser()
    const page = await browser.newPage()

    try {
      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 1
      })

      // Enhanced HTML with styles for better PDF rendering
      const enhancedHTML = this.enhanceHTMLForPDF(htmlContent)
      await page.setContent(enhancedHTML, {
        waitUntil: 'networkidle0',
        timeout: 30000
      })

      // Generate PDF with options
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        landscape: options.orientation === 'landscape',
        printBackground: options.printBackground !== false,
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || this.getDefaultFooterTemplate(),
        margin: {
          top: options.margins?.top || '20mm',
          right: options.margins?.right || '20mm',
          bottom: options.margins?.bottom || '20mm',
          left: options.margins?.left || '20mm'
        }
      })

      return pdfBuffer
    } finally {
      await page.close()
    }
  }

  /**
   * Generate PDF and upload to Supabase Storage
   */
  async generateAndUploadPDF(
    htmlContent: string,
    fileName: string,
    options: PDFGenerationOptions = {}
  ): Promise<{ url: string; path: string }> {
    const pdfBuffer = await this.generatePDFFromHTML(htmlContent, options)
    
    // Upload to Supabase Storage
    const supabase = await createServerSupabaseClient()
    const filePath = `contracts/${fileName}.pdf`
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      })

    if (error) {
      console.error('Error uploading PDF:', error)
      throw new Error(`Failed to upload PDF: ${error.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    return {
      url: publicUrl,
      path: filePath
    }
  }

  /**
   * Generate contract PDF with VirtualEstate branding
   */
  async generateContractPDF(
    contractData: any,
    template: any,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
    const htmlContent = this.generateContractHTML(contractData, template)
    
    const contractOptions: PDFGenerationOptions = {
      format: 'A4',
      orientation: 'portrait',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: this.getContractHeaderTemplate(),
      footerTemplate: this.getContractFooterTemplate(),
      margins: {
        top: '30mm',
        right: '20mm',
        bottom: '25mm',
        left: '20mm'
      },
      ...options
    }

    return this.generatePDFFromHTML(htmlContent, contractOptions)
  }

  /**
   * Enhanced HTML generation for contracts
   */
  private generateContractHTML(contractData: any, template: any): string {
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
        <title>VirtualEstate Contract - ${template.name}</title>
        <style>
          ${this.getContractStyles()}
        </style>
      </head>
      <body>
        <div class="contract-container">
          <!-- Header -->
          <div class="contract-header">
            <div class="company-info">
              <h1 class="company-name">VirtualEstate</h1>
              <p class="company-tagline">Premium Real Estate Solutions</p>
            </div>
            <div class="contract-info">
              <h2 class="contract-title">${template.name}</h2>
              <p class="contract-type">Contract Type: ${template.template_type}</p>
              <p class="generation-date">Generated: ${currentDate}</p>
            </div>
          </div>

          <!-- Contract Content -->
          <div class="contract-content">
            <!-- Property Details Section -->
            <div class="section">
              <h3 class="section-title">Property Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Property Address:</span>
                  <span class="value">${contractData.property_address || 'Not specified'}</span>
                </div>
                <div class="info-item">
                  <span class="label">Property Type:</span>
                  <span class="value">${contractData.property_type || 'Not specified'}</span>
                </div>
                <div class="info-item">
                  <span class="label">Size:</span>
                  <span class="value">${contractData.property_size_sqm || 'Not specified'} square meters</span>
                </div>
                <div class="info-item">
                  <span class="label">Condition:</span>
                  <span class="value">${contractData.property_condition || 'As inspected'}</span>
                </div>
                <div class="info-item">
                  <span class="label">Listing Price:</span>
                  <span class="value price">${this.formatPrice(contractData.listing_price)} EGP</span>
                </div>
              </div>
            </div>

            <!-- Client Information Section -->
            <div class="section">
              <h3 class="section-title">Client Information</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Client Name:</span>
                  <span class="value">${contractData.owner_name || 'Not specified'}</span>
                </div>
                <div class="info-item">
                  <span class="label">Phone:</span>
                  <span class="value">${contractData.seller_phone || 'Not specified'}</span>
                </div>
                <div class="info-item">
                  <span class="label">Email:</span>
                  <span class="value">${contractData.seller_email || 'Not specified'}</span>
                </div>
              </div>
            </div>

            <!-- Contract Terms Section -->
            <div class="section">
              <h3 class="section-title">Contract Terms</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Commission Rate:</span>
                  <span class="value">${contractData.commission_rate || '2.5'}%</span>
                </div>
                <div class="info-item">
                  <span class="label">Contract Duration:</span>
                  <span class="value">${contractData.contract_duration || '6'} months</span>
                </div>
                <div class="info-item">
                  <span class="label">Start Date:</span>
                  <span class="value">${contractData.start_date || currentDate}</span>
                </div>
                <div class="info-item">
                  <span class="label">End Date:</span>
                  <span class="value">${contractData.end_date || 'Not specified'}</span>
                </div>
                <div class="info-item">
                  <span class="label">Termination Notice:</span>
                  <span class="value">${contractData.termination_notice || 30} days</span>
                </div>
              </div>
            </div>

            <!-- Marketing Authorization Section -->
            <div class="section">
              <h3 class="section-title">Marketing Authorization</h3>
              <div class="clause-content">
                <p>VirtualEstate is hereby authorized to market the above-mentioned property through all available channels including but not limited to:</p>
                <ul class="marketing-list">
                  <li>Virtual tours and 3D photography</li>
                  <li>Online property portals and websites</li>
                  <li>Social media marketing campaigns</li>
                  <li>Professional broker network distribution</li>
                  <li>Print and digital advertising</li>
                  <li>International marketing platforms</li>
                </ul>
              </div>
            </div>

            <!-- Terms and Conditions -->
            <div class="section">
              <h3 class="section-title">Terms and Conditions</h3>
              <div class="clause-content">
                <ol class="terms-list">
                  <li>The property owner grants VirtualEstate exclusive marketing rights for the duration specified above.</li>
                  <li>VirtualEstate will use professional marketing techniques to maximize property exposure.</li>
                  <li>Commission is payable upon successful completion of the sale transaction.</li>
                  <li>Both parties agree to act in good faith throughout the contract period.</li>
                  <li>Any modifications to this contract must be made in writing and signed by both parties.</li>
                  <li>This contract is governed by Egyptian real estate law and regulations.</li>
                </ol>
              </div>
            </div>

            <!-- Signature Section -->
            <div class="signature-section">
              <div class="signature-grid">
                <div class="signature-block">
                  <div class="signature-line"></div>
                  <div class="signature-label">
                    <strong>Client Signature</strong><br>
                    ${contractData.owner_name}<br>
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
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Enhanced styles for contract PDF
   */
  private getContractStyles(): string {
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
        padding: 0;
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

      .contract-type {
        font-size: 14px;
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

      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-bottom: 20px;
      }

      .info-item {
        display: flex;
        flex-direction: column;
        padding: 8px;
        background: #f9fafb;
        border-radius: 4px;
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

      .marketing-list, .terms-list {
        margin: 15px 0;
        padding-left: 20px;
      }

      .marketing-list li, .terms-list li {
        margin-bottom: 8px;
        line-height: 1.6;
      }

      .terms-list li {
        margin-bottom: 12px;
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
        margin-top: 30px;
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
    `
  }

  /**
   * Enhance HTML for better PDF rendering
   */
  private enhanceHTMLForPDF(htmlContent: string): string {
    // Add CSS for better PDF rendering
    const enhancedCSS = `
      <style>
        body { 
          font-family: 'Georgia', 'Times New Roman', serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        .contract-container { 
          max-width: 800px;
          margin: 0 auto;
        }
        h1, h2, h3 { 
          color: #2563eb;
          margin-top: 0;
        }
        .section { 
          margin-bottom: 25px;
          break-inside: avoid;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 20px;
        }
        .signature-section {
          margin-top: 40px;
          break-inside: avoid;
        }
        @media print {
          body { font-size: 12px; }
          .section { break-inside: avoid; }
        }
      </style>
    `

    // Insert enhanced CSS into the HTML
    if (htmlContent.includes('<head>')) {
      return htmlContent.replace('</head>', `${enhancedCSS}</head>`)
    } else {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Contract Document</title>
          ${enhancedCSS}
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `
    }
  }

  /**
   * Format price for display
   */
  private formatPrice(price: number | string): string {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price
    if (isNaN(numPrice)) return '0'
    
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numPrice)
  }

  /**
   * Get default header template
   */
  private getContractHeaderTemplate(): string {
    return `
      <div style="font-size: 10px; color: #666; width: 100%; text-align: center; margin-top: 10px;">
        <strong>VirtualEstate</strong> - Premium Real Estate Solutions
      </div>
    `
  }

  /**
   * Get default footer template
   */
  private getContractFooterTemplate(): string {
    return `
      <div style="font-size: 9px; color: #666; width: 100%; text-align: center; margin-bottom: 10px;">
        Generated by VirtualEstate AI Contract System | Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>
    `
  }

  /**
   * Get default footer template for non-contract PDFs
   */
  private getDefaultFooterTemplate(): string {
    return `
      <div style="font-size: 9px; color: #666; width: 100%; text-align: center; margin-bottom: 10px;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>
    `
  }

  /**
   * Close browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

// Export singleton instance
export const pdfGenerator = PDFGenerator.getInstance()

// Cleanup on process exit
process.on('beforeExit', async () => {
  await pdfGenerator.close()
})