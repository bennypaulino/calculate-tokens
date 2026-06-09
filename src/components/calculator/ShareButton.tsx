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
      className="inline-flex items-center gap-1.5 rounded-md border border-ct-border px-3 py-1.5 text-xs font-medium text-ct-muted shadow-sm transition-colors hover:border-ct-accent hover:text-ct-body"
      style={{ background: 'var(--surface-control)' }}
    >
      {copied ? t('share.copied') : t('share.copyLink')}
    </button>
  );
}
