import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-5 py-24 text-center">
      <div className="text-[12px] font-semibold uppercase tracking-wider text-zinc-400">
        404
      </div>
      <h1 className="text-[28px] font-semibold tracking-tight text-zinc-950">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="max-w-sm text-[13.5px] leading-relaxed text-zinc-500">
        요청하신 경로가 존재하지 않거나 삭제되었을 수 있습니다.
      </p>
      <Button asChild variant="cta" size="lg" className="mt-2">
        <Link href="/">프로젝트 목록으로</Link>
      </Button>
    </div>
  );
}
