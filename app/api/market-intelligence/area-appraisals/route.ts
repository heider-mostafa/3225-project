import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const areaName = searchParams.get('area');
    
    if (!areaName) {
      return NextResponse.json(
        { error: 'Area name is required' },
        { status: 400 }
      );
    }

    // Get completed appraisals for the specific area
    const { data: appraisals, error } = await supabase
      .from('property_appraisals')
      .select(`
        id,
        appraiser_id,
        client_name,
        market_value_estimate,
        appraisal_date,
        appraisal_reference_number,
        status,
        form_data,
        properties:property_id (
          id,
          title,
          address,
          city,
          property_type,
          square_meters
        ),
        brokers:appraiser_id (
          id,
          full_name,
          appraiser_license_number
        )
      `)
      .eq('status', 'completed')
      .order('appraisal_date', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching area appraisals:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appraisals' },
        { status: 500 }
      );
    }

    // Filter appraisals that match the area name
    const filteredAppraisals = appraisals?.filter((appraisal: any) => {
      const formData = appraisal.form_data || {};
      const compound = formData.compound_name;
      const district = formData.district_name;
      const area = formData.area;
      const city = formData.city_name;
      const propertyAddress = appraisal.properties?.address;
      const propertyCity = appraisal.properties?.city;
      
      // Check if any location field matches the area name (case insensitive)
      const searchArea = areaName.toLowerCase();
      return (
        compound?.toLowerCase().includes(searchArea) ||
        district?.toLowerCase().includes(searchArea) ||
        area?.toLowerCase().includes(searchArea) ||
        city?.toLowerCase().includes(searchArea) ||
        propertyAddress?.toLowerCase().includes(searchArea) ||
        propertyCity?.toLowerCase().includes(searchArea) ||
        searchArea.includes(compound?.toLowerCase()) ||
        searchArea.includes(district?.toLowerCase()) ||
        searchArea.includes(area?.toLowerCase()) ||
        searchArea.includes(city?.toLowerCase())
      );
    }) || [];

    // Format the results for purchase report buttons
    const formattedAppraisals = filteredAppraisals.map((appraisal: any) => {
      const formData = appraisal.form_data || {};
      const unitArea = formData.unit_area_sqm || 
                       formData.built_area_sqm || 
                       appraisal.properties?.square_meters || 100;
      
      return {
        id: appraisal.id,
        title: appraisal.properties?.title || `Property in ${areaName}`,
        address: appraisal.properties?.address || formData.property_address_english || formData.property_address_arabic,
        propertyType: appraisal.properties?.property_type || formData.property_type,
        marketValue: appraisal.market_value_estimate,
        pricePerSqm: Math.round(appraisal.market_value_estimate / unitArea),
        area: unitArea,
        appraisalDate: appraisal.appraisal_date,
        appraiserName: appraisal.brokers?.full_name || 'Certified Appraiser',
        appraiserLicense: appraisal.brokers?.appraiser_license_number,
        referenceNumber: appraisal.appraisal_reference_number || `APR-${appraisal.id.slice(0, 8)}`,
        clientName: appraisal.client_name,
        hasReport: true // All completed appraisals can generate reports
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        areaName,
        totalAppraisals: filteredAppraisals.length,
        appraisals: formattedAppraisals
      }
    });

  } catch (error) {
    console.error('Area appraisals API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch area appraisals' },
      { status: 500 }
    );
  }
}