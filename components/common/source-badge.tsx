import type { Source } from '@/types';
import { DOC_LABELS } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  source: Source;
  className?: string;
  withDocName?: boolean;
}

export function SourceBadge({ source, className, withDocName = false }: Props) {
  if (source === 'ai') {
    return (
      <span className={cn('badge-ai', className)}>
        추천{withDocName ? ' · AI' : ''}
      </span>
    );
  }
  return (
    <span className={cn('badge-spec', className)}>
      지침{withDocName ? ` · ${DOC_LABELS[source]}` : ''}
    </span>
  );
}

export function railClass(source: Source): string {
  return source === 'ai' ? 'left-rail-ai' : 'left-rail-spec';
}
