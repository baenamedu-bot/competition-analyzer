import type { ProjectState } from '@/types';
import { SummarySection } from '@/components/sections/summary-section';
import { ScheduleSection } from '@/components/sections/schedule-section';
import { ConceptsSection } from '@/components/sections/concepts-section';
import { ChecklistSection } from '@/components/sections/checklist-section';
import { ProgramSection } from '@/components/sections/program-section';
import { BRAND } from '@/components/branding/brand-constants';
import { formatDate } from '@/lib/utils';

interface Props {
  project: ProjectState;
  forPrint?: boolean;
}

export function ReportShell({ project, forPrint = false }: Props) {
  const a = project.analysis;
  if (!a) return null;
  return (
    <div
      className={
        forPrint ? 'mx-auto w-[820px] bg-white p-8' : 'space-y-12'
      }
      id="report-root"
    >
      {forPrint && (
        <div className="mb-6 border-b border-zinc-200 pb-4">
          <div className="text-[11px] font-semibold tracking-wider text-zinc-500">
            {BRAND.studio} · {BRAND.appName}
          </div>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-zinc-900">
            {project.name}
          </h1>
          <div className="mt-1 text-[12px] text-zinc-500">
            {project.client && <span>{project.client} · </span>}
            생성: {formatDate(a.generatedAt)} · 모델: {a.model}
          </div>
        </div>
      )}

      <Block title="1. 핵심 요약" subtitle="문서 교차 참조 결과 — 불일치 항목은 빨간색으로 표시">
        <SummarySection summary={a.summary} />
      </Block>

      <Block title="2. 제출 일정표" subtitle="발주처 일정(청색) + 사무소 내부 마일스톤(녹색)">
        <ScheduleSection schedule={a.schedule} />
      </Block>

      <Block title="3. 디자인 컨셉 10개" subtitle="카테고리 분산 · 즐겨찾기 별표 · 발전안 포함">
        <ConceptsSection
          concepts={a.concepts}
          starredIds={project.starredConceptIds}
          onToggleStar={() => {}}
          developments={project.conceptDevelopments}
          staticAll
        />
      </Block>

      <Block title="4. 제출물 체크리스트" subtitle="누락 시 실격 항목은 빨간 배지로 강조">
        <ChecklistSection
          submittables={a.submittables}
          checkedIds={project.checkedSubmittableIds}
          onToggle={() => {}}
        />
      </Block>

      <Block title="5. 프로그램 관계 분석" subtitle="도입 시설 + Bubble Diagram (인접·분리·시각·보안)">
        <ProgramSection programs={a.programs} relations={a.relations} />
      </Block>

      <Block title="6. 메모" subtitle="검토 과정에서 누적된 의견·수정사항">
        {project.memo.trim() ? (
          <div className="surface-card whitespace-pre-wrap p-5 text-[13px] leading-relaxed text-zinc-700">
            {project.memo}
          </div>
        ) : (
          <div className="surface-card p-5 text-[13px] text-zinc-400">메모가 비어 있습니다.</div>
        )}
      </Block>

      {forPrint && (
        <div className="mt-10 border-t border-zinc-200 pt-4 text-center text-[11px] text-zinc-500">
          Powered by {BRAND.studio} · {BRAND.creator} · {BRAND.websiteLabel}
        </div>
      )}
    </div>
  );
}

function Block({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="page-break space-y-3">
      <header>
        <h2 className="text-[18px] font-semibold tracking-tight text-zinc-950">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[12.5px] text-zinc-500">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}
