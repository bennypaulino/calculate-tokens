import type { Metadata } from "next";
import Link from "next/link";
import CalculatorShell from "../src/components/calculator/CalculatorShell";
import { t, getBaseUrl, getHreflangAlternates, canonicalUrl } from "../src/lib/i18n";

const comparisonLinks = [
  { a: "GPT-4o", b: "Claude Sonnet 4.6", href: "/compare/claude-sonnet-4-6-vs-gpt-4o" },
  { a: "GPT-4o", b: "Gemini 2.5 Pro", href: "/compare/gemini-2-5-pro-vs-gpt-4o" },
  { a: "Claude Sonnet 4.6", b: "DeepSeek V3", href: "/compare/claude-sonnet-4-6-vs-deepseek-v3" },
  { a: "GPT-4.1", b: "Claude Haiku 4.5", href: "/compare/claude-haiku-4-5-vs-gpt-4-1" },
  { a: "DeepSeek R1", b: "o4-mini", href: "/compare/deepseek-r1-vs-o4-mini" },
];

export async function generateMetadata(): Promise<Metadata> {
  return {
    alternates: {
      canonical: canonicalUrl('/'),
      languages: getHreflangAlternates("/"),
    },
  };
}

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: t("meta.siteName"),
    url: getBaseUrl(),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
    description: t("meta.siteDescription"),
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        {/* Hero */}
        <section className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-ct-strong mb-4 leading-tight">
            {t("home.heroHeading")}
          </h1>
          <p className="text-lg sm:text-xl text-ct-muted mb-4">
            {t("home.heroSubheading")}
          </p>
          <Link
            href="/learn/what-is-a-token"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ct-accent hover:text-ct-accent-h transition-colors"
          >
            {t("home.learnTokenLink")}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </section>

        {/* Privacy callout */}
        <section
          className="flex items-start gap-4 border border-ct-border rounded-xl px-6 py-4 mb-8 bg-ct-card"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-ct-accent mt-0.5"
            style={{ flexShrink: 0 }}
            aria-hidden="true"
          >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <div>
            <p className="font-semibold text-ct-strong text-sm">
              {t("home.privacyCalloutTitle")}
            </p>
            <p className="text-ct-muted text-sm mt-0.5">
              {t("home.privacyCalloutBody")}{" "}
              <Link href="/privacy" className="underline text-ct-accent hover:text-ct-accent-h">
                {t("home.privacyPolicy")}
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
          <h2 className="text-lg font-semibold text-ct-strong mb-4">
            {t("home.modelComparisons")}
          </h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {comparisonLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between border border-ct-border rounded-lg px-4 py-3 text-sm text-ct-body hover:border-ct-accent hover:text-ct-strong transition-colors bg-ct-card"
                >
                  <span>
                    <span className="font-medium">{link.a}</span>
                    <span className="text-ct-subtle mx-2">{t("home.vs")}</span>
                    <span className="font-medium">{link.b}</span>
                  </span>
                  <span className="text-ct-subtle" aria-hidden="true">
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
