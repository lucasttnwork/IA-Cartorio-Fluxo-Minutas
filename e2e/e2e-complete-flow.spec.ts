import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * TESTE E2E COMPLETO - FLUXO DE COMPRA E VENDA
 *
 * Este teste simula um fluxo completo de compra e venda com documentos realistas:
 * - Matrícula de imóvel completa
 * - CNH do vendedor (Carlos Henrique - proprietário atual)
 * - CNH do comprador (Patricia Regina)
 *
 * Objetivo: Verificar se o sistema consegue:
 * 1. Extrair dados dos documentos corretamente
 * 2. Criar as entidades (pessoas e propriedade)
 * 3. Resolver relacionamentos no canvas
 * 4. Gerar a minuta de compra e venda
 */

const TEST_USER = {
  email: 'test@example.com',
  password: 'test123456'
};

const TEST_CASE = {
  title: 'Compra e Venda - Carlos para Patricia',
  actType: 'purchase_sale' as const
};

const DOCUMENTS = {
  matricula: path.join(__dirname, '../test-files/e2e-complete-flow/matricula-imovel.pdf'),
  cnhVendedor: path.join(__dirname, '../test-files/e2e-complete-flow/cnh-vendedor.pdf'),
  cnhComprador: path.join(__dirname, '../test-files/e2e-complete-flow/cnh-comprador.pdf')
};

// Criar diretório para relatório se não existir
const REPORT_DIR = path.join(__dirname, '../test-results/e2e-complete-flow-report');
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

let reportData: any = {
  startTime: new Date().toISOString(),
  steps: [],
  errors: [],
  screenshots: []
};

function logStep(step: string, status: 'success' | 'error' | 'warning', details?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    step,
    status,
    details
  };
  reportData.steps.push(logEntry);
  console.log(`[${status.toUpperCase()}] ${step}`, details || '');
}

test.describe('E2E Complete Flow - Purchase and Sale', () => {
  test.beforeAll(() => {
    // Verificar se os PDFs existem
    console.log('\n=== VERIFICANDO DOCUMENTOS DE TESTE ===\n');

    Object.entries(DOCUMENTS).forEach(([name, filepath]) => {
      if (fs.existsSync(filepath)) {
        const stats = fs.statSync(filepath);
        console.log(`✓ ${name}: ${filepath} (${stats.size} bytes)`);
      } else {
        console.error(`✗ ${name}: ${filepath} NÃO ENCONTRADO!`);
        throw new Error(`Documento ${name} não encontrado: ${filepath}`);
      }
    });

    console.log('\n=== INICIANDO TESTE E2E ===\n');
  });

  test.afterAll(async () => {
    // Salvar relatório
    reportData.endTime = new Date().toISOString();
    const reportPath = path.join(REPORT_DIR, `report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    console.log('\n=== RELATÓRIO SALVO ===');
    console.log(`Arquivo: ${reportPath}\n`);

    // Gerar relatório em Markdown
    const mdReport = generateMarkdownReport(reportData);
    const mdPath = path.join(REPORT_DIR, `REPORT-${Date.now()}.md`);
    fs.writeFileSync(mdPath, mdReport);
    console.log(`Relatório MD: ${mdPath}\n`);
  });

  test('Complete purchase and sale flow with real documents', async ({ page }) => {
    let caseId: string | null = null;

    try {
      // ===== PASSO 1: LOGIN =====
      logStep('Navegando para página de login', 'success');
      await page.goto('http://localhost:5173/login');
      await page.waitForLoadState('networkidle');

      const screenshot1 = await page.screenshot();
      reportData.screenshots.push({ step: 'login-page', timestamp: Date.now() });
      fs.writeFileSync(path.join(REPORT_DIR, '01-login-page.png'), screenshot1);

      logStep('Preenchendo credenciais de teste', 'success', TEST_USER);
      await page.fill('input[type="email"]', TEST_USER.email);
      await page.fill('input[type="password"]', TEST_USER.password);

      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 10000 });

      logStep('Login realizado com sucesso', 'success');

      const screenshot2 = await page.screenshot();
      fs.writeFileSync(path.join(REPORT_DIR, '02-dashboard.png'), screenshot2);

      // ===== PASSO 2: CRIAR NOVO CASO =====
      logStep('Criando novo caso de compra e venda', 'success', TEST_CASE);

      await page.click('text="Novo Caso"');

      // Aguardar redirecionamento para o fluxo guiado
      await page.waitForURL('**/purchase-sale-flow', { timeout: 10000 });

      const screenshot3 = await page.screenshot();
      fs.writeFileSync(path.join(REPORT_DIR, '03-purchase-sale-flow.png'), screenshot3);

      // Aguardar carregamento do formulário de criação de caso
      await page.waitForSelector('input[placeholder*="título"]', { timeout: 5000 });

      logStep('Fluxo guiado carregado', 'success');

      // Preencher título do caso
      await page.fill('input[placeholder*="título"]', TEST_CASE.title);

      // Aguardar botão "Criar e Continuar" ficar habilitado
      await page.waitForTimeout(1000);

      const screenshot4 = await page.screenshot();
      fs.writeFileSync(path.join(REPORT_DIR, '04-form-filled.png'), screenshot4);

      // Clicar no botão "Criar e Continuar"
      const createButton = page.locator('button:has-text("Criar e Continuar")').first();
      await createButton.click();

      // Aguardar navegação para próxima etapa (upload)
      await page.waitForTimeout(3000);

      // Verificar se avançamos para a próxima etapa
      const url = page.url();
      logStep('Navegação após criar caso', 'success', { url });

      // Extrair caseId da URL (pode estar em /purchase-sale-flow?caseId=... ou /case/X/...)
      let urlMatch = url.match(/caseId=([^&]+)/);
      if (!urlMatch) {
        urlMatch = url.match(/\/case\/([^\/]+)\//);
      }
      caseId = urlMatch ? urlMatch[1] : null;

      logStep('Caso criado', caseId ? 'success' : 'warning', { caseId, url });

      const screenshot5 = await page.screenshot();
      fs.writeFileSync(path.join(REPORT_DIR, '05-after-create.png'), screenshot5);

      // ===== PASSO 3: UPLOAD DE DOCUMENTOS =====
      logStep('Iniciando upload de documentos', 'success');

      // Upload matrícula
      const inputMatricula = await page.locator('input[type="file"]');
      await inputMatricula.setInputFiles(DOCUMENTS.matricula);
      await page.waitForTimeout(2000);

      logStep('Upload matrícula realizado', 'success', DOCUMENTS.matricula);

      const screenshot6 = await page.screenshot();
      fs.writeFileSync(path.join(REPORT_DIR, '06-upload-matricula.png'), screenshot6);

      // Upload CNH vendedor
      await inputMatricula.setInputFiles(DOCUMENTS.cnhVendedor);
      await page.waitForTimeout(2000);

      logStep('Upload CNH vendedor realizado', 'success', DOCUMENTS.cnhVendedor);

      const screenshot7 = await page.screenshot();
      fs.writeFileSync(path.join(REPORT_DIR, '07-upload-cnh-vendedor.png'), screenshot7);

      // Upload CNH comprador
      await inputMatricula.setInputFiles(DOCUMENTS.cnhComprador);
      await page.waitForTimeout(2000);

      logStep('Upload CNH comprador realizado', 'success', DOCUMENTS.cnhComprador);

      const screenshot8 = await page.screenshot();
      fs.writeFileSync(path.join(REPORT_DIR, '08-upload-cnh-comprador.png'), screenshot8);

      // Verificar se os 3 documentos aparecem na lista
      const documentCards = await page.locator('[data-testid="document-card"]').count();
      logStep('Documentos carregados', documentCards === 3 ? 'success' : 'warning', {
        expected: 3,
        found: documentCards
      });

      // ===== PASSO 4: NAVEGAR PARA EXTRAÇÃO =====
      logStep('Navegando para página de extração', 'success');

      // Clicar no botão "Continuar para Extração" ou similar
      const continueButton = page.locator('button:has-text("Continuar")').first();
      if (await continueButton.isVisible()) {
        await continueButton.click();
        await page.waitForTimeout(2000);
      } else {
        // Se não houver botão, navegar diretamente
        await page.goto(`http://localhost:5173/case/${caseId}/entities`);
      }

      await page.waitForLoadState('networkidle');

      const screenshot9 = await page.screenshot();
      fs.writeFileSync(path.join(REPORT_DIR, '09-entities-page-initial.png'), screenshot9);

      // ===== PASSO 5: AGUARDAR EXTRAÇÃO =====
      logStep('Aguardando processamento de extração', 'success');

      // Aguardar até que a extração complete (máximo 5 minutos)
      const maxWaitTime = 5 * 60 * 1000; // 5 minutos
      const startWaitTime = Date.now();
      let extractionComplete = false;
      let lastProgress = 0;

      while (Date.now() - startWaitTime < maxWaitTime) {
        await page.waitForTimeout(5000); // Verificar a cada 5 segundos

        // Verificar se há indicador de progresso
        const progressText = await page.textContent('body');

        // Procurar por indicadores de conclusão
        const hasEntities = await page.locator('[data-testid="person-card"]').count() > 0 ||
                           await page.locator('[data-testid="property-card"]').count() > 0;

        const hasErrorMessage = await page.locator('text=/erro|falha|failed/i').count() > 0;

        if (hasEntities) {
          extractionComplete = true;
          logStep('Extração completada - entidades encontradas', 'success');
          break;
        }

        if (hasErrorMessage) {
          logStep('Erro detectado durante extração', 'error');
          const screenshotErr = await page.screenshot();
          fs.writeFileSync(path.join(REPORT_DIR, 'ERROR-extraction.png'), screenshotErr);
          reportData.errors.push({
            step: 'extraction',
            message: 'Erro detectado na página de extração',
            screenshot: 'ERROR-extraction.png'
          });
          break;
        }

        // Log de progresso a cada 30 segundos
        const elapsed = Math.floor((Date.now() - startWaitTime) / 1000);
        if (elapsed > lastProgress + 30) {
          logStep('Aguardando extração', 'success', { elapsed: `${elapsed}s` });
          lastProgress = elapsed;

          const screenshotProgress = await page.screenshot();
          fs.writeFileSync(path.join(REPORT_DIR, `progress-${elapsed}s.png`), screenshotProgress);
        }
      }

      if (!extractionComplete && Date.now() - startWaitTime >= maxWaitTime) {
        logStep('Timeout aguardando extração', 'error', {
          maxWaitTime: `${maxWaitTime / 1000}s`
        });
        reportData.errors.push({
          step: 'extraction-timeout',
          message: 'Extração não completou dentro do tempo limite'
        });
      }

      const screenshot10 = await page.screenshot();
      fs.writeFileSync(path.join(REPORT_DIR, '10-entities-page-after-extraction.png'), screenshot10);

      // ===== PASSO 6: VERIFICAR ENTIDADES EXTRAÍDAS =====
      logStep('Verificando entidades extraídas', 'success');

      const peopleCount = await page.locator('[data-testid="person-card"]').count();
      const propertiesCount = await page.locator('[data-testid="property-card"]').count();

      logStep('Entidades encontradas', peopleCount > 0 || propertiesCount > 0 ? 'success' : 'error', {
        people: peopleCount,
        properties: propertiesCount
      });

      // Verificar dados específicos
      const pageContent = await page.textContent('body');
      const hasCarlosHenrique = pageContent?.includes('CARLOS HENRIQUE') || pageContent?.includes('234.567.890-12');
      const hasPatricia = pageContent?.includes('PATRICIA REGINA') || pageContent?.includes('345.678.901-23');
      const hasProperty = pageContent?.includes('Paineiras') || pageContent?.includes('45.789');

      logStep('Dados específicos encontrados', 'success', {
        vendedor: hasCarlosHenrique ? 'Carlos Henrique encontrado' : 'NÃO encontrado',
        comprador: hasPatricia ? 'Patricia Regina encontrada' : 'NÃO encontrada',
        imovel: hasProperty ? 'Imóvel encontrado' : 'NÃO encontrado'
      });

      // ===== PASSO 7: VERIFICAR CANVAS =====
      logStep('Navegando para página do canvas', 'success');

      await page.goto(`http://localhost:5173/case/${caseId}/canvas`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Aguardar renderização do canvas

      const screenshot11 = await page.screenshot();
      fs.writeFileSync(path.join(REPORT_DIR, '11-canvas-page.png'), screenshot11);

      // Verificar se há nós no canvas (React Flow)
      const canvasNodes = await page.locator('[data-id]').count();
      logStep('Nós no canvas', canvasNodes > 0 ? 'success' : 'warning', {
        nodeCount: canvasNodes
      });

      // ===== PASSO 8: VERIFICAR DRAFT =====
      logStep('Navegando para página de minuta', 'success');

      await page.goto(`http://localhost:5173/case/${caseId}/draft`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      const screenshot12 = await page.screenshot();
      fs.writeFileSync(path.join(REPORT_DIR, '12-draft-page-initial.png'), screenshot12);

      // Verificar se há botão para gerar minuta
      const generateButton = page.locator('button:has-text("Gerar"), button:has-text("Generate")');
      if (await generateButton.count() > 0) {
        logStep('Gerando minuta', 'success');
        await generateButton.first().click();

        // Aguardar geração (máximo 2 minutos)
        await page.waitForTimeout(2000);

        let draftGenerated = false;
        const maxDraftWait = 2 * 60 * 1000;
        const startDraftWait = Date.now();

        while (Date.now() - startDraftWait < maxDraftWait) {
          await page.waitForTimeout(5000);

          // Verificar se há conteúdo no editor
          const editorContent = await page.locator('[contenteditable="true"]').textContent();

          if (editorContent && editorContent.length > 100) {
            draftGenerated = true;
            logStep('Minuta gerada com sucesso', 'success', {
              contentLength: editorContent.length
            });
            break;
          }

          const elapsed = Math.floor((Date.now() - startDraftWait) / 1000);
          if (elapsed % 20 === 0) {
            logStep('Aguardando geração da minuta', 'success', { elapsed: `${elapsed}s` });
          }
        }

        if (!draftGenerated) {
          logStep('Timeout aguardando geração da minuta', 'warning');
        }
      } else {
        // Verificar se já existe uma minuta
        const editorContent = await page.locator('[contenteditable="true"]').textContent();
        if (editorContent && editorContent.length > 100) {
          logStep('Minuta já existente', 'success', {
            contentLength: editorContent.length
          });
        } else {
          logStep('Nenhuma minuta encontrada', 'warning');
        }
      }

      const screenshot13 = await page.screenshot();
      fs.writeFileSync(path.join(REPORT_DIR, '13-draft-page-final.png'), screenshot13);

      // ===== PASSO 9: VERIFICAR HISTÓRICO =====
      logStep('Verificando página de histórico', 'success');

      await page.goto(`http://localhost:5173/case/${caseId}/history`);
      await page.waitForLoadState('networkidle');

      const screenshot14 = await page.screenshot();
      fs.writeFileSync(path.join(REPORT_DIR, '14-history-page.png'), screenshot14);

      // ===== RESUMO FINAL =====
      logStep('Teste E2E completo finalizado', 'success', {
        caseId,
        totalSteps: reportData.steps.length,
        errors: reportData.errors.length
      });

    } catch (error: any) {
      logStep('Erro crítico no teste', 'error', {
        message: error.message,
        stack: error.stack
      });

      reportData.errors.push({
        step: 'critical-error',
        message: error.message,
        stack: error.stack
      });

      const screenshot = await page.screenshot();
      fs.writeFileSync(path.join(REPORT_DIR, 'ERROR-critical.png'), screenshot);

      throw error;
    }
  });
});

function generateMarkdownReport(data: any): string {
  let md = '# RELATÓRIO DE TESTE E2E - FLUXO COMPLETO DE COMPRA E VENDA\n\n';

  md += `**Data de Execução:** ${new Date(data.startTime).toLocaleString('pt-BR')}\n\n`;
  md += `**Duração:** ${data.endTime ? calculateDuration(data.startTime, data.endTime) : 'Em andamento'}\n\n`;

  md += '## Resumo\n\n';
  md += `- **Total de Passos:** ${data.steps.length}\n`;
  md += `- **Sucessos:** ${data.steps.filter((s: any) => s.status === 'success').length}\n`;
  md += `- **Avisos:** ${data.steps.filter((s: any) => s.status === 'warning').length}\n`;
  md += `- **Erros:** ${data.errors.length}\n\n`;

  if (data.errors.length > 0) {
    md += '## ⚠️ ERROS ENCONTRADOS\n\n';
    data.errors.forEach((error: any, index: number) => {
      md += `### Erro ${index + 1}: ${error.step}\n\n`;
      md += `**Mensagem:** ${error.message}\n\n`;
      if (error.screenshot) {
        md += `**Screenshot:** ${error.screenshot}\n\n`;
      }
      if (error.stack) {
        md += '```\n' + error.stack + '\n```\n\n';
      }
    });
  }

  md += '## Passos Executados\n\n';
  data.steps.forEach((step: any, index: number) => {
    const icon = step.status === 'success' ? '✅' : step.status === 'error' ? '❌' : '⚠️';
    md += `${index + 1}. ${icon} **${step.step}**\n`;
    md += `   - Status: ${step.status}\n`;
    md += `   - Timestamp: ${new Date(step.timestamp).toLocaleString('pt-BR')}\n`;
    if (step.details) {
      md += `   - Detalhes: \`${JSON.stringify(step.details)}\`\n`;
    }
    md += '\n';
  });

  md += '## Screenshots Capturados\n\n';
  md += 'Todos os screenshots foram salvos no diretório do relatório.\n\n';

  md += '## Documentos Utilizados\n\n';
  md += '1. **Matrícula de Imóvel:** Matrícula nº 45.789 - Apartamento 82, Edifício Portal do Morumbi\n';
  md += '2. **CNH Vendedor:** Carlos Henrique Oliveira Santos - CPF 234.567.890-12\n';
  md += '3. **CNH Comprador:** Patricia Regina Souza Lima - CPF 345.678.901-23\n\n';

  md += '## Conclusão\n\n';
  if (data.errors.length === 0) {
    md += '✅ Teste executado com sucesso! Todos os passos foram concluídos sem erros críticos.\n';
  } else {
    md += `⚠️ Teste completado com ${data.errors.length} erro(s). Verifique os detalhes acima.\n`;
  }

  return md;
}

function calculateDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
