#!/usr/bin/env node
/**
 * Test Gemini 3.0 and 2.5 Models
 * Tests the latest available models with the current API key
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

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

// Models to test (newest first)
const MODELS_TO_TEST = [
  // Gemini 3 (Preview - December 2025)
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', tier: '3.0' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', tier: '3.0' },

  // Gemini 2.5 (Stable)
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tier: '2.5' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', tier: '2.5' },
  { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', tier: '2.5' },

  // Gemini 2.0 (Legacy but stable)
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', tier: '2.0' },
  { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp', tier: '2.0' },
];

async function testModel(genAI, modelInfo) {
  const { id, name, tier } = modelInfo;

  try {
    const model = genAI.getGenerativeModel({ model: id });
    const startTime = Date.now();
    const result = await model.generateContent('Responda apenas: OK');
    const endTime = Date.now();

    const response = await result.response;
    const text = response.text().trim();

    return {
      model: id,
      name,
      tier,
      success: true,
      response: text,
      latency: endTime - startTime,
      tokens: response.usageMetadata?.totalTokenCount || 'N/A',
    };
  } catch (error) {
    return {
      model: id,
      name,
      tier,
      success: false,
      error: error.message.substring(0, 100),
    };
  }
}

async function main() {
  console.clear();
  log('\n='.repeat(70), colors.blue);
  log('  TESTE DE MODELOS GEMINI 3.0 / 2.5 / 2.0', colors.bold + colors.blue);
  log('='.repeat(70) + '\n', colors.blue);

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    log('ERRO: GEMINI_API_KEY nao encontrada no .env', colors.red);
    process.exit(1);
  }

  log(`API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`, colors.blue);
  log(`Testando ${MODELS_TO_TEST.length} modelos...\n`, colors.blue);

  const genAI = new GoogleGenerativeAI(apiKey);
  const results = [];

  for (const modelInfo of MODELS_TO_TEST) {
    process.stdout.write(`Testando ${modelInfo.name}... `);
    const result = await testModel(genAI, modelInfo);
    results.push(result);

    if (result.success) {
      log(`OK (${result.latency}ms)`, colors.green);
    } else {
      log(`FALHOU`, colors.red);
    }
  }

  // Summary
  log('\n' + '='.repeat(70), colors.blue);
  log('  RESULTADOS', colors.bold);
  log('='.repeat(70) + '\n', colors.blue);

  const successModels = results.filter(r => r.success);
  const failedModels = results.filter(r => !r.success);

  if (successModels.length > 0) {
    log('MODELOS FUNCIONANDO:', colors.green + colors.bold);
    for (const r of successModels) {
      log(`  [${r.tier}] ${r.name}`, colors.green);
      log(`       ID: ${r.model}`, colors.blue);
      log(`       Latencia: ${r.latency}ms | Tokens: ${r.tokens}`, colors.blue);
    }
  }

  if (failedModels.length > 0) {
    log('\nMODELOS COM FALHA:', colors.red + colors.bold);
    for (const r of failedModels) {
      log(`  [${r.tier}] ${r.name}`, colors.red);
      log(`       Erro: ${r.error}`, colors.yellow);
    }
  }

  // Recommendation
  log('\n' + '='.repeat(70), colors.blue);
  log('  RECOMENDACAO', colors.bold);
  log('='.repeat(70) + '\n', colors.blue);

  if (successModels.length === 0) {
    log('PROBLEMA: Nenhum modelo funcionou!', colors.red + colors.bold);
    log('\nPossiveis causas:', colors.yellow);
    log('  1. API key expirada - gere nova em: https://aistudio.google.com/app/apikey', colors.yellow);
    log('  2. API key sem permissao para esses modelos', colors.yellow);
    log('  3. Quota excedida - verifique em: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas', colors.yellow);
    process.exit(1);
  }

  // Find best working model
  const gemini3 = successModels.find(m => m.tier === '3.0');
  const gemini25 = successModels.find(m => m.tier === '2.5');
  const gemini20 = successModels.find(m => m.tier === '2.0');

  const bestModel = gemini3 || gemini25 || gemini20;

  log(`Melhor modelo disponivel: ${bestModel.name}`, colors.green + colors.bold);
  log(`Model ID para usar: ${bestModel.model}`, colors.blue);

  if (gemini3) {
    log('\nGemini 3.0 esta disponivel! Atualize os arquivos do worker para usar:', colors.green);
    log(`  model: '${gemini3.model}'`, colors.blue);
  } else if (gemini25) {
    log('\nGemini 2.5 esta disponivel. Recomendado atualizar para:', colors.green);
    log(`  model: '${gemini25.model}'`, colors.blue);
  }

  log('\n' + '='.repeat(70), colors.blue);
  log(`  ${successModels.length}/${MODELS_TO_TEST.length} modelos funcionando`, colors.bold);
  log('='.repeat(70) + '\n', colors.blue);

  // Return for programmatic use
  return {
    working: successModels.map(m => m.model),
    failed: failedModels.map(m => m.model),
    recommended: bestModel?.model,
  };
}

main().catch(error => {
  log(`\nErro: ${error.message}`, colors.red);
  process.exit(1);
});
