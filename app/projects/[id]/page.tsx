'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Calendar,
  ChevronRight,
  Download,
  FileDown,
  FileText,
  LayoutDashboard,
  CalendarDays,
  Lightbulb,
  ListChecks,
  Network,
  StickyNote,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentUploader } from '@/components/upload/document-uploader';
import { AnalysisRunnerUI } from '@/components/analysis/analysis-runner-ui';
import { SummarySection } from '@/components/sections/summary-section';
import { ScheduleSection } from '@/components/sections/schedule-section';
import { ConceptsSection } from '@/components/sections/concepts-section';
import { ChecklistSection } from '@/components/sections/checklist-section';
import { ProgramSection } from '@/components/sections/program-section';
import { MemoSection } from '@/components/sections/memo-section';
import { ReportShell } from '@/components/report/report-shell';
import { getProject, saveProject } from '@/lib/storage';
import { exportToPdf, exportToHtml } from '@/lib/pdf-export';
import { formatDate, cn } from '@/lib/utils';
import type { ProjectState, DocKind } from '@/types';

type SectionKey = 'docs' | 'summary' | 'schedule' | 'concepts' | 'checklist' | 'programs' | 'memo';

const NAV: Array<{ key: SectionKey; label: string; icon: typeof LayoutDashboard }> = [
  { key: 'docs', label: '문서 업로드', icon: FileText },
  { key: 'summary', label: '핵심 요약', icon: LayoutDashboard },
  { key: 'schedule', label: '제출 일정표', icon: CalendarDays },
  { key: 'concepts', label: '디자인 컨셉 10', icon: Lightbulb },
  { key: 'checklist', label: '제출물 체크리스트', icon: ListChecks },
  { key: 'programs', label: '프로그램 관계', icon: Network },
  { key: 'memo', label: '메모', icon: StickyNote },
];

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [project, setProject] = useState<ProjectState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [section, setSection] = useState<SectionKey>('docs');
  const [exporting, setExporting] = useState<'pdf' | 'html' | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!params?.id) return;
    const p = getProject(params.id);
    if (!p) {
      toast.error('프로젝트를 찾을 수 없습니다.');
      router.push('/');
      return;
    }
    setProject(p);
    setLoaded(true);
    if (p.analysis) setSection('summary');
  }, [params?.id, router]);

  function update(next: ProjectState) {
    setProject(next);
    saveProject(next);
  }

  function setDoc(kind: DocKind, value: ProjectState['documents'][DocKind]) {
    if (!project) return;
    update({ ...project, documents: { ...project.documents, [kind]: value } });
  }

  function toggleStar(id: string) {
    if (!project) return;
    const s = new Set(project.starredConceptIds);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    update({ ...project, starredConceptIds: [...s] });
  }

  function toggleCheck(id: string) {
    if (!project) return;
    const s = new Set(project.checkedSubmittableIds);
    if (s.has(id)) s.delete(id);
    else s.add(id);
    update({ ...project, checkedSubmittableIds: [...s] });
  }

  async function handleExportPdf() {
    if (!project?.analysis || !printRef.current) return;
    setExporting('pdf');
    try {
      // give the report a moment to render in print mode
      await new Promise((r) => setTimeout(r, 60));
      await exportToPdf({
        element: printRef.current,
        fileName: `${project.name || 'report'}.pdf`,
        projectName: project.name,
        client: project.client,
        generatedAt: project.analysis.generatedAt,
      });
      toast.success('PDF 보고서를 내려받았습니다.');
    } catch (e) {
      toast.error('PDF 출력 실패: ' + (e as Error).message);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportHtml() {
    if (!project?.analysis || !printRef.current) return;
    setExporting('html');
    try {
      await new Promise((r) => setTimeout(r, 30));
      await exportToHtml({
        element: printRef.current,
        fileName: `${project.name || 'report'}.html`,
        projectName: project.name,
        client: project.client,
        generatedAt: project.analysis.generatedAt,
      });
      toast.success('HTML 보고서를 내려받았습니다.');
    } catch (e) {
      toast.error('HTML 출력 실패: ' + (e as Error).message);
    } finally {
      setExporting(null);
    }
  }

  if (!loaded || !project) {
    return (
      <div className="mx-auto flex max-w-6xl items-center justify-center px-5 py-20">
        <Loader2 className="h-5 w-5 animate-spin text-zinc-400" />
      </div>
    );
  }

  const a = project.analysis;
  const docCount = (['guideline', 'notice', 'task'] as const).filter((k) => project.documents[k]).length;

  return (
    <div className="mx-auto flex max-w-6xl gap-6 px-5 py-8">
      {/* Sidebar */}
      <aside className="sticky top-20 hidden h-[calc(100vh-6rem)] w-56 shrink-0 flex-col gap-1 lg:flex no-print">
        <Link
          href="/"
          className="mb-2 inline-flex items-center gap-1.5 text-[12px] text-zinc-500 hover:text-zinc-900"
        >
          <ArrowLeft className="h-3 w-3" />
          프로젝트 목록
        </Link>
        <div className="mb-3 px-2.5">
          <h2 className="line-clamp-2 text-[14px] font-semibold leading-snug tracking-tight text-zinc-900">
            {project.name}
          </h2>
          <div className="mt-1 space-y-0.5 text-[11.5px] text-zinc-500">
            {project.client && (
              <div className="flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                {project.client}
              </div>
            )}
            {project.finalDeadline && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                마감 {formatDate(project.finalDeadline)}
              </div>
            )}
          </div>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((n) => {
            const disabled = n.key !== 'docs' && n.key !== 'memo' && !a;
            const active = section === n.key;
            return (
              <button
                key={n.key}
                onClick={() => setSection(n.key)}
                disabled={disabled}
                className={cn(
                  'group inline-flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-zinc-900 text-white'
                    : disabled
                    ? 'cursor-not-allowed text-zinc-300'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <n.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                  {n.label}
                </span>
                {n.key === 'docs' && (
                  <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] tabular-nums">
                    {docCount}/3
                  </span>
                )}
                {active && <ChevronRight className="h-3 w-3" />}
              </button>
            );
          })}
        </nav>

        {a && (
          <div className="mt-auto space-y-1.5 border-t border-zinc-200 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={exporting !== null}
              className="w-full justify-start"
            >
              {exporting === 'pdf' ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileDown className="h-3.5 w-3.5" />
              )}
              PDF 보고서
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportHtml}
              disabled={exporting !== null}
              className="w-full justify-start text-zinc-600"
            >
              <Download className="h-3.5 w-3.5" />
              HTML 단독 페이지
            </Button>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Mobile header strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 lg:hidden">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[12px] text-zinc-500">
            <ArrowLeft className="h-3 w-3" /> 목록
          </Link>
          <div className="text-right">
            <h1 className="line-clamp-1 text-[15px] font-semibold tracking-tight text-zinc-900">
              {project.name}
            </h1>
            <div className="text-[11px] text-zinc-500">
              {project.client && `${project.client} · `}
              {project.finalDeadline && `마감 ${formatDate(project.finalDeadline)}`}
            </div>
          </div>
        </div>

        {/* Mobile section tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 lg:hidden no-print">
          {NAV.map((n) => {
            const disabled = n.key !== 'docs' && n.key !== 'memo' && !a;
            const active = section === n.key;
            return (
              <button
                key={n.key}
                onClick={() => setSection(n.key)}
                disabled={disabled}
                className={cn(
                  'inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-medium',
                  active
                    ? 'bg-zinc-900 text-white'
                    : disabled
                    ? 'text-zinc-300'
                    : 'bg-white text-zinc-600 hover:bg-zinc-100'
                )}
              >
                <n.icon className="h-3 w-3" />
                {n.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {section === 'docs' && (
          <div className="space-y-5">
            <header>
              <div className="text-[11.5px] font-semibold uppercase tracking-wider text-zinc-400">
                STEP 1
              </div>
              <h2 className="mt-1 text-[24px] font-semibold tracking-tight text-zinc-950">
                공모 문서 업로드
              </h2>
              <p className="mt-1 text-[13.5px] text-zinc-500">
                3종 PDF를 각 슬롯에 업로드하면 AI가 한 번에 분석합니다. HWP는 PDF로 변환 후 업로드해주세요.
              </p>
            </header>
            <div className="grid gap-3 md:grid-cols-3">
              <DocumentUploader
                kind="guideline"
                current={project.documents.guideline}
                onChange={(v) => setDoc('guideline', v)}
              />
              <DocumentUploader
                kind="notice"
                current={project.documents.notice}
                onChange={(v) => setDoc('notice', v)}
              />
              <DocumentUploader
                kind="task"
                current={project.documents.task}
                onChange={(v) => setDoc('task', v)}
              />
            </div>

            <div className="pt-2">
              <AnalysisRunnerUI
                project={project}
                rerun={!!a}
                onComplete={(next) => {
                  update(next);
                  setSection('summary');
                }}
              />
            </div>
          </div>
        )}

        {a && section === 'summary' && (
          <SectionWrap step="2" title="핵심 요약" subtitle="3개 문서를 교차 참조하여 같은 항목의 값이 다르면 표시됩니다.">
            <SummarySection summary={a.summary} />
          </SectionWrap>
        )}

        {a && section === 'schedule' && (
          <SectionWrap step="3" title="제출 일정표" subtitle="발주처 일정과 사무소 내부 마일스톤이 색상으로 구분됩니다.">
            <ScheduleSection schedule={a.schedule} />
          </SectionWrap>
        )}

        {a && section === 'concepts' && (
          <SectionWrap step="4" title="디자인 컨셉 10개" subtitle="카테고리가 겹치지 않도록 분산 생성됩니다. 별표로 즐겨찾기.">
            <ConceptsSection
              concepts={a.concepts}
              starredIds={project.starredConceptIds}
              onToggleStar={toggleStar}
            />
          </SectionWrap>
        )}

        {a && section === 'checklist' && (
          <SectionWrap step="5" title="제출물 체크리스트" subtitle="누락 시 실격에 해당하는 항목은 빨간 배지로 강조됩니다.">
            <ChecklistSection
              submittables={a.submittables}
              checkedIds={project.checkedSubmittableIds}
              onToggle={toggleCheck}
            />
          </SectionWrap>
        )}

        {a && section === 'programs' && (
          <SectionWrap step="6" title="프로그램 관계 분석" subtitle="과업지시서의 도입 시설을 표 + Bubble Diagram으로 시각화.">
            <ProgramSection programs={a.programs} relations={a.relations} />
          </SectionWrap>
        )}

        {section === 'memo' && (
          <SectionWrap step="7" title="메모" subtitle="검토 과정의 의견·수정사항을 자유롭게 작성하세요.">
            <MemoSection
              value={project.memo}
              onChange={(v) => update({ ...project, memo: v })}
            />
          </SectionWrap>
        )}

        {!a && section !== 'docs' && section !== 'memo' && (
          <div className="surface-card flex flex-col items-center gap-3 px-6 py-14 text-center">
            <Sparkles className="h-5 w-5 text-zinc-400" />
            <h3 className="text-[15px] font-semibold tracking-tight text-zinc-900">
              아직 분석 결과가 없습니다
            </h3>
            <p className="max-w-md text-[13px] leading-relaxed text-zinc-500">
              먼저 PDF를 업로드한 후 분석을 실행해주세요.
            </p>
            <Button variant="outline" onClick={() => setSection('docs')}>
              문서 업로드로 이동
            </Button>
          </div>
        )}
      </div>

      {/* Hidden render target for PDF export */}
      {a && (
        <div
          style={{
            position: 'absolute',
            left: -99999,
            top: 0,
            width: 820,
            background: 'white',
          }}
          aria-hidden="true"
        >
          <div ref={printRef}>
            <ReportShell project={project} forPrint />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionWrap({
  step,
  title,
  subtitle,
  children,
}: {
  step: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 animate-fade-in">
      <header>
        <div className="text-[11.5px] font-semibold uppercase tracking-wider text-zinc-400">
          STEP {step}
        </div>
        <h2 className="mt-1 text-[24px] font-semibold tracking-tight text-zinc-950">{title}</h2>
        {subtitle && <p className="mt-1 text-[13.5px] text-zinc-500">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}
