// Report Pricing API - Simple pricing fetch for payment modals
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Get all report pricing for different types and tiers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appraiserTier = searchParams.get('appraiser_tier') || 'basic';
    
    const supabase = createRouteHandlerClient({ cookies });

    // Get all pricing for the appraiser tier
    const { data: pricingData, error: pricingError } = await supabase
      .from('report_generation_pricing')
      .select('*')
      .eq('appraiser_tier', appraiserTier)
      .eq('is_active', true)
      .in('report_type', ['standard', 'detailed', 'comprehensive']);

    if (pricingError) {
      console.error('Pricing fetch error:', pricingError);
    }

    // Use database data if available, otherwise use known working pricing from the SQL results
    const pricingMap = {
      standard: { basic: 50, premium: 40, enterprise: 30 },
      detailed: { basic: 100, premium: 80, enterprise: 60 },
      comprehensive: { basic: 200, premium: 160, enterprise: 120 }
    };

    // Format pricing data for the frontend
    const formattedPricing: any = {};
    
    if (pricingData && pricingData.length > 0) {
      // Use database data
      pricingData.forEach(item => {
        formattedPricing[item.report_type] = {
          base_fee: item.base_fee_egp,
          rush_multiplier: item.rush_delivery_multiplier || 1.5,
          additional_services: item.additional_services || {},
          platform_commission: item.platform_commission_percentage || 15
        };
      });
    } else {
      // Use fallback data based on SQL results
      Object.keys(pricingMap).forEach(reportType => {
        const typeKey = reportType as keyof typeof pricingMap;
        const tierKey = appraiserTier as keyof typeof pricingMap.standard;
        formattedPricing[reportType] = {
          base_fee: pricingMap[typeKey][tierKey] || pricingMap[typeKey].basic,
          rush_multiplier: 1.5,
          additional_services: {
            digital_signature: tierKey === 'enterprise' ? 15 : tierKey === 'premium' ? 20 : 25,
            notarization: tierKey === 'enterprise' ? 30 : tierKey === 'premium' ? 40 : 50,
            translation: reportType === 'comprehensive' ? 200 : reportType === 'detailed' ? 150 : 100
          },
          platform_commission: 15
        };
      });
    }

    // Add market intelligence pricing if available
    const { data: marketPricing } = await supabase
      .from('report_generation_pricing')
      .select('*')
      .eq('appraiser_tier', appraiserTier)
      .eq('is_active', true)
      .eq('report_type', 'market_individual');

    if (marketPricing && marketPricing.length > 0) {
      formattedPricing.market_individual = {
        base_fee: marketPricing[0].base_fee_egp,
        rush_multiplier: marketPricing[0].rush_delivery_multiplier || 1.5,
        additional_services: marketPricing[0].additional_services || {},
        platform_commission: marketPricing[0].platform_commission_percentage || 15
      };
    }

    return NextResponse.json({
      success: true,
      appraiser_tier: appraiserTier,
      pricing: formattedPricing,
      fallback: false
    });

  } catch (error) {
    console.error('Pricing API error:', error);
    
    // Return minimal fallback pricing
    const tier = 'basic';
    return NextResponse.json({
      success: true,
      pricing: {
        standard: { base_fee: 50, rush_multiplier: 1.5, additional_services: {} },
        detailed: { base_fee: 100, rush_multiplier: 1.5, additional_services: {} },
        comprehensive: { base_fee: 200, rush_multiplier: 1.5, additional_services: {} }
      },
      fallback: true,
      error: 'Failed to fetch pricing, using defaults'
    });
  }
}

// POST: Calculate specific pricing for a report configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      report_type = 'standard', 
      appraiser_tier = 'basic', 
      rush_delivery = false, 
      additional_services = [] 
    } = body;

    const supabase = createRouteHandlerClient({ cookies });

    // Get base pricing
    const { data: pricing, error } = await supabase
      .from('report_generation_pricing')
      .select('*')
      .eq('report_type', report_type)
      .eq('appraiser_tier', appraiser_tier)
      .eq('is_active', true)
      .single();

    if (error || !pricing) {
      // Fallback calculation
      const baseFees = {
        standard: { basic: 50, premium: 40, enterprise: 30 },
        detailed: { basic: 100, premium: 80, enterprise: 60 },
        comprehensive: { basic: 200, premium: 160, enterprise: 120 }
      };

      const baseFee = baseFees[report_type as keyof typeof baseFees]?.[appraiser_tier as keyof typeof baseFees.standard] || 50;
      const rushFee = rush_delivery ? baseFee * 0.5 : 0;
      const serviceFee = additional_services.length * 25; // Simple fallback

      return NextResponse.json({
        success: true,
        calculation: {
          base_fee: baseFee,
          rush_fee: rushFee,
          service_fee: serviceFee,
          total_fee: baseFee + rushFee + serviceFee,
          currency: 'EGP',
          breakdown: {
            base: `${baseFee} EGP`,
            rush: rush_delivery ? `${rushFee} EGP (50% rush fee)` : '0 EGP',
            services: `${serviceFee} EGP (${additional_services.length} services)`
          }
        },
        fallback: true
      });
    }

    // Real calculation
    const baseFee = pricing.base_fee_egp;
    const rushMultiplier = pricing.rush_delivery_multiplier || 1.5;
    const rushFee = rush_delivery ? baseFee * (rushMultiplier - 1) : 0;
    
    // Calculate additional services fee
    let serviceFee = 0;
    const services = pricing.additional_services || {};
    additional_services.forEach((service: string) => {
      if (services[service]) {
        serviceFee += services[service];
      }
    });

    const subtotal = baseFee + rushFee + serviceFee;
    const platformCommission = subtotal * (pricing.platform_commission_percentage / 100);
    const totalFee = subtotal + platformCommission;

    return NextResponse.json({
      success: true,
      calculation: {
        base_fee: baseFee,
        rush_fee: rushFee,
        service_fee: serviceFee,
        platform_commission: platformCommission,
        total_fee: Math.round(totalFee * 100) / 100, // Round to 2 decimal places
        currency: 'EGP',
        breakdown: {
          base: `${baseFee} EGP`,
          rush: rush_delivery ? `${rushFee} EGP (${Math.round((rushMultiplier - 1) * 100)}% rush fee)` : '0 EGP',
          services: `${serviceFee} EGP`,
          commission: `${Math.round(platformCommission * 100) / 100} EGP (${pricing.platform_commission_percentage}% platform fee)`
        }
      },
      fallback: false
    });

  } catch (error) {
    console.error('Pricing calculation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate pricing' },
      { status: 500 }
    );
  }
}