-- ============================================================================
-- Apply Missing Tables (users specifically)
-- ============================================================================
-- This script creates any tables that may have been skipped during migration
-- Execute in Supabase SQL Editor if needed

-- Check if users table exists, if not create it
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('clerk', 'supervisor', 'admin')) DEFAULT 'clerk',
    full_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verify the table was created
SELECT 'users table' as table_name,
       CASE WHEN EXISTS (
           SELECT FROM information_schema.tables
           WHERE table_schema = 'public'
           AND table_name = 'users'
       ) THEN 'EXISTS' ELSE 'NOT FOUND' END as status;
