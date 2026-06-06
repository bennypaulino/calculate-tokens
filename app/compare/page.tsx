import type { Metadata } from "next";
import Link from "next/link";
import pricesData from "@/public/api/v1/prices.json";

interface Model {
  id: string;
  display_name: string;
  provider: string;
  active?: boolean;
}

export const metadata: Metadata = {
  title: "LLM Model Comparisons — Pricing & Token Cost — Calculate Tokens",
  description:
    "Side-by-side pricing and token cost comparisons for GPT-4o, Claude, Gemini, Llama, DeepSeek and more. See exact API costs and tokenizer details.",
  alternates: {
    canonical: "https://calculatetokens.com/compare",
  },
};

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
          className="text-sm text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
        >
          <span aria-hidden="true">&larr;</span>
          Calculator
        </Link>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-3">
        LLM Model Comparisons
      </h1>
      <p className="text-gray-600 mb-10 text-base">
        Side-by-side pricing, context window, and tokenizer comparisons across{" "}
        {activeModels.length} models. {pairs.length} unique comparisons.
      </p>

      <div className="space-y-10">
        {sortedProviders.map((provider) => (
          <section key={provider} aria-labelledby={`group-${provider}`}>
            <h2
              id={`group-${provider}`}
              className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3"
            >
              {provider} comparisons
            </h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {grouped[provider].map((pair) => (
                <li key={`${pair.slugA}-vs-${pair.slugB}`}>
                  <Link
                    href={`/compare/${pair.slugA}-vs-${pair.slugB}`}
                    className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors bg-white"
                  >
                    <span>
                      <span className="font-medium">{pair.nameA}</span>
                      <span className="text-gray-400 mx-2">vs</span>
                      <span className="font-medium">{pair.nameB}</span>
                    </span>
                    <span className="text-gray-400 ml-2 shrink-0" aria-hidden="true">
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
      <div className="mt-12 border border-gray-200 rounded-xl p-6 text-center bg-gray-50">
        <p className="text-sm text-gray-600 mb-3">
          Want to calculate costs for your specific prompt?
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Open calculator
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
