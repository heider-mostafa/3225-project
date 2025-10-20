import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import EgyptianPropertyCalculator from '@/lib/services/egyptian-property-calculator';

interface CalculationRequest {
  area: number;
  age: number;
  condition: number;
  location: string;
  propertyType: 'residential' | 'commercial' | 'villa' | 'apartment';
  landArea?: number;
  finishingLevel?: 'core_shell' | 'semi_finished' | 'fully_finished' | 'luxury';
  constructionType?: 'concrete' | 'brick' | 'steel' | 'mixed';
  neighborhoodRating?: number;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check appraiser permissions using user_profiles (fixed recursion issue)
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.log('Calculate API profile check error:', profileError);
    }

    const userRole = userProfile?.preferences?.role;
    let hasAppraisalAccess = userRole && ['appraiser', 'admin', 'super_admin'].includes(userRole);

    // Fallback: Check if user has a broker record (is an appraiser)
    if (!hasAppraisalAccess) {
      const { data: brokerCheck } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      hasAppraisalAccess = !!brokerCheck;
    }

    if (!hasAppraisalAccess) {
      return NextResponse.json(
        { error: 'Access denied. Appraiser role required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: CalculationRequest = await request.json();
    
    // Validate required fields (handle age = 0 case properly)
    if (!body.area || body.age === undefined || body.age === null || !body.condition || !body.location || !body.propertyType) {
      console.log('Missing required fields in calculation request:', {
        area: body.area,
        age: body.age,
        condition: body.condition,
        location: body.location,
        propertyType: body.propertyType,
        receivedBody: body
      });
      return NextResponse.json(
        { 
          error: 'Missing required fields: area, age, condition, location, propertyType',
          received: {
            area: body.area,
            age: body.age,
            condition: body.condition,
            location: body.location,
            propertyType: body.propertyType
          }
        },
        { status: 400 }
      );
    }

    // Prepare property data for calculation
    const propertyData = {
      built_area_sqm: body.area,
      land_area_sqm: body.landArea || body.area * 1.2, // Default land area if not provided
      building_age_years: body.age,
      overall_condition_rating: body.condition,
      property_type: body.propertyType,
      district_name: body.location,
      finishing_level: body.finishingLevel || 'fully_finished',
      construction_type: body.constructionType || 'concrete',
      neighborhood_quality_rating: body.neighborhoodRating || 7
    };

    // Load formulas from database directly
    const { data: formulas, error: formulasError } = await supabase
      .from('appraisal_calculation_formulas')
      .select('*')
      .eq('is_active', true)
      .order('formula_type', { ascending: true })
      .order('property_type', { ascending: true });

    if (formulasError) {
      console.error('Failed to load formulas:', formulasError);
    }

    // Initialize calculator with formulas
    const calculator = new EgyptianPropertyCalculator();
    if (formulas) {
      calculator.loadFormulasFromData(formulas);
    }

    // Validate property data
    const validationErrors = calculator.validatePropertyData(propertyData);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Calculate property value
    const valuation = await calculator.calculatePropertyValue(propertyData);

    // Log calculation for audit trail
    const { error: logError } = await supabase
      .from('property_calculation_logs')
      .insert({
        user_id: user.id,
        calculation_type: 'property_valuation',
        input_data: propertyData,
        result_data: valuation,
        calculated_at: new Date().toISOString()
      });

    if (logError) {
      console.error('Failed to log calculation:', logError);
      // Continue anyway - logging failure shouldn't break the calculation
    }

    return NextResponse.json({
      success: true,
      data: valuation,
      metadata: {
        calculated_at: new Date().toISOString(),
        calculated_by: user.id,
        calculation_method: 'egyptian_standards'
      }
    });

  } catch (error) {
    console.error('Calculation error:', error);
    return NextResponse.json(
      { error: 'Internal server error during calculation' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get available calculation formulas
    const { data: formulas, error: formulasError } = await supabase
      .from('appraisal_calculation_formulas')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (formulasError) {
      return NextResponse.json(
        { error: 'Failed to fetch calculation formulas' },
        { status: 500 }
      );
    }

    // Get available market data districts
    const availableDistricts = [
      {
        name: 'New Cairo',
        key: 'new_cairo',
        average_price_per_sqm: 15000,
        market_trend: 'rising'
      },
      {
        name: 'Zamalek',
        key: 'zamalek',
        average_price_per_sqm: 25000,
        market_trend: 'stable'
      },
      {
        name: 'Heliopolis',
        key: 'heliopolis',
        average_price_per_sqm: 18000,
        market_trend: 'stable'
      },
      {
        name: '6th of October',
        key: '6th_october',
        average_price_per_sqm: 12000,
        market_trend: 'rising'
      },
      {
        name: 'Sheikh Zayed',
        key: 'sheikh_zayed',
        average_price_per_sqm: 16000,
        market_trend: 'rising'
      },
      {
        name: 'Maadi',
        key: 'maadi',
        average_price_per_sqm: 20000,
        market_trend: 'stable'
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        formulas: formulas,
        districts: availableDistricts,
        property_types: ['residential', 'commercial', 'villa', 'apartment'],
        finishing_levels: ['core_shell', 'semi_finished', 'fully_finished', 'luxury'],
        construction_types: ['concrete', 'brick', 'steel', 'mixed']
      }
    });

  } catch (error) {
    console.error('Error fetching calculation data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Add OPTIONS method for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}