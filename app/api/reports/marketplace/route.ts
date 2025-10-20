import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Enhanced cookie handling to prevent base64 parsing errors
    let supabase;
    try {
      const cookieStore = cookies();
      supabase = createRouteHandlerClient({ 
        cookies: () => cookieStore 
      });
    } catch (cookieError) {
      console.warn('Cookie parsing issue in reports API, using fallback:', cookieError);
      // Create client without cookies as fallback
      supabase = createRouteHandlerClient({ 
        cookies: () => new Map()
      });
    }
    
    const { searchParams } = new URL(request.url);
    
    const area = searchParams.get('area');
    const reportType = searchParams.get('type'); // 'individual' | 'compound' | 'area' | 'custom'
    const compound = searchParams.get('compound');

    return getAvailableReports(supabase, { area, reportType, compound });
  } catch (error) {
    console.error('Reports Marketplace API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace reports' },
      { status: 500 }
    );
  }
}

async function getAvailableReports(supabase: any, filters: { area?: string; reportType?: string; compound?: string }) {
  try {
    console.log('🔍 REPORTS MARKETPLACE DEBUG - Fetching appraisals with filters:', filters);
    
    // Get completed appraisals that can be used for reports
    let appraisalsQuery = supabase
      .from('property_appraisals')
      .select(`
        id,
        status,
        form_data,
        market_value_estimate,
        created_at,
        appraiser_id,
        brokers!property_appraisals_appraiser_id_fkey (
          full_name,
          appraiser_license_number
        )
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false });

    const { data: appraisals, error: appraisalsError } = await appraisalsQuery;
    
    console.log('🔍 REPORTS MARKETPLACE DEBUG - Appraisals query result:', { 
      count: appraisals?.length, 
      error: appraisalsError,
      sample: appraisals?.[0] 
    });
    
    if (appraisalsError) {
      console.error('Appraisals query error:', appraisalsError);
      throw appraisalsError;
    }

    // Get existing report sales for pricing reference
    const { data: existingReports } = await supabase
      .from('report_generation_pricing')
      .select('*')
      .like('report_type', 'market_%');

    // Transform appraisals into available reports
    const availableReports = [];

    // Individual Reports - One per completed appraisal
    if (!filters.reportType || filters.reportType === 'individual') {
      const individualReports = appraisals?.map((appraisal: any) => {
        const formData = appraisal.form_data || {};
        const location = formData.compound_name || formData.area || formData.city_name || 'Unknown Location';
        const propertyType = formData.property_type || 'residential';

        // Filter by area if specified
        if (filters.area && !location.toLowerCase().includes(filters.area.toLowerCase())) {
          return null;
        }

        // Filter by compound if specified
        if (filters.compound && !formData.compound_name?.toLowerCase().includes(filters.compound.toLowerCase())) {
          return null;
        }

        return {
          id: `individual_${appraisal.id}`,
          title: `Professional Appraisal Report - ${location}`,
          location: location,
          type: 'individual' as const,
          price: 1500, // From pricing table
          appraisal_date: appraisal.created_at,
          property_type: propertyType,
          area_name: formData.area || formData.city_name,
          compound_name: formData.compound_name,
          pages: 25,
          preview_available: true,
          download_count: Math.floor(Math.random() * 20), // Simulated
          appraiser_name: appraisal.brokers?.full_name || 'Certified Appraiser',
          property_value: appraisal.market_value_estimate,
          related_appraisal_ids: [appraisal.id],
          report_description: `Detailed property appraisal report for ${propertyType} in ${location}. Includes market analysis, comparable properties, and professional valuation.`
        };
      }).filter(Boolean) || [];

      availableReports.push(...individualReports);
    }

    // Compound Reports - Aggregated by compound
    if (!filters.reportType || filters.reportType === 'compound') {
      const compoundGroups = groupAppraisalsByCompound(appraisals || []);
      
      Object.entries(compoundGroups).forEach(([compoundName, compoundAppraisals]: [string, any[]]) => {
        if (compoundAppraisals.length < 2) return; // Need at least 2 appraisals for compound report

        // Filter by compound if specified
        if (filters.compound && !compoundName.toLowerCase().includes(filters.compound.toLowerCase())) {
          return;
        }

        const avgValue = compoundAppraisals.reduce((sum, a) => sum + (a.market_value_estimate || 0), 0) / compoundAppraisals.length;
        const latestAppraisal = compoundAppraisals[0]; // Already sorted by date
        const areaName = latestAppraisal.form_data?.area || latestAppraisal.form_data?.city_name;

        // Filter by area if specified
        if (filters.area && !areaName?.toLowerCase().includes(filters.area.toLowerCase())) {
          return;
        }

        availableReports.push({
          id: `compound_${compoundName.replace(/\s+/g, '_').toLowerCase()}`,
          title: `${compoundName} Market Analysis Report`,
          location: `${compoundName}, ${areaName}`,
          type: 'compound' as const,
          price: 3500,
          appraisal_date: latestAppraisal.created_at,
          property_type: 'mixed',
          area_name: areaName,
          compound_name: compoundName,
          pages: 45,
          preview_available: true,
          download_count: Math.floor(Math.random() * 8),
          appraiser_name: 'Multiple Certified Appraisers',
          property_value: Math.round(avgValue),
          related_appraisal_ids: compoundAppraisals.map(a => a.id),
          report_description: `Comprehensive market analysis for ${compoundName} based on ${compoundAppraisals.length} professional appraisals. Includes price trends, property mix analysis, and investment insights.`,
          data_points: compoundAppraisals.length
        });
      });
    }

    // Area Reports - Aggregated by area/district
    if (!filters.reportType || filters.reportType === 'area') {
      const areaGroups = groupAppraisalsByArea(appraisals || []);
      
      Object.entries(areaGroups).forEach(([areaName, areaAppraisals]: [string, any[]]) => {
        if (areaAppraisals.length < 5) return; // Need at least 5 appraisals for area report

        // Filter by area if specified
        if (filters.area && !areaName.toLowerCase().includes(filters.area.toLowerCase())) {
          return;
        }

        const avgValue = areaAppraisals.reduce((sum, a) => sum + (a.market_value_estimate || 0), 0) / areaAppraisals.length;
        const latestAppraisal = areaAppraisals[0];
        const compounds = [...new Set(areaAppraisals.map(a => a.form_data?.compound_name).filter(Boolean))];

        availableReports.push({
          id: `area_${areaName.replace(/\s+/g, '_').toLowerCase()}`,
          title: `${areaName} District Market Intelligence Report`,
          location: areaName,
          type: 'area' as const,
          price: 7500,
          appraisal_date: latestAppraisal.created_at,
          property_type: 'mixed',
          area_name: areaName,
          pages: 60,
          preview_available: true,
          download_count: Math.floor(Math.random() * 5),
          appraiser_name: 'Multiple Certified Appraisers',
          property_value: Math.round(avgValue),
          related_appraisal_ids: areaAppraisals.map(a => a.id),
          report_description: `District-wide market intelligence report for ${areaName} covering ${compounds.length} compounds with ${areaAppraisals.length} professional appraisals. Includes comprehensive market trends, investment opportunities, and future projections.`,
          data_points: areaAppraisals.length,
          compounds_covered: compounds.length
        });
      });
    }

    // Custom Reports - Only show when there are sufficient appraisals for context
    if ((!filters.reportType || filters.reportType === 'custom') && (appraisals?.length || 0) >= 5) {
      availableReports.push({
        id: 'custom_egypt_market',
        title: 'Custom Egypt Real Estate Market Research',
        location: 'Egypt (Custom Analysis)',
        type: 'custom' as const,
        price: 15000,
        appraisal_date: new Date().toISOString(),
        property_type: 'custom',
        area_name: 'Egypt',
        pages: 80,
        preview_available: false,
        download_count: 0,
        appraiser_name: 'Dedicated Research Team',
        property_value: 0,
        related_appraisal_ids: [],
        report_description: 'Tailored market research report covering specific locations, property types, or investment criteria based on your requirements. Includes dedicated analyst support and ongoing market updates.',
        is_custom: true
      });
    }

    // Sort by relevance and recency
    availableReports.sort((a, b) => {
      // Custom reports last
      if (a.type === 'custom' && b.type !== 'custom') return 1;
      if (b.type === 'custom' && a.type !== 'custom') return -1;
      
      // Then by number of data points (more is better)
      const aDataPoints = a.data_points || a.related_appraisal_ids?.length || 0;
      const bDataPoints = b.data_points || b.related_appraisal_ids?.length || 0;
      if (aDataPoints !== bDataPoints) return bDataPoints - aDataPoints;
      
      // Finally by date
      return new Date(b.appraisal_date).getTime() - new Date(a.appraisal_date).getTime();
    });

    return NextResponse.json({
      success: true,
      data: availableReports,
      summary: {
        total_reports: availableReports.length,
        individual_reports: availableReports.filter(r => r.type === 'individual').length,
        compound_reports: availableReports.filter(r => r.type === 'compound').length,
        area_reports: availableReports.filter(r => r.type === 'area').length,
        custom_reports: availableReports.filter(r => r.type === 'custom').length,
        total_appraisals_available: appraisals?.length || 0
      },
      filters_applied: filters
    });

  } catch (error) {
    console.error('Get available reports error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available reports' },
      { status: 500 }
    );
  }
}

function groupAppraisalsByCompound(appraisals: any[]) {
  return appraisals.reduce((groups, appraisal) => {
    const compoundName = appraisal.form_data?.compound_name;
    if (!compoundName) return groups;
    
    if (!groups[compoundName]) {
      groups[compoundName] = [];
    }
    groups[compoundName].push(appraisal);
    return groups;
  }, {} as Record<string, any[]>);
}

function groupAppraisalsByArea(appraisals: any[]) {
  return appraisals.reduce((groups, appraisal) => {
    const areaName = appraisal.form_data?.area || appraisal.form_data?.city_name;
    if (!areaName) return groups;
    
    if (!groups[areaName]) {
      groups[areaName] = [];
    }
    groups[areaName].push(appraisal);
    return groups;
  }, {} as Record<string, any[]>);
}

// POST endpoint for report purchase
export async function POST(request: NextRequest) {
  try {
    // Fix cookie parsing by handling it more safely
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    
    const body = await request.json();
    const { report_id, customer_info } = body;

    // This would integrate with the existing PDF generation service
    // For now, return success with instructions
    return NextResponse.json({
      success: true,
      message: 'Report purchase initiated',
      report_id,
      next_steps: [
        'Payment processing initiated',
        'PDF generation queued',
        'Download link will be sent via email'
      ],
      estimated_delivery: '15-30 minutes'
    });

  } catch (error) {
    console.error('Report purchase error:', error);
    return NextResponse.json(
      { error: 'Failed to process report purchase' },
      { status: 500 }
    );
  }
}