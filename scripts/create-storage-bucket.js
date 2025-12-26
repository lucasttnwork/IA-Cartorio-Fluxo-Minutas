#!/usr/bin/env node
/**
 * Create Storage bucket for documents
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

async function createBucket() {
  console.log('🗂️  Criando Storage bucket "documents"...\n');

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.log(`❌ Erro ao listar buckets: ${listError.message}`);
      return;
    }

    const documentsBucket = buckets.find(b => b.name === 'documents');

    if (documentsBucket) {
      console.log('✅ Bucket "documents" já existe!');
      console.log(`   ID: ${documentsBucket.id}`);
      console.log(`   Público: ${documentsBucket.public ? 'Sim' : 'Não'}`);
      console.log(`   Criado em: ${documentsBucket.created_at}`);
      return;
    }

    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('documents', {
      public: false,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/tiff',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    });

    if (error) {
      console.log(`❌ Erro ao criar bucket: ${error.message}`);
      return;
    }

    console.log('✅ Bucket "documents" criado com sucesso!');
    console.log(`   Nome: ${data.name}`);
    console.log(`   Público: Não (privado)`);
    console.log(`   Limite de tamanho: 50MB`);
    console.log(`   Tipos permitidos: PDF, JPEG, PNG, WebP, TIFF, DOC, DOCX`);

  } catch (error) {
    console.log(`❌ Erro: ${error.message}`);
  }
}

createBucket();
