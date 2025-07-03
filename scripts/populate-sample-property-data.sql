-- Populate Sample Property Data for HeyGen Knowledge System
-- This script adds comprehensive data to existing properties for testing

-- First, let's add sample financial data
INSERT INTO property_financials (property_id, listing_price, price_history, property_taxes, hoa_fees, financing, market_analysis, incentives)
SELECT 
  id as property_id,
  price as listing_price,
  JSONB_BUILD_ARRAY(
    JSONB_BUILD_OBJECT('date', '2024-01-15', 'price', price, 'change', 'Listed'),
    JSONB_BUILD_OBJECT('date', '2023-12-01', 'price', price * 0.98, 'change', 'Price Reduction'),
    JSONB_BUILD_OBJECT('date', '2023-09-15', 'price', price * 1.05, 'change', 'Initial Listing')
  ) as price_history,
  JSONB_BUILD_OBJECT(
    'annual', ROUND(price * 0.015),
    'monthly', ROUND(price * 0.015 / 12),
    'taxRate', '1.5%'
  ) as property_taxes,
  JSONB_BUILD_OBJECT(
    'monthly', 150,
    'includes', ARRAY['Maintenance', 'Security', 'Common Areas', 'Landscaping'],
    'specialAssessments', ARRAY[]::text[]
  ) as hoa_fees,
  JSONB_BUILD_OBJECT(
    'downPaymentOptions', ARRAY[10, 15, 20, 25, 30],
    'estimatedMortgageRates', 7.2,
    'monthlyPaymentEstimates', JSONB_BUILD_ARRAY(
      JSONB_BUILD_OBJECT('downPayment', 10, 'monthly', ROUND((price * 0.9 * 0.072 / 12 * POWER(1 + 0.072/12, 360)) / (POWER(1 + 0.072/12, 360) - 1))),
      JSONB_BUILD_OBJECT('downPayment', 20, 'monthly', ROUND((price * 0.8 * 0.072 / 12 * POWER(1 + 0.072/12, 360)) / (POWER(1 + 0.072/12, 360) - 1))),
      JSONB_BUILD_OBJECT('downPayment', 30, 'monthly', ROUND((price * 0.7 * 0.072 / 12 * POWER(1 + 0.072/12, 360)) / (POWER(1 + 0.072/12, 360) - 1)))
    ),
    'closingCosts', JSONB_BUILD_OBJECT(
      'estimated', ROUND(price * 0.03),
      'breakdown', JSONB_BUILD_OBJECT(
        'Title Insurance', ROUND(price * 0.005),
        'Attorney Fees', 1500,
        'Inspection', 500,
        'Appraisal', 600,
        'Other Fees', ROUND(price * 0.015)
      )
    )
  ) as financing,
  JSONB_BUILD_OBJECT(
    'pricePerSqft', ROUND(price / NULLIF(square_feet, 0)),
    'neighborhoodAverage', ROUND(price * 0.95),
    'appreciation', '5.2% annually',
    'daysOnMarket', 14
  ) as market_analysis,
  ARRAY['First-time buyer assistance', 'Flexible closing date']::text[] as incentives
FROM properties 
WHERE id NOT IN (SELECT property_id FROM property_financials);

-- Add sample legal data
INSERT INTO property_legal (property_id, property_disclosures, title_info, zoning, permits, association_rules, contract_terms)
SELECT 
  id as property_id,
  JSONB_BUILD_OBJECT(
    'knownIssues', ARRAY[]::text[],
    'repairs', ARRAY['Recent HVAC maintenance', 'Fresh paint throughout'],
    'environmentalHazards', ARRAY[]::text[]
  ) as property_disclosures,
  JSONB_BUILD_OBJECT(
    'titleStatus', 'Clear',
    'liens', ARRAY[]::text[],
    'easements', ARRAY[]::text[]
  ) as title_info,
  JSONB_BUILD_OBJECT(
    'currentZoning', 'Residential',
    'allowedUses', ARRAY['Single Family Residence', 'Multi-family up to 4 units'],
    'restrictions', ARRAY['No commercial use', 'Height limit 3 stories']
  ) as zoning,
  JSONB_BUILD_OBJECT(
    'recentPermits', JSONB_BUILD_ARRAY(
      JSONB_BUILD_OBJECT('type', 'Electrical Upgrade', 'date', '2023-08-15', 'status', 'Complete'),
      JSONB_BUILD_OBJECT('type', 'Plumbing Inspection', 'date', '2023-12-01', 'status', 'Approved')
    ),
    'requiredInspections', ARRAY['Final Inspection Complete']
  ) as permits,
  JSONB_BUILD_OBJECT(
    'petPolicy', 'Pets allowed with $200 deposit',
    'rentalPolicy', 'Owner-occupied preferred, rentals allowed',
    'modifications', ARRAY['Exterior changes require approval', 'Interior modifications allowed']
  ) as association_rules,
  JSONB_BUILD_OBJECT(
    'standardContingencies', ARRAY['Inspection', 'Financing', 'Appraisal'],
    'sellerConcessions', ARRAY['Up to 3% closing costs', 'Home warranty included'],
    'possessionDate', '30 days after closing'
  ) as contract_terms
FROM properties 
WHERE id NOT IN (SELECT property_id FROM property_legal);

-- Add sample scheduling data
INSERT INTO property_scheduling (property_id, available_viewings, key_contact_info, access_instructions, restrictions)
SELECT 
  id as property_id,
  JSONB_BUILD_ARRAY(
    JSONB_BUILD_OBJECT(
      'type', 'virtual',
      'date', (CURRENT_DATE + INTERVAL '2 days')::text,
      'timeSlots', ARRAY['10:00 AM', '2:00 PM', '5:00 PM'],
      'duration', '30 minutes'
    ),
    JSONB_BUILD_OBJECT(
      'type', 'in_person',
      'date', (CURRENT_DATE + INTERVAL '3 days')::text,
      'timeSlots', ARRAY['11:00 AM', '3:00 PM'],
      'duration', '45 minutes'
    )
  ) as available_viewings,
  JSONB_BUILD_OBJECT(
    'listingAgent', JSONB_BUILD_OBJECT(
      'name', 'Ahmed Hassan',
      'phone', '+20-10-1234-5678',
      'email', 'ahmed.hassan@realestate.com'
    ),
    'showingAgent', JSONB_BUILD_OBJECT(
      'name', 'Sara Mohamed',
      'phone', '+20-10-8765-4321',
      'email', 'sara.mohamed@realestate.com'
    )
  ) as key_contact_info,
  JSONB_BUILD_OBJECT(
    'keyLocation', 'Lockbox at front door',
    'securityCode', '1234',
    'specialInstructions', ARRAY['Remove shoes when entering', 'Please ensure all lights are turned off', 'Lock all doors when leaving']
  ) as access_instructions,
  JSONB_BUILD_OBJECT(
    'advanceNotice', '24 hours',
    'allowedTimes', 'Monday-Saturday 9 AM - 7 PM, Sunday 12 PM - 5 PM',
    'petRestrictions', 'No pets during showings',
    'showingRequirements', ARRAY['Photo ID required', 'Pre-approval letter preferred']
  ) as restrictions
FROM properties 
WHERE id NOT IN (SELECT property_id FROM property_scheduling WHERE property_id IS NOT NULL); 