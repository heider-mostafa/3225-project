/**
 * Property Description Auto-Generation System
 * Generates compelling property descriptions from appraisal data
 * Supports multiple variations, languages, and buyer personas
 */

import { ExtractedAppraisalData } from './appraisal-data-mapper';

export interface PropertyDescriptionOptions {
  language: 'ar' | 'en' | 'ar-en';
  tone: 'professional' | 'casual' | 'luxury' | 'investment';
  target_audience: 'first_time_buyer' | 'family' | 'investor' | 'luxury_buyer';
  include_technical_details: boolean;
  include_market_analysis: boolean;
  max_length: number;
}

export interface PropertyDescriptionResult {
  title: string;
  description: string;
  marketing_headline: string;
  key_features: string[];
  seo_keywords: string[];
  generated_at: Date;
  data_sources: string[];
  confidence_score: number;
}

export class PropertyDescriptionGenerator {
  private readonly DESCRIPTION_TEMPLATES = {
    // Residential Property Templates
    residential: {
      family: [
        {
          structure: 'location_intro + space_description + amenities + practical_features + closing',
          en: 'Discover your perfect family home in {neighborhood}, {city}. This {condition} {bedrooms}-bedroom, {bathrooms}-bathroom {property_type} offers {unit_area_sqm} sqm of comfortable living space{floor_info}{finishing_details}.',
          ar: 'اكتشف منزل عائلتك المثالي في {neighborhood}، {city}. يوفر هذا {property_type} {condition} المكون من {bedrooms} غرف نوم و {bathrooms} حمام مساحة معيشية مريحة تبلغ {unit_area_sqm} متر مربع{floor_info}{finishing_details}.'
        },
        {
          structure: 'value_proposition + space_layout + neighborhood + amenities',
          en: 'Exceptional value meets modern living in this {bedrooms}-bedroom {property_type} in {neighborhood}. Thoughtfully designed with {unit_area_sqm} sqm of living space, featuring {key_amenities} and {condition} finishing throughout.',
          ar: 'قيمة استثنائية تلتقي مع الحياة العصرية في هذا {property_type} المكون من {bedrooms} غرف نوم في {neighborhood}. مصمم بعناية بمساحة معيشية تبلغ {unit_area_sqm} متر مربع، ويضم {key_amenities} مع تشطيب {condition} في جميع الأنحاء.'
        }
      ],
      investor: [
        {
          structure: 'investment_intro + roi_potential + market_analysis + specifications',
          en: 'Prime investment opportunity in {neighborhood}, {city}. This {property_type} offers strong rental potential at {monthly_rental_estimate} EGP/month with {unit_area_sqm} sqm of quality space. Market analysis shows {market_trend} trends in the area.',
          ar: 'فرصة استثمارية مميزة في {neighborhood}، {city}. يوفر هذا {property_type} إمكانيات إيجارية قوية بقيمة {monthly_rental_estimate} جنيه مصري شهرياً مع {unit_area_sqm} متر مربع من المساحة عالية الجودة. يُظهر تحليل السوق اتجاهات {market_trend} في المنطقة.'
        }
      ],
      luxury: [
        {
          structure: 'prestige_intro + exclusive_features + quality_details + lifestyle',
          en: 'Exquisite {property_type} in the prestigious {neighborhood} district. This {bedrooms}-bedroom residence epitomizes luxury living with {unit_area_sqm} sqm of meticulously crafted space, featuring {luxury_amenities} and {finishing_level} finishing.',
          ar: 'ممتلكات رائعة من نوع {property_type} في حي {neighborhood} المرموق. تجسد هذه المقيمة المكونة من {bedrooms} غرف نوم قمة الفخامة بمساحة {unit_area_sqm} متر مربع مصممة بعناية فائقة، وتضم {luxury_amenities} مع تشطيب {finishing_level}.'
        }
      ]
    },
    
    // Commercial Property Templates
    commercial: {
      business: [
        {
          en: 'Strategic {property_type} space in prime {neighborhood} location. {unit_area_sqm} sqm of professional-grade space with {accessibility_rating}/10 accessibility rating and excellent infrastructure including {utilities}.',
          ar: 'مساحة تجارية استراتيجية من نوع {property_type} في موقع مميز في {neighborhood}. {unit_area_sqm} متر مربع من المساحة المهنية مع تقييم إمكانية الوصول {accessibility_rating}/10 وبنية تحتية ممتازة تشمل {utilities}.'
        }
      ]
    }
  };

  private readonly FEATURE_PHRASES = {
    amenities: {
      en: {
        has_pool: 'swimming pool',
        has_gym: 'fitness center',
        has_garden: 'private garden',
        has_security: '24/7 security',
        has_elevator: 'elevator access',
        has_parking: 'dedicated parking',
        has_balcony: 'balcony with views',
        has_terrace: 'spacious terrace'
      },
      ar: {
        has_pool: 'حمام سباحة',
        has_gym: 'صالة رياضية',
        has_garden: 'حديقة خاصة',
        has_security: 'أمن 24/7',
        has_elevator: 'مصعد',
        has_parking: 'موقف سيارات مخصص',
        has_balcony: 'بلكونة مع إطلالة',
        has_terrace: 'تراس واسع'
      }
    },
    
    condition: {
      en: {
        excellent: 'pristine',
        very_good: 'well-maintained',
        good: 'quality',
        fair: 'solid',
        poor: 'value'
      },
      ar: {
        excellent: 'ممتازة',
        very_good: 'جيد الصيانة',
        good: 'جودة عالية',
        fair: 'حالة جيدة',
        poor: 'حالة مقبولة'
      }
    },

    finishing: {
      en: {
        luxury: 'luxury finishes',
        fully_finished: 'premium finishes',
        semi_finished: 'quality finishes',
        core_shell: 'ready for customization'
      },
      ar: {
        luxury: 'تشطيب فاخر',
        fully_finished: 'تشطيب كامل',
        semi_finished: 'تشطيب نصف كامل',
        core_shell: 'جاهز للتخصيص'
      }
    }
  };

  private readonly SEO_KEYWORDS = {
    residential: {
      en: ['apartment for sale', 'villa for sale', 'property in cairo', 'real estate egypt', 'new cairo properties'],
      ar: ['شقة للبيع', 'فيلا للبيع', 'عقارات القاهرة', 'عقارات مصر', 'عقارات القاهرة الجديدة']
    },
    commercial: {
      en: ['commercial space', 'office for rent', 'retail space', 'investment property'],
      ar: ['مساحة تجارية', 'مكتب للإيجار', 'محل تجاري', 'عقار استثماري']
    }
  };

  /**
   * Generate property description from appraisal data
   */
  public generateDescription(
    appraisalData: ExtractedAppraisalData,
    options: PropertyDescriptionOptions = {
      language: 'en',
      tone: 'professional',
      target_audience: 'family',
      include_technical_details: true,
      include_market_analysis: false,
      max_length: 500
    }
  ): PropertyDescriptionResult {
    
    // Determine property category and template selection
    const propertyCategory = this.categorizeProperty(appraisalData);
    const templateVariation = this.selectTemplateVariation(propertyCategory, options.target_audience);
    
    // Extract key data points
    const dataPoints = this.extractDataPoints(appraisalData);
    
    // Generate title variations
    const title = this.generateTitle(dataPoints, options);
    
    // Generate marketing headline
    const marketing_headline = this.generateMarketingHeadline(dataPoints, options);
    
    // Generate main description
    const description = this.generateMainDescription(
      dataPoints, 
      templateVariation, 
      options
    );
    
    // Extract key features
    const key_features = this.extractKeyFeatures(dataPoints, options);
    
    // Generate SEO keywords
    const seo_keywords = this.generateSEOKeywords(dataPoints, options);
    
    // Calculate confidence score
    const confidence_score = this.calculateConfidenceScore(appraisalData);
    
    return {
      title,
      description,
      marketing_headline,
      key_features,
      seo_keywords,
      generated_at: new Date(),
      data_sources: Object.keys(appraisalData).filter(key => appraisalData[key as keyof ExtractedAppraisalData]),
      confidence_score
    };
  }

  /**
   * Generate multiple description variations
   */
  public generateVariations(
    appraisalData: ExtractedAppraisalData,
    count: number = 3,
    baseOptions: PropertyDescriptionOptions
  ): PropertyDescriptionResult[] {
    const variations: PropertyDescriptionResult[] = [];
    
    const tones = ['professional', 'casual', 'luxury'] as const;
    const audiences = ['family', 'investor', 'first_time_buyer'] as const;
    
    for (let i = 0; i < count; i++) {
      const options = {
        ...baseOptions,
        tone: tones[i % tones.length],
        target_audience: audiences[i % audiences.length]
      };
      
      variations.push(this.generateDescription(appraisalData, options));
    }
    
    return variations;
  }

  private categorizeProperty(data: ExtractedAppraisalData): string {
    const propertyType = data.property_type?.toLowerCase() || '';
    
    if (['apartment', 'villa', 'townhouse', 'duplex'].includes(propertyType)) {
      return 'residential';
    }
    if (['office', 'retail', 'commercial'].includes(propertyType)) {
      return 'commercial';
    }
    return 'residential'; // default
  }

  private selectTemplateVariation(category: string, audience: string): any {
    const templates = this.DESCRIPTION_TEMPLATES[category as keyof typeof this.DESCRIPTION_TEMPLATES];
    if (!templates) return this.DESCRIPTION_TEMPLATES.residential.family[0];
    
    const audienceTemplates = templates[audience as keyof typeof templates] as any[];
    if (!audienceTemplates || !Array.isArray(audienceTemplates)) {
      const firstKey = Object.keys(templates)[0] as keyof typeof templates;
      return (templates[firstKey] as any[])[0];
    }
    
    // Select random variation for diversity
    return audienceTemplates[Math.floor(Math.random() * audienceTemplates.length)];
  }

  private extractDataPoints(data: ExtractedAppraisalData) {
    return {
      // Basic Info
      property_type: data.property_type || 'Property',
      bedrooms: data.bedrooms || 0,
      bathrooms: data.bathrooms || 0,
      unit_area_sqm: data.unit_area_sqm || data.built_area_sqm || 0,
      
      // Location
      neighborhood: data.district_name || data.property_address_english?.split(',')[1]?.trim() || '',
      city: data.city_name || 'Cairo',
      governorate: data.governorate || 'Cairo',
      
      // Condition & Quality
      overall_condition_rating: data.overall_condition_rating || 7,
      finishing_level: data.finishing_level || 'good',
      
      // Financial
      final_reconciled_value: data.final_reconciled_value || 0,
      monthly_rental_estimate: data.monthly_rental_estimate || 0,
      price_per_sqm: data.price_per_sqm_area || 0,
      
      // Amenities (boolean checks)
      has_elevator: data.elevator_available || false,
      has_parking: data.parking_available || false,
      has_security: data.security_system || false,
      has_pool: data.nearby_services?.toLowerCase().includes('pool') || false,
      has_garden: data.nearby_services?.toLowerCase().includes('garden') || false,
      has_gym: data.nearby_services?.toLowerCase().includes('gym') || false,
      has_balcony: (data.balcony_area_sqm || 0) > 0,
      
      // Location Quality
      accessibility_rating: data.accessibility_rating || 7,
      neighborhood_quality_rating: data.neighborhood_quality_rating || 7,
      view_quality: data.view_quality || 'good',
      noise_level: data.noise_level || 'moderate',
      
      // Technical Details
      floor_number: data.floor_number || 0,
      total_floors: data.total_floors || 0,
      year_built: data.year_built || 0,
      
      // Market Analysis
      market_trend: data.market_trend || 'stable',
      time_to_sell: data.time_on_market_months || data.time_to_sell || 6,
      
      // Utilities
      utilities: this.extractUtilities(data)
    };
  }

  private extractUtilities(data: ExtractedAppraisalData): string[] {
    const utilities: string[] = [];
    
    if (data.electricity_available) utilities.push('electricity');
    if (data.water_supply_available) utilities.push('water supply');
    if (data.gas_supply_available) utilities.push('natural gas');
    if (data.internet_fiber_available) utilities.push('high-speed internet');
    if (data.sewage_system_available) utilities.push('sewage system');
    
    return utilities;
  }

  private generateTitle(dataPoints: any, options: PropertyDescriptionOptions): string {
    const templates = {
      en: [
        `${dataPoints.bedrooms}-Bedroom ${dataPoints.property_type} in ${dataPoints.neighborhood}`,
        `Stunning ${dataPoints.property_type} - ${dataPoints.neighborhood}, ${dataPoints.city}`,
        `Modern ${dataPoints.bedrooms}BR ${dataPoints.property_type} | ${dataPoints.unit_area_sqm} sqm`,
        `Premium ${dataPoints.property_type} in ${dataPoints.neighborhood} - ${dataPoints.unit_area_sqm} sqm`
      ],
      ar: [
        `${dataPoints.property_type} ${dataPoints.bedrooms} غرف نوم في ${dataPoints.neighborhood}`,
        `${dataPoints.property_type} رائع - ${dataPoints.neighborhood}، ${dataPoints.city}`,
        `${dataPoints.property_type} عصري ${dataPoints.bedrooms} غرف | ${dataPoints.unit_area_sqm} متر مربع`,
        `${dataPoints.property_type} مميز في ${dataPoints.neighborhood} - ${dataPoints.unit_area_sqm} متر مربع`
      ]
    };
    
    const language = options.language === 'ar-en' ? 'en' : options.language;
    const titleTemplates = templates[language];
    return titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
  }

  private generateMarketingHeadline(dataPoints: any, options: PropertyDescriptionOptions): string {
    const headlines = {
      professional: {
        en: `Professional Appraisal: ${dataPoints.final_reconciled_value.toLocaleString()} EGP`,
        ar: `تقييم مهني: ${dataPoints.final_reconciled_value.toLocaleString()} جنيه مصري`
      },
      luxury: {
        en: `Luxury Living Redefined`,
        ar: `إعادة تعريف الحياة الفاخرة`
      },
      investment: {
        en: `Prime Investment Opportunity`,
        ar: `فرصة استثمارية مميزة`
      }
    };
    
    const language = options.language === 'ar-en' ? 'en' : options.language;
    const category = options.tone === 'luxury' ? 'luxury' : 
                    options.target_audience === 'investor' ? 'investment' : 'professional';
    
    return headlines[category][language];
  }

  private generateMainDescription(
    dataPoints: any, 
    template: any, 
    options: PropertyDescriptionOptions
  ): string {
    const language = options.language === 'ar-en' ? 'en' : options.language;
    let description = template[language] || template.en;
    
    // Replace placeholders with actual data
    const replacements = {
      '{neighborhood}': dataPoints.neighborhood,
      '{city}': dataPoints.city,
      '{property_type}': dataPoints.property_type,
      '{bedrooms}': dataPoints.bedrooms.toString(),
      '{bathrooms}': dataPoints.bathrooms.toString(),
      '{unit_area_sqm}': dataPoints.unit_area_sqm.toString(),
      '{condition}': this.getConditionPhrase(dataPoints.overall_condition_rating, language),
      '{finishing_details}': this.getFinishingPhrase(dataPoints.finishing_level, language),
      '{key_amenities}': this.getAmenitiesPhrase(dataPoints, language),
      '{floor_info}': dataPoints.floor_number > 0 ? ` on the ${dataPoints.floor_number}${this.getOrdinalSuffix(dataPoints.floor_number)} floor` : '',
      '{market_trend}': dataPoints.market_trend,
      '{monthly_rental_estimate}': dataPoints.monthly_rental_estimate.toString(),
      '{accessibility_rating}': dataPoints.accessibility_rating.toString(),
      '{utilities}': dataPoints.utilities.join(', '),
      '{luxury_amenities}': this.getLuxuryAmenitiesPhrase(dataPoints, language)
    };
    
    // Apply replacements
    for (const [placeholder, value] of Object.entries(replacements)) {
      description = description.replace(new RegExp(placeholder, 'g'), value || '');
    }
    
    // Add technical details if requested
    if (options.include_technical_details) {
      description += this.generateTechnicalDetails(dataPoints, language);
    }
    
    // Add market analysis if requested
    if (options.include_market_analysis && dataPoints.market_trend) {
      description += this.generateMarketAnalysis(dataPoints, language);
    }
    
    // Trim to max length
    if (description.length > options.max_length) {
      description = description.substring(0, options.max_length - 3) + '...';
    }
    
    return description;
  }

  private getConditionPhrase(rating: number, language: string): string {
    const conditions = this.FEATURE_PHRASES.condition[language as keyof typeof this.FEATURE_PHRASES.condition];
    
    if (rating >= 9) return conditions.excellent;
    if (rating >= 7) return conditions.very_good;
    if (rating >= 5) return conditions.good;
    if (rating >= 3) return conditions.fair;
    return conditions.poor;
  }

  private getFinishingPhrase(level: string, language: string): string {
    const finishings = this.FEATURE_PHRASES.finishing[language as keyof typeof this.FEATURE_PHRASES.finishing];
    return finishings[level as keyof typeof finishings] || '';
  }

  private getAmenitiesPhrase(dataPoints: any, language: string): string {
    const amenityPhrases = this.FEATURE_PHRASES.amenities[language as keyof typeof this.FEATURE_PHRASES.amenities];
    const availableAmenities: string[] = [];
    
    Object.keys(amenityPhrases).forEach(amenity => {
      if (dataPoints[amenity]) {
        availableAmenities.push(amenityPhrases[amenity as keyof typeof amenityPhrases]);
      }
    });
    
    return availableAmenities.slice(0, 3).join(', ');
  }

  private getLuxuryAmenitiesPhrase(dataPoints: any, language: string): string {
    // Similar to getAmenitiesPhrase but focuses on luxury features
    return this.getAmenitiesPhrase(dataPoints, language);
  }

  private generateTechnicalDetails(dataPoints: any, language: string): string {
    const details = [];
    
    if (dataPoints.year_built > 0) {
      const ageText = language === 'ar' ? ` بُني عام ${dataPoints.year_built}` : ` Built in ${dataPoints.year_built}`;
      details.push(ageText);
    }
    
    if (dataPoints.accessibility_rating > 7) {
      const accessText = language === 'ar' ? ' موقع سهل الوصول' : ' Excellent accessibility';
      details.push(accessText);
    }
    
    return details.length > 0 ? '.' + details.join('.') + '.' : '';
  }

  private generateMarketAnalysis(dataPoints: any, language: string): string {
    if (!dataPoints.market_trend) return '';
    
    const trendTexts = {
      en: {
        rising: ' Market analysis indicates strong growth potential in this area.',
        stable: ' The local market shows stable pricing trends.',
        declining: ' Current market conditions present value opportunities.'
      },
      ar: {
        rising: ' يشير تحليل السوق إلى إمكانيات نمو قوية في هذه المنطقة.',
        stable: ' يُظهر السوق المحلي اتجاهات تسعير مستقرة.',
        declining: ' توفر ظروف السوق الحالية فرص قيمة جيدة.'
      }
    };
    
    const texts = trendTexts[language as keyof typeof trendTexts];
    return texts[dataPoints.market_trend as keyof typeof texts] || '';
  }

  private extractKeyFeatures(dataPoints: any, options: PropertyDescriptionOptions): string[] {
    const features: string[] = [];
    const language = options.language === 'ar-en' ? 'en' : options.language;
    
    // Add room count
    if (language === 'ar') {
      features.push(`${dataPoints.bedrooms} غرف نوم`);
      features.push(`${dataPoints.bathrooms} حمام`);
      features.push(`${dataPoints.unit_area_sqm} متر مربع`);
    } else {
      features.push(`${dataPoints.bedrooms} Bedrooms`);
      features.push(`${dataPoints.bathrooms} Bathrooms`);
      features.push(`${dataPoints.unit_area_sqm} sqm`);
    }
    
    // Add amenities
    const amenityPhrases = this.FEATURE_PHRASES.amenities[language as keyof typeof this.FEATURE_PHRASES.amenities];
    Object.keys(amenityPhrases).forEach(amenity => {
      if (dataPoints[amenity] && features.length < 8) {
        features.push(amenityPhrases[amenity as keyof typeof amenityPhrases]);
      }
    });
    
    return features;
  }

  private generateSEOKeywords(dataPoints: any, options: PropertyDescriptionOptions): string[] {
    const language = options.language === 'ar-en' ? 'en' : options.language;
    const propertyCategory = dataPoints.property_type?.includes('commercial') ? 'commercial' : 'residential';
    
    const baseKeywords = this.SEO_KEYWORDS[propertyCategory][language as keyof typeof this.SEO_KEYWORDS[typeof propertyCategory]] || [];
    
    // Add location-specific keywords
    const locationKeywords = [
      `${dataPoints.neighborhood} ${language === 'ar' ? 'عقارات' : 'properties'}`,
      `${dataPoints.city} ${language === 'ar' ? 'عقار' : 'real estate'}`
    ];
    
    // Add property-specific keywords
    const specificKeywords = [
      `${dataPoints.bedrooms} ${language === 'ar' ? 'غرف نوم' : 'bedroom'}`,
      `${dataPoints.unit_area_sqm} ${language === 'ar' ? 'متر' : 'sqm'}`
    ];
    
    return [...baseKeywords, ...locationKeywords, ...specificKeywords];
  }

  private calculateConfidenceScore(data: ExtractedAppraisalData): number {
    let score = 0;
    let totalFields = 0;
    
    // Critical fields scoring
    const criticalFields = [
      'property_type', 'bedrooms', 'bathrooms', 'unit_area_sqm',
      'property_address_arabic', 'city_name', 'overall_condition_rating'
    ];
    
    criticalFields.forEach(field => {
      totalFields++;
      if (data[field as keyof ExtractedAppraisalData]) score++;
    });
    
    // Optional fields scoring (lower weight)
    const optionalFields = [
      'finishing_level', 'year_built', 'market_trend', 'accessibility_rating'
    ];
    
    optionalFields.forEach(field => {
      totalFields += 0.5;
      if (data[field as keyof ExtractedAppraisalData]) score += 0.5;
    });
    
    return Math.round((score / totalFields) * 100);
  }

  private getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }
}

/**
 * Utility function to generate description for immediate use
 */
export function generatePropertyDescription(
  appraisalData: ExtractedAppraisalData,
  options?: Partial<PropertyDescriptionOptions>
): PropertyDescriptionResult {
  const generator = new PropertyDescriptionGenerator();
  const defaultOptions: PropertyDescriptionOptions = {
    language: 'en',
    tone: 'professional',
    target_audience: 'family',
    include_technical_details: true,
    include_market_analysis: false,
    max_length: 500,
    ...options
  };
  
  return generator.generateDescription(appraisalData, defaultOptions);
}