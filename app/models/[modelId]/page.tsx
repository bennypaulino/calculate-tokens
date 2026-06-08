import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import pricesData from "@/public/api/v1/prices.json";
import { t, getBaseUrl, getHreflangAlternates, getLocaleConfig, locale } from "@/lib/i18n";

interface Model {
  id: string;
  display_name: string;
  provider: string;
  provider_pricing_url: string;
  tokenizer: string;
  context_window: number;
  input_cost_per_1m: number;
  output_cost_per_1m: number;
  supports_context_caching: boolean;
  context_caching_discount: number | null;
  supports_batch_api: boolean;
  batch_api_discount: number | null;
  thinking_model: boolean;
  thinking_multiplier: number | null;
  thinking_billed_separately: boolean;
  last_checked: string;
  last_human_verified: string;
  active: boolean;
  requires_js_render?: boolean;
}

const models = pricesData.models as Model[];
const dateLocale = locale === 'en' ? 'en-US' : locale;

function getActiveModels(): Model[] {
  return models.filter((m) => m.active);
}

function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toLocaleString(dateLocale, { maximumFractionDigits: 1 })}M tokens`;
  }
  return `${(tokens / 1_000).toLocaleString(dateLocale, { maximumFractionDigits: 0 })}k tokens`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatCost(cost: number): string {
  if (cost === 0) return "$0.00";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(2)}`;
  return `$${cost.toFixed(2)}`;
}

function computeMonthlyCost(model: Model): string {
  const requests = 1_000;
  const inputTokens = 500;
  const outputTokens = 200;
  const inputCost = (requests * inputTokens * model.input_cost_per_1m) / 1_000_000;
  const outputCost = (requests * outputTokens * model.output_cost_per_1m) / 1_000_000;
  const total = inputCost + outputCost;
  return total < 0.01 ? `$${total.toFixed(4)}` : `$${total.toFixed(2)}`;
}

function getTokenizerLabel(tokenizer: string): string {
  const labels: Record<string, string> = {
    cl100k_base: "cl100k_base (GPT-3.5/4 family)",
    o200k_base: "o200k_base (GPT-4o / o-series)",
    claude: "Anthropic Claude tokenizer",
    gemini: "Gemini tokenizer",
    llama: "SentencePiece (Llama family)",
    heuristic: "Heuristic (~4 chars/token)",
  };
  return labels[tokenizer] ?? tokenizer;
}

function getComparisonSlugs(modelId: string): { slug: string; otherName: string }[] {
  const activeModels = getActiveModels();
  const results: { slug: string; otherName: string }[] = [];

  for (const other of activeModels) {
    if (other.id === modelId) continue;
    const [a, b] = [modelId, other.id].sort();
    results.push({
      slug: `/compare/${a}-vs-${b}`,
      otherName: other.display_name,
    });
  }

  return results;
}

export async function generateStaticParams() {
  return getActiveModels().map((m) => ({ modelId: m.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ modelId: string }>;
}): Promise<Metadata> {
  const { modelId } = await params;
  const model = getActiveModels().find((m) => m.id === modelId);
  if (!model) return {};

  const title = t("models.pageTitle", { model: model.display_name });
  const description = `${model.display_name} API pricing: $${model.input_cost_per_1m}/1M input tokens, $${model.output_cost_per_1m}/1M output tokens. ${formatContextWindow(model.context_window)} context window. Calculate exact costs free.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${getBaseUrl()}/models/${modelId}`,
      languages: getHreflangAlternates(`/models/${modelId}`),
    },
    openGraph: {
      title,
      description,
      url: `${getBaseUrl()}/models/${modelId}`,
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

export default async function ModelPage({
  params,
}: {
  params: Promise<{ modelId: string }>;
}) {
  const { modelId } = await params;
  const model = getActiveModels().find((m) => m.id === modelId);

  if (!model) {
    notFound();
  }

  const monthlyCost = computeMonthlyCost(model);
  const comparisons = getComparisonSlugs(modelId);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: model.display_name,
    applicationCategory: "AI Language Model",
    operatingSystem: "Web",
    url: `${getBaseUrl()}/models/${model.id}`,
    offers: {
      "@type": "Offer",
      price: String(model.input_cost_per_1m),
      priceCurrency: "USD",
      description: "Per 1M input tokens",
    },
    description: `${model.display_name} by ${model.provider}. API pricing: $${model.input_cost_per_1m} per 1M input tokens, $${model.output_cost_per_1m} per 1M output tokens. Context window: ${formatContextWindow(model.context_window)}.`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-gray-900 transition-colors">
                {t("models.breadcrumbHome")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/models" className="hover:text-gray-900 transition-colors">
                {t("models.breadcrumbModels")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-gray-900 font-medium" aria-current="page">
              {model.display_name}
            </li>
          </ol>
        </nav>

        {/* H1 */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-3">
          {t("models.pageTitle", { model: model.display_name })}
        </h1>
        <p className="text-gray-600 mb-10">
          {t("models.pageSubheading", { model: model.display_name, provider: model.provider })}
        </p>

        {/* Pricing table */}
        <section aria-labelledby="pricing-table-heading" className="mb-10">
          <h2
            id="pricing-table-heading"
            className="text-xl font-semibold text-gray-900 mb-4"
          >
            {t("models.pricingDetails")}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 w-1/2">
                    {t("models.attrAttribute")}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700 w-1/2">
                    {t("models.attrValue")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 text-gray-600">{t("models.attrProvider")}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {model.provider}
                  </td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-600">
                    {t("models.attrInputCost")}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatCost(model.input_cost_per_1m)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-600">
                    {t("models.attrOutputCost")}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatCost(model.output_cost_per_1m)}
                  </td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-600">{t("models.attrContextCaching")}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {model.supports_context_caching && model.context_caching_discount != null
                      ? t("models.cachingYesDiscount", { pct: String(Math.round(model.context_caching_discount * 100)) })
                      : t("models.cachingNotSupported")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-600">{t("models.attrBatchDiscount")}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {model.supports_batch_api && model.batch_api_discount != null
                      ? t("models.batchOff", { pct: String(Math.round(model.batch_api_discount * 100)) })
                      : t("models.batchNotAvailable")}
                  </td>
                </tr>
                <tr className="bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-600">{t("models.attrContextWindow")}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {formatContextWindow(model.context_window)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-gray-600">{t("models.attrTokenizer")}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {getTokenizerLabel(model.tokenizer)}
                  </td>
                </tr>
                {model.thinking_model && (
                  <tr className="bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-600">{t("models.attrThinking")}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {model.thinking_billed_separately
                        ? model.thinking_multiplier
                          ? t("models.thinkingBilledSeparatelyMultiplier", { multiplier: String(model.thinking_multiplier) })
                          : t("models.thinkingBilledSeparately")
                        : t("models.thinkingBundled")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Plain-English cost example */}
        <section
          aria-labelledby="cost-example-heading"
          className="mb-10 border border-blue-100 bg-blue-50 rounded-xl px-6 py-5"
        >
          <h2
            id="cost-example-heading"
            className="text-base font-semibold text-blue-900 mb-2"
          >
            {t("models.costExampleHeading")}
          </h2>
          <p className="text-blue-800 text-sm leading-relaxed">
            {t("models.costExampleBody", { cost: monthlyCost, model: model.display_name, provider: model.provider })}
          </p>
          <p className="text-blue-700 text-xs mt-2">
            {t("models.costExampleRates", { inputCost: String(model.input_cost_per_1m), outputCost: String(model.output_cost_per_1m) })}
          </p>
        </section>

        {/* CTA */}
        <section className="mb-10">
          <Link
            href={`/?models=${model.id}`}
            className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {t("models.calculateCta", { model: model.display_name })}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </section>

        {/* Comparison back-links */}
        {comparisons.length > 0 && (
          <section aria-labelledby="comparisons-heading" className="mb-10">
            <h2
              id="comparisons-heading"
              className="text-xl font-semibold text-gray-900 mb-4"
            >
              {t("models.compareWith", { model: model.display_name })}
            </h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {comparisons.map(({ slug, otherName }) => (
                <li key={slug}>
                  <Link
                    href={slug}
                    className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors bg-white"
                  >
                    <span>
                      <span className="font-medium">{model.display_name}</span>
                      <span className="text-gray-400 mx-2">{t("models.vs")}</span>
                      <span className="font-medium">{otherName}</span>
                    </span>
                    <span className="text-gray-400" aria-hidden="true">
                      &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Data provenance footer */}
        <footer className="border-t border-gray-100 pt-6 text-xs text-gray-500 space-y-1">
          <p data-testid="pricing-last-verified">
            {t("models.pricingLastVerified")}{" "}
            <time dateTime={model.last_human_verified}>
              {formatDate(model.last_human_verified)}
            </time>
            {" — "}
            <a
              href={model.provider_pricing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700 transition-colors"
            >
              {t("models.pricingPageLink", { provider: model.provider })}
            </a>
          </p>
          <p>
            {t("models.pricingSource")}{" — "}{t("models.pricingSourceSuffix")}
          </p>
        </footer>
      </div>
    </>
  );
}
