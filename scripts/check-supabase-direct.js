#!/usr/bin/env node
/**
 * Check Supabase directly via REST API
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

async function checkDirect() {
  console.log('🔍 Verificando Supabase diretamente via REST API...\n');
  console.log(`📡 URL: ${supabaseUrl}`);
  console.log(`🔑 Service Key: ${supabaseServiceKey?.substring(0, 20)}...`);
  console.log(`🔑 Anon Key: ${supabaseAnonKey?.substring(0, 20)}...\n`);

  // Check if we can reach the API
  try {
    const healthResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    });

    console.log(`📡 API Health: ${healthResponse.status} ${healthResponse.statusText}`);

    if (healthResponse.ok) {
      const schema = await healthResponse.json();
      console.log('\n📊 Tabelas expostas via REST API:');

      if (schema.definitions) {
        const tables = Object.keys(schema.definitions);
        if (tables.length === 0) {
          console.log('   ⚠️  Nenhuma tabela encontrada no schema!');
        } else {
          tables.forEach(t => console.log(`   - ${t}`));
        }
      } else if (schema.paths) {
        const paths = Object.keys(schema.paths).filter(p => p !== '/');
        if (paths.length === 0) {
          console.log('   ⚠️  Nenhuma tabela encontrada!');
        } else {
          paths.forEach(p => console.log(`   - ${p.replace('/', '')}`));
        }
      } else {
        console.log('   Resposta:', JSON.stringify(schema, null, 2).substring(0, 500));
      }
    }
  } catch (err) {
    console.log(`❌ Erro ao acessar API: ${err.message}`);
  }

  // Try to query each table directly
  console.log('\n' + '='.repeat(50));
  console.log('\n🔍 Testando acesso direto às tabelas:\n');

  const tables = ['organizations', 'cases', 'users', 'documents'];

  for (const table of tables) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        console.log(`   ✅ ${table}: Acessível (${response.status})`);
      } else {
        console.log(`   ❌ ${table}: ${data.message || data.error || response.statusText}`);
        if (data.code) console.log(`      Código: ${data.code}`);
        if (data.hint) console.log(`      Dica: ${data.hint}`);
      }
    } catch (err) {
      console.log(`   ❌ ${table}: Erro - ${err.message}`);
    }
  }

  // Check OpenAPI schema
  console.log('\n' + '='.repeat(50));
  console.log('\n🔍 Verificando OpenAPI Schema:\n');

  try {
    const openApiResponse = await fetch(`${supabaseUrl}/rest/v1/?apikey=${supabaseServiceKey}`);
    const openApi = await openApiResponse.json();

    if (openApi.paths) {
      const endpoints = Object.keys(openApi.paths);
      console.log(`   Endpoints disponíveis: ${endpoints.length}`);

      if (endpoints.length <= 5) {
        endpoints.forEach(e => console.log(`   - ${e}`));
        console.log('\n   ⚠️  Poucas ou nenhuma tabela disponível!');
        console.log('   📝 O schema do banco pode estar vazio.');
      } else {
        console.log('   Primeiros 10 endpoints:');
        endpoints.slice(0, 10).forEach(e => console.log(`   - ${e}`));
      }
    }
  } catch (err) {
    console.log(`   ❌ Erro: ${err.message}`);
  }
}

checkDirect();
