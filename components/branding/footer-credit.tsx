import Link from 'next/link';
import { BRAND } from './brand-constants';

export function FooterCredit({ className = '' }: { className?: string }) {
  return (
    <footer
      className={`border-t border-zinc-200 bg-white py-6 text-center text-[12.5px] text-zinc-500 ${className}`}
    >
      <p className="tracking-tight">
        Powered by <span className="font-semibold text-zinc-700">{BRAND.studio}</span>
        <span className="mx-1.5 text-zinc-300">·</span>
        제작: <span className="text-zinc-700">{BRAND.creator}</span>
        <span className="mx-1.5 text-zinc-300">·</span>
        <Link
          href={BRAND.website}
          target="_blank"
          rel="noreferrer"
          className="text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline"
        >
          {BRAND.websiteLabel}
        </Link>
      </p>
    </footer>
  );
}
