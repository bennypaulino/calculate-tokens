'use client';

import { useState } from 'react';
import { t } from '../../lib/i18n';

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      window.umami?.track('share_url_copied', { locale: process.env.NEXT_PUBLIC_LOCALE ?? 'en' });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      type="button"
      data-testid="share-button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
    >
      {copied ? t('share.copied') : t('share.copyLink')}
    </button>
  );
}
