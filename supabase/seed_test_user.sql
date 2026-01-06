-- ============================================================================
-- Seed Test User for Development
-- ============================================================================
-- Creates a test user in Supabase Auth and corresponding profile
-- Credentials: test@cartorio.com / Test123!@
-- ============================================================================

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create test organization
INSERT INTO public.organizations (id, name, domain, settings)
VALUES (
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'Cartório Teste',
    'cartorio.com',
    '{
        "theme": "light",
        "language": "pt-BR",
        "timezone": "America/Sao_Paulo"
    }'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    domain = EXCLUDED.domain;

-- Create test user in auth.users (Supabase Auth)
-- Password: Test123!@
INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role,
    aud,
    confirmation_token,
    recovery_token
)
VALUES (
    'b0000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000000'::uuid,
    'test@cartorio.com',
    crypt('Test123!@', gen_salt('bf')),  -- bcrypt hash
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Test User"}'::jsonb,
    false,
    'authenticated',
    'authenticated',
    '',
    ''
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    updated_at = NOW();

-- Create user profile in public.users
INSERT INTO public.users (
    id,
    organization_id,
    email,
    full_name,
    role,
    avatar_url,
    created_at,
    updated_at
)
VALUES (
    'b0000000-0000-0000-0000-000000000001'::uuid,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'test@cartorio.com',
    'Test User',
    'admin',
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = NOW();

-- Verify insertion
SELECT
    'User created successfully!' as message,
    u.email,
    u.email_confirmed_at,
    pu.full_name,
    pu.role,
    o.name as organization
FROM auth.users u
JOIN public.users pu ON u.id = pu.id
JOIN public.organizations o ON pu.organization_id = o.id
WHERE u.email = 'test@cartorio.com';
