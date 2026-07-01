import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact — Calculate Tokens",
  description:
    "Get in touch with the Calculate Tokens team for general enquiries, bug reports, feature requests, or partnership enquiries.",
  alternates: {
    canonical: "https://calculatetokens.com/contact/",
  },
  openGraph: {
    title: "Contact — Calculate Tokens",
    description:
      "Get in touch with the Calculate Tokens team for general enquiries, bug reports, feature requests, or partnership enquiries.",
    url: "https://calculatetokens.com/contact/",
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
    title: "Contact — Calculate Tokens",
    description:
      "Get in touch with the Calculate Tokens team for general enquiries, bug reports, feature requests, or partnership enquiries.",
    images: ["/og/calculate-tokens-og.png"],
  },
};

interface ContactRowProps {
  label: string;
  email: string;
  description: string;
}

function ContactRow({ label, email, description }: ContactRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-6 py-4 border-b border-ct-border-subtle last:border-0">
      <div className="sm:w-40 flex-shrink-0">
        <span className="font-semibold text-ct-strong text-sm">{label}</span>
      </div>
      <div className="space-y-1">
        <a
          href={`mailto:${email}`}
          className="text-ct-accent hover:underline text-sm font-mono"
        >
          {email}
        </a>
        <p className="text-sm text-ct-muted">{description}</p>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-ct-strong mb-3">Contact</h1>
        <p className="mt-4 text-ct-body leading-relaxed">
          Questions, bug reports, feature requests, or partnership enquiries —
          we&apos;re happy to hear from you. We aim to respond within 5 business
          days.
        </p>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-ct-strong mb-4 pb-2 border-b border-ct-border-subtle">
          Email
        </h2>
        <div>
          <ContactRow
            label="General"
            email="hello@calculatetokens.com"
            description="Questions, feedback, feature suggestions, or anything else."
          />
          <ContactRow
            label="Privacy"
            email="privacy@calculatetokens.com"
            description="Data subject rights requests, GDPR enquiries, or privacy concerns."
          />
          <ContactRow
            label="Security"
            email="security@calculatetokens.com"
            description="Responsible disclosure of security vulnerabilities. See our security policy."
          />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-ct-strong mb-4 pb-2 border-b border-ct-border-subtle">
          Reporting a bug
        </h2>
        <div className="space-y-4 text-ct-body leading-relaxed text-sm">
          <p>
            If you&apos;ve found a token count or pricing discrepancy, please
            include:
          </p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>The model affected</li>
            <li>
              The approximate character count of the input (never share the
              actual text)
            </li>
            <li>What count you expected vs. what was shown</li>
            <li>Your browser and OS</li>
          </ul>
          <p>
            For pricing errors, include a link to the provider&apos;s current
            pricing page showing the correct rate.
          </p>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-bold text-ct-strong mb-4 pb-2 border-b border-ct-border-subtle">
          Suggesting a model
        </h2>
        <div className="space-y-4 text-ct-body leading-relaxed text-sm">
          <p>
            We add models that have public API pricing and a stable tokenizer.
            If you&apos;d like to see a model added, email{" "}
            <a
              href="mailto:hello@calculatetokens.com"
              className="text-ct-accent hover:underline"
            >
              hello@calculatetokens.com
            </a>{" "}
            with the model name, provider, and a link to the official pricing
            page.
          </p>
        </div>
      </section>

      <div className="text-sm text-ct-muted border-t border-ct-border-subtle pt-6">
        <p>
          For privacy details, see the{" "}
          <Link href="/privacy" className="text-ct-accent hover:underline">
            Privacy Policy
          </Link>
          . For information about the project, see the{" "}
          <Link href="/about" className="text-ct-accent hover:underline">
            About page
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
