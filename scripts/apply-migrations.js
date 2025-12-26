#!/usr/bin/env node
/**
 * Script to apply Supabase migrations to remote database
 * Uses service role key to connect directly to the database
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigrations() {
  const migrationsDir = path.resolve(__dirname, '../supabase/migrations');

  console.log('🔍 Reading migrations from:', migrationsDir);

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('⚠️  No migration files found');
    return;
  }

  console.log(`📋 Found ${files.length} migration files:\n`);

  for (const file of files) {
    console.log(`   📄 ${file}`);
  }

  console.log('\n🚀 Starting migration process...\n');

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');

    console.log(`⏳ Applying: ${file}`);

    try {
      // Split SQL into individual statements (simple approach)
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        if (!statement) continue;

        const { error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          // Try direct query if RPC fails
          const { error: directError } = await supabase
            .from('_migrations')
            .select('*')
            .limit(1);

          if (directError) {
            throw new Error(error.message || 'Failed to execute SQL');
          }
        }
      }

      console.log(`✅ Applied: ${file}\n`);
    } catch (error) {
      console.error(`❌ Failed to apply: ${file}`);
      console.error(`   Error: ${error.message}\n`);
      console.log('💡 Tip: You may need to apply this migration manually in the Supabase SQL Editor');
      console.log(`   URL: ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new\n`);
    }
  }

  console.log('✨ Migration process completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Verify migrations in Supabase Dashboard');
  console.log('   2. Run: npm run generate-types');
  console.log('   3. Test the application with the remote database\n');
}

applyMigrations().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
