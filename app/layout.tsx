import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import Link from "next/link";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://calculatetokens.com"),
  title: "Calculate Tokens — LLM Token Calculator & Cost Estimator",
  description:
    "Calculate exact token counts and costs across GPT-4o, Claude, Gemini, Llama and more. Browser-native — your text never leaves your device.",
  openGraph: {
    title: "Calculate Tokens — LLM Token Calculator & Cost Estimator",
    description:
      "Calculate exact token counts and costs across GPT-4o, Claude, Gemini, Llama and more. Browser-native — your text never leaves your device.",
    url: "https://calculatetokens.com",
    siteName: "Calculate Tokens",
    images: [
      {
        url: "/og-image.png",
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
    title: "Calculate Tokens — LLM Token Calculator & Cost Estimator",
    description:
      "Calculate exact token counts and costs across GPT-4o, Claude, Gemini, Llama and more. Browser-native — your text never leaves your device.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
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
              Calculate Tokens
            </Link>
            <nav className="flex items-center gap-6 text-sm text-gray-600">
              <Link
                href="/learn/what-is-a-token"
                className="hover:text-gray-900 transition-colors"
              >
                What is a token?
              </Link>
              <Link
                href="/privacy"
                className="hover:text-gray-900 transition-colors"
              >
                Privacy
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-gray-200 mt-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between text-sm text-gray-500">
            <span>&copy; 2026 Calculate Tokens. MIT License.</span>
            <Link href="/privacy" className="hover:text-gray-900 transition-colors">
              Privacy
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
      </body>
    </html>
  );
}
