#!/usr/bin/env node
/**
 * Check database schema and tables
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

async function checkSchema() {
  console.log('🔍 Checking database schema...\n');

  try {
    // Query to list all tables in public schema
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `
    });

    if (error) {
      // Try alternative approach using PostgREST metadata
      console.log('Using PostgREST metadata to check tables...\n');

      const tables = [
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

      for (const table of tables) {
        try {
          const { error: tableError } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

          if (tableError) {
            console.log(`   ❌ ${table}: NOT FOUND (${tableError.code})`);
          } else {
            console.log(`   ✅ ${table}: EXISTS`);
          }
        } catch (err) {
          console.log(`   ❌ ${table}: ERROR - ${err.message}`);
        }
      }
      return;
    }

    console.log('Tables in public schema:');
    console.log('------------------------');
    data.forEach(row => {
      console.log(`   ✅ ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkSchema();
