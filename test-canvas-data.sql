-- Test data for canvas connections feature
-- This creates a test case with people and properties to test connections

-- Insert test organization (if not exists)
INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Organization')
ON CONFLICT DO NOTHING;

-- Insert test case
INSERT INTO cases (id, organization_id, act_type, status, title, created_by)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000001',
  'purchase_sale',
  'draft',
  'Test Canvas Connections',
  (SELECT id FROM auth.users LIMIT 1)
)
ON CONFLICT DO NOTHING;

-- Insert test people (sellers and buyers)
INSERT INTO people (id, case_id, full_name, cpf, marital_status) VALUES
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'João Silva', '123.456.789-01', 'married'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Maria Silva', '987.654.321-02', 'married'),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Pedro Santos', '456.789.123-03', 'single')
ON CONFLICT DO NOTHING;

-- Insert test properties
INSERT INTO properties (id, case_id, registry_number, address, area_sqm) VALUES
  ('33333333-3333-3333-3333-333333333331', '11111111-1111-1111-1111-111111111111', 'REG-001',
   '{"street": "Rua das Flores", "number": "123", "city": "São Paulo"}'::jsonb, 150.00),
  ('33333333-3333-3333-3333-333333333332', '11111111-1111-1111-1111-111111111111', 'REG-002',
   '{"street": "Av. Paulista", "number": "456", "city": "São Paulo"}'::jsonb, 200.00)
ON CONFLICT DO NOTHING;

-- Insert existing relationships (João and Maria are spouses, João owns property 1)
INSERT INTO graph_edges (case_id, source_type, source_id, target_type, target_id, relationship, confidence, confirmed) VALUES
  ('11111111-1111-1111-1111-111111111111', 'person', '22222222-2222-2222-2222-222222222221', 'person', '22222222-2222-2222-2222-222222222222', 'spouse_of', 1.0, true),
  ('11111111-1111-1111-1111-111111111111', 'person', '22222222-2222-2222-2222-222222222221', 'property', '33333333-3333-3333-3333-333333333331', 'owns', 0.8, false)
ON CONFLICT DO NOTHING;
