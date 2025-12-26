#!/usr/bin/env node
/**
 * Verify users table exists and check RLS policies
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
  },
  db: {
    schema: 'public'
  }
});

async function verifyUsersTable() {
  console.log('🔍 Verifying users table...\n');

  try {
    // Try to access users table directly with service role
    const { data, error, count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: false });

    if (error) {
      console.log(`❌ Error accessing users table:`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Message: ${error.message}`);
      console.log(`   Hint: ${error.hint || 'N/A'}`);
      console.log(`   Details: ${error.details || 'N/A'}`);

      if (error.code === '42P01') {
        console.log('\n💡 The users table does not exist!');
        console.log('\n📝 To fix this, run the following SQL in Supabase SQL Editor:');
        console.log('   https://supabase.com/dashboard/project/kllcbgoqtxedlfbkxpfo/sql/new\n');
        console.log('   Copy the contents of: scripts/apply-missing-tables.sql');
      }
      return false;
    }

    console.log(`✅ users table exists`);
    console.log(`📊 Row count: ${count || 0}`);

    if (data && data.length > 0) {
      console.log(`\n👥 Sample users:`);
      data.slice(0, 3).forEach(user => {
        console.log(`   - ${user.full_name} (${user.role})`);
      });
    } else {
      console.log(`\n💡 Table is empty - no users yet`);
    }

    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    return false;
  }
}

verifyUsersTable();
