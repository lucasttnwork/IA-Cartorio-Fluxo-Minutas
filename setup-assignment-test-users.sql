-- Setup test users for case assignment feature
-- Run this in Supabase SQL Editor

-- First, ensure the test organization exists
INSERT INTO organizations (id, name, settings, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Test Organization',
  '{"theme": "light", "notifications": true}'::jsonb,
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    settings = EXCLUDED.settings;

-- Insert test users (assuming they exist in auth.users)
-- You'll need to create these users via Supabase Auth first:
-- 1. admin@test.com (password: password123)
-- 2. supervisor@test.com (password: password123)
-- 3. clerk@test.com (password: password123)

-- Update or insert admin user
INSERT INTO users (id, organization_id, role, full_name, created_at)
SELECT
  au.id,
  '550e8400-e29b-41d4-a716-446655440000',
  'admin',
  'Admin User',
  NOW()
FROM auth.users au
WHERE au.email = 'admin@test.com'
ON CONFLICT (id) DO UPDATE
SET organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

-- Update or insert supervisor user
INSERT INTO users (id, organization_id, role, full_name, created_at)
SELECT
  au.id,
  '550e8400-e29b-41d4-a716-446655440000',
  'supervisor',
  'Supervisor User',
  NOW()
FROM auth.users au
WHERE au.email = 'supervisor@test.com'
ON CONFLICT (id) DO UPDATE
SET organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

-- Update or insert clerk user
INSERT INTO users (id, organization_id, role, full_name, created_at)
SELECT
  au.id,
  '550e8400-e29b-41d4-a716-446655440000',
  'clerk',
  'Clerk User',
  NOW()
FROM auth.users au
WHERE au.email = 'clerk@test.com'
ON CONFLICT (id) DO UPDATE
SET organization_id = EXCLUDED.organization_id,
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

-- Insert a test case for assignment testing
INSERT INTO cases (
  id,
  organization_id,
  act_type,
  status,
  title,
  created_by,
  assigned_to,
  canonical_data,
  created_at,
  updated_at
)
SELECT
  'test-case-assignment-001',
  '550e8400-e29b-41d4-a716-446655440000',
  'purchase_sale',
  'draft',
  'Test Case for Assignment',
  au.id,
  NULL,
  NULL,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.email = 'admin@test.com'
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    updated_at = NOW();

SELECT 'Setup complete! Please create the following users in Supabase Auth:' as message
UNION ALL
SELECT '1. admin@test.com (password: password123)'
UNION ALL
SELECT '2. supervisor@test.com (password: password123)'
UNION ALL
SELECT '3. clerk@test.com (password: password123)';
