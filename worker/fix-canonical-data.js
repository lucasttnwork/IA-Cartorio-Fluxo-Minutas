/**
 * Script para corrigir canonical_data de um caso específico
 * Uso: node fix-canonical-data.js <case_id>
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const caseId = process.argv[2]

if (!caseId) {
  console.error('Uso: node fix-canonical-data.js <case_id>')
  process.exit(1)
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function buildAndSaveCanonicalData(caseId) {
  console.log(`[buildAndSaveCanonicalData] Building canonical data for case ${caseId}`)

  // 1. Fetch all people for this case
  const { data: people, error: peopleError } = await supabase
    .from('people')
    .select('*')
    .eq('case_id', caseId)

  if (peopleError) {
    console.error('[buildAndSaveCanonicalData] Error fetching people:', peopleError.message)
  }

  // 2. Fetch all properties for this case
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('*')
    .eq('case_id', caseId)

  if (propertiesError) {
    console.error('[buildAndSaveCanonicalData] Error fetching properties:', propertiesError.message)
  }

  // 3. Fetch all graph edges for this case
  const { data: edges, error: edgesError } = await supabase
    .from('graph_edges')
    .select('*')
    .eq('case_id', caseId)

  if (edgesError) {
    console.error('[buildAndSaveCanonicalData] Error fetching edges:', edgesError.message)
  }

  // 4. Build canonical_data object
  const canonicalData = {
    people: people || [],
    properties: properties || [],
    edges: edges || [],
    deal: null // Will be populated later via chat operations
  }

  console.log(`[buildAndSaveCanonicalData] Canonical data built:`, {
    people_count: canonicalData.people.length,
    properties_count: canonicalData.properties.length,
    edges_count: canonicalData.edges.length
  })

  // 5. Update the case with canonical_data
  const { error: updateError } = await supabase
    .from('cases')
    .update({ canonical_data: canonicalData })
    .eq('id', caseId)

  if (updateError) {
    console.error('[buildAndSaveCanonicalData] Error updating case:', updateError.message)
    throw new Error(`Failed to save canonical data: ${updateError.message}`)
  }

  console.log(`[buildAndSaveCanonicalData] Canonical data saved successfully for case ${caseId}`)
}

buildAndSaveCanonicalData(caseId)
  .then(() => {
    console.log('✅ Canonical data fixed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Error fixing canonical data:', error)
    process.exit(1)
  })
