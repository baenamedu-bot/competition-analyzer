'use client';
import { ChevronDown, Pencil, LayoutGrid, Layers, Trash2, RefreshCcw } from 'lucide-react';
import type { ConceptDevelopment } from '@/types';
import { cn, formatDate } from '@/lib/utils';

interface Props {
  dev: ConceptDevelopment;
  open: boolean;
  onToggle: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}

export function DevelopmentPanel({ dev, open, onToggle, onRegenerate, onDelete, readOnly }: Props) {
  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50/50">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors hover:bg-zinc-100/70"
      >
        <span className="flex items-center gap-2">
          <span className="inline-flex h-5 items-center gap-1 rounded-md bg-zinc-900 px-1.5 text-[10px] font-semibold tracking-wider text-white">
            발전안
          </span>
          <span className="text-[12.5px] font-medium text-zinc-700">
            다이어그램 · 공간 · 입면 3개 묶음
          </span>
          <span className="text-[10.5px] tabular-nums text-zinc-400">
            {formatDate(dev.generatedAt)}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-zinc-400 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="space-y-3 border-t border-zinc-200 bg-white px-3 py-3 animate-fade-in">
          <Block
            tone="diagram"
            tag="A · 다이어그램"
            icon={<Pencil className="h-3 w-3" strokeWidth={2.2} />}
            title={dev.diagram.summary}
          >
            <div className="flex flex-wrap gap-1">
              {dev.diagram.keywords.map((k) => (
                <span
                  key={k}
                  className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10.5px] text-zinc-700"
                >
                  {k}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-zinc-600">
              {dev.diagram.geometry}
            </p>
          </Block>

          <Block
            tone="spatial"
            tag="B · 핵심 공간"
            icon={<LayoutGrid className="h-3 w-3" strokeWidth={2.2} />}
            title={dev.spatial.summary}
          >
            <ul className="space-y-1">
              {dev.spatial.spaces.map((s, i) => (
                <li key={i} className="text-[11.5px] leading-relaxed text-zinc-700">
                  <span className="font-semibold text-zinc-900">{s.name}</span>
                  <span className="mx-1 text-zinc-300">—</span>
                  {s.description}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11.5px] leading-relaxed text-zinc-600">
              <span className="font-semibold text-zinc-700">동선 : </span>
              {dev.spatial.circulation}
            </p>
          </Block>

          <Block
            tone="facade"
            tag="C · 입면 · 재료"
            icon={<Layers className="h-3 w-3" strokeWidth={2.2} />}
            title={dev.facade.summary}
          >
            <div className="flex flex-wrap gap-1">
              {dev.facade.materials.map((m) => (
                <span
                  key={m}
                  className="rounded border border-stone-300 bg-stone-50 px-1.5 py-0.5 text-[10.5px] text-stone-700"
                >
                  {m}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-zinc-600">
              <span className="font-semibold text-zinc-700">전략 : </span>
              {dev.facade.facadeStrategy}
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-zinc-600">
              <span className="font-semibold text-zinc-700">디테일 : </span>
              {dev.facade.detailNotes}
            </p>
          </Block>

          {!readOnly && (
            <div className="flex items-center justify-end gap-1 border-t border-zinc-100 pt-2">
              <button
                onClick={onRegenerate}
                className="inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <RefreshCcw className="h-3 w-3" />
                다시 생성
              </button>
              <button
                onClick={onDelete}
                className="inline-flex h-7 items-center gap-1 rounded px-2 text-[11px] font-medium text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-3 w-3" />
                삭제
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Block({
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
  const tagColor = {
    diagram: 'bg-blue-600 text-white',
    spatial: 'bg-emerald-700 text-white',
    facade: 'bg-amber-700 text-white',
  };
  const ringColor = {
    diagram: 'border-blue-100 bg-blue-50/30',
    spatial: 'border-emerald-100 bg-emerald-50/30',
    facade: 'border-amber-100 bg-amber-50/30',
  };
  return (
    <div className={cn('rounded-md border p-2.5', ringColor[tone])}>
      <div className="mb-1 flex items-center gap-2">
        <span
          className={cn(
            'inline-flex h-5 items-center gap-1 rounded px-1.5 text-[9.5px] font-semibold tracking-wider',
            tagColor[tone]
          )}
        >
          {icon}
          {tag}
        </span>
        <span className="text-[12.5px] font-semibold tracking-tight text-zinc-900">
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
