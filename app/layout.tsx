import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import Link from "next/link";
import "./globals.css";
import { t, getBaseUrl, getHreflangAlternates, getLocaleConfig, locale } from "../src/lib/i18n";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  return (
    <html lang={getLocaleConfig().htmlLang} className={`${inter.variable} h-full antialiased`}>
      <body
        className="min-h-full flex flex-col font-[var(--font-inter)] bg-white text-[#0a0a0a]"
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        <header className="border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            <Link
              href="/"
              className="text-base font-semibold tracking-tight text-gray-900 hover:text-gray-700 transition-colors"
            >
              {t("nav.home")}
            </Link>
            <nav className="flex items-center gap-6 text-sm text-gray-600">
              <Link
                href="/learn/what-is-a-token"
                className="hover:text-gray-900 transition-colors"
              >
                {t("nav.whatIsToken")}
              </Link>
              <Link
                href="/privacy"
                className="hover:text-gray-900 transition-colors"
              >
                {t("nav.privacy")}
              </Link>
              <nav aria-label={t("langSwitcher.ariaLabel")} className="flex items-center gap-2 text-xs text-gray-500 border-l border-gray-200 pl-4 ml-2">
                {Object.entries(LOCALE_URLS).map(([loc, url]) => (
                  <a
                    key={loc}
                    href={url}
                    className={`hover:text-gray-900 transition-colors ${loc === locale ? "font-bold text-gray-900 underline" : ""}`}
                    aria-current={loc === locale ? "true" : undefined}
                  >
                    {LOCALE_LABELS[loc]}
                  </a>
                ))}
              </nav>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-gray-200 mt-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between text-sm text-gray-500">
            <span>{t("footer.copyright", { year: "2026" })}</span>
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">
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
