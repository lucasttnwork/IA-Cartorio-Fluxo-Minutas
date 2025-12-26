#!/usr/bin/env node
/**
 * Execute SQL migration directly via PostgreSQL connection
 */

import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const projectRef = 'kllcbgoqtxedlfbkxpfo';
const password = process.env.SUPABASE_PASSWORD;

// Try multiple connection formats
const connectionStrings = [
  // Direct connection
  `postgresql://postgres:${password}@db.${projectRef}.supabase.co:5432/postgres`,
  // Pooler connection (session mode)
  `postgresql://postgres.${projectRef}:${password}@aws-0-sa-east-1.pooler.supabase.com:5432/postgres`,
  // Alternative pooler port
  `postgresql://postgres.${projectRef}:${password}@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`,
];

async function tryConnection(connectionString, index) {
  console.log(`\n🔄 Tentativa ${index + 1}: ${connectionString.replace(password, '****').substring(0, 70)}...`);

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000
  });

  try {
    await client.connect();
    console.log('✅ Conectado!');
    return client;
  } catch (error) {
    console.log(`❌ Falhou: ${error.message}`);
    return null;
  }
}

async function executeMigration() {
  console.log('🚀 Tentando conectar ao PostgreSQL do Supabase...');
  console.log(`📋 Projeto: ${projectRef}`);
  console.log(`🔑 Senha: ${password ? password.substring(0, 3) + '***' : 'NÃO DEFINIDA'}\n`);

  let client = null;

  // Try each connection string
  for (let i = 0; i < connectionStrings.length; i++) {
    client = await tryConnection(connectionStrings[i], i);
    if (client) break;
  }

  if (!client) {
    console.log('\n❌ Não foi possível conectar ao banco de dados.');
    console.log('\n💡 SOLUÇÃO ALTERNATIVA:');
    console.log('   1. Abra: https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/sql/new');
    console.log('   2. Copie o conteúdo de: supabase/EXECUTE_IN_SUPABASE.sql');
    console.log('   3. Cole no editor e clique em "Run"');
    return;
  }

  try {
    // Read the SQL file
    const sqlPath = path.resolve(__dirname, '../supabase/EXECUTE_TABLES_ONLY.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log(`\n📄 Executando SQL (${sql.length} caracteres)...\n`);

    // Execute the entire SQL
    await client.query(sql);

    console.log('✅ Migração executada com sucesso!\n');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    console.log('📊 Tabelas criadas:');
    result.rows.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

    console.log(`\n🎉 Total: ${result.rows.length} tabelas no schema public`);

  } catch (error) {
    console.log(`\n❌ Erro ao executar SQL: ${error.message}`);

    if (error.position) {
      console.log(`   Posição: ${error.position}`);
    }

  } finally {
    await client.end();
    console.log('\n📡 Conexão encerrada.');
  }
}

executeMigration();
