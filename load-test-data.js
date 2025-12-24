import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'

// Read .env file manually
const envContent = fs.readFileSync('.env', 'utf-8')
const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`${name}=(.+)`))
  return match ? match[1].trim() : ''
}

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL')
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY')

const supabase = createClient(supabaseUrl, supabaseKey)

async function loadTestData() {
  const testCaseId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  const orgId = '00000000-0000-0000-0000-000000000001'

  console.log('Loading test data for spouse consent validation...')

  // Clean up existing test data
  console.log('Cleaning up existing test data...')
  await supabase.from('graph_edges').delete().eq('case_id', testCaseId)
  await supabase.from('properties').delete().eq('case_id', testCaseId)
  await supabase.from('people').delete().eq('case_id', testCaseId)
  await supabase.from('cases').delete().eq('id', testCaseId)

  // Get first user for created_by
  const { data: users } = await supabase.auth.admin.listUsers()
  const userId = users?.[0]?.id || '00000000-0000-0000-0000-000000000000'

  // Insert organization
  console.log('Creating organization...')
  await supabase.from('organizations').upsert({
    id: orgId,
    name: 'Test Organization'
  })

  // Insert test case
  console.log('Creating test case...')
  await supabase.from('cases').insert({
    id: testCaseId,
    organization_id: orgId,
    act_type: 'purchase_sale',
    status: 'draft',
    title: 'Test Spouse Consent Validation',
    created_by: userId
  })

  // Insert people
  console.log('Creating people...')
  await supabase.from('people').insert([
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
      case_id: testCaseId,
      full_name: 'Roberto Costa',
      cpf: '111.222.333-44',
      marital_status: 'married',
      confidence: 0.95,
      source_docs: [],
      metadata: {}
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
      case_id: testCaseId,
      full_name: 'Ana Oliveira',
      cpf: '222.333.444-55',
      marital_status: 'married',
      confidence: 0.95,
      source_docs: [],
      metadata: {}
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03',
      case_id: testCaseId,
      full_name: 'Carlos Oliveira',
      cpf: '333.444.555-66',
      marital_status: 'married',
      confidence: 0.95,
      source_docs: [],
      metadata: {}
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04',
      case_id: testCaseId,
      full_name: 'Julia Santos',
      cpf: '444.555.666-77',
      marital_status: 'single',
      confidence: 0.95,
      source_docs: [],
      metadata: {}
    }
  ])

  // Insert properties
  console.log('Creating properties...')
  await supabase.from('properties').insert([
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccc01',
      case_id: testCaseId,
      registry_number: 'MAT-12345',
      address: {
        street: 'Rua das Acácias',
        number: '100',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zip: '01000-000'
      },
      area_sqm: 120.50,
      confidence: 0.90,
      source_docs: [],
      metadata: {}
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccc02',
      case_id: testCaseId,
      registry_number: 'MAT-67890',
      address: {
        street: 'Av. Principal',
        number: '200',
        neighborhood: 'Jardim',
        city: 'São Paulo',
        state: 'SP',
        zip: '02000-000'
      },
      area_sqm: 200.00,
      confidence: 0.90,
      source_docs: [],
      metadata: {}
    },
    {
      id: 'cccccccc-cccc-cccc-cccc-cccccccccc03',
      case_id: testCaseId,
      registry_number: 'MAT-11111',
      address: {
        street: 'Rua da Praia',
        number: '300',
        neighborhood: 'Litoral',
        city: 'Santos',
        state: 'SP',
        zip: '03000-000'
      },
      area_sqm: 150.00,
      confidence: 0.90,
      source_docs: [],
      metadata: {}
    }
  ])

  // Insert graph edges
  console.log('Creating relationships...')
  await supabase.from('graph_edges').insert([
    // Roberto sells property 1 (no spouse in canvas)
    {
      case_id: testCaseId,
      source_type: 'person',
      source_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb01',
      target_type: 'property',
      target_id: 'cccccccc-cccc-cccc-cccc-cccccccccc01',
      relationship: 'sells',
      confidence: 0.95,
      confirmed: true,
      metadata: {}
    },
    // Ana and Carlos are spouses
    {
      case_id: testCaseId,
      source_type: 'person',
      source_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
      target_type: 'person',
      target_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb03',
      relationship: 'spouse_of',
      confidence: 1.0,
      confirmed: true,
      metadata: {}
    },
    // Ana sells property 2 (Carlos doesn't)
    {
      case_id: testCaseId,
      source_type: 'person',
      source_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb02',
      target_type: 'property',
      target_id: 'cccccccc-cccc-cccc-cccc-cccccccccc02',
      relationship: 'sells',
      confidence: 0.95,
      confirmed: true,
      metadata: {}
    },
    // Julia (single) sells property 3
    {
      case_id: testCaseId,
      source_type: 'person',
      source_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbb04',
      target_type: 'property',
      target_id: 'cccccccc-cccc-cccc-cccc-cccccccccc03',
      relationship: 'sells',
      confidence: 0.95,
      confirmed: true,
      metadata: {}
    }
  ])

  console.log('✅ Test data loaded successfully!')
  console.log(`Case ID: ${testCaseId}`)
  console.log(`Navigate to: http://localhost:5173/cases/${testCaseId}/canvas`)
}

loadTestData().catch(console.error)
