'use client';
import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { Submittable } from '@/types';
import { SourceBadge } from '@/components/common/source-badge';
import { cn } from '@/lib/utils';

interface Props {
  submittables: Submittable[];
  checkedIds: string[];
  onToggle: (id: string) => void;
}

export function ChecklistSection({ submittables, checkedIds, onToggle }: Props) {
  const { totalRequired, doneRequired } = useMemo(() => {
    const req = submittables.filter((s) => s.required);
    const done = req.filter((s) => checkedIds.includes(s.id)).length;
    return { totalRequired: req.length, doneRequired: done };
  }, [submittables, checkedIds]);

  if (submittables.length === 0) {
    return (
      <div className="surface-card p-8 text-center text-[13px] text-zinc-400">
        제출물 항목이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="surface-card flex items-center justify-between gap-4 px-5 py-4">
        <div>
          <div className="text-[13px] font-semibold tracking-tight text-zinc-900">
            필수 제출물 진행률
          </div>
          <div className="text-[12px] text-zinc-500">누락 시 실격 처리되는 항목 기준</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[20px] font-semibold tabular-nums text-zinc-900">
              {doneRequired}
              <span className="text-zinc-300"> / {totalRequired}</span>
            </div>
            <div className="text-[11px] uppercase tracking-wider text-zinc-400">완료</div>
          </div>
          <div className="h-12 w-1.5 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={cn(
                'h-full transition-all duration-500',
                doneRequired === totalRequired && totalRequired > 0
                  ? 'bg-emerald-500'
                  : 'bg-zinc-900'
              )}
              style={{
                height: totalRequired === 0 ? '100%' : `${(doneRequired / totalRequired) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="surface-card overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-zinc-50/70 text-[11.5px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="w-12 px-3 py-2.5"></th>
              <th className="px-3 py-2.5 text-left font-medium">항목</th>
              <th className="px-3 py-2.5 text-left font-medium">규격</th>
              <th className="px-3 py-2.5 text-left font-medium">형식</th>
              <th className="px-3 py-2.5 text-left font-medium">부수</th>
              <th className="px-3 py-2.5 text-left font-medium">제출 방법</th>
              <th className="px-3 py-2.5 text-left font-medium">출처</th>
            </tr>
          </thead>
          <tbody>
            {submittables.map((s) => {
              const checked = checkedIds.includes(s.id);
              return (
                <tr
                  key={s.id}
                  className={cn(
                    'border-t border-zinc-100 transition-colors hover:bg-zinc-50/40',
                    checked && 'bg-emerald-50/30'
                  )}
                >
                  <td className="px-3 py-3 text-center align-top">
                    <button
                      onClick={() => onToggle(s.id)}
                      aria-label="완료 토글"
                      className={cn(
                        'inline-flex h-5 w-5 items-center justify-center rounded-md border transition-all',
                        checked
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-zinc-300 bg-white text-transparent hover:border-zinc-400'
                      )}
                    >
                      <CheckCircle2 className="h-3 w-3" strokeWidth={2.6} fill="none" />
                    </button>
                  </td>
                  <td className="px-3 py-3 align-top">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          'font-medium text-zinc-900',
                          checked && 'text-zinc-500 line-through decoration-1'
                        )}
                      >
                        {s.name}
                      </span>
                      {s.required && (
                        <span className="inline-flex items-center gap-1 rounded bg-warn-soft px-1.5 py-0.5 text-[10.5px] font-semibold text-warn">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          누락 시 실격
                        </span>
                      )}
                    </div>
                    {s.note && (
                      <div className="mt-0.5 text-[11.5px] leading-relaxed text-zinc-500">
                        {s.note}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 align-top text-[12.5px] text-zinc-600">{s.spec}</td>
                  <td className="px-3 py-3 align-top text-[12.5px] text-zinc-600">{s.format}</td>
                  <td className="px-3 py-3 align-top text-[12.5px] tabular-nums text-zinc-600">
                    {s.copies}
                  </td>
                  <td className="px-3 py-3 align-top text-[12.5px] text-zinc-600">{s.method}</td>
                  <td className="px-3 py-3 align-top">
                    <SourceBadge source={s.source} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
