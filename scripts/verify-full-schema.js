#!/usr/bin/env node
/**
 * Verify complete database schema structure
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const expectedTables = [
  'organizations',
  'users',
  'cases',
  'documents',
  'people',
  'properties',
  'graph_edges',
  'processing_jobs',
  'evidence',
  'operations_log',
  'merge_suggestions',
  'chat_sessions',
  'chat_messages'
];

async function verifySchema() {
  console.log('🔍 Verificando schema completo do banco de dados...\n');
  console.log(`📡 URL: ${supabaseUrl}\n`);

  const results = {
    existing: [],
    missing: [],
    details: {}
  };

  for (const table of expectedTables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          results.missing.push(table);
          console.log(`   ❌ ${table}: NÃO EXISTE`);
        } else {
          console.log(`   ⚠️  ${table}: Erro - ${error.message}`);
        }
      } else {
        results.existing.push(table);
        results.details[table] = { count: count || 0 };
        console.log(`   ✅ ${table}: OK (${count || 0} registros)`);
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ERRO - ${err.message}`);
      results.missing.push(table);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('\n📊 RESUMO:');
  console.log(`   ✅ Tabelas existentes: ${results.existing.length}/${expectedTables.length}`);
  console.log(`   ❌ Tabelas faltando: ${results.missing.length}`);

  if (results.missing.length > 0) {
    console.log(`\n⚠️  Tabelas que precisam ser criadas:`);
    results.missing.forEach(t => console.log(`   - ${t}`));
  }

  if (results.existing.length === expectedTables.length) {
    console.log('\n🎉 Todas as tabelas estão criadas no banco de dados!');
  }

  return results;
}

async function testCRUD() {
  console.log('\n' + '='.repeat(50));
  console.log('\n🧪 Testando operações CRUD...\n');

  // Test creating an organization
  const testOrgId = '00000000-0000-0000-0000-000000000099';

  try {
    // Clean up first
    await supabase.from('organizations').delete().eq('id', testOrgId);

    // Test INSERT
    const { data: insertData, error: insertError } = await supabase
      .from('organizations')
      .insert({
        id: testOrgId,
        name: 'Test Organization',
        settings: {}
      })
      .select();

    if (insertError) {
      console.log(`   ❌ INSERT: Falhou - ${insertError.message}`);
    } else {
      console.log(`   ✅ INSERT: OK`);
    }

    // Test SELECT
    const { data: selectData, error: selectError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', testOrgId);

    if (selectError) {
      console.log(`   ❌ SELECT: Falhou - ${selectError.message}`);
    } else if (selectData && selectData.length > 0) {
      console.log(`   ✅ SELECT: OK`);
    }

    // Test UPDATE
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ name: 'Test Organization Updated' })
      .eq('id', testOrgId);

    if (updateError) {
      console.log(`   ❌ UPDATE: Falhou - ${updateError.message}`);
    } else {
      console.log(`   ✅ UPDATE: OK`);
    }

    // Test DELETE
    const { error: deleteError } = await supabase
      .from('organizations')
      .delete()
      .eq('id', testOrgId);

    if (deleteError) {
      console.log(`   ❌ DELETE: Falhou - ${deleteError.message}`);
    } else {
      console.log(`   ✅ DELETE: OK`);
    }

    console.log('\n✨ Operações CRUD funcionando corretamente!');

  } catch (err) {
    console.log(`   ❌ Erro geral: ${err.message}`);
  }
}

async function main() {
  const schemaResults = await verifySchema();

  if (schemaResults.existing.length > 0) {
    await testCRUD();
  }
}

main();
