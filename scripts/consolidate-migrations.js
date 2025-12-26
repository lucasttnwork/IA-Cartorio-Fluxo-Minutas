#!/usr/bin/env node
/**
 * Consolidates all migration files into a single SQL file
 * for easy execution in Supabase SQL Editor
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function consolidateMigrations() {
  const migrationsDir = path.resolve(__dirname, '../supabase/migrations');
  const outputFile = path.resolve(__dirname, '../supabase/consolidated-migration.sql');

  console.log('🔍 Reading migrations from:', migrationsDir);

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('⚠️  No migration files found');
    return;
  }

  console.log(`📋 Found ${files.length} migration files:\n`);

  let consolidatedSQL = `-- ============================================================================
-- Minuta Canvas - Consolidated Database Migrations
-- Generated: ${new Date().toISOString()}
-- ============================================================================
--
-- This file contains all migrations consolidated into a single file.
-- Execute this in Supabase SQL Editor:
-- ${process.env.VITE_SUPABASE_URL?.replace('https://', 'https://supabase.com/dashboard/project/').replace('.supabase.co', '')}/sql/new
--
-- ============================================================================

`;

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`   📄 ${file}`);

    consolidatedSQL += `\n-- ============================================================================\n`;
    consolidatedSQL += `-- Migration: ${file}\n`;
    consolidatedSQL += `-- ============================================================================\n\n`;
    consolidatedSQL += sql;
    consolidatedSQL += `\n\n`;
  }

  fs.writeFileSync(outputFile, consolidatedSQL, 'utf8');

  console.log(`\n✅ Consolidated migration file created:`);
  console.log(`   📁 ${outputFile}`);
  console.log(`\n📝 Next steps:`);
  console.log(`   1. Open Supabase SQL Editor:`);
  console.log(`      https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/sql/new`);
  console.log(`   2. Copy and paste the contents of: supabase/consolidated-migration.sql`);
  console.log(`   3. Click "Run" to execute all migrations`);
  console.log(`   4. Generate TypeScript types: npm run generate-types\n`);
}

consolidateMigrations();
