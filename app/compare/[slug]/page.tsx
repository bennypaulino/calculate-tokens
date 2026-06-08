import type { Metadata } from "next";
import Link from "next/link";
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
  last_human_verified: string;
}

const models = pricesData.models as Model[];

function getActiveModels(): Model[] {
  return (pricesData.models as (Model & { active?: boolean })[]).filter(
    (m) => m.active !== false
  );
}

const dateLocale = locale === 'en' ? 'en-US' : locale;

function formatContextWindow(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toLocaleString(dateLocale, { maximumFractionDigits: 1 })}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toLocaleString(dateLocale, { maximumFractionDigits: 0 })}K`;
  }
  return tokens.toLocaleString(dateLocale);
}

function formatTokenizer(tokenizer: string): string {
  const map: Record<string, string> = {
    cl100k_base: "cl100k_base (tiktoken)",
    o200k_base: "o200k_base (tiktoken)",
    claude: "Anthropic tokenizer",
    gemini: "Gemini tokenizer",
    llama: "SentencePiece (Llama)",
    heuristic: "Heuristic (~chars/4)",
  };
  return map[tokenizer] ?? tokenizer;
}

function formatCost(cost: number): string {
  if (cost < 1) {
    return `$${cost.toFixed(3)}`;
  }
  return `$${cost.toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(dateLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function parsePair(slug: string): { modelA: Model; modelB: Model } | null {
  const activeModels = getActiveModels();
  // Find every occurrence of "-vs-" and test each as a split point
  const separator = "-vs-";
  let searchFrom = 0;
  while (searchFrom < slug.length) {
    const idx = slug.indexOf(separator, searchFrom);
    if (idx === -1) break;
    const candidateA = slug.slice(0, idx);
    const candidateB = slug.slice(idx + separator.length);
    if (candidateA && candidateB) {
      const modelA = activeModels.find((m) => m.id === candidateA);
      const modelB = activeModels.find((m) => m.id === candidateB);
      if (modelA && modelB) {
        return { modelA, modelB };
      }
    }
    searchFrom = idx + 1;
  }
  return null;
}

export async function generateStaticParams() {
  const activeModels = getActiveModels();
  const params: { slug: string }[] = [];

  for (let i = 0; i < activeModels.length; i++) {
    for (let j = i + 1; j < activeModels.length; j++) {
      // Sort IDs for consistent canonical ordering
      const ids = [activeModels[i].id, activeModels[j].id].sort();
      params.push({ slug: `${ids[0]}-vs-${ids[1]}` });
    }
  }

  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const pair = parsePair(slug);

  if (!pair) {
    return { title: "Model Comparison — Calculate Tokens" };
  }

  const { modelA, modelB } = pair;
  const title = t("compare.pageTitle", { modelA: modelA.display_name, modelB: modelB.display_name });
  const description = t("compare.pageDescription", {
    modelA: modelA.display_name,
    modelB: modelB.display_name,
    inputA: String(modelA.input_cost_per_1m),
    inputB: String(modelB.input_cost_per_1m),
  });

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${getBaseUrl()}/compare/${slug}`,
      siteName: t("meta.siteName"),
      images: [
        {
          url: "/ai-token-cost-calculator.jpg",
          width: 1200,
          height: 630,
          alt: t("meta.siteTitle"),
        },
      ],
      locale: getLocaleConfig().ogLocale,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/ai-token-cost-calculator.jpg"],
    },
    alternates: {
      canonical: `${getBaseUrl()}/compare/${slug}`,
      languages: getHreflangAlternates(`/compare/${slug}`),
    },
  };
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pair = parsePair(slug);

  if (!pair) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {t("compare.notFound")}
        </h1>
        <p className="text-gray-600 mb-6">
          {t("compare.notFoundBody")}
        </p>
        <Link href="/compare" className="text-blue-600 hover:text-blue-700">
          {t("compare.viewAllComparisons")}
        </Link>
      </div>
    );
  }

  const { modelA, modelB } = pair;

  // Example: 1000 requests x 500 input tokens x 200 output tokens / month
  const EXAMPLE_REQUESTS = 1_000;
  const EXAMPLE_INPUT_TOKENS = 500;
  const EXAMPLE_OUTPUT_TOKENS = 200;
  const totalInputTokens = EXAMPLE_REQUESTS * EXAMPLE_INPUT_TOKENS;
  const totalOutputTokens = EXAMPLE_REQUESTS * EXAMPLE_OUTPUT_TOKENS;

  const costA =
    (totalInputTokens / 1_000_000) * modelA.input_cost_per_1m +
    (totalOutputTokens / 1_000_000) * modelA.output_cost_per_1m;
  const costB =
    (totalInputTokens / 1_000_000) * modelB.input_cost_per_1m +
    (totalOutputTokens / 1_000_000) * modelB.output_cost_per_1m;

  const cheaperModel = costA <= costB ? modelA : modelB;
  const cheaperCost = Math.min(costA, costB);
  const pricierCost = Math.max(costA, costB);
  const savings =
    pricierCost > 0
      ? (((pricierCost - cheaperCost) / pricierCost) * 100).toFixed(0)
      : "0";

  const lastVerifiedA = formatDate(modelA.last_human_verified);
  const lastVerifiedB = formatDate(modelB.last_human_verified);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: t("compare.faqCheaperQ", { modelA: modelA.display_name, modelB: modelB.display_name }),
        acceptedAnswer: {
          "@type": "Answer",
          text:
            costA < costB
              ? t("compare.faqCheaperAYes", {
                  modelA: modelA.display_name,
                  modelB: modelB.display_name,
                  inputA: formatCost(modelA.input_cost_per_1m),
                  outputA: formatCost(modelA.output_cost_per_1m),
                  costA: `$${costA.toFixed(4)}`,
                  costB: `$${costB.toFixed(4)}`,
                  pct: savings,
                })
              : costB < costA
              ? t("compare.faqCheaperANo", {
                  modelA: modelA.display_name,
                  modelB: modelB.display_name,
                  inputB: formatCost(modelB.input_cost_per_1m),
                  outputB: formatCost(modelB.output_cost_per_1m),
                  costA: `$${costA.toFixed(4)}`,
                  costB: `$${costB.toFixed(4)}`,
                  pct: savings,
                })
              : t("compare.faqCheaperAEqual", { cost: `$${costA.toFixed(4)}` }),
        },
      },
      {
        "@type": "Question",
        name: t("compare.faqContextQ", { modelA: modelA.display_name, modelB: modelB.display_name }),
        acceptedAnswer: {
          "@type": "Answer",
          text: t("compare.faqContextA", {
            modelA: modelA.display_name,
            modelB: modelB.display_name,
            windowA: formatContextWindow(modelA.context_window),
            windowB: formatContextWindow(modelB.context_window),
          }),
        },
      },
      {
        "@type": "Question",
        name: t("compare.faqCachingQ", { modelA: modelA.display_name, modelB: modelB.display_name }),
        acceptedAnswer: {
          "@type": "Answer",
          text: `${modelA.supports_context_caching ? `${modelA.display_name} supports context caching${modelA.context_caching_discount !== null ? ` with a ${(modelA.context_caching_discount * 100).toFixed(0)}% discount on cached tokens` : ""}.` : `${modelA.display_name} does not support context caching.`} ${modelB.supports_context_caching ? `${modelB.display_name} supports context caching${modelB.context_caching_discount !== null ? ` with a ${(modelB.context_caching_discount * 100).toFixed(0)}% discount on cached tokens` : ""}.` : `${modelB.display_name} does not support context caching.`}`,
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Back link */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link
            href="/compare"
            className="text-sm text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
          >
            <span aria-hidden="true">&larr;</span>
            {t("compare.allComparisons")}
          </Link>
        </nav>

        {/* H1 */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-3 leading-tight">
          {modelA.display_name} vs {modelB.display_name} — {t("compare.sideBySidePricing")}
        </h1>
        <p className="text-gray-600 mb-10 text-base">
          {t("compare.pageSubheading", {
            modelA: modelA.display_name,
            modelB: modelB.display_name,
            providerA: modelA.provider,
            providerB: modelB.provider,
          })}
        </p>

        {/* Pricing table */}
        <section aria-labelledby="pricing-table-heading" className="mb-12">
          <h2
            id="pricing-table-heading"
            className="text-lg font-semibold text-gray-900 mb-4"
          >
            {t("compare.sideBySidePricing")}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th
                    scope="col"
                    className="text-left px-4 py-3 font-medium text-gray-700 w-40"
                  >
                    {t("compare.featureCol")}
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 font-semibold text-gray-900"
                  >
                    {modelA.display_name}
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 font-semibold text-gray-900"
                  >
                    {modelB.display_name}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <th
                    scope="row"
                    className="px-4 py-3 font-medium text-gray-600 bg-gray-50 text-left"
                  >
                    {t("compare.provider")}
                  </th>
                  <td className="px-4 py-3 text-gray-900">{modelA.provider}</td>
                  <td className="px-4 py-3 text-gray-900">{modelB.provider}</td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-4 py-3 font-medium text-gray-600 bg-gray-50 text-left"
                  >
                    {t("compare.inputPer1M")}
                  </th>
                  <td
                    className="px-4 py-3 text-gray-900 font-mono"
                    data-model={modelA.id}
                    data-price-input={modelA.input_cost_per_1m}
                    data-price-output={modelA.output_cost_per_1m}
                  >
                    {formatCost(modelA.input_cost_per_1m)}
                  </td>
                  <td
                    className="px-4 py-3 text-gray-900 font-mono"
                    data-model={modelB.id}
                    data-price-input={modelB.input_cost_per_1m}
                    data-price-output={modelB.output_cost_per_1m}
                  >
                    {formatCost(modelB.input_cost_per_1m)}
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-4 py-3 font-medium text-gray-600 bg-gray-50 text-left"
                  >
                    {t("compare.outputPer1M")}
                  </th>
                  <td className="px-4 py-3 text-gray-900 font-mono">
                    {formatCost(modelA.output_cost_per_1m)}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-mono">
                    {formatCost(modelB.output_cost_per_1m)}
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-4 py-3 font-medium text-gray-600 bg-gray-50 text-left"
                  >
                    {t("compare.contextCaching")}
                  </th>
                  <td className="px-4 py-3 text-gray-900">
                    {modelA.supports_context_caching
                      ? modelA.context_caching_discount !== null
                        ? t("compare.cachingYesDiscount", { pct: String((modelA.context_caching_discount * 100).toFixed(0)) })
                        : t("compare.cachingYes")
                      : t("compare.cachingNo")}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {modelB.supports_context_caching
                      ? modelB.context_caching_discount !== null
                        ? t("compare.cachingYesDiscount", { pct: String((modelB.context_caching_discount * 100).toFixed(0)) })
                        : t("compare.cachingYes")
                      : t("compare.cachingNo")}
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-4 py-3 font-medium text-gray-600 bg-gray-50 text-left"
                  >
                    {t("compare.batchApiDiscount")}
                  </th>
                  <td className="px-4 py-3 text-gray-900">
                    {modelA.supports_batch_api && modelA.batch_api_discount !== null
                      ? t("compare.batchOff", { pct: String((modelA.batch_api_discount * 100).toFixed(0)) })
                      : t("compare.batchNotAvailable")}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {modelB.supports_batch_api && modelB.batch_api_discount !== null
                      ? t("compare.batchOff", { pct: String((modelB.batch_api_discount * 100).toFixed(0)) })
                      : t("compare.batchNotAvailable")}
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-4 py-3 font-medium text-gray-600 bg-gray-50 text-left"
                  >
                    {t("compare.contextWindow")}
                  </th>
                  <td className="px-4 py-3 text-gray-900 font-mono">
                    {t("compare.contextTokens", { count: formatContextWindow(modelA.context_window) })}
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-mono">
                    {t("compare.contextTokens", { count: formatContextWindow(modelB.context_window) })}
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-4 py-3 font-medium text-gray-600 bg-gray-50 text-left"
                  >
                    {t("compare.tokenizer")}
                  </th>
                  <td className="px-4 py-3 text-gray-700 text-xs">
                    {formatTokenizer(modelA.tokenizer)}
                  </td>
                  <td className="px-4 py-3 text-gray-700 text-xs">
                    {formatTokenizer(modelB.tokenizer)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Plain-English cost example */}
        <section aria-labelledby="example-heading" className="mb-12">
          <h2
            id="example-heading"
            className="text-lg font-semibold text-gray-900 mb-2"
          >
            {t("compare.realWorldExample")}
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            {t("compare.exampleDesc", {
              requests: EXAMPLE_REQUESTS.toLocaleString(dateLocale),
              inputTokens: String(EXAMPLE_INPUT_TOKENS),
              outputTokens: String(EXAMPLE_OUTPUT_TOKENS),
              totalInputK: String(totalInputTokens / 1_000),
              totalOutputK: String(totalOutputTokens / 1_000),
            })}
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="border border-gray-200 rounded-xl p-5 bg-white">
              <div className="text-sm font-medium text-gray-700 mb-1">
                {modelA.display_name}
              </div>
              <div className="text-2xl font-bold text-gray-900 font-mono mb-1">
                ${costA.toFixed(4)}
              </div>
              <div className="text-xs text-gray-500">
                {t("compare.inputLabel")} ${((totalInputTokens / 1_000_000) * modelA.input_cost_per_1m).toFixed(4)} +
                {t("compare.outputLabel")} ${((totalOutputTokens / 1_000_000) * modelA.output_cost_per_1m).toFixed(4)}
              </div>
            </div>
            <div className="border border-gray-200 rounded-xl p-5 bg-white">
              <div className="text-sm font-medium text-gray-700 mb-1">
                {modelB.display_name}
              </div>
              <div className="text-2xl font-bold text-gray-900 font-mono mb-1">
                ${costB.toFixed(4)}
              </div>
              <div className="text-xs text-gray-500">
                {t("compare.inputLabel")} ${((totalInputTokens / 1_000_000) * modelB.input_cost_per_1m).toFixed(4)} +
                {t("compare.outputLabel")} ${((totalOutputTokens / 1_000_000) * modelB.output_cost_per_1m).toFixed(4)}
              </div>
            </div>
          </div>
          {pricierCost > cheaperCost && (
            <p className="text-sm text-gray-700 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              {t("compare.cheaperSummary", {
                model: cheaperModel.display_name,
                pct: savings,
                saving: `$${(pricierCost - cheaperCost).toFixed(4)}`,
              })}
            </p>
          )}
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="mb-12">
          <h2
            id="faq-heading"
            className="text-lg font-semibold text-gray-900 mb-6"
          >
            {t("compare.faqHeading")}
          </h2>
          <dl className="space-y-6">
            <div>
              <dt className="font-medium text-gray-900 mb-1">
                {t("compare.faqCheaperQ", { modelA: modelA.display_name, modelB: modelB.display_name })}
              </dt>
              <dd className="text-gray-600 text-sm leading-relaxed">
                {costA < costB
                  ? t("compare.faqCheaperAYes", {
                      modelA: modelA.display_name,
                      modelB: modelB.display_name,
                      inputA: formatCost(modelA.input_cost_per_1m),
                      outputA: formatCost(modelA.output_cost_per_1m),
                      costA: `$${costA.toFixed(4)}`,
                      costB: `$${costB.toFixed(4)}`,
                      pct: savings,
                    })
                  : costB < costA
                  ? t("compare.faqCheaperANo", {
                      modelA: modelA.display_name,
                      modelB: modelB.display_name,
                      inputB: formatCost(modelB.input_cost_per_1m),
                      outputB: formatCost(modelB.output_cost_per_1m),
                      costA: `$${costA.toFixed(4)}`,
                      costB: `$${costB.toFixed(4)}`,
                      pct: savings,
                    })
                  : t("compare.faqCheaperAEqual", { cost: `$${costA.toFixed(4)}` })}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900 mb-1">
                {t("compare.faqContextQ", { modelA: modelA.display_name, modelB: modelB.display_name })}
              </dt>
              <dd className="text-gray-600 text-sm leading-relaxed">
                {t("compare.faqContextA", {
                  modelA: modelA.display_name,
                  modelB: modelB.display_name,
                  windowA: formatContextWindow(modelA.context_window),
                  windowB: formatContextWindow(modelB.context_window),
                })}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-gray-900 mb-1">
                {t("compare.faqCachingQ", { modelA: modelA.display_name, modelB: modelB.display_name })}
              </dt>
              <dd className="text-gray-600 text-sm leading-relaxed">
                {modelA.supports_context_caching
                  ? `${modelA.display_name} supports context caching${modelA.context_caching_discount !== null ? ` (${(modelA.context_caching_discount * 100).toFixed(0)}% off repeated tokens)` : ""}.`
                  : `${modelA.display_name} does not support context caching.`}{" "}
                {modelA.supports_batch_api && modelA.batch_api_discount !== null
                  ? `It offers a ${(modelA.batch_api_discount * 100).toFixed(0)}% Batch API discount.`
                  : `It does not offer a batch API discount.`}{" "}
                {modelB.supports_context_caching
                  ? `${modelB.display_name} supports context caching${modelB.context_caching_discount !== null ? ` (${(modelB.context_caching_discount * 100).toFixed(0)}% off repeated tokens)` : ""}.`
                  : `${modelB.display_name} does not support context caching.`}{" "}
                {modelB.supports_batch_api && modelB.batch_api_discount !== null
                  ? `It offers a ${(modelB.batch_api_discount * 100).toFixed(0)}% Batch API discount.`
                  : `It does not offer a batch API discount.`}
              </dd>
            </div>
          </dl>
        </section>

        {/* CTA */}
        <section
          aria-labelledby="cta-heading"
          className="border border-gray-200 rounded-xl p-6 sm:p-8 text-center mb-12 bg-gray-50"
        >
          <h2
            id="cta-heading"
            className="text-base font-semibold text-gray-900 mb-2"
          >
            {t("compare.ctaHeading")}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {t("compare.ctaBody")}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
          >
            {t("compare.openCalculator")}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </section>

        {/* Data provenance */}
        <footer className="text-xs text-gray-500 border-t border-gray-100 pt-6 space-y-1">
          <p>
            <strong className="font-medium text-gray-700">
              {t("compare.dataProvenance")}
            </strong>{" "}
            {t("compare.pricesSourced")}
          </p>
          <p>
            {t("compare.pricesLastVerified", { model: modelA.display_name })}{" "}
            <time dateTime={modelA.last_human_verified}>{lastVerifiedA}</time>{" "}
            from{" "}
            <a
              href={modelA.provider_pricing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700"
            >
              {t("compare.pricingPageLink", { provider: modelA.provider })}
            </a>
            .
          </p>
          <p>
            {t("compare.pricesLastVerified", { model: modelB.display_name })}{" "}
            <time dateTime={modelB.last_human_verified}>{lastVerifiedB}</time>{" "}
            from{" "}
            <a
              href={modelB.provider_pricing_url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-gray-700"
            >
              {t("compare.pricingPageLink", { provider: modelB.provider })}
            </a>
            .
          </p>
          <p className="pt-1">
            {t("compare.pricesDisclaimer")}
          </p>
        </footer>
      </div>
    </>
  );
}
