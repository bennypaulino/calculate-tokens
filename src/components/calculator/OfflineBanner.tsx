import { t } from '../../lib/i18n';

interface Props {
  show: boolean;
}

export default function OfflineBanner({ show }: Props) {
  if (!show) return null;

  return (
    <div
      role="alert"
      className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2.5 rounded-lg"
    >
      <span aria-hidden="true">&#9888;</span>
      <span>{t('offline.banner')}</span>
    </div>
  );
}
