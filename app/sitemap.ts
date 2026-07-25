import type { MetadataRoute } from 'next';
import pricesData from '../public/api/v1/prices.json';
import { locale, getBaseUrl } from '../src/lib/i18n';

export const dynamic = 'force-static';

const BASE_URL = getBaseUrl();

/**
 * A page's real last-modified date is when its PRICING DATA changed, not when
 * the site was rebuilt.
 *
 * Every entry previously used `new Date()`, so all 385 URLs were stamped with
 * the build second. The daily pricing bot commits to master, which triggers a
 * deploy, which re-stamped every page as modified every single day. Crawlers
 * discount a lastmod that always says "today" -- which is costly right after
 * going from 190 to 351 compare pages that genuinely need crawling.
 */
function verifiedAt(...models: { last_human_verified?: string }[]): Date {
  const stamps = models
    .map((m) => m.last_human_verified)
    .filter((d): d is string => Boolean(d))
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t));
  return stamps.length > 0 ? new Date(Math.max(...stamps)) : new Date(pricesData.generated_at);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const activeModels = pricesData.models.filter((m) => m.active);
  const modelIds = activeModels.map((m) => m.id);
  const byId = new Map(activeModels.map((m) => [m.id, m]));
  // Static pages change when the site is rebuilt, so the generation stamp is
  // the honest value for them.
  const siteModified = new Date(pricesData.generated_at);

  // Generate all N*(N-1)/2 compare pairs with sorted IDs for canonical slugs
  const comparePairs: MetadataRoute.Sitemap = [];
  for (let i = 0; i < modelIds.length; i++) {
    for (let j = i + 1; j < modelIds.length; j++) {
      const [a, b] = [modelIds[i], modelIds[j]].sort();
      comparePairs.push({
        url: `${BASE_URL}/compare/${a}-vs-${b}/`,
        // Whichever of the pair was verified most recently.
        lastModified: verifiedAt(byId.get(a)!, byId.get(b)!),
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }
  }

  // /models/[id] pages
  const modelPages: MetadataRoute.Sitemap = activeModels.map((model) => ({
    url: `${BASE_URL}/models/${model.id}/`,
    lastModified: verifiedAt(model),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: siteModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    ...(locale === 'en' ? [{
      url: `${BASE_URL}/learn/what-is-a-token/`,
      lastModified: siteModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }] : []),
    ...(locale === 'en' ? [{
      url: `${BASE_URL}/privacy/`,
      lastModified: siteModified,
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    }] : []),
    ...(locale === 'en' ? [{
      url: `${BASE_URL}/about/`,
      lastModified: siteModified,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }] : []),
    ...(locale === 'en' ? [{
      url: `${BASE_URL}/contact/`,
      lastModified: siteModified,
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }] : []),
    {
      url: `${BASE_URL}/compare/`,
      lastModified: siteModified,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/models/`,
      lastModified: siteModified,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...modelPages,
    ...comparePairs,
  ];
}
