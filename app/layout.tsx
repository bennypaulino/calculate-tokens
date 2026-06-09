import type { Metadata } from "next";
import Script from "next/script";
import Link from "next/link";
import "./globals.css";
import { t, getBaseUrl, getHreflangAlternates, getLocaleConfig, locale } from "../src/lib/i18n";
import NavMobile from "./NavMobile";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  other: {
    "google-adsense-account": "ca-pub-2070140496775055",
  },
  title: t("meta.siteTitle"),
  description: t("meta.siteDescription"),
  openGraph: {
    title: t("meta.siteTitle"),
    description: t("meta.siteDescription"),
    url: getBaseUrl(),
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
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: t("meta.siteTitle"),
    description: t("meta.siteDescription"),
    images: ["/ai-token-cost-calculator.jpg"],
  },
  alternates: {
    languages: getHreflangAlternates("/"),
  },
};

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  de: "DE",
  es: "ES",
  fr: "FR",
  "pt-BR": "PT",
};

const LOCALE_URLS: Record<string, string> = {
  en: "https://calculatetokens.com/",
  de: "https://de.calculatetokens.com/",
  es: "https://es.calculatetokens.com/",
  fr: "https://fr.calculatetokens.com/",
  "pt-BR": "https://pt-br.calculatetokens.com/",
};

/* Hexagon-Σ mark — inline so it inherits no font dependency. */
function LogoMark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width="28"
      height="28"
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ctAmberNav" gradientUnits="userSpaceOnUse" x1="4" y1="4" x2="28" y2="28">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <polygon
        points="29,16 22.5,4.75 9.5,4.75 3,16 9.5,27.25 22.5,27.25"
        fill="none"
        stroke="url(#ctAmberNav)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <text
        x="16"
        y="21.2"
        textAnchor="middle"
        fontFamily="'IBM Plex Mono', ui-monospace, monospace"
        fontSize="13"
        fontWeight="700"
        fill="url(#ctAmberNav)"
      >
        Σ
      </text>
    </svg>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  return (
    <html lang={getLocaleConfig().htmlLang} className="h-full antialiased">
      <body
        className="min-h-full flex flex-col bg-ct-canvas text-ct-body font-sans"
      >
        <header
          className="sticky top-0 z-40 border-b border-ct-border-subtle"
          style={{ background: "rgba(12,13,16,0.88)", backdropFilter: "blur(10px)" }}
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2.5 text-ct-strong hover:text-ct-accent transition-colors"
              aria-label={t("nav.home")}
            >
              <LogoMark />
              <span className="font-semibold tracking-tight text-base leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                <span className="text-ct-strong">Calculate</span>
                <span className="text-ct-muted ml-1">Tokens</span>
              </span>
            </Link>

            <nav className="flex items-center gap-6 text-sm text-ct-muted">
              <Link
                href="/learn/what-is-a-token"
                className="hidden sm:inline hover:text-ct-strong transition-colors"
              >
                {t("nav.whatIsToken")}
              </Link>
              <Link
                href="/privacy"
                className="hidden sm:inline hover:text-ct-strong transition-colors"
              >
                {t("nav.privacy")}
              </Link>
              <div
                role="navigation"
                aria-label={t("langSwitcher.ariaLabel")}
                className="flex items-center gap-1 text-xs border-l border-ct-border-subtle pl-4 ml-2"
              >
                {Object.entries(LOCALE_URLS).map(([loc, url]) => (
                  <a
                    key={loc}
                    href={url}
                    className={`inline-flex items-center justify-center min-w-[24px] min-h-[24px] px-1 rounded hover:text-ct-strong transition-colors ${
                      loc === locale
                        ? "font-semibold text-ct-accent underline"
                        : "text-ct-subtle"
                    }`}
                    aria-current={loc === locale ? "true" : undefined}
                  >
                    {LOCALE_LABELS[loc]}
                  </a>
                ))}
              </div>
              <NavMobile />
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-ct-border-subtle mt-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between text-sm text-ct-muted">
            <span>{t("footer.copyright", { year: "2026" })}</span>
            <Link href="/privacy" className="hover:text-ct-strong transition-colors">
              {t("footer.privacy")}
            </Link>
          </div>
        </footer>

        {umamiId && (
          <Script
            src="https://cloud.umami.is/script.js"
            data-website-id={umamiId}
            strategy="afterInteractive"
          />
        )}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2070140496775055"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
