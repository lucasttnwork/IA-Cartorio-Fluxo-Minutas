-- ============================================================================
-- Fix RLS Infinite Recursion on Users Table
-- ============================================================================
-- Problem: Policies on the `users` table that query the same table cause
-- infinite recursion. This migration fixes it using SECURITY DEFINER functions.
--
-- Note: Functions are created in `public` schema (not `auth`) due to Supabase
-- restrictions on the auth schema.
-- ============================================================================

-- ============================================================================
-- Step 1: Create helper functions with SECURITY DEFINER in PUBLIC schema
-- ============================================================================

-- Function to get current user's organization_id without triggering RLS
CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT organization_id FROM public.users WHERE id = auth.uid()
$$;

-- Function to get current user's role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- Function to check if current user is admin or supervisor
CREATE OR REPLACE FUNCTION public.is_current_user_admin_or_supervisor()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
        AND role IN ('supervisor', 'admin')
    )
$$;

-- ============================================================================
-- Step 2: Drop problematic policies on users table
-- ============================================================================

DROP POLICY IF EXISTS "Users can view organization members" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can manage org users" ON public.users;

-- ============================================================================
-- Step 3: Recreate policies using helper functions
-- ============================================================================

-- Users can view their own profile (simple, no recursion)
-- Note: "Users can view own profile" already exists and is safe (uses auth.uid() directly)

-- Users can view other members in their organization
CREATE POLICY "Users can view organization members" ON public.users
    FOR SELECT USING (
        organization_id = public.get_current_user_organization_id()
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (id = auth.uid())
    WITH CHECK (
        id = auth.uid() AND
        -- Prevent changing organization (use function to avoid recursion)
        organization_id = public.get_current_user_organization_id()
    );

-- Admins can manage all users in their organization
CREATE POLICY "Admins can manage org users" ON public.users
    FOR ALL USING (
        organization_id = public.get_current_user_organization_id()
        AND public.is_current_user_admin_or_supervisor()
    );

-- ============================================================================
-- Step 4: Update other policies that query users table
-- ============================================================================

-- Drop and recreate organizations policy
DROP POLICY IF EXISTS "Users can view own organization" ON public.organizations;
CREATE POLICY "Users can view own organization" ON public.organizations
    FOR SELECT USING (
        id = public.get_current_user_organization_id()
    );

-- Drop and recreate cases policies
DROP POLICY IF EXISTS "Users can view org cases" ON public.cases;
DROP POLICY IF EXISTS "Users can create org cases" ON public.cases;
DROP POLICY IF EXISTS "Users can update org cases" ON public.cases;

CREATE POLICY "Users can view org cases" ON public.cases
    FOR SELECT USING (
        organization_id = public.get_current_user_organization_id()
    );

CREATE POLICY "Users can create org cases" ON public.cases
    FOR INSERT WITH CHECK (
        organization_id = public.get_current_user_organization_id()
    );

CREATE POLICY "Users can update org cases" ON public.cases
    FOR UPDATE USING (
        organization_id = public.get_current_user_organization_id()
    );

-- Drop and recreate documents policies
DROP POLICY IF EXISTS "Users can view case documents" ON public.documents;
DROP POLICY IF EXISTS "Users can create case documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update case documents" ON public.documents;

CREATE POLICY "Users can view case documents" ON public.documents
    FOR SELECT USING (
        case_id IN (
            SELECT id FROM public.cases WHERE organization_id = public.get_current_user_organization_id()
        )
    );

CREATE POLICY "Users can create case documents" ON public.documents
    FOR INSERT WITH CHECK (
        case_id IN (
            SELECT id FROM public.cases WHERE organization_id = public.get_current_user_organization_id()
        )
    );

CREATE POLICY "Users can update case documents" ON public.documents
    FOR UPDATE USING (
        case_id IN (
            SELECT id FROM public.cases WHERE organization_id = public.get_current_user_organization_id()
        )
    );

-- Drop and recreate admin policies
DROP POLICY IF EXISTS "Admins can update organization" ON public.organizations;
CREATE POLICY "Admins can update organization" ON public.organizations
    FOR UPDATE USING (
        id = public.get_current_user_organization_id()
        AND public.get_current_user_role() = 'admin'
    );

-- ============================================================================
-- Step 5: Grant execute permissions on helper functions
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_current_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin_or_supervisor() TO authenticated;

-- Also grant to anon for public access scenarios (if needed)
GRANT EXECUTE ON FUNCTION public.get_current_user_organization_id() TO anon;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO anon;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin_or_supervisor() TO anon;
