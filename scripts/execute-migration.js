#!/usr/bin/env node
/**
 * Execute SQL migration directly on Supabase
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const projectRef = 'kllcbgoqtxedlfbkxpfo';
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

async function executeMigration() {
  console.log('🚀 Executando migração no Supabase...\n');

  // Read the SQL file
  const sqlPath = path.resolve(__dirname, '../supabase/EXECUTE_IN_SUPABASE.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log(`📄 SQL file loaded: ${sql.length} characters\n`);

  try {
    // Use Supabase Management API to execute SQL
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sql })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Erro na API: ${response.status} ${response.statusText}`);
      console.log(`   Resposta: ${errorText}`);

      // Try alternative approach - split into smaller queries
      console.log('\n🔄 Tentando abordagem alternativa...\n');
      await executeInChunks(sql);
      return;
    }

    const result = await response.json();
    console.log('✅ Migração executada com sucesso!');
    console.log('📊 Resultado:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
    console.log('\n🔄 Tentando abordagem alternativa...\n');
    await executeInChunks(sql);
  }
}

async function executeInChunks(fullSql) {
  // Split SQL into individual statements
  const statements = fullSql
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📦 Dividido em ${statements.length} statements\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';

    // Skip comments-only statements
    if (stmt.replace(/--[^\n]*/g, '').trim() === ';') continue;

    try {
      const response = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: stmt })
        }
      );

      if (response.ok) {
        successCount++;
        // Show progress every 10 statements
        if (successCount % 10 === 0) {
          console.log(`   ✅ ${successCount} statements executados...`);
        }
      } else {
        const errorText = await response.text();
        // Only log actual errors, not "already exists" type errors
        if (!errorText.includes('already exists') && !errorText.includes('duplicate')) {
          errorCount++;
          if (errorCount <= 5) {
            console.log(`   ⚠️  Statement ${i + 1}: ${errorText.substring(0, 100)}`);
          }
        }
      }
    } catch (err) {
      errorCount++;
    }
  }

  console.log(`\n📊 Resultado: ${successCount} sucesso, ${errorCount} erros`);
}

executeMigration();
