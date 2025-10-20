// TypeScript interfaces for Python Document Processing API integration

export interface DocumentProcessingResult {
  import_id: string;
  processing_status: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  extracted_fields: ExtractedFieldData[];
  confidence_scores: Record<string, number>;
  processing_time_seconds: number;
  ai_service_used: string;
  extracted_images: ExtractedImage[];
  fields_extracted: number;
  images_count: number;
  errors?: string[];
}

export interface ExtractedFieldData {
  field_name: string;
  extracted_value: any;
  confidence: number;
  source_location?: string;
}

export interface ExtractedImage {
  category: 'property_photo' | 'pdf_page' | 'document_scan';
  page_number?: number;
  data: string; // Base64 encoded image data
  format: 'jpeg' | 'png';
  size: number;
  confidence: number;
  source: string;
}

// Mapping interface for SmartAppraisalForm fields (matches Python API output)
export interface SmartAppraisalFormData {
  // Client & Professional Info - Critical fields from Python analysis
  client_name?: string;
  appraiser_name?: string;
  appraisal_date?: string;
  requested_by?: string;
  
  // Report Metadata - MISSING FIELDS ADDED
  report_number?: string;
  owner_name?: string;
  occupancy_status?: string;
  
  // Property Details - Core measurements (CRITICAL ACCURACY REQUIRED)
  property_type?: string;
  unit_area_sqm?: number;
  land_area_sqm?: number;        // Fixed: 620.0 (not 62.0)
  unit_land_share?: number;      // Fixed: 62.00 (not 188.00)
  building_number?: string;
  floor_number?: string | number;
  building_age_years?: number;   // Fixed: 16.0 (not 16620.0)
  
  // Room Information - Extracted from documents
  bedrooms?: number;
  bathrooms?: number;
  reception_rooms?: number;
  kitchens?: number;
  parking_spaces?: number;
  total_floors?: number;
  year_built?: number;
  
  // Location - Arabic text extraction
  property_address_arabic?: string;
  property_address_english?: string;
  city_name?: string;
  district_name?: string;
  governorate?: string;
  
  // Areas and Specifications
  built_area_sqm?: number;
  balcony_area_sqm?: number;
  garage_area_sqm?: number;
  unit_land_share_sqm?: number;
  
  // Valuation - CRITICAL financial fields
  final_reconciled_value?: number; // Fixed: 1700000.0 (1.7M EGP)
  land_value?: number;
  building_value?: number;
  price_per_sqm_area?: number;
  cost_approach_value?: number;
  sales_comparison_value?: number;
  income_approach_value?: number;
  monthly_rental_estimate?: number;
  
  // Technical specifications extracted from documents
  finishing_level?: string;
  overall_condition_rating?: number;
  structural_condition?: string;
  mechanical_systems_condition?: string;
  exterior_condition?: string;
  interior_condition?: string;
  
  // Utilities and services (boolean fields)
  electricity_available?: boolean;
  water_supply_available?: boolean;
  sewage_system_available?: boolean;
  gas_supply_available?: boolean;
  internet_fiber_available?: boolean;
  elevator_available?: boolean;
  parking_available?: boolean;
  security_system?: boolean;
  
  // Location factors
  street_width_meters?: number;
  accessibility_rating?: number;
  noise_level?: string;
  view_quality?: string;
  neighborhood_quality_rating?: number;
  
  // Market analysis
  market_trend?: string;
  demand_supply_ratio?: number;
  
  // Economic analysis (Egyptian standards)
  economic_life_years?: number;
  current_age_ratio?: number;
  depreciation_rate_annual?: number;
  replacement_cost_new?: number;
  
  // MISSING ECONOMIC FIELDS ADDED (duplicates removed)
  remaining_building_life_years?: number;
  total_units_in_building?: number;
  property_boundaries?: string;
  construction_cost_per_sqm?: number;
  unit_construction_cost?: number;
  total_depreciation_value?: number;
  price_per_sqm_land?: number;
  estimated_selling_time?: number;
  
  // Location analysis (Egyptian standards)
  street_type?: string;
  commercial_percentage?: number;
  market_activity?: string;
  property_liquidity?: string;
  time_on_market_months?: number;
  area_density?: string;
  
  // Land valuation (Egyptian standards)
  land_value_per_sqm?: number;
  total_building_land_area?: number;
  land_use_classification?: string;
  highest_best_use_confirmed?: boolean;
  
  // Room specifications (detailed)
  reception_flooring?: string;
  kitchen_flooring?: string;
  bathroom_flooring?: string;
  bedroom_flooring?: string;
  terrace_flooring?: string;
  reception_walls?: string;
  kitchen_walls?: string;
  bathroom_walls?: string;
  bedroom_walls?: string;
  
  // Comparative sales analysis (3 comparables)
  comparable_sale_1_address?: string;
  comparable_sale_1_price?: number;
  comparable_sale_1_area?: number;
  comparable_sale_1_price_per_sqm?: number;
  comparable_sale_1_age?: number;
  comparable_sale_1_finishing?: string;
  comparable_sale_1_floor?: number;
  comparable_sale_1_orientation?: string;
  comparable_sale_1_street_view?: string;
  comparable_sale_1_sale_date?: string;
  
  comparable_sale_2_address?: string;
  comparable_sale_2_price?: number;
  comparable_sale_2_area?: number;
  comparable_sale_2_price_per_sqm?: number;
  comparable_sale_2_age?: number;
  comparable_sale_2_finishing?: string;
  comparable_sale_2_floor?: number;
  comparable_sale_2_orientation?: string;
  comparable_sale_2_street_view?: string;
  comparable_sale_2_sale_date?: string;
  
  comparable_sale_3_address?: string;
  comparable_sale_3_price?: number;
  comparable_sale_3_area?: number;
  comparable_sale_3_price_per_sqm?: number;
  comparable_sale_3_age?: number;
  comparable_sale_3_finishing?: string;
  comparable_sale_3_floor?: number;
  comparable_sale_3_orientation?: string;
  comparable_sale_3_street_view?: string;
  comparable_sale_3_sale_date?: string;
  
  // Professional certifications (Egyptian standards)
  egyptian_standards_compliance?: boolean;
  report_validity_months?: number;
  professional_statement_confirmed?: boolean;
  
  // Legal status
  ownership_type?: string;
  title_deed_available?: boolean;
  building_permit_available?: boolean;
  occupancy_certificate?: boolean;
  real_estate_tax_paid?: boolean;
  
  // Construction details
  construction_type?: string;
  floor_materials?: Record<string, string>;
  wall_finishes?: Record<string, string>;
  ceiling_type?: string;
  windows_type?: string;
  doors_type?: string;
  
  // Room Specifications (parsed from extraction)
  reception_flooring?: string;
  kitchen_flooring?: string;
  bathroom_flooring?: string;
  bedroom_flooring?: string;
  terrace_flooring?: string;
  reception_walls?: string;
  kitchen_walls?: string;
  bathroom_walls?: string;
  bedroom_walls?: string;
  
  // General Materials (parsed from comma-separated extraction)
  general_floor_materials?: string[];
  general_wall_materials?: string[];
  general_exterior_materials?: string[];
  
  // Egyptian Legal Standards - NEW ADDITION
  egyptian_legal_standards?: EgyptianLegalStandardsData;
  
  // Additional extracted fields (67+ total possible)
  [key: string]: any;
}

// Egyptian Legal Standards Interface
export interface EgyptianLegalStandardsData {
  // Standard Compliance Flags
  standards_compliance: boolean;
  fra_resolution_number: string;
  fra_resolution_year: string;
  fra_resolution_date: string;
  market_value_definition_confirmed: boolean;
  ownership_disputes_confirmed: boolean;
  physical_inspection_completed: boolean;
  highest_best_use_applied: boolean;
  professional_independence_declared: boolean;
  
  // Variable Fields - Property Specific
  property_address_arabic: string;
  property_address_english: string;
  building_number: string;
  unit_number: string;
  floor_number: string;
  property_type_arabic: string;
  property_type_english: string;
  
  // Variable Fields - Client Information
  client_name_arabic: string;
  client_name_english: string;
  requesting_entity_arabic: string;
  requesting_entity_english: string;
  
  // Variable Fields - Appraiser Information
  appraiser_name_arabic: string;
  appraiser_name_english: string;
  appraiser_license_number: string;
  appraiser_certification_authority: string;
  
  // Variable Fields - Report Dates
  report_validity_period_months: number;
  inspection_date: string;
  report_issue_date: string;
  signature_date: string;
  
  // Professional Certification Points (10 points)
  certification_points_confirmed: boolean[];
}

// API request/response interfaces
export interface DocumentUploadRequest {
  appraiser_id: string;
  file: File;
}

export interface FormPopulationRequest {
  import_id: string;
  corrections?: Record<string, any>;
}

export interface FormPopulationResponse {
  success: boolean;
  populated_form: SmartAppraisalFormData;
  fields_populated: number;
  accuracy_score?: number;
  processing_metadata?: {
    ai_service_used: string;
    processing_time_seconds: number;
    confidence_scores: Record<string, number>;
  };
}

// Error handling
export interface DocumentProcessorError {
  error: string;
  details?: string;
  code?: string;
}

// File validation
export interface FileValidation {
  isValid: boolean;
  error?: string;
  fileType?: string;
  fileSize?: number;
}

// Processing status tracking
export type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';

// Data review interface for extracted field review
export interface ExtractedFieldReview {
  field_name: string;
  extracted_value: any;
  confidence: number;
  user_correction?: any;
  accepted: boolean;
}