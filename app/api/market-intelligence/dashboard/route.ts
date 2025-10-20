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
      // Create client without cookies as fallback
      supabase = createRouteHandlerClient({ 
        cookies: () => new Map()
      });
    }
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'overview' | 'areas' | 'trending'

    switch (type) {
      case 'overview':
        return getMarketOverview(supabase);
      case 'areas':
        return getMarketAreas(supabase);
      case 'trending':
        return getTrendingAreas(supabase);
      default:
        return getMarketOverview(supabase);
    }
  } catch (error) {
    console.error('Market Intelligence Dashboard API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market intelligence data' },
      { status: 500 }
    );
  }
}

async function getMarketOverview(supabase: any) {
  try {
    console.log('🔍 ENHANCED MARKET INTELLIGENCE DEBUG - Fetching enhanced cache data');
    
    // Get enhanced market intelligence cache with premium intelligence data
    const { data: cacheData, error: cacheError } = await supabase
      .from('market_intelligence_cache')
      .select(`
        location_type,
        location_name,
        total_appraisals,
        avg_price_per_sqm,
        market_activity,
        confidence_level,
        last_updated,
        last_price_update,
        price_trend_6_months,
        price_trend_1_year,
        market_velocity_days,
        rental_yield_percentage,
        monthly_rental_estimate,
        neighborhood_quality_rating,
        comparable_price_per_sqm,
        investment_attractiveness,
        investment_score
      `)
      .not('avg_price_per_sqm', 'is', null)
      .order('total_appraisals', { ascending: false });

    console.log('🔍 ENHANCED MARKET INTELLIGENCE DEBUG - Cache query result:', { 
      count: cacheData?.length, 
      error: cacheError,
      sample: cacheData?.[0],
      locations_with_prices: cacheData?.length || 0 
    });

    // Get all appraisals for accurate counting
    const { data: appraisalsData, error: appraisalsError } = await supabase
      .from('property_appraisals')
      .select('id, status, market_value_estimate, created_at, form_data')
      .eq('status', 'completed');

    console.log('🔍 ENHANCED MARKET INTELLIGENCE DEBUG - Direct appraisals query result:', { 
      count: appraisalsData?.length, 
      error: appraisalsError,
      sample: appraisalsData?.[0] 
    });

    if (cacheError) {
      console.error('Enhanced cache query error:', cacheError);
    }

    // Use direct appraisal count (no double counting issue now)
    const totalAppraisals = appraisalsData?.length || 0;

    if (totalAppraisals === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalAppraisals: 0,
          activeAreas: 0,
          totalReports: 0,
          avgPricePerSqm: 0,
          recentActivity: 'No completed appraisals yet - complete your first appraisal to see market intelligence',
          marketStatus: 'Waiting for data'
        }
      });
    }

    // Calculate enhanced overview statistics
    const activeAreas = cacheData?.length || 0;
    
    // Calculate market-wide weighted average price per sqm
    let marketWideAvgPrice = 0;
    if (cacheData && cacheData.length > 0) {
      // Use weighted average based on number of appraisals in each location
      const totalWeightedPrice = cacheData.reduce((sum: number, item: any) => {
        return sum + ((item.avg_price_per_sqm || 0) * (item.total_appraisals || 0));
      }, 0);
      const totalAppraisalsInCache = cacheData.reduce((sum: number, item: any) => {
        return sum + (item.total_appraisals || 0);
      }, 0);
      
      marketWideAvgPrice = totalAppraisalsInCache > 0 ? totalWeightedPrice / totalAppraisalsInCache : 0;
      
      console.log('🔍 ENHANCED PRICE CALCULATION:', {
        totalWeightedPrice,
        totalAppraisalsInCache,
        marketWideAvgPrice: Math.round(marketWideAvgPrice)
      });
    }
    
    // Fallback: calculate from direct appraisals if cache is empty
    let directAvgValue = 0;
    if (marketWideAvgPrice === 0 && appraisalsData?.length > 0) {
      // Calculate simple average from appraisals with area data
      const appraisalsWithArea = appraisalsData.filter((item: any) => {
        const area = item.form_data?.unit_area_sqm || item.form_data?.built_area || item.form_data?.total_area;
        return item.market_value_estimate && area && area > 0;
      });
      
      if (appraisalsWithArea.length > 0) {
        const totalValue = appraisalsWithArea.reduce((sum: number, item: any) => sum + item.market_value_estimate, 0);
        const totalArea = appraisalsWithArea.reduce((sum: number, item: any) => {
          const area = item.form_data?.unit_area_sqm || item.form_data?.built_area || item.form_data?.total_area;
          return sum + area;
        }, 0);
        directAvgValue = totalArea > 0 ? totalValue / totalArea : 0;
      }
    }

    // Get count of active appraisers (those who have completed appraisals)
    let activeAppraisers = 0;
    try {
      const { data: appraisersData } = await supabase
        .from('property_appraisals')
        .select('appraiser_id')
        .eq('status', 'completed')
        .not('appraiser_id', 'is', null);
      
      // Count unique appraiser IDs
      const uniqueAppraisers = new Set(appraisersData?.map(a => a.appraiser_id) || []);
      activeAppraisers = uniqueAppraisers.size;
    } catch (error) {
      console.log('Error counting active appraisers:', error);
    }

    // Get total reports from market_report_sales if table exists
    let totalReports = 0;
    try {
      const { data: reportsData } = await supabase
        .from('market_report_sales')
        .select('id');
      totalReports = reportsData?.length || 0;
    } catch (error) {
      // Table might not exist yet, that's ok
      console.log('market_report_sales table not found, using fallback');
    }

    const finalAvgValue = Math.round(marketWideAvgPrice || directAvgValue);
    const recentActivity = totalAppraisals > 0 
      ? `${totalAppraisals} properties appraised${activeAreas > 0 ? ` across ${activeAreas} areas` : ''}`
      : 'No appraisals completed yet';

    // Calculate market intelligence metrics
    const locationsWithHighConfidence = cacheData?.filter((item: any) => item.confidence_level === 'high').length || 0;
    const hotMarkets = cacheData?.filter((item: any) => item.market_activity === 'hot').length || 0;
    const dataFreshness = cacheData?.length > 0 
      ? Math.max(...cacheData.map((item: any) => new Date(item.last_price_update || item.last_updated).getTime()))
      : Date.now();

    // Calculate market trends
    const marketTrends = cacheData?.length > 0 ? {
      avg_6_month_trend: cacheData.reduce((sum: number, item: any) => sum + (item.price_trend_6_months || 0), 0) / cacheData.length,
      avg_1_year_trend: cacheData.reduce((sum: number, item: any) => sum + (item.price_trend_1_year || 0), 0) / cacheData.length,
      positive_trend_areas: cacheData.filter((item: any) => (item.price_trend_1_year || 0) > 0).length,
      declining_areas: cacheData.filter((item: any) => (item.price_trend_1_year || 0) < -5).length
    } : {
      avg_6_month_trend: 0,
      avg_1_year_trend: 0,
      positive_trend_areas: 0,
      declining_areas: 0
    };

    console.log('🔍 ENHANCED MARKET INTELLIGENCE DEBUG - Final response:', {
      totalAppraisals,
      activeAreas,
      activeAppraisers,
      totalReports,
      avgPricePerSqm: finalAvgValue,
      recentActivity,
      locationsWithHighConfidence,
      hotMarkets,
      dataQuality: Math.round((locationsWithHighConfidence / Math.max(activeAreas, 1)) * 100)
    });

    // Calculate premium intelligence metrics
    const premiumMetrics = cacheData && cacheData.length > 0 ? {
      avgRentalYield: cacheData.reduce((sum: number, item: any) => sum + (item.rental_yield_percentage || 0), 0) / cacheData.length,
      avgMonthlyRental: cacheData.reduce((sum: number, item: any) => sum + (item.monthly_rental_estimate || 0), 0) / cacheData.length,
      avgNeighborhoodRating: cacheData.reduce((sum: number, item: any) => sum + (item.neighborhood_quality_rating || 0), 0) / cacheData.length,
      avgInvestmentScore: cacheData.reduce((sum: number, item: any) => sum + (item.investment_score || 0), 0) / cacheData.length,
      highYieldAreas: cacheData.filter((item: any) => (item.rental_yield_percentage || 0) > 6).length,
      premiumNeighborhoods: cacheData.filter((item: any) => (item.neighborhood_quality_rating || 0) >= 8).length,
      investmentOpportunities: cacheData.filter((item: any) => item.investment_attractiveness === 'high').length
    } : {
      avgRentalYield: 0,
      avgMonthlyRental: 0,
      avgNeighborhoodRating: 0,
      avgInvestmentScore: 0,
      highYieldAreas: 0,
      premiumNeighborhoods: 0,
      investmentOpportunities: 0
    };

    return NextResponse.json({
      success: true,
      data: {
        totalAppraisals,
        activeAreas,
        activeAppraisers,
        totalReports,
        avgPricePerSqm: finalAvgValue,
        recentActivity,
        marketStatus: totalAppraisals > 50 ? 'Active' : totalAppraisals > 10 ? 'Growing' : 'Emerging',
        // Enhanced metrics
        locationsWithHighConfidence,
        hotMarkets,
        dataQuality: Math.round((locationsWithHighConfidence / Math.max(activeAreas, 1)) * 100),
        lastUpdated: new Date(dataFreshness).toISOString(),
        priceDataAvailable: finalAvgValue > 0,
        // Market trends (quarterly/yearly as per user requirements)
        marketTrends: {
          sixMonthTrend: Math.round((marketTrends.avg_6_month_trend || 0) * 100) / 100,
          yearlyTrend: Math.round((marketTrends.avg_1_year_trend || 0) * 100) / 100,
          positiveTrendAreas: marketTrends.positive_trend_areas,
          decliningAreas: marketTrends.declining_areas,
          trendDirection: marketTrends.avg_1_year_trend > 5 ? 'up' : marketTrends.avg_1_year_trend < -5 ? 'down' : 'stable'
        },
        // Premium intelligence metrics (Phase 1.1+)
        premiumIntelligence: {
          averageRentalYield: Math.round(premiumMetrics.avgRentalYield * 100) / 100,
          averageMonthlyRental: Math.round(premiumMetrics.avgMonthlyRental),
          averageNeighborhoodRating: Math.round(premiumMetrics.avgNeighborhoodRating * 10) / 10,
          averageInvestmentScore: Math.round(premiumMetrics.avgInvestmentScore),
          highYieldAreasCount: premiumMetrics.highYieldAreas,
          premiumNeighborhoodsCount: premiumMetrics.premiumNeighborhoods,
          investmentOpportunitiesCount: premiumMetrics.investmentOpportunities,
          dataAvailable: cacheData?.some((item: any) => item.rental_yield_percentage || item.monthly_rental_estimate) || false,
          // Enhanced metrics for professional dashboard
          topPerformingAreas: cacheData?.filter((item: any) => (item.investment_score || 0) > 70)
            .sort((a: any, b: any) => (b.investment_score || 0) - (a.investment_score || 0))
            .slice(0, 5)
            .map((item: any) => ({
              name: item.location_name,
              type: item.location_type,
              investmentScore: item.investment_score,
              rentalYield: item.rental_yield_percentage,
              pricePerSqm: item.avg_price_per_sqm,
              qualityRating: item.neighborhood_quality_rating
            })) || [],
          marketHealthIndicators: {
            averageTimeToSell: Math.round(premiumMetrics.avgInvestmentScore / 10) * 30, // Approximate days
            marketStability: premiumMetrics.avgNeighborhoodRating >= 7 ? 'stable' : premiumMetrics.avgNeighborhoodRating >= 5 ? 'moderate' : 'volatile',
            liquidityLevel: premiumMetrics.avgRentalYield > 5 ? 'high' : premiumMetrics.avgRentalYield > 3 ? 'medium' : 'low'
          }
        }
      }
    });

  } catch (error) {
    console.error('Overview query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market overview' },
      { status: 500 }
    );
  }
}

async function getMarketAreas(supabase: any) {
  try {
    console.log('🗺️ ENHANCED MARKET AREAS DEBUG - Fetching areas data');
    
    // Try to get data from cache first
    const { data: cacheData, error: cacheError } = await supabase
      .from('market_intelligence_cache')
      .select('*')
      .order('total_appraisals', { ascending: false });

    console.log('🗺️ Cache data result:', { count: cacheData?.length, error: cacheError });

    let areasData = cacheData || [];

    // If cache is empty, try to get areas from appraisals directly
    if (!areasData || areasData.length === 0) {
      console.log('🗺️ Cache empty, extracting areas from appraisals...');
      
      const { data: appraisalsData, error: appraisalsError } = await supabase
        .from('property_appraisals')
        .select('form_data, market_value_estimate')
        .eq('status', 'completed');

      if (appraisalsData && appraisalsData.length > 0) {
        // Extract unique locations from appraisals
        const locationMap = new Map();
        
        appraisalsData.forEach((appraisal: any) => {
          const formData = appraisal.form_data || {};
          const compound = formData.compound_name;
          const district = formData.district_name;
          const area = formData.area;
          const city = formData.city_name;
          
          // Determine most specific location
          let locationName = '';
          let locationType = '';
          
          if (compound) {
            locationName = compound;
            locationType = 'compound';
          } else if (district) {
            locationName = district;
            locationType = 'district';
          } else if (area) {
            locationName = area;
            locationType = 'area';
          } else if (city) {
            locationName = city;
            locationType = 'city';
          }
          
          if (locationName) {
            const key = `${locationType}-${locationName}`;
            if (!locationMap.has(key)) {
              locationMap.set(key, {
                location_type: locationType,
                location_name: locationName,
                total_appraisals: 0,
                avg_price_per_sqm: 0,
                total_value: 0,
                total_area: 0,
                market_activity: 'low',
                confidence_level: 'low',
                last_updated: new Date().toISOString()
              });
            }
            const location = locationMap.get(key);
            location.total_appraisals += 1;
            
            // Calculate price per sqm from this appraisal
            const marketValue = appraisal.market_value_estimate;
            const area = appraisal.form_data?.unit_area_sqm || appraisal.form_data?.built_area || appraisal.form_data?.total_area;
            
            if (marketValue && area && area > 0) {
              location.total_value += marketValue;
              location.total_area += area;
              location.avg_price_per_sqm = Math.round(location.total_value / location.total_area);
            }
          }
        });
        
        areasData = Array.from(locationMap.values());
        console.log('🗺️ Extracted areas from appraisals:', areasData.length);
      }
    }

    // Egyptian coordinates mapping for areas that might not have coordinates
    const egyptianAreas = {
      'New Cairo': { lat: 30.0330, lng: 31.4913 },
      'Madinaty': { lat: 30.1019, lng: 31.6440 },
      'Rehab City': { lat: 30.0561, lng: 31.4913 },
      'New Capital': { lat: 30.3572, lng: 31.6857 },
      'الرحاب': { lat: 30.0561, lng: 31.4913 }, // Rehab in Arabic
      'مدينتي': { lat: 30.1019, lng: 31.6440 }, // Madinaty in Arabic
      'القاهرة الجديدة': { lat: 30.0330, lng: 31.4913 }, // New Cairo in Arabic
      'الاسكان المتطور - الحي الخامس': { lat: 30.0131, lng: 31.4289 }, // Advanced Housing - Fifth District
      'الحي الخامس': { lat: 30.0131, lng: 31.4289 }, // Fifth District
      'الاسكان المتطور': { lat: 30.0131, lng: 31.4289 }, // Advanced Housing
      '6th of October': { lat: 29.9668, lng: 30.9876 },
      'Sheikh Zayed': { lat: 30.0081, lng: 30.9757 },
      'Heliopolis': { lat: 30.0808, lng: 31.3131 },
      'Zamalek': { lat: 30.0616, lng: 31.2194 },
      'Nasr City': { lat: 30.0626, lng: 31.3549 },
      'Maadi': { lat: 29.9602, lng: 31.2569 },
      'Fifth Settlement': { lat: 30.0131, lng: 31.4289 },
      'التجمع الخامس': { lat: 30.0131, lng: 31.4289 }, // Fifth Settlement in Arabic
      'Mostakbal City': { lat: 30.0289, lng: 31.5456 },
      'Cairo': { lat: 30.0444, lng: 31.2357 },
      'Giza': { lat: 30.0131, lng: 31.2089 }
    };

    const areasWithCoordinates = areasData.map((area: any) => ({
      ...area,
      coordinates: egyptianAreas[area.location_name as keyof typeof egyptianAreas] || { lat: 30.0444, lng: 31.2357 },
      coverage_level: area.total_appraisals > 10 ? 'high' : area.total_appraisals > 3 ? 'medium' : 'low'
    }));

    console.log('🗺️ Final areas with coordinates:', areasWithCoordinates.length);

    return NextResponse.json({
      success: true,
      data: areasWithCoordinates
    });

  } catch (error) {
    console.error('Areas query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market areas' },
      { status: 500 }
    );
  }
}

async function getTrendingAreas(supabase: any) {
  try {
    console.log('📈 ENHANCED TRENDING AREAS DEBUG - Fetching trending data');
    
    // Try to get data from cache first
    const { data: cacheData, error: cacheError } = await supabase
      .from('market_intelligence_cache')
      .select('*')
      .not('total_appraisals', 'eq', 0)
      .order('last_updated', { ascending: false })
      .limit(10);

    console.log('📈 Cache trending data result:', { count: cacheData?.length, error: cacheError });

    let trendingData = cacheData || [];

    // If cache is empty, try to get trending from recent appraisals
    if (!trendingData || trendingData.length === 0) {
      console.log('📈 Cache empty, getting trending from recent appraisals...');
      
      const { data: recentAppraisals, error: appraisalsError } = await supabase
        .from('property_appraisals')
        .select('form_data, market_value_estimate, created_at')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (recentAppraisals && recentAppraisals.length > 0) {
        // Extract locations from recent appraisals
        const locationMap = new Map();
        
        recentAppraisals.forEach((appraisal: any) => {
          const formData = appraisal.form_data || {};
          const compound = formData.compound_name;
          const district = formData.district_name;
          const area = formData.area;
          const city = formData.city_name;
          
          // Determine most specific location
          let locationName = '';
          let locationType = '';
          
          if (compound) {
            locationName = compound;
            locationType = 'compound';
          } else if (district) {
            locationName = district;
            locationType = 'district';
          } else if (area) {
            locationName = area;
            locationType = 'area';
          } else if (city) {
            locationName = city;
            locationType = 'city';
          }
          
          if (locationName) {
            const key = `${locationType}-${locationName}`;
            if (!locationMap.has(key)) {
              locationMap.set(key, {
                location_type: locationType,
                location_name: locationName,
                total_appraisals: 0,
                avg_price_per_sqm: 0,
                total_value: 0,
                total_area: 0,
                market_activity: 'moderate',
                confidence_level: 'low',
                last_updated: appraisal.created_at
              });
            }
            const location = locationMap.get(key);
            location.total_appraisals += 1;
            
            // Calculate price per sqm from this appraisal
            const marketValue = appraisal.market_value_estimate;
            const area = appraisal.form_data?.unit_area_sqm || appraisal.form_data?.built_area || appraisal.form_data?.total_area;
            
            if (marketValue && area && area > 0) {
              location.total_value += marketValue;
              location.total_area += area;
              location.avg_price_per_sqm = Math.round(location.total_value / location.total_area);
            }
            
            // Update last_updated to most recent
            if (new Date(appraisal.created_at) > new Date(location.last_updated)) {
              location.last_updated = appraisal.created_at;
            }
          }
        });
        
        trendingData = Array.from(locationMap.values());
        console.log('📈 Extracted trending from recent appraisals:', trendingData.length);
      }
    }

    const trendingAreas = trendingData.map((area: any) => ({
      area_name: area.location_name,
      location_type: area.location_type,
      total_appraisals: area.total_appraisals,
      avg_price_per_sqm: area.avg_price_per_sqm || 0,
      price_trend: area.price_trend_1_year || area.price_trend_6_months || 0,
      market_activity: area.market_activity || 'moderate',
      confidence_level: area.confidence_level || 'low',
      last_updated: area.last_updated,
      // Premium intelligence data
      rental_yield_percentage: area.rental_yield_percentage,
      monthly_rental_estimate: area.monthly_rental_estimate,
      neighborhood_quality_rating: area.neighborhood_quality_rating,
      investment_attractiveness: area.investment_attractiveness,
      investment_score: area.investment_score
    }));

    console.log('📈 Final trending areas:', trendingAreas.length);

    return NextResponse.json({
      success: true,
      data: trendingAreas
    });

  } catch (error) {
    console.error('Trending areas query error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending areas' },
      { status: 500 }
    );
  }
}