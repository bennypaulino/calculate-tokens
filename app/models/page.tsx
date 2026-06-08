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
      <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-gray-900 transition-colors">
              {t("models.breadcrumbHome")}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-gray-900 font-medium" aria-current="page">
            {t("models.breadcrumbModels")}
          </li>
        </ol>
      </nav>

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
        {t("models.indexHeading")}
      </h1>
      <p className="text-gray-600 mb-10 max-w-2xl">
        {t("models.indexSubheading", { count: String(activeModels.length) })}
      </p>

      {/* Per-provider sections */}
      <div className="space-y-12">
        {grouped.map(({ provider, models: providerModels }) => (
          <section key={provider} aria-labelledby={`provider-${provider}`}>
            <h2
              id={`provider-${provider}`}
              className="text-lg font-semibold text-gray-900 mb-4"
            >
              {provider}
            </h2>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      {t("models.colModel")}
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">
                      {t("models.colInput")}
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">
                      {t("models.colOutput")}
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">
                      {t("models.colContext")}
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      {t("models.colFeatures")}
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {providerModels.map((model, i) => (
                    <tr
                      key={model.id}
                      className={i % 2 === 1 ? "bg-gray-50/50" : undefined}
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/models/${model.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {model.display_name}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                        {formatCost(model.input_cost_per_1m)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                        {formatCost(model.output_cost_per_1m)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 tabular-nums">
                        {formatContextWindow(model.context_window)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {model.supports_context_caching && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {t("models.featureCaching")}
                            </span>
                          )}
                          {model.supports_batch_api && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {t("models.featureBatch")}
                            </span>
                          )}
                          {model.thinking_model && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {t("models.featureThinking")}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/models/${model.id}`}
                          className="text-xs text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap"
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
      <div className="mt-12 pt-8 border-t border-gray-100">
        <p className="text-sm text-gray-600 mb-4">
          {t("models.openCalculatorCta")}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {t("models.openCalculatorButton")}
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
