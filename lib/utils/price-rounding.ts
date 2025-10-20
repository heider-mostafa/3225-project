/**
 * Rounds price per square meter to the nearest 50 or 100 value
 * 
 * Rules:
 * - 00-24: round down to 00
 * - 25-74: round to 50
 * - 75-99: round up to next 00
 * 
 * Examples:
 * - 9042 → 9050 (42 rounds to 50)
 * - 9020 → 9000 (20 rounds down to 00) 
 * - 2075 → 2100 (75 rounds up to next 00)
 * - 2030 → 2050 (30 rounds to 50)
 */
export function roundPricePerSqm(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!value || value <= 0) return 0;
  
  // Get the last two digits
  const lastTwoDigits = value % 100;
  const baseValue = value - lastTwoDigits;
  
  // Apply rounding rules
  if (lastTwoDigits <= 24) {
    // Round down to 00
    return baseValue;
  } else if (lastTwoDigits <= 74) {
    // Round to 50
    return baseValue + 50;
  } else {
    // Round up to next 00
    return baseValue + 100;
  }
}

/**
 * Rounds all price per sqm fields in an object
 */
export function roundAllPricePerSqmFields(data: Record<string, any>): Record<string, any> {
  const fieldsToRound = [
    'price_per_sqm_area',
    'price_per_sqm_land', 
    'price_per_sqm_semi_finished',
    'price_per_sqm_fully_finished',
    'land_price_per_sqm',
    'comparable_sale_1_price_per_sqm',
    'comparable_sale_2_price_per_sqm', 
    'comparable_sale_3_price_per_sqm'
  ];
  
  const roundedData = { ...data };
  
  fieldsToRound.forEach(field => {
    if (roundedData[field] && typeof roundedData[field] === 'number') {
      roundedData[field] = roundPricePerSqm(roundedData[field]);
    }
  });
  
  return roundedData;
}

/**
 * Rounds large monetary values to nearest appropriate increment
 * 
 * Rules:
 * - Values < 100,000: round to nearest 1,000
 * - Values < 1,000,000: round to nearest 10,000  
 * - Values >= 1,000,000: round to nearest 50,000
 * 
 * Examples:
 * - 112,800.56 → 113,000 (rounds to nearest 1k)
 * - 125,750 → 130,000 (rounds to nearest 10k)
 * - 1,875,300 → 1,900,000 (rounds to nearest 50k)
 * - 45,200 → 45,000 (rounds to nearest 1k)
 */
export function roundMonetaryValue(value: number | undefined): number | undefined {
  if (value === undefined) return undefined;
  if (!value || value <= 0) return 0;
  
  let rounded: number;
  
  if (value < 100000) {
    // Round to nearest 1,000
    rounded = Math.round(value / 1000) * 1000;
    console.log(`💰 Rounding <100k: ${value} → ${rounded} (÷1000: ${value/1000}, round: ${Math.round(value/1000)})`);
  } else if (value < 1000000) {
    // Round to nearest 10,000
    rounded = Math.round(value / 10000) * 10000;
    console.log(`💰 Rounding <1M: ${value} → ${rounded} (÷10000: ${value/10000}, round: ${Math.round(value/10000)})`);
  } else {
    // Round to nearest 50,000
    rounded = Math.round(value / 50000) * 50000;
    console.log(`💰 Rounding ≥1M: ${value} → ${rounded} (÷50000: ${value/50000}, round: ${Math.round(value/50000)})`);
  }
  
  return rounded;
}

/**
 * Rounds all monetary value fields in an object
 */
export function roundAllMonetaryFields(data: Record<string, any>): Record<string, any> {
  const monetaryFields = [
    'final_reconciled_value',
    'cost_approach_value',
    'sales_comparison_value', 
    'income_approach_value',
    'land_value',
    'building_value',
    'replacement_cost_new',
    'unit_land_share_value',
    'unit_construction_cost',
    'building_value_with_profit',
    'curable_depreciation_value',
    'incurable_depreciation_value',
    'total_depreciation_value',
    'construction_cost_per_sqm',
    'monthly_rental_estimate',
    'comparable_sale_1_price',
    'comparable_sale_2_price',
    'comparable_sale_3_price'
  ];
  
  const roundedData = { ...data };
  
  monetaryFields.forEach(field => {
    if (roundedData[field] && typeof roundedData[field] === 'number') {
      roundedData[field] = roundMonetaryValue(roundedData[field]);
    }
  });
  
  return roundedData;
}