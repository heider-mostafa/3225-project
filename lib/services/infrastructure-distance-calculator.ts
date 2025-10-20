/**
 * Infrastructure Distance Calculator Service
 * Calculates and manages distances to key infrastructure points
 * Integrates with Google Maps API and existing lifestyle compatibility system
 */

import { GoogleMapsIntegrationService, InfrastructurePoint, DistanceCalculation, LocationCoordinates } from './google-maps-integration';
import { ExtractedAppraisalData } from './appraisal-data-mapper';

export interface InfrastructureAnalysisResult {
  property_id: string;
  coordinates: LocationCoordinates;
  distances: {
    metro: DistanceCalculation | null;
    airport: DistanceCalculation | null;
    mall: DistanceCalculation | null;
    hospital: DistanceCalculation | null;
  };
  accessibility_score: number;
  location_premium_factor: number;
  transportation_score: number;
  convenience_score: number;
  overall_location_score: number;
  recommendations: string[];
  last_updated: Date;
  confidence_level: 'high' | 'medium' | 'low';
}

export interface PropertyLocationEnhancement {
  // Core location data
  enhanced_coordinates: LocationCoordinates;
  infrastructure_analysis: InfrastructureAnalysisResult;
  
  // Integration with existing systems
  lifestyle_compatibility_integration: {
    commute_analysis_ready: boolean;
    suggested_user_destinations: Array<{
      name: string;
      category: string;
      coordinates: { latitude: number; longitude: number };
      reasoning: string;
    }>;
  };

  // Property detail page enhancements
  property_detail_enhancements: {
    distance_to_metro: number | null;
    distance_to_airport: number | null;
    distance_to_mall: number | null;
    distance_to_hospital: number | null;
    accessibility_rating: number;
    location_quality_score: number;
    infrastructure_summary: string;
  };

  // Market analysis integration
  market_impact: {
    location_value_multiplier: number;
    accessibility_premium: number;
    infrastructure_benefits: string[];
    potential_drawbacks: string[];
  };
}

export class InfrastructureDistanceCalculator {
  private mapsService: GoogleMapsIntegrationService;
  private readonly SCORING_WEIGHTS = {
    metro_access: 0.35,      // 35% - Most important for Cairo
    mall_access: 0.25,       // 25% - Shopping convenience
    hospital_access: 0.25,   // 25% - Healthcare access
    airport_access: 0.15     // 15% - Travel convenience
  };

  private readonly DISTANCE_THRESHOLDS = {
    metro: { excellent: 1, good: 3, fair: 5, poor: 10 },
    mall: { excellent: 3, good: 7, fair: 12, poor: 20 },
    hospital: { excellent: 2, good: 5, fair: 10, poor: 15 },
    airport: { excellent: 25, good: 35, fair: 50, poor: 70 } // Different logic: not too close, not too far
  };

  constructor(googleMapsApiKey?: string) {
    this.mapsService = new GoogleMapsIntegrationService(googleMapsApiKey);
  }

  /**
   * Comprehensive infrastructure analysis for a property
   */
  async analyzePropertyInfrastructure(
    propertyId: string,
    coordinates: LocationCoordinates
  ): Promise<InfrastructureAnalysisResult> {
    
    // Calculate distances to all infrastructure types
    const allDistances = await this.mapsService.calculateInfrastructureDistances(
      coordinates, 
      ['metro', 'airport', 'mall', 'hospital']
    );

    // Organize distances by type (get closest of each type)
    const distances = {
      metro: allDistances.find(d => d.destination.type === 'metro') || null,
      airport: allDistances.find(d => d.destination.type === 'airport') || null,
      mall: allDistances.find(d => d.destination.type === 'mall') || null,
      hospital: allDistances.find(d => d.destination.type === 'hospital') || null,
    };

    // Calculate individual scores
    const accessibilityScore = this.calculateAccessibilityScore(distances);
    const locationPremiumFactor = this.calculateLocationPremiumFactor(distances);
    const transportationScore = this.calculateTransportationScore(distances);
    const convenientScore = this.calculateConvenienceScore(distances);
    const overallScore = this.calculateOverallLocationScore(distances);

    // Generate recommendations
    const recommendations = this.generateInfrastructureRecommendations(distances);

    // Determine confidence level
    const confidenceLevel = this.determineConfidenceLevel(allDistances, coordinates);

    return {
      property_id: propertyId,
      coordinates,
      distances,
      accessibility_score: accessibilityScore,
      location_premium_factor: locationPremiumFactor,
      transportation_score: transportationScore,
      convenience_score: convenientScore,
      overall_location_score: overallScore,
      recommendations,
      last_updated: new Date(),
      confidence_level: confidenceLevel
    };
  }

  /**
   * Enhance appraisal property with comprehensive location data
   */
  async enhanceAppraisalWithLocation(
    propertyId: string,
    appraisalData: ExtractedAppraisalData
  ): Promise<PropertyLocationEnhancement | null> {
    
    // First, get coordinates from appraisal address data
    const enhancement = await this.mapsService.enhanceAppraisalLocation(appraisalData);
    if (!enhancement) {
      console.warn('Failed to enhance appraisal location for property:', propertyId);
      return null;
    }

    // Analyze infrastructure
    const infrastructureAnalysis = await this.analyzePropertyInfrastructure(
      propertyId,
      enhancement.enhanced_location_data
    );

    // Generate lifestyle compatibility integration data
    const lifestyleIntegration = this.generateLifestyleCompatibilityIntegration(
      enhancement.enhanced_location_data,
      infrastructureAnalysis
    );

    // Generate property detail page enhancements
    const propertyDetailEnhancements = this.generatePropertyDetailEnhancements(infrastructureAnalysis);

    // Calculate market impact
    const marketImpact = this.calculateMarketImpact(infrastructureAnalysis, appraisalData);

    return {
      enhanced_coordinates: enhancement.enhanced_location_data,
      infrastructure_analysis: infrastructureAnalysis,
      lifestyle_compatibility_integration: lifestyleIntegration,
      property_detail_enhancements: propertyDetailEnhancements,
      market_impact: marketImpact
    };
  }

  /**
   * Update property database with enhanced location data
   */
  async updatePropertyWithLocationData(
    propertyId: string,
    locationEnhancement: PropertyLocationEnhancement,
    supabaseClient: any
  ): Promise<boolean> {
    try {
      const updateData = {
        // Core coordinates
        latitude: locationEnhancement.enhanced_coordinates.latitude,
        longitude: locationEnhancement.enhanced_coordinates.longitude,
        
        // Distance fields for property detail page
        distance_to_metro: locationEnhancement.property_detail_enhancements.distance_to_metro,
        distance_to_airport: locationEnhancement.property_detail_enhancements.distance_to_airport,
        distance_to_mall: locationEnhancement.property_detail_enhancements.distance_to_mall,
        distance_to_hospital: locationEnhancement.property_detail_enhancements.distance_to_hospital,
        
        // Quality scores
        accessibility_rating: locationEnhancement.property_detail_enhancements.accessibility_rating,
        location_quality_score: locationEnhancement.property_detail_enhancements.location_quality_score,
        
        // Enhanced address information
        formatted_address: locationEnhancement.enhanced_coordinates.formatted_address,
        neighborhood: locationEnhancement.enhanced_coordinates.address_components.neighborhood,
        
        // Market factors (for future pricing algorithms)
        location_premium_factor: locationEnhancement.infrastructure_analysis.location_premium_factor,
        transportation_score: locationEnhancement.infrastructure_analysis.transportation_score,
        
        // Metadata
        location_data_updated_at: new Date().toISOString(),
        location_confidence_level: locationEnhancement.infrastructure_analysis.confidence_level,
        
        updated_at: new Date().toISOString()
      };

      const { error } = await supabaseClient
        .from('properties')
        .update(updateData)
        .eq('id', propertyId);

      if (error) {
        console.error('Error updating property with location data:', error);
        return false;
      }

      console.log(`✅ Property ${propertyId} updated with enhanced location data`);
      return true;
    } catch (error) {
      console.error('Exception updating property location data:', error);
      return false;
    }
  }

  /**
   * Generate suggestions for lifestyle compatibility system integration
   */
  private generateLifestyleCompatibilityIntegration(
    coordinates: LocationCoordinates,
    analysis: InfrastructureAnalysisResult
  ) {
    const suggestedDestinations = [];

    // Suggest closest infrastructure points as potential user destinations
    if (analysis.distances.metro) {
      suggestedDestinations.push({
        name: analysis.distances.metro.destination.name,
        category: 'Transportation',
        coordinates: analysis.distances.metro.destination.coordinates,
        reasoning: `Closest metro station (${analysis.distances.metro.distance_text} away)`
      });
    }

    if (analysis.distances.mall) {
      suggestedDestinations.push({
        name: analysis.distances.mall.destination.name,
        category: 'Shopping',
        coordinates: analysis.distances.mall.destination.coordinates,
        reasoning: `Nearest shopping center (${analysis.distances.mall.distance_text} away)`
      });
    }

    if (analysis.distances.hospital) {
      suggestedDestinations.push({
        name: analysis.distances.hospital.destination.name,
        category: 'Healthcare',
        coordinates: analysis.distances.hospital.destination.coordinates,
        reasoning: `Closest healthcare facility (${analysis.distances.hospital.distance_text} away)`
      });
    }

    // Suggest popular destinations in Cairo based on location
    const neighborhood = coordinates.address_components.neighborhood?.toLowerCase() || '';
    if (neighborhood.includes('new cairo') || neighborhood.includes('cairo')) {
      suggestedDestinations.push({
        name: 'Cairo Downtown',
        category: 'Work',
        coordinates: { latitude: 30.0444, longitude: 31.2357 },
        reasoning: 'Major business district in Cairo'
      });
    }

    return {
      commute_analysis_ready: coordinates.latitude !== 0 && coordinates.longitude !== 0,
      suggested_user_destinations: suggestedDestinations.slice(0, 6) // Limit suggestions
    };
  }

  /**
   * Generate property detail page enhancements
   */
  private generatePropertyDetailEnhancements(analysis: InfrastructureAnalysisResult) {
    return {
      distance_to_metro: analysis.distances.metro?.distance_km || null,
      distance_to_airport: analysis.distances.airport?.distance_km || null,
      distance_to_mall: analysis.distances.mall?.distance_km || null,
      distance_to_hospital: analysis.distances.hospital?.distance_km || null,
      accessibility_rating: Math.round(analysis.accessibility_score),
      location_quality_score: Math.round(analysis.overall_location_score),
      infrastructure_summary: this.generateInfrastructureSummary(analysis)
    };
  }

  /**
   * Calculate market impact of location factors
   */
  private calculateMarketImpact(
    analysis: InfrastructureAnalysisResult,
    appraisalData: ExtractedAppraisalData
  ) {
    let locationMultiplier = 1.0;
    let accessibilityPremium = 0;
    const benefits = [];
    const drawbacks = [];

    // Metro access impact
    if (analysis.distances.metro) {
      const metroKm = analysis.distances.metro.distance_km;
      if (metroKm <= 1) {
        locationMultiplier += 0.15;
        accessibilityPremium += 0.12;
        benefits.push('Excellent metro accessibility increases property value');
      } else if (metroKm <= 3) {
        locationMultiplier += 0.08;
        accessibilityPremium += 0.06;
        benefits.push('Good metro access provides transportation convenience');
      } else if (metroKm > 10) {
        drawbacks.push('Limited public transportation access may affect resale value');
      }
    }

    // Shopping access impact
    if (analysis.distances.mall) {
      const mallKm = analysis.distances.mall.distance_km;
      if (mallKm <= 5) {
        locationMultiplier += 0.05;
        benefits.push('Convenient shopping access enhances lifestyle appeal');
      }
    }

    // Healthcare access impact
    if (analysis.distances.hospital) {
      const hospitalKm = analysis.distances.hospital.distance_km;
      if (hospitalKm <= 3) {
        locationMultiplier += 0.03;
        benefits.push('Proximity to healthcare facilities adds security value');
      }
    }

    // Airport access (different logic - not too close, not too far)
    if (analysis.distances.airport) {
      const airportKm = analysis.distances.airport.distance_km;
      if (airportKm < 10) {
        drawbacks.push('Close proximity to airport may result in noise concerns');
      } else if (airportKm > 60) {
        drawbacks.push('Distance from airport may inconvenience frequent travelers');
      } else if (airportKm <= 30) {
        benefits.push('Good airport access for business and travel needs');
        locationMultiplier += 0.02;
      }
    }

    // Cap the multiplier to reasonable limits
    locationMultiplier = Math.min(locationMultiplier, 1.25); // Max 25% increase

    return {
      location_value_multiplier: locationMultiplier,
      accessibility_premium: Math.min(accessibilityPremium, 0.20), // Max 20% premium
      infrastructure_benefits: benefits,
      potential_drawbacks: drawbacks
    };
  }

  /**
   * Calculate accessibility score (0-10)
   */
  private calculateAccessibilityScore(distances: InfrastructureAnalysisResult['distances']): number {
    let score = 0;

    // Metro accessibility (most important in Cairo)
    if (distances.metro) {
      const km = distances.metro.distance_km;
      if (km <= this.DISTANCE_THRESHOLDS.metro.excellent) score += 4;
      else if (km <= this.DISTANCE_THRESHOLDS.metro.good) score += 3;
      else if (km <= this.DISTANCE_THRESHOLDS.metro.fair) score += 2;
      else if (km <= this.DISTANCE_THRESHOLDS.metro.poor) score += 1;
    }

    // Mall accessibility
    if (distances.mall) {
      const km = distances.mall.distance_km;
      if (km <= this.DISTANCE_THRESHOLDS.mall.excellent) score += 2;
      else if (km <= this.DISTANCE_THRESHOLDS.mall.good) score += 1.5;
      else if (km <= this.DISTANCE_THRESHOLDS.mall.fair) score += 1;
      else if (km <= this.DISTANCE_THRESHOLDS.mall.poor) score += 0.5;
    }

    // Hospital accessibility
    if (distances.hospital) {
      const km = distances.hospital.distance_km;
      if (km <= this.DISTANCE_THRESHOLDS.hospital.excellent) score += 2;
      else if (km <= this.DISTANCE_THRESHOLDS.hospital.good) score += 1.5;
      else if (km <= this.DISTANCE_THRESHOLDS.hospital.fair) score += 1;
      else if (km <= this.DISTANCE_THRESHOLDS.hospital.poor) score += 0.5;
    }

    // Airport accessibility (different logic)
    if (distances.airport) {
      const km = distances.airport.distance_km;
      if (km >= 15 && km <= 35) score += 2; // Optimal range
      else if (km >= 10 && km <= 50) score += 1;
      else score += 0.5;
    }

    return Math.min(score, 10);
  }

  /**
   * Calculate location premium factor
   */
  private calculateLocationPremiumFactor(distances: InfrastructureAnalysisResult['distances']): number {
    let factor = 1.0; // Base factor

    if (distances.metro && distances.metro.distance_km <= 2) {
      factor += 0.08; // 8% premium for excellent metro access
    }

    if (distances.mall && distances.mall.distance_km <= 5) {
      factor += 0.03; // 3% premium for shopping convenience
    }

    if (distances.hospital && distances.hospital.distance_km <= 3) {
      factor += 0.02; // 2% premium for healthcare proximity
    }

    return Math.min(factor, 1.15); // Cap at 15% premium
  }

  /**
   * Calculate transportation score
   */
  private calculateTransportationScore(distances: InfrastructureAnalysisResult['distances']): number {
    let score = 5; // Base score

    if (distances.metro) {
      const km = distances.metro.distance_km;
      if (km <= 1) score += 3;
      else if (km <= 3) score += 2;
      else if (km <= 5) score += 1;
    }

    if (distances.airport) {
      const km = distances.airport.distance_km;
      if (km >= 15 && km <= 35) score += 2;
      else if (km >= 10 && km <= 50) score += 1;
    }

    return Math.min(score, 10);
  }

  /**
   * Calculate convenience score
   */
  private calculateConvenienceScore(distances: InfrastructureAnalysisResult['distances']): number {
    let score = 5; // Base score

    if (distances.mall && distances.mall.distance_km <= 7) score += 2;
    if (distances.hospital && distances.hospital.distance_km <= 5) score += 2;
    
    // Bonus for having all amenities within reasonable distance
    const hasAllAmenities = distances.metro && distances.mall && distances.hospital &&
                           distances.metro.distance_km <= 5 && 
                           distances.mall.distance_km <= 10 && 
                           distances.hospital.distance_km <= 8;
    
    if (hasAllAmenities) score += 1;

    return Math.min(score, 10);
  }

  /**
   * Calculate overall location score
   */
  private calculateOverallLocationScore(distances: InfrastructureAnalysisResult['distances']): number {
    let weightedScore = 0;

    // Metro access weight
    if (distances.metro) {
      const metroScore = this.getDistanceScore(distances.metro.distance_km, 'metro');
      weightedScore += metroScore * this.SCORING_WEIGHTS.metro_access;
    }

    // Mall access weight
    if (distances.mall) {
      const mallScore = this.getDistanceScore(distances.mall.distance_km, 'mall');
      weightedScore += mallScore * this.SCORING_WEIGHTS.mall_access;
    }

    // Hospital access weight
    if (distances.hospital) {
      const hospitalScore = this.getDistanceScore(distances.hospital.distance_km, 'hospital');
      weightedScore += hospitalScore * this.SCORING_WEIGHTS.hospital_access;
    }

    // Airport access weight
    if (distances.airport) {
      const airportScore = this.getDistanceScore(distances.airport.distance_km, 'airport');
      weightedScore += airportScore * this.SCORING_WEIGHTS.airport_access;
    }

    return Math.round(weightedScore * 10); // Scale to 0-10
  }

  private getDistanceScore(distance: number, type: keyof typeof this.DISTANCE_THRESHOLDS): number {
    const thresholds = this.DISTANCE_THRESHOLDS[type];
    
    if (type === 'airport') {
      // Airport has different logic - optimal range scoring
      if (distance >= 15 && distance <= 35) return 1.0;
      if (distance >= 10 && distance <= 50) return 0.7;
      if (distance >= 5 && distance <= 60) return 0.5;
      return 0.3;
    } else {
      // Standard distance scoring for other infrastructure
      if (distance <= thresholds.excellent) return 1.0;
      if (distance <= thresholds.good) return 0.7;
      if (distance <= thresholds.fair) return 0.5;
      if (distance <= thresholds.poor) return 0.3;
      return 0.1;
    }
  }

  private generateInfrastructureRecommendations(distances: InfrastructureAnalysisResult['distances']): string[] {
    const recommendations = [];

    if (distances.metro) {
      const km = distances.metro.distance_km;
      if (km <= 1) {
        recommendations.push('Excellent metro access - significant value driver for the property');
      } else if (km <= 3) {
        recommendations.push('Good public transportation access enhances daily convenience');
      } else if (km > 10) {
        recommendations.push('Consider alternative transportation options due to limited metro access');
      }
    }

    if (distances.mall) {
      const km = distances.mall.distance_km;
      if (km <= 5) {
        recommendations.push('Convenient shopping and entertainment options within easy reach');
      }
    }

    if (distances.hospital) {
      const km = distances.hospital.distance_km;
      if (km <= 3) {
        recommendations.push('Close healthcare access provides peace of mind for families');
      }
    }

    if (distances.airport) {
      const km = distances.airport.distance_km;
      if (km >= 15 && km <= 35) {
        recommendations.push('Optimal airport distance - convenient access without noise concerns');
      } else if (km < 10) {
        recommendations.push('Airport proximity may affect noise levels - consider sound insulation');
      }
    }

    return recommendations;
  }

  private generateInfrastructureSummary(analysis: InfrastructureAnalysisResult): string {
    const components = [];

    if (analysis.distances.metro) {
      components.push(`Metro: ${analysis.distances.metro.distance_text}`);
    }
    if (analysis.distances.mall) {
      components.push(`Shopping: ${analysis.distances.mall.distance_text}`);
    }
    if (analysis.distances.hospital) {
      components.push(`Healthcare: ${analysis.distances.hospital.distance_text}`);
    }
    if (analysis.distances.airport) {
      components.push(`Airport: ${analysis.distances.airport.distance_text}`);
    }

    const qualityRating = analysis.overall_location_score >= 8 ? 'Excellent' : 
                         analysis.overall_location_score >= 6 ? 'Good' : 
                         analysis.overall_location_score >= 4 ? 'Fair' : 'Limited';

    return `${qualityRating} infrastructure access. ${components.join(', ')}.`;
  }

  private determineConfidenceLevel(
    allDistances: DistanceCalculation[], 
    coordinates: LocationCoordinates
  ): 'high' | 'medium' | 'low' {
    if (coordinates.confidence_score >= 80 && allDistances.length >= 3) {
      return 'high';
    } else if (coordinates.confidence_score >= 60 && allDistances.length >= 2) {
      return 'medium';
    } else {
      return 'low';
    }
  }
}

/**
 * Utility function for immediate use in API routes
 */
export async function calculatePropertyInfrastructureDistances(
  propertyId: string,
  coordinates: LocationCoordinates,
  googleMapsApiKey?: string
): Promise<InfrastructureAnalysisResult> {
  const calculator = new InfrastructureDistanceCalculator(googleMapsApiKey);
  return await calculator.analyzePropertyInfrastructure(propertyId, coordinates);
}

/**
 * Utility function to enhance property from appraisal data
 */
export async function enhancePropertyFromAppraisal(
  propertyId: string,
  appraisalData: ExtractedAppraisalData,
  googleMapsApiKey?: string
): Promise<PropertyLocationEnhancement | null> {
  const calculator = new InfrastructureDistanceCalculator(googleMapsApiKey);
  return await calculator.enhanceAppraisalWithLocation(propertyId, appraisalData);
}