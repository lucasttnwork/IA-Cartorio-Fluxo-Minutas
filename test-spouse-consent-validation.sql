-- Test data for spouse consent validation feature
-- This creates a scenario where a married person is selling property without spouse

-- Clean up existing test data
DELETE FROM graph_edges WHERE case_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
DELETE FROM properties WHERE case_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
DELETE FROM people WHERE case_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
DELETE FROM cases WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Insert test organization (if not exists)
INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test Organization')
ON CONFLICT DO NOTHING;

-- Insert test case
INSERT INTO cases (id, organization_id, act_type, status, title, created_by)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  '00000000-0000-0000-0000-000000000001',
  'purchase_sale',
  'draft',
  'Test Spouse Consent Validation',
  (SELECT id FROM auth.users LIMIT 1)
);

-- Insert test people
-- Scenario 1: Roberto is married and selling, but spouse is missing from canvas
INSERT INTO people (id, case_id, full_name, cpf, marital_status, confidence, source_docs, metadata) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Roberto Costa', '111.222.333-44', 'married', 0.95, '{}', '{}');

-- Scenario 2: Ana and Carlos are spouses, Ana is selling but Carlos is not
INSERT INTO people (id, case_id, full_name, cpf, marital_status, confidence, source_docs, metadata) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Ana Oliveira', '222.333.444-55', 'married', 0.95, '{}', '{}'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Carlos Oliveira', '333.444.555-66', 'married', 0.95, '{}', '{}');

-- Scenario 3: Single person selling (should NOT trigger warning)
INSERT INTO people (id, case_id, full_name, cpf, marital_status, confidence, source_docs, metadata) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'Julia Santos', '444.555.666-77', 'single', 0.95, '{}', '{}');

-- Insert properties
INSERT INTO properties (id, case_id, registry_number, address, area_sqm, confidence, source_docs, metadata) VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccc01', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'MAT-12345',
   '{"street": "Rua das Acácias", "number": "100", "neighborhood": "Centro", "city": "São Paulo", "state": "SP", "zip": "01000-000"}'::jsonb,
   120.50, 0.90, '{}', '{}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc02', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'MAT-67890',
   '{"street": "Av. Principal", "number": "200", "neighborhood": "Jardim", "city": "São Paulo", "state": "SP", "zip": "02000-000"}'::jsonb,
   200.00, 0.90, '{}', '{}'),
  ('cccccccc-cccc-cccc-cccc-cccccccccc03', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
   'MAT-11111',
   '{"street": "Rua da Praia", "number": "300", "neighborhood": "Litoral", "city": "Santos", "state": "SP", "zip": "03000-000"}'::jsonb,
   150.00, 0.90, '{}', '{}');

-- Insert relationships
-- Scenario 1: Roberto sells property 1 (married, no spouse in canvas) - SHOULD WARN
INSERT INTO graph_edges (case_id, source_type, source_id, target_type, target_id, relationship, confidence, confirmed, metadata) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'person', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
   'property', 'cccccccc-cccc-cccc-cccc-cccccccccc01', 'sells', 0.95, true, '{}');

-- Scenario 2: Ana and Carlos are spouses, Ana sells property 2, Carlos does not - SHOULD WARN
INSERT INTO graph_edges (case_id, source_type, source_id, target_type, target_id, relationship, confidence, confirmed, metadata) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'person', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
   'person', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03', 'spouse_of', 1.0, true, '{}'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'person', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
   'property', 'cccccccc-cccc-cccc-cccc-cccccccccc02', 'sells', 0.95, true, '{}');

-- Scenario 3: Julia (single) sells property 3 - SHOULD NOT WARN
INSERT INTO graph_edges (case_id, source_type, source_id, target_type, target_id, relationship, confidence, confirmed, metadata) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'person', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04',
   'property', 'cccccccc-cccc-cccc-cccc-cccccccccc03', 'sells', 0.95, true, '{}');
