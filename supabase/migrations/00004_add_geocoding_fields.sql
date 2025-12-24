-- ============================================================================
-- Add Address Geocoding/Validation Fields
-- Migration: 00004_add_geocoding_fields
-- ============================================================================

-- Add geocoding fields to properties table
-- These fields will be stored in the address JSONB column
COMMENT ON COLUMN properties.address IS 'JSONB address object with fields: street, number, complement, neighborhood, city, state, zip, latitude, longitude, formatted_address, geocoded_at, geocode_confidence, geocode_status';

-- Add geocoding fields to people table
-- These fields will be stored in the address JSONB column
COMMENT ON COLUMN people.address IS 'JSONB address object with fields: street, number, complement, neighborhood, city, state, zip, latitude, longitude, formatted_address, geocoded_at, geocode_confidence, geocode_status';

-- Create index for geocoded properties for efficient querying
CREATE INDEX IF NOT EXISTS idx_properties_geocoded
ON properties ((address->>'latitude'), (address->>'longitude'))
WHERE address->>'latitude' IS NOT NULL AND address->>'longitude' IS NOT NULL;

-- Create index for geocoded people addresses for efficient querying
CREATE INDEX IF NOT EXISTS idx_people_geocoded
ON people ((address->>'latitude'), (address->>'longitude'))
WHERE address->>'latitude' IS NOT NULL AND address->>'longitude' IS NOT NULL;

-- Add validation status index for quick filtering
CREATE INDEX IF NOT EXISTS idx_properties_geocode_status
ON properties ((address->>'geocode_status'))
WHERE address->>'geocode_status' IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_people_geocode_status
ON people ((address->>'geocode_status'))
WHERE address->>'geocode_status' IS NOT NULL;
