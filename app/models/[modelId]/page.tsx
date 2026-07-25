import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import pricesData from "@/public/api/v1/prices.json";
import { resolveRates } from "@/lib/costCalc";
import { t, getBaseUrl, getHreflangAlternates, getLocaleConfig, locale, canonicalUrl } from "@/lib/i18n";

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
  last_human_verified: string;
  active: boolean;
  requires_js_render?: boolean;
  pricing_note?: string;
  pricing_note_expires?: string;
  long_context?: {
    threshold_input_tokens: number;
    input_cost_per_1m: number;
    output_cost_per_1m: number;
  };
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

function formatTokenThreshold(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return String(tokens);
}

function computeMonthlyCost(model: Model): string {
  const requests = 1_000;
  const inputTokens = 500;
  const outputTokens = 200;
  // Per-request prompt size drives the tier, not requests * inputTokens.
  const rates = resolveRates(model, inputTokens);
  const inputCost = (requests * inputTokens * rates.inputCostPer1m) / 1_000_000;
  const outputCost = (requests * outputTokens * rates.outputCostPer1m) / 1_000_000;
  const total = inputCost + outputCost;
  return total < 0.01 ? `$${total.toFixed(4)}` : `$${total.toFixed(2)}`;
}

function getTokenizerLabel(tokenizer: string): string {
  const labels: Record<string, string> = {
    cl100k_base: "cl100k_base (GPT-3.5/4 family)",
    o200k_base: "o200k_base (GPT-4o / o-series)",
    claude: "Anthropic Claude tokenizer",
    "claude-new": "Anthropic tokenizer (Opus 4.7+ / Sonnet 5)",
    gemini: "Gemini tokenizer",
    llama: "SentencePiece (Llama family)",
    heuristic: "Heuristic (~4 chars/token)",
  };
  return labels[tokenizer] ?? tokenizer;
}

function isPricingNoteActive(model: Model): boolean {
  if (!model.pricing_note) return false;
  if (!model.pricing_note_expires) return true;
  return new Date(model.pricing_note_expires) > new Date();
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
      canonical: canonicalUrl(`/models/${modelId}`),
      languages: getHreflangAlternates(`/models/${modelId}`),
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl(`/models/${modelId}`),
      siteName: t("meta.siteName"),
      images: [
        {
          url: "/og/calculate-tokens-og.png",
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
      images: ["/og/calculate-tokens-og.png"],
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

  // Per-1M unit prices. `Offer.price` alone could only ever carry ONE number,
  // so it advertised the input rate and silently omitted output -- which
  // usually dominates real spend. priceSpecification is the schema.org
  // primitive for "priced per unit of something", and it is additive: `price`
  // is retained as the lowest rate a caller can pay, so any consumer reading
  // only that keeps working.
  const unitPrice = (name: string, price: number, minTokens?: number) => ({
    "@type": "UnitPriceSpecification",
    name,
    price: String(price),
    priceCurrency: "USD",
    referenceQuantity: {
      "@type": "QuantitativeValue",
      value: 1000000,
      unitText: "tokens",
    },
    ...(minTokens
      ? {
          eligibleQuantity: {
            "@type": "QuantitativeValue",
            minValue: minTokens,
            unitText: "tokens",
          },
        }
      : {}),
  });

  const lc = model.long_context;
  const priceSpecification = [
    unitPrice("Input tokens", model.input_cost_per_1m),
    unitPrice("Output tokens", model.output_cost_per_1m),
    ...(lc
      ? [
          unitPrice("Input tokens (long context)", lc.input_cost_per_1m, lc.threshold_input_tokens + 1),
          unitPrice("Output tokens (long context)", lc.output_cost_per_1m, lc.threshold_input_tokens + 1),
        ]
      : []),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: model.display_name,
    applicationCategory: "AI Language Model",
    operatingSystem: "Web",
    // canonicalUrl() adds the trailing slash; the bare form 308-redirects and
    // disagreed with the page's own canonical.
    url: canonicalUrl(`/models/${model.id}`),
    offers: {
      "@type": "Offer",
      // Retained for consumers that read only `price`: the lowest per-1M rate.
      price: String(model.input_cost_per_1m),
      priceCurrency: "USD",
      description: lc
        ? `From $${model.input_cost_per_1m} per 1M input tokens (prompts up to ${lc.threshold_input_tokens.toLocaleString("en-US")} tokens)`
        : "From $" + model.input_cost_per_1m + " per 1M input tokens",
      priceSpecification,
    },
    description:
      `${model.display_name} by ${model.provider}. API pricing: $${model.input_cost_per_1m} per 1M input tokens, $${model.output_cost_per_1m} per 1M output tokens.` +
      (lc
        ? ` Prompts over ${lc.threshold_input_tokens.toLocaleString("en-US")} tokens are billed at $${lc.input_cost_per_1m} input / $${lc.output_cost_per_1m} output per 1M.`
        : "") +
      ` Context window: ${formatContextWindow(model.context_window)}.`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Breadcrumb */}
        <nav className="text-sm text-ct-muted mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-ct-strong transition-colors">
                {t("models.breadcrumbHome")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/models" className="hover:text-ct-strong transition-colors">
                {t("models.breadcrumbModels")}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li className="text-ct-strong font-medium" aria-current="page">
              {model.display_name}
            </li>
          </ol>
        </nav>

        {/* H1 */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ct-strong mb-3">
          {t("models.pageTitle", { model: model.display_name })}
        </h1>
        <p className="text-ct-body mb-10">
          {t("models.pageSubheading", { model: model.display_name, provider: model.provider })}
        </p>

        {/* Pricing table */}
        <section aria-labelledby="pricing-table-heading" className="mb-10">
          <h2
            id="pricing-table-heading"
            className="text-xl font-semibold text-ct-strong mb-4"
          >
            {t("models.pricingDetails")}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-ct-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ct-sunken border-b border-ct-border">
                  <th className="text-left px-4 py-3 font-semibold text-ct-body w-1/2">
                    {t("models.attrAttribute")}
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-ct-body w-1/2">
                    {t("models.attrValue")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ct-border-subtle">
                <tr>
                  <td className="px-4 py-3 text-ct-body">{t("models.attrProvider")}</td>
                  <td className="px-4 py-3 font-medium text-ct-strong">
                    {model.provider}
                  </td>
                </tr>
                <tr className="bg-ct-raised/20">
                  <td className="px-4 py-3 text-ct-body">
                    {t("models.attrInputCost")}
                  </td>
                  <td className="px-4 py-3 font-medium text-ct-strong">
                    {formatCost(model.input_cost_per_1m)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-ct-body">
                    {t("models.attrOutputCost")}
                  </td>
                  <td className="px-4 py-3 font-medium text-ct-strong">
                    {formatCost(model.output_cost_per_1m)}
                  </td>
                </tr>
                {model.long_context && (
                  <tr>
                    <td className="px-4 py-3 text-ct-body">
                      {t("models.attrLongContext", {
                        threshold: formatTokenThreshold(model.long_context.threshold_input_tokens),
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-ct-strong">
                      {t("models.longContextRates", {
                        inputCost: formatCost(model.long_context.input_cost_per_1m),
                        outputCost: formatCost(model.long_context.output_cost_per_1m),
                      })}
                    </td>
                  </tr>
                )}
                <tr className="bg-ct-raised/20">
                  <td className="px-4 py-3 text-ct-body">{t("models.attrContextCaching")}</td>
                  <td className="px-4 py-3 font-medium text-ct-strong">
                    {model.supports_context_caching && model.context_caching_discount != null
                      ? t("models.cachingYesDiscount", { pct: String(Math.round(model.context_caching_discount * 100)) })
                      : t("models.cachingNotSupported")}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-ct-body">{t("models.attrBatchDiscount")}</td>
                  <td className="px-4 py-3 font-medium text-ct-strong">
                    {model.supports_batch_api && model.batch_api_discount != null
                      ? t("models.batchOff", { pct: String(Math.round(model.batch_api_discount * 100)) })
                      : t("models.batchNotAvailable")}
                  </td>
                </tr>
                <tr className="bg-ct-raised/20">
                  <td className="px-4 py-3 text-ct-body">{t("models.attrContextWindow")}</td>
                  <td className="px-4 py-3 font-medium text-ct-strong">
                    {formatContextWindow(model.context_window)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-ct-body">{t("models.attrTokenizer")}</td>
                  <td className="px-4 py-3 font-medium text-ct-strong">
                    {getTokenizerLabel(model.tokenizer)}
                  </td>
                </tr>
                {model.thinking_model && (
                  <tr className="bg-ct-raised/20">
                    <td className="px-4 py-3 text-ct-body">{t("models.attrThinking")}</td>
                    <td className="px-4 py-3 font-medium text-ct-strong">
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

        {/* Introductory / promotional pricing note */}
        {isPricingNoteActive(model) && (
          <div
            className="mb-6 px-4 py-3 rounded-lg text-xs border"
            style={{ background: 'var(--accent-tint)', borderColor: 'var(--accent-line)' }}
          >
            <span className="font-semibold text-ct-accent">ⓘ Introductory pricing: </span>
            <span className="text-ct-body">{model.pricing_note}</span>
          </div>
        )}

        {/* Plain-English cost example */}
        <section
          aria-labelledby="cost-example-heading"
          className="mb-10 rounded-xl px-6 py-5 border"
          style={{ background: 'var(--accent-tint)', borderColor: 'var(--accent-line)' }}
        >
          <h2
            id="cost-example-heading"
            className="text-base font-semibold text-ct-accent mb-2"
          >
            {t("models.costExampleHeading")}
          </h2>
          <p className="text-ct-body text-sm leading-relaxed">
            {t("models.costExampleBody", { cost: monthlyCost, model: model.display_name, provider: model.provider })}
          </p>
          <p className="text-ct-muted text-xs mt-2">
            {t("models.costExampleRates", { inputCost: String(model.input_cost_per_1m), outputCost: String(model.output_cost_per_1m) })}
          </p>
        </section>

        {/* CTA */}
        <section className="mb-10">
          <Link
            href={`/?models=${model.id}`}
            className="inline-flex items-center gap-2 bg-ct-accent text-sm font-semibold px-5 py-3 rounded-lg hover:bg-ct-accent-h transition-colors"
            style={{ color: '#1a1205' }}
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
              className="text-xl font-semibold text-ct-strong mb-4"
            >
              {t("models.compareWith", { model: model.display_name })}
            </h2>
            <ul className="grid sm:grid-cols-2 gap-3">
              {comparisons.map(({ slug, otherName }) => (
                <li key={slug}>
                  <Link
                    href={slug}
                    className="flex items-center justify-between border border-ct-border rounded-lg px-4 py-3 text-sm text-ct-body hover:border-ct-accent hover:text-ct-strong transition-colors bg-ct-card"
                  >
                    <span>
                      <span className="font-medium">{model.display_name}</span>
                      <span className="text-ct-subtle mx-2">{t("models.vs")}</span>
                      <span className="font-medium">{otherName}</span>
                    </span>
                    <span className="text-ct-subtle" aria-hidden="true">
                      &rarr;
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Data provenance footer */}
        <footer className="border-t border-ct-border-subtle pt-6 text-xs text-ct-muted space-y-1">
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
              className="underline hover:text-ct-body transition-colors"
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
