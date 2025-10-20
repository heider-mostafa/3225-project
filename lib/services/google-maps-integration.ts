/**
 * Google Maps API Integration Service
 * Handles geocoding, distance calculations, and location intelligence
 * for Egyptian real estate properties and appraisals
 */

import { ExtractedAppraisalData } from './appraisal-data-mapper';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  formatted_address: string;
  place_id?: string;
  address_components: {
    street_number?: string;
    route?: string;
    neighborhood?: string;
    locality?: string; // City
    administrative_area_level_1?: string; // Governorate
    country?: string;
    postal_code?: string;
  };
  location_type: 'ROOFTOP' | 'RANGE_INTERPOLATED' | 'GEOMETRIC_CENTER' | 'APPROXIMATE';
  confidence_score: number;
}

export interface InfrastructurePoint {
  id: string;
  name: string;
  type: 'metro' | 'airport' | 'mall' | 'hospital' | 'school' | 'university' | 'bank';
  coordinates: {
    latitude: number;
    longitude: number;
  };
  city: string;
  governorate: string;
  is_active: boolean;
}

export interface DistanceCalculation {
  destination: InfrastructurePoint;
  distance_km: number;
  distance_text: string;
  duration_minutes: number;
  duration_text: string;
  travel_mode: 'driving' | 'walking' | 'transit' | 'bicycling';
  route_polyline?: string;
}

export interface LocationIntelligenceResult {
  property_coordinates: LocationCoordinates;
  infrastructure_distances: DistanceCalculation[];
  location_score: number;
  accessibility_rating: number;
  neighborhood_insights: {
    population_density: 'high' | 'medium' | 'low';
    commercial_activity: 'high' | 'medium' | 'low';
    residential_quality: 'premium' | 'good' | 'average' | 'developing';
    transportation_access: number; // 1-10 scale
  };
  generated_at: Date;
  api_usage_count: number;
}

export interface AppraisalLocationEnhancement {
  original_address: string;
  enhanced_location_data: LocationCoordinates;
  infrastructure_analysis: DistanceCalculation[];
  market_location_factors: {
    proximity_score: number;
    accessibility_premium: number;
    infrastructure_value_add: number;
  };
  recommendations: string[];
}

export class GoogleMapsIntegrationService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api';
  private cacheService: Map<string, any> = new Map(); // In production, use Redis or similar
  
  // Egyptian infrastructure reference points
  private readonly EGYPTIAN_INFRASTRUCTURE: InfrastructurePoint[] = [
    // Cairo Metro Stations (Major)
    { id: 'metro_sadat', name: 'Sadat Metro Station', type: 'metro', coordinates: { latitude: 30.0444, longitude: 31.2357 }, city: 'Cairo', governorate: 'Cairo', is_active: true },
    { id: 'metro_nasser', name: 'Nasser Metro Station', type: 'metro', coordinates: { latitude: 30.0536, longitude: 31.2384 }, city: 'Cairo', governorate: 'Cairo', is_active: true },
    { id: 'metro_new_cairo', name: 'New Cairo Metro (Future)', type: 'metro', coordinates: { latitude: 30.0254, longitude: 31.4815 }, city: 'New Cairo', governorate: 'Cairo', is_active: false },
    
    // Airports
    { id: 'airport_cairo', name: 'Cairo International Airport', type: 'airport', coordinates: { latitude: 30.1219, longitude: 31.4056 }, city: 'Cairo', governorate: 'Cairo', is_active: true },
    
    // Major Malls
    { id: 'mall_city_center', name: 'City Center Almaza', type: 'mall', coordinates: { latitude: 30.0881, longitude: 31.3439 }, city: 'Cairo', governorate: 'Cairo', is_active: true },
    { id: 'mall_cairo_festival', name: 'Cairo Festival City Mall', type: 'mall', coordinates: { latitude: 30.0254, longitude: 31.4015 }, city: 'New Cairo', governorate: 'Cairo', is_active: true },
    { id: 'mall_mall_of_egypt', name: 'Mall of Egypt', type: 'mall', coordinates: { latitude: 30.0038, longitude: 31.0179 }, city: '6th of October', governorate: 'Giza', is_active: true },
    { id: 'mall_galleria40', name: 'Galleria40', type: 'mall', coordinates: { latitude: 30.0927, longitude: 31.3489 }, city: 'Cairo', governorate: 'Cairo', is_active: true },
    
    // Major Hospitals
    { id: 'hospital_kasr_alainy', name: 'Kasr Al Ainy Hospital', type: 'hospital', coordinates: { latitude: 30.0315, longitude: 31.2318 }, city: 'Cairo', governorate: 'Cairo', is_active: true },
    { id: 'hospital_nile_badrawi', name: 'Nile Badrawi Hospital', type: 'hospital', coordinates: { latitude: 30.0927, longitude: 31.3249 }, city: 'Cairo', governorate: 'Cairo', is_active: true },
    { id: 'hospital_57357', name: 'Hospital 57357', type: 'hospital', coordinates: { latitude: 30.0275, longitude: 31.2084 }, city: 'Cairo', governorate: 'Cairo', is_active: true },
    { id: 'hospital_air_force', name: 'Air Force Hospital', type: 'hospital', coordinates: { latitude: 30.1043, longitude: 31.3544 }, city: 'Cairo', governorate: 'Cairo', is_active: true },
  ];

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    if (!this.apiKey) {
      console.warn('Google Maps API key not provided. Location services will be limited.');
    }
    console.log('🔑 Google Maps API key status:', this.apiKey ? 'Available' : 'Missing');
  }

  /**
   * Geocode an address and get precise coordinates
   */
  async geocodeAddress(
    address: string,
    language: 'ar' | 'en' = 'en',
    region: string = 'EG'
  ): Promise<LocationCoordinates | null> {
    const cacheKey = `geocode_${address}_${language}_${region}`;
    
    // Check cache first
    if (this.cacheService.has(cacheKey)) {
      return this.cacheService.get(cacheKey);
    }

    try {
      const params = new URLSearchParams({
        address: address,
        key: this.apiKey,
        language: language,
        region: region,
        components: 'country:EG' // Restrict to Egypt
      });

      const response = await fetch(`${this.baseUrl}/geocode/json?${params}`);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        
        // Parse address components
        const addressComponents: LocationCoordinates['address_components'] = {};
        result.address_components.forEach((component: any) => {
          const types = component.types;
          if (types.includes('street_number')) {
            addressComponents.street_number = component.long_name;
          } else if (types.includes('route')) {
            addressComponents.route = component.long_name;
          } else if (types.includes('neighborhood') || types.includes('sublocality')) {
            addressComponents.neighborhood = component.long_name;
          } else if (types.includes('locality')) {
            addressComponents.locality = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            addressComponents.administrative_area_level_1 = component.long_name;
          } else if (types.includes('country')) {
            addressComponents.country = component.long_name;
          } else if (types.includes('postal_code')) {
            addressComponents.postal_code = component.long_name;
          }
        });

        // Calculate confidence score based on location type and address match
        const confidenceScore = this.calculateGeocodingConfidence(
          result.geometry.location_type,
          result.formatted_address,
          address
        );

        const locationData: LocationCoordinates = {
          latitude: location.lat,
          longitude: location.lng,
          formatted_address: result.formatted_address,
          place_id: result.place_id,
          address_components: addressComponents,
          location_type: result.geometry.location_type,
          confidence_score: confidenceScore
        };

        // Cache the result for 24 hours
        this.cacheService.set(cacheKey, locationData);
        setTimeout(() => this.cacheService.delete(cacheKey), 24 * 60 * 60 * 1000);

        return locationData;
      }

      console.warn(`Geocoding failed for address: ${address}`, data);
      return null;

    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Calculate distances to multiple infrastructure points
   */
  async calculateInfrastructureDistances(
    origin: LocationCoordinates,
    infrastructureTypes: ('metro' | 'airport' | 'mall' | 'hospital')[] = ['metro', 'airport', 'mall', 'hospital']
  ): Promise<DistanceCalculation[]> {
    const targetInfrastructure = this.EGYPTIAN_INFRASTRUCTURE.filter(
      point => infrastructureTypes.includes(point.type as any) && point.is_active
    );

    const distances: DistanceCalculation[] = [];

    // Group destinations for batch distance calculation
    const destinations = targetInfrastructure.map(point => 
      `${point.coordinates.latitude},${point.coordinates.longitude}`
    ).join('|');

    try {
      if (!this.apiKey) {
        console.warn('🚫 Cannot calculate distances - Google Maps API key missing, using fallback calculation');
        return this.calculateDistancesFallback(origin, targetInfrastructure);
      }

      // Use new Routes API (2025) instead of legacy Distance Matrix API
      console.log('🗺️ Using Routes API (2025) with', targetInfrastructure.length, 'destinations');
      
      const requestBody = {
        origins: [
          {
            waypoint: {
              location: {
                latLng: {
                  latitude: origin.latitude,
                  longitude: origin.longitude
                }
              }
            }
          }
        ],
        destinations: targetInfrastructure.map(point => ({
          waypoint: {
            location: {
              latLng: {
                latitude: point.coordinates.latitude,
                longitude: point.coordinates.longitude
              }
            }
          }
        })),
        travelMode: 'DRIVE',
        routingPreference: 'TRAFFIC_AWARE',
        units: 'METRIC'
      };

      const response = await fetch(`https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': 'originIndex,destinationIndex,duration,distanceMeters,status'
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      console.log('📊 Routes API response received');

      if (response.ok && data) {
        const elements = data || [];
        console.log('🎯 Processing', elements.length, 'route calculations');

        elements.forEach((element: any, index: number) => {
          if (element.status === 'OK' && element.distanceMeters && element.duration) {
            const infrastructure = targetInfrastructure[element.destinationIndex || index];
            if (infrastructure) {
              const distanceKm = Math.round((element.distanceMeters / 1000) * 100) / 100;
              const durationSeconds = parseInt(element.duration.replace('s', ''));
              const durationMinutes = Math.round(durationSeconds / 60);
              
              distances.push({
                destination: infrastructure,
                distance_km: distanceKm,
                distance_text: `${distanceKm} km`,
                duration_minutes: durationMinutes,
                duration_text: durationMinutes < 60 
                  ? `${durationMinutes} mins`
                  : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
                travel_mode: 'driving'
              });
              
              console.log(`  ✅ ${infrastructure.type}: ${infrastructure.name} - ${distanceKm}km (${durationMinutes}min)`);
            }
          } else {
            console.log(`  ❌ Route ${index}: ${element.status || 'Failed'}`);
          }
        });
      } else {
        console.warn('🚫 Routes API failed, falling back to direct distance calculation');
        if (data.error) {
          console.error('❌ Routes API error:', data.error);
        }
        return this.calculateDistancesFallback(origin, targetInfrastructure);
      }

      // Sort by distance and take closest of each type
      const closestByType = this.getClosestByType(distances);
      console.log('🏆 Closest infrastructure points (Routes API):', closestByType.map(d => `${d.destination.type}: ${d.distance_km}km`));
      return closestByType;

    } catch (error) {
      console.error('❌ Routes API calculation error:', error);
      console.log('🔄 Falling back to direct distance calculation');
      return this.calculateDistancesFallback(origin, targetInfrastructure);
    }
  }

  /**
   * Fallback distance calculation using Haversine formula
   * Used when Google Routes/Distance Matrix API is not available
   */
  private calculateDistancesFallback(
    origin: LocationCoordinates,
    targetInfrastructure: InfrastructurePoint[]
  ): DistanceCalculation[] {
    console.log('📐 Using Haversine formula for distance calculation');
    const distances: DistanceCalculation[] = [];

    targetInfrastructure.forEach(infrastructure => {
      const distanceKm = this.calculateHaversineDistance(
        origin.latitude,
        origin.longitude,
        infrastructure.coordinates.latitude,
        infrastructure.coordinates.longitude
      );

      // Estimate driving time (rough approximation: avg 30km/h in Cairo traffic)
      const estimatedDurationMinutes = Math.round((distanceKm / 30) * 60);

      distances.push({
        destination: infrastructure,
        distance_km: Math.round(distanceKm * 100) / 100,
        distance_text: `${Math.round(distanceKm * 10) / 10} km`,
        duration_minutes: estimatedDurationMinutes,
        duration_text: estimatedDurationMinutes < 60 
          ? `${estimatedDurationMinutes} mins`
          : `${Math.round(estimatedDurationMinutes / 60)}h ${estimatedDurationMinutes % 60}m`,
        travel_mode: 'driving'
      });

      console.log(`  📏 ${infrastructure.type}: ${infrastructure.name} - ${Math.round(distanceKm * 10) / 10}km (direct)`);
    });

    // Sort by distance and take closest of each type
    const closestByType = this.getClosestByType(distances);
    console.log('🎯 Closest infrastructure (fallback):', closestByType.map(d => `${d.destination.type}: ${d.distance_km}km`));
    return closestByType;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Enhanced location intelligence for appraisal data
   */
  async enhanceAppraisalLocation(
    appraisalData: ExtractedAppraisalData
  ): Promise<AppraisalLocationEnhancement | null> {
    // Try different address combinations
    const addresses = this.buildAddressCombinations(appraisalData);
    
    let bestGeocoding: LocationCoordinates | null = null;
    let bestAddress = '';

    // Try each address combination until we get a good result
    for (const address of addresses) {
      const geocoding = await this.geocodeAddress(address.full, address.language);
      if (geocoding && geocoding.confidence_score > 70) {
        bestGeocoding = geocoding;
        bestAddress = address.original;
        break;
      }
      if (geocoding && (!bestGeocoding || geocoding.confidence_score > bestGeocoding.confidence_score)) {
        bestGeocoding = geocoding;
        bestAddress = address.original;
      }
    }

    if (!bestGeocoding) {
      console.warn('Failed to geocode any address variation for appraisal');
      return null;
    }

    // Calculate infrastructure distances
    const infrastructureAnalysis = await this.calculateInfrastructureDistances(bestGeocoding);

    // Calculate market factors
    const marketFactors = this.calculateMarketLocationFactors(infrastructureAnalysis, appraisalData);

    // Generate recommendations
    const recommendations = this.generateLocationRecommendations(infrastructureAnalysis, marketFactors);

    return {
      original_address: bestAddress,
      enhanced_location_data: bestGeocoding,
      infrastructure_analysis: infrastructureAnalysis,
      market_location_factors: marketFactors,
      recommendations: recommendations
    };
  }

  /**
   * Generate comprehensive location intelligence report
   */
  async generateLocationIntelligence(
    coordinates: LocationCoordinates
  ): Promise<LocationIntelligenceResult> {
    const infrastructureDistances = await this.calculateInfrastructureDistances(coordinates);
    
    const locationScore = this.calculateLocationScore(infrastructureDistances);
    const accessibilityRating = this.calculateAccessibilityRating(infrastructureDistances);
    const neighborhoodInsights = await this.analyzeNeighborhood(coordinates);

    return {
      property_coordinates: coordinates,
      infrastructure_distances: infrastructureDistances,
      location_score: locationScore,
      accessibility_rating: accessibilityRating,
      neighborhood_insights: neighborhoodInsights,
      generated_at: new Date(),
      api_usage_count: infrastructureDistances.length + 1 // Geocoding + distance matrix calls
    };
  }

  private buildAddressCombinations(data: ExtractedAppraisalData): Array<{full: string, language: 'ar' | 'en', original: string}> {
    const combinations = [];
    
    // Arabic address combinations
    if (data.property_address_arabic) {
      combinations.push({
        full: `${data.property_address_arabic}, ${data.city_name || ''}, ${data.governorate || 'القاهرة'}, مصر`,
        language: 'ar' as const,
        original: data.property_address_arabic
      });
      
      combinations.push({
        full: `${data.property_address_arabic}, ${data.district_name || ''}, ${data.city_name || ''}`,
        language: 'ar' as const,
        original: data.property_address_arabic
      });
    }

    // English address combinations
    if (data.property_address_english) {
      combinations.push({
        full: `${data.property_address_english}, ${data.city_name || ''}, ${data.governorate || 'Cairo'}, Egypt`,
        language: 'en' as const,
        original: data.property_address_english
      });
      
      combinations.push({
        full: `${data.property_address_english}, ${data.district_name || ''}, ${data.city_name || ''}`,
        language: 'en' as const,
        original: data.property_address_english
      });
    }

    // Building-specific combinations
    if (data.building_number && data.district_name) {
      const buildingAddress = `${data.building_number}, ${data.district_name}, ${data.city_name || 'Cairo'}, Egypt`;
      combinations.push({
        full: buildingAddress,
        language: 'en' as const,
        original: buildingAddress
      });
    }

    return combinations;
  }

  private calculateGeocodingConfidence(locationType: string, formattedAddress: string, originalAddress: string): number {
    let score = 0;

    // Location type scoring
    switch (locationType) {
      case 'ROOFTOP': score += 40; break;
      case 'RANGE_INTERPOLATED': score += 30; break;
      case 'GEOMETRIC_CENTER': score += 20; break;
      case 'APPROXIMATE': score += 10; break;
    }

    // Address match scoring
    const originalLower = originalAddress.toLowerCase();
    const formattedLower = formattedAddress.toLowerCase();
    
    // Check for key components in both addresses
    let matchScore = 0;
    const originalWords = originalLower.split(/[\s,]+/).filter(word => word.length > 2);
    
    originalWords.forEach(word => {
      if (formattedLower.includes(word)) {
        matchScore += 3;
      }
    });

    score += Math.min(matchScore, 40); // Cap at 40 points for address matching
    
    // Country verification (should be Egypt)
    if (formattedLower.includes('egypt') || formattedLower.includes('مصر')) {
      score += 20;
    }

    return Math.min(score, 100);
  }

  private getClosestByType(distances: DistanceCalculation[]): DistanceCalculation[] {
    const byType = new Map<string, DistanceCalculation>();
    
    distances.forEach(distance => {
      const type = distance.destination.type;
      if (!byType.has(type) || distance.distance_km < byType.get(type)!.distance_km) {
        byType.set(type, distance);
      }
    });

    return Array.from(byType.values());
  }

  private calculateMarketLocationFactors(
    distances: DistanceCalculation[], 
    appraisalData: ExtractedAppraisalData
  ) {
    let proximityScore = 0;
    let accessibilityPremium = 0;
    let infrastructureValueAdd = 0;

    distances.forEach(distance => {
      const km = distance.distance_km;
      
      switch (distance.destination.type) {
        case 'metro':
          if (km <= 1) proximityScore += 25;
          else if (km <= 3) proximityScore += 15;
          else if (km <= 5) proximityScore += 5;
          
          if (km <= 2) accessibilityPremium += 0.15; // 15% premium
          break;
          
        case 'mall':
          if (km <= 5) proximityScore += 15;
          else if (km <= 10) proximityScore += 5;
          
          if (km <= 3) infrastructureValueAdd += 0.10;
          break;
          
        case 'hospital':
          if (km <= 3) proximityScore += 10;
          else if (km <= 7) proximityScore += 5;
          break;
          
        case 'airport':
          if (km >= 10 && km <= 30) proximityScore += 10; // Not too close, not too far
          break;
      }
    });

    return {
      proximity_score: Math.min(proximityScore, 100),
      accessibility_premium: Math.min(accessibilityPremium, 0.30), // Max 30% premium
      infrastructure_value_add: Math.min(infrastructureValueAdd, 0.25) // Max 25% value add
    };
  }

  private calculateLocationScore(distances: DistanceCalculation[]): number {
    let score = 50; // Base score
    
    distances.forEach(distance => {
      const km = distance.distance_km;
      
      switch (distance.destination.type) {
        case 'metro':
          if (km <= 1) score += 20;
          else if (km <= 3) score += 10;
          else if (km <= 5) score += 5;
          break;
        case 'mall':
          if (km <= 5) score += 15;
          else if (km <= 10) score += 5;
          break;
        case 'hospital':
          if (km <= 3) score += 10;
          else if (km <= 7) score += 5;
          break;
        case 'airport':
          if (km >= 10 && km <= 30) score += 5;
          break;
      }
    });

    return Math.min(score, 100);
  }

  private calculateAccessibilityRating(distances: DistanceCalculation[]): number {
    const metroDistance = distances.find(d => d.destination.type === 'metro');
    const mallDistance = distances.find(d => d.destination.type === 'mall');
    
    let rating = 5; // Base rating
    
    if (metroDistance) {
      if (metroDistance.distance_km <= 1) rating += 3;
      else if (metroDistance.distance_km <= 3) rating += 2;
      else if (metroDistance.distance_km <= 5) rating += 1;
    }
    
    if (mallDistance && mallDistance.distance_km <= 5) {
      rating += 2;
    }
    
    return Math.min(rating, 10);
  }

  private async analyzeNeighborhood(coordinates: LocationCoordinates) {
    // This would typically call additional Google Places API
    // For now, return intelligent defaults based on known Cairo areas
    const neighborhood = coordinates.address_components.neighborhood?.toLowerCase() || '';
    
    let insights: {
      population_density: 'high' | 'medium' | 'low';
      commercial_activity: 'high' | 'medium' | 'low';
      residential_quality: 'premium' | 'good' | 'average' | 'developing';
      transportation_access: number;
    } = {
      population_density: 'medium',
      commercial_activity: 'medium',
      residential_quality: 'good',
      transportation_access: 6
    };

    // Enhance based on known Egyptian neighborhoods
    if (neighborhood.includes('zamalek') || neighborhood.includes('maadi') || neighborhood.includes('new cairo')) {
      insights = {
        population_density: 'medium',
        commercial_activity: 'high',
        residential_quality: 'premium',
        transportation_access: 8
      };
    } else if (neighborhood.includes('downtown') || neighborhood.includes('heliopolis')) {
      insights = {
        population_density: 'high',
        commercial_activity: 'high',
        residential_quality: 'good',
        transportation_access: 9
      };
    }

    return insights;
  }

  private generateLocationRecommendations(
    distances: DistanceCalculation[], 
    marketFactors: any
  ): string[] {
    const recommendations = [];
    
    const metroDistance = distances.find(d => d.destination.type === 'metro');
    const mallDistance = distances.find(d => d.destination.type === 'mall');
    const hospitalDistance = distances.find(d => d.destination.type === 'hospital');
    
    if (metroDistance && metroDistance.distance_km <= 2) {
      recommendations.push('Excellent public transportation access enhances property value');
    }
    
    if (mallDistance && mallDistance.distance_km <= 5) {
      recommendations.push('Convenient shopping and entertainment options nearby');
    }
    
    if (hospitalDistance && hospitalDistance.distance_km <= 3) {
      recommendations.push('Close proximity to healthcare facilities is a strong selling point');
    }
    
    if (marketFactors.accessibility_premium > 0.1) {
      recommendations.push(`Location commands ${Math.round(marketFactors.accessibility_premium * 100)}% premium due to accessibility`);
    }
    
    return recommendations;
  }

  /**
   * Get cached results to minimize API usage
   */
  getCachedResult(key: string): any {
    return this.cacheService.get(key);
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cacheService.clear();
  }
}

/**
 * Utility functions for direct use
 */
export async function geocodeAppraisalAddress(
  appraisalData: ExtractedAppraisalData,
  apiKey?: string
): Promise<LocationCoordinates | null> {
  const service = new GoogleMapsIntegrationService(apiKey);
  const enhancement = await service.enhanceAppraisalLocation(appraisalData);
  return enhancement?.enhanced_location_data || null;
}

export async function calculatePropertyDistances(
  coordinates: LocationCoordinates,
  apiKey?: string
): Promise<DistanceCalculation[]> {
  const service = new GoogleMapsIntegrationService(apiKey);
  return await service.calculateInfrastructureDistances(coordinates);
}