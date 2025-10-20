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
      console.warn('Cookie parsing issue, using fallback:', cookieError);
      supabase = createRouteHandlerClient({ 
        cookies: () => new Map()
      });
    }
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'opportunities' | 'yields' | 'ratings'

    switch (type) {
      case 'opportunities':
        return getInvestmentOpportunities(supabase);
      case 'yields':
        return getRentalYields(supabase);
      case 'ratings':
        return getNeighborhoodRatings(supabase);
      default:
        return getPremiumOverview(supabase);
    }
  } catch (error) {
    console.error('Premium Market Intelligence API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch premium market intelligence data' },
      { status: 500 }
    );
  }
}

async function getPremiumOverview(supabase: any) {
  try {
    console.log('💎 PREMIUM INTELLIGENCE DEBUG - Fetching premium overview');
    
    // Get premium intelligence data from cache
    const { data: premiumData, error: premiumError } = await supabase
      .from('market_intelligence_cache')
      .select(`
        location_type,
        location_name,
        total_appraisals,
        avg_price_per_sqm,
        rental_yield_percentage,
        monthly_rental_estimate,
        neighborhood_quality_rating,
        comparable_price_per_sqm,
        investment_attractiveness,
        investment_score,
        market_activity,
        last_updated
      `)
      .not('rental_yield_percentage', 'is', null)
      .or('monthly_rental_estimate.not.is.null,neighborhood_quality_rating.not.is.null')
      .order('investment_score', { ascending: false });

    console.log('💎 Premium data result:', { 
      count: premiumData?.length, 
      error: premiumError 
    });

    if (premiumError) {
      console.error('Premium data query error:', premiumError);
    }

    // Fallback: Extract premium data from appraisals if cache is empty
    let extractedData = [];
    if (!premiumData || premiumData.length === 0) {
      console.log('💎 Cache empty, extracting premium data from appraisals...');
      
      const { data: appraisalsData, error: appraisalsError } = await supabase
        .from('property_appraisals')
        .select('form_data, market_value_estimate, created_at')
        .eq('status', 'completed');

      if (appraisalsData && appraisalsData.length > 0) {
        const locationMap = new Map();
        
        appraisalsData.forEach((appraisal: any) => {
          const formData = appraisal.form_data || {};
          const compound = formData.compound_name;
          const area = formData.area || formData.district_name;
          
          const locationName = compound || area;
          if (!locationName) return;
          
          const key = locationName;
          if (!locationMap.has(key)) {
            locationMap.set(key, {
              location_name: locationName,
              location_type: compound ? 'compound' : 'area',
              total_appraisals: 0,
              rental_data: [],
              quality_ratings: [],
              market_values: [],
              areas: []
            });
          }
          
          const location = locationMap.get(key);
          location.total_appraisals += 1;
          
          // Extract premium intelligence
          const monthlyRental = formData.monthly_rental_estimate;
          const qualityRating = formData.neighborhood_quality_rating || formData.accessibility_rating;
          const marketValue = appraisal.market_value_estimate;
          const propertyArea = formData.unit_area_sqm || formData.built_area || formData.total_area;
          
          if (monthlyRental) location.rental_data.push(parseFloat(monthlyRental));
          if (qualityRating) location.quality_ratings.push(parseInt(qualityRating));
          if (marketValue && propertyArea) {
            location.market_values.push(marketValue);
            location.areas.push(propertyArea);
          }
        });
        
        // Calculate aggregated metrics
        extractedData = Array.from(locationMap.values()).map((location: any) => {
          const avgRental = location.rental_data.length > 0 
            ? location.rental_data.reduce((a: number, b: number) => a + b, 0) / location.rental_data.length 
            : 0;
            
          const avgQuality = location.quality_ratings.length > 0
            ? location.quality_ratings.reduce((a: number, b: number) => a + b, 0) / location.quality_ratings.length
            : 0;
            
          const totalValue = location.market_values.reduce((a: number, b: number) => a + b, 0);
          const totalArea = location.areas.reduce((a: number, b: number) => a + b, 0);
          const avgPricePerSqm = totalArea > 0 ? totalValue / totalArea : 0;
          
          const rentalYield = avgRental > 0 && totalValue > 0 
            ? (avgRental * 12 / (totalValue / location.market_values.length)) * 100
            : 0;
            
          const investmentScore = calculateInvestmentScore(rentalYield, avgQuality);
          
          return {
            location_name: location.location_name,
            location_type: location.location_type,
            total_appraisals: location.total_appraisals,
            avg_price_per_sqm: Math.round(avgPricePerSqm),
            rental_yield_percentage: Math.round(rentalYield * 100) / 100,
            monthly_rental_estimate: Math.round(avgRental),
            neighborhood_quality_rating: Math.round(avgQuality * 10) / 10,
            investment_attractiveness: getInvestmentLevel(investmentScore),
            investment_score: investmentScore,
            market_activity: 'moderate',
            last_updated: new Date().toISOString()
          };
        }).filter((item: any) => item.rental_yield_percentage > 0 || item.neighborhood_quality_rating > 0);
      }
    }

    const finalData = premiumData && premiumData.length > 0 ? premiumData : extractedData;

    // Calculate overview metrics
    const overviewMetrics = {
      totalLocationsWithPremiumData: finalData.length,
      averageRentalYield: finalData.length > 0 
        ? finalData.reduce((sum: number, item: any) => sum + (item.rental_yield_percentage || 0), 0) / finalData.length 
        : 0,
      averageMonthlyRental: finalData.length > 0 
        ? finalData.reduce((sum: number, item: any) => sum + (item.monthly_rental_estimate || 0), 0) / finalData.length 
        : 0,
      averageQualityRating: finalData.length > 0 
        ? finalData.reduce((sum: number, item: any) => sum + (item.neighborhood_quality_rating || 0), 0) / finalData.length 
        : 0,
      highYieldLocations: finalData.filter((item: any) => (item.rental_yield_percentage || 0) > 6).length,
      premiumLocations: finalData.filter((item: any) => (item.neighborhood_quality_rating || 0) >= 8).length,
      investmentOpportunities: finalData.filter((item: any) => item.investment_attractiveness === 'high').length
    };

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          ...overviewMetrics,
          averageRentalYield: Math.round(overviewMetrics.averageRentalYield * 100) / 100,
          averageMonthlyRental: Math.round(overviewMetrics.averageMonthlyRental),
          averageQualityRating: Math.round(overviewMetrics.averageQualityRating * 10) / 10
        },
        locations: finalData.slice(0, 20), // Top 20 for overview
        dataSource: premiumData && premiumData.length > 0 ? 'cache' : 'extracted',
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Premium overview query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch premium overview' },
      { status: 500 }
    );
  }
}

async function getInvestmentOpportunities(supabase: any) {
  try {
    const { data: opportunitiesData, error } = await supabase
      .from('market_intelligence_cache')
      .select(`
        location_name,
        location_type,
        total_appraisals,
        avg_price_per_sqm,
        rental_yield_percentage,
        monthly_rental_estimate,
        neighborhood_quality_rating,
        investment_attractiveness,
        investment_score,
        market_activity
      `)
      .not('investment_score', 'is', null)
      .order('investment_score', { ascending: false })
      .limit(15);

    return NextResponse.json({
      success: true,
      data: opportunitiesData || []
    });

  } catch (error) {
    console.error('Investment opportunities query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investment opportunities' },
      { status: 500 }
    );
  }
}

async function getRentalYields(supabase: any) {
  try {
    const { data: yieldsData, error } = await supabase
      .from('market_intelligence_cache')
      .select(`
        location_name,
        location_type,
        total_appraisals,
        avg_price_per_sqm,
        rental_yield_percentage,
        monthly_rental_estimate,
        last_updated
      `)
      .not('rental_yield_percentage', 'is', null)
      .order('rental_yield_percentage', { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      data: yieldsData || []
    });

  } catch (error) {
    console.error('Rental yields query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rental yields' },
      { status: 500 }
    );
  }
}

async function getNeighborhoodRatings(supabase: any) {
  try {
    const { data: ratingsData, error } = await supabase
      .from('market_intelligence_cache')
      .select(`
        location_name,
        location_type,
        total_appraisals,
        avg_price_per_sqm,
        neighborhood_quality_rating,
        market_activity,
        last_updated
      `)
      .not('neighborhood_quality_rating', 'is', null)
      .order('neighborhood_quality_rating', { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      data: ratingsData || []
    });

  } catch (error) {
    console.error('Neighborhood ratings query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch neighborhood ratings' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateInvestmentScore(rentalYield: number, qualityRating: number): number {
  let score = 50; // Base score
  
  // Rental yield scoring (0-30 points)
  if (rentalYield > 8) score += 30;
  else if (rentalYield > 6) score += 25;
  else if (rentalYield > 4) score += 15;
  else if (rentalYield > 2) score += 10;
  
  // Quality rating scoring (0-20 points)
  if (qualityRating >= 9) score += 20;
  else if (qualityRating >= 8) score += 15;
  else if (qualityRating >= 7) score += 10;
  else if (qualityRating >= 6) score += 5;
  
  return Math.min(100, Math.max(0, score));
}

function getInvestmentLevel(score: number): string {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}