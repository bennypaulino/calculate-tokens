import type { MetadataRoute } from 'next';
import { locale, getBaseUrl } from '../src/lib/i18n';

export const dynamic = 'force-static';

const BASE_URL = getBaseUrl();

/**
 * Generated per locale, replacing the static public/robots.txt.
 *
 * The static file was shipped byte-identical to all five hosts, so every locale
 * subdomain declared the ENGLISH sitemap URLs. Google honours a cross-host
 * sitemap entry only when that sitemap is declared in the target host's own
 * robots.txt, so 4 x 381 locale URLs had no valid sitemap declaration and each
 * locale property reported none submitted. app/sitemap.ts already derives its
 * host from getBaseUrl(); this brings robots.txt in line.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/api/v1/prices.json', '/llms.txt', '/llms-full.txt'],
        disallow: [
          // Next.js RSC flight payloads. The previous `/__next*` matched only
          // root-prefixed paths, but these are emitted at every nested route --
          // /models/gpt-5-5/index.txt, /compare/__next.compare.txt and ~3,083
          // more, each returning 200 with the page's full prose. Next <Link>
          // prefetch makes them discoverable, so they were roughly 8x
          // crawl-budget inflation against 385 real pages.
          '/*__next',
          '/*index.txt$',
          // Built as real directories by the static export, so both return 200
          // and read as soft 404s.
          '/404/',
          '/_not-found/',
        ],
      },
    ],
    // Own-host sitemap only. sitemap_index.xml lists every locale and is
    // meaningful only on the canonical English host.
    sitemap:
      locale === 'en'
        ? [`${BASE_URL}/sitemap.xml`, `${BASE_URL}/sitemap_index.xml`]
        : [`${BASE_URL}/sitemap.xml`],
    host: BASE_URL,
  };
}
