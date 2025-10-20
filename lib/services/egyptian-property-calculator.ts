/**
 * Egyptian Property Calculator
 * Implements Egyptian real estate valuation formulas and standards
 * Based on Arabic PDF analysis and Egyptian market practices
 */

import { roundPricePerSqm } from '@/lib/utils/price-rounding';

interface PropertyData {
  built_area_sqm: number;
  land_area_sqm: number;
  building_age_years: number;
  overall_condition_rating: number; // 1-10 scale
  property_type: 'residential' | 'commercial' | 'villa' | 'apartment';
  district_name: string;
  finishing_level: 'core_shell' | 'semi_finished' | 'fully_finished' | 'luxury';
  construction_type: 'concrete' | 'brick' | 'steel' | 'mixed';
  neighborhood_quality_rating: number; // 1-10 scale
}

interface MarketData {
  district_name: string;
  average_price_per_sqm: number;
  market_trend: 'rising' | 'stable' | 'declining';
  demand_supply_ratio: number;
  location_multiplier: number;
}

interface CalculationFormula {
  formula_name: string;
  formula_type: 'depreciation' | 'market_adjustment' | 'location_factor';
  base_rate: number;
  age_factor: number;
  condition_multipliers: Record<string, number>;
  location_adjustments: Record<string, number>;
}

interface ValuationResult {
  land_value: number;
  building_value: number;
  depreciation_amount: number;
  depreciation_percentage: number;
  replacement_cost: number;
  market_value_estimate: number;
  price_per_sqm: number;
  confidence_level: number; // 0-100%
  calculation_breakdown: {
    base_building_cost: number;
    age_depreciation: number;
    condition_adjustment: number;
    location_adjustment: number;
    market_adjustment: number;
  };
}

export class EgyptianPropertyCalculator {
  private formulas: Map<string, CalculationFormula> = new Map();
  private marketData: Map<string, MarketData> = new Map();

  constructor() {
    this.initializeFormulas();
  }

  /**
   * Calculate property value using Egyptian valuation standards
   */
  async calculatePropertyValue(propertyData: PropertyData): Promise<ValuationResult> {
    // Get market data for the district
    const marketData = await this.getMarketData(propertyData.district_name);
    
    // Calculate base building cost
    const baseBuildingCost = this.calculateBaseBuildingCost(propertyData);
    
    // Calculate depreciation
    const depreciation = this.calculateDepreciation(
      propertyData.building_age_years,
      propertyData.overall_condition_rating,
      propertyData.property_type
    );
    
    // Calculate adjustments
    const locationAdjustment = this.calculateLocationAdjustment(
      propertyData.district_name,
      propertyData.neighborhood_quality_rating
    );
    
    const marketAdjustment = this.calculateMarketAdjustment(marketData);
    
    // Calculate land value
    const landValue = this.calculateLandValue(
      propertyData.land_area_sqm,
      propertyData.district_name,
      marketData
    );
    
    // Calculate building value after depreciation
    const depreciatedBuildingValue = baseBuildingCost * (1 - depreciation);
    
    // Apply adjustments
    const adjustedBuildingValue = depreciatedBuildingValue * 
      (1 + locationAdjustment) * (1 + marketAdjustment);
    
    // Calculate final market value
    const marketValueEstimate = landValue + adjustedBuildingValue;
    
    // Calculate replacement cost (new construction cost)
    const replacementCost = baseBuildingCost * 1.15; // 15% markup for current construction
    
    return {
      land_value: Math.round(landValue),
      building_value: Math.round(adjustedBuildingValue),
      depreciation_amount: Math.round(baseBuildingCost * depreciation),
      depreciation_percentage: Math.round(depreciation * 100 * 100) / 100,
      replacement_cost: Math.round(replacementCost),
      market_value_estimate: Math.round(marketValueEstimate),
      price_per_sqm: roundPricePerSqm(marketValueEstimate / propertyData.built_area_sqm) || 0,
      confidence_level: this.calculateConfidenceLevel(propertyData, marketData),
      calculation_breakdown: {
        base_building_cost: Math.round(baseBuildingCost),
        age_depreciation: Math.round(baseBuildingCost * depreciation),
        condition_adjustment: Math.round(baseBuildingCost * this.getConditionAdjustment(propertyData.overall_condition_rating)),
        location_adjustment: Math.round(baseBuildingCost * locationAdjustment),
        market_adjustment: Math.round(baseBuildingCost * marketAdjustment)
      }
    };
  }

  /**
   * Calculate depreciation based on Egyptian standards
   */
  private calculateDepreciation(age: number, condition: number, propertyType: string): number {
    const formula = this.getFormula('depreciation', propertyType);
    if (!formula) {
      // Fallback to default Egyptian depreciation
      const baseDepreciation = Math.min(age * 0.02, 0.6); // 2% per year, max 60%
      const conditionAdjustment = (10 - condition) * 0.01;
      return Math.min(baseDepreciation + conditionAdjustment, 0.6);
    }

    // Use formula from database
    const baseDepreciation = Math.min(age * formula.age_factor, 0.6);
    const conditionKey = this.getConditionKey(condition);
    const conditionMultiplier = formula.condition_multipliers[conditionKey] || 1.0;
    
    return Math.min(baseDepreciation * conditionMultiplier, 0.6);
  }

  /**
   * Calculate base building cost per square meter
   */
  private calculateBaseBuildingCost(propertyData: PropertyData): number {
    // Base construction costs per sqm in EGP (2024 prices)
    const baseCosts = {
      core_shell: 3500,
      semi_finished: 5500,
      fully_finished: 7500,
      luxury: 12000
    };

    const baseRate = baseCosts[propertyData.finishing_level] || baseCosts.fully_finished;
    
    // Property type multipliers
    const typeMultipliers = {
      villa: 1.2,
      residential: 1.0,
      apartment: 0.9,
      commercial: 1.3
    };

    const typeMultiplier = typeMultipliers[propertyData.property_type] || 1.0;
    
    // Construction type adjustments
    const constructionAdjustments = {
      concrete: 1.0,
      brick: 0.85,
      steel: 1.15,
      mixed: 0.95
    };

    const constructionMultiplier = constructionAdjustments[propertyData.construction_type] || 1.0;
    
    return propertyData.built_area_sqm * baseRate * typeMultiplier * constructionMultiplier;
  }

  /**
   * Calculate land value based on district market data
   */
  private calculateLandValue(landArea: number, district: string, marketData: MarketData): number {
    if (!landArea) return 0;
    
    // Land typically represents 30-40% of total property value in Egypt
    const landPricePerSqm = roundPricePerSqm(marketData.average_price_per_sqm * 0.35);
    return landArea * landPricePerSqm * marketData.location_multiplier;
  }

  /**
   * Calculate location adjustment based on district and neighborhood quality
   */
  private calculateLocationAdjustment(district: string, neighborhoodRating: number): number {
    const formula = this.getFormula('location_factor', 'residential');
    const districtAdjustment = formula?.location_adjustments[district.toLowerCase()] || 1.0;
    
    // Neighborhood quality adjustment (-20% to +30%)
    const neighborhoodAdjustment = (neighborhoodRating - 5) * 0.05;
    
    return (districtAdjustment - 1.0) + neighborhoodAdjustment;
  }

  /**
   * Calculate market trend adjustment
   */
  private calculateMarketAdjustment(marketData: MarketData): number {
    const trendAdjustments = {
      rising: 0.1,   // 10% positive adjustment
      stable: 0.0,   // No adjustment
      declining: -0.05 // 5% negative adjustment
    };
    
    const baseAdjustment = trendAdjustments[marketData.market_trend] || 0;
    
    // Demand-supply ratio adjustment
    const demandAdjustment = (marketData.demand_supply_ratio - 1.0) * 0.1;
    
    return baseAdjustment + demandAdjustment;
  }

  /**
   * Calculate confidence level based on data completeness and market conditions
   */
  private calculateConfidenceLevel(propertyData: PropertyData, marketData: MarketData): number {
    let confidence = 100;
    
    // Reduce confidence for missing data
    if (!propertyData.land_area_sqm) confidence -= 10;
    if (!propertyData.neighborhood_quality_rating) confidence -= 5;
    if (propertyData.building_age_years > 30) confidence -= 10;
    if (propertyData.overall_condition_rating < 4) confidence -= 15;
    
    // Market data quality
    if (!marketData || marketData.demand_supply_ratio < 0.5) confidence -= 10;
    if (marketData.market_trend === 'declining') confidence -= 5;
    
    return Math.max(confidence, 60); // Minimum 60% confidence
  }

  /**
   * Get condition adjustment multiplier
   */
  private getConditionAdjustment(conditionRating: number): number {
    if (conditionRating >= 9) return 0.1;   // Excellent: +10%
    if (conditionRating >= 7) return 0.0;   // Good: no adjustment
    if (conditionRating >= 5) return -0.1;  // Fair: -10%
    if (conditionRating >= 3) return -0.2;  // Poor: -20%
    return -0.3; // Very poor: -30%
  }

  /**
   * Convert numeric condition rating to string key
   */
  private getConditionKey(rating: number): string {
    if (rating >= 8) return 'excellent';
    if (rating >= 6) return 'good';
    if (rating >= 4) return 'fair';
    return 'poor';
  }

  /**
   * Get calculation formula from cache or database
   */
  private getFormula(type: string, propertyType: string): CalculationFormula | null {
    const key = `${type}_${propertyType}`;
    return this.formulas.get(key) || null;
  }

  /**
   * Get market data for district
   */
  private async getMarketData(district: string): Promise<MarketData> {
    // Check cache first
    if (this.marketData.has(district)) {
      return this.marketData.get(district)!;
    }

    // Default market data for common Egyptian districts
    const defaultMarketData: Record<string, MarketData> = {
      'new_cairo': {
        district_name: 'New Cairo',
        average_price_per_sqm: 15000,
        market_trend: 'rising',
        demand_supply_ratio: 1.2,
        location_multiplier: 1.1
      },
      'zamalek': {
        district_name: 'Zamalek',
        average_price_per_sqm: 25000,
        market_trend: 'stable',
        demand_supply_ratio: 0.8,
        location_multiplier: 1.3
      },
      'heliopolis': {
        district_name: 'Heliopolis',
        average_price_per_sqm: 18000,
        market_trend: 'stable',
        demand_supply_ratio: 1.0,
        location_multiplier: 1.2
      },
      '6th_october': {
        district_name: '6th of October',
        average_price_per_sqm: 12000,
        market_trend: 'rising',
        demand_supply_ratio: 1.3,
        location_multiplier: 1.05
      }
    };

    const marketData = defaultMarketData[district.toLowerCase()] || {
      district_name: district,
      average_price_per_sqm: 10000,
      market_trend: 'stable' as const,
      demand_supply_ratio: 1.0,
      location_multiplier: 1.0
    };

    this.marketData.set(district, marketData);
    return marketData;
  }

  /**
   * Initialize default calculation formulas
   */
  private initializeFormulas(): void {
    // Egyptian residential depreciation formula
    this.formulas.set('depreciation_residential', {
      formula_name: 'Egyptian Residential Depreciation',
      formula_type: 'depreciation',
      base_rate: 0.02,
      age_factor: 0.02,
      condition_multipliers: {
        excellent: 0.8,
        good: 1.0,
        fair: 1.2,
        poor: 1.5
      },
      location_adjustments: {
        new_cairo: 1.1,
        zamalek: 1.3,
        downtown: 0.9,
        heliopolis: 1.2
      }
    });

    // Villa depreciation formula
    this.formulas.set('depreciation_villa', {
      formula_name: 'Villa Depreciation Formula',
      formula_type: 'depreciation',
      base_rate: 0.018,
      age_factor: 0.018,
      condition_multipliers: {
        excellent: 0.75,
        good: 1.0,
        fair: 1.25,
        poor: 1.6
      },
      location_adjustments: {
        gated_community: 1.15,
        standalone: 1.0,
        compound: 1.05
      }
    });

    // Commercial property depreciation
    this.formulas.set('depreciation_commercial', {
      formula_name: 'Commercial Property Depreciation',
      formula_type: 'depreciation',
      base_rate: 0.025,
      age_factor: 0.025,
      condition_multipliers: {
        excellent: 0.7,
        good: 1.0,
        fair: 1.3,
        poor: 1.8
      },
      location_adjustments: {
        business_district: 1.2,
        industrial: 0.8,
        mixed_use: 1.0
      }
    });
  }

  /**
   * Load formulas from database data
   */
  loadFormulasFromData(formulas: any[]): void {
    try {
      formulas.forEach(formula => {
        const key = `${formula.formula_type}_${formula.formula_name.toLowerCase().replace(' ', '_')}`;
        this.formulas.set(key, formula);
      });
    } catch (error) {
      console.error('Failed to load formulas from data:', error);
      // Continue with default formulas
    }
  }

  /**
   * Load formulas from database (deprecated - use loadFormulasFromData)
   */
  async loadFormulasFromDatabase(): Promise<void> {
    try {
      const response = await fetch('/api/appraisals/formulas');
      const result = await response.json();
      const formulas = result.data || result;
      
      formulas.forEach((formula: any) => {
        const key = `${formula.formula_type}_${formula.formula_name.toLowerCase().replace(' ', '_')}`;
        this.formulas.set(key, formula);
      });
    } catch (error) {
      console.error('Failed to load formulas from database:', error);
      // Continue with default formulas
    }
  }

  /**
   * Validate property data before calculation
   */
  validatePropertyData(propertyData: PropertyData): string[] {
    const errors: string[] = [];
    
    if (!propertyData.built_area_sqm || propertyData.built_area_sqm <= 0) {
      errors.push('Built area is required and must be greater than 0');
    }
    
    if (!propertyData.building_age_years || propertyData.building_age_years < 0) {
      errors.push('Building age is required and must be non-negative');
    }
    
    if (!propertyData.overall_condition_rating || 
        propertyData.overall_condition_rating < 1 || 
        propertyData.overall_condition_rating > 10) {
      errors.push('Condition rating must be between 1 and 10');
    }
    
    if (!propertyData.district_name) {
      errors.push('District name is required');
    }
    
    return errors;
  }
}

export default EgyptianPropertyCalculator;