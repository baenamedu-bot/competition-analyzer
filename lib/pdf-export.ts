'use client';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { BRAND } from '@/components/branding/brand-constants';

interface ExportOpts {
  element: HTMLElement;
  fileName: string;
  projectName: string;
  client: string;
  generatedAt: string;
}

export async function exportToPdf({
  element,
  fileName,
  projectName,
  client,
  generatedAt,
}: ExportOpts) {
  const pdf = new jsPDF({ format: 'a4', unit: 'pt', orientation: 'portrait' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 28;

  // ----- COVER -----
  drawCover(pdf, projectName, client, generatedAt);

  // ----- CONTENT -----
  // render at 2x scale for crispness, then split into A4 pages
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
  });

  const imgWidthPt = pageWidth - margin * 2;
  const ratio = imgWidthPt / canvas.width;
  const imgHeightPt = canvas.height * ratio;

  const usableHeight = pageHeight - margin * 2 - 20; // footer space
  const sliceHeightCanvasPx = usableHeight / ratio;

  let renderedY = 0;
  let pageIdx = 1;

  while (renderedY < canvas.height) {
    pdf.addPage();
    pageIdx += 1;
    const slice = document.createElement('canvas');
    const sh = Math.min(sliceHeightCanvasPx, canvas.height - renderedY);
    slice.width = canvas.width;
    slice.height = sh;
    const ctx = slice.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, renderedY, canvas.width, sh, 0, 0, canvas.width, sh);
    const dataUrl = slice.toDataURL('image/jpeg', 0.92);
    pdf.addImage(dataUrl, 'JPEG', margin, margin, imgWidthPt, sh * ratio);
    drawFooter(pdf, pageIdx, projectName);
    renderedY += sh;
  }

  pdf.save(fileName);
}

function drawCover(pdf: jsPDF, projectName: string, client: string, generatedAt: string) {
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();

  // background block
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, w, 220, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(BRAND.studio, 36, 50);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(BRAND.appName, 36, 66);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.text('Competition Brief', 36, 150);
  pdf.setFontSize(15);
  pdf.text('Auto-Analysis Report', 36, 175);

  // body
  pdf.setTextColor(15, 23, 42);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  const projectLines = pdf.splitTextToSize(projectName || 'Untitled Project', w - 72);
  pdf.text(projectLines, 36, 270);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(100, 116, 139);
  if (client) pdf.text(`Client: ${client}`, 36, 270 + 22 * projectLines.length + 6);
  pdf.text(`Generated: ${new Date(generatedAt).toLocaleString('ko-KR')}`, 36, 270 + 22 * projectLines.length + 24);

  // footer line
  pdf.setDrawColor(228, 228, 231);
  pdf.line(36, h - 60, w - 36, h - 60);
  pdf.setFontSize(9);
  pdf.setTextColor(113, 113, 122);
  pdf.text(`Powered by ${BRAND.studio}  ·  ${BRAND.creator}  ·  ${BRAND.websiteLabel}`, 36, h - 42);
  pdf.setFontSize(8);
  pdf.text('AI-assisted analysis. 최종 검토는 사용자가 수행해야 합니다.', 36, h - 28);
}

function drawFooter(pdf: jsPDF, pageNum: number, projectName: string) {
  const w = pdf.internal.pageSize.getWidth();
  const h = pdf.internal.pageSize.getHeight();
  pdf.setDrawColor(228, 228, 231);
  pdf.line(28, h - 26, w - 28, h - 26);
  pdf.setFontSize(8);
  pdf.setTextColor(113, 113, 122);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${BRAND.studio} · ${BRAND.appName}`, 28, h - 14);
  const right = `${projectName.slice(0, 40)}  |  p.${pageNum}`;
  pdf.text(right, w - 28, h - 14, { align: 'right' });
}

export async function exportToHtml(opts: {
  element: HTMLElement;
  fileName: string;
  projectName: string;
  client: string;
  generatedAt: string;
}) {
  const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    .map((l) => `<link rel="stylesheet" href="${(l as HTMLLinkElement).href}">`)
    .join('\n');
  const cssInline = Array.from(document.querySelectorAll('style'))
    .map((s) => `<style>${s.innerHTML}</style>`)
    .join('\n');
  const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8" />
<title>${escapeHtml(opts.projectName)} · 분석 보고서 · ${BRAND.studio}</title>
<meta name="generator" content="${BRAND.appName}" />
${cssLinks}
${cssInline}
<style>body{background:#f4f4f5;padding:32px} .report-shell{max-width:960px;margin:0 auto;background:#fff;padding:32px;border-radius:12px;box-shadow:0 2px 6px rgba(15,23,42,.06)} .report-cover{padding:32px;background:#0f172a;color:#fff;border-radius:12px;margin-bottom:24px} .report-cover h1{font-size:28px;margin:0 0 8px}</style>
</head>
<body>
<div class="report-shell">
  <div class="report-cover">
    <div style="font-size:12px;opacity:.7;letter-spacing:.04em">${BRAND.studio} · ${BRAND.appName}</div>
    <h1>${escapeHtml(opts.projectName)}</h1>
    <div style="opacity:.85">${escapeHtml(opts.client)} · ${new Date(opts.generatedAt).toLocaleString('ko-KR')}</div>
  </div>
  ${opts.element.outerHTML}
  <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e4e4e7;font-size:12px;color:#71717a;text-align:center">Powered by ${BRAND.studio} · ${BRAND.creator} · ${BRAND.websiteLabel}</div>
</div>
</body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = opts.fileName;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
