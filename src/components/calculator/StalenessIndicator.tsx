import type { StalenessLevel } from '../../lib/prices';
import { t } from '../../lib/i18n';

interface Props {
  level: StalenessLevel;
  lastVerified: string;
}

export default function StalenessIndicator({ level, lastVerified }: Props) {
  if (level === 'fresh') return null;

  const isAmber = level === 'amber';
  const label = isAmber ? t('staleness.amber') : t('staleness.red');

  return (
    <div
      className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border"
      style={
        isAmber
          ? {
              background: 'var(--accent-tint)',
              borderColor: 'var(--accent-line)',
              color: 'var(--accent)',
            }
          : {
              background: 'var(--status-error-tint)',
              borderColor: 'var(--status-error-line)',
              color: 'var(--status-error)',
            }
      }
    >
      <span aria-hidden="true">⚠</span>
      <span>{label}</span>
      <span className="font-normal opacity-70">({lastVerified})</span>
    </div>
  );
}
