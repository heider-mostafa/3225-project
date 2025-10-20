// Portfolio Sync Service
// Synchronizes completed appraisals with public portfolio

interface AppraisalData {
  id: string;
  property_id: string;
  appraiser_id: string;
  client_name: string;
  market_value_estimate: number;
  status: string;
  appraisal_date: string;
  properties: {
    id: string;
    title: string;
    address: string;
    city: string;
    property_type: string;
  };
}

interface PortfolioItem {
  appraiser_id: string;
  title: string;
  description: string;
  property_type: string;
  property_value: number;
  property_location: string;
  completion_date: string;
  is_featured: boolean;
  tags: string[];
  source_appraisal_id?: string;
  auto_generated?: boolean;
  appraisal_challenges?: string;
}

export class PortfolioSyncService {
  
  /**
   * Syncs completed/approved appraisals to portfolio
   */
  static async syncAppraisalsToPortfolio(appraiser_id: string, supabaseClient?: any): Promise<void> {
    try {
      console.log(`=== PORTFOLIO SYNC START ===`);
      console.log(`Appraiser ID: ${appraiser_id}`);
      console.log(`Has Supabase Client: ${!!supabaseClient}`);

      if (!supabaseClient) {
        // Fallback to fetch for client-side calls
        console.log('Using client-side fetch for appraisals');
        const response = await fetch(`/api/appraisals?appraiser_id=${appraiser_id}&status=completed,approved&not_in_portfolio=true`);
        const result = await response.json();
        console.log('Client-side appraisals response:', result);
        return this.processAppraisalsToPortfolio(appraiser_id, result.data);
      }

      // Server-side database call
      console.log('Using server-side database call for appraisals');
      
      // NOTE: We no longer exclude existing items since the sync API now cleans up first
      console.log('Fetching all completed/approved appraisals for fresh sync');
      
      const query = supabaseClient
        .from('property_appraisals')
        .select(`
          id,
          property_id,
          appraiser_id,
          client_name,
          market_value_estimate,
          status,
          appraisal_date,
          properties (
            id,
            title,
            address,
            city,
            property_type
          )
        `)
        .eq('appraiser_id', appraiser_id)
        .in('status', ['completed', 'approved']);
      
      const { data: appraisals, error } = await query;

      if (error) {
        console.error('Database query error:', error);
        return;
      }

      console.log(`Found ${appraisals?.length || 0} appraisals to sync`);
      console.log('Appraisals data:', appraisals);
      
      // Also check total appraisals for this appraiser (for debugging)
      const { data: totalAppraisals } = await supabaseClient
        .from('property_appraisals')
        .select('id, status')
        .eq('appraiser_id', appraiser_id);
      
      // Check current portfolio items count
      const { data: currentPortfolioItems, error: portfolioCountError } = await supabaseClient
        .from('appraiser_portfolio')
        .select('id')
        .eq('appraiser_id', appraiser_id);
      
      console.log(`Total appraisals for appraiser ${appraiser_id}:`, totalAppraisals?.length || 0);
      console.log('Appraisal statuses:', totalAppraisals?.map(a => a.status));
      console.log(`Current portfolio items count: ${currentPortfolioItems?.length || 0}`);
      console.log('Portfolio count query error:', portfolioCountError);

      return this.processAppraisalsToPortfolio(appraiser_id, appraisals, supabaseClient);
    } catch (error) {
      console.error('Portfolio sync error:', error);
      throw error;
    }
  }

  private static async processAppraisalsToPortfolio(appraiser_id: string, appraisals: AppraisalData[], supabaseClient?: any): Promise<void> {
    try {
      console.log(`=== PROCESSING APPRAISALS TO PORTFOLIO ===`);
      console.log(`Appraiser ID: ${appraiser_id}`);
      console.log(`Appraisals count: ${appraisals?.length || 0}`);

      if (!appraisals || appraisals.length === 0) {
        console.log('No appraisals to process, exiting');
        return;
      }

      // Convert appraisals to portfolio items
      const portfolioItems: PortfolioItem[] = appraisals.map((appraisal: AppraisalData) => {
        const propertyType = appraisal.properties.property_type.toLowerCase();
        const isHighValue = appraisal.market_value_estimate > 5000000;
        const isLuxury = appraisal.market_value_estimate > 10000000;
        
        // Generate smart description based on property value and type
        let description = `Professional ${propertyType} appraisal completed with comprehensive market analysis. `;
        description += `Property valued at ${appraisal.market_value_estimate.toLocaleString()} EGP in ${appraisal.properties.city}. `;
        
        if (isLuxury) {
          description += `This luxury property appraisal required specialized expertise in high-end market analysis and premium property features evaluation.`;
        } else if (isHighValue) {
          description += `This high-value property assessment included detailed comparative market analysis and advanced valuation methodologies.`;
        } else {
          description += `Standard comprehensive appraisal including property inspection, market analysis, and regulatory compliance verification.`;
        }

        // Generate relevant tags
        const tags = [
          propertyType,
          appraisal.properties.city.toLowerCase().replace(/\s+/g, '-'),
          'professional-appraisal',
          'market-analysis'
        ];

        if (isLuxury) tags.push('luxury', 'premium');
        else if (isHighValue) tags.push('high-value');
        else tags.push('standard');

        // Add complexity tags based on property type
        if (propertyType === 'commercial') tags.push('income-approach', 'investment-analysis');
        if (propertyType === 'industrial') tags.push('specialized-use', 'technical-analysis');
        if (propertyType === 'land') tags.push('development-potential', 'zoning-analysis');

        return {
          appraiser_id,
          title: `${appraisal.properties.property_type} Property Appraisal - ${appraisal.properties.city}`,
          description,
          property_type: propertyType,
          property_value: appraisal.market_value_estimate,
          property_location: `${appraisal.properties.address}, ${appraisal.properties.city}`,
          completion_date: appraisal.appraisal_date,
          is_featured: isHighValue,
          tags,
          images: [], // Initialize as empty array instead of null
          source_appraisal_id: appraisal.id,
          auto_generated: true,
          appraisal_challenges: isLuxury ? 'Luxury property with unique features requiring specialized valuation approach' :
                              isHighValue ? 'High-value property requiring detailed market analysis' :
                              'Standard residential appraisal with comprehensive market review'
        };
      });

      console.log(`Generated ${portfolioItems.length} portfolio items:`, portfolioItems);

      if (supabaseClient) {
        // Server-side database insert
        console.log('Inserting portfolio items via Supabase client');
        const { data: insertData, error: insertError } = await supabaseClient
          .from('appraiser_portfolio')
          .insert(portfolioItems)
          .select();

        if (insertError) {
          console.error('Portfolio insert error:', insertError);
          throw insertError;
        }
        
        console.log(`Successfully inserted ${insertData?.length || 0} portfolio items`);
      } else {
        // Client-side fetch call
        console.log('Inserting portfolio items via API call');
        const response = await fetch('/api/appraisers/portfolio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            appraiser_id,
            portfolio_items: portfolioItems 
          })
        });
        
        const result = await response.json();
        console.log('API portfolio insert response:', result);
        
        if (!result.success) {
          throw new Error(`API Error: ${result.error}`);
        }
      }

    } catch (error) {
      console.error('Portfolio sync error:', error);
      throw error;
    }
  }

  /**
   * Updates portfolio statistics based on actual appraisal data
   */
  static async updatePortfolioStatistics(appraiser_id: string, supabaseClient?: any): Promise<void> {
    try {
      let appraisals;
      
      if (!supabaseClient) {
        // Client-side fetch call
        const response = await fetch(`/api/appraisals?appraiser_id=${appraiser_id}&status=completed,approved`);
        const result = await response.json();
        appraisals = result.data;
      } else {
        // Server-side database call
        const { data, error } = await supabaseClient
          .from('property_appraisals')
          .select(`
            id,
            market_value_estimate,
            properties (
              property_type
            )
          `)
          .eq('appraiser_id', appraiser_id)
          .in('status', ['completed', 'approved']);

        if (error) {
          console.error('Database error:', error);
          return;
        }
        appraisals = data;
      }

      if (!appraisals || appraisals.length === 0) {
        return;
      }

      // Calculate statistics by property type
      const stats = appraisals.reduce((acc: any, appraisal: AppraisalData) => {
        const type = appraisal.properties.property_type.toLowerCase();
        
        if (!acc[type]) {
          acc[type] = {
            property_type: type,
            properties_appraised: 0,
            total_value_appraised: 0,
            appraisal_values: []
          };
        }
        
        acc[type].properties_appraised += 1;
        acc[type].total_value_appraised += appraisal.market_value_estimate;
        acc[type].appraisal_values.push(appraisal.market_value_estimate);
        
        return acc;
      }, {});

      // Calculate accuracy percentages (mock for now, would come from validation data)
      const propertyStats = Object.values(stats).map((stat: any) => ({
        appraiser_id,
        property_type: stat.property_type,
        properties_appraised: stat.properties_appraised,
        total_value_appraised: stat.total_value_appraised,
        average_accuracy_percentage: 95 + (Math.random() * 4) // Mock accuracy 95-99%
      }));

      // Update statistics
      if (supabaseClient) {
        // Server-side database upsert
        const { error: statsError } = await supabaseClient
          .from('appraiser_property_statistics')
          .upsert(propertyStats, {
            onConflict: 'appraiser_id,property_type'
          });

        if (statsError) {
          console.error('Statistics update error:', statsError);
          throw statsError;
        }
      } else {
        // Client-side fetch call
        await fetch('/api/appraisers/statistics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            appraiser_id,
            property_statistics: propertyStats 
          })
        });
      }

    } catch (error) {
      console.error('Statistics update error:', error);
      throw error;
    }
  }

  /**
   * Full sync - both portfolio and statistics
   */
  static async fullSync(appraiser_id: string, supabaseClient?: any): Promise<void> {
    await Promise.all([
      this.syncAppraisalsToPortfolio(appraiser_id, supabaseClient),
      this.updatePortfolioStatistics(appraiser_id, supabaseClient)
    ]);
  }

  /**
   * Auto-sync trigger for when appraisals are completed
   */
  static async onAppraisalCompleted(appraisal_id: string, supabaseClient?: any): Promise<void> {
    try {
      let appraisal;
      
      if (!supabaseClient) {
        // Client-side fetch call
        const response = await fetch(`/api/appraisals/${appraisal_id}`);
        const result = await response.json();
        appraisal = result.data;
      } else {
        // Server-side database call
        const { data, error } = await supabaseClient
          .from('property_appraisals')
          .select('*')
          .eq('id', appraisal_id)
          .single();

        if (error) {
          console.error('Database error:', error);
          return;
        }
        appraisal = data;
      }

      if (appraisal && (appraisal.status === 'completed' || appraisal.status === 'approved')) {
        await this.fullSync(appraisal.appraiser_id, supabaseClient);
      }
    } catch (error) {
      console.error('Auto-sync error:', error);
    }
  }
}