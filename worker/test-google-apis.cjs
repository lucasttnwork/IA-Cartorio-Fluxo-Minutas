#!/usr/bin/env node
/**
 * Script de Teste: Google APIs Configuration
 *
 * Este script valida a configuração das APIs do Google (Document AI e Gemini)
 * antes de iniciar o worker em produção.
 */

const { DocumentProcessorServiceClient } = require('@google-cloud/documentai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(message) {
  console.log('\n' + '='.repeat(70));
  log(message, colors.bold + colors.blue);
  console.log('='.repeat(70) + '\n');
}

// ============================================================================
// 1. VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE
// ============================================================================

async function validateEnvironmentVariables() {
  header('1. VALIDANDO VARIÁVEIS DE AMBIENTE');

  const requiredVars = {
    'SUPABASE_URL': process.env.SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'GEMINI_API_KEY': process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
  };

  const optionalVars = {
    'GOOGLE_CLOUD_PROJECT_ID': process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GOOGLE_PROJECT_ID,
    'GOOGLE_CLOUD_PROCESSOR_ID': process.env.GOOGLE_CLOUD_PROCESSOR_ID || process.env.DOCUMENT_AI_PROCESSOR_ID,
    'GOOGLE_CLOUD_LOCATION': process.env.GOOGLE_CLOUD_LOCATION || process.env.DOCUMENT_AI_LOCATION,
    'GOOGLE_APPLICATION_CREDENTIALS': process.env.GOOGLE_APPLICATION_CREDENTIALS,
  };

  let hasErrors = false;
  let hasWarnings = false;

  // Validar variáveis obrigatórias
  log('Variáveis Obrigatórias:', colors.bold);
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      log(`  ❌ ${key}: NÃO CONFIGURADA`, colors.red);
      hasErrors = true;
    } else {
      const maskedValue = value.substring(0, 10) + '...' + value.substring(value.length - 4);
      log(`  ✅ ${key}: ${maskedValue}`, colors.green);
    }
  }

  // Validar variáveis opcionais
  log('\nVariáveis Opcionais (Document AI):', colors.bold);
  for (const [key, value] of Object.entries(optionalVars)) {
    if (!value) {
      log(`  ⚠️  ${key}: NÃO CONFIGURADA`, colors.yellow);
      hasWarnings = true;
    } else {
      log(`  ✅ ${key}: ${value}`, colors.green);
    }
  }

  if (hasErrors) {
    log('\n❌ FALHA: Variáveis obrigatórias ausentes. Worker não vai iniciar.', colors.red);
    return false;
  }

  if (hasWarnings) {
    log('\n⚠️  AVISO: Document AI (OCR) estará desabilitado sem as variáveis opcionais.', colors.yellow);
  } else {
    log('\n✅ SUCESSO: Todas as variáveis configuradas!', colors.green);
  }

  return true;
}

// ============================================================================
// 2. VALIDAÇÃO DE CREDENCIAIS JSON (Document AI)
// ============================================================================

async function validateServiceAccountJSON() {
  header('2. VALIDANDO ARQUIVO DE CREDENCIAIS (Service Account JSON)');

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!credentialsPath) {
    log('⚠️  Variável GOOGLE_APPLICATION_CREDENTIALS não configurada.', colors.yellow);
    log('   Document AI (OCR) não funcionará sem este arquivo.', colors.yellow);
    return false;
  }

  // Resolve path relativo
  const resolvedPath = path.resolve(__dirname, credentialsPath);
  log(`Path configurado: ${credentialsPath}`, colors.blue);
  log(`Path resolvido: ${resolvedPath}`, colors.blue);

  // Verifica se o arquivo existe
  if (!fs.existsSync(resolvedPath)) {
    log('\n❌ FALHA: Arquivo de credenciais NÃO ENCONTRADO!', colors.red);
    log('   Baixe o arquivo JSON do Google Cloud Console.', colors.yellow);
    log('   Veja instruções em: GOOGLE_CLOUD_SETUP.md', colors.yellow);
    return false;
  }

  log('✅ Arquivo de credenciais encontrado!', colors.green);

  // Tenta ler e validar o JSON
  try {
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const json = JSON.parse(content);

    log('\nConteúdo do arquivo:', colors.blue);
    log(`  - Type: ${json.type}`, colors.green);
    log(`  - Project ID: ${json.project_id}`, colors.green);
    log(`  - Client Email: ${json.client_email}`, colors.green);
    log(`  - Private Key: ${json.private_key ? '[PRESENTE]' : '[AUSENTE]'}`, json.private_key ? colors.green : colors.red);

    // Valida campos essenciais
    if (!json.type || !json.project_id || !json.private_key || !json.client_email) {
      log('\n❌ FALHA: Arquivo JSON inválido ou incompleto.', colors.red);
      return false;
    }

    // Verifica se o project_id corresponde
    const expectedProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GOOGLE_PROJECT_ID;
    if (expectedProjectId && json.project_id !== expectedProjectId) {
      log(`\n⚠️  AVISO: Project ID no JSON (${json.project_id}) difere do esperado (${expectedProjectId})`, colors.yellow);
    }

    log('\n✅ SUCESSO: Arquivo de credenciais válido!', colors.green);
    return true;
  } catch (error) {
    log(`\n❌ FALHA: Erro ao ler arquivo JSON: ${error.message}`, colors.red);
    return false;
  }
}

// ============================================================================
// 3. TESTE DE CONEXÃO COM GEMINI API
// ============================================================================

async function testGeminiAPI() {
  header('3. TESTANDO GEMINI API');

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    log('❌ GEMINI_API_KEY não configurada. Teste abortado.', colors.red);
    return false;
  }

  try {
    log('Inicializando cliente Gemini...', colors.blue);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

    log('Enviando requisição de teste...', colors.blue);
    const result = await model.generateContent('Responda apenas: OK');
    const response = await result.response;
    const text = response.text();

    log('\nResposta recebida:', colors.green);
    log(`  ${text.trim()}`, colors.blue);

    // Validar metadados
    if (response.usageMetadata) {
      log('\nMetadados de uso:', colors.blue);
      log(`  - Tokens de entrada: ${response.usageMetadata.promptTokenCount}`, colors.green);
      log(`  - Tokens de saída: ${response.usageMetadata.candidatesTokenCount}`, colors.green);
      log(`  - Total: ${response.usageMetadata.totalTokenCount}`, colors.green);
    }

    log('\n✅ SUCESSO: Gemini API está funcionando!', colors.green);
    return true;
  } catch (error) {
    log(`\n❌ FALHA: ${error.message}`, colors.red);

    if (error.message.includes('API key')) {
      log('   Verifique se a API key é válida.', colors.yellow);
      log('   Gere nova key em: https://aistudio.google.com/app/apikey', colors.yellow);
    }

    return false;
  }
}

// ============================================================================
// 4. TESTE DE CONEXÃO COM DOCUMENT AI
// ============================================================================

async function testDocumentAI() {
  header('4. TESTANDO GOOGLE DOCUMENT AI');

  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GOOGLE_PROJECT_ID;
  const processorId = process.env.GOOGLE_CLOUD_PROCESSOR_ID || process.env.DOCUMENT_AI_PROCESSOR_ID;
  const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.DOCUMENT_AI_LOCATION || 'us';

  if (!projectId || !processorId) {
    log('⚠️  Variáveis de Document AI não configuradas. Teste pulado.', colors.yellow);
    return false;
  }

  const processorName = `projects/${projectId}/locations/${location}/processors/${processorId}`;
  log(`Processor: ${processorName}`, colors.blue);

  try {
    log('Inicializando cliente Document AI...', colors.blue);
    const client = new DocumentProcessorServiceClient();

    log('Enviando documento de teste...', colors.blue);

    // Documento de teste simples (1 página com texto)
    const testContent = Buffer.from('TESTE DE DOCUMENTO\nEste é um teste do Google Document AI OCR.\n\nCPF: 123.456.789-00').toString('base64');

    const [result] = await client.processDocument({
      name: processorName,
      rawDocument: {
        content: testContent,
        mimeType: 'text/plain',
      },
    });

    if (result.document && result.document.text) {
      log('\nTexto extraído:', colors.green);
      log(`  ${result.document.text.substring(0, 100)}...`, colors.blue);
      log(`\n  Páginas processadas: ${result.document.pages?.length || 0}`, colors.green);
      log(`  Confiança média: ${result.document.pages?.[0]?.blocks?.[0]?.layout?.confidence || 'N/A'}`, colors.green);
    }

    log('\n✅ SUCESSO: Document AI está funcionando!', colors.green);
    return true;
  } catch (error) {
    log(`\n❌ FALHA: ${error.message}`, colors.red);

    // Diagnosticar tipo de erro
    if (error.code === 7) {
      log('   Erro de permissão. Verifique:', colors.yellow);
      log('   1. Service account tem role "Document AI API User"', colors.yellow);
      log('   2. Document AI API está habilitada', colors.yellow);
    } else if (error.code === 16) {
      log('   Erro de autenticação. Verifique:', colors.yellow);
      log('   1. Arquivo JSON está correto', colors.yellow);
      log('   2. GOOGLE_APPLICATION_CREDENTIALS aponta para o arquivo', colors.yellow);
    } else if (error.code === 5) {
      log('   Processor não encontrado. Verifique:', colors.yellow);
      log('   1. DOCUMENT_AI_PROCESSOR_ID está correto', colors.yellow);
      log('   2. Processor existe no projeto', colors.yellow);
      log('   3. Location (região) está correta', colors.yellow);
    }

    return false;
  }
}

// ============================================================================
// MAIN: EXECUTAR TODOS OS TESTES
// ============================================================================

async function main() {
  console.clear();
  log('\n🔧 VALIDAÇÃO DE CONFIGURAÇÃO - GOOGLE APIS', colors.bold + colors.blue);
  log('Minuta Canvas Worker\n', colors.blue);

  const results = {
    env: false,
    json: false,
    gemini: false,
    documentAI: false,
  };

  // Executar testes sequencialmente
  results.env = await validateEnvironmentVariables();
  if (!results.env) {
    log('\n⛔ Testes abortados devido a erros críticos de configuração.', colors.red);
    process.exit(1);
  }

  results.json = await validateServiceAccountJSON();
  results.gemini = await testGeminiAPI();
  results.documentAI = await testDocumentAI();

  // Resumo final
  header('RESUMO DA VALIDAÇÃO');

  const tests = [
    { name: 'Variáveis de Ambiente', result: results.env, critical: true },
    { name: 'Service Account JSON', result: results.json, critical: false },
    { name: 'Gemini API', result: results.gemini, critical: true },
    { name: 'Document AI', result: results.documentAI, critical: false },
  ];

  tests.forEach(test => {
    const icon = test.result ? '✅' : (test.critical ? '❌' : '⚠️');
    const color = test.result ? colors.green : (test.critical ? colors.red : colors.yellow);
    log(`${icon} ${test.name}`, color);
  });

  const criticalFailed = tests.filter(t => t.critical && !t.result).length > 0;
  const optionalFailed = tests.filter(t => !t.critical && !t.result).length > 0;

  console.log('\n' + '='.repeat(70));

  if (criticalFailed) {
    log('❌ FALHA CRÍTICA: Worker não pode iniciar.', colors.red + colors.bold);
    log('   Corrija os erros acima antes de prosseguir.', colors.yellow);
    process.exit(1);
  } else if (optionalFailed) {
    log('⚠️  PARCIALMENTE PRONTO: Worker pode iniciar com funcionalidades limitadas.', colors.yellow + colors.bold);
    log('   Document AI (OCR) estará desabilitado.', colors.yellow);
    log('   Apenas jobs do Gemini (extraction, draft) funcionarão.', colors.yellow);
    process.exit(0);
  } else {
    log('✅ TUDO PRONTO: Todas as APIs configuradas e funcionando!', colors.green + colors.bold);
    log('   Worker pode processar todos os tipos de jobs.', colors.green);
    log('   Inicie com: npm run dev', colors.blue);
    process.exit(0);
  }
}

// Executar
main().catch(error => {
  console.error(colors.red + '\n❌ Erro inesperado:', error.message, colors.reset);
  process.exit(1);
});
