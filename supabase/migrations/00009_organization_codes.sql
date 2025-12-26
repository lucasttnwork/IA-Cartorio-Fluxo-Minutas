-- ============================================================================
-- Minuta Canvas - Organization Codes Management
-- ============================================================================
-- This migration adds support for organization access codes used during
-- user registration. Codes can be limited by usage count and expiration date.

-- ============================================================================
-- Create organization_codes Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS organization_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_uses INTEGER,
    current_uses INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add comments for documentation
COMMENT ON TABLE organization_codes IS 'Organization access codes used for user registration with optional usage limits and expiration';
COMMENT ON COLUMN organization_codes.code IS 'Unique alphanumeric code (8 characters) for organization access';
COMMENT ON COLUMN organization_codes.description IS 'Optional description for the code (e.g., "Main code for Notary X")';
COMMENT ON COLUMN organization_codes.is_active IS 'Whether the code is currently active and can be used';
COMMENT ON COLUMN organization_codes.max_uses IS 'Maximum number of times the code can be used (NULL = unlimited)';
COMMENT ON COLUMN organization_codes.current_uses IS 'Current number of times the code has been used';
COMMENT ON COLUMN organization_codes.expires_at IS 'Code expiration timestamp (NULL = never expires)';

-- ============================================================================
-- Create Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_organization_codes_code ON organization_codes(code);
CREATE INDEX IF NOT EXISTS idx_organization_codes_organization_id ON organization_codes(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_codes_is_active ON organization_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_organization_codes_expires_at ON organization_codes(expires_at);

-- ============================================================================
-- Enable RLS
-- ============================================================================

ALTER TABLE organization_codes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Allow unauthenticated users to check if a code exists (for registration)
CREATE POLICY "Anyone can verify organization code" ON organization_codes
    FOR SELECT USING (true);

-- Only organization admins can create codes
CREATE POLICY "Admins can create organization codes" ON organization_codes
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only organization admins can update codes
CREATE POLICY "Admins can update organization codes" ON organization_codes
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Only organization admins can delete codes
CREATE POLICY "Admins can delete organization codes" ON organization_codes
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id FROM users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================================================
-- Validation Function
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_organization_code(p_code TEXT)
RETURNS UUID AS $$
DECLARE
    v_organization_id UUID;
BEGIN
    SELECT organization_id INTO v_organization_id
    FROM organization_codes
    WHERE code = p_code
        AND is_active = true
        AND (max_uses IS NULL OR current_uses < max_uses)
        AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1;

    RETURN v_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validate_organization_code IS 'Returns organization_id if code is valid (active, not expired, has available uses). Returns NULL if invalid.';

-- ============================================================================
-- Code Usage Function
-- ============================================================================

CREATE OR REPLACE FUNCTION use_organization_code(p_code TEXT)
RETURNS UUID AS $$
DECLARE
    v_organization_id UUID;
    v_code_id UUID;
BEGIN
    -- Get the code and validate it
    SELECT id, organization_id INTO v_code_id, v_organization_id
    FROM organization_codes
    WHERE code = p_code
        AND is_active = true
        AND (max_uses IS NULL OR current_uses < max_uses)
        AND (expires_at IS NULL OR expires_at > NOW())
    LIMIT 1;

    -- If code not found or invalid, return NULL
    IF v_code_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Increment current_uses
    UPDATE organization_codes
    SET current_uses = current_uses + 1
    WHERE id = v_code_id;

    -- Return the organization_id
    RETURN v_organization_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION use_organization_code IS 'Increments current_uses and returns organization_id if code is valid. Returns NULL if invalid or used up.';

-- ============================================================================
-- Insert Example Code (if organization exists)
-- ============================================================================

INSERT INTO organization_codes (
    organization_id,
    code,
    description,
    is_active,
    created_by
)
SELECT
    id,
    'DEMO2024',
    'Demo code for initial testing',
    true,
    (SELECT id FROM auth.users LIMIT 1)
FROM organizations
LIMIT 1
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT SELECT ON organization_codes TO authenticated;
GRANT SELECT ON organization_codes TO anon;
