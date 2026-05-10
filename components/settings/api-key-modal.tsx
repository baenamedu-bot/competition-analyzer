'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, KeyRound, ShieldCheck, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getApiKey, setApiKey, clearApiKey } from '@/lib/api-key-storage';

export function ApiKeyModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [value, setValue] = useState('');
  const [show, setShow] = useState(false);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    if (open) {
      const k = getApiKey();
      setValue(k ?? '');
      setHasKey(!!k);
      setShow(false);
    }
  }, [open]);

  function save() {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error('API 키를 입력하세요.');
      return;
    }
    setApiKey(trimmed);
    toast.success('API 키가 저장되었습니다.');
    onOpenChange(false);
  }

  function remove() {
    clearApiKey();
    setValue('');
    setHasKey(false);
    toast.success('저장된 API 키를 삭제했습니다.');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="mb-1 inline-flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-white">
              <KeyRound className="h-3.5 w-3.5" strokeWidth={2.2} />
            </span>
            <span className="text-[12.5px] font-semibold tracking-tight text-zinc-700">
              BYOK · Bring Your Own Key
            </span>
          </div>
          <DialogTitle>Gemini API 키 설정</DialogTitle>
          <DialogDescription>
            이 앱은 사용자가 직접 발급한 Gemini API 키로 동작합니다. 입력한 키는 이 브라우저에만
            저장되며 서버로 전송되지 않습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="api-key">API 키</Label>
          <div className="relative">
            <Input
              id="api-key"
              type={show ? 'text' : 'password'}
              autoComplete="off"
              spellCheck={false}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="AIza..."
              className="pr-10 font-mono text-[13px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter') save();
              }}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
              aria-label={show ? 'API 키 숨기기' : 'API 키 보기'}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Link
          href="https://aistudio.google.com/app/apikey"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-spec hover:underline underline-offset-4"
        >
          Gemini API 키 발급받기
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>

        <div className="flex items-start gap-2 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3 text-[12.5px] leading-relaxed text-zinc-600">
          <ShieldCheck className="mt-[2px] h-4 w-4 shrink-0 text-zinc-500" strokeWidth={1.8} />
          <p>
            입력한 키는 이 브라우저에만 저장되며 서버로 전송되지 않습니다. AI 분석 호출은 사용자
            브라우저에서 Gemini API로 직접 이루어집니다.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          {hasKey ? (
            <Button variant="ghost" size="sm" onClick={remove} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-3.5 w-3.5" />
              저장된 키 삭제
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button variant="cta" onClick={save}>
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
