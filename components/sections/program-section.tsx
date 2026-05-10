'use client';
import { useMemo } from 'react';
import type { ProgramArea, ProgramRelation } from '@/types';
import { SourceBadge } from '@/components/common/source-badge';
import { cn } from '@/lib/utils';

const REL_LABELS: Record<ProgramRelation['kind'], string> = {
  adjacent: '직접 인접',
  separated: '동선 분리',
  visual: '시각적 연결',
  secure: '보안 분리',
};

interface Props {
  programs: ProgramArea[];
  relations: ProgramRelation[];
}

export function ProgramSection({ programs, relations }: Props) {
  const layout = useMemo(() => computeLayout(programs, relations), [programs, relations]);

  if (programs.length === 0) {
    return (
      <div className="surface-card p-8 text-center text-[13px] text-zinc-400">
        프로그램 정보가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="surface-card overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-zinc-50/70 text-[11.5px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium">시설명</th>
              <th className="px-3 py-2.5 text-left font-medium">면적</th>
              <th className="px-3 py-2.5 text-left font-medium">수량</th>
              <th className="px-3 py-2.5 text-left font-medium">비고</th>
              <th className="px-3 py-2.5 text-left font-medium">출처</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p) => (
              <tr key={p.id} className="border-t border-zinc-100 hover:bg-zinc-50/40">
                <td className="px-3 py-2.5 align-top font-medium text-zinc-900">{p.name}</td>
                <td className="px-3 py-2.5 align-top tabular-nums text-zinc-700">{p.area}</td>
                <td className="px-3 py-2.5 align-top tabular-nums text-zinc-700">{p.count || '—'}</td>
                <td className="px-3 py-2.5 align-top text-[12px] text-zinc-500">{p.notes || ''}</td>
                <td className="px-3 py-2.5 align-top">
                  <SourceBadge source={p.source} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="surface-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-[14px] font-semibold tracking-tight text-zinc-900">
              Bubble Diagram · 프로그램 관계
            </h4>
            <p className="text-[12px] text-zinc-500">
              관계 종류는 선의 색·스타일로 구분됩니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 text-[11.5px]">
            <RelLegend color="#18181b" style="solid" thick label="직접 인접" />
            <RelLegend color="#dc2626" style="dashed" label="동선 분리" />
            <RelLegend color="#52525b" style="dashed" label="시각적 연결" />
            <RelLegend color="#dc2626" style="x" label="보안 분리" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            className="mx-auto w-full max-w-[820px]"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* relations */}
            {relations.map((r, i) => {
              const a = layout.nodes.find((n) => n.id === r.fromId);
              const b = layout.nodes.find((n) => n.id === r.toId);
              if (!a || !b) return null;
              const stroke = r.kind === 'adjacent' ? '#18181b' : r.kind === 'separated' || r.kind === 'secure' ? '#dc2626' : '#52525b';
              const sw =
                r.kind === 'adjacent' ? 2.5 : r.kind === 'visual' ? 1 : 1.5;
              const dash =
                r.kind === 'adjacent' ? undefined : r.kind === 'visual' ? '2 4' : '5 4';
              const opacity = r.source === 'ai' ? 0.55 : 1;
              return (
                <g key={i} opacity={opacity}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={stroke}
                    strokeWidth={sw}
                    strokeDasharray={dash}
                  />
                  {r.kind === 'secure' && (
                    <g>
                      <line
                        x1={(a.x + b.x) / 2 - 6}
                        y1={(a.y + b.y) / 2 - 6}
                        x2={(a.x + b.x) / 2 + 6}
                        y2={(a.y + b.y) / 2 + 6}
                        stroke="#dc2626"
                        strokeWidth={2}
                      />
                      <line
                        x1={(a.x + b.x) / 2 - 6}
                        y1={(a.y + b.y) / 2 + 6}
                        x2={(a.x + b.x) / 2 + 6}
                        y2={(a.y + b.y) / 2 - 6}
                        stroke="#dc2626"
                        strokeWidth={2}
                      />
                    </g>
                  )}
                </g>
              );
            })}
            {/* nodes */}
            {layout.nodes.map((n) => {
              const isAi = n.source === 'ai';
              return (
                <g key={n.id}>
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.r}
                    fill={isAi ? '#ecfdf5' : '#eff6ff'}
                    stroke={isAi ? '#10b981' : '#2563eb'}
                    strokeWidth={1.6}
                  />
                  <text
                    x={n.x}
                    y={n.y - 2}
                    fontSize={Math.max(10, Math.min(13, n.r / 3))}
                    fontWeight={600}
                    textAnchor="middle"
                    fill="#0f172a"
                  >
                    {n.label.length > 8 ? n.label.slice(0, 7) + '…' : n.label}
                  </text>
                  <text
                    x={n.x}
                    y={n.y + 12}
                    fontSize="10"
                    textAnchor="middle"
                    fill="#71717a"
                    className="font-mono"
                  >
                    {n.area}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* relation list */}
        {relations.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {relations.map((r, i) => {
              const a = programs.find((p) => p.id === r.fromId);
              const b = programs.find((p) => p.id === r.toId);
              if (!a || !b) return null;
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-[12px]',
                    r.kind === 'adjacent' && 'border-zinc-200 bg-white',
                    r.kind === 'separated' && 'border-red-200 bg-red-50/40',
                    r.kind === 'visual' && 'border-zinc-200 bg-white',
                    r.kind === 'secure' && 'border-red-200 bg-red-50/40'
                  )}
                >
                  <div className="flex items-center gap-1.5 text-zinc-700">
                    <span className="font-medium">{a.name}</span>
                    <span className="text-zinc-400">↔</span>
                    <span className="font-medium">{b.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'rounded px-1.5 py-0.5 text-[10.5px] font-semibold',
                        r.kind === 'adjacent' && 'bg-zinc-100 text-zinc-700',
                        r.kind === 'separated' && 'bg-red-100 text-red-700',
                        r.kind === 'visual' && 'bg-blue-50 text-blue-700',
                        r.kind === 'secure' && 'bg-red-100 text-red-700'
                      )}
                    >
                      {REL_LABELS[r.kind]}
                    </span>
                    <SourceBadge source={r.source} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RelLegend({
  color,
  style,
  thick,
  label,
}: {
  color: string;
  style: 'solid' | 'dashed' | 'x';
  thick?: boolean;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-zinc-600">
      <svg width="22" height="10" viewBox="0 0 22 10">
        {style === 'x' ? (
          <g stroke={color} strokeWidth={1.8}>
            <line x1="2" y1="2" x2="20" y2="8" strokeDasharray="4 3" />
            <line x1="9" y1="2" x2="13" y2="8" />
            <line x1="13" y1="2" x2="9" y2="8" />
          </g>
        ) : (
          <line
            x1="2"
            y1="5"
            x2="20"
            y2="5"
            stroke={color}
            strokeWidth={thick ? 2.4 : 1.4}
            strokeDasharray={style === 'dashed' ? '4 3' : undefined}
          />
        )}
      </svg>
      {label}
    </span>
  );
}

interface NodeLayout {
  id: string;
  label: string;
  area: string;
  source: ProgramArea['source'];
  x: number;
  y: number;
  r: number;
}

function parseAreaSqm(s: string): number {
  const m = s.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
  return m ? parseFloat(m[1]) : 50;
}

function computeLayout(
  programs: ProgramArea[],
  relations: ProgramRelation[]
): { width: number; height: number; nodes: NodeLayout[] } {
  const width = 800;
  const height = Math.max(440, 380 + Math.max(0, programs.length - 8) * 18);
  const cx = width / 2;
  const cy = height / 2;

  const areas = programs.map((p) => parseAreaSqm(p.area));
  const maxArea = Math.max(...areas, 1);
  const minR = 26;
  const maxR = 56;

  // sort by adjacency degree so well-connected programs sit closer to center
  const degree = new Map<string, number>();
  for (const r of relations) {
    if (r.kind === 'adjacent' || r.kind === 'visual') {
      degree.set(r.fromId, (degree.get(r.fromId) ?? 0) + 1);
      degree.set(r.toId, (degree.get(r.toId) ?? 0) + 1);
    }
  }
  const ordered = [...programs].sort(
    (a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0)
  );

  const nodes: NodeLayout[] = [];
  const n = ordered.length;
  if (n === 0) return { width, height, nodes };

  // Place top-degree node at center; others on concentric rings.
  ordered.forEach((p, i) => {
    const r = minR + ((parseAreaSqm(p.area) / maxArea) * (maxR - minR));
    let x: number;
    let y: number;
    if (i === 0 && n > 4) {
      x = cx;
      y = cy;
    } else {
      const ringIdx = i === 0 ? 0 : Math.floor((i - 1) / 6);
      const ringSize = i === 0 ? 1 : Math.min(6, n - 1 - ringIdx * 6);
      const angleStep = (Math.PI * 2) / Math.max(ringSize, 6);
      const angle = ((i - 1) % 6) * angleStep + (ringIdx % 2 ? Math.PI / 6 : 0);
      const radius = 110 + ringIdx * 110;
      x = cx + Math.cos(angle) * radius;
      y = cy + Math.sin(angle) * radius;
    }
    nodes.push({ id: p.id, label: p.name, area: p.area, source: p.source, x, y, r });
  });

  // simple collision relaxation
  for (let iter = 0; iter < 60; iter++) {
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const na = nodes[a];
        const nb = nodes[b];
        const dx = nb.x - na.x;
        const dy = nb.y - na.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const minDist = na.r + nb.r + 12;
        if (dist < minDist) {
          const overlap = (minDist - dist) / 2;
          const ux = dx / dist;
          const uy = dy / dist;
          na.x -= ux * overlap;
          na.y -= uy * overlap;
          nb.x += ux * overlap;
          nb.y += uy * overlap;
        }
      }
    }
    // gentle pull toward center for stability
    for (const n2 of nodes) {
      n2.x += (cx - n2.x) * 0.01;
      n2.y += (cy - n2.y) * 0.01;
    }
  }
  // clamp into viewport
  for (const node of nodes) {
    node.x = Math.max(node.r + 6, Math.min(width - node.r - 6, node.x));
    node.y = Math.max(node.r + 6, Math.min(height - node.r - 6, node.y));
  }

  return { width, height, nodes };
}
