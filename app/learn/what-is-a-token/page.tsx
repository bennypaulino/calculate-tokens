import type { Metadata } from "next";
import Link from "next/link";
import pricesData from "@/public/api/v1/prices.json";

export const metadata: Metadata = {
  title: "What is a Token in AI? A Complete Guide",
  description:
    "Tokens are the units AI models use to process text. Learn how tokens work, how they're counted, and what they cost across different AI models.",
  alternates: {
    canonical: "https://calculatetokens.com/learn/what-is-a-token",
  },
  openGraph: {
    title: "What is a Token in AI? A Complete Guide",
    description:
      "Tokens are the units AI models use to process text. Learn how tokens work, how they're counted, and what they cost across different AI models.",
    url: "https://calculatetokens.com/learn/what-is-a-token",
    siteName: "Calculate Tokens",
    images: [
      {
        url: "/og/calculate-tokens-og.png",
        width: 1200,
        height: 630,
        alt: "Calculate Tokens — LLM Token Calculator & Cost Estimator",
      },
    ],
    locale: "en_US",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "What is a Token in AI? A Complete Guide",
    description:
      "Tokens are the units AI models use to process text. Learn how tokens work, how they're counted, and what they cost across different AI models.",
    images: ["/og/calculate-tokens-og.png"],
  },
};

const tokenizerLabels: Record<string, string> = {
  cl100k_base: "cl100k_base (tiktoken)",
  o200k_base: "o200k_base (tiktoken)",
  claude: "Anthropic tokenizer",
  gemini: "Gemini tokenizer",
  llama: "SentencePiece (LLaMA)",
  heuristic: "Heuristic (~chars ÷ 4)",
};

function formatContextWindow(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString()}M`;
  if (n >= 1_000) return `${(n / 1_000).toLocaleString()}K`;
  return n.toLocaleString();
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "What is a Token in AI? A Complete Guide",
  description:
    "Tokens are the units AI models use to process text. Learn how tokens work, how they're counted, and what they cost across different AI models.",
  url: "https://calculatetokens.com/learn/what-is-a-token",
  datePublished: "2026-06-06",
  dateModified: "2026-06-06",
  author: {
    "@type": "Organization",
    name: "Calculate Tokens",
    url: "https://calculatetokens.com",
  },
  publisher: {
    "@type": "Organization",
    name: "Calculate Tokens",
    url: "https://calculatetokens.com",
  },
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://calculatetokens.com/learn/what-is-a-token",
  },
};

export default function WhatIsATokenPage() {
  const activeModels = pricesData.models.filter((m) => m.active);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        <header className="mb-10">
          <p className="text-sm font-medium text-ct-accent uppercase tracking-wider mb-2">
            Learn
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-ct-strong leading-tight mb-4">
            What is a token in AI?
          </h1>
          <p className="text-lg text-ct-body leading-relaxed">
            Tokens are the fundamental unit of text in large language models.
            Understanding them helps you write better prompts, control costs,
            and avoid hitting context limits.
          </p>
        </header>

        <nav className="mb-10 p-4 bg-ct-sunken rounded-lg border border-ct-border">
          <p className="text-xs font-semibold text-ct-muted uppercase tracking-wider mb-3">
            On this page
          </p>
          <ol className="space-y-1 text-sm">
            <li>
              <a href="#what-is-a-token" className="text-ct-accent hover:text-ct-accent-h hover:underline">
                1. What is a token in AI?
              </a>
            </li>
            <li>
              <a href="#how-are-tokens-counted" className="text-ct-accent hover:text-ct-accent-h hover:underline">
                2. How are tokens counted? (with examples)
              </a>
            </li>
            <li>
              <a href="#why-do-tokens-cost-money" className="text-ct-accent hover:text-ct-accent-h hover:underline">
                3. Why do tokens cost money?
              </a>
            </li>
            <li>
              <a href="#how-many-tokens" className="text-ct-accent hover:text-ct-accent-h hover:underline">
                4. How many tokens is my text?
              </a>
            </li>
            <li>
              <a href="#token-limits-by-model" className="text-ct-accent hover:text-ct-accent-h hover:underline">
                5. Token limits by model
              </a>
            </li>
            <li>
              <a href="#token-cost-calculator" className="text-ct-accent hover:text-ct-accent-h hover:underline">
                6. Token cost calculator
              </a>
            </li>
          </ol>
        </nav>

        <section id="what-is-a-token" className="mb-12 scroll-mt-6">
          <h2 className="text-2xl font-bold text-ct-strong mb-4">
            What is a token in AI?
          </h2>
          <p className="text-ct-body leading-relaxed mb-4">
            A <strong>token</strong> is a chunk of text that an AI language
            model reads and generates one piece at a time. Tokens are not the
            same as words, characters, or syllables — they are sub-word units
            determined by the model&apos;s tokenizer, a vocabulary of roughly
            50,000–200,000 common fragments learned during training.
          </p>
          <p className="text-ct-body leading-relaxed mb-4">
            For most English text, one token is roughly four characters or
            three-quarters of a word. Common words like{" "}
            <code className="bg-ct-control px-1 py-0.5 rounded text-sm font-mono">the</code>,{" "}
            <code className="bg-ct-control px-1 py-0.5 rounded text-sm font-mono">is</code>, and{" "}
            <code className="bg-ct-control px-1 py-0.5 rounded text-sm font-mono">and</code>{" "}
            are each a single token. Longer or rarer words split into multiple
            tokens:{" "}
            <code className="bg-ct-control px-1 py-0.5 rounded text-sm font-mono">tokenization</code>{" "}
            becomes{" "}
            <code className="bg-ct-control px-1 py-0.5 rounded text-sm font-mono">token</code>{" "}
            +{" "}
            <code className="bg-ct-control px-1 py-0.5 rounded text-sm font-mono">ization</code>.
          </p>
          <p className="text-ct-body leading-relaxed">
            Different model families use different tokenizers with distinct
            vocabularies. This is why the same sentence can produce a
            different token count on GPT-4o (using OpenAI&apos;s{" "}
            <code className="bg-ct-control px-1 py-0.5 rounded text-sm font-mono">o200k_base</code>)
            versus Claude (using Anthropic&apos;s tokenizer) versus Gemini. The
            difference is not rounding — it reflects genuinely different
            vocabularies, and it matters when you are budgeting API costs.
          </p>
        </section>

        <section id="how-are-tokens-counted" className="mb-12 scroll-mt-6">
          <h2 className="text-2xl font-bold text-ct-strong mb-4">
            How are tokens counted? (with examples)
          </h2>
          <p className="text-ct-body leading-relaxed mb-6">
            Tokenizers convert raw text into integer IDs from a fixed
            vocabulary using byte-pair encoding (BPE) or similar algorithms.
            The count of those IDs is the token count. Here are five practical
            benchmarks across different text types:
          </p>

          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-ct-sunken border-b border-ct-border">
                  <th className="text-left py-3 px-4 font-semibold text-ct-body">
                    Text
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-ct-body">
                    Approximate tokens
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-ct-body hidden sm:table-cell">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ct-border-subtle">
                <tr className="hover:bg-ct-sunken transition-colors">
                  <td className="py-3 px-4 text-ct-strong font-mono text-xs">
                    &ldquo;Hello world&rdquo;
                  </td>
                  <td className="py-3 px-4 text-ct-strong">~4 tokens</td>
                  <td className="py-3 px-4 text-ct-muted hidden sm:table-cell">
                    Two common words, a space, and punctuation
                  </td>
                </tr>
                <tr className="hover:bg-ct-sunken transition-colors">
                  <td className="py-3 px-4 text-ct-strong">
                    100-word paragraph
                  </td>
                  <td className="py-3 px-4 text-ct-strong">~75 tokens</td>
                  <td className="py-3 px-4 text-ct-muted hidden sm:table-cell">
                    English prose averages ~0.75 tokens per word
                  </td>
                </tr>
                <tr className="hover:bg-ct-sunken transition-colors">
                  <td className="py-3 px-4 text-ct-strong">
                    Python function (20 lines)
                  </td>
                  <td className="py-3 px-4 text-ct-strong">~120 tokens</td>
                  <td className="py-3 px-4 text-ct-muted hidden sm:table-cell">
                    Code tokenizes more densely than prose; keywords compress well
                  </td>
                </tr>
                <tr className="hover:bg-ct-sunken transition-colors">
                  <td className="py-3 px-4 text-ct-strong">
                    JSON object (10 fields)
                  </td>
                  <td className="py-3 px-4 text-ct-strong">~50 tokens</td>
                  <td className="py-3 px-4 text-ct-muted hidden sm:table-cell">
                    Short string values; structural punctuation adds overhead
                  </td>
                </tr>
                <tr className="hover:bg-ct-sunken transition-colors">
                  <td className="py-3 px-4 text-ct-strong">
                    1,000-word article
                  </td>
                  <td className="py-3 px-4 text-ct-strong">~750 tokens</td>
                  <td className="py-3 px-4 text-ct-muted hidden sm:table-cell">
                    Consistent with the ~0.75 tokens-per-word English average
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-lg p-4 text-sm text-ct-body border" style={{ background: 'var(--accent-tint)', borderColor: 'var(--accent-line)' }}>
            <strong>Why model matters:</strong> These figures are typical for
            OpenAI&apos;s tokenizers. Claude&apos;s tokenizer produces counts
            that can differ by 5–15% for the same English text. For non-English
            scripts, code, or structured data, the divergence can be larger.
            Always tokenize against the target model for accurate cost
            estimates.
          </div>
        </section>

        <section id="why-do-tokens-cost-money" className="mb-12 scroll-mt-6">
          <h2 className="text-2xl font-bold text-ct-strong mb-4">
            Why do tokens cost money?
          </h2>
          <p className="text-ct-body leading-relaxed mb-4">
            Language models are compute-intensive. Each token in your prompt
            must be attended to by every layer of the transformer on every
            forward pass — and generating each output token requires a separate
            forward pass through the entire model. Running these operations at
            scale requires thousands of high-end GPUs or TPUs.
          </p>
          <p className="text-ct-body leading-relaxed mb-4">
            API providers therefore charge per million tokens processed, split
            into two components:
          </p>
          <ul className="list-disc list-inside space-y-2 text-ct-body mb-4 ml-2">
            <li>
              <strong>Input (prompt) tokens</strong> — the text you send,
              including any system prompt and conversation history. These are
              cheaper because they can be processed in a single batched forward
              pass.
            </li>
            <li>
              <strong>Output (completion) tokens</strong> — the text the model
              generates, one token at a time in an autoregressive loop.
              Generating tokens is typically 3–10 times more expensive per
              token than reading them.
            </li>
          </ul>
          <p className="text-ct-body leading-relaxed">
            Some models also bill separately for <strong>thinking tokens</strong>{" "}
            (internal reasoning chains). OpenAI&apos;s o-series models add
            thinking tokens on top of their output price; DeepSeek R1 bundles
            thinking into the output token price. This distinction can double
            or triple the cost of a reasoning-heavy request if you are not
            accounting for it.
          </p>
        </section>

        <section id="how-many-tokens" className="mb-12 scroll-mt-6">
          <h2 className="text-2xl font-bold text-ct-strong mb-4">
            How many tokens is my text?
          </h2>
          <p className="text-ct-body leading-relaxed mb-4">
            The fastest way to find out is to paste your text into the{" "}
            <Link href="/" className="text-ct-accent hover:text-ct-accent-h hover:underline">
              Calculate Tokens calculator
            </Link>
            . It runs each model&apos;s actual tokenizer in your browser using
            WebAssembly — your text never leaves your device.
          </p>
          <p className="text-ct-body leading-relaxed mb-4">
            If you need a quick mental estimate:
          </p>
          <ul className="list-disc list-inside space-y-2 text-ct-body mb-4 ml-2">
            <li>
              <strong>English prose:</strong> divide word count by 0.75 (or
              multiply by 1.33) to get a rough token count.
            </li>
            <li>
              <strong>Characters:</strong> divide character count by 4 for a
              rough heuristic. This is what models without a dedicated
              tokenizer report (marked with a{" "}
              <code className="bg-ct-control px-1 py-0.5 rounded text-sm font-mono">~</code>{" "}
              prefix in the calculator).
            </li>
            <li>
              <strong>Code:</strong> expect slightly more tokens per character
              than prose — indentation, punctuation, and operator symbols each
              consume tokens.
            </li>
          </ul>
          <p className="text-ct-body leading-relaxed">
            Remember that the heuristic significantly underestimates token
            counts for non-Latin scripts (Chinese, Arabic, Hindi) and
            overestimates for dense code. Only an exact tokenizer call gives
            you a reliable number for cost estimation.
          </p>
        </section>

        <section id="token-limits-by-model" className="mb-12 scroll-mt-6">
          <h2 className="text-2xl font-bold text-ct-strong mb-4">
            Token limits by model
          </h2>
          <p className="text-ct-body leading-relaxed mb-6">
            Every model has a <strong>context window</strong> — the maximum
            number of tokens it can process in a single request, counting both
            input and output together. Exceeding this limit produces an error.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-ct-sunken border-b border-ct-border">
                  <th className="text-left py-3 px-4 font-semibold text-ct-body">
                    Model
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-ct-body">
                    Provider
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-ct-body">
                    Context window
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-ct-body hidden md:table-cell">
                    Tokenizer
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ct-border-subtle">
                {activeModels.map((model) => (
                  <tr
                    key={model.id}
                    className="hover:bg-ct-sunken transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-ct-strong">
                      {model.display_name}
                    </td>
                    <td className="py-3 px-4 text-ct-body">
                      {model.provider}
                    </td>
                    <td className="py-3 px-4 text-right text-ct-strong font-mono tabular-nums">
                      {formatContextWindow(model.context_window)}
                    </td>
                    <td className="py-3 px-4 text-ct-muted hidden md:table-cell">
                      {tokenizerLabels[model.tokenizer] ?? model.tokenizer}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-sm text-ct-muted">
            Context windows grow as models are updated. Check{" "}
            <Link href="/" className="text-ct-accent hover:text-ct-accent-h hover:underline">
              the calculator
            </Link>{" "}
            for the latest verified figures.
          </p>
        </section>

        <section id="token-cost-calculator" className="mb-4 scroll-mt-6">
          <h2 className="text-2xl font-bold text-ct-strong mb-4">
            Token cost calculator
          </h2>
          <p className="text-ct-body leading-relaxed mb-6">
            Paste any text into the calculator to see exact token counts and
            USD costs across all major models simultaneously. Each model runs
            its own tokenizer in your browser — no server, no data collection,
            no approximations.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-ct-accent hover:bg-ct-accent-h font-semibold px-6 py-3 rounded-lg transition-colors text-sm"
            style={{ color: '#1a1205' }}
          >
            Open the token calculator
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </section>
      </article>
    </>
  );
}
