import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Calculate Tokens",
  description:
    "Calculate Tokens is a browser-native LLM token calculator with per-model WebAssembly tokenizers. Your text never leaves your browser.",
  alternates: {
    canonical: "https://calculatetokens.com/about",
  },
  openGraph: {
    title: "About — Calculate Tokens",
    description:
      "Calculate Tokens is a browser-native LLM token calculator with per-model WebAssembly tokenizers. Your text never leaves your browser.",
    url: "https://calculatetokens.com/about",
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
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About — Calculate Tokens",
    description:
      "Calculate Tokens is a browser-native LLM token calculator with per-model WebAssembly tokenizers. Your text never leaves your browser.",
    images: ["/og/calculate-tokens-og.png"],
  },
};

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="mb-10 scroll-mt-6">
      <h2 className="text-xl font-bold text-ct-strong mb-4 pb-2 border-b border-ct-border-subtle">
        {title}
      </h2>
      <div className="space-y-4 text-ct-body leading-relaxed">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-ct-strong mb-3">
          About Calculate Tokens
        </h1>
        <p className="mt-4 text-ct-body leading-relaxed">
          Calculate Tokens is a browser-native token calculator that shows exact
          token counts and API costs across all major large language models —
          side by side, in real time, without your text ever leaving your
          device.
        </p>
      </header>

      <Section id="why" title="Why we built it">
        <p>
          Token counting sounds simple, but it&apos;s harder to get right than
          it looks. Most calculators apply OpenAI&apos;s tokenizer to every
          model regardless of provider. That introduces significant error:
          roughly 65% on Gemini models and 32% on Llama 3 — because those
          models use entirely different tokenization schemes.
        </p>
        <p>
          If you&apos;re estimating API costs at scale, a 30–65% counting error
          translates directly into a budget error of the same size. That&apos;s
          the problem Calculate Tokens solves.
        </p>
      </Section>

      <Section id="how-it-works" title="How it works">
        <p>
          Each model family runs its own tokenizer, compiled to WebAssembly, in
          a dedicated Web Worker:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse mt-2">
            <thead>
              <tr className="bg-ct-sunken border-b border-ct-border">
                <th className="text-left py-2 px-3 font-semibold text-ct-body">
                  Model family
                </th>
                <th className="text-left py-2 px-3 font-semibold text-ct-body">
                  Tokenizer
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ct-border-subtle">
              {[
                ["GPT-3.5, GPT-4 family", "tiktoken cl100k_base"],
                ["GPT-4o, o-series", "tiktoken o200k_base"],
                ["Claude", "Anthropic tokenizer (Wasm)"],
                ["Gemini", "Gemini tokenizer (Wasm)"],
                ["Llama 3", "SentencePiece (Wasm)"],
                ["DeepSeek, others", "Per-model tokenizer or heuristic"],
              ].map(([family, tokenizer]) => (
                <tr key={family} className="hover:bg-ct-sunken transition-colors">
                  <td className="py-2 px-3 text-ct-strong font-medium">{family}</td>
                  <td className="py-2 px-3 text-ct-body font-mono text-xs">{tokenizer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Workers load lazily on first use. Until a tokenizer resolves, a fast
          character-count heuristic ({`Math.ceil(chars / 4)`}) is shown with a
          &ldquo;~&rdquo; prefix. Once the Wasm tokenizer is ready, the count
          updates silently — no page reload, no layout shift.
        </p>
      </Section>

      <Section id="privacy" title="Privacy by design">
        <div
          className="rounded-lg p-4 text-sm text-ct-body border"
          style={{
            background: "var(--status-exact-tint)",
            borderColor: "var(--status-exact-line)",
          }}
        >
          <strong>Core guarantee:</strong> The text you paste into the
          calculator is processed entirely inside your browser. It is never
          transmitted to any server, never logged, and never encoded in share
          URLs.
        </div>
        <p>
          Shareable URLs encode only configuration — slider values, model
          selection, and toggle states. The site sets no cookies and collects no
          personal identifiers. See the{" "}
          <Link href="/privacy" className="text-ct-accent hover:underline">
            Privacy Policy
          </Link>{" "}
          for full details.
        </p>
      </Section>

      <Section id="pricing-data" title="Pricing data">
        <p>
          All pricing is sourced directly from provider pricing pages and stored
          in a human-reviewed{" "}
          <code className="bg-ct-control px-1 py-0.5 rounded text-xs font-mono">
            prices.json
          </code>{" "}
          file. A CI pipeline checks for page changes daily and opens an issue
          when a provider updates their rates.
        </p>
        <p>
          Each model entry shows when it was last human-verified. A staleness
          indicator appears when prices haven&apos;t been confirmed recently.
          Prices may change — always verify against the provider&apos;s current
          pricing page before making purchasing decisions.
        </p>
      </Section>

      <Section id="open-source" title="Open source">
        <p>
          Calculate Tokens is released under the{" "}
          <strong>MIT License</strong>. The project is built with Next.js,
          Tailwind CSS, and deployed on Cloudflare Pages. All tokenizer Wasm
          builds are community-maintained open-source packages.
        </p>
      </Section>

      <Section id="contact" title="Get in touch">
        <p>
          Questions, bug reports, or feature suggestions are welcome. Reach us
          at{" "}
          <a
            href="mailto:hello@calculatetokens.com"
            className="text-ct-accent hover:underline"
          >
            hello@calculatetokens.com
          </a>{" "}
          or visit the{" "}
          <Link href="/contact" className="text-ct-accent hover:underline">
            Contact page
          </Link>
          .
        </p>
      </Section>
    </div>
  );
}
