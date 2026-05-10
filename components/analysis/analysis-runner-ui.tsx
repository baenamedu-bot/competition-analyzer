'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Sparkles, Check, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApiKey } from '@/components/settings/api-key-context';
import {
  runAnalysis,
  STAGE_LABELS,
  STAGE_ORDER,
  type AnalysisStage,
} from '@/lib/analysis-runner';
import { MissingApiKeyError } from '@/lib/gemini-client';
import type { ProjectState } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  project: ProjectState;
  onComplete: (next: ProjectState) => void;
  rerun?: boolean;
}

export function AnalysisRunnerUI({ project, onComplete, rerun }: Props) {
  const { ensureKey } = useApiKey();
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<AnalysisStage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allDocsReady =
    !!project.documents.guideline ||
    !!project.documents.notice ||
    !!project.documents.task;

  async function start() {
    if (!ensureKey()) return;
    if (!allDocsReady) {
      toast.error('최소 1개 이상의 PDF를 업로드해주세요.');
      return;
    }
    setError(null);
    setRunning(true);
    setStage('reading-guideline');

    try {
      const analysis = await runAnalysis({
        input: {
          docs: project.documents,
          finalDeadline: project.finalDeadline,
          projectName: project.name,
          client: project.client,
        },
        onProgress: (s) => setStage(s),
      });
      onComplete({ ...project, analysis });
      toast.success('분석이 완료되었습니다.');
    } catch (e) {
      if (e instanceof MissingApiKeyError) {
        ensureKey();
        toast.error('API 키를 먼저 설정해주세요.');
      } else {
        const msg = (e as Error).message;
        setError(msg);
        toast.error('분석 실패: ' + msg);
      }
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="surface-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-2 py-0.5 text-[10.5px] font-semibold tracking-wider text-white">
            <Sparkles className="h-3 w-3" />
            GEMINI 2.5 PRO
          </div>
          <h3 className="mt-2 text-[16px] font-semibold tracking-tight text-zinc-900">
            {rerun ? '재분석 실행' : 'AI 분석 시작'}
          </h3>
          <p className="mt-1 text-[12.5px] leading-relaxed text-zinc-500">
            업로드된 PDF의 텍스트를 사용자 브라우저에서 Gemini API로 직접 전송합니다.
            보통 1~3분 소요되며, API 비용은 사용자 본인 키에 청구됩니다.
          </p>
        </div>
        <Button
          variant="cta"
          size="lg"
          onClick={start}
          disabled={running || !allDocsReady}
        >
          {running ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              분석 중
            </>
          ) : rerun ? (
            <>
              <Play className="h-4 w-4" />
              다시 분석
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              분석 시작
            </>
          )}
        </Button>
      </div>

      {!allDocsReady && (
        <p className="mt-3 text-[12px] text-amber-600">
          최소 1개 이상의 PDF를 업로드해야 분석을 시작할 수 있습니다 (3개 모두 권장).
        </p>
      )}

      {(running || stage) && (
        <ol className="mt-5 space-y-1.5">
          {STAGE_ORDER.filter((s) => s !== 'done').map((s) => {
            const currentIdx = stage ? STAGE_ORDER.indexOf(stage) : -1;
            const sIdx = STAGE_ORDER.indexOf(s);
            const isDone = sIdx < currentIdx || stage === 'done';
            const isActive = sIdx === currentIdx && running;
            return (
              <li
                key={s}
                className={cn(
                  'flex items-center gap-2 rounded-md px-2.5 py-1.5 text-[12.5px] transition-all',
                  isActive && 'bg-zinc-100 text-zinc-900',
                  isDone && 'text-emerald-700',
                  !isActive && !isDone && 'text-zinc-400'
                )}
              >
                <span className="inline-flex h-4 w-4 items-center justify-center">
                  {isDone ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={2.6} />
                  ) : isActive ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  )}
                </span>
                {STAGE_LABELS[s]}
              </li>
            );
          })}
        </ol>
      )}

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
