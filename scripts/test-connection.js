#!/usr/bin/env node
/**
 * Test connection to remote Supabase database
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

console.log('🔍 Testing Supabase connection...\n');
console.log(`URL: ${supabaseUrl}`);
console.log(`Service Key: ${supabaseServiceKey?.substring(0, 20)}...`);
console.log('');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    console.log('📡 Connecting to Supabase...');

    // Test basic connection
    const { data, error } = await supabase
      .from('cases')
      .select('count', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01') {
        console.log('⚠️  Connection successful, but table "cases" does not exist');
        console.log('📝 You need to apply migrations first!');
        console.log('\nFollow these steps:');
        console.log('1. Open: https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/sql/new');
        console.log('2. Copy contents from: supabase/consolidated-migration.sql');
        console.log('3. Paste and Run in SQL Editor');
        console.log('4. Run: npm run generate-types\n');
        return false;
      }
      throw error;
    }

    console.log('✅ Connection successful!');
    console.log(`📊 Cases table exists (${data || 0} rows)`);

    // Test other key tables
    const tables = ['documents', 'people', 'properties', 'processing_jobs', 'graph_edges'];
    console.log('\n🔍 Checking other tables...');

    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });

      if (tableError) {
        console.log(`   ❌ ${table}: NOT FOUND`);
      } else {
        console.log(`   ✅ ${table}: OK`);
      }
    }

    console.log('\n✨ Database is ready to use!');
    return true;

  } catch (error) {
    console.error('❌ Connection failed:');
    console.error(`   ${error.message}`);
    return false;
  }
}

testConnection();
