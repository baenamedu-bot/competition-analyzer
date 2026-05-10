'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Plus,
  FolderOpen,
  Trash2,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  ArrowRight,
  FileSearch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { listProjects, createProject, deleteProject } from '@/lib/storage';
import { uid, formatDate } from '@/lib/utils';
import type { ProjectMeta } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [openNew, setOpenNew] = useState(false);
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [deadline, setDeadline] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<ProjectMeta | null>(null);

  useEffect(() => {
    setProjects(listProjects());
    setLoaded(true);
  }, []);

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('프로젝트명을 입력하세요.');
      return;
    }
    const id = uid();
    createProject({
      id,
      name: trimmed,
      client: client.trim(),
      finalDeadline: deadline,
    });
    toast.success('프로젝트를 생성했습니다.');
    setOpenNew(false);
    setName('');
    setClient('');
    setDeadline('');
    router.push(`/projects/${id}`);
  }

  function handleDelete(p: ProjectMeta) {
    deleteProject(p.id);
    setProjects(listProjects());
    setConfirmDelete(null);
    toast.success(`"${p.name}" 프로젝트를 삭제했습니다.`);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11.5px] font-medium tracking-tight text-zinc-600">
            <FileSearch className="h-3 w-3" strokeWidth={2.2} />
            현상설계 공모 분석
          </div>
          <h1 className="text-[34px] font-semibold leading-[1.15] tracking-tight text-zinc-950">
            공모 프로젝트
          </h1>
          <p className="max-w-2xl text-[14.5px] leading-relaxed text-zinc-500">
            공모 단위로 프로젝트를 만들고, 공모지침서·공고문·과업지시서 PDF를 업로드하면
            핵심 요약·일정표·디자인 컨셉·체크리스트·프로그램 관계까지 자동으로 정리됩니다.
          </p>
        </div>
        <Button variant="cta" size="lg" onClick={() => setOpenNew(true)} className="self-start md:self-auto">
          <Plus className="h-4 w-4" />
          새 프로젝트
        </Button>
      </div>

      <div className="mt-9 grid gap-3">
        {!loaded ? (
          <SkeletonGrid />
        ) : projects.length === 0 ? (
          <EmptyState onCreate={() => setOpenNew(true)} />
        ) : (
          projects.map((p) => (
            <ProjectRow
              key={p.id}
              p={p}
              onDelete={() => setConfirmDelete(p)}
            />
          ))
        )}
      </div>

      <Dialog open={openNew} onOpenChange={setOpenNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 공모 프로젝트</DialogTitle>
            <DialogDescription>
              프로젝트 이름·발주처·최종 제출 마감일을 입력하세요. 마감일은 내부 마일스톤
              역산에 사용됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">프로젝트명 *</Label>
              <Input
                id="p-name"
                placeholder="예: 청주시 복합문화센터 현상설계"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-client">발주처</Label>
              <Input
                id="p-client"
                placeholder="예: 청주시청"
                value={client}
                onChange={(e) => setClient(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="p-deadline">최종 제출 마감일</Label>
              <Input
                id="p-deadline"
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={() => setOpenNew(false)}>
              취소
            </Button>
            <Button variant="cta" onClick={handleCreate}>
              만들기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>프로젝트 삭제</DialogTitle>
            <DialogDescription>
              <strong className="text-zinc-700">"{confirmDelete?.name}"</strong> 프로젝트를
              삭제하시겠습니까? 분석 결과·메모·체크리스트가 모두 사라지며 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
            >
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProjectRow({ p, onDelete }: { p: ProjectMeta; onDelete: () => void }) {
  return (
    <Link
      href={`/projects/${p.id}`}
      className="surface-card surface-card-hover flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:gap-6"
    >
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
          <FolderOpen className="h-4 w-4" strokeWidth={1.7} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold tracking-tight text-zinc-900">
            {p.name}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-zinc-500">
            {p.client ? (
              <span className="inline-flex items-center gap-1">
                <Building2 className="h-3 w-3" strokeWidth={1.8} />
                {p.client}
              </span>
            ) : null}
            {p.finalDeadline ? (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-3 w-3" strokeWidth={1.8} />
                마감 {formatDate(p.finalDeadline)}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" strokeWidth={1.8} />
              수정 {formatDate(p.updatedAt)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {p.hasAnalysis ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11.5px] font-semibold text-emerald-700">
            <CheckCircle2 className="h-3 w-3" />
            분석 완료
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11.5px] font-semibold text-amber-700">
            업로드 대기
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
          aria-label="프로젝트 삭제"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.7} />
        </button>
        <ArrowRight className="h-4 w-4 text-zinc-400" strokeWidth={1.6} />
      </div>
    </Link>
  );
}

function SkeletonGrid() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="surface-card flex items-center gap-4 px-5 py-4">
          <div className="skeleton h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/3" />
            <div className="skeleton h-3 w-1/2" />
          </div>
        </div>
      ))}
    </>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="surface-card mt-2 flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
        <FolderOpen className="h-5 w-5" strokeWidth={1.7} />
      </span>
      <h3 className="text-[16px] font-semibold tracking-tight text-zinc-900">
        아직 프로젝트가 없습니다
      </h3>
      <p className="max-w-md text-[13.5px] leading-relaxed text-zinc-500">
        공모 단위로 프로젝트를 생성하고, 3종 PDF를 업로드하면 6개 섹션으로 자동 정리됩니다.
        결과는 이 브라우저의 localStorage에 저장됩니다.
      </p>
      <Button variant="cta" size="lg" className="mt-2" onClick={onCreate}>
        <Plus className="h-4 w-4" />
        첫 프로젝트 만들기
      </Button>
    </div>
  );
}
