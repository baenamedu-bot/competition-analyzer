import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import { getApiKey } from './api-key-storage';

export const GEMINI_MODEL = 'gemini-2.5-pro';
export const GEMINI_MODEL_FAST = 'gemini-2.5-flash';

export class MissingApiKeyError extends Error {
  constructor() {
    super('Gemini API 키가 설정되어 있지 않습니다.');
    this.name = 'MissingApiKeyError';
  }
}

export function getModel(opts?: { model?: string; system?: string; json?: boolean }): GenerativeModel {
  const key = getApiKey();
  if (!key) throw new MissingApiKeyError();
  const genai = new GoogleGenerativeAI(key);
  return genai.getGenerativeModel({
    model: opts?.model ?? GEMINI_MODEL,
    systemInstruction: opts?.system,
    generationConfig: opts?.json
      ? { responseMimeType: 'application/json', temperature: 0.4 }
      : { temperature: 0.6 },
  });
}

export async function generateJson<T>(opts: {
  system: string;
  prompt: string;
  model?: string;
}): Promise<T> {
  const model = getModel({ model: opts.model, system: opts.system, json: true });
  const result = await model.generateContent(opts.prompt);
  const text = result.response.text();
  return parseJsonLoose<T>(text);
}

export function parseJsonLoose<T>(raw: string): T {
  let s = raw.trim();
  if (s.startsWith('```')) {
    s = s.replace(/^```(?:json)?/i, '').replace(/```\s*$/i, '').trim();
  }
  const firstBrace = s.indexOf('{');
  const firstBracket = s.indexOf('[');
  let start = -1;
  if (firstBrace >= 0 && (firstBracket < 0 || firstBrace < firstBracket)) start = firstBrace;
  else if (firstBracket >= 0) start = firstBracket;
  if (start > 0) s = s.slice(start);
  const lastBrace = s.lastIndexOf('}');
  const lastBracket = s.lastIndexOf(']');
  const end = Math.max(lastBrace, lastBracket);
  if (end >= 0 && end < s.length - 1) s = s.slice(0, end + 1);
  try {
    return JSON.parse(s) as T;
  } catch (e) {
    throw new Error(`Gemini JSON 파싱 실패: ${(e as Error).message}\n원본 응답:\n${raw.slice(0, 500)}`);
  }
}
