'use client';
import { forwardRef, useMemo } from 'react';
import type { ScheduleEvent } from '@/types';
import { formatDate } from '@/lib/utils';

/**
 * Print-optimized Gantt chart, designed to fit on a single A4 landscape page.
 * - viewBox aspect ≈ 1.414 : 1 (A4 landscape)
 * - All milestones rendered without truncation
 * - Two clearly separated sections (발주처 / 사무소 내부)
 * - Larger text sizing tuned for A4 print legibility (≥ 9pt at print size)
 */

const VIEW_W = 1130;
const VIEW_H = 800;
const M = 28;
const HEADER_H = 78;
const AXIS_H = 32;
const FOOTER_H = 42;
const SECTION_LABEL_H = 30;
const LEFT_COL_W = 240;
const RIGHT_DATE_W = 86;

interface Props {
  schedule: ScheduleEvent[];
  projectName?: string;
  client?: string;
}

export const PrintGantt = forwardRef<SVGSVGElement, Props>(function PrintGantt(
  { schedule, projectName, client },
  ref
) {
  const { officials, internals, dateRange } = useMemo(() => {
    const sorted = [...schedule]
      .filter((e) => !!e.date)
      .sort((a, b) => (a.date > b.date ? 1 : -1));
    const officials = sorted.filter((e) => e.type === 'official');
    const internals = sorted.filter((e) => e.type === 'internal');
    if (sorted.length === 0) {
      return { officials, internals, dateRange: null };
    }
    const ts = sorted.map((e) => new Date(e.date).getTime());
    const minTs = Math.min(...ts);
    const maxTs = Math.max(...ts);
    return {
      officials,
      internals,
      dateRange: {
        min: new Date(minTs),
        max: new Date(maxTs),
        totalDays: Math.max(1, Math.round((maxTs - minTs) / 86_400_000) + 1),
      },
    };
  }, [schedule]);

  if (!dateRange) {
    return (
      <div className="surface-card p-8 text-center text-[13px] text-zinc-400">
        추출된 일정이 없습니다. PDF 출력용 차트를 만들 항목이 없습니다.
      </div>
    );
  }

  const trackStart = M + LEFT_COL_W;
  const trackEnd = VIEW_W - M - RIGHT_DATE_W;
  const trackW = trackEnd - trackStart;
  const sectionsCount = (officials.length > 0 ? 1 : 0) + (internals.length > 0 ? 1 : 0);
  const totalRows = officials.length + internals.length;
  const bodyH = VIEW_H - HEADER_H - AXIS_H - FOOTER_H;
  const rowH = Math.max(
    20,
    Math.min(34, (bodyH - sectionsCount * SECTION_LABEL_H) / Math.max(1, totalRows))
  );

  const labelFont = rowH >= 28 ? 12.5 : rowH >= 24 ? 11.5 : 10.5;
  const subFont = rowH >= 28 ? 10 : 9.5;
  const dateFont = rowH >= 28 ? 11.5 : 10.5;

  function xForDay(day: number) {
    return trackStart + (day / Math.max(1, dateRange!.totalDays - 1)) * trackW;
  }
  function dayOf(dateStr: string) {
    return Math.round((new Date(dateStr).getTime() - dateRange!.min.getTime()) / 86_400_000);
  }

  // month marks (every month, with thinning if too crowded)
  const monthMarks: Array<{ x: number; label: string; year?: boolean }> = [];
  {
    const cur = new Date(dateRange.min.getFullYear(), dateRange.min.getMonth(), 1);
    while (cur.getTime() <= dateRange.max.getTime()) {
      const day = Math.round((cur.getTime() - dateRange.min.getTime()) / 86_400_000);
      monthMarks.push({
        x: xForDay(Math.max(0, day)),
        label: `${String(cur.getMonth() + 1).padStart(2, '0')}월`,
        year: cur.getMonth() === 0 || monthMarks.length === 0,
      });
      cur.setMonth(cur.getMonth() + 1);
    }
  }
  const minLabelGap = 60;
  const thinnedMarks: typeof monthMarks = [];
  for (const m of monthMarks) {
    const last = thinnedMarks[thinnedMarks.length - 1];
    if (!last || m.x - last.x >= minLabelGap || m.year) thinnedMarks.push(m);
  }

  // weekly grid lines
  const gridLines: number[] = [];
  for (let d = 0; d <= dateRange.totalDays; d += 7) {
    gridLines.push(xForDay(d));
  }

  // ---- y positions ----
  const headerY = 0;
  const axisY = HEADER_H;
  const bodyStartY = HEADER_H + AXIS_H;

  let cursorY = bodyStartY;
  type RowDef = {
    kind: 'section' | 'event';
    section?: 'official' | 'internal';
    event?: ScheduleEvent;
    y: number;
  };
  const layoutRows: RowDef[] = [];
  if (officials.length > 0) {
    layoutRows.push({ kind: 'section', section: 'official', y: cursorY });
    cursorY += SECTION_LABEL_H;
    for (const ev of officials) {
      layoutRows.push({ kind: 'event', section: 'official', event: ev, y: cursorY });
      cursorY += rowH;
    }
  }
  if (internals.length > 0) {
    layoutRows.push({ kind: 'section', section: 'internal', y: cursorY });
    cursorY += SECTION_LABEL_H;
    for (const ev of internals) {
      layoutRows.push({ kind: 'event', section: 'internal', event: ev, y: cursorY });
      cursorY += rowH;
    }
  }
  const footerY = VIEW_H - FOOTER_H;

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="xMidYMid meet"
      className="block w-full"
      style={{ background: '#ffffff', fontFamily: '"Pretendard Variable", Pretendard, system-ui, sans-serif' }}
    >
      {/* ---------- Header band ---------- */}
      <rect x={0} y={0} width={VIEW_W} height={HEADER_H} fill="#0f172a" />
      <text
        x={M}
        y={26}
        fontSize="10"
        fill="#94a3b8"
        letterSpacing="2"
        fontWeight="600"
      >
        SCHEDULE · A4 LANDSCAPE PRINT
      </text>
      <text x={M} y={54} fontSize="20" fill="#ffffff" fontWeight="700">
        제출 일정표
      </text>
      <text x={M} y={70} fontSize="11.5" fill="#cbd5e1">
        {projectName || '프로젝트'}
        {client ? ` · ${client}` : ''}
      </text>

      {/* legend block */}
      <g transform={`translate(${VIEW_W - M - 360}, 18)`}>
        <rect x={0} y={0} width={360} height={48} rx={6} fill="#1e293b" />
        <g transform="translate(14, 14)">
          <circle cx={6} cy={6} r={5.5} fill="#60a5fa" stroke="#bfdbfe" strokeWidth={1.2} />
          <text x={18} y={10} fontSize="10.5" fill="#e2e8f0" fontWeight="600">
            발주처 일정 (Official)
          </text>
          <text x={18} y={24} fontSize="9.5" fill="#94a3b8">
            공고일 · 질의응답 · 현장설명회 · 중간/최종 제출 · 심사
          </text>
        </g>
        <g transform="translate(196, 14)">
          <rect x={0.5} y={0.5} width={11} height={11} rx={1} fill="#34d399" stroke="#a7f3d0" strokeWidth={1.2} transform="rotate(45 6 6)" />
          <text x={20} y={10} fontSize="10.5" fill="#e2e8f0" fontWeight="600">
            사무소 내부 역산 (Internal)
          </text>
          <text x={20} y={24} fontSize="9.5" fill="#94a3b8">
            컨셉/도면/모형/패널 데드라인 (D-N)
          </text>
        </g>
      </g>

      {/* ---------- Time axis ---------- */}
      <line
        x1={trackStart}
        y1={axisY + AXIS_H - 6}
        x2={trackEnd}
        y2={axisY + AXIS_H - 6}
        stroke="#0f172a"
        strokeWidth={1.2}
      />
      {gridLines.map((x, i) => (
        <line
          key={`g${i}`}
          x1={x}
          y1={axisY + AXIS_H - 6}
          x2={x}
          y2={VIEW_H - FOOTER_H}
          stroke="#f4f4f5"
          strokeWidth={1}
        />
      ))}
      {thinnedMarks.map((m, i) => {
        const dayOffset = ((m.x - trackStart) / trackW) * (dateRange.totalDays - 1);
        const at = new Date(dateRange.min.getTime() + dayOffset * 86_400_000);
        return (
          <g key={`m${i}`}>
            <line
              x1={m.x}
              y1={axisY + 4}
              x2={m.x}
              y2={VIEW_H - FOOTER_H}
              stroke="#e4e4e7"
              strokeDasharray="3 3"
              strokeWidth={0.9}
            />
            {m.year && (
              <text x={m.x} y={axisY + 14} fontSize="10" fill="#1e293b" textAnchor="middle" fontWeight={700}>
                {at.getFullYear()}
              </text>
            )}
            <text
              x={m.x}
              y={axisY + AXIS_H - 12}
              fontSize="11"
              fill="#475569"
              textAnchor="middle"
              fontWeight={m.year ? 700 : 500}
            >
              {m.label}
            </text>
          </g>
        );
      })}

      {/* ---------- Body rows ---------- */}
      {layoutRows.map((row, idx) => {
        if (row.kind === 'section') {
          const isOfficial = row.section === 'official';
          const fill = isOfficial ? '#1d4ed8' : '#047857';
          const soft = isOfficial ? '#eff6ff' : '#ecfdf5';
          const label = isOfficial ? '발주처 일정' : '사무소 내부 역산 일정';
          const count = isOfficial ? officials.length : internals.length;
          return (
            <g key={`s${idx}`}>
              <rect
                x={M}
                y={row.y + 4}
                width={VIEW_W - M * 2}
                height={SECTION_LABEL_H - 8}
                rx={4}
                fill={soft}
              />
              <rect x={M} y={row.y + 4} width={3} height={SECTION_LABEL_H - 8} fill={fill} />
              <text
                x={M + 14}
                y={row.y + SECTION_LABEL_H / 2 + 4}
                fontSize="12.5"
                fill={fill}
                fontWeight={700}
              >
                {label}
              </text>
              <text
                x={M + 14 + (label.length * 8.5) + 6}
                y={row.y + SECTION_LABEL_H / 2 + 4}
                fontSize="10.5"
                fill="#64748b"
              >
                · {count}건
              </text>
            </g>
          );
        }
        const ev = row.event!;
        const isOfficial = row.section === 'official';
        const color = isOfficial ? '#1d4ed8' : '#047857';
        const x = xForDay(dayOf(ev.date));
        const cy = row.y + rowH / 2;
        return (
          <g key={ev.id}>
            {/* row background (alternating) */}
            {idx % 2 === 0 && (
              <rect
                x={M}
                y={row.y}
                width={VIEW_W - M * 2}
                height={rowH}
                fill="#fafafa"
              />
            )}
            {/* row title */}
            <text
              x={M + 8}
              y={cy - (subFont > 0 ? 1 : -3)}
              fontSize={labelFont}
              fill="#0f172a"
              fontWeight={600}
              dominantBaseline="middle"
            >
              {ev.title.length > 22 ? ev.title.slice(0, 21) + '…' : ev.title}
            </text>
            <text
              x={M + 8}
              y={cy + labelFont - 1}
              fontSize={subFont}
              fill="#64748b"
              dominantBaseline="middle"
            >
              {ev.category}
              {ev.note ? ` · ${ev.note.slice(0, 30)}${ev.note.length > 30 ? '…' : ''}` : ''}
            </text>
            {/* track line behind marker */}
            <line
              x1={trackStart}
              y1={cy}
              x2={trackEnd}
              y2={cy}
              stroke="#f4f4f5"
              strokeWidth={1}
            />
            {/* connector from left col to marker */}
            <line
              x1={M + LEFT_COL_W - 8}
              y1={cy}
              x2={x}
              y2={cy}
              stroke={color}
              strokeOpacity={0.25}
              strokeWidth={1.2}
              strokeDasharray="2 3"
            />
            {/* marker */}
            {isOfficial ? (
              <>
                <circle cx={x} cy={cy} r={9} fill={color} fillOpacity={0.14} />
                <circle cx={x} cy={cy} r={5.2} fill={color} stroke="#ffffff" strokeWidth={1.2} />
              </>
            ) : (
              <g transform={`translate(${x}, ${cy}) rotate(45)`}>
                <rect x={-9} y={-9} width={18} height={18} rx={1.5} fill={color} fillOpacity={0.14} />
                <rect x={-5.2} y={-5.2} width={10.4} height={10.4} rx={1} fill={color} stroke="#ffffff" strokeWidth={1.2} />
              </g>
            )}
            {/* date label on the right */}
            <text
              x={trackEnd + 8}
              y={cy + 1}
              fontSize={dateFont}
              fill="#0f172a"
              fontWeight={600}
              dominantBaseline="middle"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
            >
              {formatDate(ev.date)}
            </text>
          </g>
        );
      })}

      {/* ---------- Footer ---------- */}
      <line x1={M} y1={footerY} x2={VIEW_W - M} y2={footerY} stroke="#e4e4e7" />
      <text x={M} y={footerY + 22} fontSize="10.5" fill="#475569" fontWeight={600}>
        기간: {formatDate(dateRange.min)} → {formatDate(dateRange.max)}
        <tspan dx="10" fill="#94a3b8" fontWeight={400}>· 총 {dateRange.totalDays}일</tspan>
        <tspan dx="14" fill="#94a3b8" fontWeight={400}>· 발주처 {officials.length}건 · 내부 {internals.length}건</tspan>
      </text>
      <text
        x={VIEW_W - M}
        y={footerY + 22}
        fontSize="10"
        fill="#94a3b8"
        textAnchor="end"
      >
        유앤미스튜디오 · 공모지침서 분석기 · younme.ai.kr
      </text>
    </svg>
  );
});
