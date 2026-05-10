'use client';
import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BRAND } from './brand-constants';

const FLAG = 'welcome_shown';

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;
    if (!localStorage.getItem(FLAG)) {
      const t = setTimeout(() => setOpen(true), 220);
      return () => clearTimeout(t);
    }
  }, []);

  function handleClose() {
    if (typeof window !== 'undefined') localStorage.setItem(FLAG, '1');
    setOpen(false);
  }

  if (!mounted) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogContent className="max-w-lg">
        <div className="mb-1 inline-flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-zinc-900 text-white">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
          </span>
          <span className="text-[13px] font-semibold tracking-tight text-zinc-700">
            {BRAND.studio}
          </span>
        </div>

        <DialogHeader>
          <DialogTitle className="text-2xl leading-tight">
            현상설계 공모, <br />
            <span className="text-zinc-500">사전 독해를 반나절로</span>
          </DialogTitle>
          <DialogDescription className="pt-1">
            이 앱은 <strong className="text-zinc-700">{BRAND.studio}</strong>의 AI 교육에서 만든
            앱입니다. 100~300페이지 분량의 공모지침서·공고문·과업지시서를 자동 분석하여 핵심 요약,
            제출 일정표, 디자인 컨셉 10개, 제출물 체크리스트, 프로그램 관계 다이어그램까지 한
            번에 정리해 드립니다.
          </DialogDescription>
        </DialogHeader>

        <ul className="mt-2 space-y-2 text-[13.5px] text-zinc-600">
          <li className="flex items-start gap-2">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-spec" />
            <span>
              <span className="badge-spec mr-1.5 align-middle">지침</span>
              문서에 명시된 사항은 청색으로 표시됩니다.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-ai" />
            <span>
              <span className="badge-ai mr-1.5 align-middle">추천</span>
              AI가 일반 원칙으로 제안한 사항은 녹색으로 구분됩니다.
            </span>
          </li>
        </ul>

        <Button onClick={handleClose} variant="cta" size="lg" className="mt-2">
          시작하기
        </Button>
      </DialogContent>
    </Dialog>
  );
}
