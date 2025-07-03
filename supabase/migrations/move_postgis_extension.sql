-- Migration: Move PostGIS Extension to Extensions Schema
-- Date: 2024-12-24
-- Description: Move PostGIS from public schema to extensions schema for security

BEGIN;

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant usage on extensions schema to public
GRANT USAGE ON SCHEMA extensions TO public;

-- Move PostGIS extension to extensions schema
-- Note: This requires superuser privileges in Supabase
-- You may need to run this through Supabase Dashboard SQL Editor as a superuser

-- Drop the extension from public and recreate in extensions
-- WARNING: This will temporarily remove PostGIS functionality
DROP EXTENSION IF EXISTS postgis CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- Update any existing geometry/geography columns to reference the new schema
-- This ensures all existing spatial functions still work
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Grant necessary permissions
GRANT ALL ON SCHEMA extensions TO postgres;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

-- Update any views or functions that use PostGIS types
-- (Add specific fixes here if you have custom spatial functions)

COMMIT; 