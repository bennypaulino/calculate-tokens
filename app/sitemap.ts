import type { MetadataRoute } from 'next';
import pricesData from '../public/api/v1/prices.json';
import { locale, getBaseUrl } from '../src/lib/i18n';

export const dynamic = 'force-static';

const BASE_URL = getBaseUrl();

export default function sitemap(): MetadataRoute.Sitemap {
  const activeModels = pricesData.models.filter((m) => m.active);
  const modelIds = activeModels.map((m) => m.id);

  // Generate all N*(N-1)/2 compare pairs with sorted IDs for canonical slugs
  const comparePairs: MetadataRoute.Sitemap = [];
  for (let i = 0; i < modelIds.length; i++) {
    for (let j = i + 1; j < modelIds.length; j++) {
      const [a, b] = [modelIds[i], modelIds[j]].sort();
      comparePairs.push({
        url: `${BASE_URL}/compare/${a}-vs-${b}/`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.5,
      });
    }
  }

  // /models/[id] pages
  const modelPages: MetadataRoute.Sitemap = activeModels.map((model) => ({
    url: `${BASE_URL}/models/${model.id}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    ...(locale === 'en' ? [{
      url: `${BASE_URL}/learn/what-is-a-token/`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }] : []),
    ...(locale === 'en' ? [{
      url: `${BASE_URL}/privacy/`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.3,
    }] : []),
    ...(locale === 'en' ? [{
      url: `${BASE_URL}/about/`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }] : []),
    ...(locale === 'en' ? [{
      url: `${BASE_URL}/contact/`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    }] : []),
    {
      url: `${BASE_URL}/compare/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/models/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    ...modelPages,
    ...comparePairs,
  ];
}
