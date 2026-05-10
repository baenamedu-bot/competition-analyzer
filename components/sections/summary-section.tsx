import type { SummaryCategory } from '@/types';
import { DOC_LABELS } from '@/types';
import { AlertTriangle } from 'lucide-react';
import { SourceBadge, railClass } from '@/components/common/source-badge';
import { cn } from '@/lib/utils';

const CATEGORY_ORDER = ['사업 개요', '대지 정보', '건축 규모', '예산', '발주처', '핵심 설계 조건'];

export function SummarySection({ summary }: { summary: SummaryCategory[] }) {
  const sorted = [...summary].sort(
    (a, b) =>
      (CATEGORY_ORDER.indexOf(a.category) + 1 || 99) -
      (CATEGORY_ORDER.indexOf(b.category) + 1 || 99)
  );

  if (sorted.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {sorted.map((cat) => (
        <div key={cat.category} className="surface-card p-5">
          <div className="mb-4 flex items-baseline justify-between">
            <h3 className="text-[15px] font-semibold tracking-tight text-zinc-900">
              {cat.category}
            </h3>
            <span className="text-[11px] tabular-nums text-zinc-400">
              {cat.items.length}개 항목
            </span>
          </div>
          <ul className="space-y-3">
            {cat.items.length === 0 ? (
              <li className="text-[12.5px] text-zinc-400">추출된 항목 없음</li>
            ) : (
              cat.items.map((item, idx) => (
                <li
                  key={idx}
                  className={cn(
                    'pl-3 -ml-3',
                    item.conflict ? 'left-rail-warn border-l-[3px] border-warn pl-3' : railClass(item.source)
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12.5px] font-medium text-zinc-500">
                          {item.label}
                        </span>
                      </div>
                      {item.conflict ? (
                        <div className="mt-1.5 space-y-1">
                          {item.conflict.values.map((v, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1.5 text-[13.5px] tabular-nums text-zinc-900"
                            >
                              <span className="text-warn">●</span>
                              <span className="font-semibold">{v}</span>
                              <span className="text-[11.5px] text-zinc-400">
                                ({DOC_LABELS[item.conflict!.sources[i] as keyof typeof DOC_LABELS] ??
                                  item.conflict!.sources[i]})
                              </span>
                            </div>
                          ))}
                          <div className="inline-flex items-center gap-1 rounded-md bg-warn-soft px-1.5 py-0.5 text-[11px] font-semibold text-warn">
                            <AlertTriangle className="h-3 w-3" />
                            불일치
                          </div>
                        </div>
                      ) : (
                        <div className="mt-0.5 break-words text-[14px] font-semibold tabular-nums text-zinc-900">
                          {item.value || <span className="text-zinc-300">—</span>}
                        </div>
                      )}
                      {item.note && (
                        <div className="mt-1 text-[11.5px] leading-relaxed text-zinc-500">
                          {item.note}
                        </div>
                      )}
                    </div>
                    <SourceBadge source={item.source} className="shrink-0" />
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="surface-card p-8 text-center text-[13px] text-zinc-400">
      추출된 핵심 요약이 없습니다.
    </div>
  );
}
