-- Fix Contract Templates Check Constraints
-- Allow "all" as valid value for property_type, jurisdiction, and ownership_type

-- Drop existing check constraints
ALTER TABLE contract_templates DROP CONSTRAINT IF EXISTS contract_templates_property_type_check;
ALTER TABLE contract_templates DROP CONSTRAINT IF EXISTS contract_templates_jurisdiction_check;
ALTER TABLE contract_templates DROP CONSTRAINT IF EXISTS contract_templates_ownership_type_check;

-- Add updated check constraints that include "all" as valid option
ALTER TABLE contract_templates ADD CONSTRAINT contract_templates_property_type_check 
  CHECK (property_type IN ('residential', 'commercial', 'luxury', 'land', 'development', 'all'));

ALTER TABLE contract_templates ADD CONSTRAINT contract_templates_jurisdiction_check 
  CHECK (jurisdiction IN ('cairo', 'alexandria', 'giza', 'new_capital', 'north_coast', 'red_sea', 'all'));

ALTER TABLE contract_templates ADD CONSTRAINT contract_templates_ownership_type_check 
  CHECK (ownership_type IN ('individual', 'company', 'trust', 'government', 'all'));

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Contract templates constraints fixed successfully!';
  RAISE NOTICE 'Property type, jurisdiction, and ownership type now accept "all" as valid value';
END $$;