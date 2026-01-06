const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function convertHtmlToPdf() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const files = [
    { input: 'matricula-imovel.html', output: 'matricula-imovel.pdf', format: 'A4' },
    { input: 'cnh-vendedor.html', output: 'cnh-vendedor.pdf', format: 'A4' },
    { input: 'cnh-comprador.html', output: 'cnh-comprador.pdf', format: 'A4' }
  ];

  for (const file of files) {
    const inputPath = path.join(__dirname, file.input);
    const outputPath = path.join(__dirname, file.output);

    console.log(`Converting ${file.input} to ${file.output}...`);

    await page.goto(`file://${inputPath}`);
    await page.waitForTimeout(1000); // Wait for page to render

    await page.pdf({
      path: outputPath,
      format: file.format,
      printBackground: true,
      margin: {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      }
    });

    console.log(`✓ Created ${file.output}`);
  }

  await browser.close();
  console.log('\nAll PDFs created successfully!');
}

convertHtmlToPdf().catch(console.error);
