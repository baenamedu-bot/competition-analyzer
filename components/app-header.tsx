'use client';
import Link from 'next/link';
import { Settings, KeyRound, Building2 } from 'lucide-react';
import { CreatorInfoModal } from '@/components/branding/creator-info-modal';
import { useApiKey } from '@/components/settings/api-key-context';
import { BRAND } from '@/components/branding/brand-constants';

export function AppHeader() {
  const { open, hasKey } = useApiKey();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur-md no-print">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-[0_2px_6px_rgba(15,23,42,0.18)]">
            <Building2 className="h-4 w-4" strokeWidth={2.2} />
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-semibold tracking-tight text-zinc-900 group-hover:text-zinc-700">
              {BRAND.appName}
            </span>
            <span className="hidden text-[12px] tracking-tight text-zinc-400 sm:inline">
              {BRAND.appTagline}
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-1">
          <button
            onClick={open}
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="API 키 설정"
          >
            <KeyRound className="h-[15px] w-[15px]" strokeWidth={1.8} />
            <span className="hidden sm:inline">
              {hasKey ? '키 설정됨' : 'API 키 설정'}
            </span>
            <span
              className={`ml-0.5 inline-block h-1.5 w-1.5 rounded-full ${
                hasKey ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </button>
          <button
            onClick={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            aria-label="설정"
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={1.7} />
          </button>
          <CreatorInfoModal />
        </div>
      </div>
    </header>
  );
}
