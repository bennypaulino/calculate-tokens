import Link from "next/link";
import CalculatorShell from "../src/components/calculator/CalculatorShell";

const comparisonLinks = [
  { a: "GPT-4o", b: "Claude Sonnet 4.6", href: "/compare/claude-sonnet-4-6-vs-gpt-4o" },
  { a: "GPT-4o", b: "Gemini 2.5 Pro", href: "/compare/gemini-2-5-pro-vs-gpt-4o" },
  { a: "Claude Sonnet 4.6", b: "DeepSeek V3", href: "/compare/claude-sonnet-4-6-vs-deepseek-v3" },
  { a: "GPT-4.1", b: "Claude Haiku 4.5", href: "/compare/claude-haiku-4-5-vs-gpt-4-1" },
  { a: "DeepSeek R1", b: "o4-mini", href: "/compare/deepseek-r1-vs-o4-mini" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Calculate Tokens",
  url: "https://calculatetokens.com",
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Web",
  description:
    "Browser-native LLM token calculator. Paste a prompt and instantly see accurate token counts and USD costs across all major models — no text ever leaves your browser.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  featureList: [
    "Per-model tokenization accuracy using WebAssembly tokenizers",
    "Cost estimates for GPT-4o, Claude, Gemini, Llama and more",
    "Browser-native — prompt text never transmitted to any server",
    "Side-by-side model comparison",
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero */}
        <section className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 mb-4 leading-tight">
            Calculate exact token costs across every major AI model
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 mb-4">
            Accurate per-model tokenization. Your text stays in your browser.
          </p>
          <Link
            href="/learn/what-is-a-token"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
          >
            Learn what a token is
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </section>

        {/* Privacy callout */}
        <section className="flex items-start gap-4 border border-green-200 bg-green-50 rounded-xl px-6 py-4 mb-8">
          <span className="text-green-600 text-xl mt-0.5" aria-hidden="true">
            &#128274;
          </span>
          <div>
            <p className="font-semibold text-green-900 text-sm">
              Your text never leaves your browser
            </p>
            <p className="text-green-800 text-sm mt-0.5">
              Tokenization runs entirely on your device via WebAssembly. No
              prompt text is sent to any server, logged, or stored.{" "}
              <Link href="/privacy" className="underline hover:no-underline">
                Privacy policy
              </Link>
            </p>
          </div>
        </section>

        {/* Calculator */}
        <section className="mb-12">
          <CalculatorShell />
        </section>

        {/* Comparison links */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Model comparisons
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {comparisonLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors bg-white"
                >
                  <span>
                    <span className="font-medium">{link.a}</span>
                    <span className="text-gray-500 mx-2">vs</span>
                    <span className="font-medium">{link.b}</span>
                  </span>
                  <span className="text-gray-400" aria-hidden="true">
                    &rarr;
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
