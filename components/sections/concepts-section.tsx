'use client';
import { useState } from 'react';
import { Star, ThumbsUp, AlertTriangle, Lightbulb, Sparkles, Wand2 } from 'lucide-react';
import type { DesignConcept, ConceptDevelopment } from '@/types';
import { SourceBadge } from '@/components/common/source-badge';
import { DevelopmentPanel } from '@/components/concepts/development-panel';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const CATEGORY_COLORS: Record<string, string> = {
  형태: 'bg-zinc-100 text-zinc-700',
  '형태 (Form)': 'bg-zinc-100 text-zinc-700',
  기능: 'bg-blue-50 text-blue-700',
  지역성: 'bg-amber-50 text-amber-700',
  친환경: 'bg-emerald-50 text-emerald-700',
  '사용자 경험': 'bg-violet-50 text-violet-700',
  기술: 'bg-sky-50 text-sky-700',
  서사: 'bg-rose-50 text-rose-700',
  재료: 'bg-stone-100 text-stone-700',
  프로그램: 'bg-indigo-50 text-indigo-700',
  도시: 'bg-teal-50 text-teal-700',
};

function categoryColor(category: string): string {
  for (const key of Object.keys(CATEGORY_COLORS)) {
    if (category.includes(key)) return CATEGORY_COLORS[key];
  }
  return 'bg-zinc-100 text-zinc-700';
}

interface Props {
  concepts: DesignConcept[];
  starredIds: string[];
  onToggleStar: (id: string) => void;
  developments?: Record<string, ConceptDevelopment>;
  onDevelop?: (concept: DesignConcept, index: number) => void;
  onDeleteDevelopment?: (conceptId: string) => void;
  /** Force-open all panels and hide interactive controls (used by PDF export). */
  staticAll?: boolean;
}

export function ConceptsSection({
  concepts,
  starredIds,
  onToggleStar,
  developments,
  onDevelop,
  onDeleteDevelopment,
  staticAll = false,
}: Props) {
  const [openPanels, setOpenPanels] = useState<Set<string>>(new Set());

  if (concepts.length === 0) {
    return (
      <div className="surface-card p-8 text-center text-[13px] text-zinc-400">
        생성된 컨셉이 없습니다.
      </div>
    );
  }

  function togglePanel(id: string) {
    setOpenPanels((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {concepts.map((c, idx) => {
        const starred = starredIds.includes(c.id);
        const dev = developments?.[c.id];
        const open = staticAll || openPanels.has(c.id);
        return (
          <article
            key={c.id}
            className={cn(
              'surface-card relative flex flex-col gap-3 p-5 transition-all',
              starred && 'border-amber-200 bg-amber-50/20 ring-1 ring-amber-100',
              dev && 'border-zinc-300'
            )}
          >
            <header className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-[12px] font-mono font-semibold text-white">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span
                  className={cn(
                    'rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-tight',
                    categoryColor(c.category)
                  )}
                >
                  {c.category}
                </span>
                <SourceBadge source={c.source} />
                {dev && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-white px-1.5 py-0.5 text-[10.5px] font-semibold text-zinc-700">
                    <Sparkles className="h-2.5 w-2.5" />
                    발전됨
                  </span>
                )}
              </div>
              {!staticAll && (
                <button
                  onClick={() => onToggleStar(c.id)}
                  className={cn(
                    'inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                    starred
                      ? 'text-amber-500 hover:bg-amber-100'
                      : 'text-zinc-300 hover:bg-zinc-100 hover:text-zinc-500'
                  )}
                  aria-label={starred ? '즐겨찾기 해제' : '즐겨찾기'}
                >
                  <Star
                    className="h-[18px] w-[18px]"
                    fill={starred ? 'currentColor' : 'none'}
                    strokeWidth={1.7}
                  />
                </button>
              )}
            </header>

            <div>
              <h3 className="text-[18px] font-semibold leading-tight tracking-tight text-zinc-950">
                {c.nameKo}
              </h3>
              <div className="mt-0.5 text-[12px] font-mono uppercase tracking-wider text-zinc-400">
                {c.nameEn}
              </div>
              <p className="mt-2 text-[13.5px] font-medium leading-relaxed text-zinc-700">
                {c.oneLiner}
              </p>
            </div>

            <div className="rounded-lg bg-zinc-50/70 p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                <Lightbulb className="h-3 w-3" />
                발상 배경
              </div>
              <p className="text-[12.5px] leading-relaxed text-zinc-600">{c.rationale}</p>
            </div>

            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                공간/형태 전략
              </div>
              <p className="text-[12.5px] leading-relaxed text-zinc-700">{c.spatialStrategy}</p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {c.keywords.map((kw) => (
                <span
                  key={kw}
                  className="rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-600"
                >
                  {kw}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-700">
                  <ThumbsUp className="h-3 w-3" />
                  강점
                </div>
                <ul className="space-y-0.5 text-[12px] leading-relaxed text-zinc-600">
                  {c.strengths.map((s, i) => (
                    <li key={i} className="pl-2 -indent-2">· {s}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-red-700">
                  <AlertTriangle className="h-3 w-3" />
                  약점
                </div>
                <ul className="space-y-0.5 text-[12px] leading-relaxed text-zinc-600">
                  {c.weaknesses.map((s, i) => (
                    <li key={i} className="pl-2 -indent-2">· {s}</li>
                  ))}
                </ul>
              </div>
            </div>

            {!staticAll && onDevelop && (
              <div className="pt-2">
                <Button
                  variant={dev ? 'outline' : 'cta'}
                  size="sm"
                  className="w-full"
                  onClick={() => onDevelop(c, idx)}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                  {dev ? '발전안 다시 생성 / 편집' : '이 컨셉으로 발전시키기'}
                </Button>
              </div>
            )}

            {dev && (
              <DevelopmentPanel
                dev={dev}
                open={open}
                onToggle={() => !staticAll && togglePanel(c.id)}
                onRegenerate={() => onDevelop?.(c, idx)}
                onDelete={() => onDeleteDevelopment?.(c.id)}
                readOnly={staticAll}
              />
            )}
          </article>
        );
      })}
    </div>
  );
}
