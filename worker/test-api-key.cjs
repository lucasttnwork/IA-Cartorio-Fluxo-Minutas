#!/usr/bin/env node
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('API Key:', apiKey);
  console.log('Tamanho:', apiKey ? apiKey.length : 0);

  if (!apiKey) {
    console.log('ERRO: API Key nao encontrada');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  try {
    console.log('\nTestando gemini-2.0-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent('Hello');
    console.log('Sucesso:', result.response.text());
  } catch (error) {
    console.log('\n=== ERRO COMPLETO ===');
    console.log('Mensagem:', error.message);
    console.log('\n=== STATUS ===');
    if (error.status) console.log('Status:', error.status);
    if (error.statusText) console.log('StatusText:', error.statusText);
    if (error.errorDetails) console.log('Details:', JSON.stringify(error.errorDetails, null, 2));
  }
}

test();
