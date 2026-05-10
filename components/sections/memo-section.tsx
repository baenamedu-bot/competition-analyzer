'use client';
import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Eye, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  value: string;
  onChange: (next: string) => void;
}

export function MemoSection({ value, onChange }: Props) {
  const [mode, setMode] = useState<'edit' | 'preview'>('edit');
  const [draft, setDraft] = useState(value);

  useEffect(() => setDraft(value), [value]);

  // debounce save
  useEffect(() => {
    if (draft === value) return;
    const t = setTimeout(() => onChange(draft), 400);
    return () => clearTimeout(t);
  }, [draft, value, onChange]);

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/40 px-4 py-2">
        <div className="text-[12.5px] font-medium tracking-tight text-zinc-700">
          마크다운 메모 · 자동 저장됩니다
        </div>
        <div className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5">
          <button
            onClick={() => setMode('edit')}
            className={cn(
              'inline-flex h-7 items-center gap-1 rounded px-2.5 text-[12px] font-medium transition-colors',
              mode === 'edit' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            <Pencil className="h-3 w-3" />
            편집
          </button>
          <button
            onClick={() => setMode('preview')}
            className={cn(
              'inline-flex h-7 items-center gap-1 rounded px-2.5 text-[12px] font-medium transition-colors',
              mode === 'preview' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:text-zinc-900'
            )}
          >
            <Eye className="h-3 w-3" />
            미리보기
          </button>
        </div>
      </div>
      {mode === 'edit' ? (
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={
            '예시) 정량평가 비율이 30%인데 모형 점수 비중이 의외로 큼.\n- 컨셉 5번(친환경) 살짝 보수적으로 고치기\n- 발주처에 추가 질의: 외부 마감재 제한 관련'
          }
          className="block h-[420px] w-full resize-y bg-white px-5 py-4 font-mono text-[13.5px] leading-relaxed text-zinc-800 placeholder:text-zinc-300 focus:outline-none"
        />
      ) : (
        <div className="prose prose-sm prose-zinc max-w-none px-5 py-5">
          {draft.trim() ? (
            <ReactMarkdown>{draft}</ReactMarkdown>
          ) : (
            <p className="text-zinc-400">메모가 비어 있습니다.</p>
          )}
        </div>
      )}
    </div>
  );
}
