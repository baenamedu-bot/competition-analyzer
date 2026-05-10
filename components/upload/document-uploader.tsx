'use client';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload, FileText, Check, X, FileWarning, Loader2 } from 'lucide-react';
import { extractPdfText, type ExtractProgress } from '@/lib/pdf-extractor';
import type { DocumentExtract, DocKind } from '@/types';
import { DOC_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  kind: DocKind;
  current: DocumentExtract | null;
  onChange: (next: DocumentExtract | null) => void;
}

export function DocumentUploader({ kind, current, onChange }: Props) {
  const [progress, setProgress] = useState<ExtractProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (file.name.toLowerCase().endsWith('.hwp') || file.name.toLowerCase().endsWith('.hwpx')) {
      toast.error('HWP는 1차 출시에서 미지원입니다. PDF로 변환 후 업로드해주세요.');
      return;
    }
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      toast.error('PDF 파일만 업로드 가능합니다.');
      return;
    }
    setBusy(true);
    setProgress({ page: 0, total: 0 });
    try {
      const result = await extractPdfText(file, (p) => setProgress(p));
      const extract: DocumentExtract = {
        kind,
        fileName: file.name,
        pageCount: result.pageCount,
        charCount: result.charCount,
        uploadedAt: new Date().toISOString(),
        text: result.text,
      };
      onChange(extract);
      toast.success(
        `${DOC_LABELS[kind]} 업로드 완료 (${result.pageCount}페이지, ${(result.charCount / 1000).toFixed(1)}K자)`
      );
    } catch (e) {
      toast.error(`PDF 읽기 실패: ${(e as Error).message}`);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  function clear() {
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  const filled = !!current;

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        const f = e.dataTransfer.files?.[0];
        if (f) handleFile(f);
      }}
      className={cn(
        'surface-card relative flex flex-col gap-3 p-4 transition-all',
        hover && 'border-zinc-900 ring-2 ring-zinc-200',
        filled && 'border-emerald-200 bg-emerald-50/30'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-md',
              filled ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-500'
            )}
          >
            {filled ? (
              <Check className="h-4 w-4" strokeWidth={2.2} />
            ) : (
              <FileText className="h-4 w-4" strokeWidth={1.8} />
            )}
          </span>
          <div>
            <div className="text-[13.5px] font-semibold tracking-tight text-zinc-900">
              {DOC_LABELS[kind]}
            </div>
            <div className="text-[11.5px] text-zinc-500">
              {kind === 'guideline' && 'PDF · 평가·심사 기준 포함'}
              {kind === 'notice' && 'PDF · 공고일·일정·자격 포함'}
              {kind === 'task' && 'PDF · 도입시설·면적표 포함'}
            </div>
          </div>
        </div>
        {filled && (
          <button
            onClick={clear}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-600"
            aria-label="파일 삭제"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {!filled && !busy && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-300 bg-zinc-50/50 px-4 py-7 text-center transition-colors hover:border-zinc-400 hover:bg-zinc-50"
        >
          <Upload className="h-4 w-4 text-zinc-400" strokeWidth={1.8} />
          <span className="text-[12.5px] text-zinc-600">
            PDF 파일을 끌어다 놓거나 클릭하여 선택
          </span>
          <span className="text-[11px] text-zinc-400">최대 300페이지 권장</span>
        </button>
      )}

      {busy && (
        <div className="flex flex-col gap-2 rounded-lg bg-zinc-50 px-4 py-5">
          <div className="flex items-center gap-2 text-[12.5px] text-zinc-700">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            텍스트 추출 중
            {progress && progress.total > 0
              ? ` ${progress.page}/${progress.total}페이지`
              : '...'}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full bg-zinc-900 transition-all"
              style={{
                width:
                  progress && progress.total > 0
                    ? `${(progress.page / progress.total) * 100}%`
                    : '4%',
              }}
            />
          </div>
        </div>
      )}

      {filled && (
        <div className="flex items-center gap-3 rounded-lg bg-white/70 px-3 py-2 text-[12px] text-zinc-600">
          <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
          <span className="truncate font-medium text-zinc-700">{current.fileName}</span>
          <span className="ml-auto shrink-0 tabular-nums text-zinc-400">
            {current.pageCount}p · {(current.charCount / 1000).toFixed(1)}K자
          </span>
        </div>
      )}

      {kind === 'guideline' && !filled && (
        <p className="flex items-start gap-1.5 text-[11.5px] text-zinc-500">
          <FileWarning className="mt-[2px] h-3 w-3 shrink-0 text-amber-500" />
          HWP는 1차 출시에서 미지원 — PDF로 변환 후 업로드하세요.
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
