'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Info, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BRAND } from './brand-constants';

export function CreatorInfoModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        onClick={() => setOpen(true)}
        aria-label="앱 정보"
        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
      >
        <Info className="h-[18px] w-[18px]" strokeWidth={1.7} />
      </button>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mb-1 inline-flex items-center gap-2">
            <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold tracking-wider text-white">
              {BRAND.studio}
            </span>
          </div>
          <DialogTitle>이 앱에 대해</DialogTitle>
          <DialogDescription>
            이 앱은 <strong className="text-zinc-700">{BRAND.studio}</strong>의 AI 교육
            프로그램에서 제작되었습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
          <div className="text-[13px] text-zinc-500">제작자</div>
          <div className="mt-1 text-[15px] font-semibold text-zinc-900">{BRAND.creator}</div>
          <div className="mt-0.5 text-[12.5px] text-zinc-500">{BRAND.creatorTitle}</div>
        </div>

        <div className="text-[13px] leading-relaxed text-zinc-600">
          AI 교육·강연·맞춤 앱 제작 문의 환영합니다.
        </div>

        <Button asChild variant="cta" size="lg" className="mt-1">
          <Link href={BRAND.website} target="_blank" rel="noreferrer">
            홈페이지 방문
            <ExternalLink className="h-4 w-4" />
          </Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
