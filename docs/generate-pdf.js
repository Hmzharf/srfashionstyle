/**
 * SRFashionStyle — Test Case PDF Generator
 * Generates a professional A4 landscape PDF from test-case-api.md
 *
 * Usage: node docs/generate-pdf.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ── Read markdown source ──────────────────────────────────────────
const mdPath = path.join(__dirname, 'test-case-api.md');
const rawMd = fs.readFileSync(mdPath, 'utf8');

// ── Build content sections ────────────────────────────────────────
function parseSections(md) {
  const lines = md.split('\n');
  const sections = [];
  let currentSection = null;
  let currentTable = null;
  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];

  function flushTable() {
    if (currentSection && tableRows.length > 0) {
      currentSection.tables.push({ headers: tableHeaders, rows: tableRows });
    }
    tableHeaders = [];
    tableRows = [];
    inTable = false;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // H1 sections
    if (/^## 1\.|^## 2\.|^## 3\.|^## 4\.|^## 5\.|^## 6\.|^## 7\.|^## 8\.|^## 9\.|^## 10\./.test(line)) {
      flushTable();
      if (currentSection) sections.push(currentSection);
      currentSection = {
        level: 1,
        title: line.replace(/^##\s+/, ''),
        subsections: [],
        tables: [],
      };
      continue;
    }

    // H2 subsections
    if (/^### \d+\.\d+/.test(line)) {
      flushTable();
      if (currentSection) {
        currentSection.subsections.push({
          title: line.replace(/^###\s+/, ''),
          tables: [],
        });
      }
      continue;
    }

    // Table rows
    if (line.startsWith('|')) {
      if (!inTable) {
        // Header row
        tableHeaders = line.split('|').filter(Boolean).map(h => h.trim());
        inTable = true;
        // Skip separator row
        i++;
      } else {
        const cells = line.split('|').filter(Boolean).map(c => c.trim());
        if (cells.length > 1) {
          tableRows.push(cells);
        }
      }
      continue;
    }

    // End of table
    if (inTable && !line.startsWith('|') && line.trim() !== '') {
      flushTable();
    }
  }

  flushTable();
  if (currentSection) sections.push(currentSection);
  return sections;
}

// ── HTML Escaping ──────────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Render markdown-like content to HTML ──────────────────────────
function renderCellContent(text) {
  if (!text) return '';
  // Bold
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Em dash
  text = text.replace(/—/g, '—');
  // arrows
  text = text.replace(/→/g, '→');
  return text;
}

// ── Build HTML ────────────────────────────────────────────────────
function buildHTML(sections) {
  const totalCases = sections.reduce((sum, s) => {
    return sum + s.tables.reduce((t, tbl) => t + tbl.rows.length, 0);
  }, 0);

  const positiveCases = sections.reduce((sum, s) => {
    return sum + s.tables.reduce((t, tbl) => {
      return t + tbl.rows.filter(r => r[1] && r[1].includes('Positif')).length;
    }, 0);
  }, 0);

  const negativeCases = totalCases - positiveCases;

  // ── Cover Page ────────────────────────────────────────────
  const cover = `
<div class="cover-page">
  <div class="logo">SR</div>
  <div class="project-name">SRFashionStyle</div>
  <div class="doc-title">Dokumentasi Pengujian API</div>
  <div class="divider"></div>
  <div class="meta">
    <strong>Tanggal:</strong> 23 Juni 2026 &nbsp;|&nbsp;
    <strong>Lingkup:</strong> Seluruh API Endpoint Backend Laravel &nbsp;|&nbsp;
    <strong>Tujuan:</strong> BAB Pengujian — Laporan Kerja Praktek
  </div>
  <div class="badge-row">
    <div class="badge">
      <div class="number">${totalCases}</div>
      <div class="label">Total Test Case</div>
    </div>
    <div class="badge">
      <div class="number">${sections.length}</div>
      <div class="label">Modul</div>
    </div>
    <div class="badge">
      <div class="number">${positiveCases}</div>
      <div class="label">Positif</div>
    </div>
    <div class="badge">
      <div class="number">${negativeCases}</div>
      <div class="label">Negatif</div>
    </div>
  </div>
</div>
`;

  // ── TOC ───────────────────────────────────────────────────
  let toc = `<div class="toc"><h1>Daftar Isi</h1>`;
  for (const sec of sections) {
    toc += `<div class="toc-item main"><span>${esc(sec.title)}</span><span>${sec.tables.reduce((t, tb) => t + tb.rows.length, 0)} TC</span></div>`;
    for (const sub of sec.subsections) {
      toc += `<div class="toc-item sub"><span>${esc(sub.title)}</span><span>${sub.tables.reduce((t, tb) => t + tb.rows.length, 0)} TC</span></div>`;
    }
  }
  toc += `</div>`;

  // ── Sections ──────────────────────────────────────────────
  let body = '';
  for (const sec of sections) {
    body += `<h1>${esc(sec.title)}</h1>`;

    for (const sub of sec.subsections) {
      body += `<h2>${esc(sub.title)}</h2>`;
      for (const tbl of sub.tables) {
        body += renderTable(tbl);
      }
    }

    for (const tbl of sec.tables) {
      body += renderTable(tbl);
    }
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<style>${CSS}</style>
</head>
<body>
<div class="page-header-left">SRFashionStyle — Dokumentasi Pengujian API</div>
<div class="page-header-right">Kerja Praktek 2026</div>
<div class="page-footer-left">Dibuat: 23 Juni 2026</div>
<div class="page-footer-right">Halaman <span class="pageNumber"></span></div>

${cover}
${toc}
${body}
</body>
</html>`;
}

function renderTable(tbl) {
  let html = '<table><thead><tr>';
  for (const h of tbl.headers) {
    html += `<th>${renderCellContent(h)}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (const row of tbl.rows) {
    const isPositive = row[1] && row[1].includes('Positif');
    const isNegative = row[1] && row[1].includes('Negatif');
    let rowClass = '';
    if (isPositive) rowClass = ' class="row-positive"';
    else if (isNegative) rowClass = ' class="row-negative"';

    html += `<tr${rowClass}>`;
    for (const cell of row) {
      html += `<td>${renderCellContent(cell)}</td>`;
    }
    html += '</tr>';
  }

  html += '</tbody></table>';
  return html;
}

// ── CSS Styles ────────────────────────────────────────────────────
const CSS = `
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
  font-size: 9pt;
  line-height: 1.45;
  color: #334155;
  margin: 0 10mm;
}

/* ======== COVER PAGE ======== */
.cover-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  page-break-after: always;
  height: 100vh;
  background: linear-gradient(135deg, #0f3460 0%, #1a1a2e 50%, #16213e 100%);
  color: #ffffff;
  margin: -10mm;
  padding: 10mm;
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
.cover-page .badge-row { display: flex; gap: 20px; margin-top: 36px; }
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

/* ======== TOC ======== */
.toc { page-break-after: always; }
.toc h1 { margin-top: 0; }
.toc-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  border-bottom: 1px dotted #e2e8f0;
  font-size: 9pt;
}
.toc-item.main {
  font-weight: 600;
  color: #0f3460;
  margin-top: 6px;
  font-size: 10pt;
}
.toc-item.sub {
  padding-left: 24px;
  font-size: 8.5pt;
  color: #475569;
}

/* ======== HEADINGS ======== */
h1 {
  font-size: 14pt;
  font-weight: 700;
  color: #1a1a2e;
  border-bottom: 2px solid #e94560;
  padding-bottom: 5px;
  margin-top: 8px;
  margin-bottom: 10px;
}
h2 {
  font-size: 11pt;
  font-weight: 600;
  color: #0f3460;
  margin-top: 16px;
  margin-bottom: 6px;
}
h3 {
  font-size: 10pt;
  font-weight: 600;
  color: #475569;
  margin-top: 12px;
  margin-bottom: 4px;
}

/* ======== TABLES ======== */
table {
  width: 100%;
  border-collapse: collapse;
  margin: 6px 0 14px 0;
  font-size: 7.5pt;
  page-break-inside: auto;
}
thead { display: table-header-group; }
thead tr { background: #1e293b !important; }
thead th {
  color: #ffffff;
  font-weight: 600;
  font-size: 7pt;
  padding: 5px 4px;
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
}
thead th:first-child { width: 42px; }
thead th:nth-child(2) { width: 100px; }
tbody tr { page-break-inside: avoid; }
tbody tr:nth-child(even) { background-color: #f8fafc; }
tbody tr:nth-child(odd) { background-color: #ffffff; }
td {
  padding: 3px 4px;
  border-bottom: 1px solid #e2e8f0;
  vertical-align: top;
}
td:first-child {
  font-weight: 600;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 7pt;
  color: #0f3460;
  white-space: nowrap;
}
td:nth-child(2) { font-weight: 500; }
td code {
  background: #f1f5f9;
  padding: 1px 3px;
  border-radius: 2px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 7pt;
  color: #1e293b;
}
td strong { font-weight: 600; color: #1e293b; }

/* Row coloring */
tr.row-positive td { background-color: #f0fdf4; }
tr.row-positive td:first-child { border-left: 3px solid #10b981; }
tr.row-negative td { background-color: #fef2f2; }
tr.row-negative td:first-child { border-left: 3px solid #ef4444; }

/* ======== BLOCKQUOTE ======== */
blockquote {
  border-left: 3px solid #e94560;
  margin: 10px 0;
  padding: 5px 12px;
  background: #fffbeb;
  border-radius: 0 4px 4px 0;
  font-size: 8pt;
  color: #92400e;
}
blockquote p { margin: 2px 0; }

/* ======== LISTS ======== */
ul, ol { padding-left: 18px; font-size: 8pt; margin: 4px 0; }
hr { border: none; border-top: 1px solid #e2e8f0; margin: 12px 0; }

/* ======== RUNNING HEADERS / FOOTERS ======== */
.page-header-left, .page-header-right, .page-footer-left, .page-footer-right {
  display: none;
}
`;

// ── Generate PDF ──────────────────────────────────────────────────
async function generate() {
  console.log('Parsing markdown...');
  const sections = parseSections(rawMd);
  console.log(`Found ${sections.length} sections`);

  const html = buildHTML(sections);
  const htmlPath = path.join(__dirname, 'test-case-api.html');
  fs.writeFileSync(htmlPath, html);
  console.log(`HTML saved to: ${htmlPath}`);

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

  const pdfPath = path.join(__dirname, 'test-case-api.pdf');
  console.log('Generating PDF...');

  await page.pdf({
    path: pdfPath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '8mm', right: '8mm' },
    displayHeaderFooter: true,
    headerTemplate: `
      <div style="font-size:7pt; font-family:'Segoe UI',sans-serif; color:#94a3b8;
                  width:100%; padding:0 4mm; display:flex; justify-content:space-between;
                  border-bottom:1px solid #e2e8f0; padding-bottom:4px;">
        <span style="font-weight:600;">SRFashionStyle — Dokumentasi Pengujian API</span>
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

  const stats = fs.statSync(pdfPath);
  console.log(`\n✅ PDF generated successfully!`);
  console.log(`   📄 ${pdfPath}`);
  console.log(`   📏 ${(stats.size / 1024).toFixed(1)} KB`);
}

generate().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
