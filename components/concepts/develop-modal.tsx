'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Sparkles,
  Loader2,
  RefreshCcw,
  Check,
  Pencil,
  LayoutGrid,
  Layers,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useApiKey } from '@/components/settings/api-key-context';
import { generateJson, GEMINI_MODEL, MissingApiKeyError } from '@/lib/gemini-client';
import { SYSTEM_BASE, buildDevelopPrompt } from '@/lib/prompts';
import type {
  ConceptDevelopment,
  DesignConcept,
  AnalysisResult,
} from '@/types';

type DevPayload = Omit<ConceptDevelopment, 'conceptId' | 'generatedAt' | 'model'>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  concept: DesignConcept | null;
  conceptIndex?: number;
  projectName: string;
  client: string;
  summarySnapshot?: AnalysisResult['summary'];
  programsSnapshot?: AnalysisResult['programs'];
  existing: ConceptDevelopment | null;
  onSave: (dev: ConceptDevelopment) => void;
}

export function DevelopModal({
  open,
  onOpenChange,
  concept,
  conceptIndex,
  projectName,
  client,
  summarySnapshot,
  programsSnapshot,
  existing,
  onSave,
}: Props) {
  const { ensureKey } = useApiKey();
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<DevPayload | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (existing) {
        setDraft({
          diagram: existing.diagram,
          spatial: existing.spatial,
          facade: existing.facade,
        });
        setGeneratedAt(existing.generatedAt);
      } else {
        setDraft(null);
        setGeneratedAt(null);
      }
      setError(null);
    }
  }, [open, existing]);

  async function generate() {
    if (!concept) return;
    if (!ensureKey()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await generateJson<DevPayload>({
        system: SYSTEM_BASE,
        prompt: buildDevelopPrompt({
          concept,
          projectName,
          client,
          summarySnapshot,
          programsSnapshot,
        }),
      });
      // light shape guard
      if (!result.diagram || !result.spatial || !result.facade) {
        throw new Error('응답 형식이 올바르지 않습니다.');
      }
      setDraft(result);
      setGeneratedAt(new Date().toISOString());
    } catch (e) {
      if (e instanceof MissingApiKeyError) {
        ensureKey();
      } else {
        const msg = (e as Error).message;
        setError(msg);
        toast.error('생성 실패: ' + msg);
      }
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!concept || !draft || !generatedAt) return;
    onSave({
      conceptId: concept.id,
      generatedAt,
      model: GEMINI_MODEL,
      diagram: draft.diagram,
      spatial: draft.spatial,
      facade: draft.facade,
    });
    toast.success('컨셉 발전안을 카드 하위에 저장했습니다.');
    onOpenChange(false);
  }

  if (!concept) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="inline-flex h-7 items-center justify-center gap-1 rounded-md bg-zinc-900 px-2 text-[10.5px] font-semibold tracking-wider text-white">
              <Sparkles className="h-3 w-3" />
              GEMINI 2.5 PRO
            </span>
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700">
              {conceptIndex !== undefined ? `${String(conceptIndex + 1).padStart(2, '0')} · ` : ''}
              {concept.category}
            </span>
          </div>
          <DialogTitle className="pr-6 text-[20px]">
            컨셉 발전 — {concept.nameKo}
          </DialogTitle>
          <DialogDescription>
            이 컨셉을 시드로 다이어그램·평면·입면 단계로 한 칸 더 발전시킨 안을 생성합니다.
            저장하면 컨셉 카드 하위에 펼쳐집니다.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
          <div className="text-[11.5px] font-semibold uppercase tracking-wider text-zinc-500">
            시드 컨셉
          </div>
          <p className="mt-0.5 text-[13.5px] font-medium text-zinc-800">
            {concept.oneLiner}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-zinc-600">
            {concept.spatialStrategy}
          </p>
        </div>

        {!draft && !busy && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center">
            <Sparkles className="h-5 w-5 text-zinc-400" />
            <h4 className="text-[14px] font-semibold tracking-tight text-zinc-900">
              아직 발전안이 없습니다
            </h4>
            <p className="max-w-sm text-[12.5px] leading-relaxed text-zinc-500">
              "발전안 생성"을 누르면 다이어그램 키워드·핵심 공간 구성·입면 재료
              방향 3개 묶음을 Gemini가 한 번에 만들어 줍니다 (보통 20~40초).
            </p>
            <Button variant="cta" size="lg" onClick={generate} className="mt-1">
              <Sparkles className="h-4 w-4" />
              발전안 생성
            </Button>
          </div>
        )}

        {busy && (
          <div className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-10">
            <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
            <div className="text-[13px] text-zinc-700">
              컨셉을 발전시키는 중입니다...
              <div className="mt-0.5 text-[11.5px] text-zinc-400">
                다이어그램 → 공간 구성 → 입면·재료 순으로 작성됩니다.
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            {error}
          </div>
        )}

        {draft && (
          <div className="space-y-4">
            <BlockCard
              tone="diagram"
              icon={<Pencil className="h-3.5 w-3.5" strokeWidth={2} />}
              tag="A · 다이어그램 스케치"
              title={draft.diagram.summary}
            >
              <div className="flex flex-wrap gap-1.5">
                {draft.diagram.keywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[11.5px] text-zinc-700"
                  >
                    {k}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[12.5px] leading-relaxed text-zinc-700">
                {draft.diagram.geometry}
              </p>
            </BlockCard>

            <BlockCard
              tone="spatial"
              icon={<LayoutGrid className="h-3.5 w-3.5" strokeWidth={2} />}
              tag="B · 핵심 공간 구성"
              title={draft.spatial.summary}
            >
              <ul className="space-y-1.5">
                {draft.spatial.spaces.map((s, i) => (
                  <li key={i} className="rounded-md bg-white px-3 py-2 text-[12.5px]">
                    <div className="font-semibold text-zinc-900">{s.name}</div>
                    <div className="mt-0.5 leading-relaxed text-zinc-600">
                      {s.description}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-3 rounded-md bg-white px-3 py-2 text-[12.5px]">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400">
                  동선 전략
                </div>
                <p className="mt-1 leading-relaxed text-zinc-700">
                  {draft.spatial.circulation}
                </p>
              </div>
            </BlockCard>

            <BlockCard
              tone="facade"
              icon={<Layers className="h-3.5 w-3.5" strokeWidth={2} />}
              tag="C · 입면 · 재료 방향"
              title={draft.facade.summary}
            >
              <div className="flex flex-wrap gap-1.5">
                {draft.facade.materials.map((m) => (
                  <span
                    key={m}
                    className="rounded-md border border-stone-300 bg-stone-50 px-2 py-0.5 text-[11.5px] text-stone-700"
                  >
                    {m}
                  </span>
                ))}
              </div>
              <div className="mt-3 rounded-md bg-white px-3 py-2 text-[12.5px]">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400">
                  방위·맥락 전략
                </div>
                <p className="mt-1 leading-relaxed text-zinc-700">
                  {draft.facade.facadeStrategy}
                </p>
              </div>
              <div className="mt-2 rounded-md bg-white px-3 py-2 text-[12.5px]">
                <div className="text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400">
                  디테일 포인트
                </div>
                <p className="mt-1 leading-relaxed text-zinc-700">
                  {draft.facade.detailNotes}
                </p>
              </div>
            </BlockCard>
          </div>
        )}

        {draft && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={generate}
              disabled={busy}
              className="text-zinc-600"
            >
              {busy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCcw className="h-3.5 w-3.5" />
              )}
              다시 생성
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                닫기
              </Button>
              <Button variant="cta" onClick={save}>
                <Check className="h-4 w-4" />
                카드에 저장
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BlockCard({
  tone,
  tag,
  icon,
  title,
  children,
}: {
  tone: 'diagram' | 'spatial' | 'facade';
  tag: string;
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  const colorMap = {
    diagram: 'border-blue-200 bg-blue-50/40',
    spatial: 'border-emerald-200 bg-emerald-50/40',
    facade: 'border-amber-200 bg-amber-50/40',
  };
  const tagColor = {
    diagram: 'bg-blue-600 text-white',
    spatial: 'bg-emerald-700 text-white',
    facade: 'bg-amber-700 text-white',
  };
  return (
    <div className={`rounded-xl border ${colorMap[tone]} p-4`}>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`inline-flex h-6 items-center gap-1 rounded-md px-2 text-[10.5px] font-semibold tracking-wider ${tagColor[tone]}`}
        >
          {icon}
          {tag}
        </span>
      </div>
      <h4 className="mb-3 text-[14.5px] font-semibold leading-snug tracking-tight text-zinc-950">
        {title}
      </h4>
      {children}
    </div>
  );
}
