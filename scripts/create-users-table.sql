-- ============================================================================
-- Create Users Table
-- ============================================================================
-- Execute this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/sql/new
-- ============================================================================

-- Drop existing table if it exists (to start fresh)
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('clerk', 'supervisor', 'admin')) DEFAULT 'clerk',
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS users_organization_id_idx ON users(organization_id);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (from migration 00006)
-- Users can view users in their organization
CREATE POLICY "Users can view users in their organization"
    ON users
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id
            FROM users
            WHERE id = auth.uid()
        )
    );

-- Users can insert their own record
CREATE POLICY "Users can insert their own record"
    ON users
    FOR INSERT
    WITH CHECK (id = auth.uid());

-- Users can update their own record
CREATE POLICY "Users can update their own record"
    ON users
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Admins can do anything
CREATE POLICY "Admins can do anything with users"
    ON users
    FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO service_role;

-- Verify the table was created
SELECT 'users table created successfully' as status;

-- Show table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;
