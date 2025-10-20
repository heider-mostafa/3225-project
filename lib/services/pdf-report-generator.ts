/*
 * CLIENT-SIDE PDF REPORT GENERATOR - ACTIVELY USED
 * 
 * This is the main PDF generation system used for Arabic appraisal reports.
 * Uses jsPDF with embedded Amiri font for proper Arabic text rendering.
 * 
 * Connected to:
 * - /components/appraiser/AppraisalReportGenerator.tsx (imports and uses this class)
 * - /app/api/generate-report/route.ts (receives data from this route)
 * - /utils/amiri-font-base64.ts (uses embedded Arabic font)
 * 
 * This handles the actual PDF creation for working Arabic appraisal reports.
 * All styling changes for Arabic reports should be made here.
 */

'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Chart, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, RadarController, LineController, DoughnutController, ArcElement } from 'chart.js';

// Property image interface for PDF generation
export interface PropertyImage {
  id: string;
  url: string;
  category: string;
  source: string;
  filename: string;
  alt_text: string;
  caption?: string;
  is_primary: boolean;
  document_page: number;
  mime_type: string;
  order_index: number;
  appraisal_id?: string;
  property_id?: string;
}

export interface PropertyData {
  id: string;
  title: string;
  address: string;
  city: string;
  district: string;
  price: number;
  property_type: string;
  area: number;
  bedrooms?: number;
  bathrooms?: number;
  floor_number?: number;
  building_age?: number;
  features?: string[];
  images?: PropertyImage[]; // Enhanced from string[] to PropertyImage[]
}

export interface AppraisalData {
  id: string;
  appraiser_name: string;
  appraiser_license: string;
  client_name: string;
  appraisal_date: string;
  reference_number: string;
  market_value_estimate: number;
  confidence_level: number;
  calculation_results: any;
  form_data: any;
  legal_status: any;
  mortgage_eligibility?: any;
}

export interface MarketAnalysis {
  comparable_properties: Array<{
    address: string;
    price: number;
    price_per_sqm: number;
    area: number;
    property_type: string;
    distance_km: number;
    sold_date: string;
  }>;
  market_trends: {
    average_price_per_sqm: number;
    price_change_6months: number;
    price_change_12months: number;
    market_activity: 'high' | 'medium' | 'low';
    days_on_market: number;
  };
  investment_analysis: {
    rental_yield: number;
    roi_5year: number;
    roi_10year: number;
    appreciation_rate: number;
    rental_demand: 'high' | 'medium' | 'low';
  };
}

export interface ReportOptions {
  language: 'en' | 'ar' | 'both';
  format: 'comprehensive' | 'executive' | 'investor';
  reportType?: 'standard' | 'detailed' | 'comprehensive'; // Add report type for filtering
  include_legal_analysis: boolean;
  include_mortgage_analysis: boolean;
  include_market_comparables: boolean;
  include_investment_projections: boolean;
  include_images: boolean;
  watermark?: string;
  logo?: string;
}

interface ReportTexts {
  en: Record<string, string>;
  ar: Record<string, string>;
}

export class PDFReportGenerator {
  private reportTexts: ReportTexts;

  constructor() {
    this.reportTexts = {
      en: {
        // Headers
        'property_appraisal_report': 'Property Appraisal Report',
        'executive_summary': 'Executive Summary',
        'property_details': 'Property Details',
        'market_analysis': 'Market Analysis',
        'legal_analysis': 'Legal Analysis',
        'mortgage_analysis': 'Mortgage Eligibility Analysis',
        'investment_analysis': 'Investment Analysis',
        'appendices': 'Appendices',
        'methodology': 'Methodology',
        
        // Property details
        'property_type': 'Property Type',
        'address': 'Address',
        'city': 'City',
        'district': 'District',
        'area': 'Area',
        'bedrooms': 'Bedrooms',
        'bathrooms': 'Bathrooms',
        'floor': 'Floor',
        'building_age': 'Building Age',
        'asking_price': 'Asking Price',
        'appraised_value': 'Appraised Value',
        'price_per_sqm': 'Price per m²',
        
        // Market analysis
        'comparable_sales': 'Comparable Sales',
        'market_trends': 'Market Trends',
        'average_market_price': 'Average Market Price',
        'price_appreciation': 'Price Appreciation',
        'market_activity': 'Market Activity',
        'days_on_market': 'Average Days on Market',
        
        // Investment
        'rental_yield': 'Rental Yield',
        'roi_projection': 'ROI Projection',
        'investment_recommendation': 'Investment Recommendation',
        
        // Legal
        'ownership_status': 'Ownership Status',
        'legal_compliance': 'Legal Compliance',
        'mortgage_eligibility': 'Mortgage Eligibility',
        'risk_assessment': 'Risk Assessment',
        
        // Footer
        'report_generated': 'Report generated on',
        'appraiser_signature': 'Appraiser Signature',
        'license_number': 'License Number',
        'disclaimer': 'This report is prepared for the exclusive use of the client and should not be relied upon by third parties without written consent.',
        
        // Units
        'egp': 'EGP',
        'sqm': 'm²',
        'years': 'years',
        'months': 'months',
        'percent': '%',
        'km': 'km'
      },
      ar: {
        // Headers
        'property_appraisal_report': 'تقرير تقييم مقدم لشركة أملاك للتمويل العقاري',
        'executive_summary': 'الملخص التنفيذي',
        'property_details': 'معلومات عن العقار',
        'market_analysis': 'دراسة السوق بالمنطقة',
        'legal_analysis': 'حقوق ومستندات الملكية',
        'mortgage_analysis': 'تحليل أهلية التمويل العقاري',
        'investment_analysis': 'تحليل الاستثمار',
        'appendices': 'صور العقار والخرائط والرسومات',
        'methodology': 'فروض ومحددات التقرير',
        
        // Property details
        'property_type': 'نوع العقار',
        'address': 'العنوان',
        'city': 'المدينة',
        'district': 'الحي',
        'area': 'المساحة',
        'bedrooms': 'غرف النوم',
        'bathrooms': 'دورات المياه',
        'floor': 'الطابق',
        'building_age': 'عمر المبنى',
        'asking_price': 'السعر المطلوب',
        'appraised_value': 'القيمة المقدرة',
        'price_per_sqm': 'السعر لكل متر مربع',
        
        // Market analysis
        'comparable_sales': 'المبيعات المماثلة',
        'market_trends': 'اتجاهات السوق',
        'average_market_price': 'متوسط أسعار السوق',
        'price_appreciation': 'نمو الأسعار',
        'market_activity': 'نشاط السوق',
        'days_on_market': 'متوسط الأيام في السوق',
        
        // Investment
        'rental_yield': 'العائد الإيجاري',
        'roi_projection': 'توقعات العائد على الاستثمار',
        'investment_recommendation': 'توصية الاستثمار',
        
        // Legal
        'ownership_status': 'حالة الملكية',
        'legal_compliance': 'الامتثال القانوني',
        'mortgage_eligibility': 'أهلية التمويل العقاري',
        'risk_assessment': 'تقييم المخاطر',
        
        // Footer
        'report_generated': 'تم إنشاء التقرير في',
        'appraiser_signature': 'توقيع المقيم',
        'license_number': 'رقم الترخيص',
        'disclaimer': 'تم إعداد هذا التقرير للاستخدام الحصري للعميل ولا ينبغي الاعتماد عليه من قبل أطراف ثالثة دون موافقة كتابية.',
        
        // Units
        'egp': 'ج.م',
        'sqm': 'م²',
        'years': 'سنة',
        'months': 'شهر',
        'percent': '%',
        'km': 'كم'
      }
    };
    
    // Register Chart.js components
    Chart.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend, CategoryScale, LinearScale, RadarController, LineController, DoughnutController, ArcElement);
  }

  private async generateRadarChart(
    buildingCondition: number,
    locationScore: number,
    amenitiesScore: number
  ): Promise<string> {
    return new Promise((resolve) => {
      // Create canvas element
      const canvas = document.createElement('canvas');
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve('');
        return;
      }

      // Create radar chart
      const chart = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: ['Building Condition', 'Location', 'Amenities'],
          datasets: [{
            label: 'Quality Ratings',
            data: [buildingCondition, locationScore, amenitiesScore],
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 1)',
            borderWidth: 3,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            fill: true
          }]
        },
        options: {
          responsive: false,
          animation: false,
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              grid: {
                color: '#e2e8f0'
              },
              angleLines: {
                color: '#e2e8f0'
              },
              pointLabels: {
                font: {
                  size: 14,
                  weight: 'bold'
                },
                color: '#2d3748'
              },
              ticks: {
                stepSize: 20,
                color: '#64748b',
                font: {
                  size: 10
                }
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: false
            }
          }
        }
      });

      // Wait for chart to render, then get image data with better error handling
      setTimeout(() => {
        try {
          const imageData = canvas.toDataURL('image/png');
          chart.destroy();
          resolve(imageData);
        } catch (error) {
          console.error('Chart rendering failed:', error);
          chart.destroy();
          // Return empty string to handle gracefully
          resolve('');
        }
      }, 500); // Increased timeout for better rendering
    });
  }

  private async generateMarketTrendsChart(
    priceChange6months: number,
    priceChange12months: number,
    currentPricePerSqm: number
  ): Promise<string> {
    return new Promise((resolve) => {
      // Create canvas element
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve('');
        return;
      }

      // Calculate historical prices based on changes
      const price6MonthsAgo = currentPricePerSqm / (1 + priceChange6months / 100);
      const price12MonthsAgo = currentPricePerSqm / (1 + priceChange12months / 100);

      // Create line chart
      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['12 Months Ago', '6 Months Ago', 'Current'],
          datasets: [{
            label: 'Price per m² (EGP)',
            data: [price12MonthsAgo, price6MonthsAgo, currentPricePerSqm],
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            pointBackgroundColor: 'rgba(59, 130, 246, 1)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 6,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: false,
          animation: false,
          scales: {
            x: {
              grid: {
                color: '#e2e8f0'
              },
              ticks: {
                color: '#2d3748',
                font: {
                  size: 12,
                  weight: 'bold'
                }
              }
            },
            y: {
              beginAtZero: false,
              grid: {
                color: '#e2e8f0'
              },
              ticks: {
                color: '#64748b',
                font: {
                  size: 10
                },
                callback: function(value) {
                  return value.toLocaleString() + ' EGP';
                }
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              enabled: false
            }
          }
        }
      });

      // Wait for chart to render, then get image data with better error handling
      setTimeout(() => {
        try {
          const imageData = canvas.toDataURL('image/png');
          chart.destroy();
          resolve(imageData);
        } catch (error) {
          console.error('Chart rendering failed:', error);
          chart.destroy();
          // Return empty string to handle gracefully
          resolve('');
        }
      }, 500); // Increased timeout for better rendering
    });
  }

  private async generatePriceComparisonChart(
    subjectProperty: PropertyData,
    comparables: any[],
    appraisal: AppraisalData
  ): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 350;
      const ctx = canvas.getContext('2d');
      
      if (!ctx || !comparables.length) {
        resolve('');
        return;
      }

      const subjectPricePerSqm = Math.round(appraisal.market_value_estimate / subjectProperty.area);
      const labels = ['Subject Property', ...comparables.slice(0, 4).map((_, i) => `Comparable ${i + 1}`)];
      const prices = [subjectPricePerSqm, ...comparables.slice(0, 4).map(c => c.price_per_sqm)];
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Price per m² (EGP)',
            data: prices,
            backgroundColor: colors,
            borderColor: colors.map(c => c + '80'),
            borderWidth: 2
          }]
        },
        options: {
          responsive: false,
          animation: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return value.toLocaleString() + ' EGP';
                }
              }
            }
          },
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Price Comparison Analysis (EGP/m²)',
              font: { size: 16, weight: 'bold' }
            }
          }
        }
      });

      setTimeout(() => {
        try {
          const imageData = canvas.toDataURL('image/png');
          chart.destroy();
          resolve(imageData);
        } catch (error) {
          console.error('Price comparison chart failed:', error);
          chart.destroy();
          resolve('');
        }
      }, 500);
    });
  }

  private async generateInvestmentBreakdownChart(
    investmentAnalysis: any
  ): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve('');
        return;
      }

      const data = [
        investmentAnalysis.rental_yield || 0,
        investmentAnalysis.appreciation_rate || 0,
        Math.max(0, 10 - (investmentAnalysis.rental_yield || 0) - (investmentAnalysis.appreciation_rate || 0))
      ];

      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Rental Yield', 'Capital Appreciation', 'Market Risk'],
          datasets: [{
            data: data,
            backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
            borderColor: ['#059669', '#2563eb', '#dc2626'],
            borderWidth: 2
          }]
        },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { font: { size: 12 } }
            },
            title: {
              display: true,
              text: 'Investment Return Breakdown (%)',
              font: { size: 14, weight: 'bold' }
            }
          }
        }
      });

      setTimeout(() => {
        try {
          const imageData = canvas.toDataURL('image/png');
          chart.destroy();
          resolve(imageData);
        } catch (error) {
          console.error('Investment breakdown chart failed:', error);
          chart.destroy();
          resolve('');
        }
      }, 500);
    });
  }

  private async generateMarketPerformanceChart(
    marketTrends: any
  ): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = 500;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve('');
        return;
      }

      // Simulate historical data based on current trends
      const months = ['6 Mon Ago', '5 Mon Ago', '4 Mon Ago', '3 Mon Ago', '2 Mon Ago', '1 Mon Ago', 'Current'];
      const basePrice = marketTrends.average_price_per_sqm || 20000;
      const monthlyChange = (marketTrends.price_change_6months || 0) / 6;
      
      const prices = months.map((_, i) => {
        return Math.round(basePrice * (1 - (monthlyChange * (6 - i)) / 100));
      });

      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Average Price/m²',
            data: prices,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: false,
          animation: false,
          scales: {
            y: {
              beginAtZero: false,
              ticks: {
                callback: function(value) {
                  return value.toLocaleString() + ' EGP';
                }
              }
            }
          },
          plugins: {
            legend: { display: false },
            title: {
              display: true,
              text: 'Market Price Trend (6 Months)',
              font: { size: 14, weight: 'bold' }
            }
          }
        }
      });

      setTimeout(() => {
        try {
          const imageData = canvas.toDataURL('image/png');
          chart.destroy();
          resolve(imageData);
        } catch (error) {
          console.error('Market performance chart failed:', error);
          chart.destroy();
          resolve('');
        }
      }, 500);
    });
  }

  async generateReport(
    property: PropertyData,
    appraisal: AppraisalData,
    market: MarketAnalysis,
    options: ReportOptions = {
      language: 'both',
      format: 'comprehensive',
      include_legal_analysis: true,
      include_mortgage_analysis: true,
      include_market_comparables: true,
      include_investment_projections: true,
      include_images: true,
      watermark: 'سري / CONFIDENTIAL'
    }
  ): Promise<Blob> {
    console.log('🚀 Starting PDF generation with enhanced Arabic support and professional styling...');
    console.log('📊 Report Data Analysis:', {
      property_type: property.property_type,
      area: property.area,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      appraiser: appraisal.appraiser_name,
      market_value: appraisal.market_value_estimate,
      confidence_level: appraisal.confidence_level,
      sections_count: (await this.generateReportSections(property, appraisal, market, options)).length
    });
    
    // Always use multi-page approach for comprehensive reports
    return this.generateMultiPageReport(property, appraisal, market, options);
  }

  private setupFonts(pdf: jsPDF) {
    // Set up Arabic font support using Amiri font
    try {
      console.log('🔧 Setting up fonts for Arabic support...');
      
      // Add Amiri font for proper Arabic text rendering
      const amiriFont = this.getAmiriFont();
      
      if (amiriFont && amiriFont.length > 1000) {
        pdf.addFileToVFS('Amiri-Regular.ttf', amiriFont);
        pdf.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
        console.log('✅ Amiri Arabic font loaded successfully');
        console.log(`📊 Font size: ${amiriFont.length} characters`);
        
        // List available fonts for debugging
        const fonts = pdf.getFontList();
        console.log('📝 Available fonts:', Object.keys(fonts));
      } else {
        console.warn('⚠️ Amiri font not available or too small:', amiriFont?.length || 0, 'characters');
      }
      
      // Set default font
      pdf.setFont('helvetica'); // Default for English text
    } catch (error) {
      console.error('❌ Arabic font setup failed:', error);
      pdf.setFont('helvetica');
    }
  }

  private getAmiriFont(): string {
    // Import the production-ready Amiri font base64 string
    try {
      // Dynamically import the font to avoid loading it unnecessarily
      const { AMIRI_FONT_BASE64 } = require('../../utils/amiri-font-base64');
      return AMIRI_FONT_BASE64;
    } catch (error) {
      console.warn('Could not load production Amiri font, using fallback');
      return this.getFallbackArabicFont();
    }
  }

  private getFallbackArabicFont(): string {
    // Fallback base64 font for Arabic support
    // This is a minimal Arabic font for emergency use
    console.warn('Using fallback Arabic font - text may not render perfectly');
    return '';
  }

  private setTextFont(pdf: jsPDF, text: string, style: 'normal' | 'bold' = 'normal') {
    // Detect if text contains Arabic characters
    const hasArabic = /[\u0600-\u06FF]/.test(text);
    
    if (hasArabic) {
      // For Arabic text, try to use Amiri font if available
      try {
        // Check if Amiri font is available
        const fonts = pdf.getFontList();
        if (fonts['Amiri']) {
          pdf.setFont('Amiri', style);
          console.log('Using Amiri font for Arabic text');
        } else {
          // Fallback: Use a system font that might support Arabic
          // Try different fonts that might have better Arabic support
          pdf.setFont('helvetica', style);
          console.warn('Amiri font not available, using helvetica for Arabic text');
        }
        
        // Set text properties for better Arabic rendering
        pdf.setCharSpace(0.2); // Slightly increase character spacing for Arabic
        
        // Note: setR2L might not be available in all jsPDF versions
        if (typeof (pdf as any).setR2L === 'function') {
          (pdf as any).setR2L(true);
        }
      } catch (error) {
        console.warn('Arabic font setup failed:', error);
        pdf.setFont('helvetica', style);
      }
    } else {
      // English text
      pdf.setFont('helvetica', style);
      try {
        pdf.setCharSpace(0); // Normal character spacing
        if (typeof (pdf as any).setR2L === 'function') {
          (pdf as any).setR2L(false);
        }
      } catch (error) {
        // Ignore errors for unsupported methods
      }
    }
  }

  private renderBilingualText(pdf: jsPDF, arabicText: string, englishText: string, x: number, y: number, options?: any) {
    // Render Arabic text (right-to-left) with proper processing
    const processedArabicText = this.processArabicText(arabicText);
    this.setTextFont(pdf, processedArabicText);
    
    // Use proper right-to-left alignment for Arabic
    const arabicOptions = { 
      ...options, 
      align: 'right',
      lang: 'ar',
      dir: 'rtl'
    };
    pdf.text(processedArabicText, x, y, arabicOptions);
    
    // Render English text below Arabic with left-to-right alignment
    this.setTextFont(pdf, englishText);
    const englishOptions = { 
      ...options, 
      align: options?.align || 'left',
      lang: 'en',
      dir: 'ltr'
    };
    pdf.text(englishText, x, y + 8, englishOptions);
  }

  private processArabicText(text: string): string {
    // Enhanced Arabic text processing for PDF compatibility with Amiri font
    // This function properly handles Arabic text rendering in jsPDF
    
    // First, normalize the text to handle common Unicode variations
    let processedText = text.normalize('NFC');
    
    // Remove bidirectional text control characters that can cause issues in PDF
    processedText = processedText.replace(/[\u200E\u200F\u202A-\u202E]/g, '');
    
    // Handle mixed Arabic-English text spacing
    // Add space between Arabic and English/numbers
    processedText = processedText.replace(/([ء-ي])\s*([A-Za-z0-9])/g, '$1 $2');
    processedText = processedText.replace(/([A-Za-z0-9])\s*([ء-ي])/g, '$1 $2');
    
    // Ensure proper spacing around Arabic numbers
    processedText = processedText.replace(/(\d+)\s*([ء-ي])/g, '$1 $2');
    processedText = processedText.replace(/([ء-ي])\s*(\d+)/g, '$1 $2');
    
    // Handle common Arabic punctuation normalization
    const punctuationMap: { [key: string]: string } = {
      '؟': '؟', // Arabic question mark
      '،': '،', // Arabic comma  
      '؛': '؛', // Arabic semicolon
      '»': '»', // Arabic opening quotation mark
      '«': '«', // Arabic closing quotation mark
      // Normalize various dash and hyphen characters
      '—': '–', // Em dash to en dash
      '―': '–', // Horizontal bar to en dash
    };
    
    for (const [original, replacement] of Object.entries(punctuationMap)) {
      processedText = processedText.replace(new RegExp(original, 'g'), replacement);
    }
    
    // Standardize number formatting - Use Western numerals consistently
    processedText = this.standardizeNumbers(processedText);
    
    // Ensure proper UTF-8 encoding for PDF generation
    try {
      // Double encode/decode to ensure proper UTF-8 handling
      processedText = decodeURIComponent(encodeURIComponent(processedText));
    } catch (error) {
      console.warn('UTF-8 encoding failed for Arabic text:', error);
    }
    
    // Log for debugging
    if (text !== processedText) {
      console.log('Arabic text processed:', { original: text, processed: processedText });
    }
    
    return processedText;
  }

  private generateHTMLContent(
    property: PropertyData,
    appraisal: AppraisalData,
    market: MarketAnalysis,
    options: ReportOptions
  ): string {
    const formData = appraisal.form_data || {};
    
    return `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=block" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=block" rel="stylesheet">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Noto Sans Arabic', 'Cairo', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            font-size: 14px;
            direction: rtl;
            text-align: right;
          }
          
          .container {
            max-width: 700px;
            margin: 0 auto;
            padding: 15px;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 15px;
            padding: 20px;
            border-bottom: 3px solid #3b82f6;
          }
          
          .main-title {
            font-size: 24px;
            font-weight: 700;
            color: #3b82f6;
            margin-bottom: 10px;
            direction: rtl;
          }
          
          .sub-title {
            font-size: 16px;
            color: #666;
            direction: ltr;
            text-align: center;
          }
          
          .section {
            margin: 12px 0;
            padding: 20px;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            background: #f8fafc;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 700;
            color: #3b82f6;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 2px solid #3b82f6;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          
          .label {
            font-weight: 600;
            color: #3b82f6;
            flex: 1;
          }
          
          .value {
            flex: 1;
            text-align: left;
            direction: ltr;
          }
          
          .value-highlight {
            background: linear-gradient(135deg, #3b82f6, #1e40af);
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 10px;
            margin: 12px 0;
            font-size: 24px;
            font-weight: 700;
          }
          
          .bilingual {
            margin: 10px 0;
          }
          
          .arabic-text {
            direction: rtl;
            text-align: right;
            font-weight: 600;
            margin-bottom: 5px;
          }
          
          .english-text {
            direction: ltr;
            text-align: left;
            color: #666;
            font-size: 12px;
          }
          
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          
          .table th,
          .table td {
            padding: 10px;
            border: 1px solid #e2e8f0;
            text-align: right;
          }
          
          .table th {
            background: #3b82f6;
            color: white;
            font-weight: 600;
          }
          
          .certification {
            margin-top: 15px;
            padding: 15px;
            border: 2px solid #3b82f6;
            border-radius: 10px;
            background: #f8fafc;
          }
          
          .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
          }
          
          .signature-box {
            width: 45%;
            text-align: center;
            padding: 12px;
            border: 1px dashed #ccc;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1 class="main-title">تقرير تقييم مقدم لشركة أملاك للتمويل العقاري</h1>
            <p class="sub-title">Property Appraisal Report for Real Estate Finance Company</p>
          </div>
          
          <!-- Appraiser Information -->
          <div class="section">
            <div class="bilingual">
              <div class="arabic-text">خبير التقييم: ${appraisal.appraiser_name}</div>
              <div class="english-text">Appraisal Expert: ${appraisal.appraiser_name}</div>
            </div>
            
            <div class="bilingual">
              <div class="arabic-text">رقم القيد بالهيئة العامة للرقابة المالية: ${appraisal.appraiser_license}</div>
              <div class="english-text">Financial Regulatory Authority License: ${appraisal.appraiser_license}</div>
            </div>
            
            <div class="bilingual">
              <div class="arabic-text">تاريخ التقييم: ${appraisal.appraisal_date}</div>
              <div class="english-text">Appraisal Date: ${appraisal.appraisal_date}</div>
            </div>
          </div>
          
          <!-- Property Information -->
          <div class="section">
            <h2 class="section-title">معلومات عن العقار / Property Information</h2>
            
            <div class="info-row">
              <div class="label">نوع العقار / Property Type:</div>
              <div class="value">${property.property_type}</div>
            </div>
            
            <div class="info-row">
              <div class="label">العنوان / Address:</div>
              <div class="value">${property.address}, ${property.city}</div>
            </div>
            
            <div class="info-row">
              <div class="label">المساحة / Area:</div>
              <div class="value">${property.area} متر مربع / m²</div>
            </div>
            
            <div class="info-row">
              <div class="label">عدد الغرف / Bedrooms:</div>
              <div class="value">${property.bedrooms || 'غير محدد'}</div>
            </div>
            
            <div class="info-row">
              <div class="label">عدد الحمامات / Bathrooms:</div>
              <div class="value">${property.bathrooms || 'غير محدد'}</div>
            </div>
            
            <div class="info-row">
              <div class="label">اسم العميل / Client Name:</div>
              <div class="value">${appraisal.client_name}</div>
            </div>
            
            <!-- NEW PROFESSIONAL FIELDS -->
            ${formData.registration_number ? `
            <div class="info-row">
              <div class="label">رقم التسجيل / Registration Number:</div>
              <div class="value">${formData.registration_number}</div>
            </div>` : ''}
            
            ${formData.appraisal_valid_until ? `
            <div class="info-row">
              <div class="label">صالح حتى / Valid Until:</div>
              <div class="value">${formData.appraisal_valid_until}</div>
            </div>` : ''}
            
            ${formData.report_type ? `
            <div class="info-row">
              <div class="label">نوع التقرير / Report Type:</div>
              <div class="value">${formData.report_type}</div>
            </div>` : ''}
            
            ${formData.owner_name ? `
            <div class="info-row">
              <div class="label">اسم المالك / Owner Name:</div>
              <div class="value">${formData.owner_name}</div>
            </div>` : ''}
          </div>
          
          <!-- Market Value Result -->
          <div class="value-highlight">
            <div style="margin-bottom: 10px;">نتيجة التقييم النهائية</div>
            <div>${this.formatNumber(appraisal.market_value_estimate, 'ar')} جنيه مصري</div>
            <div style="font-size: 16px; margin-top: 5px;">Final Appraisal: ${this.formatNumber(appraisal.market_value_estimate, 'en')} EGP</div>
          </div>
          
          <!-- Market Analysis -->
          ${options.include_market_comparables ? `
          <div class="section">
            <h2 class="section-title">تحليل السوق / Market Analysis</h2>
            
            <div class="info-row">
              <div class="label">متوسط السعر في المنطقة / Average Market Price:</div>
              <div class="value">${this.formatNumber(market.market_trends.average_price_per_sqm, 'ar')} جنيه/م²</div>
            </div>
            
            <div class="info-row">
              <div class="label">نشاط السوق / Market Activity:</div>
              <div class="value">${market.market_trends.market_activity}</div>
            </div>
            
            <div class="info-row">
              <div class="label">مستوى الثقة / Confidence Level:</div>
              <div class="value">${appraisal.confidence_level}%</div>
            </div>
            
            ${market.comparable_properties.length > 0 ? `
            <h3 style="margin: 20px 0 10px 0; font-weight: 600;">العقارات المماثلة / Comparable Properties</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>العنوان / Address</th>
                  <th>السعر / Price</th>
                  <th>السعر/م² / Price/m²</th>
                  <th>المساحة / Area</th>
                </tr>
              </thead>
              <tbody>
                ${market.comparable_properties.slice(0, 5).map(comp => `
                  <tr>
                    <td>${comp.address}</td>
                    <td>${this.formatNumber(comp.price, 'ar')} جنيه</td>
                    <td>${this.formatNumber(comp.price_per_sqm, 'ar')} جنيه/م²</td>
                    <td>${comp.area} م²</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ` : ''}
          </div>
          ` : ''}
          
          <!-- Certification -->
          <div class="certification">
            <h2 class="section-title">شهادة الخبير / Expert Certification</h2>
            
            <div class="arabic-text" style="margin-bottom: 15px;">
              أشهد أنا خبير التقييم بأن هذا التقرير تم إعداده طبقاً للمعايير المصرية للتقييم العقاري وبعد فحص دقيق للعقار ودراسة شاملة لسوق العقارات بالمنطقة.
            </div>
            
            <div class="english-text" style="margin-bottom: 20px;">
              I certify that this appraisal report has been prepared in accordance with Egyptian real estate valuation standards following a thorough inspection of the property and comprehensive market analysis.
            </div>
            
            <div class="signature-section">
              <div class="signature-box">
                <div style="font-weight: 600; margin-bottom: 10px;">اسم الخبير / Expert Name</div>
                <div style="margin-bottom: 20px;">${appraisal.appraiser_name}</div>
                <div style="font-weight: 600; margin-bottom: 10px;">التوقيع / Signature</div>
                <div style="height: 30px; border-bottom: 1px solid #333; margin-top: 15px;"></div>
              </div>
              
              <div class="signature-box">
                <div style="font-weight: 600; margin-bottom: 10px;">رقم الترخيص / License Number</div>
                <div style="margin-bottom: 20px;">${appraisal.appraiser_license}</div>
                <div style="font-weight: 600; margin-bottom: 10px;">التاريخ / Date</div>
                <div style="margin-top: 15px;">${new Date().toLocaleDateString('ar-EG')}</div>
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="text-align: center; margin-top: 15px; font-size: 12px; color: #666;">
            <div class="arabic-text">تم إنشاء هذا التقرير بواسطة نظام OpenBeit لتقييم العقارات</div>
            <div class="english-text">Generated by OpenBeit Real Estate Appraisal System</div>
            <div style="margin-top: 10px;">${new Date().toLocaleString()}</div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private async generateMultiPageReport(
    property: PropertyData,
    appraisal: AppraisalData,
    market: MarketAnalysis,
    options: ReportOptions
  ): Promise<Blob> {
    console.log('🔄 Generating multi-page report with section-based approach...');
    
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Set PDF properties
    pdf.setDocumentProperties({
      title: 'Property Appraisal Report - تقرير تقييم عقاري',
      subject: 'Real Estate Valuation',
      keywords: 'appraisal, valuation, real estate, تقييم عقاري',
      creator: 'OpenBeit Platform'
    });
    
    // Generate sections based on report type and options
    const sections = await this.generateReportSections(property, appraisal, market, options);
    
    let currentY = 0;
    const pageHeight = 297; // A4 height in mm
    const maxContentHeight = 230; // Leave more space for margins to prevent cutoffs
    
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      console.log(`📄 Processing section: ${section.name}`);
      
      // Handle Property Images section differently with dedicated image gallery page
      if (section.name === 'Property Images' && property.images && property.images.length > 0) {
        console.log(`🖼️  Generating dedicated image gallery page instead of HTML section`);
        
        // Add a new page for images
        if (i > 0) { // Only add page if not the first section
          pdf.addPage();
        }
        
        // Process images (handle both old string[] and new PropertyImage[] formats)
        const processedImages = property.images.map((img, index) => {
          if (typeof img === 'string') {
            return {
              id: `legacy_${index}`,
              url: img,
              category: 'general',
              source: 'legacy',
              filename: `property_image_${index + 1}.jpg`,
              alt_text: `Property Image ${index + 1}`,
              caption: `Property Image ${index + 1}`,
              is_primary: index === 0,
              document_page: 0,
              mime_type: 'image/jpeg',
              order_index: index,
              appraisal_id: appraisal.id,
              property_id: property.id
            };
          }
          return img;
        }) as PropertyImage[];
        
        // Generate the image gallery page
        await this.generateImageGalleryPage(pdf, processedImages, options.reportType || 'comprehensive');
        currentY = 0; // Reset for next sections (they'll be on new pages anyway)
        
        continue; // Skip the regular HTML rendering for this section
      }
      
      try {
        // Pre-check section content height to prevent compression
        const estimatedHeight = await this.estimateSectionHeight(section.content);
        
        if (estimatedHeight > 1000) { // If estimated to be very tall
          console.log(`📄 Section ${section.name} is too tall (${estimatedHeight}px), using alternative rendering`);
          // Use simpler rendering for very tall sections
          const simplifiedSections = await this.renderTallSectionInChunks(section, pdf, currentY, maxContentHeight);
          currentY = simplifiedSections.finalY;
        } else {
          const canvas = await this.renderHTMLToCanvas(section.content);
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = 210; // A4 width in mm
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          
          console.log(`📏 Section ${section.name}:`);
          console.log(`  Canvas: ${canvas.width}x${canvas.height}px`);
          console.log(`  PDF: ${imgWidth}x${imgHeight}mm`);
          
          // Improved page break logic to prevent cutoffs
          const remainingSpace = maxContentHeight - currentY;
          const minSectionHeight = 50; // Minimum height to keep sections together
          
          // If section is too tall for remaining space, start new page
          if (imgHeight > remainingSpace && currentY > 50) {
            console.log(`📄 Starting new page for section: ${section.name} (needs ${imgHeight}mm, only ${remainingSpace}mm remaining)`);
            pdf.addPage();
            currentY = 15; // Smaller top padding
          }
          
          // If section is still too tall for entire page, split it
          if (imgHeight > maxContentHeight - 20) {
            console.log(`📄 Section ${section.name} too tall for single page, splitting...`);
            await this.splitSectionAcrossPages(pdf, canvas, imgData, imgWidth, maxContentHeight, currentY);
            currentY = maxContentHeight; // Force new page for next section
          } else {
            // Add image with balanced quality
            pdf.addImage(imgData, 'PNG', 0, currentY, imgWidth, imgHeight, undefined, 'MEDIUM');
            currentY += imgHeight + 8; // Reduced spacing between sections
          }
        }
        
      } catch (error) {
        console.error(`❌ Error rendering section ${section.name}:`, error);
      }
    }
    
    console.log('✅ Multi-page PDF generated successfully');
    return pdf.output('blob');
  }

  private async splitSectionAcrossPages(
    pdf: jsPDF, 
    canvas: HTMLCanvasElement, 
    imgData: string, 
    imgWidth: number, 
    maxContentHeight: number, 
    currentY: number
  ): Promise<void> {
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const remainingPageSpace = maxContentHeight - currentY;
    
    // If there's some space on current page, use it
    if (remainingPageSpace > 50) { // Only if significant space available
      const firstPartHeight = Math.min(remainingPageSpace - 10, imgHeight);
      const sourceY = 0;
      const sourceHeight = (firstPartHeight * canvas.height) / imgHeight;
      
      // Add first part to current page
      pdf.addImage(
        imgData, 'PNG', 
        0, currentY, 
        imgWidth, firstPartHeight,
        undefined, 'MEDIUM'
      );
      
      // Start new page for remainder
      pdf.addPage();
      
      // Add remaining part
      const remainingHeight = imgHeight - firstPartHeight;
      const remainingSourceY = sourceHeight;
      const remainingSourceHeight = canvas.height - sourceHeight;
      
      if (remainingHeight > maxContentHeight) {
        // Still too tall, recursively split
        console.log('📄 Section still too tall after first split, continuing to split...');
        // For now, just clip to page height to prevent infinite recursion
        pdf.addImage(
          imgData, 'PNG',
          0, 0,
          imgWidth, Math.min(remainingHeight, maxContentHeight),
          undefined, 'MEDIUM'
        );
      } else {
        pdf.addImage(
          imgData, 'PNG',
          0, 0,
          imgWidth, remainingHeight,
          undefined, 'MEDIUM'
        );
      }
    } else {
      // Start fresh page
      pdf.addPage();
      
      // If still too tall for a single page, clip it
      if (imgHeight > maxContentHeight) {
        console.warn(`⚠️ Section extremely tall (${imgHeight}mm), clipping to fit page`);
        const clippedHeight = maxContentHeight - 10;
        const sourceHeight = (clippedHeight * canvas.height) / imgHeight;
        
        pdf.addImage(
          imgData, 'PNG',
          0, 0,
          imgWidth, clippedHeight,
          undefined, 'MEDIUM'
        );
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, undefined, 'MEDIUM');
      }
    }
  }

  private addHTMLWatermark(htmlContent: string, watermarkText: string = 'سري / CONFIDENTIAL'): string {
    // Create a complete HTML document with watermark
    const watermarkHTML = `
      <!DOCTYPE html>
      <html lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&family=Cairo:wght@400;700&display=swap" rel="stylesheet">
        <style>
          body {
            position: relative;
            font-family: 'Noto Sans Arabic', 'Cairo', Arial, sans-serif;
            margin: 0;
            padding: 10mm;
            background: white;
            width: 190mm; /* A4 width minus padding */
            box-sizing: border-box;
            font-size: 14px;
            line-height: 1.4;
            word-wrap: break-word;
          }
          
          .watermark {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
            overflow: hidden;
          }
          
          .watermark-text {
            position: absolute;
            font-family: 'Noto Sans Arabic', 'Cairo', Arial, sans-serif;
            font-size: 50px;
            font-weight: bold;
            color: rgba(220, 220, 220, 0.2);
            transform: rotate(45deg);
            white-space: nowrap;
            user-select: none;
          }
          
          .watermark-text:nth-child(1) { top: 15%; left: 5%; font-size: 45px; }
          .watermark-text:nth-child(2) { top: 45%; left: 25%; font-size: 65px; }
          .watermark-text:nth-child(3) { top: 75%; left: 55%; font-size: 50px; }
          
          .content {
            position: relative;
            z-index: 1;
          }
          
          /* Better page break control */
          .section {
            page-break-inside: avoid;
            break-inside: avoid;
            margin-bottom: 15px;
          }
          
          .section-header {
            page-break-after: avoid;
            break-after: avoid;
          }
          
          .no-break {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          
          .table-container {
            page-break-inside: avoid;
            break-inside: avoid;
            margin: 10px 0;
          }
          
          .page-break-before {
            page-break-before: always;
            break-before: page;
          }
          
          .large-section {
            page-break-inside: avoid;
            break-inside: avoid;
            margin: 15px 0;
            /* Force to new page if too large for current page */
            overflow: visible;
          }
        </style>
      </head>
      <body>
        <div class="watermark">
          <div class="watermark-text">${watermarkText}</div>
          <div class="watermark-text">${watermarkText}</div>
          <div class="watermark-text">${watermarkText}</div>
        </div>
        <div class="content">
          ${htmlContent}
        </div>
      </body>
      </html>
    `;
    
    return watermarkHTML;
  }

  private async renderHTMLToCanvas(htmlContent: string): Promise<HTMLCanvasElement> {
    const tempDiv = document.createElement('div');
    
    // Add watermark to HTML content
    const htmlWithWatermark = this.addHTMLWatermark(htmlContent);
    tempDiv.innerHTML = htmlWithWatermark;
    
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '210mm';
    tempDiv.style.maxWidth = '210mm';
    tempDiv.style.background = 'white';
    tempDiv.style.padding = '10mm';
    tempDiv.style.fontFamily = '"Noto Sans Arabic", "Cairo", Arial, sans-serif';
    tempDiv.style.zIndex = '1';
    tempDiv.style.overflow = 'visible'; // Allow natural content flow
    tempDiv.style.boxSizing = 'border-box';
    // Optimize for PDF rendering
    tempDiv.style.fontSize = '14px';
    tempDiv.style.lineHeight = '1.4';
    tempDiv.style.wordWrap = 'break-word';
    tempDiv.style.hyphens = 'auto';
    
    document.body.appendChild(tempDiv);
    
    try {
      // Force load Google Fonts
      await this.loadGoogleFonts();
      
      // Wait for fonts and layout
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 2000)); // Longer wait
      
      // Verify content is actually rendered
      const textContent = tempDiv.textContent || '';
      console.log('📝 Rendered text content length:', textContent.length);
      console.log('📝 Sample text:', textContent.substring(0, 100));
      
      if (textContent.length < 10) {
        console.warn('⚠️ Very little text content detected, may result in empty PDF');
      }
      
      // Move into view for rendering
      tempDiv.style.left = '0';
      tempDiv.style.visibility = 'visible';
      
      const canvas = await html2canvas(tempDiv, {
        scale: 2, // Balanced scale
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        foreignObjectRendering: false,
        logging: false,
        width: Math.min(tempDiv.scrollWidth, 794), // Limit width to prevent scaling issues
        height: tempDiv.scrollHeight,
        scrollX: 0,
        scrollY: 0,
        removeContainer: false,
        imageTimeout: 5000,
        // Force specific DPI for consistent quality
        windowWidth: 794,
        windowHeight: 1122
      });
      
      console.log('🖼️ Canvas generated:', { width: canvas.width, height: canvas.height });
      
      return canvas;
    } finally {
      document.body.removeChild(tempDiv);
    }
  }

  private async loadGoogleFonts(): Promise<void> {
    return new Promise((resolve) => {
      // Check if fonts are already loaded
      if (document.fonts.check('16px "Noto Sans Arabic"')) {
        console.log('✅ Arabic fonts already loaded');
        resolve();
        return;
      }
      
      // Load Google Fonts CSS
      const linkElement = document.createElement('link');
      linkElement.rel = 'stylesheet';
      linkElement.href = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&family=Cairo:wght@400;700&display=swap';
      
      linkElement.onload = () => {
        console.log('✅ Google Fonts CSS loaded');
        // Additional wait for font files to download
        setTimeout(resolve, 1000);
      };
      
      linkElement.onerror = () => {
        console.warn('⚠️ Failed to load Google Fonts, using system fonts');
        resolve();
      };
      
      document.head.appendChild(linkElement);
    });
  }

  private generateHeaderSection(property: PropertyData, appraisal: AppraisalData): string {
    // OpenBeit Logo SVG (inline)
    const openBeitLogo = `<svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="8" width="28" height="48" stroke="#3b82f6" stroke-width="4"/>
      <polygon points="12,8 36,20 36,52 12,56" fill="#3b82f6"/>
      <circle cx="28" cy="32" r="2.5" fill="white"/>
    </svg>`;
    
    const pricePerSqm = Math.round(appraisal.market_value_estimate / property.area);
    const currentDate = new Date().toLocaleDateString('ar-EG');
    const clientName = appraisal.client_name || 'عميل محترم';
    
    return `
      <div style="font-family: 'Noto Sans Arabic', Arial, sans-serif; padding: 30px 20px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); min-height: 800px;">
        <!-- Header with Logo and Report Info -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 3px solid #3b82f6; padding-bottom: 20px;">
          <div style="display: flex; align-items: center;">
            ${openBeitLogo}
            <div style="margin-right: 15px; text-align: left;">
              <div style="font-size: 24px; font-weight: 800; color: #2d3748;">OpenBeit</div>
              <div style="font-size: 12px; color: #64748b; font-weight: 500;">Premium Real Estate Solutions</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 14px; color: #64748b; font-weight: 600;">Report ID: ${appraisal.reference_number || 'OB-' + Date.now()}</div>
            <div style="font-size: 12px; color: #64748b;">Generated: ${currentDate}</div>
          </div>
        </div>

        <!-- Letter of Transmittal Header -->
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="font-size: 28px; font-weight: 700; color: #2d3748; margin-bottom: 10px; direction: rtl;">
            خطاب تغطية التقييم العقاري
          </h1>
          <p style="font-size: 18px; color: #64748b; direction: ltr; font-weight: 500; margin-bottom: 5px;">
            Property Appraisal Letter of Transmittal
          </p>
          <div style="width: 120px; height: 3px; background: #3b82f6; margin: 15px auto; border-radius: 2px;"></div>
        </div>

        <!-- Recipient Details Section -->
        <div style="margin-bottom: 15px; padding: 20px; background: white; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div style="direction: rtl;">
              <div style="font-weight: 700; color: #2d3748; margin-bottom: 10px; font-size: 16px;">المُعد إلى / Prepared For:</div>
              <div style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 5px;">${clientName}</div>
              <div style="font-size: 12px; color: #64748b;">العميل المحترم / Valued Client</div>
            </div>
            <div style="direction: rtl; text-align: right;">
              <div style="font-weight: 700; color: #2d3748; margin-bottom: 10px; font-size: 16px;">الجهة الطالبة / Requesting Entity:</div>
              <div style="font-size: 16px; font-weight: 600; color: #3b82f6; margin-bottom: 5px;">شركة أملاك مصر للتمويل</div>
              <div style="font-size: 12px; color: #64748b;">Amlak Egypt Financing Company</div>
            </div>
          </div>
        </div>

        <!-- Property Summary Box -->
        <div style="margin-bottom: 15px; padding: 15px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); border-radius: 15px; color: white; box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="font-size: 20px; font-weight: 700; margin-bottom: 5px; direction: rtl;">ملخص التقييم الرئيسي</h3>
            <p style="font-size: 14px; opacity: 0.9; direction: ltr;">Key Valuation Summary</p>
          </div>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; text-align: center;">
            <div style="padding: 12px; background: rgba(255,255,255,0.1); border-radius: 10px; backdrop-filter: blur(10px);">
              <div style="font-size: 24px; font-weight: 800; margin-bottom: 5px;">${this.formatNumber(appraisal.market_value_estimate, 'ar')}</div>
              <div style="font-size: 12px; opacity: 0.9;">جنيه مصري / EGP</div>
              <div style="font-size: 10px; opacity: 0.8; margin-top: 3px;">القيمة المقدرة / Appraised Value</div>
            </div>
            
            <div style="padding: 12px; background: rgba(255,255,255,0.1); border-radius: 10px; backdrop-filter: blur(10px);">
              <div style="font-size: 24px; font-weight: 800; margin-bottom: 5px;">${pricePerSqm.toLocaleString('ar-EG')}</div>
              <div style="font-size: 12px; opacity: 0.9;">جنيه/م² / EGP/m²</div>
              <div style="font-size: 10px; opacity: 0.8; margin-top: 3px;">السعر للمتر / Price per m²</div>
            </div>
            
            <div style="padding: 12px; background: rgba(255,255,255,0.1); border-radius: 10px; backdrop-filter: blur(10px);">
              <div style="font-size: 24px; font-weight: 800; margin-bottom: 5px;">${currentDate}</div>
              <div style="font-size: 10px; opacity: 0.8; margin-top: 3px;">تاريخ التقييم / Valuation Date</div>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.2);">
            <div style="font-size: 16px; font-weight: 600; direction: rtl;">العقار: ${property.property_type} - ${this.formatNumber(property.area, 'ar')} متر مربع</div>
            <div style="font-size: 14px; opacity: 0.9; direction: ltr;">Property: ${property.property_type} - ${this.formatNumber(property.area, 'en')} m² area</div>
            <div style="font-size: 12px; opacity: 0.8; margin-top: 5px;">الموقع: ${property.district}, ${property.city}</div>
          </div>
        </div>

        <!-- Appraiser's Summary Narrative -->
        <div style="margin-bottom: 15px; padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="font-weight: 700; color: #2d3748; margin-bottom: 15px; font-size: 16px; direction: rtl;">ملخص المُقيم / Appraiser's Summary:</div>
          <div style="font-size: 14px; line-height: 1.6; color: #2d3748; direction: rtl; margin-bottom: 10px;">
            وفقاً لطلبكم المحترم، تم تقييم العقار موضوع التقييم بقيمة ${this.formatNumber(appraisal.market_value_estimate, 'ar')} جنيه مصري كما في تاريخ ${currentDate}. 
            يستند هذا التقييم بشكل أساسي على منهج المقارنة السوقية من خلال تحليل خمسة عقارات مماثلة في المنطقة المحيطة. 
            تعكس القيمة النهائية حالة العقار المقدرة بـ "مقبولة" (${appraisal.confidence_level}/100) ومقارنتها بمتوسط السوق المحلي البالغ ${(appraisal.market_value_estimate / property.area * 1.12).toFixed(0)} جنيه للمتر المربع.
          </div>
          <div style="font-size: 13px; line-height: 1.5; color: #64748b; direction: ltr; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
            In accordance with your request, we have appraised the subject property at ${appraisal.market_value_estimate.toLocaleString('en-US')} EGP as of ${new Date().toLocaleDateString('en-US')}. 
            This valuation is primarily based on the Market Comparison Approach, analyzing five comparable local sales. 
            The final value reflects the property's condition, rated as 'Acceptable' (${appraisal.confidence_level}/100), and is benchmarked against a local market average of ${(pricePerSqm * 1.12).toFixed(0)} EGP per square meter.
          </div>
        </div>

        <!-- Appraiser's Details and Signature -->
        <div style="margin-bottom: 20px; padding: 20px; background: white; border: 2px solid #3b82f6; border-radius: 12px;">
          <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 25px; align-items: center;">
            <div>
              <div style="font-weight: 700; color: #2d3748; margin-bottom: 15px; font-size: 16px; direction: rtl;">بيانات المُقيم المعتمد / Certified Appraiser Details:</div>
              <div style="margin-bottom: 8px;">
                <span style="font-weight: 600; color: #3b82f6;">المُقيم / Appraiser:</span>
                <span style="margin-right: 10px; font-size: 16px; font-weight: 600;">${appraisal.appraiser_name}</span>
              </div>
              <div style="margin-bottom: 8px;">
                <span style="font-weight: 600; color: #3b82f6;">رقم الترخيص / License:</span>
                <span style="margin-right: 10px; font-weight: 600; color: #2d3748;">${appraisal.appraiser_license}</span>
              </div>
              <div style="margin-bottom: 8px;">
                <span style="font-weight: 600; color: #3b82f6;">تاريخ التقييم / Date:</span>
                <span style="margin-right: 10px;">${appraisal.appraisal_date}</span>
              </div>
            </div>
            
            <div style="text-align: center; padding: 20px; border: 2px dashed #3b82f6; border-radius: 10px; background: #f8fafc;">
              <div style="font-size: 14px; font-weight: 600; color: #3b82f6; margin-bottom: 10px;">التوقيع / Signature</div>
              <div style="height: 60px; display: flex; align-items: center; justify-content: center; font-size: 24px; font-family: cursive; color: #2d3748;">
                ${appraisal.appraiser_name}
              </div>
              <div style="font-size: 10px; color: #64748b; margin-top: 5px;">مُقيم معتمد / Certified Appraiser</div>
            </div>
          </div>
        </div>

        <!-- Footer Note -->
        <div style="text-align: center; padding: 12px; background: #eff6ff; border-radius: 8px; margin-top: 15px;">
          <div style="font-size: 12px; color: #3b82f6; font-weight: 600;">التفاصيل الكاملة للتحليل موجودة في الصفحات التالية من هذا التقرير</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 3px;">Full details of our analysis are contained within the following pages of this report</div>
        </div>
      </div>
    `;
  }

  private generatePropertySection(property: PropertyData, appraisal: AppraisalData): string {
    return `
      <div style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h2 style="font-size: 20px; font-weight: 700; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          معلومات عن العقار / Property Information
        </h2>
        
        <div style="margin: 15px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
          <span style="font-weight: 700; color: #2d3748;">نوع العقار / Property Type:</span>
          <span style="direction: ltr;">${property.property_type}</span>
        </div>
        
        <div style="margin: 15px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
          <span style="font-weight: 700; color: #2d3748;">العنوان / Address:</span>
          <span style="direction: ltr;">${property.address}, ${property.city}</span>
        </div>
        
        <div style="margin: 15px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
          <span style="font-weight: 700; color: #2d3748;">المساحة / Area:</span>
          <span style="direction: ltr;">${this.formatNumber(property.area, 'ar')} متر مربع / ${this.formatNumber(property.area, 'en')} m²</span>
        </div>
        
        <div style="margin: 15px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
          <span style="font-weight: 700; color: #2d3748;">اسم العميل / Client Name:</span>
          <span style="direction: ltr;">${appraisal.client_name}</span>
        </div>
        
        <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 20px; text-align: center; border-radius: 15px; margin: 15px 0; border: 2px solid #e2e8f0; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
          <div style="font-size: 18px; font-weight: 700; color: #2d3748; margin-bottom: 15px;">نتيجة التقييم النهائية</div>
          <div style="font-size: 36px; font-weight: 800; color: #3b82f6; margin: 15px 0; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${this.formatNumber(appraisal.market_value_estimate, 'ar')} جنيه مصري</div>
          <div style="width: 80px; height: 4px; background: #3b82f6; margin: 15px auto; border-radius: 2px;"></div>
          <div style="font-size: 16px; color: #64748b; margin-top: 10px; font-weight: 500;">Final Appraisal: ${appraisal.market_value_estimate.toLocaleString('en-US')} EGP</div>
        </div>
      </div>
    `;
  }

  private generateMarketSection(market: MarketAnalysis, appraisal: AppraisalData): string {
    return `
      <div style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h2 style="font-size: 20px; font-weight: 700; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          تحليل السوق / Market Analysis
        </h2>
        
        <div style="margin: 15px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
          <span style="font-weight: 700; color: #2d3748;">متوسط السعر في المنطقة / Average Market Price:</span>
          <span style="direction: ltr;">${market.market_trends.average_price_per_sqm.toLocaleString('ar-EG')} جنيه/م²</span>
        </div>
        
        <div style="margin: 15px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
          <span style="font-weight: 700; color: #2d3748;">نشاط السوق / Market Activity:</span>
          <span style="direction: ltr;">${market.market_trends.market_activity}</span>
        </div>
        
        <div style="margin: 15px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
          <span style="font-weight: 700; color: #2d3748;">مستوى الثقة / Confidence Level:</span>
          <span style="direction: ltr;">${appraisal.confidence_level}%</span>
        </div>
      </div>
    `;
  }

  private async generateReportSections(
    property: PropertyData, 
    appraisal: AppraisalData, 
    market: MarketAnalysis, 
    options: ReportOptions
  ): Promise<Array<{content: string, name: string}>> {
    const sections = [];
    const reportType = options.reportType || 'comprehensive';
    
    console.log('📋 Generating report sections for type:', reportType);
    console.log('📋 Options received:', {
      include_legal_analysis: options.include_legal_analysis,
      include_mortgage_analysis: options.include_mortgage_analysis,
      include_investment_projections: options.include_investment_projections,
      format: options.format
    });
    
    // Always include header (all report types)
    sections.push({ content: this.generateHeaderSection(property, appraisal), name: 'Header' });
    
    // Executive Summary (all report types)
    sections.push({ content: this.generateExecutiveSummarySection(property, appraisal, market), name: 'Executive Summary' });
    
    // Property Details (all report types)  
    sections.push({ content: this.generateDetailedPropertySection(property, appraisal), name: 'Property Details' });
    
    // Quality Rating (all report types)
    const qualityRatingContent = await this.generateQualityRatingSection(property, appraisal);
    sections.push({ content: qualityRatingContent, name: 'Quality Rating' });
    
    // Market Analysis with comparables (all report types - but content filtered by API)
    if (options.include_market_comparables) {
      const marketAnalysisContent = await this.generateDetailedMarketSection(market, appraisal);
      sections.push({ content: marketAnalysisContent, name: 'Market Analysis' });
    }
    
    // Detailed sections based on report type
    if (reportType === 'detailed' || reportType === 'comprehensive') {
      // Legal Analysis (detailed and comprehensive only)
      if (options.include_legal_analysis && appraisal.legal_status) {
        console.log('✅ Adding Legal Analysis section');
        sections.push({ content: this.generateLegalComplianceSection(appraisal), name: 'Legal Analysis' });
      } else {
        console.log('❌ Skipping Legal Analysis - include_legal_analysis:', options.include_legal_analysis, 'legal_status:', !!appraisal.legal_status);
      }
      
      // Investment Analysis (detailed and comprehensive only)
      if (options.include_investment_projections) {
        console.log('✅ Adding Investment Analysis section');
        sections.push({ content: this.generateInvestmentAnalysisSection(market, property, appraisal), name: 'Investment Analysis' });
      } else {
        console.log('❌ Skipping Investment Analysis - include_investment_projections:', options.include_investment_projections);
      }
      
      // Mortgage Analysis (detailed and comprehensive only)
      if (options.include_mortgage_analysis && appraisal.mortgage_eligibility) {
        console.log('✅ Adding Mortgage Analysis section');
        sections.push({ content: this.generateMortgageAnalysisSection(appraisal), name: 'Mortgage Analysis' });
      } else {
        console.log('❌ Skipping Mortgage Analysis - include_mortgage_analysis:', options.include_mortgage_analysis, 'mortgage_eligibility:', !!appraisal.mortgage_eligibility);
      }
    } else {
      console.log('❌ Skipping detailed sections - reportType is:', reportType);
    }
    
    // Comprehensive-only sections
    if (reportType === 'comprehensive') {
      console.log('✅ Adding comprehensive-only sections');
      // Calculation Methods (comprehensive only)
      sections.push({ content: this.generateCalculationMethodsSection(property, appraisal, market), name: 'Calculation Methods' });
      
      // Environmental Factors (comprehensive only)
      sections.push({ content: this.generateEnvironmentalFactorsSection(property, appraisal), name: 'Environmental Factors' });
    } else {
      console.log('❌ Skipping comprehensive sections - reportType is:', reportType);
    }
    
    // Property Images (if enabled and available - all report types)
    if (options.include_images && property.images && property.images.length > 0) {
      sections.push({ content: this.generateImagesSection(property), name: 'Property Images' });
    }
    
    // Add privacy notice section for filtered reports
    if (reportType !== 'comprehensive' && appraisal.privacy_notice) {
      sections.push({ 
        content: this.generatePrivacyNoticeSection(appraisal, reportType), 
        name: 'Privacy Notice' 
      });
    }
    
    // Professional Standards & Methodology (comprehensive only)
    if (options.format === 'comprehensive') {
      sections.push({ content: this.generateMethodologySection(appraisal), name: 'Methodology' });
    }
    
    // Always include certification
    sections.push({ content: this.generateCertificationSection(appraisal), name: 'Certification' });
    
    return sections;
  }

  private generateExecutiveSummarySection(property: PropertyData, appraisal: AppraisalData, market: MarketAnalysis): string {
    const pricePerSqm = Math.round(appraisal.market_value_estimate / property.area);
    const formData = appraisal.form_data || {};
    
    return `
      <div class="section" style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h2 class="section-header" style="font-size: 20px; font-weight: 700; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          الملخص التنفيذي / Executive Summary
        </h2>
        
        <div style="margin: 15px 0; padding: 12px; background: white; border-radius: 5px;">
          <div style="font-weight: 600; margin-bottom: 10px; color: #3b82f6;">ملخص التقييم / Appraisal Summary:</div>
          <div style="margin-bottom: 8px;">تم تقييم العقار المتمثل في ${property.property_type} بمساحة ${this.formatNumber(property.area, 'ar')} متر مربع في منطقة ${property.district}، ${property.city}.</div>
          <div style="direction: ltr; text-align: left; color: #666; font-size: 13px;">The property, a ${property.property_type} with ${this.formatNumber(property.area, 'en')} m² area located in ${property.district}, ${property.city}, has been appraised.</div>
        </div>
        
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin: 12px 0;">
          <div style="flex: 1; min-width: 200px; padding: 12px; background: white; border-radius: 5px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748; margin-bottom: 5px;">القيمة المقدرة / Appraised Value</div>
            <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${this.formatNumber(appraisal.market_value_estimate, 'ar')} جنيه</div>
            <div style="font-size: 12px; color: #666; direction: ltr;">${appraisal.market_value_estimate.toLocaleString('en-US')} EGP</div>
          </div>
          
          <div style="flex: 1; min-width: 200px; padding: 12px; background: white; border-radius: 5px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748; margin-bottom: 5px;">السعر للمتر / Price per m²</div>
            <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${pricePerSqm.toLocaleString('ar-EG')} جنيه/م²</div>
            <div style="font-size: 12px; color: #666; direction: ltr;">${pricePerSqm.toLocaleString('en-US')} EGP/m²</div>
          </div>
        </div>
        
        <div style="margin: 15px 0; padding: 12px; background: #eff6ff; border-radius: 5px;">
          <div style="font-weight: 700; margin-bottom: 8px; color: #2d3748;">مستوى الثقة في التقييم / Confidence Level: ${appraisal.confidence_level}%</div>
          <div style="font-size: 13px;">تم الوصول لهذا التقييم بناءً على دراسة شاملة للسوق وفحص دقيق للعقار.</div>
          <div style="direction: ltr; text-align: left; color: #666; font-size: 12px; margin-top: 5px;">This valuation was determined through comprehensive market analysis and thorough property inspection.</div>
          
          <!-- NEW MARKET ANALYSIS FIELDS -->
          <div style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 8px;">
            ${formData.time_to_sell ? `
            <div style="padding: 8px; background: white; border-radius: 3px;">
              <span style="font-weight: 600;">فترة البيع المتوقعة:</span> ${formData.time_to_sell} شهر
            </div>` : ''}
            
            ${formData.price_per_sqm_semi_finished ? `
            <div style="padding: 8px; background: white; border-radius: 3px;">
              <span style="font-weight: 600;">السعر/م² نصف تشطيب:</span> ${formData.price_per_sqm_semi_finished.toLocaleString('ar-EG')} جنيه
            </div>` : ''}
            
            ${formData.price_per_sqm_fully_finished ? `
            <div style="padding: 8px; background: white; border-radius: 3px;">
              <span style="font-weight: 600;">السعر/م² تشطيب كامل:</span> ${formData.price_per_sqm_fully_finished.toLocaleString('ar-EG')} جنيه
            </div>` : ''}
            
            ${formData.garage_share_description ? `
            <div style="padding: 8px; background: white; border-radius: 3px; grid-column: 1 / -1;">
              <span style="font-weight: 600;">وصف حصة الجراج:</span> ${formData.garage_share_description}
            </div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  private generateDetailedPropertySection(property: PropertyData, appraisal: AppraisalData): string {
    const formData = appraisal.form_data || {};
    
    return `
      <div style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h2 style="font-size: 20px; font-weight: 700; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          تفاصيل العقار الكاملة / Complete Property Details
        </h2>
        
        <!-- Basic Information -->
        <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin: 15px 0 10px 0;">المعلومات الأساسية / Basic Information</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">نوع العقار:</span> ${property.property_type}
          </div>
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">العنوان:</span> ${property.address}
          </div>
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">المحافظة:</span> ${formData.governorate || property.city}
          </div>
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">المدينة:</span> ${formData.city_name || property.city}
          </div>
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">الحي:</span> ${formData.district_name || property.district}
          </div>
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">اسم العميل:</span> ${appraisal.client_name}
          </div>
        </div>
        
        <!-- Area Details -->
        <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin: 15px 0 10px 0;">تفاصيل المساحات / Area Details</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div style="padding: 10px; background: white; border-radius: 3px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">مساحة الأرض</div>
            <div style="font-size: 18px; font-weight: 700;">${formData.land_area_sqm || 'N/A'}</div>
            <div style="font-size: 12px; color: #666;">متر مربع</div>
          </div>
          <div style="padding: 10px; background: white; border-radius: 3px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">المساحة المبنية</div>
            <div style="font-size: 18px; font-weight: 700;">${formData.built_area_sqm ? this.formatNumber(formData.built_area_sqm, 'ar') : 'N/A'}</div>
            <div style="font-size: 12px; color: #666;">متر مربع</div>
          </div>
          <div style="padding: 10px; background: white; border-radius: 3px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">مساحة الوحدة</div>
            <div style="font-size: 18px; font-weight: 700;">${this.formatNumber(formData.unit_area_sqm || property.area, 'ar')}</div>
            <div style="font-size: 12px; color: #666;">متر مربع</div>
          </div>
          
          <!-- NEW AREA FIELDS -->
          ${formData.total_building_area_sqm ? `
          <div style="padding: 10px; background: white; border-radius: 3px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">إجمالي مساحة المبنى</div>
            <div style="font-size: 18px; font-weight: 700;">${this.formatNumber(formData.total_building_area_sqm, 'ar')}</div>
            <div style="font-size: 12px; color: #666;">متر مربع</div>
          </div>` : ''}
          
          ${formData.unit_land_share_sqm ? `
          <div style="padding: 10px; background: white; border-radius: 3px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">حصة الوحدة من الأرض</div>
            <div style="font-size: 18px; font-weight: 700;">${formData.unit_land_share_sqm}</div>
            <div style="font-size: 12px; color: #666;">متر مربع</div>
          </div>` : ''}
        </div>
        
        <!-- Building Details -->
        <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin: 15px 0 10px 0;">تفاصيل المبنى / Building Details</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">عمر المبنى:</span> ${formData.building_age_years || 'N/A'} سنة
          </div>
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">العمر الاقتصادي:</span> ${formData.economic_life_years || 60} سنة
          </div>
          
          <!-- NEW BUILDING FIELDS -->
          ${formData.effective_building_age_years ? `
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">العمر الفعلي:</span> ${formData.effective_building_age_years} سنة
          </div>` : ''}
          
          ${formData.economic_building_life_years ? `
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">العمر الاقتصادي:</span> ${formData.economic_building_life_years} سنة
          </div>` : ''}
          
          ${formData.remaining_building_life_years ? `
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">العمر المتبقي:</span> ${formData.remaining_building_life_years} سنة
          </div>` : ''}
          
          ${formData.entrance ? `
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">المدخل:</span> ${formData.entrance}
          </div>` : ''}
          
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">نوع الإنشاء:</span> ${formData.construction_type || 'خرسانة مسلحة'}
          </div>
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">مستوى التشطيب:</span> ${formData.finishing_level || 'غير محدد'}
          </div>
          
          <!-- NEW TECHNICAL DESCRIPTION FIELDS -->
          ${formData.electrical_system_description ? `
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">وصف النظام الكهربائي:</span> ${formData.electrical_system_description}
          </div>` : ''}
          
          ${formData.sanitary_ware_description ? `
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">وصف الأدوات الصحية:</span> ${formData.sanitary_ware_description}
          </div>` : ''}
          
          ${formData.exterior_finishes_description ? `
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">وصف التشطيبات الخارجية:</span> ${formData.exterior_finishes_description}
          </div>` : ''}
          
          <!-- MATERIAL SPECIFICATIONS -->
          ${(() => {
            const floorMaterials = formData.general_floor_materials?.length ? formData.general_floor_materials.join(', ') : 
              (formData.floor_materials && typeof formData.floor_materials === 'object' ? 
                Object.values(formData.floor_materials).join(', ') : formData.floor_materials);
            return floorMaterials ? `
            <div style="padding: 10px; background: white; border-radius: 3px;">
              <span style="font-weight: 700; color: #2d3748;">مواد الأرضيات:</span> ${floorMaterials}
            </div>` : '';
          })()}
          
          ${(() => {
            const wallMaterials = formData.general_wall_materials?.length ? formData.general_wall_materials.join(', ') :
              (formData.wall_finishes && typeof formData.wall_finishes === 'object' ? 
                Object.values(formData.wall_finishes).join(', ') : formData.wall_finishes);
            return wallMaterials ? `
            <div style="padding: 10px; background: white; border-radius: 3px;">
              <span style="font-weight: 700; color: #2d3748;">تشطيبات الحوائط:</span> ${wallMaterials}
            </div>` : '';
          })()}
          
          ${formData.general_exterior_materials?.length ? `
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">المواد الخارجية:</span> ${formData.general_exterior_materials.join(', ')}
          </div>` : ''}
          
          ${formData.ceiling_type ? `
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">نوع الأسقف:</span> ${formData.ceiling_type}
          </div>` : ''}
          
          ${formData.windows_type ? `
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">نوع الشبابيك:</span> ${formData.windows_type}
          </div>` : ''}
          
          ${formData.doors_type ? `
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">نوع الأبواب:</span> ${formData.doors_type}
          </div>` : ''}
          
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">نوع الملكية:</span> ${formData.ownership_type || 'ملك حر'}
          </div>
          <div style="padding: 10px; background: white; border-radius: 3px;">
            <span style="font-weight: 700; color: #2d3748;">نوع الشارع:</span> ${formData.street_type || 'غير محدد'}
          </div>
        </div>
        
        <!-- Condition Assessment -->
        <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin: 15px 0 10px 0;">تقييم الحالة / Condition Assessment</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div style="padding: 10px; background: white; border-radius: 3px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">الحالة الإنشائية</div>
            <div style="font-size: 16px; font-weight: 700;">${formData.structural_condition || 'جيدة'}</div>
          </div>
          <div style="padding: 10px; background: white; border-radius: 3px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">الحالة الخارجية</div>
            <div style="font-size: 16px; font-weight: 700;">${formData.exterior_condition || 'جيدة'}</div>
          </div>
          <div style="padding: 10px; background: white; border-radius: 3px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">الحالة الداخلية</div>
            <div style="font-size: 16px; font-weight: 700;">${formData.interior_condition || 'جيدة'}</div>
          </div>
        </div>
        
        <!-- Utilities and Services -->
        <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin: 15px 0 10px 0;">المرافق والخدمات / Utilities & Services</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px;">
          <div style="padding: 10px; background: ${formData.water_supply_available ? '#e8f5e8' : '#fee8e8'}; border-radius: 3px;">
            <span style="font-weight: 600;">المياه / Water:</span>
            <span style="color: ${formData.water_supply_available ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
              ${formData.water_supply_available ? 'متوفر ✓' : 'غير متوفر ✗'}
            </span>
          </div>
          
          <div style="padding: 10px; background: ${formData.electricity_available ? '#e8f5e8' : '#fee8e8'}; border-radius: 3px;">
            <span style="font-weight: 600;">الكهرباء / Electricity:</span>
            <span style="color: ${formData.electricity_available ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
              ${formData.electricity_available ? 'متوفر ✓' : 'غير متوفر ✗'}
            </span>
          </div>
          
          <div style="padding: 10px; background: ${formData.gas_supply_available ? '#e8f5e8' : '#fee8e8'}; border-radius: 3px;">
            <span style="font-weight: 600;">الغاز / Gas:</span>
            <span style="color: ${formData.gas_supply_available ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
              ${formData.gas_supply_available ? 'متوفر ✓' : 'غير متوفر ✗'}
            </span>
          </div>
          
          <div style="padding: 10px; background: ${formData.sewage_system_available ? '#e8f5e8' : '#fee8e8'}; border-radius: 3px;">
            <span style="font-weight: 600;">الصرف الصحي / Sewage:</span>
            <span style="color: ${formData.sewage_system_available ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
              ${formData.sewage_system_available ? 'متوفر ✓' : 'غير متوفر ✗'}
            </span>
          </div>
          
          <div style="padding: 10px; background: ${formData.internet_fiber_available ? '#e8f5e8' : '#fee8e8'}; border-radius: 3px;">
            <span style="font-weight: 600;">الإنترنت / Internet:</span>
            <span style="color: ${formData.internet_fiber_available ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
              ${formData.internet_fiber_available ? 'متوفر ✓' : 'غير متوفر ✗'}
            </span>
          </div>
          
          <div style="padding: 10px; background: ${formData.elevator_available ? '#e8f5e8' : '#fee8e8'}; border-radius: 3px;">
            <span style="font-weight: 600;">المصعد / Elevator:</span>
            <span style="color: ${formData.elevator_available ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
              ${formData.elevator_available ? 'متوفر ✓' : 'غير متوفر ✗'}
            </span>
          </div>
          
          <!-- NEW TELEPHONE FIELD -->
          <div style="padding: 10px; background: ${formData.telephone_available ? '#e8f5e8' : '#fee8e8'}; border-radius: 3px;">
            <span style="font-weight: 600;">الهاتف الأرضي / Telephone:</span>
            <span style="color: ${formData.telephone_available ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
              ${formData.telephone_available ? 'متوفر ✓' : 'غير متوفر ✗'}
            </span>
          </div>
        </div>
        
        <!-- Quality Ratings -->
        <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin: 15px 0 10px 0;">تقييمات الجودة / Quality Ratings</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px;">
          <div style="padding: 10px; background: white; border-radius: 3px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">تقييم الحالة العامة</div>
            <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${formData.overall_condition_rating || 7}/10</div>
          </div>
          <div style="padding: 10px; background: white; border-radius: 3px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">جودة الحي</div>
            <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${formData.neighborhood_quality_rating || 7}/10</div>
          </div>
          <div style="padding: 10px; background: white; border-radius: 3px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">سهولة الوصول</div>
            <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${formData.accessibility_rating || 7}/10</div>
          </div>
        </div>
      </div>
    `;
  }

  private generateCalculationMethodsSection(property: PropertyData, appraisal: AppraisalData, market: MarketAnalysis): string {
    const calcResults = appraisal.calculation_results || {};
    const formData = appraisal.form_data || {};
    
    return `
      <div style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h2 style="font-size: 20px; font-weight: 700; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          طرق حساب القيمة / Valuation Methods
        </h2>
        
        <!-- Cost Approach -->
        <div style="margin: 12px 0; padding: 12px; background: white; border-radius: 5px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 10px;">طريقة التكلفة / Cost Approach</h3>
          
          <div style="display: flex; flex-wrap: wrap; gap: 12px;">
            <div>
              <div style="margin: 8px 0; display: flex; justify-content: space-between;">
                <span style="font-weight: 600;">قيمة الأرض:</span>
                <span style="direction: ltr;">${(calcResults.land_value || formData.land_value || 0).toLocaleString('ar-EG')} جنيه</span>
              </div>
              <div style="margin: 8px 0; display: flex; justify-content: space-between;">
                <span style="font-weight: 600;">قيمة المباني:</span>
                <span style="direction: ltr;">${(calcResults.building_value || formData.building_value || 0).toLocaleString('ar-EG')} جنيه</span>
              </div>
              
              <!-- NEW ADVANCED VALUATION FIELDS -->
              ${formData.land_price_per_sqm ? `
              <div style="margin: 8px 0; display: flex; justify-content: space-between;">
                <span style="font-weight: 600;">سعر الأرض/م²:</span>
                <span style="direction: ltr;">${formData.land_price_per_sqm.toLocaleString('ar-EG')} جنيه</span>
              </div>` : ''}
              
              ${formData.unit_land_share_value ? `
              <div style="margin: 8px 0; display: flex; justify-content: space-between;">
                <span style="font-weight: 600;">قيمة حصة الوحدة من الأرض:</span>
                <span style="direction: ltr;">${formData.unit_land_share_value.toLocaleString('ar-EG')} جنيه</span>
              </div>` : ''}
              
              ${formData.unit_construction_cost ? `
              <div style="margin: 8px 0; display: flex; justify-content: space-between;">
                <span style="font-weight: 600;">تكلفة إنشاء الوحدة:</span>
                <span style="direction: ltr;">${formData.unit_construction_cost.toLocaleString('ar-EG')} جنيه</span>
              </div>` : ''}
              
              ${formData.building_value_with_profit ? `
              <div style="margin: 8px 0; display: flex; justify-content: space-between;">
                <span style="font-weight: 600;">قيمة المبنى مع الربح:</span>
                <span style="direction: ltr;">${formData.building_value_with_profit.toLocaleString('ar-EG')} جنيه</span>
              </div>` : ''}
            </div>
            <div>
              <div style="margin: 8px 0; display: flex; justify-content: space-between;">
                <span style="font-weight: 600;">تكلفة الإحلال:</span>
                <span style="direction: ltr;">${(calcResults.replacement_cost || 0).toLocaleString('ar-EG')} جنيه</span>
              </div>
              <div style="margin: 8px 0; display: flex; justify-content: space-between;">
                <span style="font-weight: 600;">قيمة الإهلاك:</span>
                <span style="direction: ltr;">${Number(calcResults.depreciation_amount || formData.total_depreciation_value || 0).toLocaleString('ar-EG')} جنيه (${Number(calcResults.depreciation_percentage || 0).toFixed(1)}%)</span>
              </div>
              
              <!-- NEW DEPRECIATION FIELDS -->
              ${(() => {
                const curableValue = Number(formData.curable_depreciation_value);
                return !isNaN(curableValue) && curableValue > 0 ? `
                <div style="margin: 8px 0; display: flex; justify-content: space-between;">
                  <span style="font-weight: 600;">إهلاك قابل للإصلاح:</span>
                  <span style="direction: ltr;">${curableValue.toLocaleString('ar-EG')} جنيه</span>
                </div>` : '';
              })()}
              
              ${(() => {
                const incurableValue = Number(formData.incurable_depreciation_value);
                return !isNaN(incurableValue) && incurableValue > 0 ? `
                <div style="margin: 8px 0; display: flex; justify-content: space-between;">
                  <span style="font-weight: 600;">إهلاك غير قابل للإصلاح:</span>
                  <span style="direction: ltr;">${incurableValue.toLocaleString('ar-EG')} جنيه</span>
                </div>` : '';
              })()}
            </div>
          </div>
          
          <div style="margin-top: 15px; padding: 12px; background: #eff6ff; border-radius: 8px; margin: 8px 0; text-align: center;">
            <span style="font-weight: 600;">إجمالي القيمة بطريقة التكلفة:</span>
            <span style="font-size: 20px; font-weight: 700; color: #3b82f6; margin-right: 10px;">${appraisal.market_value_estimate.toLocaleString('ar-EG')} جنيه</span>
          </div>
        </div>
        
        <!-- Market Comparison Approach -->
        <div style="margin: 12px 0; padding: 12px; background: white; border-radius: 5px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 10px;">طريقة المقارنة السوقية / Market Comparison Approach</h3>
          
          <div style="margin: 10px 0;">
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">متوسط سعر السوق:</span>
              <span style="direction: ltr;">${(market.market_trends.average_price_per_sqm || 0).toLocaleString('ar-EG')} جنيه/م²</span>
            </div>
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">عدد العقارات المماثلة:</span>
              <span style="direction: ltr;">${market.comparable_properties.length} عقار</span>
            </div>
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">نشاط السوق:</span>
              <span style="direction: ltr;">${market.market_trends.market_activity}</span>
            </div>
          </div>
        </div>
        
        <!-- Income Approach (if applicable) -->
        <div style="margin: 12px 0; padding: 12px; background: white; border-radius: 5px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 10px;">طريقة رسملة الدخل / Income Capitalization Approach</h3>
          
          <div style="margin: 10px 0;">
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">العائد الإيجاري المتوقع:</span>
              <span style="direction: ltr;">${market.investment_analysis.rental_yield.toFixed(2)}% سنوياً</span>
            </div>
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">الإيجار الشهري المقدر:</span>
              <span style="direction: ltr;">${Math.round(appraisal.market_value_estimate * market.investment_analysis.rental_yield / 100 / 12).toLocaleString('ar-EG')} جنيه</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private async generateDetailedMarketSection(market: MarketAnalysis, appraisal: AppraisalData): Promise<string> {
    // Calculate current price per sqm for chart
    const currentPricePerSqm = market.market_trends.average_price_per_sqm;
    
    // Generate multiple charts for comprehensive analysis
    const marketTrendsChart = await this.generateMarketTrendsChart(
      market.market_trends.price_change_6months,
      market.market_trends.price_change_12months,
      currentPricePerSqm
    );
    
    const marketPerformanceChart = await this.generateMarketPerformanceChart(market.market_trends);
    const investmentBreakdownChart = await this.generateInvestmentBreakdownChart(market.investment_analysis);
    
    return `
      <div style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h2 style="font-size: 20px; font-weight: 700; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          تحليل السوق التفصيلي / Detailed Market Analysis
        </h2>
        
        <!-- Market Trends -->
        <div style="margin: 12px 0; padding: 12px; background: white; border-radius: 5px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 10px;">اتجاهات السوق / Market Trends</h3>
          
          <div style="display: flex; flex-wrap: wrap; gap: 12px;">
            <div style="padding: 10px; background: #f0f8ff; border-radius: 3px;">
              <div style="font-weight: 700; color: #2d3748;">متوسط سعر المنطقة</div>
              <div style="font-size: 16px; font-weight: 700;">${market.market_trends.average_price_per_sqm.toLocaleString('ar-EG')} جنيه/م²</div>
            </div>
            <div style="padding: 10px; background: #f0f8ff; border-radius: 3px;">
              <div style="font-weight: 700; color: #2d3748;">نشاط السوق</div>
              <div style="font-size: 16px; font-weight: 700;">${market.market_trends.market_activity}</div>
            </div>
            <div style="padding: 10px; background: #f0f8ff; border-radius: 3px;">
              <div style="font-weight: 700; color: #2d3748;">التغير في 6 أشهر</div>
              <div style="font-size: 16px; font-weight: 700; color: ${market.market_trends.price_change_6months >= 0 ? '#3b82f6' : '#dc2626'};">
                ${market.market_trends.price_change_6months >= 0 ? '+' : ''}${market.market_trends.price_change_6months.toFixed(1)}%
              </div>
            </div>
            <div style="padding: 10px; background: #f0f8ff; border-radius: 3px;">
              <div style="font-weight: 700; color: #2d3748;">التغير في 12 شهر</div>
              <div style="font-size: 16px; font-weight: 700; color: ${market.market_trends.price_change_12months >= 0 ? '#3b82f6' : '#dc2626'};">
                ${market.market_trends.price_change_12months >= 0 ? '+' : ''}${market.market_trends.price_change_12months.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
        
        <!-- Market Trends Chart -->
        ${marketTrendsChart ? `
        <div style="margin: 12px 0; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 15px; text-align: center;">تطور الأسعار عبر الزمن / Price Trends Over Time</h3>
          <div style="text-align: center; margin: 12px 0;">
            <img src="${marketTrendsChart}" alt="Market Trends Chart" style="max-width: 450px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 15px;">
            <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 6px;">
              <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">التغير في 6 أشهر</div>
              <div style="font-size: 16px; font-weight: 700; color: ${market.market_trends.price_change_6months >= 0 ? '#10b981' : '#ef4444'};">
                ${market.market_trends.price_change_6months >= 0 ? '+' : ''}${market.market_trends.price_change_6months.toFixed(1)}%
              </div>
            </div>
            <div style="text-align: center; padding: 10px; background: #f8fafc; border-radius: 6px;">
              <div style="font-size: 12px; color: #64748b; margin-bottom: 5px;">التغير في 12 شهر</div>
              <div style="font-size: 16px; font-weight: 700; color: ${market.market_trends.price_change_12months >= 0 ? '#10b981' : '#ef4444'};">
                ${market.market_trends.price_change_12months >= 0 ? '+' : ''}${market.market_trends.price_change_12months.toFixed(1)}%
              </div>
            </div>
          </div>
          <div style="text-align: center; font-size: 11px; color: #64748b; margin-top: 10px;">
            مخطط يوضح تطور أسعار العقارات في المنطقة خلال العام الماضي
          </div>
        </div>
        ` : ''}
        
        <!-- Market Performance Chart -->
        ${marketPerformanceChart ? `
        <div class="no-break" style="margin: 12px 0; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 15px; text-align: center;">أداء السوق / Market Performance</h3>
          <div style="text-align: center; margin: 12px 0;">
            <img src="${marketPerformanceChart}" alt="Market Performance Chart" style="max-width: 450px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
          </div>
          <div style="text-align: center; font-size: 11px; color: #64748b; margin-top: 10px;">
            تحليل أداء السوق خلال الستة أشهر الماضية / Market performance analysis over the past 6 months
          </div>
        </div>
        ` : ''}
        
        <!-- Investment Breakdown Chart -->
        ${investmentBreakdownChart ? `
        <div class="no-break" style="margin: 12px 0; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 15px; text-align: center;">تحليل العائد الاستثماري / Investment Return Analysis</h3>
          <div style="display: flex; justify-content: center; align-items: center; margin: 12px 0;">
            <img src="${investmentBreakdownChart}" alt="Investment Breakdown Chart" style="max-width: 350px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; justify-content: center;">
            <div style="text-align: center; padding: 8px 12px; background: #dcfce7; border-radius: 6px; border: 1px solid #16a34a;">
              <div style="font-size: 12px; color: #15803d;">العائد الإيجاري</div>
              <div style="font-size: 14px; font-weight: 700; color: #15803d;">${market.investment_analysis.rental_yield.toFixed(1)}%</div>
            </div>
            <div style="text-align: center; padding: 8px 12px; background: #dbeafe; border-radius: 6px; border: 1px solid #2563eb;">
              <div style="font-size: 12px; color: #1d4ed8;">نمو رأس المال</div>
              <div style="font-size: 14px; font-weight: 700; color: #1d4ed8;">${market.investment_analysis.appreciation_rate.toFixed(1)}%</div>
            </div>
          </div>
          <div style="text-align: center; font-size: 11px; color: #64748b; margin-top: 10px;">
            توزيع مكونات العائد الاستثماري المتوقع / Expected investment return components breakdown
          </div>
        </div>
        ` : ''}
        
        <!-- Comparable Properties Table -->
        ${market.comparable_properties.length > 0 ? `
        <div style="margin: 12px 0;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 10px;">العقارات المماثلة / Comparable Properties</h3>
          
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin: 12px 0;">
            <thead>
              <tr style="background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white;">
                <th style="padding: 16px; text-align: right; font-weight: 600; border: none;">العنوان</th>
                <th style="padding: 16px; text-align: center; font-weight: 600; border: none;">السعر</th>
                <th style="padding: 16px; text-align: center; font-weight: 600; border: none;">السعر/م²</th>
                <th style="padding: 16px; text-align: center; font-weight: 600; border: none;">المساحة</th>
                <th style="padding: 16px; text-align: center; font-weight: 600; border: none;">المسافة</th>
              </tr>
            </thead>
            <tbody>
              ${market.comparable_properties.slice(0, 5).map((comp, index) => `
                <tr style="background: ${index % 2 === 0 ? '#f8fafc' : 'white'}; border: none;">
                  <td style="padding: 14px; border: none; border-bottom: 1px solid #e2e8f0; color: #2d3748; font-weight: 500;">${comp.address}</td>
                  <td style="padding: 14px; border: none; border-bottom: 1px solid #e2e8f0; text-align: center; direction: ltr; color: #2d3748; font-weight: 600;">${comp.price.toLocaleString('ar-EG')} جنيه</td>
                  <td style="padding: 14px; border: none; border-bottom: 1px solid #e2e8f0; text-align: center; direction: ltr; color: #3b82f6; font-weight: 600;">${comp.price_per_sqm.toLocaleString('ar-EG')}</td>
                  <td style="padding: 14px; border: none; border-bottom: 1px solid #e2e8f0; text-align: center; direction: ltr; color: #2d3748;">${comp.area} م²</td>
                  <td style="padding: 14px; border: none; border-bottom: 1px solid #e2e8f0; text-align: center; direction: ltr; color: #64748b;">${comp.distance_km.toFixed(1)} كم</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
      </div>
    `;
  }

  private generateLegalComplianceSection(appraisal: AppraisalData): string {
    const formData = appraisal.form_data || {};
    const legalStandards = formData.egyptian_legal_standards || {};
    
    return `
      <div class="page-break-before" style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h2 class="section-header" style="font-size: 20px; font-weight: 700; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          الامتثال للمعايير المصرية للتقييم العقاري / Egyptian Real Estate Valuation Standards Compliance
        </h2>
        
        <!-- FRA Resolution Reference -->
        <div style="margin: 15px 0; padding: 15px; background: #eff6ff; border-radius: 8px;">
          <div style="font-weight: 600; color: #3b82f6; margin-bottom: 10px; font-size: 16px;">قرار الهيئة العامة للرقابة المالية</div>
          <div style="font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
            تم اعداد هذا التقرير فى ضوء المعايير المصرية للتقييم العقاري الصادرة بقرار مجلس ادارة الهيئة العامة للرقابة المالية رقم (${legalStandards.fra_resolution_number || '39'}) لسنة ${legalStandards.fra_resolution_year || '2015'} بتاريخ ${legalStandards.fra_resolution_date || '19 أبريل 2015'}.
          </div>
          <div style="direction: ltr; text-align: left; color: #666; font-size: 12px;">
            This report was prepared in accordance with Egyptian Real Estate Valuation Standards issued by the Financial Regulatory Authority Board Resolution No. ${legalStandards.fra_resolution_number || '39'} of ${legalStandards.fra_resolution_year || '2015'} dated ${legalStandards.fra_resolution_date || 'April 19, 2015'}.
          </div>
        </div>

        <!-- Property Information -->
        <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 15px;">معلومات العقار / Property Information</h3>
          
          <div style="display: flex; flex-wrap: wrap; gap: 15px;">
            <div style="margin: 12px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; min-width: 45%;">
              <span style="font-weight: 700; color: #2d3748;">العنوان بالعربية:</span>
              <span style="color: #4a5568;">${legalStandards.property_address_arabic || formData.property_address_arabic || 'غير محدد'}</span>
            </div>
            <div style="margin: 12px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; min-width: 45%;">
              <span style="font-weight: 700; color: #2d3748;">العنوان بالإنجليزية:</span>
              <span style="color: #4a5568;">${legalStandards.property_address_english || formData.property_address_english || 'Not Specified'}</span>
            </div>
            <div style="margin: 12px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; min-width: 45%;">
              <span style="font-weight: 700; color: #2d3748;">نوع العقار:</span>
              <span style="color: #4a5568;">${legalStandards.property_type_arabic || 'غير محدد'} / ${legalStandards.property_type_english || 'Not Specified'}</span>
            </div>
            <div style="margin: 12px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; min-width: 45%;">
              <span style="font-weight: 700; color: #2d3748;">العمارة/الوحدة/الدور:</span>
              <span style="color: #4a5568;">رقم ${legalStandards.building_number || 'غير محدد'} / ${legalStandards.unit_number || 'غير محدد'} / الدور ${legalStandards.floor_number || 'غير محدد'}</span>
            </div>
          </div>
        </div>

        <!-- Client and Appraiser Information -->
        <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 15px;">معلومات العميل والمقيم / Client & Appraiser Information</h3>
          
          <div style="display: flex; flex-wrap: wrap; gap: 15px;">
            <div style="margin: 12px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; min-width: 45%;">
              <span style="font-weight: 700; color: #2d3748;">اسم العميل:</span>
              <span style="color: #4a5568;">${legalStandards.client_name_arabic || appraisal.client_name || 'غير محدد'}</span>
            </div>
            <div style="margin: 12px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; min-width: 45%;">
              <span style="font-weight: 700; color: #2d3748;">الجهة الطالبة:</span>
              <span style="color: #4a5568;">${legalStandards.requesting_entity_arabic || formData.requested_by || 'غير محدد'}</span>
            </div>
            <div style="margin: 12px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; min-width: 45%;">
              <span style="font-weight: 700; color: #2d3748;">اسم المقيم:</span>
              <span style="color: #4a5568;">${legalStandards.appraiser_name_arabic || appraisal.appraiser_name || 'غير محدد'}</span>
            </div>
            <div style="margin: 12px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; min-width: 45%;">
              <span style="font-weight: 700; color: #2d3748;">رخصة المقيم:</span>
              <span style="color: #4a5568;">${legalStandards.appraiser_license_number || appraisal.appraiser_license || 'غير محدد'}</span>
            </div>
          </div>
        </div>

        <!-- Legal Compliance Status -->
        <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 15px;">حالة الامتثال القانوني / Legal Compliance Status</h3>
          
          <div style="display: flex; flex-wrap: wrap; gap: 15px;">
            <div style="margin: 8px 0; padding: 10px; background: ${legalStandards.standards_compliance ? '#e8f5e8' : '#fee8e8'}; border-radius: 5px; min-width: 30%;">
              <span style="font-weight: 600;">الامتثال للمعايير:</span>
              <span style="color: ${legalStandards.standards_compliance ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
                ${legalStandards.standards_compliance ? 'متوافق ✓' : 'غير متوافق ✗'}
              </span>
            </div>
            
            <div style="margin: 8px 0; padding: 10px; background: ${legalStandards.market_value_definition_confirmed ? '#e8f5e8' : '#fee8e8'}; border-radius: 5px; min-width: 30%;">
              <span style="font-weight: 600;">تعريف القيمة السوقية:</span>
              <span style="color: ${legalStandards.market_value_definition_confirmed ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
                ${legalStandards.market_value_definition_confirmed ? 'مؤكد ✓' : 'غير مؤكد ✗'}
              </span>
            </div>
            
            <div style="margin: 8px 0; padding: 10px; background: ${!legalStandards.ownership_disputes_confirmed ? '#e8f5e8' : '#fee8e8'}; border-radius: 5px; min-width: 30%;">
              <span style="font-weight: 600;">عدم وجود نزاعات:</span>
              <span style="color: ${!legalStandards.ownership_disputes_confirmed ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
                ${!legalStandards.ownership_disputes_confirmed ? 'مؤكد ✓' : 'يوجد نزاعات ✗'}
              </span>
            </div>
            
            <div style="margin: 8px 0; padding: 10px; background: ${legalStandards.physical_inspection_completed ? '#e8f5e8' : '#fee8e8'}; border-radius: 5px; min-width: 30%;">
              <span style="font-weight: 600;">المعاينة الفعلية:</span>
              <span style="color: ${legalStandards.physical_inspection_completed ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
                ${legalStandards.physical_inspection_completed ? 'تمت ✓' : 'لم تتم ✗'}
              </span>
            </div>
            
            <div style="margin: 8px 0; padding: 10px; background: ${legalStandards.highest_best_use_applied ? '#e8f5e8' : '#fee8e8'}; border-radius: 5px; min-width: 30%;">
              <span style="font-weight: 600;">أعلى وأفضل استخدام:</span>
              <span style="color: ${legalStandards.highest_best_use_applied ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
                ${legalStandards.highest_best_use_applied ? 'مطبق ✓' : 'غير مطبق ✗'}
              </span>
            </div>
            
            <div style="margin: 8px 0; padding: 10px; background: ${legalStandards.professional_independence_declared ? '#e8f5e8' : '#fee8e8'}; border-radius: 5px; min-width: 30%;">
              <span style="font-weight: 600;">الاستقلالية المهنية:</span>
              <span style="color: ${legalStandards.professional_independence_declared ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
                ${legalStandards.professional_independence_declared ? 'مؤكدة ✓' : 'غير مؤكدة ✗'}
              </span>
            </div>
          </div>
        </div>

        <!-- Report Validity Period -->
        <div style="margin: 15px 0; padding: 15px; background: #f0f8ff; border-radius: 8px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 15px;">مدة صلاحية التقرير / Report Validity Period</h3>
          
          <div style="display: flex; flex-wrap: wrap; gap: 15px;">
            <div style="margin: 12px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; min-width: 45%;">
              <span style="font-weight: 700; color: #2d3748;">تاريخ المعاينة:</span>
              <span style="direction: ltr; color: #4a5568;">${legalStandards.inspection_date || appraisal.appraisal_date || 'غير محدد'}</span>
            </div>
            <div style="margin: 12px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; min-width: 45%;">
              <span style="font-weight: 700; color: #2d3748;">تاريخ إصدار التقرير:</span>
              <span style="direction: ltr; color: #4a5568;">${legalStandards.report_issue_date || appraisal.appraisal_date || 'غير محدد'}</span>
            </div>
            <div style="margin: 12px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; min-width: 45%;">
              <span style="font-weight: 700; color: #2d3748;">تاريخ التوقيع:</span>
              <span style="direction: ltr; color: #4a5568;">${legalStandards.signature_date || appraisal.appraisal_date || 'غير محدد'}</span>
            </div>
            <div style="margin: 12px 0; padding: 12px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; min-width: 45%;">
              <span style="font-weight: 700; color: #2d3748;">مدة الصلاحية:</span>
              <span style="color: #4a5568;">${legalStandards.report_validity_period_months || 12} شهر</span>
            </div>
          </div>
        </div>

        <!-- Standard Legal Clauses -->
        <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 15px;">النصوص القانونية المعيارية / Standard Legal Clauses</h3>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #2d3748;">تعريف القيمة السوقية:</div>
            <div style="font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
              القيمة السوقية المطلوب تحديدها هى الثمن الاكثر احتمالا الذى يحصله العقار فى سوق تنافسي مفتوح
            </div>
            <div style="direction: ltr; text-align: left; color: #666; font-size: 12px;">
              The market value to be determined is the most probable price that the property would achieve in an open competitive market.
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #2d3748;">الغرض من التقرير:</div>
            <div style="font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
              الغرض من اعداد التقرير هو تقدير القيمة السوقية للعقار موضوع التقييم لأقرب جنيه
            </div>
            <div style="direction: ltr; text-align: left; color: #666; font-size: 12px;">
              The purpose of preparing the report is to estimate the market value of the property subject to valuation to the nearest Egyptian pound.
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #2d3748;">المعاينة الفعلية:</div>
            <div style="font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
              تمت معاينة العقار من الداخل والخارج ولا يوجد اى عيوب ظاهره بالارض او المباني
            </div>
            <div style="direction: ltr; text-align: left; color: #666; font-size: 12px;">
              The property was inspected from inside and outside and there are no apparent defects in the land or buildings.
            </div>
          </div>

          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: #2d3748;">أعلى وأفضل استخدام:</div>
            <div style="font-size: 14px; line-height: 1.6; margin-bottom: 10px;">
              تم تقييم العقار اخذا فى الاعتبار فرضية اعلى وافضل استخدام للعقار الواردة بالباب الخاص بذلك
            </div>
            <div style="direction: ltr; text-align: left; color: #666; font-size: 12px;">
              The property was valued taking into account the highest and best use assumption for the property as detailed in the relevant section.
            </div>
          </div>
        </div>

        <!-- Egyptian Standards Compliance Overall Status -->
        <div style="margin: 15px 0; padding: 15px; background: ${legalStandards.standards_compliance ? '#e8f5e8' : '#fee8e8'}; border-radius: 8px; text-align: center;">
          <div style="font-weight: 600; font-size: 16px; color: ${legalStandards.standards_compliance ? '#3b82f6' : '#dc2626'};">
            ${legalStandards.standards_compliance ? 
              'مطابق للمعايير المصرية للتقييم العقاري ✓' : 
              'غير مطابق للمعايير المصرية ✗'
            }
          </div>
          <div style="direction: ltr; text-align: center; color: #666; font-size: 13px; margin-top: 5px;">
            ${legalStandards.standards_compliance ? 
              'Compliant with Egyptian Real Estate Valuation Standards' : 
              'Non-compliant with Egyptian Standards'
            }
          </div>
        </div>
      </div>
    `;
  }

  private generateInvestmentAnalysisSection(market: MarketAnalysis, property: PropertyData, appraisal: AppraisalData): string {
    const investment = market.investment_analysis;
    const monthlyRent = Math.round(appraisal.market_value_estimate * investment.rental_yield / 100 / 12);
    
    return `
      <div style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h2 style="font-size: 20px; font-weight: 700; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          تحليل الاستثمار التفصيلي / Detailed Investment Analysis
        </h2>
        
        <!-- Investment Metrics -->
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin: 12px 0;">
          <div style="padding: 12px; background: white; border-radius: 5px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">العائد الإيجاري</div>
            <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${investment.rental_yield.toFixed(2)}%</div>
            <div style="font-size: 12px; color: #666;">سنوياً</div>
          </div>
          
          <div style="padding: 12px; background: white; border-radius: 5px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">العائد 5 سنوات</div>
            <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${investment.roi_5year.toFixed(2)}%</div>
            <div style="font-size: 12px; color: #666;">ROI</div>
          </div>
          
          <div style="padding: 12px; background: white; border-radius: 5px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">العائد 10 سنوات</div>
            <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${investment.roi_10year.toFixed(2)}%</div>
            <div style="font-size: 12px; color: #666;">ROI</div>
          </div>
        </div>
        
        <!-- Rental Analysis -->
        <div style="margin: 12px 0; padding: 12px; background: white; border-radius: 5px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 10px;">تحليل الإيجار / Rental Analysis</h3>
          
          <div style="display: flex; flex-wrap: wrap; gap: 12px;">
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">الإيجار الشهري المقدر:</span>
              <span style="direction: ltr; font-weight: 700; color: #3b82f6;">${monthlyRent.toLocaleString('ar-EG')} جنيه</span>
            </div>
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">الإيجار السنوي:</span>
              <span style="direction: ltr; font-weight: 700; color: #3b82f6;">${(monthlyRent * 12).toLocaleString('ar-EG')} جنيه</span>
            </div>
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">الطلب على الإيجار:</span>
              <span style="font-weight: 600;">${investment.rental_demand}</span>
            </div>
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">معدل النمو السنوي:</span>
              <span style="direction: ltr; font-weight: 700; color: #3b82f6;">${investment.appreciation_rate.toFixed(2)}%</span>
            </div>
          </div>
        </div>
        
        <!-- Investment Recommendation -->
        <div style="margin: 12px 0; padding: 12px; background: #eff6ff; border-radius: 5px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 10px;">توصية الاستثمار / Investment Recommendation</h3>
          
          <div style="font-weight: 600; font-size: 15px; text-align: center; color: #3b82f6;">
            ${this.getInvestmentRecommendation(investment)}
          </div>
        </div>
      </div>
    `;
  }

  private generateMortgageAnalysisSection(appraisal: AppraisalData): string {
    const mortgageData = appraisal.mortgage_eligibility;
    
    return `
      <div style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h2 style="font-size: 20px; font-weight: 700; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          تحليل أهلية التمويل العقاري / Mortgage Eligibility Analysis
        </h2>
        
        <div style="margin: 12px 0; padding: 12px; background: ${mortgageData?.eligible ? '#e8f5e8' : '#fee8e8'}; border-radius: 5px; text-align: center;">
          <div style="font-size: 18px; font-weight: 700; color: ${mortgageData?.eligible ? '#3b82f6' : '#dc2626'};">
            ${mortgageData?.eligible ? 'مؤهل للحصول على تمويل عقاري ✓' : 'غير مؤهل للتمويل العقاري ✗'}
          </div>
          <div style="direction: ltr; color: #666; margin-top: 5px;">
            ${mortgageData?.eligible ? 'ELIGIBLE FOR MORTGAGE FINANCING' : 'NOT ELIGIBLE FOR MORTGAGE FINANCING'}
          </div>
        </div>
        
        ${mortgageData?.eligible ? `
        <div style="margin: 12px 0; padding: 12px; background: white; border-radius: 5px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 10px;">تفاصيل التمويل / Financing Details</h3>
          
          <div style="display: flex; flex-wrap: wrap; gap: 12px;">
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">الحد الأقصى للقرض:</span>
              <span style="direction: ltr; font-weight: 700; color: #3b82f6;">${mortgageData.max_loan_amount.toLocaleString('ar-EG')} جنيه</span>
            </div>
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">معدل الفائدة:</span>
              <span style="direction: ltr; font-weight: 700; color: #3b82f6;">${(mortgageData.interest_rate * 100).toFixed(2)}%</span>
            </div>
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">القسط الشهري:</span>
              <span style="direction: ltr; font-weight: 700; color: #3b82f6;">${mortgageData.monthly_installment.toLocaleString('ar-EG')} جنيه</span>
            </div>
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">المقدم المطلوب:</span>
              <span style="direction: ltr; font-weight: 700; color: #3b82f6;">${mortgageData.down_payment_required.toLocaleString('ar-EG')} جنيه</span>
            </div>
          </div>
        </div>
        ` : ''}
      </div>
    `;
  }

  private generateMethodologySection(appraisal: AppraisalData): string {
    const formData = appraisal.form_data || {};
    
    return `
      <div style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h2 style="font-size: 20px; font-weight: 700; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          المنهجية والمعايير المهنية / Methodology & Professional Standards
        </h2>
        
        <!-- Valuation Standards -->
        <div style="margin: 12px 0; padding: 12px; background: white; border-radius: 5px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 10px;">معايير التقييم المطبقة / Applied Valuation Standards</h3>
          
          <div style="margin: 10px 0;">
            <div style="margin: 8px 0; display: flex; align-items: center;">
              <span style="color: #3b82f6; margin-left: 10px;">✓</span>
              <span>المعايير المصرية للتقييم العقاري</span>
            </div>
            <div style="margin: 8px 0; display: flex; align-items: center;">
              <span style="color: #3b82f6; margin-left: 10px;">✓</span>
              <span>المعايير الدولية للتقييم (IVS)</span>
            </div>
            <div style="margin: 8px 0; display: flex; align-items: center;">
              <span style="color: #3b82f6; margin-left: 10px;">✓</span>
              <span>لوائح الهيئة العامة للرقابة المالية</span>
            </div>
          </div>
        </div>
        
        <!-- Report Validity -->
        <div style="margin: 12px 0; padding: 12px; background: white; border-radius: 5px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 10px;">صلاحية التقرير / Report Validity</h3>
          
          <div style="display: flex; flex-wrap: wrap; gap: 12px;">
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">تاريخ التقييم:</span>
              <span style="direction: ltr;">${appraisal.appraisal_date}</span>
            </div>
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">صالح حتى:</span>
              <span style="direction: ltr;">${formData.appraisal_valid_until || 'غير محدد'}</span>
            </div>
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">مدة الصلاحية:</span>
              <span style="direction: ltr;">${formData.report_validity_months || 12} شهر</span>
            </div>
            <div style="margin: 8px 0; display: flex; justify-content: space-between;">
              <span style="font-weight: 600;">الرقم المرجعي:</span>
              <span style="direction: ltr;">${appraisal.reference_number}</span>
            </div>
          </div>
        </div>
        
        <!-- Professional Statement -->
        <div style="margin: 12px 0; padding: 12px; background: #f0f8ff; border-radius: 5px;">
          <div style="font-weight: 600; margin-bottom: 10px; color: #3b82f6;">البيان المهني / Professional Statement:</div>
          <div style="font-size: 13px; line-height: 1.6;">
            تم إعداد هذا التقرير وفقاً للمعايير المهنية للتقييم العقاري في جمهورية مصر العربية ووفقاً للمعايير الدولية للتقييم (IVS). 
            تم فحص العقار شخصياً من قبل خبير التقييم المرخص وتم الاطلاع على جميع الوثائق والمستندات المتاحة.
          </div>
          <div style="direction: ltr; text-align: left; color: #666; font-size: 12px; margin-top: 10px;">
            This report has been prepared in accordance with Egyptian real estate valuation standards and International Valuation Standards (IVS). 
            The property was personally inspected by the licensed appraiser and all available documents were reviewed.
          </div>
        </div>
      </div>
    `;
  }

  private getInvestmentRecommendation(investment: MarketAnalysis['investment_analysis']): string {
    if (investment.rental_yield >= 8 && investment.roi_5year >= 15) {
      return 'توصية قوية بالشراء - فرصة استثمارية ممتازة / STRONG BUY - Excellent Investment Opportunity';
    } else if (investment.rental_yield >= 6 && investment.roi_5year >= 10) {
      return 'توصية بالشراء - فرصة استثمارية جيدة / BUY - Good Investment Opportunity';
    } else if (investment.rental_yield >= 4 && investment.roi_5year >= 5) {
      return 'للنظر - إمكانية استثمارية متوسطة / CONSIDER - Moderate Investment Potential';
    } else {
      return 'تجنب - عوائد استثمارية منخفضة / AVOID - Low Investment Returns';
    }
  }

  /**
   * Preload and validate image URLs for better PDF generation
   */
  private async preloadImages(images: PropertyImage[]): Promise<PropertyImage[]> {
    const validImages: PropertyImage[] = [];
    
    for (const image of images) {
      try {
        // Test if image URL is accessible
        const response = await fetch(image.url, { method: 'HEAD' });
        if (response.ok) {
          validImages.push(image);
        } else {
          console.warn(`🖼️  Image failed to load: ${image.filename} (${response.status})`);
        }
      } catch (error) {
        console.warn(`🖼️  Image validation error: ${image.filename}`, error);
      }
    }
    
    console.log(`🖼️  Image validation complete: ${validImages.length}/${images.length} valid images`);
    return validImages;
  }

  /**
   * Convert image URL to base64 for embedding in PDF
   */
  private async imageToBase64(imageUrl: string): Promise<string | null> {
    try {
      // If it's already a data URL (base64), return it directly
      if (imageUrl.startsWith('data:')) {
        console.log(`🖼️  Image is already base64 data URL, using directly`);
        return imageUrl;
      }
      
      // Otherwise, fetch and convert HTTP URLs
      const response = await fetch(imageUrl);
      if (!response.ok) return null;
      
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn(`🖼️  Failed to convert image to base64: ${imageUrl}`, error);
      return null;
    }
  }

  /**
   * Generate a dedicated image gallery page for PDF reports
   */
  private async generateImageGalleryPage(
    pdf: jsPDF, 
    images: PropertyImage[], 
    reportType: 'standard' | 'detailed' | 'comprehensive'
  ): Promise<void> {
    if (!images || images.length === 0) return;

    console.log(`🖼️  Generating image gallery page with ${images.length} images for ${reportType} report`);
    console.log('🖼️  Images to process:', images.map((img, i) => `${i + 1}. ${img.filename} | URL: ${img.url?.substring(0, 50)}... | Source: ${img.source}`));
    
    // Enhanced debugging - track image conversion success/failure
    let successfulImages = 0;
    let failedImages = 0;
    const imageResults: Array<{index: number, filename: string, success: boolean, error?: string}> = [];
    
    // Setup fonts
    this.setupFonts(pdf);
    
    // Page margins and dimensions
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    const headerHeight = 25;
    
    let currentY = margin;
    
    // Add page title
    pdf.setFont('Amiri', 'normal');
    pdf.setFontSize(18);
    pdf.setTextColor(59, 130, 246); // Blue color
    
    // Arabic title (RTL)
    pdf.text('صور العقار', pageWidth - margin, currentY + 8, { align: 'right' });
    // English title (LTR)  
    pdf.text('Property Images', margin, currentY + 8, { align: 'left' });
    
    currentY += headerHeight;
    
    // Add divider line
    pdf.setDrawColor(59, 130, 246);
    pdf.setLineWidth(0.5);
    pdf.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;
    
    // Image layout parameters
    const imagesPerRow = reportType === 'standard' ? 2 : 3;
    const imageWidth = (contentWidth - (10 * (imagesPerRow - 1))) / imagesPerRow;
    const imageHeight = imageWidth * 0.75; // 4:3 aspect ratio
    const rowSpacing = 20;
    const captionHeight = 15;
    
    // Process images in rows
    for (let i = 0; i < images.length; i += imagesPerRow) {
      // Check if we need a new page
      if (currentY + imageHeight + captionHeight + rowSpacing > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
      }
      
      const rowImages = images.slice(i, i + imagesPerRow);
      
      // Draw images in current row
      for (let j = 0; j < rowImages.length; j++) {
        const image = rowImages[j];
        const xPos = margin + (j * (imageWidth + 10));
        const currentImageIndex = i + j + 1;
        
        try {
          console.log(`🖼️  Processing image ${currentImageIndex}/${images.length}: ${image.filename}`);
          console.log(`🔍  Image details: URL: ${image.url?.substring(0, 100)}, Source: ${image.source}, Is Primary: ${image.is_primary}, Page: ${image.document_page}`);
          
          // Convert image to base64 for embedding
          const base64Data = await this.imageToBase64(image.url);
          
          if (base64Data) {
            console.log(`✅ Image ${currentImageIndex} converted successfully - Base64 length: ${base64Data.length}`);
            successfulImages++;
            imageResults.push({index: currentImageIndex, filename: image.filename, success: true});
            
            // Draw image border
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.3);
            pdf.rect(xPos, currentY, imageWidth, imageHeight);
            
            // Add image
            pdf.addImage(
              base64Data,
              'JPEG',
              xPos + 1,
              currentY + 1,
              imageWidth - 2,
              imageHeight - 2,
              undefined,
              'MEDIUM'
            );
            
            // Add primary indicator
            if (image.is_primary) {
              pdf.setFillColor(59, 130, 246);
              pdf.setTextColor(255, 255, 255);
              pdf.setFontSize(8);
              pdf.rect(xPos + 2, currentY + 2, 15, 6, 'F');
              pdf.text('★', xPos + 4, currentY + 6);
            }
            
          } else {
            console.warn(`❌ Image ${currentImageIndex} failed to convert: ${image.filename}`);
            console.warn(`❌ Failed image details: URL: ${image.url}, Source: ${image.source}, Type: ${typeof image.url}`);
            failedImages++;
            imageResults.push({index: currentImageIndex, filename: image.filename, success: false, error: 'Base64 conversion returned null'});
            
            // Placeholder for failed images
            pdf.setFillColor(243, 244, 246);
            pdf.rect(xPos, currentY, imageWidth, imageHeight, 'F');
            pdf.setTextColor(107, 114, 128);
            pdf.setFontSize(10);
            pdf.text('Image not available', xPos + imageWidth/2, currentY + imageHeight/2, { align: 'center' });
          }
          
          // Add caption
          pdf.setTextColor(100, 116, 139);
          pdf.setFontSize(8);
          const caption = image.filename || `Image ${i + j + 1}`;
          pdf.text(caption, xPos + imageWidth/2, currentY + imageHeight + 8, { 
            align: 'center',
            maxWidth: imageWidth - 4
          });
          
        } catch (error) {
          const currentImageIndex = i + j + 1;
          console.error(`❌ Exception while adding image ${currentImageIndex} to PDF: ${image.filename}`, error);
          console.error(`❌ Exception details for image ${currentImageIndex}: URL: ${image.url}, Source: ${image.source}`, error);
          failedImages++;
          imageResults.push({index: currentImageIndex, filename: image.filename, success: false, error: `Exception: ${error?.message || 'Unknown error'}`});
          
          // Draw placeholder
          pdf.setFillColor(243, 244, 246);
          pdf.rect(xPos, currentY, imageWidth, imageHeight, 'F');
          pdf.setTextColor(107, 114, 128);
          pdf.setFontSize(10);
          pdf.text('Error loading image', xPos + imageWidth/2, currentY + imageHeight/2, { align: 'center' });
        }
      }
      
      currentY += imageHeight + captionHeight + rowSpacing;
    }
    
    // Add footer with image count
    pdf.setTextColor(107, 114, 128);
    pdf.setFontSize(10);
    const footerText = `${successfulImages} images documented / ${successfulImages} صورة موثقة`;
    pdf.text(footerText, pageWidth/2, pageHeight - 10, { align: 'center' });
    
    // Enhanced logging - detailed results summary
    console.log(`📊 Image Gallery Results Summary for ${reportType} report:`);
    console.log(`   - Total images received: ${images.length}`);
    console.log(`   - Successfully processed: ${successfulImages}`);
    console.log(`   - Failed to process: ${failedImages}`);
    console.log(`   - Success rate: ${Math.round((successfulImages / images.length) * 100)}%`);
    
    if (failedImages > 0) {
      console.log(`❌ Failed Images Details:`);
      imageResults.filter(r => !r.success).forEach(result => {
        console.log(`   - Image ${result.index}: ${result.filename} - ${result.error}`);
      });
    }
    
    if (successfulImages > 0) {
      console.log(`✅ Successful Images:`);
      imageResults.filter(r => r.success).forEach(result => {
        console.log(`   - Image ${result.index}: ${result.filename}`);
      });
    }
    
    console.log(`✅ Image gallery page generated with ${successfulImages}/${images.length} images`);
  }

  private generateImagesSection(property: PropertyData): string {
    const images = property.images || [];
    
    // Handle both old format (string[]) and new format (PropertyImage[])
    const processedImages = images.map((img, index) => {
      if (typeof img === 'string') {
        // Legacy format: convert string URL to PropertyImage-like object
        return {
          url: img,
          filename: `property_image_${index + 1}.jpg`,
          alt_text: `Property Image ${index + 1}`,
          caption: `Property Image ${index + 1}`,
          is_primary: index === 0,
          document_page: 0,
          category: 'general'
        };
      } else {
        // New format: PropertyImage object
        return img;
      }
    });

    // Separate primary images from others for better layout
    const primaryImages = processedImages.filter(img => img.is_primary);
    const secondaryImages = processedImages.filter(img => !img.is_primary);
    const displayImages = [...primaryImages, ...secondaryImages];
    
    return `
      <div style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h2 style="font-size: 20px; font-weight: 700; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          صور العقار / Property Images
        </h2>
        
        <div style="margin: 12px 0;">
          <div style="font-weight: 600; margin-bottom: 10px; color: #3b82f6;">
            تم توثيق العقار بـ ${images.length} صورة فوتوغرافية / Property documented with ${images.length} photographs
            ${primaryImages.length > 0 ? ` (${primaryImages.length} صور رئيسية / ${primaryImages.length} primary)` : ''}
          </div>
          
          ${displayImages.length > 0 ? `
          <div style="display: flex; flex-wrap: wrap; gap: 12px; margin: 15px 0;">
            ${displayImages.map((image, index) => `
              <div style="flex: 1; min-width: 250px; max-width: 300px; padding: 8px; background: white; border-radius: 5px; text-align: center; ${image.is_primary ? 'border: 2px solid #3b82f6;' : ''}">
                <div style="width: 100%; height: 200px; background: #f3f4f6; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px; position: relative; overflow: hidden;">
                  <img src="${image.url}" 
                       style="width: 100%; height: 100%; object-fit: cover; border-radius: 4px;" 
                       alt="${image.alt_text || `Property Image ${index + 1}`}"
                       onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                  <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: #f3f4f6; color: #6b7280; font-size: 12px;">
                    ${image.alt_text || `صورة العقار ${index + 1}<br/>Property Image ${index + 1}`}
                  </div>
                </div>
                <div style="font-size: 12px; color: #64748b; font-weight: 500;">
                  ${image.filename || `صورة ${index + 1} / Image ${index + 1}`}
                  ${image.is_primary ? '<div style="color: #3b82f6; font-weight: 600; font-size: 10px;">★ رئيسية / Primary</div>' : ''}
                  ${image.caption ? `<div style="font-size: 10px; color: #9ca3af; margin-top: 4px;">${image.caption}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
          ` : `
          <div style="text-align: center; padding: 20px; color: #6b7280;">
            لا توجد صور متاحة للعقار / No images available for this property
          </div>
          `}
          
          ${images.length > 6 ? `
          <div style="margin-top: 15px; padding: 10px; background: #eff6ff; border-radius: 5px; text-align: center;">
            <div style="font-size: 13px; color: #3b82f6; font-weight: 600;">
              عرض أول 6 صور - ${images.length - 6} صور إضافية متاحة / Showing first 6 images - ${images.length - 6} additional images available
            </div>
          </div>
          ` : ''}
          
          <div style="margin-top: 15px; padding: 10px; background: white; border-radius: 5px; font-size: 12px; color: #64748b;">
            <div style="margin-bottom: 5px; font-weight: 600;">ملاحظة مهنية / Professional Note:</div>
            <div style="margin-bottom: 3px;">تم التقاط هذه الصور أثناء معاينة العقار وتمثل الحالة الفعلية للعقار وقت التقييم.</div>
            <div style="direction: ltr; text-align: left; font-size: 11px;">These photographs were taken during property inspection and represent the actual condition at the time of appraisal.</div>
            ${processedImages.some(img => img.document_page > 0) ? `
            <div style="margin-top: 5px; font-size: 10px; color: #9ca3af;">
              بعض الصور مستخرجة من المستندات الرسمية / Some images extracted from official documents
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  private generateCertificationSection(appraisal: AppraisalData): string {
    const formData = appraisal.form_data || {};
    const legalStandards = formData.egyptian_legal_standards || {};
    const certificationPoints = legalStandards.certification_points_confirmed || new Array(10).fill(true);
    
    // Professional certification points (Arabic)
    const certificationPointsArabic = [
      "قد قمت بدراسة سوق منطقة العقار و اخترت على الأقل عدد ثلاث مبيعات حديثة لعقارات أقرب ما يمكن من حيث النوع و الموقع للعقار المقيم و قمت بعمل التعديلات المالية حيث وجدت لتعكس تأثير السوق و ذلك في حالة استعمال طريقة مقارنة أسعار البيع",
      "قد قمت بأخذ جميع العوامل التي تؤثر على قيمة العقار حسب التقرير المقدم عن عمد و إنني لم اخفي أي معلومات هامة من تقرير التقييم و إنني أشهد أنه حسب علمي فإن كل المعلومات و البيانات المقدمة صحيحة و حقيقية",
      "قد قدمت بالتقرير رأيي الشخصي المحايد الفني و الآراء و المستنتجات التي تحددها فقط الاشتراطات و الحدود الواردة بهذة الشهادة",
      "أنه ليس لدي أي اهتمام حالي أو مستقبلي متوقع كما أنه ليس لأي من موظفي مكتبي الحاليين أو المستقبليين اهتمام بالعقار موضوع التقييم كما إنني اشهد أن أتعابي عن أعداد هذا التقييم لا تعتمد على قيمة العقار الواردة بتقرير التقييم",
      "أنه ليس لي اهتمام حالي أو مستقبلي بالعقار موضوع التقييم و ليس لدي أي تفضيل حالي أو مستقبلي لأي طرف من أطراف التعاقد و التقييم",
      "إنني لم ابني تحليلي لقيمة العقار سواء جزئيا أو كليا على عنصر أو لون أو ديانة أو جنس أو عجز أو الحالة العائلية أو الموطن الأصلي لأي من طرفي التعاقد أو شاغلي العقار أو شاغلي العقارات المجاورة",
      "أنه لم يطلب إلي تقديم أي آراء مسبقة عن قيمة أو اتجاه قيمة العقار يخدم مصلحة العميل طالب التقييم أو أي جهة مرتبطة به كما لم يطلب مني الوصول إلى قيمة محددة للعقار كما لم يطلب مني حدوث أي أحداث مستقبلية للحصول على عقد أداء أو قيمة أتعابي عن العمل كما إنني لم ابني التقرير على حد أدنى لقيمة معينة أو تقييم معين أو الحاجة للموافقة على منح قرض معين",
      "إنني قمت بأداء هذا التقييم فى ضوء المعايير المصرية للتقييم العقاري الصادرة بقرار مجلس ادارة الهيئة العامة للرقابة المالية رقم (39) لسنة 2015 بتاريخ 19 أبريل 2015",
      "إنني اقر أن القيمة الواردة التقييم مبنيه على عرض العقار لفترة زمنيه مناسبة بالسوق الحر حسب الوارد بتعريف القيمة السوقية للعقار و أن القيمة التي توصلت أليها ملائمة لفترة التسويق الواردة ببابي البيانات والمعلومات و دراسة السوق ما لم يذكر خلاف ذلك بباب النتيجة النهائية الواردة بالتقرير",
      "إنني شخصيا قمت بفحص داخل و خارج العقار موضع التقييم و فحص خارج العقارات التي تم استخدامها في مقارنة البيوع السابقة كما إنني قد قمت بإيضاح أي ظروف معاكسة ظاهرة أو معروفة في مبنى العقار أو بالموقع أو أي عقار مجاور مباشرة للعقار موضع التقييم و التي اعلم بها و قمت بعمل التعديلات اللازمة على قيمة العقار نتيجة هذة الظروف في تقرير التقييم لقيمة العقار و الواردة بالتقرير كما إنني قمت بالتعليق على هذة الظروف المعاكسة و تأثيرها على تسويق العقار بدرجة واضحة تماما"
    ];

    return `
      <div style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; margin-top: 15px; padding: 15px; border: 2px solid #3b82f6; border-radius: 10px; background: #f8fafc;">
        <h2 style="font-size: 20px; font-weight: 700; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          شهادة الخبير وفقاً للمعايير المصرية / Expert Certification - Egyptian Standards
        </h2>
        
        <!-- Professional Certification Declaration -->
        <div style="margin: 12px 0; padding: 12px; background: #eff6ff; border-radius: 5px;">
          <div style="margin-bottom: 15px; font-weight: 600; color: #3b82f6;">
            إقرار الشهادة المهنية وفقاً للمعايير المصرية للتقييم العقاري:
          </div>
          <div style="margin-bottom: 15px; font-weight: 500;">
            أشهد أنا ${legalStandards.appraiser_name_arabic || appraisal.appraiser_name || 'خبير التقييم'} بأن هذا التقرير تم إعداده طبقاً للمعايير المصرية للتقييم العقاري الصادرة بقرار الهيئة العامة للرقابة المالية رقم (${legalStandards.fra_resolution_number || '39'}) لسنة ${legalStandards.fra_resolution_year || '2015'} وبعد فحص دقيق للعقار ودراسة شاملة لسوق العقارات بالمنطقة.
          </div>
          
          <div style="color: #666; margin-bottom: 20px; direction: ltr; text-align: left; font-size: 12px;">
            I, ${legalStandards.appraiser_name_arabic || appraisal.appraiser_name || 'the appraiser'}, certify that this appraisal report has been prepared in accordance with Egyptian Real Estate Valuation Standards issued by FRA Resolution No. ${legalStandards.fra_resolution_number || '39'} of ${legalStandards.fra_resolution_year || '2015'} following a thorough inspection of the property and comprehensive market analysis.
          </div>
        </div>

        <!-- Professional Certification Points (10 Points) -->
        <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 15px;">نقاط الشهادة المهنية (10 نقاط) / Professional Certification Points</h3>
          
          ${certificationPointsArabic.map((point, index) => `
            <div style="margin: 15px 0; padding: 15px; background: ${certificationPoints[index] ? '#e8f5e8' : '#fee8e8'}; border-radius: 8px; border-right: 4px solid ${certificationPoints[index] ? '#3b82f6' : '#dc2626'};">
              <div style="display: flex; align-items: flex-start; gap: 15px;">
                <div style="flex: 1;">
                  <div style="font-size: 14px; line-height: 1.6; text-align: justify;">
                    ${index + 1}. ${point}
                  </div>
                </div>
                <div style="color: ${certificationPoints[index] ? '#3b82f6' : '#dc2626'}; font-weight: 600; font-size: 20px; min-width: 30px; text-align: center;">
                  ${certificationPoints[index] ? '✓' : '✗'}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <!-- Complete Signature Section - Keep Together -->
        <div class="no-break" style="margin-top: 20px; padding: 20px; border: 2px solid #3b82f6; border-radius: 8px; background: #f8fafc;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin: 0;">توقيع الخبير المعتمد / Expert Certification & Signature</h3>
          </div>
          
          <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px;">
            <span style="font-weight: 700; color: #3b82f6;">اسم الخبير / Expert Name:</span>
            <span style="color: #4a5568; margin-right: 10px;">${legalStandards.appraiser_name_arabic || appraisal.appraiser_name}</span>
          </div>
          
          <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px;">
            <span style="font-weight: 700; color: #3b82f6;">رخصة التقييم / Valuation License:</span>
            <span style="color: #4a5568; margin-right: 10px;">${legalStandards.appraiser_license_number || appraisal.appraiser_license}</span>
          </div>
          
          <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px;">
            <span style="font-weight: 700; color: #3b82f6;">التاريخ / Date:</span>
            <span style="color: #4a5568; margin-right: 10px;">${legalStandards.signature_date || new Date().toLocaleDateString('ar-EG')}</span>
          </div>
          
          <div style="margin: 20px 0; padding: 20px; border: 2px dashed #3b82f6; border-radius: 8px; background: white; text-align: center;">
            <div style="font-weight: 600; margin-bottom: 15px; font-size: 16px; color: #3b82f6;">التوقيع / Signature</div>
            <div style="height: 50px; border-bottom: 2px solid #3b82f6; margin: 20px auto; width: 200px;"></div>
            <div style="font-size: 12px; color: #666; margin-top: 10px;">توقيع الخبير المعتمد / Certified Expert Signature</div>
          </div>
        </div>
        
        <!-- OpenBeit Branded Footer -->
        <div style="margin-top: 20px; padding: 15px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-top: 3px solid #3b82f6; border-radius: 12px; text-align: center;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <div style="direction: ltr; text-align: left; color: #64748b; font-size: 12px;">
              Report generated for ${appraisal.client_name || 'Client'}
            </div>
            <div style="display: flex; align-items: center; color: #2d3748;">
              <svg width="20" height="20" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-left: 8px;">
                <rect x="12" y="8" width="28" height="48" stroke="#3b82f6" stroke-width="4"/>
                <polygon points="12,8 36,20 36,52 12,56" fill="#3b82f6"/>
                <circle cx="28" cy="32" r="2.5" fill="white"/>
              </svg>
              <strong style="font-size: 16px;">OpenBeit</strong>
              <span style="color: #64748b; margin-left: 8px;">| openebeit.com</span>
            </div>
            <div style="direction: ltr; text-align: right; color: #64748b; font-size: 12px;">
              Generated: ${new Date().toLocaleDateString('en-US')}
            </div>
          </div>
          <div style="font-size: 10px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px;">
            هذا التقرير تم إنشاؤه بواسطة نظام OpenBeit المتطور لتقييم العقارات - This report was generated by OpenBeit's advanced real estate appraisal system
          </div>
        </div>
      </div>
    `;
  }

  private generateCoverPage(
    pdf: jsPDF, 
    property: PropertyData, 
    appraisal: AppraisalData, 
    options: ReportOptions
  ) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    // Header with bilingual title
    pdf.setFontSize(20);
    const arabicTitle = 'تقرير تقييم مقدم لشركة أملاك للتمويل العقاري';
    const processedTitle = this.processArabicText(arabicTitle);
    this.setTextFont(pdf, processedTitle, 'bold');
    pdf.text(processedTitle, centerX, 25, { align: 'center' });
    
    pdf.setFontSize(16);
    this.setTextFont(pdf, 'Property Appraisal Report for Real Estate Finance Company', 'normal');
    pdf.text('Property Appraisal Report for Real Estate Finance Company', centerX, 35, { align: 'center' });

    // Appraiser info box
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(20, 45, pageWidth - 40, 25);
    pdf.setFontSize(12);
    const appraiserText = `خبير التقييم: ${appraisal.appraiser_name}`;
    const processedAppraiserText = this.processArabicText(appraiserText);
    this.setTextFont(pdf, processedAppraiserText);
    pdf.text(processedAppraiserText, 25, 55);
    
    this.setTextFont(pdf, `Appraisal Expert: ${appraisal.appraiser_name}`);
    pdf.text(`Appraisal Expert: ${appraisal.appraiser_name}`, 25, 62);
    
    const licenseText = `رقم القيد بالهيئة العامة للرقابة المالية: ${appraisal.appraiser_license}`;
    const processedLicenseText = this.processArabicText(licenseText);
    this.setTextFont(pdf, processedLicenseText);
    pdf.text(processedLicenseText, pageWidth - 25, 55, { align: 'right' });

    // Property identification section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('بيانات العقار / Property Information', 20, 85);
    
    const propertyDetails = [
      { ar: 'اسم المشروع:', en: 'Project Name:', value: property.title },
      { ar: 'عنوان العقار:', en: 'Property Address:', value: `${property.address}, ${property.city}` },
      { ar: 'المحافظة:', en: 'Governorate:', value: property.city },
      { ar: 'المدينة:', en: 'City:', value: property.district },
      { ar: 'نوع العقار:', en: 'Property Type:', value: property.property_type },
      { ar: 'اسم العميل:', en: 'Client Name:', value: appraisal.client_name },
      { ar: 'تاريخ التقييم:', en: 'Appraisal Date:', value: appraisal.appraisal_date },
      { ar: 'رقم مرجعي:', en: 'Reference Number:', value: appraisal.reference_number }
    ];

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    let yPos = 95;
    
    propertyDetails.forEach(detail => {
      pdf.text(`${detail.ar} ${detail.en}`, 25, yPos);
      pdf.text(detail.value, 140, yPos);
      yPos += 8;
    });

    // Final appraisal value (prominent)
    pdf.setDrawColor(0, 0, 0);
    pdf.setFillColor(240, 240, 240);
    pdf.rect(20, yPos + 10, pageWidth - 40, 25, 'FD');
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('نتيجة التقييم / Appraisal Result:', 25, yPos + 22);
    pdf.setFontSize(18);
    pdf.setTextColor(0, 100, 0);
    pdf.text(`${appraisal.market_value_estimate.toLocaleString()} جنيه مصري`, pageWidth - 25, yPos + 28, { align: 'right' });
    pdf.setTextColor(0, 0, 0);

    // Footer disclaimer
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const currentDate = new Date().toLocaleDateString();
    pdf.text(`تم إنشاء التقرير في / Report generated on: ${currentDate}`, centerX, 250, { align: 'center' });
  }

  private generateExecutiveSummary(
    pdf: jsPDF,
    property: PropertyData,
    appraisal: AppraisalData,
    market: MarketAnalysis,
    options: ReportOptions,
    startY: number
  ): number {
    let yPos = startY;
    
    // Section header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.reportTexts.en.executive_summary, 20, yPos);
    yPos += 15;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    // Summary content
    const summaryPoints = [
      `Property Type: ${property.property_type} located in ${property.district}, ${property.city}`,
      `Total Area: ${property.area.toLocaleString()} m²`,
      `Market Value Estimate: ${appraisal.market_value_estimate.toLocaleString()} EGP`,
      `Price per m²: ${Math.round(appraisal.market_value_estimate / property.area).toLocaleString()} EGP/m²`,
      `Confidence Level: ${appraisal.confidence_level}%`,
      `Market Activity: ${market.market_trends.market_activity} with ${market.market_trends.days_on_market} days average on market`
    ];

    if (options.include_investment_projections) {
      summaryPoints.push(`Rental Yield: ${market.investment_analysis.rental_yield.toFixed(2)}%`);
      summaryPoints.push(`5-Year ROI Projection: ${market.investment_analysis.roi_5year.toFixed(2)}%`);
    }

    summaryPoints.forEach(point => {
      const lines = pdf.splitTextToSize(point, 170);
      pdf.text(lines, 20, yPos);
      yPos += lines.length * 6 + 3;
    });

    return yPos + 10;
  }

  private generatePropertyDetails(
    pdf: jsPDF,
    property: PropertyData,
    appraisal: AppraisalData,
    options: ReportOptions,
    startY: number
  ): number {
    let yPos = startY;

    // Section header (bilingual)
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('معلومات عن العقار / Property Information', 20, yPos);
    yPos += 15;

    // Basic property details with form_data integration
    pdf.setFontSize(11);
    const formData = appraisal.form_data || {};
    const calcResults = appraisal.calculation_results || {};
    
    const details = [
      ['نوع العقار / Property Type:', property.property_type],
      ['العنوان / Address:', `${formData.property_address_arabic || property.address} / ${formData.property_address_english || property.address}`],
      ['المحافظة / Governorate:', `${formData.governorate || property.city}`],
      ['المدينة / City:', `${formData.city_name || property.city}`],
      ['الحي / District:', `${formData.district_name || property.district}`],
      ['المساحة الصافية / Net Area:', `${property.area} متر مربع / ${property.area} m²`],
      ['مساحة الأرض / Land Area:', `${formData.land_area_sqm || 'N/A'} متر مربع / ${formData.land_area_sqm || 'N/A'} m²`],
      ['المساحة المبنية / Built Area:', `${formData.built_area_sqm || 'N/A'} متر مربع / ${formData.built_area_sqm || 'N/A'} m²`],
      ['عمر المبنى / Building Age:', `${formData.building_age_years || 'N/A'} سنة / ${formData.building_age_years || 'N/A'} years`],
      ['العمر الاقتصادي / Economic Life:', `${formData.economic_life_years || 60} سنة / ${formData.economic_life_years || 60} years`],
      ['نوع الملكية / Ownership Type:', formData.ownership_type || 'N/A'],
      ['مستوى التشطيب / Finishing Level:', formData.finishing_level || 'N/A'],
      ['نوع الإنشاء / Construction Type:', formData.construction_type || 'N/A'],
      ['الحالة الإنشائية / Structural Condition:', formData.structural_condition || 'N/A'],
      ['الحالة الخارجية / Exterior Condition:', formData.exterior_condition || 'N/A'],
      ['الحالة الداخلية / Interior Condition:', formData.interior_condition || 'N/A']
    ];

    // Draw details table
    details.forEach(([label, value]) => {
      pdf.setFont('helvetica', 'bold');
      pdf.text(label, 20, yPos);
      pdf.setFont('helvetica', 'normal');
      const displayValue = value || 'غير محدد / N/A';
      const lines = pdf.splitTextToSize(displayValue.toString(), 80);
      pdf.text(lines, 110, yPos);
      yPos += Math.max(8, lines.length * 6);
    });

    // Utilities and services section
    yPos += 10;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('المرافق والخدمات / Utilities & Services:', 20, yPos);
    yPos += 8;

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const utilities = [
      [`المياه / Water:`, formData.water_supply_available ? 'متوفر / Available' : 'غير متوفر / Not Available'],
      [`الكهرباء / Electricity:`, formData.electricity_available ? 'متوفر / Available' : 'غير متوفر / Not Available'],
      [`الغاز / Gas:`, formData.gas_supply_available ? 'متوفر / Available' : 'غير متوفر / Not Available'],
      [`الصرف الصحي / Sewage:`, formData.sewage_system_available ? 'متوفر / Available' : 'غير متوفر / Not Available'],
      [`الإنترنت / Internet:`, formData.internet_fiber_available ? 'متوفر / Available' : 'غير متوفر / Not Available'],
      [`المصعد / Elevator:`, formData.elevator_available ? 'متوفر / Available' : 'غير متوفر / Not Available'],
      [`الجراج / Parking:`, formData.parking_available ? 'متوفر / Available' : 'غير متوفر / Not Available']
    ];

    utilities.forEach(([label, value]) => {
      pdf.text(label, 25, yPos);
      pdf.text(value, 120, yPos);
      yPos += 6;
    });

    return yPos + 15;
  }

  private generateMarketAnalysis(
    pdf: jsPDF,
    market: MarketAnalysis,
    options: ReportOptions,
    startY: number
  ): number {
    let yPos = startY;

    // Section header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.reportTexts.en.market_analysis, 20, yPos);
    yPos += 15;

    // Market trends
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.reportTexts.en.market_trends, 20, yPos);
    yPos += 10;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const trends = [
      [`${this.reportTexts.en.average_market_price}:`, `${market.market_trends.average_price_per_sqm.toLocaleString()} EGP/m²`],
      [`6-Month ${this.reportTexts.en.price_appreciation}:`, `${market.market_trends.price_change_6months > 0 ? '+' : ''}${market.market_trends.price_change_6months.toFixed(1)}%`],
      [`12-Month ${this.reportTexts.en.price_appreciation}:`, `${market.market_trends.price_change_12months > 0 ? '+' : ''}${market.market_trends.price_change_12months.toFixed(1)}%`],
      [`${this.reportTexts.en.market_activity}:`, market.market_trends.market_activity],
      [`${this.reportTexts.en.days_on_market}:`, `${market.market_trends.days_on_market} days`]
    ];

    trends.forEach(([label, value]) => {
      pdf.text(label, 25, yPos);
      pdf.text(value, 120, yPos);
      yPos += 7;
    });

    yPos += 10;

    // Comparable sales
    if (market.comparable_properties.length > 0) {
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(this.reportTexts.en.comparable_sales, 20, yPos);
      yPos += 10;

      // Table header
      pdf.setFontSize(9);
      pdf.text('Address', 20, yPos);
      pdf.text('Price', 90, yPos);
      pdf.text('Price/m²', 120, yPos);
      pdf.text('Area', 150, yPos);
      pdf.text('Distance', 170, yPos);
      
      pdf.line(20, yPos + 2, 190, yPos + 2);
      yPos += 8;

      // Table content
      pdf.setFont('helvetica', 'normal');
      market.comparable_properties.slice(0, 5).forEach(comp => {
        const address = comp.address.length > 25 ? comp.address.substring(0, 25) + '...' : comp.address;
        pdf.text(address, 20, yPos);
        pdf.text(`${(comp.price / 1000).toFixed(0)}K`, 90, yPos);
        pdf.text(`${comp.price_per_sqm.toLocaleString()}`, 120, yPos);
        pdf.text(`${comp.area}m²`, 150, yPos);
        pdf.text(`${comp.distance_km.toFixed(1)}km`, 170, yPos);
        yPos += 7;
      });
    }

    return yPos + 15;
  }

  private generateLegalAnalysis(
    pdf: jsPDF,
    legalStatus: any,
    options: ReportOptions,
    startY: number
  ): number {
    let yPos = startY;

    // Section header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.reportTexts.en.legal_analysis, 20, yPos);
    yPos += 15;

    // Compliance score
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${this.reportTexts.en.legal_compliance}: ${legalStatus.compliance_percentage}%`, 20, yPos);
    yPos += 10;

    // Legal details
    pdf.setFontSize(11);
    const legalDetails = [
      [`${this.reportTexts.en.ownership_status}:`, legalStatus.ownership_type || 'N/A'],
      ['Shahr 3aqary Registration:', legalStatus.shahr_3aqary_registered ? 'Yes' : 'No'],
      ['Title Deed Available:', legalStatus.title_deed_available ? 'Yes' : 'No'],
      ['Tax Registration Current:', legalStatus.tax_registration_current ? 'Yes' : 'No'],
      ['Bank Approved Developer:', legalStatus.bank_approved_developer ? 'Yes' : 'No']
    ];

    pdf.setFont('helvetica', 'normal');
    legalDetails.forEach(([label, value]) => {
      pdf.text(label, 25, yPos);
      pdf.text(value, 120, yPos);
      yPos += 7;
    });

    // Risk factors
    if (legalStatus.risk_factors && legalStatus.risk_factors.length > 0) {
      yPos += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Risk Factors:', 20, yPos);
      yPos += 8;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      legalStatus.risk_factors.forEach((risk: string) => {
        pdf.text(`• ${risk}`, 25, yPos);
        yPos += 7;
      });
    }

    return yPos + 15;
  }

  private generateMortgageAnalysis(
    pdf: jsPDF,
    mortgageData: any,
    options: ReportOptions,
    startY: number
  ): number {
    let yPos = startY;

    // Section header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(this.reportTexts.en.mortgage_analysis, 20, yPos);
    yPos += 15;

    // Eligibility status
    pdf.setFontSize(12);
    const eligibilityText = mortgageData.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE';
    pdf.setTextColor(mortgageData.eligible ? 0 : 255, mortgageData.eligible ? 128 : 0, 0);
    pdf.text(`${this.reportTexts.en.mortgage_eligibility}: ${eligibilityText}`, 20, yPos);
    pdf.setTextColor(0, 0, 0);
    yPos += 15;

    if (mortgageData.eligible) {
      // Mortgage details
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      const mortgageDetails = [
        ['Max Loan Amount:', `${mortgageData.max_loan_amount.toLocaleString()} EGP`],
        ['Best Interest Rate:', `${(mortgageData.interest_rate * 100).toFixed(2)}%`],
        ['Monthly Payment:', `${mortgageData.monthly_installment.toLocaleString()} EGP`],
        ['Down Payment Required:', `${mortgageData.down_payment_required.toLocaleString()} EGP`],
        ['Loan Duration:', `${mortgageData.recommended_duration_years} years`]
      ];

      mortgageDetails.forEach(([label, value]) => {
        pdf.text(label, 25, yPos);
        pdf.text(value, 120, yPos);
        yPos += 7;
      });

      yPos += 10;

      // Bank responses
      if (mortgageData.bank_responses && mortgageData.bank_responses.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Bank Responses:', 20, yPos);
        yPos += 10;

        pdf.setFontSize(10);
        pdf.text('Bank', 25, yPos);
        pdf.text('Status', 80, yPos);
        pdf.text('Max Loan', 110, yPos);
        pdf.text('Interest Rate', 150, yPos);
        
        pdf.line(25, yPos + 2, 185, yPos + 2);
        yPos += 8;

        pdf.setFont('helvetica', 'normal');
        mortgageData.bank_responses.forEach((bank: any) => {
          pdf.text(bank.bank_name.substring(0, 20), 25, yPos);
          pdf.text(bank.eligible ? 'Approved' : 'Declined', 80, yPos);
          if (bank.eligible) {
            pdf.text(`${(bank.max_loan_amount / 1000).toFixed(0)}K`, 110, yPos);
            pdf.text(`${(bank.interest_rate * 100).toFixed(2)}%`, 150, yPos);
          }
          yPos += 7;
        });
      }
    }

    return yPos + 15;
  }

  private generateValuationMethods(
    pdf: jsPDF,
    property: PropertyData,
    appraisal: AppraisalData,
    market: MarketAnalysis,
    options: ReportOptions,
    startY: number
  ): number {
    let yPos = startY;
    
    if (yPos > 200) {
      pdf.addPage();
      yPos = 20;
    }

    // Section header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('تحديد القيمة / Value Determination', 20, yPos);
    yPos += 15;

    const calcResults = appraisal.calculation_results || {};
    
    // Method 1: Cost Approach
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('القيمة بطريقة حساب التكلفة / Cost Approach Method', 20, yPos);
    yPos += 10;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const costDetails = [
      ['قيمة الأرض / Land Value:', `${calcResults.land_value?.toLocaleString() || 'N/A'} جنيه / EGP`],
      ['قيمة المباني / Building Value:', `${calcResults.building_value?.toLocaleString() || 'N/A'} جنيه / EGP`],
      ['تكلفة الإحلال / Replacement Cost:', `${calcResults.replacement_cost?.toLocaleString() || 'N/A'} جنيه / EGP`],
      ['قيمة الاهلاك / Depreciation Amount:', `${calcResults.depreciation_amount?.toLocaleString() || 'N/A'} جنيه / EGP`],
      ['نسبة الاهلاك / Depreciation %:', `${calcResults.depreciation_percentage || 'N/A'}%`]
    ];

    costDetails.forEach(([label, value]) => {
      pdf.text(label, 25, yPos);
      pdf.text(value, 140, yPos);
      yPos += 8;
    });

    // Cost approach result
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(25, yPos + 5, 160, 15);
    pdf.setFont('helvetica', 'bold');
    pdf.text('القيمة بطريقة التكلفة / Cost Approach Value:', 30, yPos + 15);
    pdf.text(`${appraisal.market_value_estimate.toLocaleString()} جنيه / EGP`, 160, yPos + 15, { align: 'right' });
    yPos += 30;

    // Method 2: Sales Comparison Approach
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('القيمة بطريقة المبيعات السابقة / Sales Comparison Approach', 20, yPos);
    yPos += 10;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text('تم تحليل المبيعات المماثلة في المنطقة وتطبيق عوامل التعديل', 25, yPos);
    yPos += 6;
    pdf.text('Comparable sales in the area were analyzed and adjustment factors applied', 25, yPos);
    yPos += 10;

    // Method 3: Income Capitalization (if applicable)
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('القيمة بطريقة رأسمالة الدخل / Income Capitalization Approach', 20, yPos);
    yPos += 10;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const rentalYield = market.investment_analysis?.rental_yield || 0;
    if (rentalYield > 0) {
      const estimatedRent = Math.round(appraisal.market_value_estimate * rentalYield / 100 / 12);
      pdf.text(`العائد الإيجاري المقدر / Estimated Rental Yield: ${estimatedRent.toLocaleString()} جنيه شهرياً`, 25, yPos);
    } else {
      pdf.text('غير قابل للتطبيق / Not Applicable', 25, yPos);
    }
    yPos += 15;

    return yPos;
  }

  private generateInvestmentAnalysis(
    pdf: jsPDF,
    investment: MarketAnalysis['investment_analysis'],
    property: PropertyData,
    options: ReportOptions,
    startY: number
  ): number {
    let yPos = startY;

    // Section header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('تحليل الاستثمار / Investment Analysis', 20, yPos);
    yPos += 15;

    // Investment metrics
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const investmentMetrics = [
      [`العائد الإيجاري / Rental Yield:`, `${investment.rental_yield.toFixed(2)}%`],
      ['العائد على الاستثمار 5 سنوات / 5-Year ROI:', `${investment.roi_5year.toFixed(2)}%`],
      ['العائد على الاستثمار 10 سنوات / 10-Year ROI:', `${investment.roi_10year.toFixed(2)}%`],
      ['معدل النمو / Appreciation Rate:', `${investment.appreciation_rate.toFixed(2)}% سنوياً / annually`],
      ['الطلب على الإيجار / Rental Demand:', investment.rental_demand]
    ];

    investmentMetrics.forEach(([label, value]) => {
      pdf.text(label, 25, yPos);
      pdf.text(value, 140, yPos);
      yPos += 8;
    });

    // Investment recommendation
    yPos += 10;
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('توصية الاستثمار / Investment Recommendation:', 20, yPos);
    yPos += 8;

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    
    let recommendation = '';
    if (investment.rental_yield >= 8 && investment.roi_5year >= 15) {
      recommendation = 'شراء قوي - فرصة استثمارية ممتازة / STRONG BUY - Excellent investment opportunity with high rental yield and strong ROI projections.';
    } else if (investment.rental_yield >= 6 && investment.roi_5year >= 10) {
      recommendation = 'شراء - فرصة استثمارية جيدة / BUY - Good investment opportunity with reasonable returns and rental potential.';
    } else if (investment.rental_yield >= 4 && investment.roi_5year >= 5) {
      recommendation = 'اعتبار - إمكانية استثمارية متوسطة / HOLD/CONSIDER - Moderate investment potential, suitable for conservative investors.';
    } else {
      recommendation = 'تجنب - عوائد استثمارية منخفضة / AVOID - Low investment returns and limited rental potential in current market conditions.';
    }

    const recLines = pdf.splitTextToSize(recommendation, 160);
    pdf.text(recLines, 25, yPos);
    yPos += recLines.length * 6;

    return yPos + 15;
  }

  private generateAppraiserCertification(
    pdf: jsPDF,
    appraisal: AppraisalData,
    options: ReportOptions,
    startY: number
  ): number {
    let yPos = startY;

    // Section header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('شهادة الخبير / Expert Certification', 20, yPos);
    yPos += 15;

    // Certification text
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const certificationText = `أشهد أنا خبير التقييم بأن:

1. تم إعداد هذا التقرير طبقاً للمعايير المصرية للتقييم العقاري
2. قمت بفحص العقار شخصياً من الداخل والخارج
3. قمت بدراسة سوق العقارات بالمنطقة واخترت عينة من العقارات المماثلة
4. طبقت طرق التقييم المعتمدة مهنياً
5. ليس لدي أي مصلحة شخصية في هذا العقار`;
    
    const certLines = pdf.splitTextToSize(certificationText, 170);
    pdf.text(certLines, 20, yPos);
    yPos += certLines.length * 6 + 20;

    // Signature section
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(20, yPos, 170, 60);
    
    // Left side - Arabic
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('الاسم: ' + appraisal.appraiser_name, 25, yPos + 15);
    pdf.text('رقم القيد: ' + appraisal.appraiser_license, 25, yPos + 25);
    pdf.text('التوقيع:', 25, yPos + 40);
    pdf.line(65, yPos + 45, 130, yPos + 45);
    pdf.text('ختم خبير التقييم', 25, yPos + 55);
    
    // Right side - English
    pdf.text('Name: ' + appraisal.appraiser_name, 100, yPos + 15);
    pdf.text('License: ' + appraisal.appraiser_license, 100, yPos + 25);
    pdf.text('Signature:', 100, yPos + 40);
    pdf.text('Expert Seal', 100, yPos + 55);
    
    return yPos + 70;
  }



  // Method to get text in specified language
  private getText(key: string, language: 'en' | 'ar' = 'en'): string {
    return this.reportTexts[language][key] || key;
  }

  // Helper method to format numbers based on language
  private formatNumber(num: number, language: 'en' | 'ar' = 'en', useSpaceSeparator: boolean = false): string {
    if (useSpaceSeparator) {
      // Use space as thousands separator for better readability
      return num.toLocaleString('en-US').replace(/,/g, ' ');
    }
    
    if (language === 'ar') {
      // Arabic number formatting with better thousand separators
      return num.toLocaleString('ar-EG').replace(/,/g, '٬');
    }
    return num.toLocaleString('en-US');
  }

  // Helper method to format currency
  private formatCurrency(amount: number, language: 'en' | 'ar' = 'en'): string {
    const formattedAmount = this.formatNumber(amount, language);
    const currency = language === 'ar' ? this.reportTexts.ar.egp : this.reportTexts.en.egp;
    return `${formattedAmount} ${currency}`;
  }

  // Smaller, manageable sections for better page breaks
  private generateBasicInfoSection(property: PropertyData, appraisal: AppraisalData): string {
    const formData = appraisal.form_data || {};
    
    return `
      <div style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin: 12px 0;">
        <h2 style="font-size: 18px; font-weight: 700; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          المعلومات الأساسية / Basic Information
        </h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="padding: 12px; background: white; border-radius: 4px;">
            <span style="font-weight: 700; color: #2d3748;">نوع العقار:</span> ${property.property_type}
          </div>
          <div style="padding: 12px; background: white; border-radius: 4px;">
            <span style="font-weight: 700; color: #2d3748;">العنوان:</span> ${property.address}
          </div>
          <div style="padding: 12px; background: white; border-radius: 4px;">
            <span style="font-weight: 700; color: #2d3748;">المحافظة:</span> ${formData.governorate || property.city}
          </div>
          <div style="padding: 12px; background: white; border-radius: 4px;">
            <span style="font-weight: 700; color: #2d3748;">المدينة:</span> ${formData.city_name || property.city}
          </div>
          <div style="padding: 12px; background: white; border-radius: 4px;">
            <span style="font-weight: 700; color: #2d3748;">الحي:</span> ${formData.district_name || property.district}
          </div>
          <div style="padding: 12px; background: white; border-radius: 4px;">
            <span style="font-weight: 700; color: #2d3748;">اسم العميل:</span> ${appraisal.client_name}
          </div>
        </div>
      </div>
    `;
  }

  private generateAreaDetailsSection(property: PropertyData, appraisal: AppraisalData): string {
    const formData = appraisal.form_data || {};
    
    return `
      <div style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin: 12px 0;">
        <h2 style="font-size: 18px; font-weight: 700; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          تفاصيل المساحات / Area Details
        </h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
          <div style="padding: 12px; background: white; border-radius: 4px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">مساحة الأرض</div>
            <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${formData.land_area_sqm || 'N/A'}</div>
            <div style="font-size: 12px; color: #666;">متر مربع</div>
          </div>
          <div style="padding: 12px; background: white; border-radius: 4px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">المساحة المبنية</div>
            <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${formData.built_area_sqm ? this.formatNumber(formData.built_area_sqm, 'ar') : 'N/A'}</div>
            <div style="font-size: 12px; color: #666;">متر مربع</div>
          </div>
          <div style="padding: 12px; background: white; border-radius: 4px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">مساحة الوحدة</div>
            <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${this.formatNumber(formData.unit_area_sqm || property.area, 'ar')}</div>
            <div style="font-size: 12px; color: #666;">متر مربع</div>
          </div>
          
          ${formData.total_building_area_sqm ? `
          <div style="padding: 12px; background: white; border-radius: 4px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">إجمالي مساحة المبنى</div>
            <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${this.formatNumber(formData.total_building_area_sqm, 'ar')}</div>
            <div style="font-size: 12px; color: #666;">متر مربع</div>
          </div>` : ''}
          
          ${formData.unit_land_share_sqm ? `
          <div style="padding: 12px; background: white; border-radius: 4px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">حصة الوحدة من الأرض</div>
            <div style="font-size: 20px; font-weight: 700; color: #3b82f6;">${formData.unit_land_share_sqm}</div>
            <div style="font-size: 12px; color: #666;">متر مربع</div>
          </div>` : ''}
        </div>
      </div>
    `;
  }

  private generateBuildingDetailsSection(property: PropertyData, appraisal: AppraisalData): string {
    const formData = appraisal.form_data || {};
    
    return `
      <div style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin: 12px 0;">
        <h2 style="font-size: 18px; font-weight: 700; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          تفاصيل المبنى / Building Details
        </h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div style="padding: 12px; background: white; border-radius: 4px;">
            <span style="font-weight: 700; color: #2d3748;">عمر المبنى:</span> ${formData.building_age_years || 'N/A'} سنة
          </div>
          <div style="padding: 12px; background: white; border-radius: 4px;">
            <span style="font-weight: 700; color: #2d3748;">العمر الاقتصادي:</span> ${formData.economic_life_years || 60} سنة
          </div>
          
          ${formData.effective_building_age_years ? `
          <div style="padding: 12px; background: white; border-radius: 4px;">
            <span style="font-weight: 700; color: #2d3748;">العمر الفعلي:</span> ${formData.effective_building_age_years} سنة
          </div>` : ''}
          
          ${formData.remaining_building_life_years ? `
          <div style="padding: 12px; background: white; border-radius: 4px;">
            <span style="font-weight: 700; color: #2d3748;">العمر المتبقي:</span> ${formData.remaining_building_life_years} سنة
          </div>` : ''}
          
          <div style="padding: 12px; background: white; border-radius: 4px;">
            <span style="font-weight: 700; color: #2d3748;">نوع الإنشاء:</span> ${formData.construction_type || 'خرسانة مسلحة'}
          </div>
          <div style="padding: 12px; background: white; border-radius: 4px;">
            <span style="font-weight: 700; color: #2d3748;">مستوى التشطيب:</span> ${formData.finishing_level || 'غير محدد'}
          </div>
        </div>
      </div>
    `;
  }

  private generateUtilitiesSection(property: PropertyData, appraisal: AppraisalData): string {
    const formData = appraisal.form_data || {};
    
    return `
      <div style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin: 12px 0;">
        <h2 style="font-size: 18px; font-weight: 700; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          المرافق والخدمات / Utilities & Services
        </h2>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px;">
          <div style="padding: 12px; background: ${formData.electricity_available ? '#dcfce7' : '#fef2f2'}; border-radius: 4px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">الكهرباء / Electricity</div>
            <div style="color: ${formData.electricity_available ? '#166534' : '#dc2626'}; font-weight: 600;">
              ${formData.electricity_available ? '✓ متوفر' : '✗ غير متوفر'}
            </div>
          </div>
          <div style="padding: 12px; background: ${formData.water_supply_available ? '#dcfce7' : '#fef2f2'}; border-radius: 4px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">المياه / Water</div>
            <div style="color: ${formData.water_supply_available ? '#166534' : '#dc2626'}; font-weight: 600;">
              ${formData.water_supply_available ? '✓ متوفر' : '✗ غير متوفر'}
            </div>
          </div>
          <div style="padding: 12px; background: ${formData.gas_supply_available ? '#dcfce7' : '#fef2f2'}; border-radius: 4px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">الغاز / Gas</div>
            <div style="color: ${formData.gas_supply_available ? '#166534' : '#dc2626'}; font-weight: 600;">
              ${formData.gas_supply_available ? '✓ متوفر' : '✗ غير متوفر'}
            </div>
          </div>
          <div style="padding: 12px; background: ${formData.internet_fiber_available ? '#dcfce7' : '#fef2f2'}; border-radius: 4px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">الإنترنت / Internet</div>
            <div style="color: ${formData.internet_fiber_available ? '#166534' : '#dc2626'}; font-weight: 600;">
              ${formData.internet_fiber_available ? '✓ متوفر' : '✗ غير متوفر'}
            </div>
          </div>
          <div style="padding: 12px; background: ${formData.elevator_available ? '#dcfce7' : '#fef2f2'}; border-radius: 4px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">المصعد / Elevator</div>
            <div style="color: ${formData.elevator_available ? '#166534' : '#dc2626'}; font-weight: 600;">
              ${formData.elevator_available ? '✓ متوفر' : '✗ غير متوفر'}
            </div>
          </div>
          <div style="padding: 12px; background: ${formData.telephone_available ? '#dcfce7' : '#fef2f2'}; border-radius: 4px; text-align: center;">
            <div style="font-weight: 700; color: #2d3748;">الهاتف الأرضي / Telephone</div>
            <div style="color: ${formData.telephone_available ? '#166534' : '#dc2626'}; font-weight: 600;">
              ${formData.telephone_available ? '✓ متوفر' : '✗ غير متوفر'}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private async generateQualityRatingSection(property: PropertyData, appraisal: AppraisalData): Promise<string> {
    const formData = appraisal.form_data || {};
    
    // Calculate overall quality rating based on various factors
    const buildingCondition = this.getConditionScore(formData.overall_condition_rating);
    const locationScore = this.getLocationScore(formData.location_rating);
    const amenitiesScore = this.getAmenitiesScore(formData.amenities_rating);
    
    const overallScore = Math.round((buildingCondition + locationScore + amenitiesScore) / 3);
    const overallGrade = this.getQualityGrade(overallScore);
    
    // Generate radar chart
    const radarChartImage = await this.generateRadarChart(buildingCondition, locationScore, amenitiesScore);
    
    return `
      <div style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; padding: 15px; border: 1px solid #e2e8f0; border-radius: 12px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); margin: 12px 0; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <h2 style="font-size: 20px; font-weight: 700; color: #1e40af; margin-bottom: 20px; border-bottom: 3px solid #3b82f6; padding-bottom: 10px; text-align: center;">
          تقييم الجودة الشامل / Comprehensive Quality Rating
        </h2>
        
        <!-- Overall Rating -->
        <div style="text-align: center; padding: 15px; background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%); border-radius: 15px; margin-bottom: 25px; border: 2px solid #e2e8f0; box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);">
          <div style="font-size: 52px; font-weight: 800; color: ${overallScore >= 80 ? '#059669' : overallScore >= 60 ? '#d97706' : '#dc2626'}; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            ${overallScore}/100
          </div>
          <div style="font-size: 22px; font-weight: 600; color: ${overallScore >= 80 ? '#059669' : overallScore >= 60 ? '#d97706' : '#dc2626'}; margin: 15px 0; text-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            تقدير ${overallGrade.ar} / Grade ${overallGrade.en}
          </div>
          <div style="width: 80px; height: 4px; background: ${overallScore >= 80 ? '#10b981' : overallScore >= 60 ? '#f59e0b' : '#ef4444'}; margin: 15px auto; border-radius: 2px;"></div>
        </div>
        
        <!-- Detailed Ratings -->
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 25px;">
          <div style="padding: 20px; background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%); border-radius: 12px; text-align: center; border: 1px solid #e0f2fe; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="font-weight: 700; color: #2d3748; margin-bottom: 12px; font-size: 16px;">حالة المبنى</div>
            <div style="font-size: 28px; font-weight: 800; color: ${buildingCondition >= 80 ? '#059669' : buildingCondition >= 60 ? '#d97706' : '#dc2626'}; margin: 10px 0;">
              ${buildingCondition}/100
            </div>
            <div style="font-size: 12px; color: #64748b; font-weight: 500;">Building Condition</div>
            <div style="width: 50%; height: 3px; background: ${buildingCondition >= 80 ? '#10b981' : buildingCondition >= 60 ? '#f59e0b' : '#ef4444'}; margin: 8px auto; border-radius: 2px;"></div>
          </div>
          
          <div style="padding: 20px; background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%); border-radius: 12px; text-align: center; border: 1px solid #dcfce7; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="font-weight: 700; color: #2d3748; margin-bottom: 12px; font-size: 16px;">الموقع</div>
            <div style="font-size: 28px; font-weight: 800; color: ${locationScore >= 80 ? '#059669' : locationScore >= 60 ? '#d97706' : '#dc2626'}; margin: 10px 0;">
              ${locationScore}/100
            </div>
            <div style="font-size: 12px; color: #64748b; font-weight: 500;">Location</div>
            <div style="width: 50%; height: 3px; background: ${locationScore >= 80 ? '#10b981' : locationScore >= 60 ? '#f59e0b' : '#ef4444'}; margin: 8px auto; border-radius: 2px;"></div>
          </div>
          
          <div style="padding: 20px; background: linear-gradient(135deg, #ffffff 0%, #fefbf2 100%); border-radius: 12px; text-align: center; border: 1px solid #fed7aa; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <div style="font-weight: 700; color: #2d3748; margin-bottom: 12px; font-size: 16px;">المرافق</div>
            <div style="font-size: 28px; font-weight: 800; color: ${amenitiesScore >= 80 ? '#059669' : amenitiesScore >= 60 ? '#d97706' : '#dc2626'}; margin: 10px 0;">
              ${amenitiesScore}/100
            </div>
            <div style="font-size: 12px; color: #64748b; font-weight: 500;">Amenities</div>
            <div style="width: 50%; height: 3px; background: ${amenitiesScore >= 80 ? '#10b981' : amenitiesScore >= 60 ? '#f59e0b' : '#ef4444'}; margin: 8px auto; border-radius: 2px;"></div>
          </div>
        </div>
        
        <!-- Radar Chart Visualization -->
        ${radarChartImage ? `
        <div style="margin: 15px 0; padding: 12px; background: white; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h3 style="font-size: 16px; font-weight: 600; color: #3b82f6; margin-bottom: 10px; text-align: center;">مخطط الجودة الشامل / Quality Overview Chart</h3>
          <div style="text-align: center; margin: 10px 0;">
            <img src="${radarChartImage}" alt="Quality Ratings Chart" style="max-width: 250px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
          </div>
          <div style="text-align: center; font-size: 11px; color: #64748b; margin-top: 8px;">
            مخطط يوضح تقييمات الجودة الثلاثة الرئيسية للعقار على مقياس من 0 إلى 100
          </div>
          <div style="text-align: center; font-size: 10px; color: #64748b; direction: ltr; margin-top: 3px;">
            Chart showing the three main quality ratings for the property on a scale from 0 to 100
          </div>
        </div>
        ` : ''}
        
        <!-- Quality Factors -->
        <div style="margin: 12px 0;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 15px;">عوامل الجودة التفصيلية / Detailed Quality Factors</h3>
          
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <div style="padding: 10px; background: white; border-radius: 3px;">
              <span style="font-weight: 600;">التشطيبات / Finishes:</span>
              <span style="color: #3b82f6; font-weight: 600;">${formData.finishing_level || 'متوسط'}</span>
            </div>
            
            <div style="padding: 10px; background: white; border-radius: 3px;">
              <span style="font-weight: 600;">نوع البناء / Construction:</span>
              <span style="color: #3b82f6; font-weight: 600;">${formData.construction_type || 'خرسانة'}</span>
            </div>
            
            <div style="padding: 10px; background: white; border-radius: 3px;">
              <span style="font-weight: 600;">عمر المبنى / Age:</span>
              <span style="color: #3b82f6; font-weight: 600;">${formData.building_age || property.building_age || 'غير محدد'} سنة</span>
            </div>
            
            <div style="padding: 10px; background: white; border-radius: 3px;">
              <span style="font-weight: 600;">الحالة العامة / Overall Condition:</span>
              <span style="color: #3b82f6; font-weight: 600;">${formData.overall_condition_rating || 'جيدة'}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private generateEnvironmentalFactorsSection(property: PropertyData, appraisal: AppraisalData): string {
    const formData = appraisal.form_data || {};
    
    return `
      <div style="font-family: 'Noto Sans Arabic', Arial, sans-serif; direction: rtl; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h2 style="font-size: 20px; font-weight: 700; color: #3b82f6; margin-bottom: 15px; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">
          العوامل البيئية والمحيطة / Environmental & Surrounding Factors
        </h2>
        
        <!-- Environmental Assessment -->
        <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 15px;">التقييم البيئي / Environmental Assessment</h3>
          
          <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
            <div style="margin: 8px 0; padding: 12px; background: ${formData.noise_level_acceptable ? '#e8f5e8' : '#fee8e8'}; border-radius: 5px; min-width: 30%;">
              <span style="font-weight: 600;">مستوى الضوضاء:</span>
              <span style="color: ${formData.noise_level_acceptable ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
                ${formData.noise_level_acceptable ? 'مقبول ✓' : 'مرتفع ✗'}
              </span>
            </div>
            
            <div style="margin: 8px 0; padding: 12px; background: ${formData.air_quality_good ? '#e8f5e8' : '#fee8e8'}; border-radius: 5px; min-width: 30%;">
              <span style="font-weight: 600;">جودة الهواء:</span>
              <span style="color: ${formData.air_quality_good ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
                ${formData.air_quality_good ? 'جيدة ✓' : 'ضعيفة ✗'}
              </span>
            </div>
            
            <div style="margin: 8px 0; padding: 12px; background: ${formData.green_spaces_nearby ? '#e8f5e8' : '#fee8e8'}; border-radius: 5px; min-width: 30%;">
              <span style="font-weight: 600;">المساحات الخضراء:</span>
              <span style="color: ${formData.green_spaces_nearby ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
                ${formData.green_spaces_nearby ? 'متوفرة ✓' : 'غير متوفرة ✗'}
              </span>
            </div>
            
            <div style="margin: 8px 0; padding: 12px; background: ${formData.flood_risk_low ? '#e8f5e8' : '#fee8e8'}; border-radius: 5px; min-width: 30%;">
              <span style="font-weight: 600;">مخاطر الفيضانات:</span>
              <span style="color: ${formData.flood_risk_low ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
                ${formData.flood_risk_low ? 'منخفضة ✓' : 'مرتفعة ✗'}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Infrastructure Assessment -->
        <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 15px;">تقييم البنية التحتية / Infrastructure Assessment</h3>
          
          <div style="display: flex; flex-wrap: wrap; gap: 15px;">
            <div style="margin: 8px 0; padding: 12px; background: ${formData.road_conditions_good ? '#e8f5e8' : '#fee8e8'}; border-radius: 5px; min-width: 30%;">
              <span style="font-weight: 600;">حالة الطرق:</span>
              <span style="color: ${formData.road_conditions_good ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
                ${formData.road_conditions_good ? 'جيدة ✓' : 'سيئة ✗'}
              </span>
            </div>
            
            <div style="margin: 8px 0; padding: 12px; background: ${formData.internet_coverage_good ? '#e8f5e8' : '#fee8e8'}; border-radius: 5px; min-width: 30%;">
              <span style="font-weight: 600;">تغطية الإنترنت:</span>
              <span style="color: ${formData.internet_coverage_good ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
                ${formData.internet_coverage_good ? 'جيدة ✓' : 'ضعيفة ✗'}
              </span>
            </div>
            
            <div style="margin: 8px 0; padding: 12px; background: ${formData.street_lighting_adequate ? '#e8f5e8' : '#fee8e8'}; border-radius: 5px; min-width: 30%;">
              <span style="font-weight: 600;">إضاءة الشوارع:</span>
              <span style="color: ${formData.street_lighting_adequate ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
                ${formData.street_lighting_adequate ? 'كافية ✓' : 'غير كافية ✗'}
              </span>
            </div>
            
            <div style="margin: 8px 0; padding: 12px; background: ${formData.waste_management_good ? '#e8f5e8' : '#fee8e8'}; border-radius: 5px; min-width: 30%;">
              <span style="font-weight: 600;">إدارة النفايات:</span>
              <span style="color: ${formData.waste_management_good ? '#3b82f6' : '#dc2626'}; font-weight: 600;">
                ${formData.waste_management_good ? 'جيدة ✓' : 'ضعيفة ✗'}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Location Advantages - Keep Together -->
        <div class="large-section" style="margin: 15px 0; padding: 15px; background: #eff6ff; border-radius: 8px;">
          <h3 style="font-size: 18px; font-weight: 600; color: #3b82f6; margin-bottom: 15px;">مميزات الموقع / Location Advantages</h3>
          
          <!-- NEW LOCATION FIELDS -->
          ${formData.location_description ? `
          <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px;">
            <span style="font-weight: 600;">وصف الموقع:</span> ${formData.location_description}
          </div>` : ''}
          
          ${formData.area_character ? `
          <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px;">
            <span style="font-weight: 600;">طبيعة المنطقة:</span> ${formData.area_character}
          </div>` : ''}
          
          ${formData.nearby_services ? `
          <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px;">
            <span style="font-weight: 600;">الخدمات القريبة:</span> ${formData.nearby_services}
          </div>` : ''}
          
          ${formData.construction_volume ? `
          <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px;">
            <span style="font-weight: 600;">حجم الإنشاء:</span> ${formData.construction_volume} متر مكعب
          </div>` : ''}
          
          ${formData.funding_source ? `
          <div style="margin-bottom: 15px; padding: 15px; background: white; border-radius: 8px;">
            <span style="font-weight: 600;">مصدر التمويل:</span> ${formData.funding_source}
          </div>` : ''}
          
          <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px;">
            <span style="font-weight: 700; color: #2d3748;">المسافة من وسط المدينة:</span>
            <span style="color: #4a5568; margin-right: 10px;">${formData.distance_to_city_center || 'غير محدد'} كم</span>
          </div>
          
          <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px;">
            <span style="font-weight: 700; color: #2d3748;">أقرب محطة مترو:</span>
            <span style="color: #4a5568; margin-right: 10px;">${formData.nearest_metro_distance || 'غير متوفر'}</span>
          </div>
          
          <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px;">
            <span style="font-weight: 700; color: #2d3748;">المطار الأقرب:</span>
            <span style="color: #4a5568; margin-right: 10px;">${formData.nearest_airport || 'غير محدد'}</span>
          </div>
          
          <div style="margin: 15px 0; padding: 15px; background: white; border-radius: 8px;">
            <span style="font-weight: 700; color: #2d3748;">مستوى الأمان:</span>
            <span style="color: #4a5568; margin-right: 10px;">${formData.security_level || 'متوسط'}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Helper methods for quality rating calculations
  private getConditionScore(rating: string): number {
    const scores: Record<string, number> = {
      'ممتاز': 95, 'excellent': 95,
      'جيد جداً': 85, 'very_good': 85,
      'جيد': 75, 'good': 75,
      'مقبول': 60, 'acceptable': 60,
      'ضعيف': 40, 'poor': 40
    };
    return scores[rating] || 75;
  }

  private getLocationScore(rating: string): number {
    const scores: Record<string, number> = {
      'ممتاز': 90, 'excellent': 90,
      'جيد جداً': 80, 'very_good': 80,
      'جيد': 70, 'good': 70,
      'متوسط': 60, 'average': 60,
      'ضعيف': 40, 'poor': 40
    };
    return scores[rating] || 70;
  }

  private getAmenitiesScore(rating: string): number {
    const scores: Record<string, number> = {
      'متكامل': 85, 'complete': 85,
      'جيد': 70, 'good': 70,
      'متوسط': 55, 'average': 55,
      'أساسي': 40, 'basic': 40,
      'محدود': 25, 'limited': 25
    };
    return scores[rating] || 55;
  }

  private getQualityGrade(score: number): { ar: string, en: string } {
    if (score >= 90) return { ar: 'ممتاز', en: 'Excellent' };
    if (score >= 80) return { ar: 'جيد جداً', en: 'Very Good' };
    if (score >= 70) return { ar: 'جيد', en: 'Good' };
    if (score >= 60) return { ar: 'مقبول', en: 'Acceptable' };
    return { ar: 'يحتاج تحسين', en: 'Needs Improvement' };
  }

  private standardizeNumbers(text: string): string {
    // Convert Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩) to Western numerals (0123456789)
    const arabicDigits = '٠١٢٣٤٥٦٧٨٩';
    const westernDigits = '0123456789';
    
    let standardizedText = text;
    
    for (let i = 0; i < arabicDigits.length; i++) {
      standardizedText = standardizedText.replace(new RegExp(arabicDigits[i], 'g'), westernDigits[i]);
    }
    
    // Improve thousand separators visibility
    // Use space as thousand separator for better readability and less compression artifacts
    standardizedText = standardizedText.replace(/(\d{1,3}),(\d{3})/g, '$1 $2');
    
    // Also handle multiple groups of thousands
    standardizedText = standardizedText.replace(/(\d{1,3})\s(\d{3})\s(\d{3})/g, '$1 $2 $3');
    standardizedText = standardizedText.replace(/(\d{1,3})\s(\d{3})\s(\d{3})\s(\d{3})/g, '$1 $2 $3 $4');
    
    return standardizedText;
  }
  

  private async estimateSectionHeight(htmlContent: string): Promise<number> {
    // Create a temporary div to measure content height
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '794px'; // A4 width in pixels
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.fontFamily = "'Noto Sans Arabic', Arial, sans-serif";
    tempDiv.innerHTML = htmlContent;
    
    document.body.appendChild(tempDiv);
    
    try {
      // Wait for fonts and layout
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const height = tempDiv.scrollHeight;
      console.log(`📏 Estimated height for section: ${height}px`);
      return height;
    } finally {
      document.body.removeChild(tempDiv);
    }
  }

  private async renderTallSectionInChunks(
    section: any,
    pdf: jsPDF,
    currentY: number,
    maxContentHeight: number
  ): Promise<{ finalY: number }> {
    console.log(`📄 Rendering tall section ${section.name} in chunks to prevent compression`);
    
    // Create a temporary container
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '794px'; // A4 width in pixels
    tempDiv.style.fontFamily = "'Noto Sans Arabic', Arial, sans-serif";
    tempDiv.innerHTML = section.content;
    
    document.body.appendChild(tempDiv);
    
    try {
      // Wait for content to render
      await document.fonts.ready;
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const totalHeight = tempDiv.scrollHeight;
      console.log(`📏 Total section height: ${totalHeight}px`);
      
      // Break into chunks of manageable size (max 800px per chunk for better page utilization)
      const maxChunkHeight = 800;
      const chunks = Math.ceil(totalHeight / maxChunkHeight);
      
      let finalY = currentY;
      
      for (let chunkIndex = 0; chunkIndex < chunks; chunkIndex++) {
        const startY = chunkIndex * maxChunkHeight;
        const endY = Math.min((chunkIndex + 1) * maxChunkHeight, totalHeight);
        const chunkHeight = endY - startY;
        
        console.log(`📄 Rendering chunk ${chunkIndex + 1}/${chunks}: ${startY}px to ${endY}px`);
        
        // Create a wrapper div that clips the content to this chunk
        const chunkDiv = document.createElement('div');
        chunkDiv.style.position = 'absolute';
        chunkDiv.style.left = '-9999px';
        chunkDiv.style.top = '0';
        chunkDiv.style.width = '794px';
        chunkDiv.style.height = `${chunkHeight}px`;
        chunkDiv.style.overflow = 'hidden';
        chunkDiv.style.fontFamily = "'Noto Sans Arabic', Arial, sans-serif";
        
        // Clone and position the content
        const contentClone = tempDiv.cloneNode(true) as HTMLElement;
        contentClone.style.position = 'relative';
        contentClone.style.top = `-${startY}px`;
        contentClone.style.left = '0';
        
        chunkDiv.appendChild(contentClone);
        document.body.appendChild(chunkDiv);
        
        try {
          // Make visible for rendering
          chunkDiv.style.left = '0';
          chunkDiv.style.visibility = 'visible';
          
          // Render this chunk with optimal settings for text clarity
          const canvas = await html2canvas(chunkDiv, {
            scale: 2, // Higher scale for better text quality
            useCORS: true,
            allowTaint: true,
            backgroundColor: '#ffffff',
            foreignObjectRendering: false,
            logging: false,
            width: 794,
            height: chunkHeight,
            scrollX: 0,
            scrollY: 0,
            removeContainer: false,
            // Prevent text aliasing issues
            ignoreElements: (element) => {
              // Skip problematic elements that might cause rendering issues
              return element.tagName === 'SCRIPT' || element.tagName === 'STYLE';
            }
          });
          
          // Use JPEG with high quality for better compression while preserving text clarity
          const imgData = canvas.toDataURL('image/jpeg', 0.95); // High quality JPEG
          const imgWidth = 210; // A4 width in mm
          const imgHeight = (chunkHeight * imgWidth) / 794; // Convert to mm
          
          console.log(`📏 Chunk ${chunkIndex + 1} canvas: ${canvas.width}x${canvas.height}px -> ${imgWidth}x${imgHeight}mm`);
          
          // Check if we need a new page for this chunk (more aggressive page utilization)
          if (finalY + imgHeight > maxContentHeight) { // Conservative approach to prevent cutoffs
            console.log(`📄 Starting new page for chunk ${chunkIndex + 1}`);
            pdf.addPage();
            finalY = 10; // Add top padding for new pages
          }
          
          // Add chunk to PDF with optimized quality
          pdf.addImage(imgData, 'JPEG', 0, finalY, imgWidth, imgHeight, undefined, 'FAST');
          finalY += imgHeight + 1; // Minimal spacing between chunks
          
        } finally {
          document.body.removeChild(chunkDiv);
        }
      }
      
      return { finalY };
      
    } finally {
      document.body.removeChild(tempDiv);
    }
  }

  /**
   * Generate privacy notice section for filtered reports
   */
  private generatePrivacyNoticeSection(appraisal: any, reportType: string): string {
    const reportTypeDisplay = reportType.charAt(0).toUpperCase() + reportType.slice(1);
    
    return `
      <div class="privacy-notice-section" style="margin-top: 30px; padding: 20px; border: 2px solid #f59e0b; background-color: #fef3c7; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #92400e; margin: 0; font-size: 24px;">🔒 إشعار الخصوصية / Privacy Notice</h2>
        </div>
        
        <div style="display: flex; justify-content: space-between; gap: 30px;">
          <!-- Arabic Section -->
          <div style="flex: 1; text-align: right; direction: rtl;">
            <h3 style="color: #92400e; margin-bottom: 15px;">نوع التقرير: ${reportTypeDisplay === 'Standard' ? 'أساسي' : reportTypeDisplay === 'Detailed' ? 'مفصل' : 'شامل'}</h3>
            <p style="line-height: 1.8; margin-bottom: 15px;">
              هذا تقرير <strong>${reportTypeDisplay === 'Standard' ? 'أساسي' : reportTypeDisplay === 'Detailed' ? 'مفصل' : 'شامل'}</strong> 
              تم إعداده مع حماية الخصوصية المناسبة. بعض المعلومات قد تكون محمية أو مستبعدة بناءً على نوع التقرير المحدد.
            </p>
            ${appraisal.privacy_notice ? `<p style="background-color: #fbbf24; padding: 10px; border-radius: 4px; margin: 10px 0;">${appraisal.privacy_notice}</p>` : ''}
            ${appraisal.filtered_fields && appraisal.filtered_fields.length > 0 ? `
              <p style="margin-top: 15px;"><strong>الحقول المحمية:</strong> ${appraisal.filtered_fields.length} حقل محمي لضمان الخصوصية</p>
            ` : ''}
          </div>
          
          <!-- English Section -->
          <div style="flex: 1; text-align: left;">
            <h3 style="color: #92400e; margin-bottom: 15px;">Report Type: ${reportTypeDisplay}</h3>
            <p style="line-height: 1.8; margin-bottom: 15px;">
              This <strong>${reportTypeDisplay}</strong> report has been generated with appropriate privacy filtering. 
              Some information may be protected or excluded based on the report type selected.
            </p>
            ${appraisal.privacy_notice ? `<p style="background-color: #fbbf24; padding: 10px; border-radius: 4px; margin: 10px 0;">${appraisal.privacy_notice}</p>` : ''}
            ${appraisal.filtered_fields && appraisal.filtered_fields.length > 0 ? `
              <p style="margin-top: 15px;"><strong>Protected Fields:</strong> ${appraisal.filtered_fields.length} fields protected for privacy</p>
            ` : ''}
          </div>
        </div>
        
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #d97706; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>🛡️ للحصول على تقرير شامل، يرجى ترقية نوع التقرير / For comprehensive details, please upgrade report type</strong>
          </p>
        </div>
      </div>
    `;
  }

}