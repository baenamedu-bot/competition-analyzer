'use client';

let pdfjsLib: typeof import('pdfjs-dist') | null = null;
const PDFJS_VERSION = '4.0.379';

async function getPdfJs() {
  if (pdfjsLib) return pdfjsLib;
  const lib = await import('pdfjs-dist');
  // Worker는 CDN에서 로드 (버전 고정). 사내망 환경에서 막힐 경우
  // /public/pdf.worker.min.mjs 로 호스팅한 후 workerSrc만 교체하면 됨.
  lib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
  pdfjsLib = lib;
  return lib;
}

export interface ExtractProgress {
  page: number;
  total: number;
}

export interface ExtractResult {
  pageCount: number;
  text: string;
  charCount: number;
}

export async function extractPdfText(
  file: File,
  onProgress?: (p: ExtractProgress) => void
): Promise<ExtractResult> {
  const lib = await getPdfJs();
  const buf = await file.arrayBuffer();
  const doc = await lib.getDocument({ data: new Uint8Array(buf) }).promise;
  const total = doc.numPages;
  const out: string[] = [];

  for (let i = 1; i <= total; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it) => (typeof it === 'object' && it && 'str' in it ? (it as { str: string }).str : ''))
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (pageText) {
      out.push(`\n[페이지 ${i}]\n${pageText}`);
    }
    if (onProgress) onProgress({ page: i, total });
    if (i % 10 === 0) await new Promise((r) => setTimeout(r, 0));
  }

  await doc.cleanup();
  await doc.destroy();

  const text = out.join('\n');
  return {
    pageCount: total,
    text,
    charCount: text.length,
  };
}

export function truncateForModel(text: string, maxChars = 480_000): string {
  if (text.length <= maxChars) return text;
  const head = text.slice(0, Math.floor(maxChars * 0.7));
  const tail = text.slice(-Math.floor(maxChars * 0.3));
  return `${head}\n\n[...중략 ${text.length - maxChars}자...]\n\n${tail}`;
}
