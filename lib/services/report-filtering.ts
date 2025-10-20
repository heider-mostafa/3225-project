// Report Data Filtering Service
// Handles privacy-level filtering for different report types

export interface ReportDataFilter {
  includePersonalInfo: boolean;      // Client names, contact details
  includeFinancialDetails: boolean;  // Exact pricing, loan details
  includeAppraiserInfo: boolean;     // Full appraiser credentials
  includeMethodologies: boolean;     // Detailed calculation methods
  includeComparables: boolean;       // Market comparison data
  includeInvestmentProjections: boolean; // ROI calculations
  includeImages: boolean;            // Property images
  maxImages: number;                 // Maximum number of images to include
}

export type ReportType = 'standard' | 'detailed' | 'comprehensive';
export type PrivacyLevel = 'high' | 'medium' | 'low';

// Privacy filter configurations for each report type
export const REPORT_FILTERS: Record<ReportType, ReportDataFilter> = {
  standard: {
    includePersonalInfo: false,
    includeFinancialDetails: false,
    includeAppraiserInfo: false,
    includeMethodologies: false,
    includeComparables: true,
    includeInvestmentProjections: false,
    includeImages: true,
    maxImages: 3  // Primary images only
  },
  detailed: {
    includePersonalInfo: false,
    includeFinancialDetails: true,
    includeAppraiserInfo: true,
    includeMethodologies: false,
    includeComparables: true,
    includeInvestmentProjections: true,
    includeImages: true,
    maxImages: 6  // Primary + key document images
  },
  comprehensive: {
    includePersonalInfo: true,
    includeFinancialDetails: true,
    includeAppraiserInfo: true,
    includeMethodologies: true,
    includeComparables: true,
    includeInvestmentProjections: true,
    includeImages: true,
    maxImages: 15  // All available images (performance limit)
  }
};

// Raw appraisal data interface
export interface RawAppraisalData {
  id: string;
  appraisal_reference_number: string;
  client_name?: string;
  client_contact?: string;
  client_requirements?: string;
  appraiser_id: string;
  appraiser_name?: string;
  appraiser_email?: string;
  appraiser_phone?: string;
  appraiser_license?: string;
  appraiser_credentials?: string;
  property_type: string;
  property_address: string;
  area: string;
  market_value_estimate: number;
  detailed_pricing?: {
    land_value?: number;
    building_value?: number;
    improvement_value?: number;
    depreciation?: number;
  };
  valuation_method?: string;
  calculation_details?: any;
  comparable_properties?: Array<{
    address: string;
    price: number;
    size: number;
    date_sold: string;
    distance: string;
    adjustments?: any;
  }>;
  investment_analysis?: {
    rental_yield?: number;
    roi_projections?: any;
    market_trends?: any;
    appreciation_forecast?: any;
  };
  appraisal_date: string;
  inspection_date?: string;
  report_date: string;
  status: string;
  form_data?: any;
  internal_notes?: string;
  created_at: string;
  updated_at: string;
}

// Filtered appraisal data interface
export interface FilteredAppraisalData {
  id: string;
  appraisal_reference_number: string;
  client_name?: string;
  client_contact?: string;
  client_requirements?: string;
  appraiser_name?: string;
  appraiser_email?: string;
  appraiser_phone?: string;
  appraiser_license?: string;
  appraiser_credentials?: string;
  property_type: string;
  property_address: string;
  area: string;
  market_value_estimate: number;
  detailed_pricing?: any;
  valuation_method?: string;
  calculation_details?: any;
  comparable_properties?: any[];
  investment_analysis?: any;
  appraisal_date: string;
  inspection_date?: string;
  report_date: string;
  status: string;
  privacy_notice?: string;
  filtered_fields?: string[];
}

// Property image interface
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

export class ReportFilteringService {
  /**
   * Filter property images based on report type
   */
  static filterPropertyImages(
    images: PropertyImage[], 
    reportType: ReportType
  ): PropertyImage[] {
    const filters = REPORT_FILTERS[reportType];
    
    if (!filters.includeImages || !images || images.length === 0) {
      return [];
    }

    // Sort images by priority: primary first, then by document_page, then by order_index
    const sortedImages = [...images].sort((a, b) => {
      // Primary images first
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      
      // Then by document page (lower page numbers first)
      if (a.document_page !== b.document_page) {
        return a.document_page - b.document_page;
      }
      
      // Finally by order index
      return a.order_index - b.order_index;
    });

    // Apply image count limit based on report type
    const filteredImages = sortedImages.slice(0, filters.maxImages);
    
    console.log(`🖼️  Image filtering for ${reportType}:`, {
      original_count: images.length,
      max_allowed: filters.maxImages,
      filtered_count: filteredImages.length,
      primary_count: filteredImages.filter(img => img.is_primary).length
    });

    return filteredImages;
  }

  /**
   * Apply privacy filtering to appraisal data based on report type
   */
  static filterAppraisalData(
    rawData: RawAppraisalData, 
    reportType: ReportType
  ): FilteredAppraisalData {
    const filters = REPORT_FILTERS[reportType];
    const filteredData: FilteredAppraisalData = {
      id: rawData.id,
      appraisal_reference_number: rawData.appraisal_reference_number,
      property_type: rawData.property_type,
      property_address: rawData.property_address,
      area: rawData.area,
      market_value_estimate: rawData.market_value_estimate,
      appraisal_date: rawData.appraisal_date,
      report_date: rawData.report_date,
      status: rawData.status
    };

    const filteredFields: string[] = [];

    // Apply personal information filtering
    if (filters.includePersonalInfo) {
      filteredData.client_name = rawData.client_name;
      filteredData.client_contact = rawData.client_contact;
      filteredData.client_requirements = rawData.client_requirements;
    } else {
      filteredFields.push('client_name', 'client_contact', 'client_requirements');
    }

    // Apply appraiser information filtering
    if (filters.includeAppraiserInfo) {
      filteredData.appraiser_name = rawData.appraiser_name;
      filteredData.appraiser_email = rawData.appraiser_email;
      filteredData.appraiser_phone = rawData.appraiser_phone;
      filteredData.appraiser_license = rawData.appraiser_license;
      filteredData.appraiser_credentials = rawData.appraiser_credentials;
    } else {
      filteredData.appraiser_name = "Licensed Appraiser";
      filteredFields.push('appraiser_email', 'appraiser_phone', 'appraiser_license', 'appraiser_credentials');
    }

    // Apply financial details filtering
    if (filters.includeFinancialDetails) {
      filteredData.detailed_pricing = rawData.detailed_pricing;
      filteredData.inspection_date = rawData.inspection_date;
    } else {
      filteredFields.push('detailed_pricing', 'inspection_date');
    }

    // Apply methodology filtering
    if (filters.includeMethodologies) {
      filteredData.valuation_method = rawData.valuation_method;
      filteredData.calculation_details = rawData.calculation_details;
    } else {
      filteredFields.push('valuation_method', 'calculation_details');
    }

    // Apply comparables filtering
    if (filters.includeComparables) {
      filteredData.comparable_properties = rawData.comparable_properties;
    } else {
      filteredFields.push('comparable_properties');
    }

    // Apply investment projections filtering
    if (filters.includeInvestmentProjections) {
      filteredData.investment_analysis = rawData.investment_analysis;
    } else {
      filteredFields.push('investment_analysis');
    }

    // Add privacy notice and filtered fields info
    filteredData.filtered_fields = filteredFields;
    filteredData.privacy_notice = this.generatePrivacyNotice(reportType, filteredFields);

    return filteredData;
  }

  /**
   * Generate privacy notice based on report type and filtered fields
   */
  private static generatePrivacyNotice(reportType: ReportType, filteredFields: string[]): string {
    const reportTypeNames = {
      standard: 'Standard',
      detailed: 'Detailed',
      comprehensive: 'Comprehensive'
    };

    if (filteredFields.length === 0) {
      return `This ${reportTypeNames[reportType]} report includes all available information.`;
    }

    const privacyMessages = {
      standard: 'This Standard report provides essential property valuation information with privacy protection for sensitive data.',
      detailed: 'This Detailed report includes comprehensive market analysis while protecting certain confidential information.',
      comprehensive: 'This Comprehensive report includes all available information with minimal privacy filtering.'
    };

    return privacyMessages[reportType];
  }

  /**
   * Get pricing information for different report types
   */
  static getReportTypePricing(): Record<ReportType, { 
    basePrice: number; 
    description: string; 
    features: string[];
    privacyLevel: PrivacyLevel;
  }> {
    return {
      standard: {
        basePrice: 50,
        description: 'Basic property valuation with essential information',
        features: [
          'Property valuation estimate',
          'Basic market comparables',
          'Property details and location',
          'High privacy protection'
        ],
        privacyLevel: 'high'
      },
      detailed: {
        basePrice: 100,
        description: 'Comprehensive analysis with market insights',
        features: [
          'Detailed financial breakdown',
          'Market comparison analysis',
          'Investment projections',
          'Appraiser credentials',
          'Medium privacy protection'
        ],
        privacyLevel: 'medium'
      },
      comprehensive: {
        basePrice: 200,
        description: 'Complete professional report with full details',
        features: [
          'Full client and appraiser information',
          'Detailed calculation methodologies',
          'Complete financial analysis',
          'Investment forecasts and trends',
          'Minimal privacy filtering'
        ],
        privacyLevel: 'low'
      }
    };
  }

  /**
   * Get available report types for a user based on their subscription/access level
   */
  static getAvailableReportTypes(userAccessLevel: 'basic' | 'premium' | 'enterprise' = 'basic'): ReportType[] {
    const accessLevels = {
      basic: ['standard'],
      premium: ['standard', 'detailed'],
      enterprise: ['standard', 'detailed', 'comprehensive']
    };

    return accessLevels[userAccessLevel] as ReportType[];
  }

  /**
   * Validate if user can access a specific report type
   */
  static canAccessReportType(
    reportType: ReportType, 
    userAccessLevel: 'basic' | 'premium' | 'enterprise' = 'basic'
  ): boolean {
    const availableTypes = this.getAvailableReportTypes(userAccessLevel);
    return availableTypes.includes(reportType);
  }

  /**
   * Get filtered field explanations for transparency
   */
  static getFilteredFieldExplanations(): Record<string, string> {
    return {
      client_name: 'Client identity protected for privacy',
      client_contact: 'Client contact information protected',
      client_requirements: 'Specific client requirements protected',
      appraiser_email: 'Appraiser contact details protected',
      appraiser_phone: 'Appraiser phone number protected',
      appraiser_license: 'Appraiser license details protected',
      appraiser_credentials: 'Detailed appraiser credentials protected',
      detailed_pricing: 'Detailed price breakdown not included in this report type',
      valuation_method: 'Specific valuation methodologies protected',
      calculation_details: 'Detailed calculations protected',
      comparable_properties: 'Market comparables not included',
      investment_analysis: 'Investment projections not included',
      inspection_date: 'Specific inspection details protected'
    };
  }

  /**
   * Generate report metadata for PDF generation
   */
  static generateReportMetadata(
    filteredData: FilteredAppraisalData,
    reportType: ReportType,
    generatedFor: string
  ) {
    const pricing = this.getReportTypePricing()[reportType];
    
    return {
      reportType,
      reportTypeDisplay: reportType.charAt(0).toUpperCase() + reportType.slice(1),
      privacyLevel: pricing.privacyLevel,
      generatedAt: new Date().toISOString(),
      generatedFor,
      appraisalId: filteredData.id,
      reference: filteredData.appraisal_reference_number,
      privacyNotice: filteredData.privacy_notice,
      filteredFieldsCount: filteredData.filtered_fields?.length || 0,
      disclaimer: `This ${reportType} report has been generated with appropriate privacy filtering. ` +
                 `Some information may be protected or excluded based on the report type selected.`
    };
  }
}