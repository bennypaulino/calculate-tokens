import type { Metadata } from "next";
import Link from "next/link";
import pricesData from "@/public/api/v1/prices.json";
import { t, getBaseUrl, getHreflangAlternates, getLocaleConfig, locale, canonicalUrl } from "@/lib/i18n";
import { FaqAccordion } from "../FaqAccordion";
import { resolveRates } from "@/lib/costCalc";

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
  pricing_note?: string;
  pricing_note_expires?: string;
  long_context?: {
    threshold_input_tokens: number;
    input_cost_per_1m: number;
    output_cost_per_1m: number;
  };
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
    "claude-new": "Anthropic tokenizer (Opus 4.7+)",
    gemini: "Gemini tokenizer",
    llama: "SentencePiece (Llama)",
    heuristic: "Heuristic (~chars/4)",
  };
  return map[tokenizer] ?? tokenizer;
}

function formatTokenThreshold(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}M`;
  if (tokens >= 1_000) return `${Math.round(tokens / 1_000)}K`;
  return String(tokens);
}

function isPricingNoteActive(model: Model): boolean {
  if (!model.pricing_note) return false;
  if (!model.pricing_note_expires) return true;
  return new Date(model.pricing_note_expires) > new Date();
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

function contextCapacityWords(tokens: number): string {
  const approxWords = Math.round((tokens * 3) / 4);
  if (approxWords >= 1_000_000) return `${(approxWords / 1_000_000).toFixed(1)}M words`;
  return `${Math.round(approxWords / 1_000)}K words`;
}

function contextCapacityPages(tokens: number): string {
  const approxPages = Math.round((tokens * 3) / (4 * 250));
  if (approxPages >= 1_000) return `~${Math.round(approxPages / 1_000)}K pages`;
  return `~${approxPages.toLocaleString()} pages`;
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
      url: canonicalUrl(`/compare/${slug}`),
      siteName: t("meta.siteName"),
      images: [
        {
          url: "/og/calculate-tokens-og.png",
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
      images: ["/og/calculate-tokens-og.png"],
    },
    alternates: {
      canonical: canonicalUrl(`/compare/${slug}`),
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
        <h1 className="text-2xl font-bold text-ct-strong mb-4">
          {t("compare.notFound")}
        </h1>
        <p className="text-ct-body mb-6">
          {t("compare.notFoundBody")}
        </p>
        <Link href="/compare" className="text-ct-accent hover:text-ct-accent-h">
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

  // Resolve against a SINGLE request's prompt (EXAMPLE_INPUT_TOKENS), not the
  // monthly aggregate -- the long-context threshold is per request. Going
  // through resolveRates rather than reading the rate fields directly means a
  // future threshold drop below 500 cannot silently leave these pages quoting
  // the cheaper standard rate.
  const ratesA = resolveRates(modelA, EXAMPLE_INPUT_TOKENS);
  const ratesB = resolveRates(modelB, EXAMPLE_INPUT_TOKENS);

  const costA =
    (totalInputTokens / 1_000_000) * ratesA.inputCostPer1m +
    (totalOutputTokens / 1_000_000) * ratesA.outputCostPer1m;
  const costB =
    (totalInputTokens / 1_000_000) * ratesB.inputCostPer1m +
    (totalOutputTokens / 1_000_000) * ratesB.outputCostPer1m;

  const cheaperModel = costA <= costB ? modelA : modelB;
  const cheaperCost = Math.min(costA, costB);
  const pricierCost = Math.max(costA, costB);
  const savings =
    pricierCost > 0
      ? (((pricierCost - cheaperCost) / pricierCost) * 100).toFixed(0)
      : "0";

  // The old copy asserted costs "scale linearly, so larger workloads amplify
  // this gap". That is false for tiered models: measured on
  // gemini-2-5-pro-vs-gpt-5-6-luna the gap runs 1.25x -> 2.50x -> 1.25x as the
  // prompt grows, because each model crosses its own threshold at a different
  // point. Only claim linear scaling when neither model is tiered.
  const tierA = modelA.long_context;
  const tierB = modelB.long_context;
  const scalingNote =
    tierA && tierB
      ? t("compare.faqCheaperALongContextBoth", {
          modelA: modelA.display_name,
          thresholdA: formatTokenThreshold(tierA.threshold_input_tokens),
          modelB: modelB.display_name,
          thresholdB: formatTokenThreshold(tierB.threshold_input_tokens),
        })
      : tierA
        ? t("compare.faqCheaperALongContextOne", {
            model: modelA.display_name,
            threshold: formatTokenThreshold(tierA.threshold_input_tokens),
          })
        : tierB
          ? t("compare.faqCheaperALongContextOne", {
              model: modelB.display_name,
              threshold: formatTokenThreshold(tierB.threshold_input_tokens),
            })
          : t("compare.faqCheaperAScaling");
  // Only add to the "B is cheaper" branch when it is a tier caveat; that branch
  // never carried the linear-scaling sentence.
  const scalingNoteIfTiered = tierA || tierB ? ` ${scalingNote}` : "";

  const lastVerifiedA = formatDate(modelA.last_human_verified);
  const lastVerifiedB = formatDate(modelB.last_human_verified);

  const sameTokenizer = modelA.tokenizer === modelB.tokenizer;

  // 80% output / 20% input scenario (per 1M total tokens billed)
  const outputHeavyCostA = 0.2 * modelA.input_cost_per_1m + 0.8 * modelA.output_cost_per_1m;
  const outputHeavyCostB = 0.2 * modelB.input_cost_per_1m + 0.8 * modelB.output_cost_per_1m;
  const outputHeavyCheaper = outputHeavyCostA <= outputHeavyCostB ? modelA : modelB;
  const outputHeavySavingsPct = outputHeavyCostA !== outputHeavyCostB
    ? Math.abs(((outputHeavyCostA - outputHeavyCostB) / Math.max(outputHeavyCostA, outputHeavyCostB)) * 100).toFixed(0)
    : "0";

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
                }) + " " + scalingNote
              : costB < costA
              ? t("compare.faqCheaperANo", {
                  modelA: modelA.display_name,
                  modelB: modelB.display_name,
                  inputB: formatCost(modelB.input_cost_per_1m),
                  outputB: formatCost(modelB.output_cost_per_1m),
                  costA: `$${costA.toFixed(4)}`,
                  costB: `$${costB.toFixed(4)}`,
                  pct: savings,
                }) + scalingNoteIfTiered
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
      {
        "@type": "Question",
        name: t("compare.faqTokenizerQ", { modelA: modelA.display_name, modelB: modelB.display_name }),
        acceptedAnswer: {
          "@type": "Answer",
          text: sameTokenizer
            ? `Yes, both ${modelA.display_name} and ${modelB.display_name} use the ${formatTokenizer(modelA.tokenizer)}. The same text produces identical token counts on both models, so any cost difference is purely due to the rate each provider charges per token.`
            : `No, they use different tokenizers. ${modelA.display_name} uses the ${formatTokenizer(modelA.tokenizer)}, while ${modelB.display_name} uses ${formatTokenizer(modelB.tokenizer)}. Different tokenizers split text differently, so the same prompt will produce different token counts on each model — the effective cost difference may be larger or smaller than the per-token price difference alone suggests.`,
        },
      },
      {
        "@type": "Question",
        name: t("compare.faqCostPerMillionQ", { modelA: modelA.display_name, modelB: modelB.display_name }),
        acceptedAnswer: {
          "@type": "Answer",
          text: `${modelA.display_name} (${modelA.provider}): $${modelA.input_cost_per_1m} input / $${modelA.output_cost_per_1m} output per 1M tokens. ${modelB.display_name} (${modelB.provider}): $${modelB.input_cost_per_1m} input / $${modelB.output_cost_per_1m} output per 1M tokens. Rates shown before caching or batch discounts.`,
        },
      },
      {
        "@type": "Question",
        name: t("compare.faqOutputHeavyQ", { modelA: modelA.display_name, modelB: modelB.display_name }),
        acceptedAnswer: {
          "@type": "Answer",
          text: outputHeavyCostA === outputHeavyCostB
            ? `Both models cost the same for an 80% output / 20% input workload: $${outputHeavyCostA.toFixed(4)} per 1M total tokens billed.`
            : `For an 80% output / 20% input workload (typical for code generation or long-form writing), ${modelA.display_name} costs $${outputHeavyCostA.toFixed(4)} per 1M total tokens and ${modelB.display_name} costs $${outputHeavyCostB.toFixed(4)}. ${outputHeavyCheaper.display_name} is ${outputHeavySavingsPct}% cheaper for this pattern. For your exact ratio, use the calculator to get a precise breakdown.`,
        },
      },
      {
        "@type": "Question",
        name: t("compare.faqContextCapacityQ", { modelA: modelA.display_name, modelB: modelB.display_name }),
        acceptedAnswer: {
          "@type": "Answer",
          text: `${modelA.display_name} has a ${formatContextWindow(modelA.context_window)}-token context window — approximately ${contextCapacityWords(modelA.context_window)} or ${contextCapacityPages(modelA.context_window)} of standard text. ${modelB.display_name} has a ${formatContextWindow(modelB.context_window)}-token context window — approximately ${contextCapacityWords(modelB.context_window)} or ${contextCapacityPages(modelB.context_window)}. Estimates assume roughly 0.75 words per token.`,
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 text-ct-body">
        {/* Back link */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link
            href="/compare"
            className="text-sm text-ct-accent hover:text-ct-accent-h transition-colors inline-flex items-center gap-1"
          >
            <span aria-hidden="true">&larr;</span>
            {t("compare.allComparisons")}
          </Link>
        </nav>

        {/* H1 */}
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ct-strong mb-3 leading-tight">
          {modelA.display_name} vs {modelB.display_name} — {t("compare.sideBySidePricing")}
        </h1>
        <p className="text-ct-body mb-10 text-base">
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
            className="text-lg font-semibold text-ct-strong mb-4"
          >
            {t("compare.sideBySidePricing")}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-ct-border" style={{ background: 'var(--surface-card)' }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ct-border" style={{ background: 'var(--surface-sunken)' }}>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 font-medium text-ct-muted w-40"
                  >
                    {t("compare.featureCol")}
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 font-semibold text-ct-strong"
                  >
                    {modelA.display_name}
                  </th>
                  <th
                    scope="col"
                    className="text-left px-4 py-3 font-semibold text-ct-strong"
                  >
                    {modelB.display_name}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ct-border-subtle">
                <tr>
                  <th
                    scope="row"
                    className="px-4 py-3 font-medium text-ct-muted text-left"
                    style={{ background: 'var(--surface-sunken)' }}
                  >
                    {t("compare.provider")}
                  </th>
                  <td className="px-4 py-3 text-ct-body">{modelA.provider}</td>
                  <td className="px-4 py-3 text-ct-body">{modelB.provider}</td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-4 py-3 font-medium text-ct-muted text-left"
                    style={{ background: 'var(--surface-sunken)' }}
                  >
                    {t("compare.inputPer1M")}
                  </th>
                  <td
                    className="px-4 py-3 text-ct-strong font-mono"
                    data-model={modelA.id}
                    data-price-input={modelA.input_cost_per_1m}
                    data-price-output={modelA.output_cost_per_1m}
                  >
                    {formatCost(modelA.input_cost_per_1m)}
                  </td>
                  <td
                    className="px-4 py-3 text-ct-strong font-mono"
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
                    className="px-4 py-3 font-medium text-ct-muted text-left"
                    style={{ background: 'var(--surface-sunken)' }}
                  >
                    {t("compare.outputPer1M")}
                  </th>
                  <td className="px-4 py-3 text-ct-strong font-mono">
                    {formatCost(modelA.output_cost_per_1m)}
                  </td>
                  <td className="px-4 py-3 text-ct-strong font-mono">
                    {formatCost(modelB.output_cost_per_1m)}
                  </td>
                </tr>
                {(modelA.long_context || modelB.long_context) && (
                  <tr>
                    <th
                      scope="row"
                      className="px-4 py-3 font-medium text-ct-muted text-left"
                      style={{ background: 'var(--surface-sunken)' }}
                    >
                      {t("compare.longContext")}
                    </th>
                    <td className="px-4 py-3 text-ct-body">
                      {modelA.long_context
                        ? t("compare.longContextRates", {
                            threshold: formatTokenThreshold(modelA.long_context.threshold_input_tokens),
                            inputCost: formatCost(modelA.long_context.input_cost_per_1m),
                            outputCost: formatCost(modelA.long_context.output_cost_per_1m),
                          })
                        : t("compare.longContextNone")}
                    </td>
                    <td className="px-4 py-3 text-ct-body">
                      {modelB.long_context
                        ? t("compare.longContextRates", {
                            threshold: formatTokenThreshold(modelB.long_context.threshold_input_tokens),
                            inputCost: formatCost(modelB.long_context.input_cost_per_1m),
                            outputCost: formatCost(modelB.long_context.output_cost_per_1m),
                          })
                        : t("compare.longContextNone")}
                    </td>
                  </tr>
                )}
                <tr>
                  <th
                    scope="row"
                    className="px-4 py-3 font-medium text-ct-muted text-left"
                    style={{ background: 'var(--surface-sunken)' }}
                  >
                    {t("compare.contextCaching")}
                  </th>
                  <td className="px-4 py-3 text-ct-body">
                    {modelA.supports_context_caching
                      ? modelA.context_caching_discount !== null
                        ? t("compare.cachingYesDiscount", { pct: String((modelA.context_caching_discount * 100).toFixed(0)) })
                        : t("compare.cachingYes")
                      : t("compare.cachingNo")}
                  </td>
                  <td className="px-4 py-3 text-ct-body">
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
                    className="px-4 py-3 font-medium text-ct-muted text-left"
                    style={{ background: 'var(--surface-sunken)' }}
                  >
                    {t("compare.batchApiDiscount")}
                  </th>
                  <td className="px-4 py-3 text-ct-body">
                    {modelA.supports_batch_api && modelA.batch_api_discount !== null
                      ? t("compare.batchOff", { pct: String((modelA.batch_api_discount * 100).toFixed(0)) })
                      : t("compare.batchNotAvailable")}
                  </td>
                  <td className="px-4 py-3 text-ct-body">
                    {modelB.supports_batch_api && modelB.batch_api_discount !== null
                      ? t("compare.batchOff", { pct: String((modelB.batch_api_discount * 100).toFixed(0)) })
                      : t("compare.batchNotAvailable")}
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-4 py-3 font-medium text-ct-muted text-left"
                    style={{ background: 'var(--surface-sunken)' }}
                  >
                    {t("compare.contextWindow")}
                  </th>
                  <td className="px-4 py-3 text-ct-strong font-mono">
                    {t("compare.contextTokens", { count: formatContextWindow(modelA.context_window) })}
                  </td>
                  <td className="px-4 py-3 text-ct-strong font-mono">
                    {t("compare.contextTokens", { count: formatContextWindow(modelB.context_window) })}
                  </td>
                </tr>
                <tr>
                  <th
                    scope="row"
                    className="px-4 py-3 font-medium text-ct-muted text-left"
                    style={{ background: 'var(--surface-sunken)' }}
                  >
                    {t("compare.tokenizer")}
                  </th>
                  <td className="px-4 py-3 text-ct-body text-xs">
                    {formatTokenizer(modelA.tokenizer)}
                  </td>
                  <td className="px-4 py-3 text-ct-body text-xs">
                    {formatTokenizer(modelB.tokenizer)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          {(isPricingNoteActive(modelA) || isPricingNoteActive(modelB)) && (
            <div className="mt-3 space-y-1">
              {isPricingNoteActive(modelA) && (
                <p className="text-xs text-ct-muted">
                  <span className="text-ct-accent font-medium">ⓘ {modelA.display_name}:</span>{" "}
                  {modelA.pricing_note}
                </p>
              )}
              {isPricingNoteActive(modelB) && (
                <p className="text-xs text-ct-muted">
                  <span className="text-ct-accent font-medium">ⓘ {modelB.display_name}:</span>{" "}
                  {modelB.pricing_note}
                </p>
              )}
            </div>
          )}
        </section>

        {/* Plain-English cost example */}
        <section aria-labelledby="example-heading" className="mb-12">
          <h2
            id="example-heading"
            className="text-lg font-semibold text-ct-strong mb-2"
          >
            {t("compare.realWorldExample")}
          </h2>
          <p className="text-ct-body text-sm mb-6">
            {t("compare.exampleDesc", {
              requests: EXAMPLE_REQUESTS.toLocaleString(dateLocale),
              inputTokens: String(EXAMPLE_INPUT_TOKENS),
              outputTokens: String(EXAMPLE_OUTPUT_TOKENS),
              totalInputK: String(totalInputTokens / 1_000),
              totalOutputK: String(totalOutputTokens / 1_000),
            })}
          </p>
          <div className="grid sm:grid-cols-2 gap-4 mb-6">
            <div className="border border-ct-border rounded-xl p-5 bg-ct-card">
              <div className="text-sm font-medium text-ct-body mb-1">
                {modelA.display_name}
              </div>
              <div className="text-2xl font-bold text-ct-strong font-mono mb-1">
                ${costA.toFixed(4)}
              </div>
              <div className="text-xs text-ct-muted">
                {t("compare.inputLabel")} ${((totalInputTokens / 1_000_000) * modelA.input_cost_per_1m).toFixed(4)} +
                {t("compare.outputLabel")} ${((totalOutputTokens / 1_000_000) * modelA.output_cost_per_1m).toFixed(4)}
              </div>
            </div>
            <div className="border border-ct-border rounded-xl p-5 bg-ct-card">
              <div className="text-sm font-medium text-ct-body mb-1">
                {modelB.display_name}
              </div>
              <div className="text-2xl font-bold text-ct-strong font-mono mb-1">
                ${costB.toFixed(4)}
              </div>
              <div className="text-xs text-ct-muted">
                {t("compare.inputLabel")} ${((totalInputTokens / 1_000_000) * modelB.input_cost_per_1m).toFixed(4)} +
                {t("compare.outputLabel")} ${((totalOutputTokens / 1_000_000) * modelB.output_cost_per_1m).toFixed(4)}
              </div>
            </div>
          </div>
          {pricierCost > cheaperCost && (
            <p className="text-sm text-ct-body rounded-lg px-4 py-3 border border-ct-border" style={{ background: 'var(--accent-tint)' }}>
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
            className="text-lg font-semibold text-ct-strong mb-6"
          >
            {t("compare.faqHeading")}
          </h2>
          <FaqAccordion
            items={[
              {
                question: t("compare.faqCheaperQ", { modelA: modelA.display_name, modelB: modelB.display_name }),
                answer: costA < costB
                  ? t("compare.faqCheaperAYes", {
                      modelA: modelA.display_name,
                      modelB: modelB.display_name,
                      inputA: formatCost(modelA.input_cost_per_1m),
                      outputA: formatCost(modelA.output_cost_per_1m),
                      costA: `$${costA.toFixed(4)}`,
                      costB: `$${costB.toFixed(4)}`,
                      pct: savings,
                    }) + " " + scalingNote
                  : costB < costA
                  ? t("compare.faqCheaperANo", {
                      modelA: modelA.display_name,
                      modelB: modelB.display_name,
                      inputB: formatCost(modelB.input_cost_per_1m),
                      outputB: formatCost(modelB.output_cost_per_1m),
                      costA: `$${costA.toFixed(4)}`,
                      costB: `$${costB.toFixed(4)}`,
                      pct: savings,
                    }) + scalingNoteIfTiered
                  : t("compare.faqCheaperAEqual", { cost: `$${costA.toFixed(4)}` }),
              },
              {
                question: t("compare.faqContextQ", { modelA: modelA.display_name, modelB: modelB.display_name }),
                answer: t("compare.faqContextA", {
                  modelA: modelA.display_name,
                  modelB: modelB.display_name,
                  windowA: formatContextWindow(modelA.context_window),
                  windowB: formatContextWindow(modelB.context_window),
                }),
              },
              {
                question: t("compare.faqCachingQ", { modelA: modelA.display_name, modelB: modelB.display_name }),
                answer: [
                  modelA.supports_context_caching
                    ? `${modelA.display_name} supports context caching${modelA.context_caching_discount !== null ? ` (${(modelA.context_caching_discount * 100).toFixed(0)}% off repeated tokens)` : ""}.`
                    : `${modelA.display_name} does not support context caching.`,
                  modelA.supports_batch_api && modelA.batch_api_discount !== null
                    ? ` It offers a ${(modelA.batch_api_discount * 100).toFixed(0)}% Batch API discount.`
                    : ` It does not offer a batch API discount.`,
                  modelB.supports_context_caching
                    ? ` ${modelB.display_name} supports context caching${modelB.context_caching_discount !== null ? ` (${(modelB.context_caching_discount * 100).toFixed(0)}% off repeated tokens)` : ""}.`
                    : ` ${modelB.display_name} does not support context caching.`,
                  modelB.supports_batch_api && modelB.batch_api_discount !== null
                    ? ` It offers a ${(modelB.batch_api_discount * 100).toFixed(0)}% Batch API discount.`
                    : ` It does not offer a batch API discount.`,
                ].join(''),
              },
              {
                question: t("compare.faqTokenizerQ", { modelA: modelA.display_name, modelB: modelB.display_name }),
                answer: sameTokenizer
                  ? `Yes, both ${modelA.display_name} and ${modelB.display_name} use the ${formatTokenizer(modelA.tokenizer)}. The same text produces identical token counts on both models, so any cost difference is purely due to the rate each provider charges per token.`
                  : `No, they use different tokenizers. ${modelA.display_name} uses the ${formatTokenizer(modelA.tokenizer)}, while ${modelB.display_name} uses ${formatTokenizer(modelB.tokenizer)}. Different tokenizers split text differently, so the same prompt will produce different token counts on each model — the effective cost difference may be larger or smaller than the per-token price difference alone suggests.`,
              },
              {
                question: t("compare.faqCostPerMillionQ", { modelA: modelA.display_name, modelB: modelB.display_name }),
                answer: (
                  <span>
                    <span className="font-medium">{modelA.display_name}</span>{" "}
                    ({modelA.provider}):{" "}
                    <span className="font-mono">${modelA.input_cost_per_1m}</span> input /{" "}
                    <span className="font-mono">${modelA.output_cost_per_1m}</span> output per 1M tokens.{" "}
                    <span className="font-medium">{modelB.display_name}</span>{" "}
                    ({modelB.provider}):{" "}
                    <span className="font-mono">${modelB.input_cost_per_1m}</span> input /{" "}
                    <span className="font-mono">${modelB.output_cost_per_1m}</span> output per 1M tokens.{" "}
                    Rates shown before caching or batch discounts.
                  </span>
                ),
              },
              {
                question: t("compare.faqOutputHeavyQ", { modelA: modelA.display_name, modelB: modelB.display_name }),
                answer: (
                  <span>
                    {outputHeavyCostA === outputHeavyCostB
                      ? `Both models cost the same for an 80% output / 20% input workload: $${outputHeavyCostA.toFixed(4)} per 1M total tokens.`
                      : `For an 80% output / 20% input workload — typical for code generation or long-form writing — ${modelA.display_name} costs $${outputHeavyCostA.toFixed(4)} per 1M total tokens and ${modelB.display_name} costs $${outputHeavyCostB.toFixed(4)}. ${outputHeavyCheaper.display_name} is ${outputHeavySavingsPct}% cheaper for this pattern.`}{" "}
                    For your exact ratio, paste a real prompt into the{" "}
                    <Link href="/" className="text-ct-accent hover:underline">calculator above</Link>.
                  </span>
                ),
              },
              {
                question: t("compare.faqContextCapacityQ", { modelA: modelA.display_name, modelB: modelB.display_name }),
                answer: `${modelA.display_name} has a ${formatContextWindow(modelA.context_window)}-token context window — approximately ${contextCapacityWords(modelA.context_window)} or ${contextCapacityPages(modelA.context_window)} of standard text. ${modelB.display_name} has a ${formatContextWindow(modelB.context_window)}-token context window — approximately ${contextCapacityWords(modelB.context_window)} or ${contextCapacityPages(modelB.context_window)}. (Estimates assume ~0.75 words per token.)`,
              },
            ]}
          />
        </section>

        {/* CTA */}
        <section
          aria-labelledby="cta-heading"
          className="border border-ct-border rounded-xl p-6 sm:p-8 text-center mb-12 bg-ct-card"
        >
          <h2
            id="cta-heading"
            className="text-base font-semibold text-ct-strong mb-2"
          >
            {t("compare.ctaHeading")}
          </h2>
          <p className="text-sm text-ct-body mb-4">
            {t("compare.ctaBody")}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 bg-ct-accent text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-ct-accent-h transition-colors"
            style={{ color: '#1a1205' }}
          >
            {t("compare.openCalculator")}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </section>

        {/* Data provenance */}
        <footer className="text-xs text-ct-subtle border-t border-ct-border-subtle pt-6 space-y-1">
          <p>
            <strong className="font-medium text-ct-body">
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
              className="underline text-ct-accent hover:text-ct-accent-h"
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
              className="underline text-ct-accent hover:text-ct-accent-h"
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
