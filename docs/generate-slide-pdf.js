/**
 * SRFashionStyle — Slide Sidang KP PDF Generator (16:9)
 * Usage: node docs/generate-slide-pdf.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const htmlPath = path.join(__dirname, 'slide-sidang.html');
  console.log('Launching Chromium...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  // 16:9 slide @ 1280x720 px → use exact px dimensions
  const pdfPath = path.join(__dirname, 'slide-sidang.pdf');
  console.log('Generating PDF (16:9)...');

  await page.pdf({
    path: pdfPath,
    width: '1280px',
    height: '720px',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
  });

  await browser.close();

  const stats = fs.statSync(pdfPath);
  console.log(`\n✅ Slide PDF generated!`);
  console.log(`   📄 ${pdfPath}`);
  console.log(`   📏 ${(stats.size / 1024).toFixed(1)} KB`);
})().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
