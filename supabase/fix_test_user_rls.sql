-- ============================================================================
-- Fix Test User RLS - Execute este script no Supabase Dashboard SQL Editor
-- ============================================================================
-- Este script garante que o usuário de teste tenha as permissões corretas
-- ============================================================================

-- 1. Verificar se o usuário existe na tabela users
SELECT
    id,
    email,
    organization_id,
    role
FROM public.users
WHERE email = 'test@cartorio.com';

-- 2. Se o organization_id estiver NULL, criar e associar uma organização
DO $$
DECLARE
    test_org_id UUID;
    test_user_id UUID;
BEGIN
    -- Buscar ID do usuário de teste
    SELECT id INTO test_user_id
    FROM auth.users
    WHERE email = 'test@cartorio.com';

    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário de teste não encontrado. Execute o script seed_test_user.sql primeiro.';
    END IF;

    -- Verificar/criar organização de teste
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
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO test_org_id;

    -- Atualizar usuário com organization_id
    UPDATE public.users
    SET organization_id = 'a0000000-0000-0000-0000-000000000001'::uuid,
        role = 'admin',
        updated_at = NOW()
    WHERE id = test_user_id;

    RAISE NOTICE 'Usuário de teste atualizado com sucesso!';
END $$;

-- 3. Verificar que está tudo correto
SELECT
    'Setup completo!' as status,
    u.email,
    pu.full_name,
    pu.role,
    o.name as organization,
    pu.organization_id
FROM auth.users u
JOIN public.users pu ON u.id = pu.id
LEFT JOIN public.organizations o ON pu.organization_id = o.id
WHERE u.email = 'test@cartorio.com';
