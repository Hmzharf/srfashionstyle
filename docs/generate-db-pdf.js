/**
 * SRFashionStyle — Database Design PDF Generator
 * Usage: node docs/generate-db-pdf.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const mdPath = path.join(__dirname, 'database-design.md');
const rawMd = fs.readFileSync(mdPath, 'utf8');

// ── Simple markdown-to-HTML converter ──────────────────────────
function mdToHTML(md) {
  let html = md;

  // Code blocks (preserve first)
  const codeBlocks = [];
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    codeBlocks.push({ lang, code: esc(code) });
    return `%%CODEBLOCK_${codeBlocks.length - 1}%%`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Bold & italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Tables
  html = html.replace(/(\|.+\|\n\|[-| :]+\|\n((?:\|.+\|\n?)*))/g, (match) => {
    const lines = match.trim().split('\n');
    const headers = lines[0].split('|').filter(Boolean).map(h => h.trim());
    let tableHtml = '<table><thead><tr>';
    for (const h of headers) {
      tableHtml += `<th>${h}</th>`;
    }
    tableHtml += '</tr></thead><tbody>';
    for (let i = 2; i < lines.length; i++) {
      const cells = lines[i].split('|').filter(Boolean).map(c => c.trim());
      tableHtml += '<tr>';
      for (const c of cells) {
        tableHtml += `<td>${c}</td>`;
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table>';
    return tableHtml;
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (match) => {
    const items = match.trim().split('\n').filter(l => /^\d+\./.test(l));
    let list = '<ol>';
    for (const item of items) {
      list += `<li>${item.replace(/^\d+\.\s*/, '')}</li>`;
    }
    list += '</ol>';
    return list;
  });

  // Unordered lists
  html = html.replace(/((?:^- .+\n?)+)/gm, (match) => {
    const items = match.trim().split('\n').filter(l => /^-/.test(l));
    let list = '<ul>';
    for (const item of items) {
      list += `<li>${item.replace(/^-\s*/, '')}</li>`;
    }
    list += '</ul>';
    return list;
  });

  // Restore code blocks
  for (let i = 0; i < codeBlocks.length; i++) {
    const { lang, code } = codeBlocks[i];
    html = html.replace(`%%CODEBLOCK_${i}%%`, `<pre class="code-block"><code>${code}</code></pre>`);
  }

  // Paragraphs — wrap remaining text lines
  html = html.replace(/^(?!<[a-z]|$)(.+)$/gm, '<p>$1</p>');

  // Clean empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

function esc(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ── Build full HTML document ─────────────────────────────────
function buildHTML(md) {
  const bodyContent = mdToHTML(md);

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>${CSS}</style>
</head>
<body>
<div class="cover-page">
  <div class="logo">SR</div>
  <div class="project-name">SRFashionStyle</div>
  <div class="doc-title">Perancangan Basis Data</div>
  <div class="divider"></div>
  <div class="meta">
    <strong>Isi:</strong> ERD · Transformasi ERD · LRS · Kamus Data · Relasi Tabel &nbsp;|&nbsp;
    <strong>Tanggal:</strong> 23 Juni 2026
  </div>
  <div class="badge-row">
    <div class="badge">
      <div class="number">15</div>
      <div class="label">Tabel</div>
    </div>
    <div class="badge">
      <div class="number">6</div>
      <div class="label">Modul Bisnis</div>
    </div>
    <div class="badge">
      <div class="number">25</div>
      <div class="label">File Migrasi</div>
    </div>
  </div>
</div>
${bodyContent}
</body>
</html>`;
}

// ── CSS ──────────────────────────────────────────────────────
const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  font-size: 9.5pt;
  line-height: 1.55;
  color: #334155;
  padding: 0;
}

/* ======== COVER PAGE ======== */
.cover-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  page-break-after: always;
  min-height: 100vh;
  background: linear-gradient(135deg, #0f3460 0%, #1a1a2e 50%, #16213e 100%);
  color: #ffffff;
  padding: 60px 40px;
  margin: 0;
}
.cover-page .logo {
  font-size: 52pt;
  font-weight: 800;
  letter-spacing: -2px;
  margin-bottom: 4px;
  color: #e94560;
}
.cover-page .project-name {
  font-size: 26pt;
  font-weight: 700;
  letter-spacing: -0.5px;
  margin-bottom: 8px;
}
.cover-page .doc-title {
  font-size: 16pt;
  font-weight: 400;
  color: #94a3b8;
  margin-bottom: 32px;
}
.cover-page .divider {
  width: 100px;
  height: 3px;
  background: #e94560;
  border-radius: 2px;
  margin-bottom: 32px;
}
.cover-page .meta {
  font-size: 9pt;
  color: #94a3b8;
  line-height: 2;
}
.cover-page .meta strong { color: #e2e8f0; font-weight: 600; }
.cover-page .badge-row { display: flex; gap: 24px; margin-top: 36px; }
.cover-page .badge {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 10px;
  padding: 16px 28px;
  text-align: center;
  min-width: 100px;
}
.cover-page .badge .number {
  font-size: 26pt;
  font-weight: 700;
  color: #e94560;
}
.cover-page .badge .label {
  font-size: 7.5pt;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-top: 4px;
}

/* ======== PAGE SETUP ======== */
@page {
  size: A4 portrait;
  margin: 18mm 15mm 22mm 15mm;
}

/* ======== HEADINGS ======== */
h1 {
  font-size: 15pt;
  font-weight: 700;
  color: #1a1a2e;
  border-bottom: 2px solid #e94560;
  padding-bottom: 5px;
  margin-top: 24px;
  margin-bottom: 12px;
  page-break-before: always;
}
h1:first-of-type { page-break-before: avoid; }
h2 {
  font-size: 12.5pt;
  font-weight: 600;
  color: #0f3460;
  border-left: 3px solid #e94560;
  padding-left: 8px;
  margin-top: 22px;
  margin-bottom: 10px;
  page-break-after: avoid;
}
h3 {
  font-size: 10.5pt;
  font-weight: 600;
  color: #475569;
  margin-top: 16px;
  margin-bottom: 8px;
  page-break-after: avoid;
}
h4 {
  font-size: 9.5pt;
  font-weight: 600;
  color: #64748b;
  margin-top: 12px;
  margin-bottom: 4px;
}

/* ======== TABLES ======== */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0 16px 0;
  font-size: 8pt;
  page-break-inside: auto;
}
thead { display: table-header-group; }
thead tr { background: #1e293b !important; }
thead th {
  color: #ffffff;
  font-weight: 600;
  font-size: 7.5pt;
  padding: 5px 5px;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
tbody tr { page-break-inside: avoid; }
tbody tr:nth-child(even) { background-color: #f8fafc; }
tbody tr:nth-child(odd) { background-color: #ffffff; }
td {
  padding: 3px 5px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
}
td:first-child { font-weight: 600; }
td code, td strong { font-weight: 600; color: #1e293b; }

/* ======== CODE BLOCKS (ERD, LRS) ======== */
pre.code-block {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 12px 14px;
  font-family: 'Consolas', 'Courier New', 'Liberation Mono', monospace;
  font-size: 7pt;
  line-height: 1.35;
  overflow-x: auto;
  white-space: pre;
  color: #1e293b;
  page-break-inside: avoid;
}

/* ======== BLOCKQUOTE ======== */
blockquote {
  border-left: 3px solid #e94560;
  margin: 10px 0;
  padding: 5px 14px;
  background: #fffbeb;
  border-radius: 0 4px 4px 0;
  font-size: 8.5pt;
  color: #92400e;
}
blockquote p { margin: 2px 0; }

/* ======== LISTS ======== */
ul, ol { padding-left: 20px; font-size: 9pt; margin: 6px 0; line-height: 1.6; }
li { margin-bottom: 2px; }
hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }

p { margin: 4px 0; font-size: 9pt; }
code { background: #f1f5f9; padding: 1px 3px; border-radius: 2px; font-size: 8pt; }
`;

// ── Generate PDF ────────────────────────────────────────────
async function generate() {
  console.log('Converting markdown to HTML...');
  const html = buildHTML(rawMd);
  const htmlPath = path.join(__dirname, 'database-design.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`HTML saved: ${htmlPath}`);

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

  const pdfPath = path.join(__dirname, 'database-design-new.pdf');
  console.log('Generating PDF...');

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    landscape: false,
    printBackground: true,
    margin: { top: '16mm', bottom: '16mm', left: '12mm', right: '12mm' },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size:7pt; font-family:'Segoe UI',sans-serif; color:#94a3b8;
                  width:100%; padding:0 4mm; display:flex; justify-content:space-between;
                  border-bottom:1px solid #e2e8f0; padding-bottom:4px;">
        <span style="font-weight:600;">SRFashionStyle — Perancangan Basis Data</span>
        <span>Kerja Praktek 2026</span>
      </div>`,
    footerTemplate: `
      <div style="font-size:7pt; font-family:'Segoe UI',sans-serif; color:#94a3b8;
                  width:100%; padding:0 4mm; display:flex; justify-content:space-between;
                  border-top:1px solid #e2e8f0; padding-top:4px;">
        <span>Dibuat: 23 Juni 2026</span>
        <span>Halaman <span class="pageNumber"></span> dari <span class="totalPages"></span></span>
      </div>`,
  });

  await browser.close();

  // Replace old PDF (handle locked file)
  const finalPath = path.join(__dirname, 'database-design.pdf');
  try { fs.unlinkSync(finalPath); } catch(e) { /* locked — keep v2 */ }
  try { fs.renameSync(pdfPath, finalPath); } catch(e) {
    console.log('Note: PDF saved as database-design-v2.pdf (old file locked)');
  }

  const stats = fs.statSync(fs.existsSync(finalPath) ? finalPath : pdfPath);
  console.log(`\n✅ PDF generated successfully!`);
  console.log(`   📄 ${fs.existsSync(finalPath) ? finalPath : pdfPath}`);
  console.log(`   📏 ${(stats.size / 1024).toFixed(1)} KB`);
}

generate().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
