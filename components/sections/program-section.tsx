'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pencil, X, Save, RotateCcw, Trash2, Check, Plus, Lock, MousePointerClick } from 'lucide-react';
import { toast } from 'sonner';
import type { ProgramArea, ProgramRelation, RelationKind } from '@/types';
import { SourceBadge } from '@/components/common/source-badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const REL_LABELS: Record<RelationKind, string> = {
  adjacent: '직접 인접',
  separated: '동선 분리',
  visual: '시각적 연결',
  secure: '보안 분리',
};

const REL_DESC: Record<RelationKind, string> = {
  adjacent: '굵은 검은 실선 — 같은 층 / 한 벽 공유',
  separated: '빨간 점선 — 직접 동선 차단',
  visual: '얇은 점선 — 시야 연결 (벽 X)',
  secure: '빨간 점선 + X — 보안 격리',
};

interface Props {
  programs: ProgramArea[];
  relations: ProgramRelation[];
  /** Stable layout anchor — defaults to relations. Pass analysis.relations to keep node positions
   * fixed while user edits relations. */
  layoutRelations?: ProgramRelation[];
  editable?: boolean;
  hasOverride?: boolean;
  onSave?: (relations: ProgramRelation[]) => void;
  onResetOverride?: () => void;
}

export function ProgramSection({
  programs,
  relations,
  layoutRelations,
  editable = false,
  hasOverride = false,
  onSave,
  onResetOverride,
}: Props) {
  const layout = useMemo(
    () => computeLayout(programs, layoutRelations ?? relations),
    [programs, layoutRelations, relations]
  );

  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<ProgramRelation[]>(relations);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [hoverNodeId, setHoverNodeId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{
    fromId: string;
    cur: { x: number; y: number };
  } | null>(null);
  const [picker, setPicker] = useState<{
    from: string;
    to: string;
    clientX: number;
    clientY: number;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // sync draft when external relations change & not editing
  useEffect(() => {
    if (!editMode) setDraft(relations);
  }, [relations, editMode]);

  const displayRelations = editMode ? draft : relations;
  const isDirty = useMemo(() => {
    if (!editMode) return false;
    return !sameRelations(draft, relations);
  }, [editMode, draft, relations]);

  function startEdit() {
    setDraft([...relations]);
    setEditMode(true);
  }
  function cancelEdit() {
    setDraft([...relations]);
    setEditMode(false);
    setDragging(null);
    setPicker(null);
    setHoverIdx(null);
  }
  function saveEdit() {
    onSave?.(draft);
    setEditMode(false);
    setDragging(null);
    setPicker(null);
    setHoverIdx(null);
    toast.success('관계 편집 결과를 저장했습니다.');
  }
  function resetToOriginal() {
    onResetOverride?.();
    setEditMode(false);
    setDragging(null);
    setPicker(null);
    setHoverIdx(null);
    toast.success('원래 분석 결과로 되돌렸습니다.');
  }

  function tryDelete(idx: number) {
    const rel = draft[idx];
    if (rel.source !== 'ai') {
      toast.error('지침 관계선은 잠겨 있어 삭제할 수 없습니다.');
      return;
    }
    setDraft((prev) => prev.filter((_, i) => i !== idx));
    setHoverIdx(null);
  }

  function addRelation(from: string, to: string, kind: RelationKind) {
    if (from === to) {
      toast.error('같은 노드끼리는 연결할 수 없습니다.');
      return;
    }
    const exists = draft.some(
      (r) =>
        (r.fromId === from && r.toId === to) ||
        (r.fromId === to && r.toId === from)
    );
    if (exists) {
      toast.error('이미 같은 노드 쌍의 관계가 있습니다. 먼저 삭제 후 다시 추가하세요.');
      setPicker(null);
      return;
    }
    setDraft((prev) => [...prev, { fromId: from, toId: to, kind, source: 'ai' }]);
    setPicker(null);
    toast.success(`${REL_LABELS[kind]} 관계를 추가했습니다.`);
  }

  // ---- Drag-to-connect ----
  useEffect(() => {
    if (!dragging) return;
    let current = dragging;

    function clientToSvg(clientX: number, clientY: number) {
      const svg = svgRef.current;
      if (!svg) return null;
      const pt = svg.createSVGPoint();
      pt.x = clientX;
      pt.y = clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      return pt.matrixTransform(ctm.inverse());
    }
    function handleMove(e: MouseEvent) {
      const p = clientToSvg(e.clientX, e.clientY);
      if (!p) return;
      current = { ...current, cur: { x: p.x, y: p.y } };
      setDragging(current);
    }
    function handleUp(e: MouseEvent) {
      const dropX = current.cur.x;
      const dropY = current.cur.y;
      const target = layout.nodes.find((n) => {
        const dx = n.x - dropX;
        const dy = n.y - dropY;
        return Math.sqrt(dx * dx + dy * dy) < n.r + 8;
      });
      if (target && target.id !== current.fromId) {
        setPicker({
          from: current.fromId,
          to: target.id,
          clientX: e.clientX,
          clientY: e.clientY,
        });
      }
      setDragging(null);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setDragging(null);
    }
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
      document.removeEventListener('keydown', handleKey);
    };
    // Only attach when a drag starts; layout.nodes is stable across edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging?.fromId]);

  function handleNodeMouseDown(e: React.MouseEvent, nodeId: string) {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    const node = layout.nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setPicker(null);
    setDragging({ fromId: nodeId, cur: { x: node.x, y: node.y } });
  }

  function handleEsc(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      setPicker(null);
    }
  }
  useEffect(() => {
    if (!picker) return;
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [picker]);

  if (programs.length === 0) {
    return (
      <div className="surface-card p-8 text-center text-[13px] text-zinc-400">
        프로그램 정보가 없습니다.
      </div>
    );
  }

  const aiCount = displayRelations.filter((r) => r.source === 'ai').length;
  const docCount = displayRelations.length - aiCount;

  return (
    <div className="space-y-5">
      {/* ---- Programs table ---- */}
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

      {/* ---- Bubble Diagram ---- */}
      <div className="surface-card p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h4 className="text-[14px] font-semibold tracking-tight text-zinc-900">
              Bubble Diagram · 프로그램 관계
            </h4>
            <p className="mt-0.5 text-[12px] text-zinc-500">
              관계 종류는 선의 색·스타일로 구분됩니다.
              <span className="ml-2 inline-flex items-center gap-2 text-[11.5px] text-zinc-500">
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono">
                  {docCount}
                </span>
                지침
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono">
                  {aiCount}
                </span>
                추천
              </span>
            </p>
          </div>

          {editable && (
            <div className="flex flex-wrap items-center gap-2 no-print">
              {!editMode ? (
                <>
                  {hasOverride && (
                    <span className="inline-flex items-center gap-1 rounded-md border border-zinc-300 bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-700">
                      <Check className="h-3 w-3" />
                      편집됨
                    </span>
                  )}
                  <Button variant="outline" size="sm" onClick={startEdit}>
                    <Pencil className="h-3.5 w-3.5" />
                    관계 편집
                  </Button>
                  {hasOverride && (
                    <Button variant="ghost" size="sm" onClick={resetToOriginal}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      원래 분석으로
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button variant="ghost" size="sm" onClick={cancelEdit}>
                    <X className="h-3.5 w-3.5" />
                    취소
                  </Button>
                  <Button
                    variant="cta"
                    size="sm"
                    onClick={saveEdit}
                    disabled={!isDirty}
                  >
                    <Save className="h-3.5 w-3.5" />
                    변경 저장
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Edit-mode hint banner */}
        {editMode && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50/40 px-3 py-2 text-[12px] text-blue-900 no-print">
            <MousePointerClick className="mt-[2px] h-3.5 w-3.5 shrink-0" strokeWidth={2} />
            <div className="leading-relaxed">
              <strong>편집 모드</strong> · 노드를 잡고 다른 노드 위로 끌어 놓으면 새 관계를 추가할
              수 있습니다. <span className="text-emerald-700 font-semibold">[추천]</span> 선을 클릭하면 삭제됩니다.{' '}
              <span className="text-blue-700 font-semibold">[지침]</span> 선은 잠겨 있어
              삭제할 수 없습니다.
            </div>
          </div>
        )}

        <div className="mb-3 flex flex-wrap gap-3 text-[11.5px]">
          <RelLegend color="#18181b" style="solid" thick label="직접 인접" />
          <RelLegend color="#dc2626" style="dashed" label="동선 분리" />
          <RelLegend color="#52525b" style="dashed" label="시각적 연결" />
          <RelLegend color="#dc2626" style="x" label="보안 분리" />
        </div>

        <div className="relative overflow-x-auto">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${layout.width} ${layout.height}`}
            className="mx-auto w-full max-w-[820px] select-none"
            preserveAspectRatio="xMidYMid meet"
            style={{ touchAction: 'none' }}
          >
            {/* relations */}
            {displayRelations.map((r, idx) => {
              const a = layout.nodes.find((n) => n.id === r.fromId);
              const b = layout.nodes.find((n) => n.id === r.toId);
              if (!a || !b) return null;
              const stroke =
                r.kind === 'adjacent'
                  ? '#18181b'
                  : r.kind === 'separated' || r.kind === 'secure'
                  ? '#dc2626'
                  : '#52525b';
              const baseSw =
                r.kind === 'adjacent' ? 2.5 : r.kind === 'visual' ? 1 : 1.5;
              const dash =
                r.kind === 'adjacent'
                  ? undefined
                  : r.kind === 'visual'
                  ? '2 4'
                  : '5 4';
              const isAi = r.source === 'ai';
              const opacity = isAi ? 0.55 : 1;
              const isHovered = editMode && hoverIdx === idx;
              const sw = isHovered ? baseSw + 2 : baseSw;
              const midX = (a.x + b.x) / 2;
              const midY = (a.y + b.y) / 2;
              return (
                <g key={`r${idx}`}>
                  {/* visible line */}
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={stroke}
                    strokeWidth={sw}
                    strokeDasharray={dash}
                    opacity={opacity}
                  />
                  {r.kind === 'secure' && (
                    <g opacity={opacity}>
                      <line
                        x1={midX - 6}
                        y1={midY - 6}
                        x2={midX + 6}
                        y2={midY + 6}
                        stroke="#dc2626"
                        strokeWidth={2}
                      />
                      <line
                        x1={midX - 6}
                        y1={midY + 6}
                        x2={midX + 6}
                        y2={midY - 6}
                        stroke="#dc2626"
                        strokeWidth={2}
                      />
                    </g>
                  )}
                  {/* hit-line for click handling (edit mode only) */}
                  {editMode && (
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="transparent"
                      strokeWidth={16}
                      style={{ cursor: isAi ? 'pointer' : 'not-allowed' }}
                      onMouseEnter={() => setHoverIdx(idx)}
                      onMouseLeave={() =>
                        setHoverIdx((v) => (v === idx ? null : v))
                      }
                      onClick={() => tryDelete(idx)}
                      pointerEvents="stroke"
                    />
                  )}
                  {/* hover affordance */}
                  {isHovered && (
                    <g pointerEvents="none">
                      {isAi ? (
                        <>
                          <circle cx={midX} cy={midY} r={11} fill="#fef2f2" stroke="#dc2626" strokeWidth={1.4} />
                          <line x1={midX - 4} y1={midY - 4} x2={midX + 4} y2={midY + 4} stroke="#dc2626" strokeWidth={2} />
                          <line x1={midX - 4} y1={midY + 4} x2={midX + 4} y2={midY - 4} stroke="#dc2626" strokeWidth={2} />
                        </>
                      ) : (
                        <>
                          <circle cx={midX} cy={midY} r={11} fill="#f4f4f5" stroke="#71717a" strokeWidth={1.4} />
                          <rect x={midX - 3} y={midY - 1} width={6} height={5} fill="#52525b" rx={0.5} />
                          <path
                            d={`M${midX - 2.2} ${midY - 1} v-1.5 a2.2 2.2 0 0 1 4.4 0 v1.5`}
                            stroke="#52525b"
                            strokeWidth={1.2}
                            fill="none"
                          />
                        </>
                      )}
                    </g>
                  )}
                </g>
              );
            })}

            {/* in-progress drag line */}
            {dragging && (
              <g pointerEvents="none">
                {(() => {
                  const start = layout.nodes.find((n) => n.id === dragging.fromId);
                  if (!start) return null;
                  return (
                    <>
                      <line
                        x1={start.x}
                        y1={start.y}
                        x2={dragging.cur.x}
                        y2={dragging.cur.y}
                        stroke="#0ea5e9"
                        strokeWidth={2.4}
                        strokeDasharray="6 4"
                      />
                      <circle cx={dragging.cur.x} cy={dragging.cur.y} r={5} fill="#0ea5e9" />
                    </>
                  );
                })()}
              </g>
            )}

            {/* nodes */}
            {layout.nodes.map((n) => {
              const isAi = n.source === 'ai';
              const isDragSrc = dragging?.fromId === n.id;
              const isDropTarget =
                !!dragging &&
                dragging.fromId !== n.id &&
                Math.hypot(dragging.cur.x - n.x, dragging.cur.y - n.y) < n.r + 8;
              const isHover = editMode && hoverNodeId === n.id;
              return (
                <g
                  key={n.id}
                  onMouseEnter={() => editMode && setHoverNodeId(n.id)}
                  onMouseLeave={() =>
                    editMode && setHoverNodeId((v) => (v === n.id ? null : v))
                  }
                  style={{ cursor: editMode ? 'crosshair' : 'default' }}
                >
                  {/* halo on drop target */}
                  {(isDropTarget || isDragSrc) && (
                    <circle
                      cx={n.x}
                      cy={n.y}
                      r={n.r + 8}
                      fill="none"
                      stroke="#0ea5e9"
                      strokeWidth={2.2}
                      strokeDasharray={isDragSrc ? undefined : '4 3'}
                      pointerEvents="none"
                    />
                  )}
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={n.r}
                    fill={isAi ? '#ecfdf5' : '#eff6ff'}
                    stroke={isAi ? '#10b981' : '#2563eb'}
                    strokeWidth={isHover ? 2.4 : 1.6}
                    onMouseDown={(e) => handleNodeMouseDown(e, n.id)}
                  />
                  <text
                    x={n.x}
                    y={n.y - 2}
                    fontSize={Math.max(10, Math.min(13, n.r / 3))}
                    fontWeight={600}
                    textAnchor="middle"
                    fill="#0f172a"
                    pointerEvents="none"
                  >
                    {n.label.length > 8 ? n.label.slice(0, 7) + '…' : n.label}
                  </text>
                  <text
                    x={n.x}
                    y={n.y + 12}
                    fontSize="10"
                    textAnchor="middle"
                    fill="#71717a"
                    pointerEvents="none"
                    className="font-mono"
                  >
                    {n.area}
                  </text>
                  {/* draggable affordance in edit mode */}
                  {editMode && isHover && !dragging && (
                    <g pointerEvents="none">
                      <circle cx={n.x + n.r * 0.7} cy={n.y - n.r * 0.7} r={7} fill="#0f172a" />
                      <line x1={n.x + n.r * 0.7 - 3} y1={n.y - n.r * 0.7} x2={n.x + n.r * 0.7 + 3} y2={n.y - n.r * 0.7} stroke="#fff" strokeWidth={1.4} />
                      <line x1={n.x + n.r * 0.7} y1={n.y - n.r * 0.7 - 3} x2={n.x + n.r * 0.7} y2={n.y - n.r * 0.7 + 3} stroke="#fff" strokeWidth={1.4} />
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* picker popover */}
          {picker && (
            <RelationKindPicker
              from={programs.find((p) => p.id === picker.from)?.name ?? '—'}
              to={programs.find((p) => p.id === picker.to)?.name ?? '—'}
              clientX={picker.clientX}
              clientY={picker.clientY}
              onPick={(k) => addRelation(picker.from, picker.to, k)}
              onCancel={() => setPicker(null)}
            />
          )}
        </div>

        {/* relation list */}
        {displayRelations.length > 0 && (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {displayRelations.map((r, i) => {
              const a = programs.find((p) => p.id === r.fromId);
              const b = programs.find((p) => p.id === r.toId);
              if (!a || !b) return null;
              const isAi = r.source === 'ai';
              return (
                <div
                  key={i}
                  className={cn(
                    'group flex items-center justify-between gap-2 rounded-lg border px-3 py-1.5 text-[12px]',
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
                    {editMode && (
                      <button
                        onClick={() => tryDelete(i)}
                        className={cn(
                          'inline-flex h-6 w-6 items-center justify-center rounded-md transition-colors',
                          isAi
                            ? 'text-zinc-400 hover:bg-red-50 hover:text-red-600'
                            : 'text-zinc-300 cursor-not-allowed'
                        )}
                        aria-label={isAi ? '삭제' : '잠김'}
                        title={isAi ? '삭제' : '지침 관계는 잠김'}
                      >
                        {isAi ? <Trash2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      </button>
                    )}
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

// ===== Helpers =====

function sameRelations(a: ProgramRelation[], b: ProgramRelation[]) {
  if (a.length !== b.length) return false;
  const key = (r: ProgramRelation) =>
    `${r.fromId}|${r.toId}|${r.kind}|${r.source}`;
  const sa = a.map(key).sort();
  const sb = b.map(key).sort();
  return sa.every((v, i) => v === sb[i]);
}

function RelationKindPicker({
  from,
  to,
  clientX,
  clientY,
  onPick,
  onCancel,
}: {
  from: string;
  to: string;
  clientX: number;
  clientY: number;
  onPick: (k: RelationKind) => void;
  onCancel: () => void;
}) {
  // clamp to viewport
  const W = 280;
  const H = 280;
  const left = Math.min(window.innerWidth - W - 8, Math.max(8, clientX + 8));
  const top = Math.min(window.innerHeight - H - 8, Math.max(8, clientY + 8));

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onCancel}
        onContextMenu={(e) => {
          e.preventDefault();
          onCancel();
        }}
      />
      <div
        className="fixed z-50 w-[280px] rounded-xl border border-zinc-200 bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.18)] animate-fade-in no-print"
        style={{ left, top }}
        role="menu"
      >
        <div className="border-b border-zinc-100 px-3 py-2.5">
          <div className="inline-flex items-center gap-1 rounded bg-zinc-900 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-white">
            <Plus className="h-2.5 w-2.5" />
            새 관계 추가
          </div>
          <div className="mt-1.5 text-[13px] font-semibold tracking-tight text-zinc-900">
            <span>{from}</span>
            <span className="mx-1.5 text-zinc-400">↔</span>
            <span>{to}</span>
          </div>
        </div>
        <div className="space-y-0.5 p-1">
          {(['adjacent', 'separated', 'visual', 'secure'] as RelationKind[]).map((k) => (
            <button
              key={k}
              onClick={() => onPick(k)}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-zinc-100"
              role="menuitem"
            >
              <RelationKindSwatch kind={k} />
              <div>
                <div className="text-[12.5px] font-semibold text-zinc-900">{REL_LABELS[k]}</div>
                <div className="text-[10.5px] text-zinc-500">{REL_DESC[k]}</div>
              </div>
            </button>
          ))}
        </div>
        <div className="flex justify-end border-t border-zinc-100 p-1.5">
          <button
            onClick={onCancel}
            className="rounded px-2 py-1 text-[11.5px] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            취소 (Esc)
          </button>
        </div>
      </div>
    </>
  );
}

function RelationKindSwatch({ kind }: { kind: RelationKind }) {
  const stroke =
    kind === 'adjacent'
      ? '#18181b'
      : kind === 'separated' || kind === 'secure'
      ? '#dc2626'
      : '#52525b';
  const sw = kind === 'adjacent' ? 2.4 : kind === 'visual' ? 1.2 : 1.6;
  const dash =
    kind === 'adjacent' ? undefined : kind === 'visual' ? '2 3' : '4 3';
  return (
    <span className="inline-flex h-6 w-7 shrink-0 items-center justify-center rounded bg-zinc-50">
      <svg width="22" height="14" viewBox="0 0 22 14">
        <line x1="2" y1="7" x2="20" y2="7" stroke={stroke} strokeWidth={sw} strokeDasharray={dash} />
        {kind === 'secure' && (
          <g stroke="#dc2626" strokeWidth={1.6}>
            <line x1="9" y1="3" x2="13" y2="11" />
            <line x1="13" y1="3" x2="9" y2="11" />
          </g>
        )}
      </svg>
    </span>
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
    for (const n2 of nodes) {
      n2.x += (cx - n2.x) * 0.01;
      n2.y += (cy - n2.y) * 0.01;
    }
  }
  for (const node of nodes) {
    node.x = Math.max(node.r + 6, Math.min(width - node.r - 6, node.x));
    node.y = Math.max(node.r + 6, Math.min(height - node.r - 6, node.y));
  }

  return { width, height, nodes };
}
