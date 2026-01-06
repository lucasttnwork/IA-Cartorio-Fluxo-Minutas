const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const modelsToTest = [
  // Gemini 3 (mais recente - preview)
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',

  // Gemini 2.5 (GA estável - recomendado para produção)
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.5-flash-lite',

  // Gemini 2.0 (disponível mas pode estar deprecated)
  'gemini-2.0-flash-exp',
  'gemini-2.0-flash',
];

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent('Test');
    const response = await result.response;
    console.log(`✅ ${modelName}: FUNCIONA`);
    return true;
  } catch (error) {
    console.log(`❌ ${modelName}: ${error.message.substring(0, 100)}`);
    return false;
  }
}

async function main() {
  console.log('Testando modelos Gemini disponíveis...\n');

  for (const modelName of modelsToTest) {
    await testModel(modelName);
  }
}

main();
