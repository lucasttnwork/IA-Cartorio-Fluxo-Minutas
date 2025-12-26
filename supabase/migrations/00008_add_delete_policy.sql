-- Migration: Add DELETE policy for cases table
-- This migration adds the missing DELETE policy for Row Level Security (RLS)
-- on the cases table, allowing users to delete cases from their organization.

-- Add DELETE policy for cases table
CREATE POLICY "Users can delete org cases" ON cases
    FOR DELETE USING (
        organization_id = public.get_current_user_organization_id()
    );

-- Comments for documentation
COMMENT ON POLICY "Users can delete org cases" ON cases IS
'Allows users to delete cases that belong to their organization';
