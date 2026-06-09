import type { Metadata } from "next";
import Link from "next/link";
import pricesData from "@/public/api/v1/prices.json";
import { t, getBaseUrl, getHreflangAlternates, getLocaleConfig } from "@/lib/i18n";

interface Model {
  id: string;
  display_name: string;
  provider: string;
  active?: boolean;
}

export async function generateMetadata(): Promise<Metadata> {
  const activeModels = pricesData.models.filter((m: Model) => m.active !== false);
  const pairs = buildPairs(activeModels);
  return {
    title: t("compare.indexHeading") + " — Calculate Tokens",
    description: t("compare.indexSubheading", { count: String(activeModels.length), pairs: String(pairs.length) }),
    openGraph: {
      locale: getLocaleConfig().ogLocale,
    },
    alternates: {
      canonical: `${getBaseUrl()}/compare`,
      languages: getHreflangAlternates("/compare"),
    },
  };
}

function getActiveModels(): Model[] {
  return pricesData.models.filter((m: Model) => m.active !== false);
}

function buildPairs(models: Model[]): { slugA: string; slugB: string; nameA: string; nameB: string; providerA: string; providerB: string }[] {
  const pairs = [];
  for (let i = 0; i < models.length; i++) {
    for (let j = i + 1; j < models.length; j++) {
      const ids = [models[i].id, models[j].id].sort();
      const [first, second] = ids;
      const modelFirst = models.find((m) => m.id === first)!;
      const modelSecond = models.find((m) => m.id === second)!;
      pairs.push({
        slugA: first,
        slugB: second,
        nameA: modelFirst.display_name,
        nameB: modelSecond.display_name,
        providerA: modelFirst.provider,
        providerB: modelSecond.provider,
      });
    }
  }
  return pairs;
}

// Group pairs by provider of first model for easier navigation
function groupByProvider(
  pairs: ReturnType<typeof buildPairs>
): Record<string, typeof pairs> {
  const groups: Record<string, typeof pairs> = {};
  for (const pair of pairs) {
    const key = pair.providerA;
    if (!groups[key]) groups[key] = [];
    groups[key].push(pair);
  }
  return groups;
}

export default function ComparePage() {
  const activeModels = getActiveModels();
  const pairs = buildPairs(activeModels);
  const grouped = groupByProvider(pairs);
  const providerOrder = ["OpenAI", "Anthropic", "Google", "DeepSeek", "Meta"];
  const sortedProviders = [
    ...providerOrder.filter((p) => grouped[p]),
    ...Object.keys(grouped).filter((p) => !providerOrder.includes(p)),
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Back link */}
      <nav aria-label="Breadcrumb" className="mb-8">
        <Link
          href="/"
          className="text-sm text-ct-accent hover:text-ct-accent-h transition-colors inline-flex items-center gap-1"
        >
          <span aria-hidden="true">&larr;</span>
          {t("compare.breadcrumb")}
        </Link>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ct-strong mb-3">
        {t("compare.indexHeading")}
      </h1>
      <p className="text-ct-body mb-10 text-base">
        {t("compare.indexSubheading", { count: String(activeModels.length), pairs: String(pairs.length) })}
      </p>

      <div className="space-y-10">
        {sortedProviders.map((provider) => (
          <section key={provider} aria-labelledby={`group-${provider}`}>
            <h2
              id={`group-${provider}`}
              className="text-sm font-semibold text-ct-muted uppercase tracking-wide mb-3"
            >
              {t("compare.providerGroup", { provider })}
            </h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {grouped[provider].map((pair) => (
                <li key={`${pair.slugA}-vs-${pair.slugB}`}>
                  <Link
                    href={`/compare/${pair.slugA}-vs-${pair.slugB}`}
                    className="flex items-center justify-between border border-ct-border rounded-lg px-4 py-3 text-sm text-ct-body hover:border-ct-accent hover:text-ct-strong transition-colors bg-ct-card"
                  >
                    <span>
                      <span className="font-medium">{pair.nameA}</span>
                      <span className="text-ct-subtle mx-2">{t("home.vs")}</span>
                      <span className="font-medium">{pair.nameB}</span>
                    </span>
                    <span className="text-ct-subtle ml-2 shrink-0" aria-hidden="true">
                      &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 border border-ct-border rounded-xl p-6 text-center bg-ct-card">
        <p className="text-sm text-ct-body mb-3">
          {t("compare.openCalculatorCta")}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 bg-ct-accent text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-ct-accent-h transition-colors"
          style={{ color: '#1a1205' }}
        >
          {t("compare.openCalculator")}
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
