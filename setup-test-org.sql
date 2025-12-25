-- Setup test organization data
-- Run this in Supabase SQL Editor

-- Insert test organization
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

-- Update user to belong to this organization
UPDATE users
SET organization_id = '550e8400-e29b-41d4-a716-446655440000',
    role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'teste@minuta.com' LIMIT 1);
