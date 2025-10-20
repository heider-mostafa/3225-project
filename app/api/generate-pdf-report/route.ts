/*
 * UNUSED SERVER-SIDE PDF GENERATION ROUTE
 * 
 * This file contains a complete Puppeteer-based PDF generation system with Arabic font support.
 * However, it is NOT currently connected to any frontend components and is not being used.
 * 
 * The actual working Arabic appraisal generation uses:
 * - /app/api/generate-report/route.ts (data preparation)
 * - /lib/services/pdf-report-generator.ts (client-side PDF generation with jsPDF)
 * 
 * This file remains as a potential server-side alternative implementation.
 */

import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import { createClient } from '@/utils/supabase/server';

interface ReportData {
  property: any;
  appraisal: any;
  market: any;
  options: any;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get user session for authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reportData: ReportData = await request.json();
    
    console.log('🔄 Starting PDF generation with Puppeteer...');
    
    // Launch Puppeteer browser with enhanced Arabic font support
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--allow-running-insecure-content',
        '--disable-features=VizDisplayCompositor',
        '--font-render-hinting=none',
        '--enable-font-antialiasing',
        '--disable-gpu-sandbox',
        '--no-first-run'
      ],
      timeout: 120000 // 2 minutes timeout
    });
    
    const page = await browser.newPage();
    
    // Set viewport and page settings
    await page.setViewport({ width: 1200, height: 1600 });
    
    // Generate HTML content with proper Arabic support
    const htmlContent = generateArabicReportHTML(reportData);
    
    // Set content and wait for fonts to load
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 60000
    });
    
    // Wait for fonts to load and verify Arabic fonts are available
    await page.evaluate(() => {
      return new Promise((resolve) => {
        document.fonts.ready.then(() => {
          console.log('Fonts loaded, checking Arabic fonts...');
          
          // Check if Arabic fonts are loaded
          const arabicFonts = ['Noto Sans Arabic', 'Cairo', 'Amiri'];
          const loadedFonts = [];
          
          for (const fontName of arabicFonts) {
            const testFont = new FontFace(fontName, 'url()');
            if (document.fonts.check(`12px "${fontName}"`)) {
              loadedFonts.push(fontName);
            }
          }
          
          console.log('Available Arabic fonts:', loadedFonts);
          setTimeout(resolve, 1000); // Additional wait for font rendering
        });
      });
    });
    
    console.log('✅ HTML content loaded, generating PDF...');
    
    // Generate PDF with proper settings for Arabic text
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: {
        top: '2cm',
        right: '1.5cm',
        bottom: '2cm',
        left: '1.5cm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="font-size: 10px; width: 100%; text-align: center; color: #666;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `
    });
    
    await browser.close();
    
    console.log('✅ PDF generated successfully');
    
    // Return PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="appraisal-report-${reportData.property?.id || 'report'}.pdf"`,
        'Content-Length': pdfBuffer.length.toString()
      }
    });
    
  } catch (error) {
    console.error('❌ PDF generation failed:', error);
    return NextResponse.json(
      { 
        error: 'PDF generation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }, 
      { status: 500 }
    );
  }
}

function generateArabicReportHTML(reportData: ReportData): string {
  const { property, appraisal, market, options } = reportData;
  
  return `
    <!DOCTYPE html>
    <html lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تقرير تقييم عقاري</title>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap" rel="stylesheet">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap" rel="stylesheet">
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Noto Sans Arabic', 'Cairo', 'Amiri', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
          font-size: 12px;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        /* Arabic Text Styling */
        .arabic {
          direction: rtl;
          text-align: right;
          font-family: 'Noto Sans Arabic', 'Cairo', 'Amiri', Arial, sans-serif;
          unicode-bidi: bidi-override;
          font-feature-settings: 'liga', 'calt', 'kern';
          font-variant-ligatures: contextual;
        }
        
        .english {
          direction: ltr;
          text-align: left;
          font-family: Arial, sans-serif;
        }
        
        /* Header Styles */
        .header {
          text-align: center;
          margin-bottom: 30px;
          padding: 20px;
          border-bottom: 3px solid #2E8B57;
        }
        
        .main-title {
          font-size: 24px;
          font-weight: 700;
          color: #2E8B57;
          margin-bottom: 10px;
          direction: rtl;
        }
        
        .sub-title {
          font-size: 16px;
          color: #666;
          font-weight: 400;
        }
        
        /* Info Box Styles */
        .info-box {
          border: 2px solid #ddd;
          border-radius: 8px;
          padding: 20px;
          margin: 20px 0;
          background: #f9f9f9;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 10px 0;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }
        
        .info-row:last-child {
          border-bottom: none;
        }
        
        .label {
          font-weight: 600;
          color: #2E8B57;
          flex: 1;
        }
        
        .value {
          flex: 2;
          text-align: left;
        }
        
        /* Bilingual Content */
        .bilingual {
          margin: 15px 0;
        }
        
        .arabic-line {
          direction: rtl;
          text-align: right;
          margin-bottom: 5px;
          font-weight: 600;
        }
        
        .english-line {
          direction: ltr;
          text-align: left;
          color: #666;
          font-size: 11px;
        }
        
        /* Value Highlight */
        .value-highlight {
          background: linear-gradient(135deg, #2E8B57, #32CD32);
          color: white;
          padding: 20px;
          text-align: center;
          border-radius: 10px;
          margin: 30px 0;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .value-amount {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 10px;
        }
        
        .value-label {
          font-size: 16px;
          opacity: 0.9;
        }
        
        /* Section Headers */
        .section-header {
          background: #f0f8ff;
          padding: 15px 20px;
          margin: 25px 0 15px 0;
          border-right: 5px solid #2E8B57;
          font-size: 18px;
          font-weight: 600;
          color: #2E8B57;
        }
        
        /* Table Styles */
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
        }
        
        .data-table th,
        .data-table td {
          padding: 12px;
          border: 1px solid #ddd;
          text-align: right;
        }
        
        .data-table th {
          background: #2E8B57;
          color: white;
          font-weight: 600;
        }
        
        .data-table tr:nth-child(even) {
          background: #f9f9f9;
        }
        
        /* Certification Section */
        .certification {
          margin-top: 40px;
          padding: 30px;
          border: 2px solid #2E8B57;
          border-radius: 10px;
          background: #f8fff8;
        }
        
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 30px;
        }
        
        .signature-box {
          width: 45%;
          text-align: center;
          padding: 20px;
          border: 1px dashed #ccc;
        }
        
        /* Utilities */
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .mb-10 { margin-bottom: 10px; }
        .mb-20 { margin-bottom: 20px; }
        .mt-20 { margin-top: 20px; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .text-green { color: #2E8B57; }
        
        /* Page Break */
        .page-break {
          page-break-before: always;
        }
        
        /* Print Specific */
        @media print {
          body { font-size: 11px; }
          .container { padding: 10px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header Section -->
        <div class="header">
          <h1 class="main-title arabic">تقرير تقييم مقدم لشركة أملاك للتمويل العقاري</h1>
          <p class="sub-title english">Property Appraisal Report for Real Estate Finance Company</p>
        </div>
        
        <!-- Appraiser Information -->
        <div class="info-box">
          <div class="bilingual">
            <div class="arabic-line">خبير التقييم: ${appraisal?.appraiser_name || 'غير محدد'}</div>
            <div class="english-line">Appraisal Expert: ${appraisal?.appraiser_name || 'Not Specified'}</div>
          </div>
          
          <div class="bilingual">
            <div class="arabic-line">رقم القيد بالهيئة العامة للرقابة المالية: ${appraisal?.appraiser_license || 'غير محدد'}</div>
            <div class="english-line">Financial Regulatory Authority License Number: ${appraisal?.appraiser_license || 'Not Specified'}</div>
          </div>
          
          <div class="bilingual">
            <div class="arabic-line">تاريخ التقييم: ${appraisal?.appraisal_date || new Date().toLocaleDateString('ar-EG')}</div>
            <div class="english-line">Appraisal Date: ${appraisal?.appraisal_date || new Date().toLocaleDateString('en-US')}</div>
          </div>
        </div>
        
        <!-- Property Information -->
        <div class="section-header arabic">معلومات العقار / Property Information</div>
        
        <div class="info-box">
          <div class="info-row">
            <div class="label arabic">نوع العقار / Property Type:</div>
            <div class="value">${property?.property_type || 'غير محدد'}</div>
          </div>
          
          <div class="info-row">
            <div class="label arabic">العنوان / Address:</div>
            <div class="value">${property?.address || 'غير محدد'}, ${property?.city || ''}</div>
          </div>
          
          <div class="info-row">
            <div class="label arabic">المساحة / Area:</div>
            <div class="value">${property?.area || 'غير محدد'} متر مربع / m²</div>
          </div>
          
          <div class="info-row">
            <div class="label arabic">عدد الغرف / Bedrooms:</div>
            <div class="value">${property?.bedrooms || 'غير محدد'}</div>
          </div>
          
          <div class="info-row">
            <div class="label arabic">عدد الحمامات / Bathrooms:</div>
            <div class="value">${property?.bathrooms || 'غير محدد'}</div>
          </div>
          
          <div class="info-row">
            <div class="label arabic">اسم العميل / Client Name:</div>
            <div class="value">${appraisal?.client_name || 'غير محدد'}</div>
          </div>
        </div>
        
        <!-- Market Value Result -->
        <div class="value-highlight">
          <div class="value-amount arabic">
            ${appraisal?.market_value_estimate?.toLocaleString('ar-EG') || '0'} جنيه مصري
          </div>
          <div class="value-label bilingual">
            <div class="arabic-line">نتيجة التقييم النهائية</div>
            <div class="english-line">Final Appraisal Result: ${appraisal?.market_value_estimate?.toLocaleString('en-US') || '0'} EGP</div>
          </div>
        </div>
        
        <!-- Market Analysis -->
        <div class="section-header arabic">تحليل السوق / Market Analysis</div>
        
        <div class="info-box">
          <div class="info-row">
            <div class="label arabic">متوسط السعر في المنطقة / Average Market Price:</div>
            <div class="value">${market?.market_trends?.average_price_per_sqm?.toLocaleString('ar-EG') || '0'} جنيه/م² EGP/m²</div>
          </div>
          
          <div class="info-row">
            <div class="label arabic">نشاط السوق / Market Activity:</div>
            <div class="value">${market?.market_trends?.market_activity || 'متوسط / Moderate'}</div>
          </div>
          
          <div class="info-row">
            <div class="label arabic">مستوى الثقة / Confidence Level:</div>
            <div class="value">${appraisal?.confidence_level || '85'}%</div>
          </div>
        </div>
        
        <!-- Comparable Properties -->
        ${market?.comparable_properties?.length > 0 ? `
        <div class="section-header arabic">العقارات المماثلة / Comparable Properties</div>
        
        <table class="data-table">
          <thead>
            <tr>
              <th class="arabic">العنوان / Address</th>
              <th class="arabic">السعر / Price</th>
              <th class="arabic">السعر/م² / Price/m²</th>
              <th class="arabic">المساحة / Area</th>
            </tr>
          </thead>
          <tbody>
            ${market.comparable_properties.slice(0, 5).map((comp: any) => `
              <tr>
                <td>${comp.address || 'غير محدد'}</td>
                <td>${comp.price?.toLocaleString('ar-EG') || '0'} جنيه</td>
                <td>${comp.price_per_sqm?.toLocaleString('ar-EG') || '0'} جنيه/م²</td>
                <td>${comp.area || 'غير محدد'} م²</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
        
        <!-- Certification Section -->
        <div class="page-break"></div>
        <div class="certification">
          <div class="section-header arabic">شهادة الخبير / Expert Certification</div>
          
          <div class="arabic mb-20">
            أشهد أنا خبير التقييم بأن هذا التقرير تم إعداده طبقاً للمعايير المصرية للتقييم العقاري وبعد فحص دقيق للعقار ودراسة شاملة لسوق العقارات بالمنطقة.
          </div>
          
          <div class="english mb-20">
            I certify that this appraisal report has been prepared in accordance with Egyptian real estate valuation standards following a thorough inspection of the property and comprehensive market analysis.
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="arabic font-bold mb-10">اسم الخبير / Expert Name</div>
              <div class="mb-20">${appraisal?.appraiser_name || 'غير محدد'}</div>
              <div class="arabic font-bold mb-10">التوقيع / Signature</div>
              <div style="height: 40px; border-bottom: 1px solid #333; margin-top: 20px;"></div>
            </div>
            
            <div class="signature-box">
              <div class="arabic font-bold mb-10">رقم الترخيص / License Number</div>
              <div class="mb-20">${appraisal?.appraiser_license || 'غير محدد'}</div>
              <div class="arabic font-bold mb-10">التاريخ / Date</div>
              <div class="mt-20">${new Date().toLocaleDateString('ar-EG')}</div>
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div class="text-center mt-20" style="font-size: 10px; color: #666;">
          <div class="arabic">تم إنشاء هذا التقرير بواسطة نظام OpenBeit لتقييم العقارات</div>
          <div class="english">Generated by OpenBeit Real Estate Appraisal System</div>
          <div class="english mt-10">${new Date().toLocaleString()}</div>
        </div>
      </div>
    </body>
    </html>
  `;
}