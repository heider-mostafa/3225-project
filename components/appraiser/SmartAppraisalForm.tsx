'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calculator, MapPin, Home, FileText, Camera, Loader2, Zap, TrendingUp, Scale, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import PropertyDescriptionSection from './PropertyDescriptionSection';
import LocationPickerSection from './LocationPickerSection';

// Form validation schema
const appraisalFormSchema = z.object({
  // Header Information
  client_name: z.string().min(1, 'Client name is required'),
  requested_by: z.string().min(1, 'Requested by is required'),
  
  // Professional Information (NEW FIELDS)
  appraiser_name: z.string().min(1, 'Appraiser name is required'),
  registration_number: z.string().min(1, 'Registration number is required'),
  appraisal_valid_until: z.string().min(1, 'Validity date is required'),
  report_type: z.enum(['full_appraisal', 'update', 'summary', 'restricted']),
  owner_name: z.string().optional(),
  
  // Property Basic Info
  property_address_arabic: z.string().min(1, 'Arabic address is required'),
  property_address_english: z.string().min(1, 'English address is required'),
  district_name: z.string().min(1, 'District is required'),
  city_name: z.string().min(1, 'City is required'),
  governorate: z.string().min(1, 'Governorate is required'),
  property_boundaries: z.string().optional(),
  
  // Location Information
  location_data: z.object({
    latitude: z.number(),
    longitude: z.number(),
    formatted_address: z.string(),
    place_id: z.string().optional(),
    confidence_score: z.number(),
    address_components: z.object({
      street_number: z.string().optional(),
      route: z.string().optional(),
      neighborhood: z.string().optional(),
      locality: z.string().optional(),
      administrative_area_level_1: z.string().optional(),
      country: z.string().optional(),
      postal_code: z.string().optional(),
    }),
    location_type: z.enum(['ROOFTOP', 'RANGE_INTERPOLATED', 'GEOMETRIC_CENTER', 'APPROXIMATE']),
    last_updated: z.string(),
    source: z.enum(['auto_geocoded', 'manual_pin', 'search_result'])
  }).optional(),
  
  // Building Information
  building_number: z.string().optional(),
  floor_number: z.number().min(0).optional(),
  unit_number: z.string().optional(),
  entrance: z.string().optional(),
  building_age_years: z.number().min(0).max(200),
  effective_building_age_years: z.number().min(0).max(200).optional(),
  economic_building_life_years: z.number().min(1).max(200),
  remaining_building_life_years: z.number().min(0).max(200).optional(),
  construction_type: z.enum(['concrete', 'brick', 'steel', 'mixed']),
  
  // Basic Property Information (MISSING FIELDS ADDED)
  property_type: z.enum(['apartment', 'villa', 'townhouse', 'penthouse', 'studio', 'duplex', 'commercial', 'industrial', 'land']),
  bedrooms: z.number().min(0).max(20),
  bathrooms: z.number().min(0).max(20),
  reception_rooms: z.number().min(0).max(10).optional(),
  kitchens: z.number().min(0).max(5).optional(),
  parking_spaces: z.number().min(0).max(20).optional(),
  total_floors: z.number().min(1).max(100).optional(),
  year_built: z.number().min(1800).max(new Date().getFullYear()).optional(),
  
  // Area Measurements
  land_area_sqm: z.number().min(1),
  built_area_sqm: z.number().min(1),
  unit_area_sqm: z.number().min(1),
  balcony_area_sqm: z.number().min(0).optional(),
  garage_area_sqm: z.number().min(0).optional(),
  total_building_area_sqm: z.number().min(1).optional(),
  unit_land_share_sqm: z.number().min(0).optional(),
  
  // Technical Specifications
  finishing_level: z.enum(['core_shell', 'semi_finished', 'fully_finished', 'luxury']),
  floor_materials: z.record(z.string()).optional(),
  wall_finishes: z.record(z.string()).optional(),
  ceiling_type: z.enum(['suspended', 'concrete', 'decorative', 'gypsum_board', 'wood', 'metal', 'pvc', 'acoustic', 'plastic_paint']).optional(),
  windows_type: z.enum(['aluminum', 'wood', 'upvc', 'steel']).optional(),
  doors_type: z.string().optional(),
  electrical_system_description: z.string().optional(),
  sanitary_ware_description: z.string().optional(),
  exterior_finishes_description: z.string().optional(),
  
  // General Materials (parsed from extraction)
  general_floor_materials: z.array(z.string()).optional(),
  general_wall_materials: z.array(z.string()).optional(), 
  general_exterior_materials: z.array(z.string()).optional(),
  
  // Condition Assessment
  overall_condition_rating: z.number().min(1).max(10),
  structural_condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  mechanical_systems_condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  exterior_condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  interior_condition: z.enum(['excellent', 'good', 'fair', 'poor']),
  
  // Utilities and Services (NEW)
  electricity_available: z.boolean(),
  water_supply_available: z.boolean(),
  sewage_system_available: z.boolean(),
  gas_supply_available: z.boolean(),
  telephone_available: z.boolean(),
  internet_fiber_available: z.boolean(),
  elevator_available: z.boolean(),
  parking_available: z.boolean(),
  security_system: z.boolean(),
  nearby_services: z.string().optional(),
  
  // Location Factors
  street_width_meters: z.number().min(0).optional(),
  accessibility_rating: z.number().min(1).max(10),
  noise_level: z.enum(['low', 'moderate', 'high']),
  view_quality: z.enum(['excellent', 'good', 'average', 'poor']),
  neighborhood_quality_rating: z.number().min(1).max(10),
  location_description: z.string().optional(),
  construction_volume: z.number().min(0).optional(),
  funding_source: z.string().optional(),
  area_character: z.string().optional(),
  
  // Market Analysis (NEW)
  market_trend: z.enum(['rising', 'stable', 'declining']).optional(),
  demand_supply_ratio: z.number().min(0).max(5).optional(),
  price_per_sqm_area: z.number().min(0).optional(),
  time_to_sell: z.number().min(0).max(60).optional(),
  price_per_sqm_semi_finished: z.number().min(0).optional(),
  price_per_sqm_fully_finished: z.number().min(0).optional(),
  
  // Economic Analysis (EGYPTIAN STANDARDS)
  economic_life_years: z.number().min(1).max(200),
  current_age_ratio: z.number().min(0).max(100).optional(),
  depreciation_rate_annual: z.number().min(0).max(20).optional(),
  replacement_cost_new: z.number().min(0).optional(),
  
  // Location Analysis (EGYPTIAN STANDARDS)
  street_type: z.enum(['main_street', 'side_street', 'internal_street']).optional(),
  commercial_percentage: z.number().min(0).max(100).optional(),
  market_activity: z.enum(['rising', 'stable', 'declining']).optional(),
  property_liquidity: z.enum(['high', 'medium', 'low']).optional(),
  time_on_market_months: z.number().min(0).max(60).optional(),
  area_density: z.enum(['crowded', 'moderate', 'sparse']).optional(),
  
  // Land Valuation (EGYPTIAN STANDARDS)
  land_value_per_sqm: z.number().min(0).optional(),
  total_building_land_area: z.number().min(0).optional(),
  land_use_classification: z.string().optional(),
  highest_best_use_confirmed: z.boolean().optional(),
  
  // Room Specifications (DETAILED - Egyptian Standards)
  reception_flooring: z.enum(['ceramic', 'marble', 'granite', 'parquet', 'laminate', 'vinyl', 'carpet', 'terrazzo']).optional(),
  kitchen_flooring: z.enum(['ceramic', 'granite', 'marble', 'porcelain', 'vinyl', 'natural_stone']).optional(),
  bathroom_flooring: z.enum(['ceramic', 'porcelain', 'marble', 'granite', 'mosaic', 'natural_stone']).optional(),
  bedroom_flooring: z.enum(['parquet', 'laminate', 'ceramic', 'marble', 'carpet', 'vinyl']).optional(),
  terrace_flooring: z.enum(['ceramic', 'granite', 'marble', 'natural_stone', 'concrete', 'tiles']).optional(),
  reception_walls: z.enum(['plastic_paint', 'oil_paint', 'wallpaper', 'stone_cladding', 'wood_panels', 'gypsum_board']).optional(),
  kitchen_walls: z.enum(['ceramic_tiles', 'granite', 'marble', 'stainless_steel', 'glass', 'plastic_paint']).optional(),
  bathroom_walls: z.enum(['ceramic_tiles', 'porcelain', 'marble', 'granite', 'mosaic', 'waterproof_paint']).optional(),
  bedroom_walls: z.enum(['plastic_paint', 'oil_paint', 'wallpaper', 'wood_panels', 'gypsum_board']).optional(),
  
  // Valuation Methods Results (EGYPTIAN STANDARDS)
  cost_approach_value: z.number().min(0).optional(),
  sales_comparison_value: z.number().min(0).optional(),
  income_approach_value: z.number().min(0).optional(),
  final_reconciled_value: z.number().min(0).optional(),
  recommended_valuation_method: z.enum(['cost_approach', 'sales_comparison', 'income_approach']).optional(),
  monthly_rental_estimate: z.number().min(0).optional(),
  
  // Advanced Valuation Fields (NEW)
  land_value: z.number().min(0).optional(),
  building_value: z.number().min(0).optional(),
  land_price_per_sqm: z.number().min(0).optional(),
  unit_land_share_value: z.number().min(0).optional(),
  unit_construction_cost: z.number().min(0).optional(),
  construction_cost_per_sqm: z.number().min(0).optional(),
  building_value_with_profit: z.number().min(0).optional(),
  curable_depreciation_value: z.number().min(0).optional(),
  incurable_depreciation_value: z.number().min(0).optional(),
  total_depreciation_value: z.number().min(0).optional(),
  garage_share_description: z.string().optional(),
  
  // Comparative Sales Analysis (EGYPTIAN STANDARDS)
  comparable_sale_1_address: z.string().optional(),
  comparable_sale_1_price: z.number().min(0).optional(),
  comparable_sale_1_area: z.number().min(0).optional(),
  comparable_sale_1_price_per_sqm: z.number().min(0).optional(),
  comparable_sale_1_age: z.number().min(0).optional(),
  comparable_sale_1_finishing: z.enum(['core_shell', 'semi_finished', 'fully_finished', 'luxury']).optional(),
  comparable_sale_1_floor: z.number().min(0).optional(),
  comparable_sale_1_orientation: z.enum(['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest']).optional(),
  comparable_sale_1_street_view: z.enum(['garden_view', 'main_street', 'side_street', 'internal_street', 'sea_view', 'nile_view', 'park_view', 'building_view']).optional(),
  comparable_sale_1_sale_date: z.string().optional(),
  
  comparable_sale_2_address: z.string().optional(),
  comparable_sale_2_price: z.number().min(0).optional(),
  comparable_sale_2_area: z.number().min(0).optional(),
  comparable_sale_2_price_per_sqm: z.number().min(0).optional(),
  comparable_sale_2_age: z.number().min(0).optional(),
  comparable_sale_2_finishing: z.enum(['core_shell', 'semi_finished', 'fully_finished', 'luxury']).optional(),
  comparable_sale_2_floor: z.number().min(0).optional(),
  comparable_sale_2_orientation: z.enum(['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest']).optional(),
  comparable_sale_2_street_view: z.enum(['garden_view', 'main_street', 'side_street', 'internal_street', 'sea_view', 'nile_view', 'park_view', 'building_view']).optional(),
  comparable_sale_2_sale_date: z.string().optional(),
  
  comparable_sale_3_address: z.string().optional(),
  comparable_sale_3_price: z.number().min(0).optional(),
  comparable_sale_3_area: z.number().min(0).optional(),
  comparable_sale_3_price_per_sqm: z.number().min(0).optional(),
  comparable_sale_3_age: z.number().min(0).optional(),
  comparable_sale_3_finishing: z.enum(['core_shell', 'semi_finished', 'fully_finished', 'luxury']).optional(),
  comparable_sale_3_floor: z.number().min(0).optional(),
  comparable_sale_3_orientation: z.enum(['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest']).optional(),
  comparable_sale_3_street_view: z.enum(['garden_view', 'main_street', 'side_street', 'internal_street', 'sea_view', 'nile_view', 'park_view', 'building_view']).optional(),
  comparable_sale_3_sale_date: z.string().optional(),
  
  // Professional Certifications (EGYPTIAN STANDARDS)
  egyptian_standards_compliance: z.boolean().optional(),
  report_validity_months: z.number().min(1).max(24).optional(),
  professional_statement_confirmed: z.boolean().optional(),
  
  // Legal Status
  ownership_type: z.enum(['freehold', 'leasehold', 'usufruct', 'ibtida2i', 'tawkeel']),
  title_deed_available: z.boolean(),
  building_permit_available: z.boolean(),
  occupancy_certificate: z.boolean(),
  real_estate_tax_paid: z.boolean(),
  
  // Egyptian Legal Standards - NEW ADDITION
  egyptian_legal_standards: z.object({
    // Standard Compliance Flags
    standards_compliance: z.boolean().default(true),
    fra_resolution_number: z.string().default("39"),
    fra_resolution_year: z.string().default("2015"),
    fra_resolution_date: z.string().default("2015-04-19"),
    market_value_definition_confirmed: z.boolean().default(true),
    ownership_disputes_confirmed: z.boolean().default(false),
    physical_inspection_completed: z.boolean().default(true),
    highest_best_use_applied: z.boolean().default(true),
    professional_independence_declared: z.boolean().default(true),
    
    // Variable Fields - Property Specific
    property_address_arabic: z.string().default(""),
    property_address_english: z.string().default(""),
    building_number: z.string().default(""),
    unit_number: z.string().default(""),
    floor_number: z.string().default(""),
    property_type_arabic: z.string().default(""),
    property_type_english: z.string().default(""),
    
    // Variable Fields - Client Information
    client_name_arabic: z.string().default(""),
    client_name_english: z.string().default(""),
    requesting_entity_arabic: z.string().default(""),
    requesting_entity_english: z.string().default(""),
    
    // Variable Fields - Appraiser Information
    appraiser_name_arabic: z.string().default(""),
    appraiser_name_english: z.string().default(""),
    appraiser_license_number: z.string().default(""),
    appraiser_certification_authority: z.string().default("الهيئة العامة للرقابة المالية"),
    
    // Variable Fields - Report Dates
    report_validity_period_months: z.number().min(1).max(24).default(12),
    inspection_date: z.string().default(""),
    report_issue_date: z.string().default(""),
    signature_date: z.string().default(""),
    
    // Professional Certification Points (10 points)
    certification_points_confirmed: z.array(z.boolean()).length(10).default(new Array(10).fill(true))
  }).optional(),
});

type AppraisalFormData = z.infer<typeof appraisalFormSchema>;

interface CalculationResult {
  market_value_estimate: number;
  land_value: number;
  building_value: number;
  depreciation_percentage: number;
  price_per_sqm: number;
  confidence_level: number;
  calculation_breakdown: {
    base_building_cost: number;
    age_depreciation: number;
    condition_adjustment: number;
    location_adjustment: number;
    market_adjustment: number;
  };
}

interface District {
  name: string;
  key: string;
  average_price_per_sqm: number;
  market_trend: string;
}

export function SmartAppraisalForm({ 
  propertyId, 
  onSave, 
  initialData 
}: { 
  propertyId?: string; 
  onSave?: (data: any) => void;
  initialData?: any;
}) {
  const { t } = useTranslation();
  const [calculations, setCalculations] = useState<CalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [districts, setDistricts] = useState<District[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [extractedImages, setExtractedImages] = useState<any[]>([]);
  const [descriptionData, setDescriptionData] = useState<{
    description: string;
    marketing_headline: string;
    key_features: string[];
  } | null>(null);

  // Location data state management
  const [locationData, setLocationData] = useState<{
    latitude: number;
    longitude: number;
    formatted_address: string;
    place_id?: string;
    confidence_score: number;
    address_components: {
      street_number?: string;
      route?: string;
      neighborhood?: string;
      locality?: string;
      administrative_area_level_1?: string;
      country?: string;
      postal_code?: string;
    };
    location_type: 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE';
    last_updated: string;
    source: 'auto_geocoded' | 'manual_pin' | 'search_result';
  } | null>(null);

  // Merge initialData with form_data
  const getInitialValues = () => {
    if (!initialData) return {};
    
    console.log('🔍 ⚠️ GETINITIALVALUES CALLED - POTENTIAL LOOP SOURCE:', {
      hasFormData: !!initialData.form_data,
      totalTopLevelKeys: Object.keys(initialData).length,
      topLevelKeys: Object.keys(initialData).slice(0, 10),
      formDataKeys: initialData.form_data ? Object.keys(initialData.form_data).length : 0,
      timestamp: Date.now(),
      callStack: new Error().stack?.split('\n').slice(1, 4).join(' | ')
    });
    
    // FIXED: Handle both structures - form_data nested OR all fields at top level
    let extractedValues;
    
    if (initialData.form_data && Object.keys(initialData.form_data).length > 0) {
      // Legacy structure: data is in form_data
      console.log('📁 Using nested form_data structure');
      extractedValues = {
        ...initialData.form_data,
        client_name: initialData.client_name,
        requested_by: initialData.requested_by,
        market_value_estimate: initialData.market_value_estimate,
        confidence_level: initialData.confidence_level,
      };
    } else {
      // NEW: Gemini structure - all fields at top level
      console.log('🎯 Using flat top-level structure (Gemini extraction)');
      extractedValues = { ...initialData };
    }
    
    console.log('📋 Final extracted values preview:', {
      totalFields: Object.keys(extractedValues).length,
      client_name: extractedValues.client_name,
      property_type: extractedValues.property_type,
      unit_area_sqm: extractedValues.unit_area_sqm,
      final_reconciled_value: extractedValues.final_reconciled_value,
      hasCalculations: !!extractedValues.calculations
    });
    
    return extractedValues;
  };

  // Load extracted images from initialData
  useEffect(() => {
    if (initialData?.extracted_images) {
      console.log('🖼️ Loading extracted images:', initialData.extracted_images.length);
      setExtractedImages(initialData.extracted_images);
    }
  }, [initialData]);

  // CRITICAL FIX: Reset form with extracted data when initialData changes
  useEffect(() => {
    if (initialData) {
      console.log('🔄 USEEFFECT TRIGGERED - Populating form with extracted data:', {
        hasFormData: !!initialData.form_data,
        topLevelFields: Object.keys(initialData).length,
        clientName: initialData.client_name,
        timestamp: Date.now()
      });
      
      // INLINE VALUES EXTRACTION - avoid function call loops
      let extractedValues;
      if (initialData.form_data && Object.keys(initialData.form_data).length > 0) {
        // Legacy structure: data is in form_data
        console.log('📁 Using nested form_data structure');
        extractedValues = {
          ...initialData.form_data,
          client_name: initialData.client_name,
          requested_by: initialData.requested_by,
          market_value_estimate: initialData.market_value_estimate,
          confidence_level: initialData.confidence_level,
        };
      } else {
        // NEW: Gemini structure - all fields at top level
        console.log('🎯 Using flat top-level structure (Gemini extraction)');
        extractedValues = { ...initialData };
      }
      
      console.log('📋 Form values being applied:', {
        totalFields: Object.keys(extractedValues).length,
        populatedFields: Object.entries(extractedValues).filter(([_, v]) => v && v !== '').length,
        client_name: extractedValues.client_name,
        property_type: extractedValues.property_type,
        unit_area_sqm: extractedValues.unit_area_sqm,
        final_reconciled_value: extractedValues.final_reconciled_value
      });
      
      // Use setTimeout to avoid potential circular dependency issues
      setTimeout(() => {
        try {
          // Reset form with extracted values - this populates ALL fields
          form.reset(extractedValues);
          
          // Enhanced Room Specification Auto-Population
          if (extractedValues.general_floor_materials?.length) {
            console.log('🏠 Enhancing room specifications with general materials:', extractedValues.general_floor_materials);
            
            // Auto-populate room flooring fields from general materials if not already set
            const roomFlooringFields = ['reception_flooring', 'kitchen_flooring', 'bathroom_flooring', 'bedroom_flooring', 'terrace_flooring'];
            
            roomFlooringFields.forEach(roomField => {
              const currentValue = extractedValues[roomField];
              if (!currentValue && extractedValues.general_floor_materials?.length) {
                // Find the first material that matches the room's available options
                let bestMatch = null;
                
                // Room-specific material preferences
                const roomPreferences: Record<string, string[]> = {
                  'reception_flooring': ['ceramic', 'porcelain', 'marble', 'granite', 'parquet', 'laminate'],
                  'kitchen_flooring': ['ceramic', 'porcelain', 'granite', 'marble', 'natural_stone'],
                  'bathroom_flooring': ['ceramic', 'porcelain', 'marble', 'granite', 'mosaic', 'natural_stone'],
                  'bedroom_flooring': ['parquet', 'laminate', 'ceramic', 'marble', 'carpet', 'vinyl'],
                  'terrace_flooring': ['ceramic', 'granite', 'marble', 'natural_stone', 'concrete', 'tiles']
                };
                
                // Check if any extracted materials match room preferences
                const preferences = roomPreferences[roomField] || [];
                bestMatch = extractedValues.general_floor_materials.find((material: string) => 
                  preferences.includes(material)
                );
                
                if (bestMatch) {
                  console.log(`🎯 Auto-setting ${roomField} to ${bestMatch} from general materials`);
                  setTimeout(() => form.setValue(roomField as keyof AppraisalFormData, bestMatch), 50);
                }
              }
            });
          }
          
          // Enhanced Wall Specification Auto-Population
          if (extractedValues.general_wall_materials?.length) {
            console.log('🏠 Enhancing wall specifications with general materials:', extractedValues.general_wall_materials);
            
            // Auto-populate room wall fields from general materials if not already set
            const roomWallFields = ['reception_walls', 'kitchen_walls', 'bathroom_walls', 'bedroom_walls'];
            
            roomWallFields.forEach(roomField => {
              const currentValue = extractedValues[roomField];
              if (!currentValue && extractedValues.general_wall_materials?.length) {
                // Find the first material that matches the room's available options
                let bestMatch = null;
                
                // Room-specific wall material preferences
                const roomWallPreferences: Record<string, string[]> = {
                  'reception_walls': ['plastic_paint', 'oil_paint', 'wallpaper', 'stone_cladding', 'wood_panels', 'gypsum_board'],
                  'kitchen_walls': ['ceramic_tiles', 'granite', 'marble', 'stainless_steel', 'glass', 'plastic_paint'],
                  'bathroom_walls': ['ceramic_tiles', 'porcelain', 'marble', 'granite', 'mosaic', 'waterproof_paint'],
                  'bedroom_walls': ['plastic_paint', 'oil_paint', 'wallpaper', 'wood_panels', 'gypsum_board']
                };
                
                // Check if any extracted wall materials match room preferences
                const preferences = roomWallPreferences[roomField] || [];
                bestMatch = extractedValues.general_wall_materials.find((material: string) => 
                  preferences.includes(material)
                );
                
                if (bestMatch) {
                  console.log(`🎯 Auto-setting ${roomField} to ${bestMatch} from general materials`);
                  setTimeout(() => form.setValue(roomField as keyof AppraisalFormData, bestMatch), 100);
                }
              }
            });
          }
          
          // Set calculation state if we have extracted valuation data
          if (extractedValues.final_reconciled_value) {
            console.log('💰 Marking as calculated with extracted value:', extractedValues.final_reconciled_value);
            setHasCalculated(true);
            setCalculations({
              market_value_estimate: extractedValues.final_reconciled_value,
              land_value: extractedValues.land_value || 0,
              building_value: extractedValues.building_value || extractedValues.final_reconciled_value * 0.7,
              depreciation_percentage: 0, // Default, will be calculated if needed
              price_per_sqm: extractedValues.unit_area_sqm ? 
                Math.round(extractedValues.final_reconciled_value / extractedValues.unit_area_sqm) : 0,
              confidence_level: extractedValues.confidence_level || 0.95,
              calculation_breakdown: {
                base_building_cost: extractedValues.building_value || extractedValues.final_reconciled_value * 0.7,
                age_depreciation: 0,
                condition_adjustment: 0,
                location_adjustment: 0,
                market_adjustment: 0
              }
            });
          }
          console.log('✅ Form successfully populated with extracted data');
        } catch (error) {
          console.error('❌ Error populating form:', error);
        }
      }, 100);
    }
  }, [initialData]);

  // Initialize location data from form_data if available
  useEffect(() => {
    if (initialData?.form_data?.location_data) {
      console.log('📍 Initializing location data from form_data:', initialData.form_data.location_data);
      setLocationData(initialData.form_data.location_data);
    }
  }, [initialData]);

  // CALL getInitialValues ONLY ONCE to prevent loops - use useMemo
  const initialValues = useMemo(() => getInitialValues(), [initialData]);

  const form = useForm<AppraisalFormData>({
    resolver: zodResolver(appraisalFormSchema),
    defaultValues: {
      ...initialValues,
      // Fallback defaults
      client_name: initialValues.client_name || '',
      requested_by: initialValues.requested_by || '',
      property_address_arabic: initialValues.property_address_arabic || '',
      property_address_english: initialValues.property_address_english || '',
      district_name: initialValues.district_name || '',
      city_name: initialValues.city_name || 'Cairo',
      governorate: initialValues.governorate || 'Cairo',
      building_age_years: initialValues.building_age_years || 0,
      construction_type: initialValues.construction_type || 'concrete',
      // Basic Property Information defaults
      property_type: initialValues.property_type || 'apartment',
      bedrooms: initialValues.bedrooms || 0,
      bathrooms: initialValues.bathrooms || 0,
      reception_rooms: initialValues.reception_rooms || 0,
      kitchens: initialValues.kitchens || 1,
      parking_spaces: initialValues.parking_spaces || 0,
      total_floors: initialValues.total_floors || null,
      year_built: initialValues.year_built || null,
      land_area_sqm: initialValues.land_area_sqm || 0,
      built_area_sqm: initialValues.built_area_sqm || 0,
      unit_area_sqm: initialValues.unit_area_sqm || 0,
      balcony_area_sqm: initialValues.balcony_area_sqm || 0,
      garage_area_sqm: initialValues.garage_area_sqm || 0,
      finishing_level: initialValues.finishing_level || 'fully_finished',
      overall_condition_rating: initialValues.overall_condition_rating || 7,
      structural_condition: initialValues.structural_condition || 'good',
      mechanical_systems_condition: initialValues.mechanical_systems_condition || 'good',
      exterior_condition: initialValues.exterior_condition || 'good',
      interior_condition: initialValues.interior_condition || 'good',
      // Utilities and Services defaults
      electricity_available: true,
      water_supply_available: true,
      sewage_system_available: true,
      gas_supply_available: true,
      internet_fiber_available: false,
      elevator_available: false,
      parking_available: false,
      security_system: false,
      accessibility_rating: 7,
      noise_level: 'moderate',
      view_quality: 'good',
      neighborhood_quality_rating: 7,
      // Egyptian Standards defaults
      economic_life_years: 60,
      street_type: 'side_street',
      market_activity: 'stable',
      property_liquidity: 'medium',
      area_density: 'moderate',
      highest_best_use_confirmed: true,
      egyptian_standards_compliance: true,
      report_validity_months: 12,
      professional_statement_confirmed: true,
      ownership_type: 'freehold',
      title_deed_available: false,
      building_permit_available: false,
      occupancy_certificate: false,
      real_estate_tax_paid: false,
      
      // Egyptian Legal Standards defaults
      egyptian_legal_standards: {
        standards_compliance: true,
        fra_resolution_number: "39",
        fra_resolution_year: "2015",
        fra_resolution_date: "2015-04-19",
        market_value_definition_confirmed: true,
        ownership_disputes_confirmed: false,
        physical_inspection_completed: true,
        highest_best_use_applied: true,
        professional_independence_declared: true,
        
        property_address_arabic: initialValues.property_address_arabic || "",
        property_address_english: initialValues.property_address_english || "",
        building_number: initialValues.building_number || "",
        unit_number: initialValues.unit_number || "",
        floor_number: initialValues.floor_number?.toString() || "",
        property_type_arabic: initialValues.property_type === "duplex" ? "دوبلكس" : initialValues.property_type === "apartment" ? "شقة" : "",
        property_type_english: initialValues.property_type || "",
        
        client_name_arabic: initialValues.client_name || "",
        client_name_english: "",
        requesting_entity_arabic: initialValues.requested_by || "",
        requesting_entity_english: "",
        
        appraiser_name_arabic: initialValues.appraiser_name || "",
        appraiser_name_english: "",
        appraiser_license_number: "",
        appraiser_certification_authority: "الهيئة العامة للرقابة المالية",
        
        report_validity_period_months: 12,
        inspection_date: initialValues.appraisal_date || new Date().toISOString().split('T')[0],
        report_issue_date: new Date().toISOString().split('T')[0],
        signature_date: new Date().toISOString().split('T')[0],
        
        certification_points_confirmed: new Array(10).fill(true)
      },
    },
  });

  // Load districts data
  useEffect(() => {
    loadDistrictsData();
  }, []);

  const loadDistrictsData = async () => {
    try {
      const response = await fetch('/api/appraisals/calculate');
      const result = await response.json();
      if (result.success && result.data.districts) {
        setDistricts(result.data.districts);
      }
    } catch (error) {
      console.error('Failed to load districts data:', error);
    }
  };

  // Smart auto-calculate: calculate once when required fields are filled
  const watchedFields = form.watch(['built_area_sqm', 'building_age_years', 'overall_condition_rating', 'district_name']);
  
  useEffect(() => {
    const [builtArea, age, condition, district] = watchedFields;
    
    // Only auto-calculate if:
    // 1. All required fields are filled
    // 2. Not currently calculating
    // 3. Haven't calculated yet (first time only)
    if (builtArea && age !== undefined && condition && district && !isCalculating && !hasCalculated) {
      console.log('Auto-calculating property value (first time)...');
      const timer = setTimeout(() => {
        calculatePropertyValue();
      }, 1000); // 1 second delay for better UX
      
      return () => clearTimeout(timer);
    }
  }, [watchedFields, isCalculating, hasCalculated]);

  const calculatePropertyValue = async () => {
    if (isCalculating) return;

    const formData = form.getValues();
    
    // Validate required fields for calculation
    if (!formData.built_area_sqm || !formData.district_name || formData.building_age_years === undefined || !formData.overall_condition_rating) {
      console.log('Missing required fields for calculation:', {
        area: formData.built_area_sqm,
        district: formData.district_name,
        age: formData.building_age_years,
        condition: formData.overall_condition_rating
      });
      return;
    }

    setIsCalculating(true);
    
    try {
      const requestBody = {
        area: formData.built_area_sqm,
        age: formData.building_age_years,
        condition: formData.overall_condition_rating,
        location: formData.district_name,
        propertyType: 'residential', // Default for now
        landArea: formData.land_area_sqm,
        finishingLevel: formData.finishing_level,
        constructionType: formData.construction_type,
        neighborhoodRating: formData.neighborhood_quality_rating
      };

      console.log('Sending calculation request:', requestBody);

      const response = await fetch('/api/appraisals/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      const result = await response.json();
      
      if (result.success) {
        setCalculations(result.data);
        setHasCalculated(true); // Mark as calculated successfully
        console.log('Calculation completed successfully');
      } else {
        toast.error('Calculation failed: ' + result.error);
      }
    } catch (error) {
      console.error('Calculation error:', error);
      toast.error('Failed to calculate property value');
    } finally {
      setIsCalculating(false);
    }
  };


  // Manual recalculate function for the button
  const manualRecalculate = async () => {
    console.log('Manual recalculation triggered');
    setHasCalculated(false); // Reset the flag to allow recalculation
    await calculatePropertyValue();
  };

  const onSubmit = async (data: AppraisalFormData) => {
    console.log('🚀 SmartAppraisalForm onSubmit called with data:', {
      dataKeys: Object.keys(data),
      client_name: data.client_name,
      property_id: propertyId,
      hasCalculations: !!calculations,
      hasOnSaveCallback: !!onSave
    });
    
    setIsLoading(true);
    
    try {
      // Include calculation results, description data, location data, and extracted images in the submission
      const submissionData = {
        ...data,
        property_id: propertyId,
        calculations,
        description_data: descriptionData, // Include generated/edited description
        location_data: locationData, // Include location coordinates and details
        extracted_images: extractedImages, // Include extracted images from PDF processing
        appraisal_date: new Date().toISOString().split('T')[0],
        appraisal_valid_until: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 year from now
      };

      console.log('📤 About to call onSave with submissionData:', {
        submissionDataKeys: Object.keys(submissionData),
        client_name: submissionData.client_name,
        market_value_estimate: submissionData.calculations?.market_value_estimate,
        final_reconciled_value: submissionData.final_reconciled_value,
        extractedImagesCount: submissionData.extracted_images?.length || 0
      });

      // Call the onSave callback if provided
      if (onSave) {
        console.log('🔄 Calling onSave callback...');
        await onSave(submissionData);
        console.log('✅ onSave callback completed successfully');
      } else {
        console.warn('⚠️ No onSave callback provided');
      }

      toast.success('Appraisal form saved successfully!');
    } catch (error) {
      console.error('💥 Save error in SmartAppraisalForm:', error);
      toast.error('Failed to save appraisal form');
    } finally {
      setIsLoading(false);
    }
  };

  const getConditionColor = (rating: number) => {
    if (rating <= 3) return 'bg-red-100 hover:bg-red-200 border-red-300';
    if (rating <= 6) return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300';
    return 'bg-green-100 hover:bg-green-200 border-green-300';
  };

  const getConditionText = (rating: number) => {
    if (rating <= 3) return t('appraisalForm.options.condition_ratings.poor');
    if (rating <= 6) return t('appraisalForm.options.condition_ratings.fair');
    if (rating <= 8) return t('appraisalForm.options.condition_ratings.good');
    return t('appraisalForm.options.condition_ratings.excellent');
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('appraisalForm.sections.mainTitle')}</h1>
        <p className="text-gray-600">{t('appraisalForm.sections.mainDescription')}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('appraisalForm.sections.appraisalInformation')}
              </CardTitle>
              <CardDescription>{t('appraisalForm.sections.header')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="client_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.client_name')} *</FormLabel>
                      <FormControl>
                        <Input placeholder={t('appraisalForm.placeholders.client_name')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="requested_by"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.requested_by')} *</FormLabel>
                      <FormControl>
                        <Input placeholder={t('appraisalForm.placeholders.requested_by')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">{t('appraisalForm.sections.professionalInformation')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="appraiser_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.appraiser_name')} *</FormLabel>
                        <FormControl>
                          <Input placeholder={t('appraisalForm.placeholders.appraiser_name')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="registration_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.registration_number')} *</FormLabel>
                        <FormControl>
                          <Input placeholder={t('appraisalForm.placeholders.registration_number')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="report_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.report_type')} *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('appraisalForm.fields.report_type')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="full_appraisal">{t('appraisalForm.options.report_types.full_appraisal')}</SelectItem>
                            <SelectItem value="update">{t('appraisalForm.options.report_types.update')}</SelectItem>
                            <SelectItem value="summary">{t('appraisalForm.options.report_types.summary')}</SelectItem>
                            <SelectItem value="restricted">{t('appraisalForm.options.report_types.restricted')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="appraisal_valid_until"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.appraisal_valid_until')} *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>


          {/* Property Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t('appraisalForm.sections.propertyLocation')}
              </CardTitle>
              <CardDescription>{t('appraisalForm.sections.basicProperty')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="property_address_arabic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.property_address_arabic')} *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('appraisalForm.placeholders.property_address_arabic')}
                          className="text-right"
                          dir="rtl"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="property_address_english"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.property_address_english')} *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('appraisalForm.placeholders.property_address_english')}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="district_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.district')} *</FormLabel>
                      <Select onValueChange={(value) => {
                        field.onChange(value);
                        // Auto-load market data for selected district
                        const selectedDistrict = districts.find(d => d.key === value);
                        if (selectedDistrict) {
                          toast.info(`Market trend for ${selectedDistrict.name}: ${selectedDistrict.market_trend}`);
                        }
                      }}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select district" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {districts.map((district) => (
                            <SelectItem key={district.key} value={district.key}>
                              {district.name}
                              <Badge variant="secondary" className="ml-2">
                                {(district.average_price_per_sqm ?? 0).toLocaleString()} EGP/m²
                              </Badge>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.city')} *</FormLabel>
                      <FormControl>
                        <Input placeholder={t('appraisalForm.placeholders.city')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="governorate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.governorate')} *</FormLabel>
                      <FormControl>
                        <Input placeholder={t('appraisalForm.placeholders.governorate')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Location Picker Section */}
          <LocationPickerSection
            propertyAddressArabic={form.watch('property_address_arabic')}
            propertyAddressEnglish={form.watch('property_address_english')}
            districtName={form.watch('district_name')}
            cityName={form.watch('city_name')}
            governorate={form.watch('governorate')}
            buildingNumber={form.watch('building_number')}
            locationData={locationData}
            onLocationUpdate={(newLocationData) => {
              console.log('📍 Location updated:', newLocationData);
              setLocationData(newLocationData);
              // Update form data for submission
              form.setValue('location_data', newLocationData);
            }}
            onLocationError={(error) => {
              console.error('📍 Location error:', error);
              toast.error(`Location Error: ${error}`);
            }}
            readonly={false}
            showSearchBox={true}
          />

          {/* Building Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                {t('appraisalForm.sections.buildingInformation')}
              </CardTitle>
              <CardDescription>{t('appraisalForm.sections.buildingDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="building_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.building_number')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('appraisalForm.placeholders.building_number')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="floor_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.floor_number')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('appraisalForm.placeholders.floor_number')}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="unit_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.unit_number')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('appraisalForm.placeholders.unit_number')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="building_age_years"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.building_age_years')} *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('appraisalForm.placeholders.building_age_years')}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="construction_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.construction_type')} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('appraisalForm.fields.construction_type')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="concrete">{t('appraisalForm.options.construction_types.concrete')}</SelectItem>
                          <SelectItem value="brick">{t('appraisalForm.options.construction_types.brick')}</SelectItem>
                          <SelectItem value="steel">{t('appraisalForm.options.construction_types.steel')}</SelectItem>
                          <SelectItem value="mixed">{t('appraisalForm.options.construction_types.mixed')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="finishing_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.finishing_level')} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('appraisalForm.fields.finishing_level')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="core_shell">{t('appraisalForm.options.finishing_levels.core_shell')}</SelectItem>
                          <SelectItem value="semi_finished">{t('appraisalForm.options.finishing_levels.semi_finished')}</SelectItem>
                          <SelectItem value="fully_finished">{t('appraisalForm.options.finishing_levels.fully_finished')}</SelectItem>
                          <SelectItem value="luxury">{t('appraisalForm.options.finishing_levels.luxury')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">{t('appraisalForm.sections.technicalSpecifications')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="floor_materials"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.floor_materials')}</FormLabel>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { value: 'ceramic', labelEn: 'Ceramic', labelAr: 'سيراميك' },
                              { value: 'porcelain', labelEn: 'Porcelain', labelAr: 'بورسلين' },
                              { value: 'marble', labelEn: 'Marble', labelAr: 'رخام' },
                              { value: 'granite', labelEn: 'Granite', labelAr: 'جرانيت' },
                              { value: 'parquet', labelEn: 'Parquet', labelAr: 'باركيه' },
                              { value: 'laminate', labelEn: 'Laminate/HDF', labelAr: 'لامينيت/HDF' },
                              { value: 'vinyl', labelEn: 'Vinyl', labelAr: 'فينيل' },
                              { value: 'terrazzo', labelEn: 'Terrazzo', labelAr: 'تيرازو' },
                              { value: 'natural_stone', labelEn: 'Natural Stone', labelAr: 'حجر طبيعي' },
                              { value: 'tiles', labelEn: 'Tiles', labelAr: 'بلاط' },
                              { value: 'mosaic', labelEn: 'Mosaic', labelAr: 'موزاييك' },
                              { value: 'hdf', labelEn: 'HDF', labelAr: 'HDF' },
                              { value: 'carpet', labelEn: 'Carpet', labelAr: 'موكيت' }
                            ].map((material) => {
                              const currentValue = typeof field.value === 'object' ? field.value : {};
                              const formData = form.getValues();
                              
                              // Auto-check if material is in general_floor_materials from extraction
                              const isExtracted = formData.general_floor_materials?.includes(material.value) || false;
                              const isManuallyChecked = Boolean(currentValue[material.value]);
                              const isChecked = isManuallyChecked || isExtracted;
                              
                              return (
                                <div key={material.value} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`floor_${material.value}`}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const newValue = { ...currentValue };
                                      if (e.target.checked) {
                                        newValue[material.value] = `${material.labelEn} (${material.labelAr})`;
                                      } else {
                                        delete newValue[material.value];
                                      }
                                      field.onChange(newValue);
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <label htmlFor={`floor_${material.value}`} className={`text-sm font-medium ${isExtracted ? 'text-blue-600' : 'text-gray-700'}`}>
                                    {material.labelEn} ({material.labelAr}) {isExtracted && '✓'}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                          <FormControl>
                            <Input
                              placeholder="Other materials (custom entry)"
                              value={typeof field.value === 'object' ? (field.value.custom || '') : (field.value || '')}
                              onChange={(e) => {
                                const currentValue = typeof field.value === 'object' ? field.value : {};
                                field.onChange({ ...currentValue, custom: e.target.value });
                              }}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="wall_finishes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.wall_finishes')}</FormLabel>
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { value: 'plastic_paint', labelEn: 'Plastic Paint', labelAr: 'دهانات بلاستيك' },
                              { value: 'paint', labelEn: 'Paint', labelAr: 'دهان' },
                              { value: 'ceramic_tiles', labelEn: 'Ceramic Tiles', labelAr: 'بلاط سيراميك' },
                              { value: 'tiles', labelEn: 'Tiles', labelAr: 'بلاط' },
                              { value: 'wallpaper', labelEn: 'Wallpaper', labelAr: 'ورق حائط' },
                              { value: 'wood_panels', labelEn: 'Wood Panels', labelAr: 'ألواح خشبية' },
                              { value: 'stone_cladding', labelEn: 'Stone Cladding', labelAr: 'كسوة حجرية' },
                              { value: 'gypsum_board', labelEn: 'Gypsum Board', labelAr: 'ألواح جبس' },
                              { value: 'marble', labelEn: 'Marble', labelAr: 'رخام' },
                              { value: 'granite', labelEn: 'Granite', labelAr: 'جرانيت' },
                              { value: 'texture_paint', labelEn: 'Texture Paint', labelAr: 'دهان محبب' }
                            ].map((finish) => {
                              const currentValue = typeof field.value === 'object' ? field.value : {};
                              const formData = form.getValues();
                              
                              // Auto-check if material is in general_wall_materials from extraction
                              const isExtracted = formData.general_wall_materials?.includes(finish.value) || false;
                              const isManuallyChecked = Boolean(currentValue[finish.value]);
                              const isChecked = isManuallyChecked || isExtracted;
                              
                              return (
                                <div key={finish.value} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id={`wall_${finish.value}`}
                                    checked={isChecked}
                                    onChange={(e) => {
                                      const newValue = { ...currentValue };
                                      if (e.target.checked) {
                                        newValue[finish.value] = `${finish.labelEn} (${finish.labelAr})`;
                                      } else {
                                        delete newValue[finish.value];
                                      }
                                      field.onChange(newValue);
                                    }}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  />
                                  <label htmlFor={`wall_${finish.value}`} className={`text-sm font-medium ${isExtracted ? 'text-green-600' : 'text-gray-700'}`}>
                                    {finish.labelEn} ({finish.labelAr}) {isExtracted && '✓'}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                          <FormControl>
                            <Input
                              placeholder="Other finishes (custom entry)"
                              value={typeof field.value === 'object' ? (field.value.custom || '') : (field.value || '')}
                              onChange={(e) => {
                                const currentValue = typeof field.value === 'object' ? field.value : {};
                                field.onChange({ ...currentValue, custom: e.target.value });
                              }}
                            />
                          </FormControl>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ceiling_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.ceiling_type')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('appraisalForm.placeholders.ceiling_type')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="suspended">{t('appraisalForm.options.ceiling_types.suspended')}</SelectItem>
                            <SelectItem value="concrete">{t('appraisalForm.options.ceiling_types.concrete')}</SelectItem>
                            <SelectItem value="decorative">{t('appraisalForm.options.ceiling_types.decorative')}</SelectItem>
                            <SelectItem value="gypsum_board">{t('appraisalForm.options.ceiling_types.gypsum_board')}</SelectItem>
                            <SelectItem value="wood">{t('appraisalForm.options.ceiling_types.wood')}</SelectItem>
                            <SelectItem value="metal">{t('appraisalForm.options.ceiling_types.metal')}</SelectItem>
                            <SelectItem value="pvc">{t('appraisalForm.options.ceiling_types.pvc')}</SelectItem>
                            <SelectItem value="acoustic">{t('appraisalForm.options.ceiling_types.acoustic')}</SelectItem>
                            <SelectItem value="plastic_paint">{t('appraisalForm.options.ceiling_types.plastic_paint')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="windows_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.windows_type')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('appraisalForm.fields.windows_type')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="aluminum">{t('appraisalForm.options.windows_types.aluminum')}</SelectItem>
                            <SelectItem value="wood">{t('appraisalForm.options.windows_types.wood')}</SelectItem>
                            <SelectItem value="upvc">{t('appraisalForm.options.windows_types.upvc')}</SelectItem>
                            <SelectItem value="steel">{t('appraisalForm.options.windows_types.steel')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="doors_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.doors_type')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('appraisalForm.fields.doors_type')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="wood">{t('appraisalForm.options.doors_types.wood')}</SelectItem>
                            <SelectItem value="metal">{t('appraisalForm.options.doors_types.metal')}</SelectItem>
                            <SelectItem value="steel">{t('appraisalForm.options.doors_types.steel')}</SelectItem>
                            <SelectItem value="glass">{t('appraisalForm.options.doors_types.glass')}</SelectItem>
                            <SelectItem value="upvc">{t('appraisalForm.options.doors_types.upvc')}</SelectItem>
                            <SelectItem value="pvc">{t('appraisalForm.options.doors_types.pvc')}</SelectItem>
                            <SelectItem value="aluminum">{t('appraisalForm.options.doors_types.aluminum')}</SelectItem>
                            <SelectItem value="composite">{t('appraisalForm.options.doors_types.composite')}</SelectItem>
                            <SelectItem value="security_steel">{t('appraisalForm.options.doors_types.security_steel')}</SelectItem>
                            <SelectItem value="solid_wood">{t('appraisalForm.options.doors_types.solid_wood')}</SelectItem>
                            <SelectItem value="mdf">{t('appraisalForm.options.doors_types.mdf')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="entrance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Entrance</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Main entrance, Side entrance" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">{t('appraisalForm.sections.systemDescriptions')}</h4>
                <div className="grid grid-cols-1 gap-6">
                  <FormField
                    control={form.control}
                    name="electrical_system_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.electrical_system_description')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t('appraisalForm.placeholders.electrical_system_description')}
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sanitary_ware_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.sanitary_ware_description')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t('appraisalForm.placeholders.sanitary_ware_description')}
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="exterior_finishes_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.exterior_finishes_description')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t('appraisalForm.placeholders.exterior_finishes_description')}
                            className="min-h-[80px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Extracted Materials Summary (Auto-populated from AI) */}
          {(form.getValues().general_floor_materials?.length || form.getValues().general_wall_materials?.length || form.getValues().general_exterior_materials?.length) && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <Zap className="h-5 w-5" />
                  Auto-Detected Materials (From Document)
                </CardTitle>
                <CardDescription>Materials automatically extracted and parsed from the appraisal document</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const floorMaterials = form.getValues().general_floor_materials;
                  return floorMaterials && floorMaterials.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-blue-700">Floor Materials</Label>
                      <div className="flex flex-wrap gap-2">
                        {floorMaterials.map((material, index) => (
                          <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {material}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                
                {(() => {
                  const wallMaterials = form.getValues().general_wall_materials;
                  return wallMaterials && wallMaterials.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-green-700">Wall Materials</Label>
                      <div className="flex flex-wrap gap-2">
                        {wallMaterials.map((material, index) => (
                          <Badge key={index} variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            {material}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })()}
                
                {(() => {
                  const exteriorMaterials = form.getValues().general_exterior_materials;
                  return exteriorMaterials && exteriorMaterials.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-purple-700">Exterior Materials</Label>
                      <div className="flex flex-wrap gap-2">
                        {exteriorMaterials.map((material, index) => (
                          <Badge key={index} variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            {material}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Basic Property Information - NEW SECTION */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                {t('appraisalForm.sections.basicPropertyInformation')}
              </CardTitle>
              <CardDescription>{t('appraisalForm.sections.coreBuilding')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="property_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.property_type')} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('appraisalForm.fields.property_type')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="apartment">{t('appraisalForm.options.property_types.apartment')}</SelectItem>
                          <SelectItem value="villa">{t('appraisalForm.options.property_types.villa')}</SelectItem>
                          <SelectItem value="townhouse">{t('appraisalForm.options.property_types.townhouse')}</SelectItem>
                          <SelectItem value="penthouse">{t('appraisalForm.options.property_types.penthouse')}</SelectItem>
                          <SelectItem value="studio">{t('appraisalForm.options.property_types.studio')}</SelectItem>
                          <SelectItem value="duplex">{t('appraisalForm.options.property_types.duplex')}</SelectItem>
                          <SelectItem value="commercial">{t('appraisalForm.options.property_types.commercial')}</SelectItem>
                          <SelectItem value="industrial">{t('appraisalForm.options.property_types.industrial')}</SelectItem>
                          <SelectItem value="land">{t('appraisalForm.options.property_types.land')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bedrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.bedrooms')} *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('appraisalForm.placeholders.bedrooms')}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bathrooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.bathrooms')} *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('appraisalForm.placeholders.bathrooms')}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reception_rooms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.reception_rooms')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('appraisalForm.placeholders.reception_rooms')}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="kitchens"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.kitchens')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('appraisalForm.placeholders.kitchens')}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parking_spaces"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.parking_spaces')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('appraisalForm.placeholders.parking_spaces')}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="total_floors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Floors</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Total floors in building"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year_built"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year Built</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Construction year"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Area Measurements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Area Measurements
              </CardTitle>
              <CardDescription>Property area measurements in square meters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <FormField
                  control={form.control}
                  name="land_area_sqm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.land_area_sqm')} *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('appraisalForm.placeholders.land_area_sqm')}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="built_area_sqm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.built_area_sqm')} *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('appraisalForm.placeholders.built_area_sqm')}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="unit_area_sqm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.unit_area_sqm')} *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('appraisalForm.placeholders.unit_area_sqm')}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="balcony_area_sqm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.balcony_area_sqm')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('appraisalForm.placeholders.balcony_area_sqm')}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="garage_area_sqm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.garage_area_sqm')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('appraisalForm.placeholders.garage_area_sqm')}
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Condition Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>{t('appraisalForm.sections.conditionAssessment')}</CardTitle>
              <CardDescription>{t('appraisalForm.sections.conditionDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="overall_condition_rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.overall_condition_rating')} * ({getConditionText(field.value)})</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <div className="grid grid-cols-10 gap-2">
                          {[1,2,3,4,5,6,7,8,9,10].map(rating => (
                            <Button
                              key={rating}
                              type="button"
                              variant={field.value === rating ? "default" : "outline"}
                              className={`h-10 ${getConditionColor(rating)} ${field.value === rating ? 'ring-2 ring-blue-500' : ''}`}
                              onClick={() => field.onChange(rating)}
                            >
                              {rating}
                            </Button>
                          ))}
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>{t('appraisalForm.options.condition_ratings.poor_range')}</span>
                          <span>{t('appraisalForm.options.condition_ratings.fair_range')}</span>
                          <span>{t('appraisalForm.options.condition_ratings.good_range')}</span>
                          <span>{t('appraisalForm.options.condition_ratings.excellent_range')}</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="structural_condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.structural_condition')} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('appraisalForm.fields.structural_condition')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="excellent">{t('appraisalForm.options.conditions.excellent')}</SelectItem>
                          <SelectItem value="good">{t('appraisalForm.options.conditions.good')}</SelectItem>
                          <SelectItem value="fair">{t('appraisalForm.options.conditions.fair')}</SelectItem>
                          <SelectItem value="poor">{t('appraisalForm.options.conditions.poor')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="mechanical_systems_condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.mechanical_systems_condition')} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('appraisalForm.fields.structural_condition')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="excellent">{t('appraisalForm.options.conditions.excellent')}</SelectItem>
                          <SelectItem value="good">{t('appraisalForm.options.conditions.good')}</SelectItem>
                          <SelectItem value="fair">{t('appraisalForm.options.conditions.fair')}</SelectItem>
                          <SelectItem value="poor">{t('appraisalForm.options.conditions.poor')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="exterior_condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.exterior_condition')} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('appraisalForm.fields.structural_condition')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="excellent">{t('appraisalForm.options.conditions.excellent')}</SelectItem>
                          <SelectItem value="good">{t('appraisalForm.options.conditions.good')}</SelectItem>
                          <SelectItem value="fair">{t('appraisalForm.options.conditions.fair')}</SelectItem>
                          <SelectItem value="poor">{t('appraisalForm.options.conditions.poor')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="interior_condition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.interior_condition')} *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('appraisalForm.fields.structural_condition')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="excellent">{t('appraisalForm.options.conditions.excellent')}</SelectItem>
                          <SelectItem value="good">{t('appraisalForm.options.conditions.good')}</SelectItem>
                          <SelectItem value="fair">{t('appraisalForm.options.conditions.fair')}</SelectItem>
                          <SelectItem value="poor">{t('appraisalForm.options.conditions.poor')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Utilities and Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                {t('appraisalForm.sections.utilitiesServices')}
              </CardTitle>
              <CardDescription>{t('appraisalForm.sections.utilitiesDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <FormField
                  control={form.control}
                  name="electricity_available"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">{t('appraisalForm.fields.electricity_available')}</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="water_supply_available"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">{t('appraisalForm.fields.water_supply_available')}</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sewage_system_available"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">{t('appraisalForm.fields.sewage_system_available')}</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gas_supply_available"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">{t('appraisalForm.fields.gas_supply_available')}</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="internet_fiber_available"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">{t('appraisalForm.fields.internet_fiber_available')}</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="elevator_available"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">{t('appraisalForm.fields.elevator_available')}</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="parking_available"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">{t('appraisalForm.fields.parking_available')}</FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="security_system"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">{t('appraisalForm.fields.security_system')}</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Market Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('appraisalForm.sections.marketAnalysis')}
              </CardTitle>
              <CardDescription>{t('appraisalForm.sections.marketDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="market_trend"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.market_trend')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('appraisalForm.fields.market_trend')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="rising">{t('appraisalForm.options.market_trends.rising')}</SelectItem>
                        <SelectItem value="stable">{t('appraisalForm.options.market_trends.stable')}</SelectItem>
                        <SelectItem value="declining">{t('appraisalForm.options.market_trends.declining')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="demand_supply_ratio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.demand_supply_ratio')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        min="0"
                        max="5"
                        placeholder="e.g., 1.2"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.descriptions.demand_supply_ratio')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price_per_sqm_area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.price_per_sqm_area')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="100"
                        min="0"
                        placeholder="e.g., 15000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.descriptions.price_per_sqm_area')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Economic Analysis (Egyptian Standards) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {t('appraisalForm.sections.economicAnalysis')}
              </CardTitle>
              <CardDescription>{t('appraisalForm.sections.economicDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="economic_life_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.economic_life_years')} *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        max="200"
                        placeholder="e.g., 60"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.descriptions.economic_life_years')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="current_age_ratio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.current_age_ratio')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        min="0"
                        max="100"
                        placeholder="e.g., 26.7"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.descriptions.current_age_ratio')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="depreciation_rate_annual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.depreciation_rate_annual')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        min="0"
                        max="20"
                        placeholder="e.g., 1.67"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.descriptions.depreciation_rate_annual')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="replacement_cost_new"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.replacement_cost_new')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="1000"
                        min="0"
                        placeholder={t('appraisalForm.placeholders.replacement_cost_new')}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.descriptions.replacement_cost_new')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="curable_depreciation_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.curable_depreciation_value')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="1000"
                        min="0"
                        placeholder={t('appraisalForm.placeholders.curable_depreciation_value')}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.descriptions.curable_depreciation_value')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="incurable_depreciation_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.incurable_depreciation_value')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="1000"
                        min="0"
                        placeholder={t('appraisalForm.placeholders.incurable_depreciation_value')}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.descriptions.incurable_depreciation_value')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="total_depreciation_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.total_depreciation_value')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="1000"
                        min="0"
                        placeholder="e.g., 162800"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.descriptions.total_depreciation_value')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Location Analysis (Egyptian Standards) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t('appraisalForm.sections.locationAnalysis')}
              </CardTitle>
              <CardDescription>{t('appraisalForm.sections.locationDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="street_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.street_type')} *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('appraisalForm.fields.street_type')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="main_street">{t('appraisalForm.options.street_types.main_street')}</SelectItem>
                        <SelectItem value="side_street">{t('appraisalForm.options.street_types.side_street')}</SelectItem>
                        <SelectItem value="internal_street">{t('appraisalForm.options.street_types.internal_street')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="commercial_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.commercial_percentage')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="1"
                        min="0"
                        max="100"
                        placeholder="e.g., 25"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.descriptions.commercial_percentage')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="market_activity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.market_activity')} *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('appraisalForm.fields.market_activity')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="rising">{t('appraisalForm.options.market_trends.rising')}</SelectItem>
                        <SelectItem value="stable">{t('appraisalForm.options.market_trends.stable')}</SelectItem>
                        <SelectItem value="declining">{t('appraisalForm.options.market_trends.declining')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="property_liquidity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.property_liquidity')} *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('appraisalForm.fields.property_liquidity')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="high">{t('appraisalForm.options.liquidity_levels.high')}</SelectItem>
                        <SelectItem value="medium">{t('appraisalForm.options.liquidity_levels.medium')}</SelectItem>
                        <SelectItem value="low">{t('appraisalForm.options.liquidity_levels.low')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="time_on_market_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.time_on_market_months')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="1"
                        min="0"
                        max="60"
                        placeholder="e.g., 6"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.descriptions.time_on_market_months')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="area_density"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.area_density')} *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('appraisalForm.fields.area_density')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="crowded">{t('appraisalForm.options.area_density.crowded')}</SelectItem>
                        <SelectItem value="moderate">{t('appraisalForm.options.area_density.moderate')}</SelectItem>
                        <SelectItem value="sparse">{t('appraisalForm.options.area_density.sparse')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>{t('appraisalForm.descriptions.area_density')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="nearby_services"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.nearby_services')}</FormLabel>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'schools', labelEn: 'Schools', labelAr: 'مدارس' },
                          { value: 'hospitals', labelEn: 'Hospitals', labelAr: 'مستشفيات' },
                          { value: 'pharmacies', labelEn: 'Pharmacies', labelAr: 'صيدليات' },
                          { value: 'shopping_centers', labelEn: 'Shopping Centers', labelAr: 'مراكز تسوق' },
                          { value: 'restaurants', labelEn: 'Restaurants', labelAr: 'مطاعم' },
                          { value: 'banks', labelEn: 'Banks', labelAr: 'بنوك' },
                          { value: 'mosques', labelEn: 'Mosques', labelAr: 'مساجد' },
                          { value: 'parks', labelEn: 'Parks', labelAr: 'حدائق' },
                          { value: 'gyms', labelEn: 'Gyms', labelAr: 'صالات رياضية' },
                          { value: 'metro_stations', labelEn: 'Metro Stations', labelAr: 'محطات مترو' },
                          { value: 'bus_stops', labelEn: 'Bus Stops', labelAr: 'محطات أتوبيس' },
                          { value: 'gas_stations', labelEn: 'Gas Stations', labelAr: 'محطات وقود' }
                        ].map((service) => {
                          const currentServices = field.value ? field.value.split(',').map(s => s.trim()) : [];
                          const isChecked = currentServices.some(s => s.toLowerCase().includes(service.labelEn.toLowerCase()));
                          
                          return (
                            <div key={service.value} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={`service_${service.value}`}
                                checked={isChecked}
                                onChange={(e) => {
                                  let newServices = [...currentServices];
                                  const serviceText = `${service.labelEn} (${service.labelAr})`;
                                  
                                  if (e.target.checked) {
                                    if (!newServices.some(s => s.toLowerCase().includes(service.labelEn.toLowerCase()))) {
                                      newServices.push(serviceText);
                                    }
                                  } else {
                                    newServices = newServices.filter(s => !s.toLowerCase().includes(service.labelEn.toLowerCase()));
                                  }
                                  
                                  field.onChange(newServices.join(', '));
                                }}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor={`service_${service.value}`} className="text-sm font-medium text-gray-700">
                                {service.labelEn} ({service.labelAr})
                              </label>
                            </div>
                          );
                        })}
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Additional services (custom entry)"
                          className="min-h-[60px]"
                          value={field.value || ''}
                          onChange={field.onChange}
                        />
                      </FormControl>
                    </div>
                    <FormDescription>{t('appraisalForm.descriptions.nearby_services')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="location_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.location_description')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('appraisalForm.placeholders.location_description')}
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.descriptions.location_description')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="construction_volume"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.construction_volume')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="100"
                        min="0"
                        placeholder={t('appraisalForm.placeholders.construction_volume')}
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.descriptions.construction_volume')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="funding_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.funding_source')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select funding source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cash">Cash Payment (دفع نقدي)</SelectItem>
                        <SelectItem value="bank_mortgage">Bank Mortgage (قرض عقاري)</SelectItem>
                        <SelectItem value="bank_financing">Bank Financing (تمويل بنكي)</SelectItem>
                        <SelectItem value="installments">Installments (تقسيط)</SelectItem>
                        <SelectItem value="islamic_financing">Islamic Financing (تمويل إسلامي)</SelectItem>
                        <SelectItem value="personal_loan">Personal Loan (قرض شخصي)</SelectItem>
                        <SelectItem value="mixed_funding">Mixed Funding (تمويل مختلط)</SelectItem>
                        <SelectItem value="seller_financing">Seller Financing (تمويل البائع)</SelectItem>
                        <SelectItem value="company_financing">Company Financing (تمويل الشركة)</SelectItem>
                        <SelectItem value="government_subsidy">Government Subsidy (دعم حكومي)</SelectItem>
                        <SelectItem value="family_support">Family Support (دعم أسري)</SelectItem>
                        <SelectItem value="investment_fund">Investment Fund (صندوق استثمار)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>{t('appraisalForm.descriptions.funding_source')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="area_character"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.area_character')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('appraisalForm.fields.area_character')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="residential">Residential (سكني)</SelectItem>
                        <SelectItem value="commercial">Commercial (تجاري)</SelectItem>
                        <SelectItem value="mixed_use">Mixed-Use (مختلط)</SelectItem>
                        <SelectItem value="industrial">Industrial (صناعي)</SelectItem>
                        <SelectItem value="administrative">Administrative (إداري)</SelectItem>
                        <SelectItem value="recreational">Recreational (ترفيهي)</SelectItem>
                        <SelectItem value="educational">Educational (تعليمي)</SelectItem>
                        <SelectItem value="medical">Medical (طبي)</SelectItem>
                        <SelectItem value="luxury_residential">Luxury Residential (سكني فاخر)</SelectItem>
                        <SelectItem value="gated_community">Gated Community (كمبوند)</SelectItem>
                        <SelectItem value="tourist">Tourist Area (منطقة سياحية)</SelectItem>
                        <SelectItem value="historic">Historic District (منطقة تراثية)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>{t('appraisalForm.descriptions.area_character')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Land Valuation (Egyptian Standards) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                {t('appraisalForm.sections.landValuation')}
              </CardTitle>
              <CardDescription>{t('appraisalForm.sections.landDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="land_value_per_sqm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.land_value_per_sqm')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="100"
                        min="0"
                        placeholder="e.g., 8000"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.descriptions.land_value_per_sqm')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="total_building_land_area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.total_building_land_area')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="1"
                        min="0"
                        placeholder="e.g., 620"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.descriptions.total_building_land_area')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="unit_land_share_sqm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.unit_land_share_sqm')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="1"
                        min="0"
                        placeholder="e.g., 62"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.descriptions.unit_land_share_sqm')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="land_use_classification"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.land_use_classification')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Residential (سكني)"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.descriptions.land_use_classification')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="highest_best_use_confirmed"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 col-span-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      Current use is Highest & Best Use (الاستخدام الحالي هو الأعلى والأفضل)
                    </FormLabel>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Room Specifications (Egyptian Standards) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                {t('appraisalForm.sections.roomSpecifications')}
              </CardTitle>
              <CardDescription>{t('appraisalForm.sections.roomDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-blue-700">{t('appraisalForm.sections.flooringMaterials')}</Label>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="reception_flooring"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('appraisalForm.fields.reception_flooring')} {field.value && '✓'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('appraisalForm.placeholders.flooring_material')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ceramic">Ceramic (سيراميك)</SelectItem>
                              <SelectItem value="porcelain">Porcelain (بورسلين)</SelectItem>
                              <SelectItem value="marble">Marble (رخام)</SelectItem>
                              <SelectItem value="granite">Granite (جرانيت)</SelectItem>
                              <SelectItem value="parquet">Parquet (باركيه)</SelectItem>
                              <SelectItem value="laminate">Laminate (لامينيت)</SelectItem>
                              <SelectItem value="vinyl">Vinyl (فينيل)</SelectItem>
                              <SelectItem value="carpet">Carpet (موكيت)</SelectItem>
                              <SelectItem value="terrazzo">Terrazzo (تيرازو)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="kitchen_flooring"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('appraisalForm.fields.kitchen_flooring')} {field.value && '✓'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('appraisalForm.placeholders.flooring_material')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ceramic">Ceramic (سيراميك)</SelectItem>
                              <SelectItem value="granite">Granite (جرانيت)</SelectItem>
                              <SelectItem value="marble">Marble (رخام)</SelectItem>
                              <SelectItem value="porcelain">Porcelain (بورسلين)</SelectItem>
                              <SelectItem value="vinyl">Vinyl (فينيل)</SelectItem>
                              <SelectItem value="natural_stone">Natural Stone (حجر طبيعي)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bathroom_flooring"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('appraisalForm.fields.bathroom_flooring')} {field.value && '✓'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('appraisalForm.placeholders.flooring_material')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ceramic">Ceramic (سيراميك)</SelectItem>
                              <SelectItem value="porcelain">Porcelain (بورسلين)</SelectItem>
                              <SelectItem value="marble">Marble (رخام)</SelectItem>
                              <SelectItem value="granite">Granite (جرانيت)</SelectItem>
                              <SelectItem value="mosaic">Mosaic (موزاييك)</SelectItem>
                              <SelectItem value="natural_stone">Natural Stone (حجر طبيعي)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bedroom_flooring"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('appraisalForm.fields.bedroom_flooring')} {field.value && '✓'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('appraisalForm.placeholders.flooring_material')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="parquet">Parquet (باركيه)</SelectItem>
                              <SelectItem value="laminate">Laminate (لامينيت)</SelectItem>
                              <SelectItem value="ceramic">Ceramic (سيراميك)</SelectItem>
                              <SelectItem value="marble">Marble (رخام)</SelectItem>
                              <SelectItem value="carpet">Carpet (موكيت)</SelectItem>
                              <SelectItem value="vinyl">Vinyl (فينيل)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="terrace_flooring"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terrace Flooring {field.value && '✓'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select flooring material" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ceramic">Ceramic (سيراميك)</SelectItem>
                              <SelectItem value="granite">Granite (جرانيت)</SelectItem>
                              <SelectItem value="marble">Marble (رخام)</SelectItem>
                              <SelectItem value="natural_stone">Natural Stone (حجر طبيعي)</SelectItem>
                              <SelectItem value="concrete">Concrete (خرسانة)</SelectItem>
                              <SelectItem value="tiles">Tiles (بلاط)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-green-700">{t('appraisalForm.sections.wallFinishes')}</Label>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="reception_walls"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('appraisalForm.fields.reception_walls')} {field.value && '✓'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('appraisalForm.placeholders.wall_finish')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="plastic_paint">Plastic Paint (دهانات بلاستيك)</SelectItem>
                              <SelectItem value="oil_paint">Oil Paint (دهانات زيتية)</SelectItem>
                              <SelectItem value="wallpaper">Wallpaper (ورق حائط)</SelectItem>
                              <SelectItem value="stone_cladding">Stone Cladding (كسوة حجرية)</SelectItem>
                              <SelectItem value="wood_panels">Wood Panels (ألواح خشبية)</SelectItem>
                              <SelectItem value="gypsum_board">Gypsum Board (ألواح جبس)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="kitchen_walls"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('appraisalForm.fields.kitchen_walls')} {field.value && '✓'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('appraisalForm.placeholders.wall_finish')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ceramic_tiles">Ceramic Tiles (سيراميك)</SelectItem>
                              <SelectItem value="granite">Granite (جرانيت)</SelectItem>
                              <SelectItem value="marble">Marble (رخام)</SelectItem>
                              <SelectItem value="stainless_steel">Stainless Steel (ستانلس ستيل)</SelectItem>
                              <SelectItem value="glass">Glass (زجاج)</SelectItem>
                              <SelectItem value="plastic_paint">Plastic Paint (دهانات بلاستيك)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bathroom_walls"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('appraisalForm.fields.bathroom_walls')} {field.value && '✓'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('appraisalForm.placeholders.wall_finish')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ceramic_tiles">Ceramic Tiles (سيراميك)</SelectItem>
                              <SelectItem value="porcelain">Porcelain (بورسلين)</SelectItem>
                              <SelectItem value="marble">Marble (رخام)</SelectItem>
                              <SelectItem value="granite">Granite (جرانيت)</SelectItem>
                              <SelectItem value="mosaic">Mosaic (موزاييك)</SelectItem>
                              <SelectItem value="waterproof_paint">Waterproof Paint (دهانات مقاومة للماء)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bedroom_walls"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('appraisalForm.fields.bedroom_walls')} {field.value && '✓'}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('appraisalForm.placeholders.wall_finish')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="plastic_paint">Plastic Paint (دهانات بلاستيك)</SelectItem>
                              <SelectItem value="oil_paint">Oil Paint (دهانات زيتية)</SelectItem>
                              <SelectItem value="wallpaper">Wallpaper (ورق حائط)</SelectItem>
                              <SelectItem value="wood_panels">Wood Panels (ألواح خشبية)</SelectItem>
                              <SelectItem value="gypsum_board">Gypsum Board (ألواح جبس)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valuation Methods (Egyptian Standards) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                {t('appraisalForm.sections.valuationMethods')}
              </CardTitle>
              <CardDescription>{t('appraisalForm.sections.valuationDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="cost_approach_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.cost_approach_value')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="1000"
                          min="0"
                          placeholder="e.g., 1360800"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>{t('appraisalForm.descriptions.cost_approach_value')}</FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sales_comparison_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.sales_comparison_value')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="1000"
                          min="0"
                          placeholder="e.g., 1700000"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>{t('appraisalForm.descriptions.sales_comparison_value')}</FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="income_approach_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.income_approach_value')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="1000"
                          min="0"
                          placeholder="Not applicable"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>{t('appraisalForm.descriptions.income_approach_value')}</FormDescription>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="final_reconciled_value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.final_reconciled_value')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="1000"
                          min="0"
                          placeholder="e.g., 1700000"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>{t('appraisalForm.descriptions.final_reconciled_value')}</FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="recommended_valuation_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.recommended_method')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('appraisalForm.placeholders.recommended_method')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cost_approach">{t('appraisalForm.options.valuation_methods.cost_approach')}</SelectItem>
                          <SelectItem value="sales_comparison">{t('appraisalForm.options.valuation_methods.sales_comparison')}</SelectItem>
                          <SelectItem value="income_approach">{t('appraisalForm.options.valuation_methods.income_approach')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>{t('appraisalForm.descriptions.recommended_method')}</FormDescription>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="monthly_rental_estimate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.monthly_rental_value')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="100"
                          min="0"
                          placeholder="e.g., 7500"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>{t('appraisalForm.descriptions.monthly_rental_value')}</FormDescription>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="border-t pt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">{t('appraisalForm.sections.advancedValuationComponents')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="price_per_sqm_semi_finished"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.price_per_sqm_semi_finished')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="100"
                            min="0"
                            placeholder="e.g., 12000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>{t('appraisalForm.descriptions.price_per_sqm_semi_finished')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="price_per_sqm_fully_finished"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.price_per_sqm_fully_finished')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="100"
                            min="0"
                            placeholder="e.g., 18000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>{t('appraisalForm.descriptions.price_per_sqm_fully_finished')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="land_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.land_value')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="1000"
                            min="0"
                            placeholder="e.g., 680000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>{t('appraisalForm.descriptions.land_value')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="building_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.building_value')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="1000"
                            min="0"
                            placeholder="e.g., 1020000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>{t('appraisalForm.descriptions.building_value')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="unit_land_share_value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.unit_land_share_value')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="1000"
                            min="0"
                            placeholder="e.g., 340000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>{t('appraisalForm.descriptions.unit_land_share_value')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="unit_construction_cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.unit_construction_cost')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="1000"
                            min="0"
                            placeholder="e.g., 850000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>{t('appraisalForm.descriptions.unit_construction_cost')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="construction_cost_per_sqm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.construction_cost_per_sqm')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="100"
                            min="0"
                            placeholder="e.g., 4000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>{t('appraisalForm.descriptions.construction_cost_per_sqm')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="building_value_with_profit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.building_value_with_profit')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="1000"
                            min="0"
                            placeholder="e.g., 1190000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>{t('appraisalForm.descriptions.building_value_with_profit')}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>{t('appraisalForm.notes.egyptianStandardsNote')}</strong> {t('appraisalForm.notes.finalValueReconciliation')}, and intended use.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Comparative Sales Analysis (Egyptian Standards) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('appraisalForm.sections.comparativeSalesAnalysis')}
              </CardTitle>
              <CardDescription>{t('appraisalForm.sections.comparativeSalesDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Comparable Sale 1 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Comparable Sale #1</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="comparable_sale_1_address"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_1_address')}</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., شقة بشارع 6 الحي الخامس" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_1_sale_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_1_date')}</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., منذ شهر" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_1_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_1_price')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="1000"
                            min="0"
                            placeholder="e.g., 1500000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_1_area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_1_area')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="1"
                            min="0"
                            placeholder="e.g., 218"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_1_price_per_sqm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_1_price_per_sqm')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="100"
                            min="0"
                            placeholder="Auto-calculated"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_1_age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_1_age')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="e.g., 15"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_1_finishing"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_1_finishing')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('appraisalForm.placeholders.finishing_level')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="core_shell">{t('appraisalForm.options.finishing_levels.core_shell')}</SelectItem>
                            <SelectItem value="semi_finished">{t('appraisalForm.options.finishing_levels.semi_finished')}</SelectItem>
                            <SelectItem value="fully_finished">{t('appraisalForm.options.finishing_levels.fully_finished')}</SelectItem>
                            <SelectItem value="luxury">{t('appraisalForm.options.finishing_levels.luxury')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_1_floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_1_floor')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="e.g., 1"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_1_orientation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_1_orientation')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('appraisalForm.placeholders.orientation')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="north">{t('appraisalForm.options.orientations.north')}</SelectItem>
                            <SelectItem value="south">{t('appraisalForm.options.orientations.south')}</SelectItem>
                            <SelectItem value="east">{t('appraisalForm.options.orientations.east')}</SelectItem>
                            <SelectItem value="west">{t('appraisalForm.options.orientations.west')}</SelectItem>
                            <SelectItem value="northeast">{t('appraisalForm.options.orientations.northeast')}</SelectItem>
                            <SelectItem value="northwest">{t('appraisalForm.options.orientations.northwest')}</SelectItem>
                            <SelectItem value="southeast">{t('appraisalForm.options.orientations.southeast')}</SelectItem>
                            <SelectItem value="southwest">{t('appraisalForm.options.orientations.southwest')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_1_street_view"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_1_street')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('appraisalForm.placeholders.street_view')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="garden_view">{t('appraisalForm.options.street_views.garden_view')}</SelectItem>
                            <SelectItem value="main_street">{t('appraisalForm.options.street_views.main_street')}</SelectItem>
                            <SelectItem value="side_street">{t('appraisalForm.options.street_views.side_street')}</SelectItem>
                            <SelectItem value="internal_street">{t('appraisalForm.options.street_views.internal_street')}</SelectItem>
                            <SelectItem value="sea_view">{t('appraisalForm.options.street_views.sea_view')}</SelectItem>
                            <SelectItem value="nile_view">{t('appraisalForm.options.street_views.nile_view')}</SelectItem>
                            <SelectItem value="park_view">{t('appraisalForm.options.street_views.park_view')}</SelectItem>
                            <SelectItem value="building_view">{t('appraisalForm.options.street_views.building_view')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Comparable Sale 2 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Comparable Sale #2</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="comparable_sale_2_address"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_2_address')}</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., شقة 2 بالعمار 8 المنطقة الثالثة الحي الثالث" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_2_sale_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_2_date')}</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., منذ شهران" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_2_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_2_price')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="1000"
                            min="0"
                            placeholder="e.g., 1200000"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_2_area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_2_area')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="1"
                            min="0"
                            placeholder="e.g., 160"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_2_price_per_sqm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_2_price_per_sqm')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="100"
                            min="0"
                            placeholder="Auto-calculated"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_2_age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_2_age')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="e.g., 8"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_2_finishing"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_2_finishing')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('appraisalForm.placeholders.finishing_level')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="core_shell">{t('appraisalForm.options.finishing_levels.core_shell')}</SelectItem>
                            <SelectItem value="semi_finished">{t('appraisalForm.options.finishing_levels.semi_finished')}</SelectItem>
                            <SelectItem value="fully_finished">{t('appraisalForm.options.finishing_levels.fully_finished')}</SelectItem>
                            <SelectItem value="luxury">{t('appraisalForm.options.finishing_levels.luxury')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_2_floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_2_floor')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="e.g., 2"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_2_orientation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_2_orientation')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('appraisalForm.placeholders.orientation')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="north">{t('appraisalForm.options.orientations.north')}</SelectItem>
                            <SelectItem value="south">{t('appraisalForm.options.orientations.south')}</SelectItem>
                            <SelectItem value="east">{t('appraisalForm.options.orientations.east')}</SelectItem>
                            <SelectItem value="west">{t('appraisalForm.options.orientations.west')}</SelectItem>
                            <SelectItem value="northeast">{t('appraisalForm.options.orientations.northeast')}</SelectItem>
                            <SelectItem value="northwest">{t('appraisalForm.options.orientations.northwest')}</SelectItem>
                            <SelectItem value="southeast">{t('appraisalForm.options.orientations.southeast')}</SelectItem>
                            <SelectItem value="southwest">{t('appraisalForm.options.orientations.southwest')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_2_street_view"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_2_street')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('appraisalForm.placeholders.street_view')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="garden_view">{t('appraisalForm.options.street_views.garden_view')}</SelectItem>
                            <SelectItem value="main_street">{t('appraisalForm.options.street_views.main_street')}</SelectItem>
                            <SelectItem value="side_street">{t('appraisalForm.options.street_views.side_street')}</SelectItem>
                            <SelectItem value="internal_street">{t('appraisalForm.options.street_views.internal_street')}</SelectItem>
                            <SelectItem value="sea_view">{t('appraisalForm.options.street_views.sea_view')}</SelectItem>
                            <SelectItem value="nile_view">{t('appraisalForm.options.street_views.nile_view')}</SelectItem>
                            <SelectItem value="park_view">{t('appraisalForm.options.street_views.park_view')}</SelectItem>
                            <SelectItem value="building_view">{t('appraisalForm.options.street_views.building_view')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Comparable Sale 3 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Comparable Sale #3</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="comparable_sale_3_address"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_3_address')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Property address and location" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_3_sale_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_3_date')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Time since sale" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_3_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_3_price')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="1000"
                            min="0"
                            placeholder="Sale price"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_3_area"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_3_area')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="1"
                            min="0"
                            placeholder="Unit area"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_3_price_per_sqm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_3_price_per_sqm')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="100"
                            min="0"
                            placeholder="Auto-calculated"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_3_age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_3_age')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="Building age"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_3_finishing"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_3_finishing')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('appraisalForm.placeholders.finishing_level')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="core_shell">{t('appraisalForm.options.finishing_levels.core_shell')}</SelectItem>
                            <SelectItem value="semi_finished">{t('appraisalForm.options.finishing_levels.semi_finished')}</SelectItem>
                            <SelectItem value="fully_finished">{t('appraisalForm.options.finishing_levels.fully_finished')}</SelectItem>
                            <SelectItem value="luxury">{t('appraisalForm.options.finishing_levels.luxury')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_3_floor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_3_floor')}</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            placeholder="Floor number"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_3_orientation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_3_orientation')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('appraisalForm.placeholders.orientation')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="north">{t('appraisalForm.options.orientations.north')}</SelectItem>
                            <SelectItem value="south">{t('appraisalForm.options.orientations.south')}</SelectItem>
                            <SelectItem value="east">{t('appraisalForm.options.orientations.east')}</SelectItem>
                            <SelectItem value="west">{t('appraisalForm.options.orientations.west')}</SelectItem>
                            <SelectItem value="northeast">{t('appraisalForm.options.orientations.northeast')}</SelectItem>
                            <SelectItem value="northwest">{t('appraisalForm.options.orientations.northwest')}</SelectItem>
                            <SelectItem value="southeast">{t('appraisalForm.options.orientations.southeast')}</SelectItem>
                            <SelectItem value="southwest">{t('appraisalForm.options.orientations.southwest')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="comparable_sale_3_street_view"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>{t('appraisalForm.fields.comparable_sale_3_street')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('appraisalForm.placeholders.street_view')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="garden_view">{t('appraisalForm.options.street_views.garden_view')}</SelectItem>
                            <SelectItem value="main_street">{t('appraisalForm.options.street_views.main_street')}</SelectItem>
                            <SelectItem value="side_street">{t('appraisalForm.options.street_views.side_street')}</SelectItem>
                            <SelectItem value="internal_street">{t('appraisalForm.options.street_views.internal_street')}</SelectItem>
                            <SelectItem value="sea_view">{t('appraisalForm.options.street_views.sea_view')}</SelectItem>
                            <SelectItem value="nile_view">{t('appraisalForm.options.street_views.nile_view')}</SelectItem>
                            <SelectItem value="park_view">{t('appraisalForm.options.street_views.park_view')}</SelectItem>
                            <SelectItem value="building_view">{t('appraisalForm.options.street_views.building_view')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>{t('appraisalForm.notes.egyptianStandardsNote')}</strong> {t('appraisalForm.notes.comparableSalesNote')}. {t('appraisalForm.notes.comparableSalesAdjustments')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Professional Certifications (Egyptian Standards) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('appraisalForm.sections.professionalCertifications')}
              </CardTitle>
              <CardDescription>{t('appraisalForm.sections.professionalCertificationsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="egyptian_standards_compliance"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      {t('appraisalForm.fields.egyptian_standards_compliance')}
                    </FormLabel>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="professional_statement_confirmed"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal">
                      {t('appraisalForm.fields.professional_statement_confirmed')}
                    </FormLabel>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="report_validity_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('appraisalForm.fields.report_validity_months')}</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        max="24"
                        placeholder="12"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : 12)}
                      />
                    </FormControl>
                    <FormDescription>{t('appraisalForm.placeholders.report_validity_months')}</FormDescription>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Egyptian Legal Standards (فروض ومحددات التقرير) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Egyptian Legal Standards (فروض ومحددات التقرير)
              </CardTitle>
              <CardDescription className="text-sm">
                {t('appraisalForm.notes.legalStandardsNote')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Standard Compliance Checkboxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="egyptian_legal_standards.standards_compliance"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        {t('appraisalForm.sections.egyptianStandardsCompliance')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="egyptian_legal_standards.physical_inspection_completed"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        {t('appraisalForm.fields.physical_inspection_completed')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="egyptian_legal_standards.highest_best_use_applied"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        {t('appraisalForm.fields.highest_best_use_applied')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="egyptian_legal_standards.ownership_disputes_confirmed"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={!field.value}
                          onChange={(e) => field.onChange(!e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        {t('appraisalForm.fields.no_ownership_disputes')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="egyptian_legal_standards.professional_independence_declared"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        {t('appraisalForm.fields.professional_independence_declared')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="egyptian_legal_standards.market_value_definition_confirmed"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        {t('appraisalForm.fields.market_value_definition_applied')}
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Variable Fields - Property Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">{t('appraisalForm.fields.property_information_auto_filled')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="egyptian_legal_standards.property_type_arabic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.property_type_arabic')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="نوع العقار" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="egyptian_legal_standards.floor_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.floor_number')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="الدور" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="egyptian_legal_standards.building_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.building_number')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="رقم العمارة" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="egyptian_legal_standards.unit_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.unit_number')}</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="رقم الشقة" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Variable Fields - Report Dates */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">{t('appraisalForm.fields.report_information')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="egyptian_legal_standards.inspection_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.inspection_date')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="egyptian_legal_standards.report_issue_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.report_issue_date')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="egyptian_legal_standards.signature_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('appraisalForm.fields.signature_date')}</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Professional Certification Authority */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-3">{t('appraisalForm.sections.professionalCertifications')}</h4>
                <FormField
                  control={form.control}
                  name="egyptian_legal_standards.appraiser_certification_authority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('appraisalForm.fields.certification_authority')}</FormLabel>
                      <FormControl>
                        <Input {...field} disabled className="bg-gray-100" />
                      </FormControl>
                      <FormDescription>
                        {t('appraisalForm.notes.egyptianFinancialRegulatoryAuthority')} (الهيئة العامة للرقابة المالية)
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Legal Standards Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">{t('appraisalForm.fields.fra_resolution')}:</span>
                    <div className="font-semibold">#{form.watch('egyptian_legal_standards.fra_resolution_number')} of {form.watch('egyptian_legal_standards.fra_resolution_year')}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{t('appraisalForm.fields.resolution_date')}:</span>
                    <div className="font-semibold">{form.watch('egyptian_legal_standards.fra_resolution_date')}</div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">{t('appraisalForm.fields.report_validity')}:</span>
                    <div className="font-semibold">{form.watch('egyptian_legal_standards.report_validity_period_months')} {t('appraisalForm.fields.months')}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  {t('appraisalForm.notes.legalStandardsNote')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Photos and Documentation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {t('appraisalForm.sections.photosDocumentation')}
              </CardTitle>
              <CardDescription>{t('appraisalForm.sections.photosDocumentationDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Extracted Images Gallery - From Document Processing */}
              {extractedImages.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-green-800 flex items-center gap-2">
                        🖼️ {t('appraisalForm.photosDocumentation.extractedPropertyImages')}
                      </h3>
                      <p className="text-sm text-green-700">
                        {extractedImages.length} {t('appraisalForm.photosDocumentation.imagesAutomaticallyExtracted')}
                      </p>
                    </div>
                    <div className="bg-green-100 px-3 py-1 rounded-full text-xs text-green-800 font-medium">
                      {t('appraisalForm.photosDocumentation.aiExtracted')}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {extractedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-green-200">
                          <img
                            src={`data:image/${image.format};base64,${image.data}`}
                            alt={`Property image ${index + 1} from page ${image.page_number}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                        </div>
                        
                        {/* Image Info Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 rounded-b-lg">
                          <div className="text-white text-xs">
                            <div className="font-medium">Page {image.page_number}</div>
                            <div className="text-white/80">{image.width}×{image.height}</div>
                          </div>
                        </div>
                        
                        {/* Category Badge */}
                        {image.category && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            {image.category.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Image Statistics */}
                  <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="font-medium text-gray-900">{extractedImages.length}</div>
                        <div>Images Found</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {Math.max(...extractedImages.map(img => img.page_number || 0))}
                        </div>
                        <div>Pages Scanned</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">AI</div>
                        <div>Auto-Extracted</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-sm font-medium">{t('appraisalForm.photosDocumentation.propertyPhotos')}</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Label className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          {t('appraisalForm.photosDocumentation.uploadPropertyPhotos')}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          {t('appraisalForm.photosDocumentation.propertyPhotosFormat')}
                        </span>
                        <input type="file" className="sr-only" multiple accept="image/*" />
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label className="text-sm font-medium">{t('appraisalForm.photosDocumentation.aerialPhotos')}</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Label className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          {t('appraisalForm.photosDocumentation.uploadAerialPhotos')}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          {t('appraisalForm.photosDocumentation.aerialPhotosDescription')}
                        </span>
                        <input type="file" className="sr-only" multiple accept="image/*" />
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Label className="text-sm font-medium">{t('appraisalForm.photosDocumentation.floorPlan')}</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Label className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          {t('appraisalForm.photosDocumentation.uploadFloorPlan')}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          {t('appraisalForm.photosDocumentation.floorPlanFormat')}
                        </span>
                        <input type="file" className="sr-only" accept="image/*,.pdf" />
                      </Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label className="text-sm font-medium">{t('appraisalForm.photosDocumentation.legalDocuments')}</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-4">
                      <Label className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          {t('appraisalForm.photosDocumentation.uploadLegalDocuments')}
                        </span>
                        <span className="mt-1 block text-xs text-gray-500">
                          {t('appraisalForm.photosDocumentation.legalDocumentsDescription')}
                        </span>
                        <input type="file" className="sr-only" multiple accept=".pdf,.jpg,.png" />
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  {t('appraisalForm.photosDocumentation.uploadNote')}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Auto-calculated Values */}
          {calculations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  {t('appraisalForm.calculatedPropertyValue.title')}
                  {isCalculating && <Loader2 className="h-4 w-4 animate-spin" />}
                </CardTitle>
                <CardDescription>
                  {t('appraisalForm.calculatedPropertyValue.description')}
                  ({t('appraisalForm.calculatedPropertyValue.confidence')}: {calculations.confidence_level}%)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <Label className="text-sm text-blue-600">{t('appraisalForm.calculatedPropertyValue.marketValue')}</Label>
                    <div className="text-2xl font-bold text-blue-700">
                      {(calculations.market_value_estimate ?? 0).toLocaleString()} EGP
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <Label className="text-sm text-green-600">{t('appraisalForm.calculatedPropertyValue.pricePerSqm')}</Label>
                    <div className="text-2xl font-bold text-green-700">
                      {(calculations.price_per_sqm ?? 0).toLocaleString()} EGP
                    </div>
                  </div>
                  
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <Label className="text-sm text-orange-600">{t('appraisalForm.calculatedPropertyValue.landValue')}</Label>
                    <div className="text-2xl font-bold text-orange-700">
                      {(calculations.land_value ?? 0).toLocaleString()} EGP
                    </div>
                  </div>
                  
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <Label className="text-sm text-purple-600">{t('appraisalForm.calculatedPropertyValue.buildingValue')}</Label>
                    <div className="text-2xl font-bold text-purple-700">
                      {(calculations.building_value ?? 0).toLocaleString()} EGP
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm text-gray-600 block mb-2">{t('appraisalForm.calculatedPropertyValue.calculationBreakdown')}</Label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">{t('appraisalForm.calculatedPropertyValue.baseCost')}:</span>
                      <div className="font-semibold">{(calculations.calculation_breakdown?.base_building_cost ?? 0).toLocaleString()} EGP</div>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('appraisalForm.calculatedPropertyValue.ageDepreciation')}:</span>
                      <div className="font-semibold">-{(calculations.calculation_breakdown?.age_depreciation ?? 0).toLocaleString()} EGP</div>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('appraisalForm.calculatedPropertyValue.conditionAdj')}:</span>
                      <div className="font-semibold">{(calculations.calculation_breakdown?.condition_adjustment ?? 0) >= 0 ? '+' : ''}{(calculations.calculation_breakdown?.condition_adjustment ?? 0).toLocaleString()} EGP</div>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('appraisalForm.calculatedPropertyValue.locationAdj')}:</span>
                      <div className="font-semibold">{(calculations.calculation_breakdown?.location_adjustment ?? 0) >= 0 ? '+' : ''}{(calculations.calculation_breakdown?.location_adjustment ?? 0).toLocaleString()} EGP</div>
                    </div>
                    <div>
                      <span className="text-gray-500">{t('appraisalForm.calculatedPropertyValue.marketAdj')}:</span>
                      <div className="font-semibold">{(calculations.calculation_breakdown?.market_adjustment ?? 0) >= 0 ? '+' : ''}{(calculations.calculation_breakdown?.market_adjustment ?? 0).toLocaleString()} EGP</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Property Description Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Generated Property Description
              </CardTitle>
              <CardDescription>
                Auto-generated description from appraisal data - edit as needed or regenerate variations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <PropertyDescriptionSection 
                formData={form.getValues()}
                isCompleted={calculations !== null}
                onDescriptionChange={setDescriptionData}
              />
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => {
              form.reset();
              setHasCalculated(false); // Reset calculation flag for new form
              setCalculations(null); // Clear previous calculations
            }}>
              Reset Form
            </Button>
            <Button type="button" variant="secondary" onClick={manualRecalculate} disabled={isCalculating}>
              {isCalculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="mr-2 h-4 w-4" />
                  Recalculate
                </>
              )}
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading}
              onClick={(e) => {
                console.log('🔴 Save Appraisal button clicked!', {
                  formValid: form.formState.isValid,
                  errors: form.formState.errors,
                  errorCount: Object.keys(form.formState.errors).length,
                  isLoading
                });
                
                // Debug specific validation errors
                if (!form.formState.isValid) {
                  console.log('❌ Form validation errors in detail:');
                  Object.entries(form.formState.errors).forEach(([field, error]) => {
                    console.log(`   - ${field}:`, error);
                  });
                  
                  // Try to get current form values for the problematic fields
                  const currentValues = form.getValues();
                  Object.keys(form.formState.errors).forEach(field => {
                    console.log(`   - ${field} current value:`, currentValues[field as keyof typeof currentValues]);
                  });
                }
                // Don't prevent default - let form submission proceed
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Appraisal'
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}