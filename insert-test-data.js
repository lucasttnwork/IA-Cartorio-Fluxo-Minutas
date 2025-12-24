// Script to insert test data for canvas edit feature testing
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kllcbgoqtxedlfbkxpfo.supabase.co'
const supabaseServiceKey = 'sb_secret_-6dwOTEOWBLlhrOfHmf9jQ_RKoNiDMF'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function insertTestData() {
  try {
    // Insert test organization
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .upsert({
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Test Organization'
      })
      .select()

    if (orgError) {
      console.error('Error inserting organization:', orgError)
      return
    }

    console.log('✓ Organization created/updated')

    // Get first user ID (or use a test user)
    const { data: users } = await supabase.auth.admin.listUsers()
    const userId = users?.users?.[0]?.id || '00000000-0000-0000-0000-000000000000'

    // Insert test case
    const { data: testCase, error: caseError } = await supabase
      .from('cases')
      .upsert({
        id: '11111111-1111-1111-1111-111111111111',
        organization_id: '00000000-0000-0000-0000-000000000001',
        act_type: 'purchase_sale',
        status: 'draft',
        title: 'Test Canvas Edit Feature',
        created_by: userId
      })
      .select()

    if (caseError) {
      console.error('Error inserting case:', caseError)
      return
    }

    console.log('✓ Test case created/updated')

    // Insert test people
    const { data: people, error: peopleError } = await supabase
      .from('people')
      .upsert([
        {
          id: '22222222-2222-2222-2222-222222222221',
          case_id: '11111111-1111-1111-1111-111111111111',
          full_name: 'João Silva',
          cpf: '123.456.789-01',
          rg: '12.345.678-9',
          rg_issuer: 'SSP-SP',
          email: 'joao@example.com',
          phone: '(11) 98765-4321',
          marital_status: 'married',
          nationality: 'Brasileiro',
          profession: 'Engenheiro',
          address: {
            street: 'Rua das Flores',
            number: '123',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zip: '01310-100'
          },
          confidence: 0.95,
          source_docs: [],
          metadata: {}
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          case_id: '11111111-1111-1111-1111-111111111111',
          full_name: 'Maria Silva',
          cpf: '987.654.321-02',
          rg: '98.765.432-1',
          rg_issuer: 'SSP-SP',
          email: 'maria@example.com',
          phone: '(11) 98765-4322',
          marital_status: 'married',
          nationality: 'Brasileira',
          profession: 'Médica',
          address: {
            street: 'Rua das Flores',
            number: '123',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zip: '01310-100'
          },
          confidence: 0.95,
          source_docs: [],
          metadata: {}
        },
        {
          id: '22222222-2222-2222-2222-222222222223',
          case_id: '11111111-1111-1111-1111-111111111111',
          full_name: 'Pedro Santos',
          cpf: '456.789.123-03',
          rg: '45.678.912-3',
          rg_issuer: 'SSP-RJ',
          email: 'pedro@example.com',
          phone: '(21) 98765-4323',
          marital_status: 'single',
          nationality: 'Brasileiro',
          profession: 'Advogado',
          address: {
            street: 'Av. Paulista',
            number: '1000',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
            zip: '01310-200'
          },
          confidence: 0.90,
          source_docs: [],
          metadata: {}
        }
      ])
      .select()

    if (peopleError) {
      console.error('Error inserting people:', peopleError)
      return
    }

    console.log('✓ Test people created/updated')

    // Insert test properties
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .upsert([
        {
          id: '33333333-3333-3333-3333-333333333331',
          case_id: '11111111-1111-1111-1111-111111111111',
          registry_number: 'REG-12345',
          registry_office: '1º Registro de Imóveis de São Paulo',
          area_sqm: 150.0,
          iptu_number: 'IPTU-001-2024',
          description: 'Apartamento residencial com 3 quartos',
          address: {
            street: 'Rua das Flores',
            number: '123',
            complement: 'Apto 45',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zip: '01310-100'
          },
          encumbrances: [
            {
              type: 'Hipoteca',
              description: 'Hipoteca em favor do Banco XYZ',
              value: 200000,
              beneficiary: 'Banco XYZ S.A.'
            }
          ],
          confidence: 0.92,
          source_docs: [],
          metadata: {}
        },
        {
          id: '33333333-3333-3333-3333-333333333332',
          case_id: '11111111-1111-1111-1111-111111111111',
          registry_number: 'REG-67890',
          registry_office: '2º Registro de Imóveis de São Paulo',
          area_sqm: 200.0,
          iptu_number: 'IPTU-002-2024',
          description: 'Casa térrea com quintal',
          address: {
            street: 'Av. Paulista',
            number: '456',
            neighborhood: 'Bela Vista',
            city: 'São Paulo',
            state: 'SP',
            zip: '01310-200'
          },
          encumbrances: null,
          confidence: 0.88,
          source_docs: [],
          metadata: {}
        }
      ])
      .select()

    if (propertiesError) {
      console.error('Error inserting properties:', propertiesError)
      return
    }

    console.log('✓ Test properties created/updated')

    // Insert test relationships
    const { data: edges, error: edgesError } = await supabase
      .from('graph_edges')
      .upsert([
        {
          id: '44444444-4444-4444-4444-444444444441',
          case_id: '11111111-1111-1111-1111-111111111111',
          source_type: 'person',
          source_id: '22222222-2222-2222-2222-222222222221',
          target_type: 'person',
          target_id: '22222222-2222-2222-2222-222222222222',
          relationship: 'spouse_of',
          confidence: 1.0,
          confirmed: true,
          metadata: {}
        },
        {
          id: '44444444-4444-4444-4444-444444444442',
          case_id: '11111111-1111-1111-1111-111111111111',
          source_type: 'person',
          source_id: '22222222-2222-2222-2222-222222222221',
          target_type: 'property',
          target_id: '33333333-3333-3333-3333-333333333331',
          relationship: 'owns',
          confidence: 0.9,
          confirmed: false,
          metadata: {}
        }
      ])
      .select()

    if (edgesError) {
      console.error('Error inserting edges:', edgesError)
      return
    }

    console.log('✓ Test relationships created/updated')
    console.log('\n✅ All test data inserted successfully!')
    console.log('\nYou can now navigate to: http://localhost:5173/cases/11111111-1111-1111-1111-111111111111/canvas')
  } catch (error) {
    console.error('Error:', error)
  }
}

insertTestData()
