import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('🔄 MARKET INTELLIGENCE SYNC - Starting manual sync of existing appraisals');
    
    // Get all completed appraisals
    const { data: appraisals, error: appraisalsError } = await supabase
      .from('property_appraisals')
      .select('id, status, form_data, market_value_estimate, appraiser_id, created_at')
      .eq('status', 'completed');

    if (appraisalsError) {
      console.error('Failed to fetch appraisals:', appraisalsError);
      throw appraisalsError;
    }

    console.log(`🔄 MARKET INTELLIGENCE SYNC - Found ${appraisals?.length || 0} completed appraisals`);

    if (!appraisals || appraisals.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No completed appraisals found to sync',
        synced_appraisals: 0
      });
    }

    let syncedCount = 0;
    const syncResults = [];

    for (const appraisal of appraisals) {
      try {
        console.log(`🔄 Processing appraisal ${appraisal.id}`);
        
        const formData = appraisal.form_data || {};
        
        // Map Arabic location names to English for consistency
        const mapArabicToEnglish = (name: string) => {
          const mapping: Record<string, string> = {
            'القاهرة الجديدة': 'New Cairo',
            'القاهرة': 'Cairo',
            'الجيزة': 'Giza',
            'مدينتي': 'Madinaty',
            'الرحاب': 'Rehab City',
            'العاصمة الإدارية الجديدة': 'New Capital',
            'العاصمة الجديدة': 'New Capital',
            'أكتوبر': '6th of October',
            'السادس من أكتوبر': '6th of October',
            'الشيخ زايد': 'Sheikh Zayed',
            'مصر الجديدة': 'Heliopolis',
            'مدينة نصر': 'Nasr City',
            'الزمالك': 'Zamalek',
            'المعادي': 'Maadi'
          };
          return mapping[name] || name; // Return English if mapped, otherwise keep original
        };
        
        const rawCompoundName = formData.compound_name || formData.district_name;
        const rawAreaName = formData.area || formData.city_name;
        
        const compoundName = rawCompoundName ? mapArabicToEnglish(rawCompoundName) : null;
        const areaName = rawAreaName ? mapArabicToEnglish(rawAreaName) : null;
        
        console.log(`🔄 Appraisal ${appraisal.id} - Compound: ${compoundName}, Area: ${areaName}`);
        console.log(`🔄 Available location fields:`, {
          compound_name: formData.compound_name,
          district_name: formData.district_name,
          area: formData.area,
          city_name: formData.city_name
        });

        // Update compound-level cache if compound name exists
        if (compoundName) {
          // First check if compound exists
          const { data: existingCompound } = await supabase
            .from('market_intelligence_cache')
            .select('id, total_appraisals')
            .eq('location_type', 'compound')
            .eq('location_name', compoundName)
            .single();

          if (existingCompound) {
            // Update existing record by incrementing
            const { error: compoundError } = await supabase
              .from('market_intelligence_cache')
              .update({
                total_appraisals: existingCompound.total_appraisals + 1,
                avg_price_per_sqm: appraisal.market_value_estimate && formData.unit_area_sqm ? Math.round(appraisal.market_value_estimate / formData.unit_area_sqm) : null,
                last_updated: new Date().toISOString(),
                market_activity: 'moderate',
                confidence_level: 'medium'
              })
              .eq('id', existingCompound.id);
            
            if (compoundError) {
              console.error(`Error updating compound cache for ${compoundName}:`, compoundError);
            }
          } else {
            // Insert new record
            const { error: compoundError } = await supabase
              .from('market_intelligence_cache')
              .insert({
                location_type: 'compound',
                location_name: compoundName,
                total_appraisals: 1,
                avg_price_per_sqm: appraisal.market_value_estimate && formData.unit_area_sqm ? Math.round(appraisal.market_value_estimate / formData.unit_area_sqm) : null,
                last_updated: new Date().toISOString(),
                market_activity: 'moderate',
                confidence_level: 'medium'
              });
            
            if (compoundError) {
              console.error(`Error inserting compound cache for ${compoundName}:`, compoundError);
            }
          }

          console.log(`✅ Updated compound cache for ${compoundName}`);
        }

        // Update area-level cache if area name exists
        if (areaName) {
          // First check if area exists
          const { data: existingArea } = await supabase
            .from('market_intelligence_cache')
            .select('id, total_appraisals')
            .eq('location_type', 'area')
            .eq('location_name', areaName)
            .single();

          if (existingArea) {
            // Update existing record by incrementing
            const { error: areaError } = await supabase
              .from('market_intelligence_cache')
              .update({
                total_appraisals: existingArea.total_appraisals + 1,
                avg_price_per_sqm: appraisal.market_value_estimate && formData.unit_area_sqm ? Math.round(appraisal.market_value_estimate / formData.unit_area_sqm) : null,
                last_updated: new Date().toISOString(),
                market_activity: 'moderate',
                confidence_level: 'medium'
              })
              .eq('id', existingArea.id);
            
            if (areaError) {
              console.error(`Error updating area cache for ${areaName}:`, areaError);
            }
          } else {
            // Insert new record
            const { error: areaError } = await supabase
              .from('market_intelligence_cache')
              .insert({
                location_type: 'area',
                location_name: areaName,
                total_appraisals: 1,
                avg_price_per_sqm: appraisal.market_value_estimate && formData.unit_area_sqm ? Math.round(appraisal.market_value_estimate / formData.unit_area_sqm) : null,
                last_updated: new Date().toISOString(),
                market_activity: 'moderate',
                confidence_level: 'medium'
              });
            
            if (areaError) {
              console.error(`Error inserting area cache for ${areaName}:`, areaError);
            }
          }

          console.log(`✅ Updated area cache for ${areaName}`);
        }

        // Update appraiser coverage if appraiser exists
        if (appraisal.appraiser_id) {
          if (compoundName) {
            const { error: coverageError } = await supabase
              .from('appraiser_coverage_areas')
              .upsert({
                appraiser_id: appraisal.appraiser_id,
                area_name: compoundName,
                area_type: 'compound',
                appraisals_completed: 1,
                coverage_strength: 'low',
                last_activity: appraisal.created_at
              }, {
                onConflict: 'appraiser_id,area_name,area_type',
                ignoreDuplicates: false
              });

            if (!coverageError) {
              console.log(`✅ Updated appraiser coverage for ${compoundName}`);
            }
          }

          if (areaName) {
            const { error: areaCoverageError } = await supabase
              .from('appraiser_coverage_areas')
              .upsert({
                appraiser_id: appraisal.appraiser_id,
                area_name: areaName,
                area_type: 'area',
                appraisals_completed: 1,
                coverage_strength: 'low',
                last_activity: appraisal.created_at
              }, {
                onConflict: 'appraiser_id,area_name,area_type',
                ignoreDuplicates: false
              });

            if (!areaCoverageError) {
              console.log(`✅ Updated appraiser area coverage for ${areaName}`);
            }
          }
        }

        syncedCount++;
        syncResults.push({
          appraisal_id: appraisal.id,
          compound: compoundName,
          area: areaName,
          status: 'synced'
        });

      } catch (error) {
        console.error(`Error processing appraisal ${appraisal.id}:`, error);
        syncResults.push({
          appraisal_id: appraisal.id,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`🔄 MARKET INTELLIGENCE SYNC - Completed. Synced ${syncedCount} appraisals`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedCount} appraisals to market intelligence cache`,
      synced_appraisals: syncedCount,
      total_appraisals: appraisals.length,
      results: syncResults
    });

  } catch (error) {
    console.error('Market Intelligence Sync Error:', error);
    return NextResponse.json(
      { error: 'Failed to sync market intelligence data' },
      { status: 500 }
    );
  }
}