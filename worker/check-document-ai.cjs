/**
 * Script para verificar e listar processors do Document AI disponíveis
 */

const { DocumentProcessorServiceClient } = require('@google-cloud/documentai');
require('dotenv').config();

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GOOGLE_PROJECT_ID;
const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.DOCUMENT_AI_LOCATION || 'us';

async function listProcessors() {
  console.log('🔍 Verificando processors do Document AI...\n');
  console.log(`Projeto: ${projectId}`);
  console.log(`Localização: ${location}`);
  console.log(`Credenciais: ${process.env.GOOGLE_APPLICATION_CREDENTIALS}\n`);

  if (!projectId) {
    console.error('❌ GOOGLE_CLOUD_PROJECT_ID não configurado');
    return;
  }

  try {
    const client = new DocumentProcessorServiceClient();
    const parent = `projects/${projectId}/locations/${location}`;

    console.log(`Buscando processors em: ${parent}\n`);

    const [processors] = await client.listProcessors({ parent });

    if (processors.length === 0) {
      console.log('⚠️  Nenhum processor encontrado neste projeto/localização');
      console.log('\nPossíveis razões:');
      console.log('1. Processor não foi criado ainda');
      console.log('2. Localização incorreta (tente "us", "eu", "asia-northeast1")');
      console.log('3. Service account não tem permissão');
      console.log('\n Para criar um processor:');
      console.log('https://console.cloud.google.com/ai/document-ai/processors');
      return;
    }

    console.log(`✅ Encontrados ${processors.length} processor(s):\n`);

    processors.forEach((processor, index) => {
      // Extrair apenas o ID do processor (última parte do nome)
      const processorId = processor.name.split('/').pop();

      console.log(`${index + 1}. ${processor.displayName || 'Sem nome'}`);
      console.log(`   ID: ${processorId}`);
      console.log(`   Tipo: ${processor.type}`);
      console.log(`   Estado: ${processor.state}`);
      console.log(`   Nome completo: ${processor.name}\n`);
    });

    console.log('\n📝 Para usar um processor, atualize o .env com:');
    const firstProcessorId = processors[0].name.split('/').pop();
    console.log(`DOCUMENT_AI_PROCESSOR_ID=${firstProcessorId}`);
    console.log(`DOCUMENT_AI_LOCATION=${location}`);

  } catch (error) {
    console.error('❌ Erro ao listar processors:', error.message);

    if (error.code === 7) {
      console.log('\n⚠️  Erro de permissão. Verifique:');
      console.log('1. Document AI API está habilitada');
      console.log('2. Service account tem role "Document AI API User"');
      console.log('\nHabilitar API:');
      console.log('https://console.cloud.google.com/apis/library/documentai.googleapis.com');
    } else if (error.code === 16) {
      console.log('\n⚠️  Erro de autenticação. Verifique:');
      console.log('1. GOOGLE_APPLICATION_CREDENTIALS aponta para o arquivo JSON correto');
      console.log('2. Arquivo JSON é válido');
    }
  }
}

listProcessors();
