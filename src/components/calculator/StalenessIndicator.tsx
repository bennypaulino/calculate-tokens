import type { StalenessLevel } from '../../lib/prices';

interface Props {
  level: StalenessLevel;
  lastVerified: string;
}

const config = {
  fresh: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', label: 'Prices verified' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: 'Prices may be outdated' },
  red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', label: 'Prices outdated' },
};

export default function StalenessIndicator({ level, lastVerified }: Props) {
  if (level === 'fresh') return null;

  const { bg, text, border, label } = config[level];

  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${bg} ${text} ${border}`}>
      <span aria-hidden="true">{level === 'amber' ? '⚠' : '⛔'}</span>
      <span>{label}</span>
      <span className="font-normal opacity-70">({lastVerified})</span>
    </div>
  );
}
