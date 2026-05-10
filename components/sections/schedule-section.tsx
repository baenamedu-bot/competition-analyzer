'use client';
import { useMemo, useRef, useState } from 'react';
import { Eye, Printer, Loader2, MonitorPlay, FileDown } from 'lucide-react';
import { toast } from 'sonner';
import type { ScheduleEvent } from '@/types';
import { formatDate, cn } from '@/lib/utils';
import { SourceBadge } from '@/components/common/source-badge';
import { PrintGantt } from './print-gantt';
import { Button } from '@/components/ui/button';
import { exportSvgAsLandscapePdf } from '@/lib/pdf-export';

const ROW_HEIGHT = 46;
const HEADER_HEIGHT = 32;
const PADDING_LEFT = 220;

interface ScheduleSectionProps {
  schedule: ScheduleEvent[];
  projectName?: string;
  client?: string;
  /** When true, render only the print-optimized variant (used inside PDF report). */
  forPrint?: boolean;
}

export function ScheduleSection({ schedule, projectName, client, forPrint = false }: ScheduleSectionProps) {
  const sorted = useMemo(
    () => [...schedule].filter((e) => !!e.date).sort((a, b) => (a.date > b.date ? 1 : -1)),
    [schedule]
  );

  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (sorted.length === 0) {
      return { minDate: new Date(), maxDate: new Date(), totalDays: 1 };
    }
    const dates = sorted.map((e) => new Date(e.date));
    const min = new Date(Math.min(...dates.map((d) => d.getTime())));
    const max = new Date(Math.max(...dates.map((d) => d.getTime())));
    const days = Math.max(
      1,
      Math.round((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24)) + 1
    );
    return { minDate: min, maxDate: max, totalDays: days };
  }, [sorted]);

  const officialEvents = sorted.filter((e) => e.type === 'official');
  const internalEvents = sorted.filter((e) => e.type === 'internal');

  if (sorted.length === 0) {
    return (
      <div className="surface-card p-8 text-center text-[13px] text-zinc-400">
        추출된 일정이 없습니다.
      </div>
    );
  }

  const rows = [...officialEvents, ...internalEvents];
  const chartWidth = 780;
  const usableWidth = chartWidth - PADDING_LEFT - 40;
  const monthMarks = computeMonthMarks(minDate, maxDate);

  // ----- Print mode (used inside PDF report or screen preview) -----
  if (forPrint) {
    return (
      <div className="space-y-2">
        <PrintGantt schedule={sorted} projectName={projectName} client={client} />
      </div>
    );
  }

  return (
    <ScheduleInteractive
      sorted={sorted}
      officialEvents={officialEvents}
      internalEvents={internalEvents}
      rows={rows}
      chartWidth={chartWidth}
      usableWidth={usableWidth}
      minDate={minDate}
      maxDate={maxDate}
      totalDays={totalDays}
      monthMarks={monthMarks}
      projectName={projectName}
      client={client}
    />
  );
}

interface InteractiveProps {
  sorted: ScheduleEvent[];
  officialEvents: ScheduleEvent[];
  internalEvents: ScheduleEvent[];
  rows: ScheduleEvent[];
  chartWidth: number;
  usableWidth: number;
  minDate: Date;
  maxDate: Date;
  totalDays: number;
  monthMarks: Array<{ day: number; label: string }>;
  projectName?: string;
  client?: string;
}

function ScheduleInteractive({
  sorted,
  officialEvents,
  internalEvents,
  rows,
  chartWidth,
  usableWidth,
  minDate,
  maxDate,
  totalDays,
  monthMarks,
  projectName,
  client,
}: InteractiveProps) {
  const [mode, setMode] = useState<'screen' | 'print'>('screen');
  const [exporting, setExporting] = useState(false);
  const printSvgRef = useRef<SVGSVGElement>(null);

  async function handleExport() {
    if (!printSvgRef.current) {
      toast.error('출력할 차트가 준비되지 않았습니다.');
      return;
    }
    setExporting(true);
    try {
      await exportSvgAsLandscapePdf({
        svg: printSvgRef.current,
        fileName: `${projectName || '제출일정표'}_제출일정표.pdf`,
      });
      toast.success('A4 가로 한 장 PDF로 내보냈습니다.');
    } catch (e) {
      toast.error('PDF 출력 실패: ' + (e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Top toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-zinc-200 bg-white p-0.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <button
            onClick={() => setMode('screen')}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-[12px] font-medium transition-colors',
              mode === 'screen' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900'
            )}
          >
            <MonitorPlay className="h-3.5 w-3.5" />
            화면용
          </button>
          <button
            onClick={() => setMode('print')}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded px-2.5 text-[12px] font-medium transition-colors',
              mode === 'print' ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:text-zinc-900'
            )}
          >
            <Printer className="h-3.5 w-3.5" />
            PDF 출력용
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[12px]">
          <Legend color="#1d4ed8" label="발주처 일정" />
          <Legend color="#047857" label="사무소 내부 역산" diamond />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-[11.5px] text-zinc-400">
            {formatDate(minDate)} → {formatDate(maxDate)} · {totalDays}일
          </span>
          {mode === 'print' && (
            <Button variant="cta" size="sm" onClick={handleExport} disabled={exporting}>
              {exporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              A4 가로 1장 PDF
            </Button>
          )}
        </div>
      </div>

      {mode === 'print' ? (
        <PrintModeBlock
          schedule={sorted}
          projectName={projectName}
          client={client}
          svgRef={printSvgRef}
        />
      ) : (
        <ScreenInteractive
          rows={rows}
          officialEvents={officialEvents}
          internalEvents={internalEvents}
          chartWidth={chartWidth}
          usableWidth={usableWidth}
          minDate={minDate}
          totalDays={totalDays}
          monthMarks={monthMarks}
        />
      )}
    </div>
  );
}

function PrintModeBlock({
  schedule,
  projectName,
  client,
  svgRef,
}: {
  schedule: ScheduleEvent[];
  projectName?: string;
  client?: string;
  svgRef: React.RefObject<SVGSVGElement>;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[11.5px] text-zinc-500">
        <Eye className="h-3.5 w-3.5" strokeWidth={1.8} />
        <span>
          A4 가로 한 장에 맞춰 모든 마일스톤이 잘리지 않도록 폰트·간격이 자동 조정된 미리보기입니다.
        </span>
      </div>
      <div className="surface-card overflow-hidden p-3">
        <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
          <PrintGantt
            ref={svgRef}
            schedule={schedule}
            projectName={projectName}
            client={client}
          />
        </div>
      </div>
    </div>
  );
}

function ScreenInteractive({
  rows,
  officialEvents,
  internalEvents,
  chartWidth,
  usableWidth,
  minDate,
  totalDays,
  monthMarks,
}: {
  rows: ScheduleEvent[];
  officialEvents: ScheduleEvent[];
  internalEvents: ScheduleEvent[];
  chartWidth: number;
  usableWidth: number;
  minDate: Date;
  totalDays: number;
  monthMarks: Array<{ day: number; label: string }>;
}) {
  return (
    <div className="space-y-5">
      {/* legacy interactive content begins below */}

      <div className="surface-card overflow-x-auto p-4">
        <svg
          viewBox={`0 0 ${chartWidth} ${HEADER_HEIGHT + rows.length * ROW_HEIGHT + 24}`}
          className="min-w-[720px] w-full"
          preserveAspectRatio="xMinYMin meet"
        >
          {/* month grid lines + labels */}
          {monthMarks.map((m, i) => {
            const x = PADDING_LEFT + (m.day / Math.max(totalDays - 1, 1)) * usableWidth;
            return (
              <g key={i}>
                <line
                  x1={x}
                  y1={HEADER_HEIGHT - 8}
                  x2={x}
                  y2={HEADER_HEIGHT + rows.length * ROW_HEIGHT}
                  stroke="#e4e4e7"
                  strokeDasharray="3 3"
                />
                <text
                  x={x}
                  y={HEADER_HEIGHT - 14}
                  fontSize="10.5"
                  textAnchor="middle"
                  fill="#71717a"
                  className="font-mono"
                >
                  {m.label}
                </text>
              </g>
            );
          })}
          {/* divider between official/internal */}
          {officialEvents.length > 0 && internalEvents.length > 0 && (
            <line
              x1={0}
              y1={HEADER_HEIGHT + officialEvents.length * ROW_HEIGHT - 0.5}
              x2={chartWidth}
              y2={HEADER_HEIGHT + officialEvents.length * ROW_HEIGHT - 0.5}
              stroke="#d4d4d8"
            />
          )}
          {/* rows */}
          {rows.map((ev, idx) => {
            const dayOffset = Math.round(
              (new Date(ev.date).getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            const x = PADDING_LEFT + (dayOffset / Math.max(totalDays - 1, 1)) * usableWidth;
            const y = HEADER_HEIGHT + idx * ROW_HEIGHT + ROW_HEIGHT / 2;
            const isInternal = ev.type === 'internal';
            const color = isInternal ? '#047857' : '#1d4ed8';
            return (
              <g key={ev.id}>
                <text
                  x={12}
                  y={y - 4}
                  fontSize="12.5"
                  fill="#18181b"
                  className="font-medium"
                >
                  {ev.title.length > 18 ? ev.title.slice(0, 17) + '…' : ev.title}
                </text>
                <text x={12} y={y + 11} fontSize="10.5" fill="#a1a1aa">
                  {ev.category}
                </text>
                <line
                  x1={PADDING_LEFT - 6}
                  y1={y}
                  x2={chartWidth - 28}
                  y2={y}
                  stroke="#f4f4f5"
                />
                <circle cx={x} cy={y} r={6} fill={color} />
                <circle cx={x} cy={y} r={11} fill={color} fillOpacity={0.12} />
                <text
                  x={x + 14}
                  y={y + 4}
                  fontSize="11"
                  fill="#52525b"
                  className="font-mono tabular-nums"
                >
                  {formatDate(ev.date)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* table fallback */}
      <div className="surface-card overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="bg-zinc-50/70 text-[11.5px] uppercase tracking-wider text-zinc-500">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">일정</th>
              <th className="px-4 py-2.5 text-left font-medium">분류</th>
              <th className="px-4 py-2.5 text-left font-medium">날짜</th>
              <th className="px-4 py-2.5 text-left font-medium">출처</th>
              <th className="px-4 py-2.5 text-left font-medium">비고</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((ev) => (
              <tr key={ev.id} className="border-t border-zinc-100 hover:bg-zinc-50/40">
                <td className="px-4 py-2.5 align-top">
                  <span
                    className={`mr-2 inline-block h-2 w-2 rounded-full ${
                      ev.type === 'internal' ? 'bg-ai' : 'bg-spec'
                    }`}
                  />
                  <span className="font-medium text-zinc-900">{ev.title}</span>
                </td>
                <td className="px-4 py-2.5 align-top text-zinc-500">{ev.category}</td>
                <td className="px-4 py-2.5 align-top tabular-nums text-zinc-700">
                  {formatDate(ev.date)}
                </td>
                <td className="px-4 py-2.5 align-top">
                  <SourceBadge source={ev.source} />
                </td>
                <td className="px-4 py-2.5 align-top text-[12px] text-zinc-500">
                  {ev.note ?? ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Legend({ color, label, diamond }: { color: string; label: string; diamond?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-zinc-600">
      {diamond ? (
        <span
          className="inline-block h-2.5 w-2.5 rotate-45"
          style={{ background: color }}
        />
      ) : (
        <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      )}
      {label}
    </span>
  );
}

function computeMonthMarks(min: Date, max: Date): Array<{ day: number; label: string }> {
  const marks: Array<{ day: number; label: string }> = [];
  const cur = new Date(min.getFullYear(), min.getMonth(), 1);
  while (cur <= max) {
    const day = Math.round((cur.getTime() - min.getTime()) / (1000 * 60 * 60 * 24));
    if (day >= 0) {
      marks.push({
        day,
        label: `${cur.getFullYear()}.${String(cur.getMonth() + 1).padStart(2, '0')}`,
      });
    }
    cur.setMonth(cur.getMonth() + 1);
  }
  if (marks.length > 8) {
    return marks.filter((_, i) => i % Math.ceil(marks.length / 8) === 0);
  }
  return marks;
}
