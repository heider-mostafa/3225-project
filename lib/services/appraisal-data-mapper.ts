/**
 * Egyptian Real Estate Appraisal Data Mapping Service
 * Maps extracted document data to SmartAppraisalForm fields with comprehensive validation
 */

export interface ExtractedAppraisalData {
  // Header Information
  client_name?: string;
  requested_by?: string;
  appraisal_date?: string;
  report_number?: string;
  
  // Property Basic Info
  property_address_arabic?: string;
  property_address_english?: string;
  district_name?: string;
  city_name?: string;
  governorate?: string;
  
  // Building Information
  building_number?: string;
  floor_number?: number;
  unit_number?: string;
  building_age_years?: number;
  construction_type?: string;
  
  // Basic Property Information
  property_type?: string;
  bedrooms?: number;
  bathrooms?: number;
  reception_rooms?: number;
  kitchens?: number;
  parking_spaces?: number;
  total_floors?: number;
  year_built?: number;
  
  // Area Measurements
  land_area_sqm?: number;
  built_area_sqm?: number;
  unit_area_sqm?: number;
  balcony_area_sqm?: number;
  garage_area_sqm?: number;
  
  // Technical Specifications
  finishing_level?: string;
  floor_materials?: Record<string, string>;
  wall_finishes?: Record<string, string>;
  ceiling_type?: string;
  windows_type?: string;
  doors_type?: string;
  
  // Condition Assessment
  overall_condition_rating?: number;
  structural_condition?: string;
  mechanical_systems_condition?: string;
  exterior_condition?: string;
  interior_condition?: string;
  
  // Utilities and Services
  electricity_available?: boolean;
  water_supply_available?: boolean;
  sewage_system_available?: boolean;
  gas_supply_available?: boolean;
  internet_fiber_available?: boolean;
  elevator_available?: boolean;
  parking_available?: boolean;
  security_system?: boolean;
  
  // Location Factors
  street_width_meters?: number;
  accessibility_rating?: number;
  noise_level?: string;
  view_quality?: string;
  neighborhood_quality_rating?: number;
  
  // Market Analysis
  market_trend?: string;
  demand_supply_ratio?: number;
  price_per_sqm_area?: number;
  
  // Economic Analysis (Egyptian Standards)
  economic_life_years?: number;
  current_age_ratio?: number;
  depreciation_rate_annual?: number;
  replacement_cost_new?: number;
  
  // Location Analysis (Egyptian Standards)
  street_type?: string;
  commercial_percentage?: number;
  market_activity?: string;
  property_liquidity?: string;
  time_on_market_months?: number;
  area_density?: string;
  
  // Land Valuation (Egyptian Standards)
  land_value_per_sqm?: number;
  total_building_land_area?: number;
  unit_land_share_sqm?: number;
  land_use_classification?: string;
  highest_best_use_confirmed?: boolean;
  
  // Room Specifications (Detailed - Egyptian Standards)
  reception_flooring?: string;
  kitchen_flooring?: string;
  bathroom_flooring?: string;
  bedroom_flooring?: string;
  terrace_flooring?: string;
  reception_walls?: string;
  kitchen_walls?: string;
  bathroom_walls?: string;
  bedroom_walls?: string;
  
  // Valuation Methods Results (Egyptian Standards)
  cost_approach_value?: number;
  sales_comparison_value?: number;
  income_approach_value?: number;
  final_reconciled_value?: number;
  recommended_valuation_method?: string;
  monthly_rental_estimate?: number;
  
  // Comparative Sales Analysis (Egyptian Standards)
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
  
  // Professional Certifications (Egyptian Standards)
  egyptian_standards_compliance?: boolean;
  report_validity_months?: number;
  professional_statement_confirmed?: boolean;
  
  // Legal Status
  ownership_type?: string;
  title_deed_available?: boolean;
  building_permit_available?: boolean;
  occupancy_certificate?: boolean;
  real_estate_tax_paid?: boolean;
  
  // ADDITIONAL EXTRACTED FIELDS (from Gemini extraction)
  appraiser_name?: string;
  registration_number?: string;
  appraisal_valid_until?: string;
  report_type?: string;
  entrance?: string;
  effective_building_age_years?: number;
  economic_building_life_years?: number;
  total_building_area_sqm?: number;
  unit_land_share_sqm?: number;
  electrical_system_description?: string;
  sanitary_ware_description?: string;
  exterior_finishes_description?: string;
  telephone_available?: boolean;
  nearby_services?: string;
  location_description?: string;
  construction_volume?: number;
  funding_source?: string;
  area_character?: string;
  time_to_sell?: number;
  price_per_sqm_semi_finished?: number;
  price_per_sqm_fully_finished?: number;
  land_value?: number;
  building_value?: number;
  unit_land_share_value?: number;
  unit_construction_cost?: number;
  building_value_with_profit?: number;
  curable_depreciation_value?: number;
  incurable_depreciation_value?: number;
  garage_share_description?: string;
  owner_name?: string;
  occupancy_status?: string;
  remaining_building_life_years?: number;
  total_units_in_building?: number;
  property_boundaries?: string;
  construction_cost_per_sqm?: number;
  total_depreciation_value?: number;
  price_per_sqm_land?: number;
  estimated_selling_time?: number;
  
  // General materials (parsed from comma-separated extraction)
  general_floor_materials?: string[];
  general_wall_materials?: string[];
  general_exterior_materials?: string[];
  
  // Additional Fields Not in Form
  unmapped_data?: Record<string, any>;
  extraction_warnings?: string[];
  confidence_scores?: Record<string, number>;
}

export interface AppraisalFieldMapping {
  field_name: string;
  display_name: string;
  is_required: boolean;
  is_critical: boolean;
  form_field_exists: boolean;
  extracted_successfully: boolean;
  confidence_score?: number;
  warning_level: 'none' | 'info' | 'warning' | 'error';
  warning_message?: string;
}

export interface AppraisalMappingReport {
  total_extracted_fields: number;
  total_form_fields: number;
  successfully_mapped_fields: number;
  missing_critical_fields: number;
  low_confidence_fields: number;
  unmapped_additional_data: number;
  overall_completeness_percentage: number;
  field_mappings: AppraisalFieldMapping[];
  unmapped_data_items: Array<{
    key: string;
    value: any;
    suggestion: string;
  }>;
  warnings: Array<{
    type: 'missing_critical' | 'low_confidence' | 'unmapped_data' | 'validation_error';
    field: string;
    message: string;
    suggestion?: string;
    severity: 'low' | 'medium' | 'high';
  }>;
}

export class AppraisalDataMapper {
  // SmartAppraisalForm field definitions with metadata
  private readonly FORM_FIELD_DEFINITIONS: Record<string, {
    display_name: string;
    is_required: boolean;
    is_critical: boolean;
    field_type: 'string' | 'number' | 'boolean' | 'enum' | 'record';
    enum_values?: string[];
    min_value?: number;
    max_value?: number;
  }> = {
    // Header Information
    client_name: { display_name: 'Client Name', is_required: true, is_critical: true, field_type: 'string' },
    requested_by: { display_name: 'Requested By', is_required: true, is_critical: true, field_type: 'string' },
    
    // Professional Information (NEW FIELDS)
    appraiser_name: { display_name: 'Appraiser Name', is_required: true, is_critical: true, field_type: 'string' },
    registration_number: { display_name: 'Registration Number', is_required: true, is_critical: true, field_type: 'string' },
    appraisal_valid_until: { display_name: 'Appraisal Valid Until', is_required: true, is_critical: true, field_type: 'string' },
    report_type: { 
      display_name: 'Report Type', 
      is_required: true, 
      is_critical: true, 
      field_type: 'enum',
      enum_values: ['full_appraisal', 'update', 'summary', 'restricted']
    },
    owner_name: { display_name: 'Owner Name', is_required: false, is_critical: false, field_type: 'string' },
    
    // Property Basic Info
    property_address_arabic: { display_name: 'Arabic Address', is_required: true, is_critical: true, field_type: 'string' },
    property_address_english: { display_name: 'English Address', is_required: true, is_critical: true, field_type: 'string' },
    district_name: { display_name: 'District', is_required: true, is_critical: true, field_type: 'string' },
    city_name: { display_name: 'City', is_required: true, is_critical: true, field_type: 'string' },
    governorate: { display_name: 'Governorate', is_required: true, is_critical: true, field_type: 'string' },
    property_boundaries: { display_name: 'Property Boundaries', is_required: false, is_critical: false, field_type: 'string' },
    
    // Building Information
    building_number: { display_name: 'Building Number', is_required: false, is_critical: false, field_type: 'string' },
    floor_number: { display_name: 'Floor Number', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    unit_number: { display_name: 'Unit Number', is_required: false, is_critical: false, field_type: 'string' },
    entrance: { display_name: 'Entrance', is_required: false, is_critical: false, field_type: 'string' },
    building_age_years: { display_name: 'Building Age (Years)', is_required: true, is_critical: true, field_type: 'number', min_value: 0, max_value: 200 },
    effective_building_age_years: { display_name: 'Effective Building Age (Years)', is_required: false, is_critical: false, field_type: 'number', min_value: 0, max_value: 200 },
    economic_building_life_years: { display_name: 'Economic Building Life (Years)', is_required: true, is_critical: true, field_type: 'number', min_value: 1, max_value: 200 },
    remaining_building_life_years: { display_name: 'Remaining Building Life (Years)', is_required: false, is_critical: false, field_type: 'number', min_value: 0, max_value: 200 },
    construction_type: { 
      display_name: 'Construction Type', 
      is_required: true, 
      is_critical: true, 
      field_type: 'enum',
      enum_values: ['concrete', 'brick', 'steel', 'mixed']
    },
    
    // Basic Property Information
    property_type: { 
      display_name: 'Property Type', 
      is_required: true, 
      is_critical: true, 
      field_type: 'enum',
      enum_values: ['apartment', 'villa', 'townhouse', 'penthouse', 'studio', 'duplex', 'commercial', 'industrial', 'land']
    },
    bedrooms: { display_name: 'Bedrooms', is_required: true, is_critical: true, field_type: 'number', min_value: 0, max_value: 20 },
    bathrooms: { display_name: 'Bathrooms', is_required: true, is_critical: true, field_type: 'number', min_value: 0, max_value: 20 },
    reception_rooms: { display_name: 'Reception Rooms', is_required: false, is_critical: false, field_type: 'number', min_value: 0, max_value: 10 },
    kitchens: { display_name: 'Kitchens', is_required: false, is_critical: false, field_type: 'number', min_value: 0, max_value: 5 },
    parking_spaces: { display_name: 'Parking Spaces', is_required: false, is_critical: false, field_type: 'number', min_value: 0, max_value: 20 },
    total_floors: { display_name: 'Total Floors', is_required: false, is_critical: false, field_type: 'number', min_value: 1, max_value: 100 },
    year_built: { display_name: 'Year Built', is_required: false, is_critical: false, field_type: 'number', min_value: 1800, max_value: new Date().getFullYear() },
    
    // Area Measurements
    land_area_sqm: { display_name: 'Land Area (sqm)', is_required: true, is_critical: true, field_type: 'number', min_value: 1 },
    built_area_sqm: { display_name: 'Built Area (sqm)', is_required: true, is_critical: true, field_type: 'number', min_value: 1 },
    unit_area_sqm: { display_name: 'Unit Area (sqm)', is_required: true, is_critical: true, field_type: 'number', min_value: 1 },
    balcony_area_sqm: { display_name: 'Balcony Area (sqm)', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    garage_area_sqm: { display_name: 'Garage Area (sqm)', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    total_building_area_sqm: { display_name: 'Total Building Area (sqm)', is_required: false, is_critical: false, field_type: 'number', min_value: 1 },
    unit_land_share_sqm: { display_name: 'Unit Land Share (sqm)', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    
    // Technical Specifications
    finishing_level: { 
      display_name: 'Finishing Level', 
      is_required: true, 
      is_critical: true, 
      field_type: 'enum',
      enum_values: ['core_shell', 'semi_finished', 'fully_finished', 'luxury']
    },
    floor_materials: { display_name: 'Floor Materials', is_required: false, is_critical: false, field_type: 'record' },
    wall_finishes: { display_name: 'Wall Finishes', is_required: false, is_critical: false, field_type: 'record' },
    ceiling_type: { display_name: 'Ceiling Type', is_required: false, is_critical: false, field_type: 'string' },
    windows_type: { 
      display_name: 'Windows Type', 
      is_required: false, 
      is_critical: false, 
      field_type: 'enum',
      enum_values: ['aluminum', 'wood', 'upvc', 'steel']
    },
    doors_type: { display_name: 'Doors Type', is_required: false, is_critical: false, field_type: 'string' },
    electrical_system_description: { display_name: 'Electrical System Description', is_required: false, is_critical: false, field_type: 'string' },
    sanitary_ware_description: { display_name: 'Sanitary Ware Description', is_required: false, is_critical: false, field_type: 'string' },
    exterior_finishes_description: { display_name: 'Exterior Finishes Description', is_required: false, is_critical: false, field_type: 'string' },
    
    // Condition Assessment
    overall_condition_rating: { display_name: 'Overall Condition Rating', is_required: true, is_critical: true, field_type: 'number', min_value: 1, max_value: 10 },
    structural_condition: { 
      display_name: 'Structural Condition', 
      is_required: true, 
      is_critical: true, 
      field_type: 'enum',
      enum_values: ['excellent', 'good', 'fair', 'poor']
    },
    mechanical_systems_condition: { 
      display_name: 'Mechanical Systems Condition', 
      is_required: true, 
      is_critical: true, 
      field_type: 'enum',
      enum_values: ['excellent', 'good', 'fair', 'poor']
    },
    exterior_condition: { 
      display_name: 'Exterior Condition', 
      is_required: true, 
      is_critical: true, 
      field_type: 'enum',
      enum_values: ['excellent', 'good', 'fair', 'poor']
    },
    interior_condition: { 
      display_name: 'Interior Condition', 
      is_required: true, 
      is_critical: true, 
      field_type: 'enum',
      enum_values: ['excellent', 'good', 'fair', 'poor']
    },
    
    // Utilities and Services
    electricity_available: { display_name: 'Electricity Available', is_required: true, is_critical: false, field_type: 'boolean' },
    water_supply_available: { display_name: 'Water Supply Available', is_required: true, is_critical: false, field_type: 'boolean' },
    sewage_system_available: { display_name: 'Sewage System Available', is_required: true, is_critical: false, field_type: 'boolean' },
    gas_supply_available: { display_name: 'Gas Supply Available', is_required: true, is_critical: false, field_type: 'boolean' },
    internet_fiber_available: { display_name: 'Internet/Fiber Available', is_required: true, is_critical: false, field_type: 'boolean' },
    elevator_available: { display_name: 'Elevator Available', is_required: true, is_critical: false, field_type: 'boolean' },
    parking_available: { display_name: 'Parking Available', is_required: true, is_critical: false, field_type: 'boolean' },
    security_system: { display_name: 'Security System', is_required: true, is_critical: false, field_type: 'boolean' },
    telephone_available: { display_name: 'Telephone Available', is_required: true, is_critical: false, field_type: 'boolean' },
    nearby_services: { display_name: 'Nearby Services', is_required: false, is_critical: false, field_type: 'string' },
    
    // Location Factors
    street_width_meters: { display_name: 'Street Width (meters)', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    accessibility_rating: { display_name: 'Accessibility Rating', is_required: true, is_critical: false, field_type: 'number', min_value: 1, max_value: 10 },
    noise_level: { 
      display_name: 'Noise Level', 
      is_required: true, 
      is_critical: false, 
      field_type: 'enum',
      enum_values: ['low', 'moderate', 'high']
    },
    view_quality: { 
      display_name: 'View Quality', 
      is_required: true, 
      is_critical: false, 
      field_type: 'enum',
      enum_values: ['excellent', 'good', 'average', 'poor']
    },
    neighborhood_quality_rating: { display_name: 'Neighborhood Quality Rating', is_required: true, is_critical: false, field_type: 'number', min_value: 1, max_value: 10 },
    location_description: { display_name: 'Location Description', is_required: false, is_critical: false, field_type: 'string' },
    construction_volume: { display_name: 'Construction Volume', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    funding_source: { display_name: 'Funding Source', is_required: false, is_critical: false, field_type: 'string' },
    area_character: { display_name: 'Area Character', is_required: false, is_critical: false, field_type: 'string' },
    
    // Market Analysis
    market_trend: { 
      display_name: 'Market Trend', 
      is_required: false, 
      is_critical: false, 
      field_type: 'enum',
      enum_values: ['rising', 'stable', 'declining']
    },
    demand_supply_ratio: { display_name: 'Demand/Supply Ratio', is_required: false, is_critical: false, field_type: 'number', min_value: 0, max_value: 5 },
    price_per_sqm_area: { display_name: 'Price per sqm', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    time_to_sell: { display_name: 'Time to Sell (Months)', is_required: false, is_critical: false, field_type: 'number', min_value: 0, max_value: 60 },
    price_per_sqm_semi_finished: { display_name: 'Price per sqm Semi-Finished', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    price_per_sqm_fully_finished: { display_name: 'Price per sqm Fully Finished', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    
    // Economic Analysis (Egyptian Standards)
    economic_life_years: { display_name: 'Economic Life (Years)', is_required: true, is_critical: true, field_type: 'number', min_value: 1, max_value: 200 },
    current_age_ratio: { display_name: 'Current Age Ratio', is_required: false, is_critical: false, field_type: 'number', min_value: 0, max_value: 100 },
    depreciation_rate_annual: { display_name: 'Annual Depreciation Rate', is_required: false, is_critical: false, field_type: 'number', min_value: 0, max_value: 20 },
    replacement_cost_new: { display_name: 'Replacement Cost New', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    
    // Location Analysis (Egyptian Standards)
    street_type: { 
      display_name: 'Street Type', 
      is_required: true, 
      is_critical: true, 
      field_type: 'enum',
      enum_values: ['main_street', 'side_street', 'internal_street']
    },
    commercial_percentage: { display_name: 'Commercial Percentage', is_required: false, is_critical: false, field_type: 'number', min_value: 0, max_value: 100 },
    market_activity: { 
      display_name: 'Market Activity', 
      is_required: true, 
      is_critical: true, 
      field_type: 'enum',
      enum_values: ['rising', 'stable', 'declining']
    },
    property_liquidity: { 
      display_name: 'Property Liquidity', 
      is_required: true, 
      is_critical: true, 
      field_type: 'enum',
      enum_values: ['high', 'medium', 'low']
    },
    time_on_market_months: { display_name: 'Time on Market (Months)', is_required: false, is_critical: false, field_type: 'number', min_value: 0, max_value: 60 },
    area_density: { 
      display_name: 'Area Density', 
      is_required: true, 
      is_critical: false, 
      field_type: 'enum',
      enum_values: ['crowded', 'moderate', 'sparse']
    },
    
    // Land Valuation (Egyptian Standards)
    land_value_per_sqm: { display_name: 'Land Value per sqm', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    total_building_land_area: { display_name: 'Total Building Land Area', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    unit_land_share_sqm: { display_name: 'Unit Land Share (sqm)', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    land_use_classification: { display_name: 'Land Use Classification', is_required: false, is_critical: false, field_type: 'string' },
    highest_best_use_confirmed: { display_name: 'Highest Best Use Confirmed', is_required: true, is_critical: false, field_type: 'boolean' },
    
    // Room Specifications (Detailed - Egyptian Standards)
    reception_flooring: { 
      display_name: 'Reception Flooring', 
      is_required: false, 
      is_critical: false, 
      field_type: 'enum',
      enum_values: ['ceramic', 'marble', 'granite', 'parquet', 'laminate', 'vinyl', 'carpet', 'terrazzo']
    },
    kitchen_flooring: { 
      display_name: 'Kitchen Flooring', 
      is_required: false, 
      is_critical: false, 
      field_type: 'enum',
      enum_values: ['ceramic', 'granite', 'marble', 'porcelain', 'vinyl', 'natural_stone']
    },
    bathroom_flooring: { 
      display_name: 'Bathroom Flooring', 
      is_required: false, 
      is_critical: false, 
      field_type: 'enum',
      enum_values: ['ceramic', 'porcelain', 'marble', 'granite', 'mosaic', 'natural_stone']
    },
    bedroom_flooring: { 
      display_name: 'Bedroom Flooring', 
      is_required: false, 
      is_critical: false, 
      field_type: 'enum',
      enum_values: ['parquet', 'laminate', 'ceramic', 'marble', 'carpet', 'vinyl']
    },
    terrace_flooring: { 
      display_name: 'Terrace Flooring', 
      is_required: false, 
      is_critical: false, 
      field_type: 'enum',
      enum_values: ['ceramic', 'granite', 'marble', 'natural_stone', 'concrete', 'tiles']
    },
    reception_walls: { 
      display_name: 'Reception Walls', 
      is_required: false, 
      is_critical: false, 
      field_type: 'enum',
      enum_values: ['plastic_paint', 'oil_paint', 'wallpaper', 'stone_cladding', 'wood_panels', 'gypsum_board']
    },
    kitchen_walls: { 
      display_name: 'Kitchen Walls', 
      is_required: false, 
      is_critical: false, 
      field_type: 'enum',
      enum_values: ['ceramic_tiles', 'granite', 'marble', 'stainless_steel', 'glass', 'plastic_paint']
    },
    bathroom_walls: { 
      display_name: 'Bathroom Walls', 
      is_required: false, 
      is_critical: false, 
      field_type: 'enum',
      enum_values: ['ceramic_tiles', 'porcelain', 'marble', 'granite', 'mosaic', 'waterproof_paint']
    },
    bedroom_walls: { 
      display_name: 'Bedroom Walls', 
      is_required: false, 
      is_critical: false, 
      field_type: 'enum',
      enum_values: ['plastic_paint', 'oil_paint', 'wallpaper', 'wood_panels', 'gypsum_board']
    },
    
    // Valuation Methods Results (Egyptian Standards)
    cost_approach_value: { display_name: 'Cost Approach Value', is_required: false, is_critical: true, field_type: 'number', min_value: 0 },
    sales_comparison_value: { display_name: 'Sales Comparison Value', is_required: false, is_critical: true, field_type: 'number', min_value: 0 },
    income_approach_value: { display_name: 'Income Approach Value', is_required: false, is_critical: true, field_type: 'number', min_value: 0 },
    final_reconciled_value: { display_name: 'Final Reconciled Value', is_required: false, is_critical: true, field_type: 'number', min_value: 0 },
    recommended_valuation_method: { 
      display_name: 'Recommended Valuation Method', 
      is_required: false, 
      is_critical: false, 
      field_type: 'enum',
      enum_values: ['cost_approach', 'sales_comparison', 'income_approach']
    },
    monthly_rental_estimate: { display_name: 'Monthly Rental Estimate', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    
    // Advanced Valuation Fields (NEW)
    land_value: { display_name: 'Land Value', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    building_value: { display_name: 'Building Value', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    land_price_per_sqm: { display_name: 'Land Price per sqm', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    unit_land_share_value: { display_name: 'Unit Land Share Value', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    unit_construction_cost: { display_name: 'Unit Construction Cost', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    building_value_with_profit: { display_name: 'Building Value with Profit', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    curable_depreciation_value: { display_name: 'Curable Depreciation Value', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    incurable_depreciation_value: { display_name: 'Incurable Depreciation Value', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    total_depreciation_value: { display_name: 'Total Depreciation Value', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    garage_share_description: { display_name: 'Garage Share Description', is_required: false, is_critical: false, field_type: 'string' },
    
    // Comparative Sales Analysis (Egyptian Standards)
    comparable_sale_1_address: { display_name: 'Comparable Sale 1 Address', is_required: false, is_critical: false, field_type: 'string' },
    comparable_sale_1_price: { display_name: 'Comparable Sale 1 Price', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    comparable_sale_1_area: { display_name: 'Comparable Sale 1 Area', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    comparable_sale_1_price_per_sqm: { display_name: 'Comparable Sale 1 Price/sqm', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    comparable_sale_1_age: { display_name: 'Comparable Sale 1 Age', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    comparable_sale_1_finishing: { display_name: 'Comparable Sale 1 Finishing', is_required: false, is_critical: false, field_type: 'string' },
    comparable_sale_1_floor: { display_name: 'Comparable Sale 1 Floor', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    comparable_sale_1_orientation: { display_name: 'Comparable Sale 1 Orientation', is_required: false, is_critical: false, field_type: 'string' },
    comparable_sale_1_street_view: { display_name: 'Comparable Sale 1 Street View', is_required: false, is_critical: false, field_type: 'string' },
    comparable_sale_1_sale_date: { display_name: 'Comparable Sale 1 Date', is_required: false, is_critical: false, field_type: 'string' },
    
    comparable_sale_2_address: { display_name: 'Comparable Sale 2 Address', is_required: false, is_critical: false, field_type: 'string' },
    comparable_sale_2_price: { display_name: 'Comparable Sale 2 Price', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    comparable_sale_2_area: { display_name: 'Comparable Sale 2 Area', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    comparable_sale_2_price_per_sqm: { display_name: 'Comparable Sale 2 Price/sqm', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    comparable_sale_2_age: { display_name: 'Comparable Sale 2 Age', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    comparable_sale_2_finishing: { display_name: 'Comparable Sale 2 Finishing', is_required: false, is_critical: false, field_type: 'string' },
    comparable_sale_2_floor: { display_name: 'Comparable Sale 2 Floor', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    comparable_sale_2_orientation: { display_name: 'Comparable Sale 2 Orientation', is_required: false, is_critical: false, field_type: 'string' },
    comparable_sale_2_street_view: { display_name: 'Comparable Sale 2 Street View', is_required: false, is_critical: false, field_type: 'string' },
    comparable_sale_2_sale_date: { display_name: 'Comparable Sale 2 Date', is_required: false, is_critical: false, field_type: 'string' },
    
    comparable_sale_3_address: { display_name: 'Comparable Sale 3 Address', is_required: false, is_critical: false, field_type: 'string' },
    comparable_sale_3_price: { display_name: 'Comparable Sale 3 Price', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    comparable_sale_3_area: { display_name: 'Comparable Sale 3 Area', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    comparable_sale_3_price_per_sqm: { display_name: 'Comparable Sale 3 Price/sqm', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    comparable_sale_3_age: { display_name: 'Comparable Sale 3 Age', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    comparable_sale_3_finishing: { display_name: 'Comparable Sale 3 Finishing', is_required: false, is_critical: false, field_type: 'string' },
    comparable_sale_3_floor: { display_name: 'Comparable Sale 3 Floor', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    comparable_sale_3_orientation: { display_name: 'Comparable Sale 3 Orientation', is_required: false, is_critical: false, field_type: 'string' },
    comparable_sale_3_street_view: { display_name: 'Comparable Sale 3 Street View', is_required: false, is_critical: false, field_type: 'string' },
    comparable_sale_3_sale_date: { display_name: 'Comparable Sale 3 Date', is_required: false, is_critical: false, field_type: 'string' },
    
    // Professional Certifications (Egyptian Standards)
    egyptian_standards_compliance: { display_name: 'Egyptian Standards Compliance', is_required: true, is_critical: true, field_type: 'boolean' },
    report_validity_months: { display_name: 'Report Validity (Months)', is_required: true, is_critical: true, field_type: 'number', min_value: 1, max_value: 24 },
    professional_statement_confirmed: { display_name: 'Professional Statement Confirmed', is_required: true, is_critical: true, field_type: 'boolean' },
    
    // Legal Status
    ownership_type: { 
      display_name: 'Ownership Type', 
      is_required: true, 
      is_critical: true, 
      field_type: 'enum',
      enum_values: ['freehold', 'leasehold', 'usufruct', 'ibtida2i', 'tawkeel']
    },
    title_deed_available: { display_name: 'Title Deed Available', is_required: true, is_critical: true, field_type: 'boolean' },
    building_permit_available: { display_name: 'Building Permit Available', is_required: true, is_critical: true, field_type: 'boolean' },
    occupancy_certificate: { display_name: 'Occupancy Certificate', is_required: true, is_critical: true, field_type: 'boolean' },
    real_estate_tax_paid: { display_name: 'Real Estate Tax Paid', is_required: true, is_critical: true, field_type: 'boolean' },
    
    // ADDITIONAL EXTRACTED FIELDS (from Gemini extraction)
    owner_name: { display_name: 'Owner Name', is_required: false, is_critical: false, field_type: 'string' },
    occupancy_status: { display_name: 'Occupancy Status', is_required: false, is_critical: false, field_type: 'string' },
    remaining_building_life_years: { display_name: 'Remaining Building Life (Years)', is_required: false, is_critical: false, field_type: 'number', min_value: 0, max_value: 200 },
    total_units_in_building: { display_name: 'Total Units in Building', is_required: false, is_critical: false, field_type: 'number', min_value: 1, max_value: 1000 },
    property_boundaries: { display_name: 'Property Boundaries', is_required: false, is_critical: false, field_type: 'string' },
    construction_cost_per_sqm: { display_name: 'Construction Cost per SqM', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    total_depreciation_value: { display_name: 'Total Depreciation Value', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    price_per_sqm_land: { display_name: 'Price per SqM Land', is_required: false, is_critical: false, field_type: 'number', min_value: 0 },
    estimated_selling_time: { display_name: 'Estimated Selling Time (Months)', is_required: false, is_critical: false, field_type: 'number', min_value: 0, max_value: 60 }
  };

  /**
   * Generate comprehensive mapping report
   */
  public generateMappingReport(extractedData: ExtractedAppraisalData): AppraisalMappingReport {
    const fieldMappings: AppraisalFieldMapping[] = [];
    const warnings: AppraisalMappingReport['warnings'] = [];
    const unmappedDataItems: AppraisalMappingReport['unmapped_data_items'] = [];

    let successfullyMapped = 0;
    let missingCritical = 0;
    let lowConfidence = 0;

    // Analyze each form field
    for (const [fieldName, definition] of Object.entries(this.FORM_FIELD_DEFINITIONS)) {
      const extractedValue = (extractedData as any)[fieldName];
      const confidenceScore = extractedData.confidence_scores?.[fieldName];
      const hasValue = extractedValue !== undefined && extractedValue !== null;

      let warningLevel: AppraisalFieldMapping['warning_level'] = 'none';
      let warningMessage: string | undefined;

      // Check if field was successfully extracted
      if (hasValue) {
        successfullyMapped++;
        
        // Check confidence level
        if (confidenceScore && confidenceScore < 0.6) {
          lowConfidence++;
          warningLevel = 'warning';
          warningMessage = `Low confidence extraction (${Math.round(confidenceScore * 100)}%)`;
          
          warnings.push({
            type: 'low_confidence',
            field: fieldName,
            message: warningMessage,
            suggestion: 'Please verify this field manually',
            severity: 'medium'
          });
        }
        
        // Validate extracted value
        const validationResult = this.validateFieldValue(fieldName, extractedValue, definition);
        if (!validationResult.isValid) {
          warningLevel = 'error';
          warningMessage = validationResult.errorMessage;
          
          warnings.push({
            type: 'validation_error',
            field: fieldName,
            message: validationResult.errorMessage || 'Validation failed',
            severity: 'high'
          });
        }
      } else {
        // Field is missing
        if (definition.is_critical) {
          missingCritical++;
          warningLevel = 'error';
          warningMessage = 'Critical field is missing';
          
          warnings.push({
            type: 'missing_critical',
            field: fieldName,
            message: 'Critical field missing - manual input required',
            severity: 'high'
          });
        } else if (definition.is_required) {
          warningLevel = 'warning';
          warningMessage = 'Required field is missing';
        } else {
          warningLevel = 'info';
          warningMessage = 'Optional field not found';
        }
      }

      fieldMappings.push({
        field_name: fieldName,
        display_name: definition.display_name,
        is_required: definition.is_required,
        is_critical: definition.is_critical,
        form_field_exists: true,
        extracted_successfully: hasValue,
        confidence_score: confidenceScore,
        warning_level: warningLevel,
        warning_message: warningMessage
      });
    }

    // Process unmapped additional data
    if (extractedData.unmapped_data) {
      for (const [key, value] of Object.entries(extractedData.unmapped_data)) {
        unmappedDataItems.push({
          key,
          value,
          suggestion: this.getSuggestionForUnmappedField(key, value)
        });

        warnings.push({
          type: 'unmapped_data',
          field: key,
          message: `Additional data found: ${key} = ${value}`,
          suggestion: this.getSuggestionForUnmappedField(key, value),
          severity: 'low'
        });
      }
    }

    const totalFormFields = Object.keys(this.FORM_FIELD_DEFINITIONS).length;
    const overallCompleteness = (successfullyMapped / totalFormFields) * 100;

    return {
      total_extracted_fields: Object.keys(extractedData).filter(key => 
        !['unmapped_data', 'extraction_warnings', 'confidence_scores'].includes(key)
      ).length,
      total_form_fields: totalFormFields,
      successfully_mapped_fields: successfullyMapped,
      missing_critical_fields: missingCritical,
      low_confidence_fields: lowConfidence,
      unmapped_additional_data: unmappedDataItems.length,
      overall_completeness_percentage: overallCompleteness,
      field_mappings: fieldMappings,
      unmapped_data_items: unmappedDataItems,
      warnings
    };
  }

  /**
   * Validate field value against definition
   */
  private validateFieldValue(fieldName: string, value: any, definition: any): { isValid: boolean; errorMessage?: string } {
    if (value === null || value === undefined) {
      return { isValid: false, errorMessage: 'Value is null or undefined' };
    }

    switch (definition.field_type) {
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { isValid: false, errorMessage: 'Value must be a number' };
        }
        if (definition.min_value !== undefined && value < definition.min_value) {
          return { isValid: false, errorMessage: `Value must be at least ${definition.min_value}` };
        }
        if (definition.max_value !== undefined && value > definition.max_value) {
          return { isValid: false, errorMessage: `Value must not exceed ${definition.max_value}` };
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          return { isValid: false, errorMessage: 'Value must be true or false' };
        }
        break;

      case 'enum':
        if (definition.enum_values && !definition.enum_values.includes(value)) {
          return { 
            isValid: false, 
            errorMessage: `Value must be one of: ${definition.enum_values.join(', ')}` 
          };
        }
        break;

      case 'string':
        if (typeof value !== 'string') {
          return { isValid: false, errorMessage: 'Value must be a string' };
        }
        if (value.trim().length === 0) {
          return { isValid: false, errorMessage: 'String value cannot be empty' };
        }
        break;

      case 'record':
        if (typeof value !== 'object' || Array.isArray(value)) {
          return { isValid: false, errorMessage: 'Value must be an object' };
        }
        break;
    }

    return { isValid: true };
  }

  /**
   * Generate suggestion for unmapped field
   */
  private getSuggestionForUnmappedField(key: string, value: any): string {
    const keyLower = key.toLowerCase();
    
    // Suggest potential form fields that might match
    if (keyLower.includes('orientation')) {
      return 'Consider adding to comparable sales orientation fields or property notes';
    }
    if (keyLower.includes('balcony') && keyLower.includes('count')) {
      return 'This could be related to balcony_area_sqm field';
    }
    if (keyLower.includes('maintenance')) {
      return 'Consider adding to property notes or creating a maintenance cost field';
    }
    if (keyLower.includes('facilities') || keyLower.includes('amenities')) {
      return 'Consider adding to property notes or creating an amenities field';
    }
    if (keyLower.includes('landmarks') || keyLower.includes('nearby')) {
      return 'This location information could be valuable - consider adding to form';
    }
    if (keyLower.includes('transportation')) {
      return 'Transportation access affects property value - consider adding to location factors';
    }
    
    return 'Consider adding to property notes or evaluate if this should be a new form field';
  }

  /**
   * Generate UI warnings for display in the form
   */
  public generateUIWarnings(mappingReport: AppraisalMappingReport): Array<{
    id: string;
    type: 'error' | 'warning' | 'info';
    title: string;
    message: string;
    fieldName?: string;
    action?: 'review' | 'input_required' | 'verify' | 'add_to_notes';
  }> {
    const uiWarnings = [];

    for (const warning of mappingReport.warnings) {
      let type: 'error' | 'warning' | 'info' = 'info';
      let action: 'review' | 'input_required' | 'verify' | 'add_to_notes' = 'review';

      switch (warning.severity) {
        case 'high':
          type = 'error';
          action = warning.type === 'missing_critical' ? 'input_required' : 'review';
          break;
        case 'medium':
          type = 'warning';
          action = 'verify';
          break;
        case 'low':
          type = 'info';
          action = warning.type === 'unmapped_data' ? 'add_to_notes' : 'review';
          break;
      }

      uiWarnings.push({
        id: `${warning.type}_${warning.field}`,
        type,
        title: this.getWarningTitle(warning.type),
        message: warning.message,
        fieldName: warning.field,
        action
      });
    }

    return uiWarnings;
  }

  private getWarningTitle(type: string): string {
    switch (type) {
      case 'missing_critical':
        return 'Critical Field Missing';
      case 'low_confidence':
        return 'Low Confidence Extraction';
      case 'unmapped_data':
        return 'Additional Data Found';
      case 'validation_error':
        return 'Validation Error';
      default:
        return 'Field Warning';
    }
  }
}