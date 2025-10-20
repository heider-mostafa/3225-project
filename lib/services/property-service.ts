import { createServerSupabaseClient } from '@/lib/supabase/server';

interface PropertyFilters {
  city?: string;
  compound?: string;
  property_type?: string;
  min_bedrooms?: number;
  max_bedrooms?: number;
  min_price?: number;
  max_price?: number;
  exclude?: string;
  has_virtual_tour?: boolean;
}

interface PropertyQueryContext {
  type: 'listing' | 'detail' | 'search' | 'admin';
  includePhotos?: boolean;
  includeAppraisals?: boolean;
  includeFullPhotos?: boolean;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
}

export class PropertyService {
  private static instance: PropertyService;
  
  public static getInstance(): PropertyService {
    if (!PropertyService.instance) {
      PropertyService.instance = new PropertyService();
    }
    return PropertyService.instance;
  }

  /**
   * Get optimized select fields based on context
   */
  private getSelectFields(context: PropertyQueryContext): string {
    const baseFields = 'id,title,price,bedrooms,bathrooms,square_meters,address,city,state,property_type,status,latitude,longitude,virtual_tour_url,created_at,updated_at';
    
    switch (context.type) {
      case 'listing':
        // Minimal data for property listings - only primary photo
        return `${baseFields}, property_photos(id,url,is_primary,order_index)`;
      
      case 'search':
        // Search results - primary photo + basic appraisal
        return `
          ${baseFields}, 
          property_photos(id,url,is_primary,order_index),
          property_appraisals(id,market_value_estimate,status)
        `;
      
      case 'detail':
        // Full property details - all photos and latest appraisal
        return `
          *, 
          property_photos(id,url,is_primary,order_index,alt_text,category,source),
          property_appraisals(
            id,market_value_estimate,status,created_at,
            calculation_results,form_data,appraiser_id,
            appraiser:brokers!appraiser_id(id,company_name,first_name,last_name)
          )
        `;
      
      case 'admin':
        // Admin view - everything for management
        return `
          *, 
          property_photos(*),
          property_appraisals(
            *,
            appraiser:brokers!appraiser_id(*)
          )
        `;
      
      default:
        return baseFields;
    }
  }

  /**
   * Get properties with optimized queries based on context
   */
  async getProperties(
    filters: PropertyFilters = {}, 
    context: PropertyQueryContext = { type: 'listing' },
    pagination: PaginationOptions = { page: 1, limit: 20 }
  ) {
    const supabase = await createServerSupabaseClient();
    const fields = this.getSelectFields(context);
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('properties')
      .select(fields, { count: 'exact' });

    // Apply filters efficiently
    if (filters.city) query = query.eq('city', filters.city);
    if (filters.compound) query = query.eq('compound', filters.compound);
    if (filters.property_type) query = query.eq('property_type', filters.property_type);
    if (filters.min_bedrooms) query = query.gte('bedrooms', filters.min_bedrooms);
    if (filters.max_bedrooms) query = query.lte('bedrooms', filters.max_bedrooms);
    if (filters.min_price) query = query.gte('price', filters.min_price);
    if (filters.max_price) query = query.lte('price', filters.max_price);
    if (filters.exclude) query = query.neq('id', filters.exclude);
    if (filters.has_virtual_tour === true) {
      query = query.not('virtual_tour_url', 'is', null).neq('virtual_tour_url', '');
    }

    // Filter properties based on context
    if (context.type === 'admin') {
      // Admin sees all properties
    } else {
      // Public sees all displayable properties
      query = query.in('status', ['active', 'available', 'for_sale', 'for_rent', 'For Sale']);
    }

    const startTime = Date.now();
    
    const { data: properties, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const queryTime = Date.now() - startTime;

    if (error) {
      console.error('❌ PropertyService error:', error);
      throw new Error(`Failed to fetch properties: ${error.message}`);
    }

    const processedProperties = this.processProperties(properties || [], context);

    return {
      properties: processedProperties,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      performance: {
        queryTime,
        resultCount: (properties || []).length
      }
    };
  }

  /**
   * Get single property with context optimization
   */
  async getProperty(id: string, context: PropertyQueryContext = { type: 'detail' }) {
    const supabase = await createServerSupabaseClient();
    const fields = this.getSelectFields(context);

    console.log(`🔍 PropertyService: Fetching property ${id} with context: ${context.type}`);
    
    const startTime = Date.now();
    const { data: property, error } = await supabase
      .from('properties')
      .select(fields)
      .eq('id', id)
      .single();

    const queryTime = Date.now() - startTime;
    console.log(`⚡ PropertyService: Single property query completed in ${queryTime}ms`);

    if (error) {
      console.error('❌ PropertyService error:', error);
      throw new Error(`Failed to fetch property: ${error.message}`);
    }

    return {
      property: this.processProperties([property], context)[0],
      performance: {
        queryTime
      }
    };
  }

  /**
   * Process and enhance properties based on context
   */
  private processProperties(properties: any[], context: PropertyQueryContext) {
    return properties.map(property => {
      // Enhanced property processing with appraisal data
      if (property.property_appraisals && property.property_appraisals.length > 0) {
        const latestAppraisal = property.property_appraisals
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        const calculationResults = latestAppraisal.calculation_results || {};
        const formData = latestAppraisal.form_data || {};
        
        // Use appraisal data to enhance property info
        property = {
          ...property,
          // Price: Use market value estimate from latest appraisal
          price: calculationResults.market_value_estimate || 
                 calculationResults.final_reconciled_value || 
                 latestAppraisal.market_value_estimate || 
                 property.price,
          
          // Area: Use calculated area if available
          square_meters: calculationResults.unit_area_sqm || 
                        property.square_meters,
          
          // Enhanced property info from appraisal
          bedrooms: formData.bedrooms || calculationResults.bedrooms || property.bedrooms,
          bathrooms: formData.bathrooms || calculationResults.bathrooms || property.bathrooms,
          
          // Add appraisal metadata for context
          appraisal_data: context.type === 'detail' ? {
            market_value_estimate: calculationResults.market_value_estimate,
            unit_area_sqm: calculationResults.unit_area_sqm,
            price_per_sqm: calculationResults.price_per_sqm,
            appraiser_name: latestAppraisal.appraiser ? 
              `${latestAppraisal.appraiser.first_name} ${latestAppraisal.appraiser.last_name}` : null,
            appraisal_date: latestAppraisal.created_at
          } : null
        };

        // Add extracted images for detail view
        if (context.type === 'detail' && formData.extracted_images) {
          const extractedImages = formData.extracted_images
            .filter((img: any) => img.data || img.base64)
            .map((img: any, index: number) => ({
              id: `appraisal_${img.filename || index}`,
              url: `data:image/${img.format || 'png'};base64,${img.data || img.base64}`,
              is_primary: false,
              order_index: 1000 + index,
              source: 'appraisal',
              category: 'extracted'
            }));
          
          property.property_photos = [...(property.property_photos || []), ...extractedImages];
        }
      }

      // Sort photos by order_index
      if (property.property_photos) {
        property.property_photos.sort((a: any, b: any) => a.order_index - b.order_index);
      }

      return property;
    });
  }

  /**
   * Get property statistics for admin dashboard
   */
  async getPropertyStats() {
    const supabase = await createServerSupabaseClient();
    
    const startTime = Date.now();
    const { data: stats, error } = await supabase
      .rpc('get_property_statistics');

    const queryTime = Date.now() - startTime;
    console.log(`⚡ PropertyService: Stats query completed in ${queryTime}ms`);

    if (error) {
      console.error('❌ PropertyService stats error:', error);
      // Fallback to basic counts
      const { count: totalProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true });
      
      const { count: activeProperties } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      return {
        total_properties: totalProperties || 0,
        active_properties: activeProperties || 0,
        pending_properties: (totalProperties || 0) - (activeProperties || 0),
        avg_price: 0,
        performance: { queryTime }
      };
    }

    return { ...stats, performance: { queryTime } };
  }
}

// Export singleton instance
export const propertyService = PropertyService.getInstance();