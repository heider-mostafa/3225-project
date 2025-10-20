/*
 * APPRAISAL DATA PREPARATION ROUTE - ACTIVELY USED
 * 
 * This route handles data preparation and validation for appraisal report generation.
 * It fetches appraisal data from Supabase and returns structured JSON for PDF generation.
 * 
 * Connected to:
 * - /components/appraiser/AppraisalReportGenerator.tsx (calls this route)
 * - /lib/services/pdf-report-generator.ts (uses the returned data for client-side PDF creation)
 * - /components/appraiser/AppraiserDashboard.tsx (integrates the report generator)
 * 
 * This is the primary route used for working Arabic appraisal generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { ReportFilteringService, type ReportType, type RawAppraisalData, type PropertyImage } from '@/lib/services/report-filtering';

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

    // Check user permissions
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (roleError) {
      return NextResponse.json(
        { error: 'Failed to check user permissions' },
        { status: 500 }
      );
    }

    console.log('User roles for report generation:', userRoles);
    
    const hasAccess = userRoles?.some(roleObj => 
      ['appraiser', 'broker', 'admin', 'super_admin'].includes(roleObj.role)
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied. Professional role required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { appraisal_id, report_options, reportType = 'comprehensive' } = body;
    
    console.log('📊 Generate Report API - Request details:', {
      appraisal_id,
      reportType,
      hasReportOptions: !!report_options
    });

    if (!appraisal_id) {
      return NextResponse.json(
        { error: 'Appraisal ID is required' },
        { status: 400 }
      );
    }

    // Get appraisal data with all related information
    const { data: appraisalData, error: appraisalError } = await supabase
      .from('property_appraisals')
      .select(`
        *,
        properties:property_id (
          id,
          title,
          address,
          city,
          price,
          property_type,
          bedrooms,
          bathrooms,
          square_meters,
          neighborhood,
          state,
          zip_code,
          year_built,
          features,
          amenities,
          lot_size,
          floor_level,
          total_floors
        ),
        brokers:appraiser_id (
          id,
          full_name,
          email,
          appraiser_license_number
        )
      `)
      .eq('id', appraisal_id)
      .single();

    // Get property images from multiple sources with enhanced structure for PDF integration
    let propertyImages: any[] = [];
    if (appraisalData && !appraisalError) {
      const propertyId = appraisalData.property_id;
      const appraisalId = appraisalData.id;
      
      console.log('🖼️  Fetching images for property_id:', propertyId, 'appraisal_id:', appraisalId);
      
      // Method 1: Query property_photos table for images related to this property or appraisal
      console.log('🖼️  Executing property_photos query with filters:');
      console.log('   - property_id.eq.' + propertyId);
      console.log('   - appraisal_id.eq.' + appraisalId);
      
      const { data: imageData, error: imageError } = await supabase
        .from('property_photos')
        .select(`
          id,
          url, 
          category, 
          source, 
          appraisal_id,
          property_id,
          filename,
          alt_text,
          caption,
          is_primary,
          document_page,
          mime_type,
          order_index,
          created_at
        `)
        .or(`property_id.eq.${propertyId},appraisal_id.eq.${appraisalId}`)
        .order('is_primary', { ascending: false })
        .order('document_page', { ascending: true })
        .order('order_index', { ascending: true })
        .order('created_at', { ascending: false });
      
      console.log('🖼️  Property_photos table query result:', { 
        count: imageData?.length, 
        error: imageError,
        sample: imageData?.[0],
        filters_used: {
          property_id: propertyId,
          appraisal_id: appraisalId,
          or_filter: `property_id.eq.${propertyId},appraisal_id.eq.${appraisalId}`
        }
      });
      
      // Debug: Let's also check if there are ANY images in the property_photos table for this appraisal
      const { data: debugAllImages, error: debugError } = await supabase
        .from('property_photos')
        .select('id, appraisal_id, property_id, url, filename')
        .eq('appraisal_id', appraisalId);
      
      console.log('🔍 Debug - Images with exact appraisal_id match:', {
        count: debugAllImages?.length,
        error: debugError,
        images: debugAllImages
      });
      
      // Debug: Check for property_id match
      if (propertyId) {
        const { data: debugPropertyImages, error: debugPropError } = await supabase
          .from('property_photos')
          .select('id, appraisal_id, property_id, url, filename')
          .eq('property_id', propertyId);
        
        console.log('🔍 Debug - Images with exact property_id match:', {
          count: debugPropertyImages?.length,
          error: debugPropError,
          images: debugPropertyImages
        });
      }
      
      if (imageData && !imageError && imageData.length > 0) {
        // Structure images with metadata for PDF generation
        propertyImages = imageData.map(img => ({
          id: img.id,
          url: img.url,
          category: img.category || 'general',
          source: img.source || 'property_photos',
          filename: img.filename || `image_${img.id?.slice(0, 8)}.jpg`,
          alt_text: img.alt_text || img.caption || `Property image from page ${img.document_page}`,
          caption: img.caption || img.alt_text,
          is_primary: img.is_primary || false,
          document_page: img.document_page || 0,
          mime_type: img.mime_type || 'image/jpeg',
          order_index: img.order_index || 0,
          appraisal_id: img.appraisal_id,
          property_id: img.property_id
        })).filter(img => img.url); // Only include images with valid URLs
        
        console.log('🖼️  Structured images from property_photos:', propertyImages.length);
      }
      
      // Method 2: Check for extracted_images in form_data (primary source)
      if (propertyImages.length === 0) {
        console.log('🖼️  Checking form_data for extracted_images...');
        const extractedImages = appraisalData.form_data?.extracted_images;
        
        if (extractedImages && Array.isArray(extractedImages)) {
          console.log(`🖼️  Found ${extractedImages.length} extracted images in form_data`);
          
          propertyImages = extractedImages.map((imgData, index) => {
            // Handle base64 data - add data URL prefix if needed
            let imageUrl = imgData.data || imgData.url;
            if (imageUrl && !imageUrl.startsWith('data:') && !imageUrl.startsWith('http')) {
              // Assume it's base64 data needing prefix
              const format = imgData.format || 'png';
              imageUrl = `data:image/${format};base64,${imageUrl}`;
            }
            
            return {
              id: imgData.id || `extracted_${index}`,
              url: imageUrl,
              category: imgData.category || 'general', 
              source: 'extracted_images',
              filename: imgData.filename || `extracted_image_${index + 1}.${imgData.format || 'png'}`,
              alt_text: imgData.description || imgData.alt_text || `Extracted image ${index + 1}`,
              caption: imgData.description || `Extracted image ${index + 1}`,
              is_primary: index === 0, // First image is primary
              document_page: imgData.page_number || 0,
              mime_type: `image/${imgData.format || 'png'}`,
              order_index: index,
              appraisal_id: appraisalId,
              property_id: propertyId
            };
          }).filter(img => img.url); // Only include images with valid URLs/data
          
          console.log('🖼️  Structured extracted images:', propertyImages.length);
        } else {
          console.log('🖼️  No extracted_images found in form_data');
        }
      }
      
      // Method 3: Fallback to legacy property_images or photos in form_data
      if (propertyImages.length === 0) {
        console.log('🖼️  Fallback: Checking for legacy property_images/photos in form_data...');
        const formPhotos = appraisalData.form_data?.property_images || appraisalData.form_data?.photos;
        if (formPhotos && Array.isArray(formPhotos)) {
          propertyImages = formPhotos.filter(Boolean).map((url, index) => ({
            id: `form_${index}`,
            url: url,
            category: 'general',
            source: 'form_data_legacy',
            filename: `form_image_${index + 1}.jpg`,
            alt_text: `Property image ${index + 1}`,
            caption: `Property image ${index + 1}`,
            is_primary: index === 0,
            document_page: 0,
            mime_type: 'image/jpeg',
            order_index: index,
            appraisal_id: appraisalId,
            property_id: propertyId
          }));
          console.log('🖼️  Structured images from legacy form_data:', propertyImages.length);
        }
      }
      
      console.log('🖼️  Total structured images found:', propertyImages.length, 
        'Categories:', [...new Set(propertyImages.map(img => img.category))]);
    }

    console.log('Looking for appraisal with ID:', appraisal_id);
    console.log('Appraisal query result:', { appraisalData, appraisalError });

    if (appraisalError || !appraisalData) {
      console.error('Appraisal not found error:', appraisalError);
      
      // Check if appraisal exists at all
      const { data: basicAppraisal } = await supabase
        .from('property_appraisals')
        .select('id, appraiser_id, client_name, property_id')
        .eq('id', appraisal_id)
        .single();
      
      console.log('Basic appraisal check:', basicAppraisal);
      
      return NextResponse.json(
        { error: 'Appraisal not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this appraisal
    const { data: brokerData } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const isAdmin = userRoles?.some(roleObj => 
      ['admin', 'super_admin'].includes(roleObj.role)
    );

    const isOwner = brokerData && brokerData.id === appraisalData.appraiser_id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Access denied to this appraisal' },
        { status: 403 }
      );
    }

    // Get mortgage eligibility data if available
    let mortgageData = null;
    const { data: mortgageRequests } = await supabase
      .from('mortgage_eligibility_requests')
      .select('response_data')
      .eq('property_id', appraisalData.property_id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (mortgageRequests && mortgageRequests.length > 0) {
      mortgageData = mortgageRequests[0].response_data;
    }

    // Prepare data for PDF generation with correct area mapping
    const formData = appraisalData.form_data || {};
    
    // Fix area discrepancy: Use unit_area_sqm from form_data, fallback to square_meters
    const unitArea = formData.unit_area_sqm || 
                     formData.built_area_sqm || 
                     (appraisalData.properties?.square_meters) || 100;
    
    // Total building area should be separate from unit area
    const totalBuildingArea = formData.total_building_area_sqm || 
                             (unitArea * (formData.total_floors || appraisalData.properties?.total_floors || 1));

    // Handle case where appraisal has no linked property (property_id is null)
    // Use form_data to reconstruct property information
    const propertyData = {
      id: appraisalData.properties?.id || appraisalData.id,
      title: appraisalData.properties?.title || `Property in ${formData.district_name || formData.city_name}`,
      address: appraisalData.properties?.address || formData.property_address_english || formData.property_address_arabic,
      city: appraisalData.properties?.city || formData.city_name,
      district: appraisalData.properties?.neighborhood || formData.district_name || formData.city_name,
      price: appraisalData.properties?.price || appraisalData.market_value_estimate,
      property_type: appraisalData.properties?.property_type || formData.property_type,
      area: unitArea, // This is the UNIT area, not building area
      unit_area_sqm: unitArea,
      total_building_area_sqm: totalBuildingArea,
      land_area_sqm: formData.land_area_sqm,
      bedrooms: appraisalData.properties?.bedrooms || formData.bedrooms,
      bathrooms: appraisalData.properties?.bathrooms || formData.bathrooms,
      floor_number: formData.floor_number,
      building_age: formData.building_age_years,
      features: formData.features || [],
      images: propertyImages, // Enhanced structured images with metadata
    };

    // Generate market analysis data using REAL appraisal data instead of mock data
    const marketAnalysis = await generateMarketAnalysis(propertyData, appraisalData, supabase);

    // Fix building age conflicts - provide all age types with clear definitions
    const buildingAgeData = {
      building_age: formData.building_age_years || 0, // Chronological age from construction
      effective_age: formData.effective_building_age_years || formData.building_age_years || 0, // Age accounting for condition/renovations
      economic_life: formData.economic_building_life_years || 60, // Total expected useful life
      remaining_life: formData.remaining_building_life_years || 
                     Math.max(0, (formData.economic_building_life_years || 60) - (formData.building_age_years || 0))
    };

    const appraisalDataForPDF = {
      id: appraisalData.id,
      appraiser_name: appraisalData.brokers?.full_name || 'Unknown',
      appraiser_license: appraisalData.brokers?.appraiser_license_number || 'N/A',
      client_name: appraisalData.client_name,
      appraisal_date: appraisalData.appraisal_date,
      reference_number: appraisalData.appraisal_reference_number || `APR-${appraisalData.id.slice(0, 8)}`,
      market_value_estimate: appraisalData.market_value_estimate || 0,
      confidence_level: appraisalData.confidence_level || 0,
      calculation_results: appraisalData.calculation_results || {},
      form_data: appraisalData.form_data || {},
      building_age_data: buildingAgeData, // Structured age data
      legal_status: appraisalData.form_data?.legal_status,
      mortgage_eligibility: mortgageData
    };

    // Set default options based on report type (don't override filtering)
    const baseOptions = {
      language: 'both',
      include_market_comparables: true, // Always include
      include_images: true,
      watermark: 'CONFIDENTIAL'
    };

    // Apply report type-based filtering to options
    const reportTypeOptions = {
      include_legal_analysis: reportType !== 'standard',
      include_mortgage_analysis: reportType !== 'standard', 
      include_investment_projections: reportType !== 'standard'
    };

    const finalOptions = { 
      ...baseOptions,
      ...reportTypeOptions,
      ...report_options, // User options can still override
      reportType: reportType as ReportType,
      format: reportType as ReportType
    };

    console.log('⚙️ Final options configured:', {
      reportType: finalOptions.reportType,
      format: finalOptions.format,
      include_legal_analysis: finalOptions.include_legal_analysis,
      include_mortgage_analysis: finalOptions.include_mortgage_analysis,
      include_investment_projections: finalOptions.include_investment_projections
    });

    // Apply report type filtering before returning data
    console.log('🔒 Applying report type filtering:', reportType);
    
    // Prepare raw data for filtering
    const rawAppraisalData: RawAppraisalData = {
      id: appraisalData.id,
      appraisal_reference_number: appraisalData.appraisal_reference_number || `APR-${appraisalData.id.slice(0, 8)}`,
      client_name: appraisalData.client_name,
      client_contact: appraisalData.form_data?.client_phone || appraisalData.form_data?.client_email,
      client_requirements: appraisalData.form_data?.client_requirements,
      appraiser_id: appraisalData.appraiser_id,
      appraiser_name: appraisalData.brokers?.full_name,
      appraiser_email: appraisalData.brokers?.email,
      appraiser_phone: appraisalData.form_data?.appraiser_phone,
      appraiser_license: appraisalData.brokers?.appraiser_license_number,
      appraiser_credentials: appraisalData.form_data?.appraiser_credentials,
      property_type: propertyData.property_type,
      property_address: propertyData.address,
      area: propertyData.district || propertyData.city,
      market_value_estimate: appraisalData.market_value_estimate,
      detailed_pricing: {
        land_value: formData.land_value,
        building_value: formData.building_value,
        improvement_value: formData.improvement_value,
        depreciation: formData.depreciation_amount
      },
      valuation_method: formData.valuation_method,
      calculation_details: appraisalData.calculation_results,
      comparable_properties: marketAnalysis.comparables || [],
      investment_analysis: marketAnalysis.investment || {},
      appraisal_date: appraisalData.appraisal_date,
      inspection_date: formData.inspection_date,
      report_date: new Date().toISOString().split('T')[0],
      status: appraisalData.status,
      form_data: appraisalData.form_data,
      internal_notes: formData.internal_notes,
      created_at: appraisalData.created_at,
      updated_at: appraisalData.updated_at || appraisalData.created_at
    };

    // Apply filtering based on report type
    const filteredAppraisalData = ReportFilteringService.filterAppraisalData(rawAppraisalData, reportType as ReportType);
    
    // Apply image filtering based on report type
    const filteredImages = ReportFilteringService.filterPropertyImages(
      propertyImages as PropertyImage[], 
      reportType as ReportType
    );
    
    console.log('✅ Report filtering applied:', {
      reportType,
      originalDataFields: Object.keys(rawAppraisalData).length,
      filteredDataFields: Object.keys(filteredAppraisalData).length,
      filteredFields: filteredAppraisalData.filtered_fields?.length || 0,
      privacyNotice: filteredAppraisalData.privacy_notice,
      originalImages: propertyImages.length,
      filteredImages: filteredImages.length
    });

    // Convert filtered data back to the expected format for PDF generation
    const filteredAppraisalDataForPDF = {
      id: filteredAppraisalData.id,
      appraiser_name: filteredAppraisalData.appraiser_name || 'Licensed Appraiser',
      appraiser_license: filteredAppraisalData.appraiser_license || 'Protected',
      appraiser_email: filteredAppraisalData.appraiser_email,
      appraiser_phone: filteredAppraisalData.appraiser_phone,
      appraiser_credentials: filteredAppraisalData.appraiser_credentials,
      client_name: filteredAppraisalData.client_name || 'Protected Client',
      client_contact: filteredAppraisalData.client_contact,
      client_requirements: filteredAppraisalData.client_requirements,
      appraisal_date: filteredAppraisalData.appraisal_date,
      inspection_date: filteredAppraisalData.inspection_date,
      reference_number: filteredAppraisalData.appraisal_reference_number,
      market_value_estimate: filteredAppraisalData.market_value_estimate,
      confidence_level: appraisalDataForPDF.confidence_level,
      calculation_results: filteredAppraisalData.calculation_details || {},
      form_data: reportType === 'comprehensive' ? appraisalDataForPDF.form_data : {},
      building_age_data: buildingAgeData,
      legal_status: reportType !== 'standard' ? appraisalDataForPDF.legal_status : null,
      mortgage_eligibility: reportType !== 'standard' ? mortgageData : null,
      detailed_pricing: filteredAppraisalData.detailed_pricing,
      valuation_method: filteredAppraisalData.valuation_method,
      privacy_notice: filteredAppraisalData.privacy_notice,
      filtered_fields: filteredAppraisalData.filtered_fields,
      report_type: reportType
    };

    // Filter market analysis based on report type
    const filteredMarketAnalysis = {
      ...marketAnalysis,
      comparables: filteredAppraisalData.comparable_properties || [],
      investment: filteredAppraisalData.investment_analysis || {},
      detailed_analysis: reportType === 'comprehensive' ? marketAnalysis.detailed_analysis : null
    };

    // Update property data to use filtered images
    const filteredPropertyData = {
      ...propertyData,
      images: filteredImages  // Use filtered images instead of all images
    };

    // Return the filtered data for client-side PDF generation
    return NextResponse.json({
      success: true,
      data: {
        property: filteredPropertyData,
        appraisal: filteredAppraisalDataForPDF,
        market: filteredMarketAnalysis,
        options: finalOptions
      },
      metadata: {
        reportType,
        privacyLevel: ReportFilteringService.getReportTypePricing()[reportType as ReportType].privacyLevel,
        filteredFieldsCount: filteredAppraisalData.filtered_fields?.length || 0,
        imageCount: filteredImages.length,
        originalImageCount: propertyImages.length,
        generatedAt: new Date().toISOString()
      },
      message: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report data prepared successfully with privacy filtering`
    });

  } catch (error) {
    console.error('Generate report error:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}

async function generateMarketAnalysis(property: any, appraisal: any, supabase: any) {
  console.log('🔄 REAL DATA - Generating market analysis with real appraisal data');
  
  const formData = appraisal.form_data || {};
  const basePrice = appraisal.market_value_estimate || property.price || 2000000;
  const baseArea = property.unit_area_sqm || property.area || property.square_meters || 100;
  const basePricePerSqm = Math.round(basePrice / baseArea);
  
  // Extract REAL comparable properties from appraisal form data (3 real comparables vs 5 fake ones)
  const realComparables = [];
  for (let i = 1; i <= 3; i++) {
    const address = formData[`comparable_sale_${i}_address`];
    const price = formData[`comparable_sale_${i}_price`];
    const area = formData[`comparable_sale_${i}_area`];
    const pricePerSqm = formData[`comparable_sale_${i}_price_per_sqm`];
    
    if (address && price && area) {
      realComparables.push({
        address: address,
        price: price,
        price_per_sqm: pricePerSqm || Math.round(price / area),
        area: area,
        property_type: property.property_type || 'apartment',
        distance_km: 1.0, // Default estimate since not captured in form
        sold_date: formData[`comparable_sale_${i}_sale_date`] || new Date().toISOString().split('T')[0],
        finishing: formData[`comparable_sale_${i}_finishing`] || 'unknown',
        floor: formData[`comparable_sale_${i}_floor`] || 0,
        age: formData[`comparable_sale_${i}_age`] || 0
      });
    }
  }
  
  console.log(`🔄 REAL DATA - Found ${realComparables.length} real comparable properties from appraisal`);
  
  // Get REAL market intelligence from cache for this location
  const locationName = formData.compound_name || formData.district_name || formData.city_name;
  let marketCache = null;
  
  if (locationName) {
    const { data: cacheData } = await supabase
      .from('market_intelligence_cache')
      .select('*')
      .or(`location_name.eq.${locationName},location_name.ilike.%${locationName}%`)
      .order('total_appraisals', { ascending: false })
      .limit(1)
      .single();
    
    marketCache = cacheData;
    console.log(`🔄 REAL DATA - Market cache for ${locationName}:`, marketCache ? 'Found' : 'Not found');
  }
  
  // Build REAL market trends from appraisal data and cache
  const marketTrends = {
    average_price_per_sqm: marketCache?.avg_price_per_sqm || basePricePerSqm,
    price_change_6months: marketCache?.price_trend_6_months || parseFloat(formData.price_change_6_months) || 0,
    price_change_12months: marketCache?.price_trend_12_months || parseFloat(formData.price_change_12_months) || 0,
    market_activity: formData.market_activity || marketCache?.market_activity || 'moderate',
    days_on_market: (formData.time_on_market_months || formData.time_to_sell) * 30 || marketCache?.market_velocity_days || 60
  };
  
  // Build REAL investment analysis from appraisal data and cache
  const monthlyRental = formData.monthly_rental_estimate || formData.estimated_rental_egp;
  const calculatedRentalYield = monthlyRental ? (monthlyRental * 12 / basePrice * 100) : 0;
  
  const investmentAnalysis = {
    rental_yield: marketCache?.rental_yield_percentage || calculatedRentalYield || 0,
    roi_5year: marketCache?.roi_projection_12m ? marketCache.roi_projection_12m * 5 : parseFloat(formData.roi_5year) || 0,
    roi_10year: marketCache?.roi_projection_12m ? marketCache.roi_projection_12m * 10 : parseFloat(formData.roi_10year) || 0,
    appreciation_rate: parseFloat(formData.price_appreciation_annual) || parseFloat(formData.appreciation_rate) || 0,
    rental_demand: formData.rental_demand || (marketCache?.liquidity_score > 70 ? 'high' : marketCache?.liquidity_score > 40 ? 'medium' : 'low')
  };
  
  console.log('🔄 REAL DATA - Market analysis summary:', {
    comparables_count: realComparables.length,
    has_market_cache: !!marketCache,
    rental_yield: investmentAnalysis.rental_yield,
    avg_price_per_sqm: marketTrends.average_price_per_sqm
  });

  return {
    comparable_properties: realComparables, // REAL data from appraiser
    market_trends: marketTrends, // REAL data from cache + form
    investment_analysis: investmentAnalysis // REAL data from cache + calculations
  };
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

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Get report templates
    if (action === 'templates') {
      const templates = [
        {
          id: 'comprehensive',
          name: 'Comprehensive Report',
          description: 'Full detailed report with all sections including legal, mortgage, and investment analysis',
          sections: ['executive_summary', 'property_details', 'market_analysis', 'legal_analysis', 'mortgage_analysis', 'investment_analysis'],
          languages: ['en', 'ar', 'both'],
          estimated_pages: 15
        },
        {
          id: 'executive',
          name: 'Executive Summary',
          description: 'Concise report focusing on key findings and recommendations',
          sections: ['executive_summary', 'property_details', 'market_analysis'],
          languages: ['en', 'ar', 'both'],
          estimated_pages: 8
        },
        {
          id: 'investor',
          name: 'Investor Report',
          description: 'Investment-focused report with detailed financial analysis and projections',
          sections: ['executive_summary', 'property_details', 'market_analysis', 'investment_analysis'],
          languages: ['en', 'ar', 'both'],
          estimated_pages: 12
        },
        {
          id: 'legal',
          name: 'Legal Compliance Report',
          description: 'Detailed legal status and compliance analysis',
          sections: ['property_details', 'legal_analysis', 'mortgage_analysis'],
          languages: ['en', 'ar', 'both'],
          estimated_pages: 10
        }
      ];

      return NextResponse.json({
        success: true,
        data: templates
      });
    }

    // Get user's report history
    if (action === 'history') {
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const offset = (page - 1) * limit;

      // Note: In production, you would track generated reports in a separate table
      // For now, we'll return appraisals as report history
      const { data: reports, error } = await supabase
        .from('property_appraisals')
        .select(`
          id,
          appraisal_reference_number,
          client_name,
          appraisal_date,
          market_value_estimate,
          created_at,
          properties:property_id (
            title,
            address,
            city
          ),
          brokers:appraiser_id (
            user_id
          )
        `)
        .eq('brokers.user_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to fetch report history' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: reports
      });
    }

    return NextResponse.json(
      { error: 'Invalid action parameter' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}