import type { Metadata } from "next";
import Link from "next/link";
import pricesData from "@/public/api/v1/prices.json";
import { t, getBaseUrl, getHreflangAlternates, getLocaleConfig } from "@/lib/i18n";

interface Model {
  id: string;
  display_name: string;
  provider: string;
  tokenizer: string;
  context_window: number;
  input_cost_per_1m: number;
  output_cost_per_1m: number;
  supports_context_caching: boolean;
  supports_batch_api: boolean;
  thinking_model: boolean;
  active: boolean;
}

const models = pricesData.models as Model[];
const activeModels = models.filter((m) => m.active);

function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toLocaleString()}M`;
  }
  return `${(tokens / 1_000).toLocaleString()}k`;
}

function formatCost(cost: number): string {
  if (cost === 0) return "$0.00";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(2)}`;
  return `$${cost.toFixed(2)}`;
}

// Group models by provider
const providerOrder = ["OpenAI", "Anthropic", "Google", "DeepSeek", "Meta"];
const grouped = providerOrder
  .map((provider) => ({
    provider,
    models: activeModels.filter((m) => m.provider === provider),
  }))
  .filter((g) => g.models.length > 0);

// Catch any providers not in the hard-coded order
const coveredProviders = new Set(providerOrder);
const extraProviders = activeModels
  .map((m) => m.provider)
  .filter((p) => !coveredProviders.has(p))
  .filter((p, i, arr) => arr.indexOf(p) === i);

for (const provider of extraProviders) {
  grouped.push({
    provider,
    models: activeModels.filter((m) => m.provider === provider),
  });
}

export async function generateMetadata(): Promise<Metadata> {
  const title = t("models.indexMetaTitle", { count: String(activeModels.length) });
  const description = t("models.indexMetaDesc", { count: String(activeModels.length) });
  return {
    title,
    description,
    alternates: {
      canonical: `${getBaseUrl()}/models`,
      languages: getHreflangAlternates("/models"),
    },
    openGraph: {
      title,
      description,
      url: `${getBaseUrl()}/models`,
      siteName: t("meta.siteName"),
      images: [
        {
          url: "/ai-token-cost-calculator.jpg",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: getLocaleConfig().ogLocale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/ai-token-cost-calculator.jpg"],
    },
  };
}

export default function ModelsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Breadcrumb */}
      <nav className="text-sm text-ct-muted mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-ct-strong transition-colors">
              {t("models.breadcrumbHome")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ct-strong font-medium" aria-current="page">
            {t("models.breadcrumbModels")}
          </li>
        </ol>
      </nav>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ct-strong mb-3">
        {t("models.indexHeading")}
      </h1>
      <p className="text-ct-body mb-10 max-w-2xl">
        {t("models.indexSubheading", { count: String(activeModels.length) })}
      </p>

      {/* Per-provider sections */}
      <div className="space-y-12">
        {grouped.map(({ provider, models: providerModels }) => (
          <section key={provider} aria-labelledby={`provider-${provider}`}>
            <h2
              id={`provider-${provider}`}
              className="text-lg font-semibold text-ct-strong mb-4"
            >
              {provider}
            </h2>

            <div className="overflow-x-auto rounded-xl border border-ct-border" style={{ background: 'var(--surface-card)' }}>
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="border-b border-ct-border" style={{ background: 'var(--surface-sunken)' }}>
                    <th className="text-left px-4 py-3 font-semibold text-ct-muted">
                      {t("models.colModel")}
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-ct-muted">
                      {t("models.colInput")}
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-ct-muted">
                      {t("models.colOutput")}
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-ct-muted">
                      {t("models.colContext")}
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-ct-muted">
                      {t("models.colFeatures")}
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ct-border-subtle">
                  {providerModels.map((model) => (
                    <tr
                      key={model.id}
                      className="hover:bg-ct-raised transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/models/${model.id}`}
                          className="font-medium text-ct-strong hover:text-ct-accent transition-colors"
                        >
                          {model.display_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-ct-body font-mono tabular-nums">
                        {formatCost(model.input_cost_per_1m)}
                      </td>
                      <td className="px-4 py-3 text-right text-ct-body font-mono tabular-nums">
                        {formatCost(model.output_cost_per_1m)}
                      </td>
                      <td className="px-4 py-3 text-right text-ct-body font-mono tabular-nums">
                        {formatContextWindow(model.context_window)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {model.supports_context_caching && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border" style={{ background: 'var(--status-exact-tint)', borderColor: 'var(--status-exact-line)', color: 'var(--status-exact)' }}>
                              {t("models.featureCaching")}
                            </span>
                          )}
                          {model.supports_batch_api && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border" style={{ background: 'var(--accent-tint)', borderColor: 'var(--accent-line)', color: 'var(--accent)' }}>
                              {t("models.featureBatch")}
                            </span>
                          )}
                          {model.thinking_model && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border border-ct-border text-ct-muted bg-ct-control">
                              {t("models.featureThinking")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/models/${model.id}`}
                          className="text-xs text-ct-subtle hover:text-ct-accent transition-colors whitespace-nowrap"
                          aria-label={t("models.detailsAriaLabel", { model: model.display_name })}
                        >
                          {t("models.detailsLink")}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 pt-8 border-t border-ct-border-subtle">
        <p className="text-sm text-ct-body mb-4">
          {t("models.openCalculatorCta")}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-ct-accent text-sm font-semibold px-5 py-3 rounded-lg hover:bg-ct-accent-h transition-colors"
          style={{ color: '#1a1205' }}
        >
          {t("models.openCalculatorButton")}
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
