import { generateJson, GEMINI_MODEL } from './gemini-client';
import { SYSTEM_BASE, buildPrompt, type CrossRefInput } from './prompts';
import { truncateForModel } from './pdf-extractor';
import type {
  AnalysisResult,
  SummaryCategory,
  ScheduleEvent,
  DesignConcept,
  Submittable,
  ProgramArea,
  ProgramRelation,
  DocumentMeta,
} from '@/types';

export type AnalysisStage =
  | 'reading-guideline'
  | 'reading-notice'
  | 'reading-task'
  | 'cross-reference'
  | 'schedule'
  | 'concepts'
  | 'submittables'
  | 'programs'
  | 'done';

export const STAGE_LABELS: Record<AnalysisStage, string> = {
  'reading-guideline': '공모지침서 인덱싱',
  'reading-notice': '공고문 인덱싱',
  'reading-task': '과업지시서 인덱싱',
  'cross-reference': '핵심 요약 + 교차 참조',
  schedule: '제출 일정표 구성',
  concepts: '디자인 컨셉 10개 생성',
  submittables: '제출물 체크리스트 정리',
  programs: '프로그램 관계 분석',
  done: '완료',
};

export const STAGE_ORDER: AnalysisStage[] = [
  'reading-guideline',
  'reading-notice',
  'reading-task',
  'cross-reference',
  'schedule',
  'concepts',
  'submittables',
  'programs',
  'done',
];

interface RunOptions {
  input: CrossRefInput;
  onProgress?: (stage: AnalysisStage, message?: string) => void;
}

function preflight(input: CrossRefInput): CrossRefInput {
  const docs = { ...input.docs };
  for (const k of ['guideline', 'notice', 'task'] as const) {
    const d = docs[k];
    if (d) {
      docs[k] = { ...d, text: truncateForModel(d.text, 320_000) };
    }
  }
  return { ...input, docs };
}

export async function runAnalysis({ input, onProgress }: RunOptions): Promise<AnalysisResult> {
  const trimmed = preflight(input);

  // 인덱싱 단계는 클라이언트 PDF 추출이 끝났음을 알리는 표시 단계
  for (const k of ['reading-guideline', 'reading-notice', 'reading-task'] as const) {
    onProgress?.(k);
    await new Promise((r) => setTimeout(r, 50));
  }

  onProgress?.('cross-reference');
  const summaryRes = await generateJson<{ summary: SummaryCategory[] }>({
    system: SYSTEM_BASE,
    prompt: buildPrompt('summary', trimmed),
  });

  onProgress?.('schedule');
  const scheduleRes = await generateJson<{ schedule: ScheduleEvent[] }>({
    system: SYSTEM_BASE,
    prompt: buildPrompt('schedule', trimmed),
  });

  onProgress?.('concepts');
  const conceptsRes = await generateJson<{ concepts: DesignConcept[] }>({
    system: SYSTEM_BASE,
    prompt: buildPrompt('concepts', trimmed),
  });

  onProgress?.('submittables');
  const submittablesRes = await generateJson<{ submittables: Submittable[] }>({
    system: SYSTEM_BASE,
    prompt: buildPrompt('submittables', trimmed),
  });

  onProgress?.('programs');
  const programsRes = await generateJson<{ programs: ProgramArea[]; relations: ProgramRelation[] }>({
    system: SYSTEM_BASE,
    prompt: buildPrompt('programs', trimmed),
  });

  onProgress?.('done');

  const documents: DocumentMeta[] = (['guideline', 'notice', 'task'] as const)
    .map((k) => input.docs[k])
    .filter((d): d is NonNullable<typeof d> => d !== null)
    .map(({ text: _t, ...meta }) => meta);

  const result: AnalysisResult = {
    generatedAt: new Date().toISOString(),
    model: GEMINI_MODEL,
    documents,
    summary: summaryRes.summary ?? [],
    schedule: (scheduleRes.schedule ?? []).sort((a, b) => (a.date > b.date ? 1 : -1)),
    concepts: conceptsRes.concepts ?? [],
    submittables: submittablesRes.submittables ?? [],
    programs: programsRes.programs ?? [],
    relations: programsRes.relations ?? [],
  };
  return result;
}
