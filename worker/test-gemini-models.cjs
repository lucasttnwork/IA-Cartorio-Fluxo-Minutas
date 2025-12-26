#!/usr/bin/env node
/**
 * Script de Teste: Gemini Models Availability
 *
 * Este script testa a disponibilidade e funcionalidade de diferentes modelos Gemini
 * com a API key configurada.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Cores para output no terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
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
// TESTE DE MODELOS GEMINI
// ============================================================================

const MODELS_TO_TEST = [
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-exp-1206',
  'gemini-exp-1121',
];

async function testModel(genAI, modelName) {
  const testPrompt = 'Responda apenas com: OK';

  try {
    log(`Testing ${modelName}...`, colors.blue);

    const model = genAI.getGenerativeModel({ model: modelName });

    const startTime = Date.now();
    const result = await model.generateContent(testPrompt, {
      timeout: 30000, // 30 segundos de timeout
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    const response = await result.response;
    const text = response.text();

    // Obter informações de uso
    const usageMetadata = response.usageMetadata;

    return {
      success: true,
      modelName,
      response: text.trim(),
      duration,
      tokens: {
        input: usageMetadata?.promptTokenCount || 0,
        output: usageMetadata?.candidatesTokenCount || 0,
        total: usageMetadata?.totalTokenCount || 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      modelName,
      error: error.message,
      errorCode: error.status || 'UNKNOWN',
    };
  }
}

async function main() {
  console.clear();
  log('\n🤖 TESTE DE MODELOS GEMINI', colors.bold + colors.magenta);
  log('Minuta Canvas Worker\n', colors.magenta);

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    log('❌ ERRO: GEMINI_API_KEY não configurada!', colors.red);
    log('   Configure a variável de ambiente GEMINI_API_KEY', colors.yellow);
    process.exit(1);
  }

  log(`✅ API Key detectada (primeiros 10 chars): ${apiKey.substring(0, 10)}...`, colors.green);

  header('TESTANDO MODELOS GEMINI');

  const genAI = new GoogleGenerativeAI(apiKey);
  const results = [];

  // Testar cada modelo sequencialmente
  for (const modelName of MODELS_TO_TEST) {
    const result = await testModel(genAI, modelName);
    results.push(result);

    if (result.success) {
      log(`  ✅ ${result.modelName}`, colors.green);
      log(`     Response: "${result.response}"`, colors.green);
      log(`     Duration: ${result.duration}ms`, colors.green);
      log(`     Tokens: input=${result.tokens.input}, output=${result.tokens.output}, total=${result.tokens.total}`, colors.green);
    } else {
      log(`  ❌ ${result.modelName}`, colors.red);
      log(`     Error: ${result.error}`, colors.red);
      log(`     Code: ${result.errorCode}`, colors.red);
    }
    console.log();
  }

  // Resumo
  header('RESUMO DOS TESTES');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  log(`Modelos Funcionais: ${successful.length}/${MODELS_TO_TEST.length}`,
    successful.length > 0 ? colors.green : colors.red);

  if (successful.length > 0) {
    log('\n✅ Modelos disponíveis:', colors.green);
    successful.forEach(r => {
      log(`   • ${r.modelName} (${r.duration}ms, ${r.tokens.total} tokens)`, colors.green);
    });
  }

  if (failed.length > 0) {
    log('\n❌ Modelos indisponíveis:', colors.red);
    failed.forEach(r => {
      const errorMsg = r.error.includes('not found') ? 'Model not found' :
                       r.error.includes('not enabled') ? 'API not enabled' :
                       r.error.includes('PERMISSION_DENIED') ? 'Permission denied' :
                       r.error.includes('quota') ? 'Quota exceeded' :
                       r.error;
      log(`   • ${r.modelName} (${errorMsg})`, colors.red);
    });
  }

  console.log('\n' + '='.repeat(70));

  if (successful.length === 0) {
    log('❌ FALHA: Nenhum modelo Gemini está acessível!', colors.red + colors.bold);
    log('   Verifique:', colors.yellow);
    log('   1. API key é válida', colors.yellow);
    log('   2. Gemini API está habilitada no Google Cloud', colors.yellow);
    log('   3. Cota de requisições não foi excedida', colors.yellow);
    process.exit(1);
  } else {
    log(`✅ SUCESSO: ${successful.length} modelo(s) disponível(is)!`, colors.green + colors.bold);
    const fastestModel = successful.reduce((prev, current) =>
      prev.duration < current.duration ? prev : current
    );
    log(`   Modelo mais rápido: ${fastestModel.modelName} (${fastestModel.duration}ms)`, colors.blue);
    process.exit(0);
  }
}

// Executar
main().catch(error => {
  log(`\n❌ Erro inesperado: ${error.message}`, colors.red + colors.bold);
  console.error(error);
  process.exit(1);
});
