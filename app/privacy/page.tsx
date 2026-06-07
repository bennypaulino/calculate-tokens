import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — Calculate Tokens",
  description:
    "Privacy policy for calculatetokens.com: what data is collected, what is not, third-party services, data residency, user rights, and how to contact us.",
  alternates: {
    canonical: "https://calculatetokens.com/privacy",
  },
  openGraph: {
    title: "Privacy Policy — Calculate Tokens",
    description:
      "Privacy policy for calculatetokens.com: what data is collected, what is not, third-party services, data residency, user rights, and how to contact us.",
    url: "https://calculatetokens.com/privacy",
    siteName: "Calculate Tokens",
    images: [
      {
        url: "/ai-token-cost-calculator.jpg",
        width: 1200,
        height: 630,
        alt: "Calculate Tokens — LLM Token Calculator & Cost Estimator",
      },
    ],
    locale: "en_US",
    type: "website",
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
      <h2 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
        {title}
      </h2>
      <div className="space-y-4 text-gray-700 leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500">
          Effective date: 6 June 2026. Last updated: 6 June 2026.
        </p>
        <p className="mt-4 text-gray-600 leading-relaxed">
          Calculate Tokens (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates{" "}
          <span className="font-medium">calculatetokens.com</span>. This policy
          explains exactly what data we collect, what we do not collect, and
          your rights as a visitor.
        </p>
      </header>

      <nav className="mb-10 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Contents
        </p>
        <ol className="space-y-1 text-sm columns-2 gap-x-4">
          {[
            ["#what-is-collected", "What is collected"],
            ["#what-is-not-collected", "What is not collected"],
            ["#third-party-scripts", "Third-party scripts"],
            ["#data-residency", "Data residency"],
            ["#data-retention", "Data retention"],
            ["#user-rights", "Your rights (GDPR)"],
            ["#opt-out", "Opt-out options"],
            ["#breach-notification", "Breach notification"],
            ["#contact", "Contact"],
            ["#security", "Security policy"],
          ].map(([href, label]) => (
            <li key={href}>
              <a
                href={href}
                className="text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <Section id="what-is-collected" title="What is collected">
        <p>
          We collect limited, anonymised usage data to understand how the
          calculator is used and to detect errors. We do not collect personal
          identifiers.
        </p>

        <h3 className="font-semibold text-gray-800">
          Cloudflare Web Analytics (page-level)
        </h3>
        <ul className="list-disc list-inside ml-2 space-y-1 text-sm">
          <li>Page URL visited</li>
          <li>Referrer URL (if provided by your browser)</li>
          <li>Browser and operating system (aggregated)</li>
          <li>Country (derived from IP at the edge; IP is not stored)</li>
          <li>Core Web Vitals: LCP, CLS, FID/INP, TTFB</li>
        </ul>

        <h3 className="font-semibold text-gray-800 mt-4">
          Umami (custom events)
        </h3>
        <p className="text-sm">
          When you interact with the calculator, Umami records the following
          eight events. <strong>No event ever encodes prompt text</strong> — the
          only numeric payload is a quantised character count (rounded to the
          nearest 100, per GDPR data minimisation obligations).
        </p>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                  Event name
                </th>
                <th className="text-left py-2 px-3 font-semibold text-gray-700">
                  Payload
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                [
                  "tokenize",
                  "tokenizer_type, char_count (quantised to nearest 100)",
                ],
                ["preset_selected", "preset_name"],
                ["share_url_copied", "mode"],
                ["output_slider_adjusted", "value (0–8000)"],
                ["thinking_toggle_enabled", "model"],
                ["scaling_simulator_used", "(no payload)"],
                ["compare_tab_switched", "tab_name"],
                ["token_highlighter_toggled", "(no payload)"],
              ].map(([event, payload]) => (
                <tr key={event} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2 px-3 font-mono text-xs text-gray-800">
                    {event}
                  </td>
                  <td className="py-2 px-3 text-gray-600">{payload}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="what-is-not-collected" title="What is not collected">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
          <strong>Core privacy guarantee:</strong> The text you paste into the
          calculator is processed entirely inside your browser using
          WebAssembly. It is never transmitted to any server — not to us, not
          to analytics services, not encoded in URLs. Shareable URLs encode
          only configuration (slider values, model selection, toggle states).
        </div>
        <ul className="list-disc list-inside ml-2 space-y-1 text-sm mt-2">
          <li>Prompt text or any portion of textarea contents</li>
          <li>Name, email address, or any personal identifier</li>
          <li>IP addresses (Cloudflare and Umami both operate without storing raw IPs)</li>
          <li>Cookies (we set none)</li>
          <li>Cross-site tracking identifiers</li>
          <li>Payment or financial information</li>
          <li>Device fingerprints</li>
        </ul>
      </Section>

      <Section id="third-party-scripts" title="Third-party scripts">
        <h3 className="font-semibold text-gray-800">
          Cloudflare Web Analytics
        </h3>
        <p className="text-sm">
          Provided by Cloudflare, Inc. (US). Privacy-first analytics with no
          cross-site tracking. See{" "}
          <a
            href="https://www.cloudflare.com/privacypolicy/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline"
          >
            Cloudflare&apos;s privacy policy
          </a>
          .
        </p>

        <h3 className="font-semibold text-gray-800 mt-4">
          Umami Analytics (self-hosted)
        </h3>
        <p className="text-sm">
          We self-host an Umami instance on Railway (US region). Umami is
          open-source and collects no personally identifiable information.
          Event payloads are limited to the eight events listed above.
        </p>

        <h3 className="font-semibold text-gray-800 mt-4">
          Google AdSense (pending approval)
        </h3>
        <p className="text-sm">
          We have applied for Google AdSense. If approved, Google&apos;s
          advertising scripts will be loaded on the site. Google may use
          cookies and similar technologies for personalised advertising. See{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline"
          >
            Google&apos;s privacy policy
          </a>{" "}
          and the opt-out instructions in the{" "}
          <a href="#opt-out" className="text-indigo-600 hover:underline">
            Opt-out section
          </a>{" "}
          below. Tokenization accuracy is unaffected by AdSense — all
          tokenizers continue to run via WebAssembly regardless of ad
          configuration.
        </p>
      </Section>

      <Section id="data-residency" title="Data residency">
        <ul className="list-disc list-inside ml-2 space-y-2 text-sm">
          <li>
            <strong>Umami custom events</strong> — stored on Railway (US East
            region, AWS us-east-1).
          </li>
          <li>
            <strong>Cloudflare Web Analytics</strong> — processed at
            Cloudflare&apos;s distributed global edge network. Aggregate data
            is stored in Cloudflare&apos;s US data centres.
          </li>
          <li>
            <strong>Static site assets</strong> — served from Cloudflare Pages
            edge nodes globally.
          </li>
        </ul>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mt-4">
          <strong>EU users — important notice:</strong> Umami custom event
          tracking is disabled for EU users in v1. No Data Processing Agreement
          (DPA) is in place with Railway free tier as required under GDPR for
          EU data subjects. Until a DPA is established, EU visitors will not
          have Umami events recorded. Cloudflare Web Analytics (page-level
          only) continues to apply under Cloudflare&apos;s EU SCCs.
        </div>
      </Section>

      <Section id="data-retention" title="Data retention">
        <ul className="list-disc list-inside ml-2 space-y-2 text-sm">
          <li>
            <strong>Umami</strong> — event data retained for a maximum of 90
            days, then purged automatically.
          </li>
          <li>
            <strong>Cloudflare Web Analytics</strong> — retained per
            Cloudflare&apos;s own data retention policy (currently up to 6
            months for analytics data). Consult{" "}
            <a
              href="https://www.cloudflare.com/privacypolicy/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              Cloudflare&apos;s privacy policy
            </a>{" "}
            for the current schedule.
          </li>
          <li>
            We hold no database of our own. There is no user account system.
          </li>
        </ul>
      </Section>

      <Section id="user-rights" title="Your rights (GDPR)">
        <p className="text-sm">
          If you are located in the European Economic Area (EEA), United
          Kingdom, or Switzerland, you have the following rights under GDPR /
          UK GDPR:
        </p>
        <ul className="list-disc list-inside ml-2 space-y-1 text-sm">
          <li>
            <strong>Right of access</strong> — request a copy of data we hold
            about you.
          </li>
          <li>
            <strong>Right to erasure</strong> (&ldquo;right to be
            forgotten&rdquo;) — request deletion of your data. Because we
            collect no personal identifiers, we cannot guarantee we can isolate
            your records; we will delete all anonymised session data from the
            relevant date range on request.
          </li>
          <li>
            <strong>Right to restriction</strong> — request that we restrict
            processing pending resolution of a dispute.
          </li>
          <li>
            <strong>Right to data portability</strong> — request your data in a
            machine-readable format.
          </li>
          <li>
            <strong>Right to object</strong> — object to processing based on
            legitimate interests.
          </li>
        </ul>
        <p className="text-sm mt-2">
          To exercise any right, email{" "}
          <a
            href="mailto:privacy@calculatetokens.com"
            className="text-indigo-600 hover:underline"
          >
            privacy@calculatetokens.com
          </a>
          . We will respond within 30 days.
        </p>
      </Section>

      <Section id="opt-out" title="Opt-out options">
        <ul className="list-disc list-inside ml-2 space-y-2 text-sm">
          <li>
            <strong>Umami</strong> — Umami respects the browser{" "}
            <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">
              Do Not Track
            </code>{" "}
            (DNT) header. Enabling DNT in your browser settings will prevent
            Umami from recording events for your session.
          </li>
          <li>
            <strong>Cloudflare Web Analytics</strong> — Cloudflare does not
            currently offer a visitor-level opt-out mechanism. You may use a
            content blocker that blocks{" "}
            <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">
              static.cloudflareinsights.com
            </code>
            .
          </li>
          <li>
            <strong>Google AdSense</strong> (when active) — opt out of
            personalised advertising via{" "}
            <a
              href="https://myadcenter.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              My Ad Center
            </a>{" "}
            or the{" "}
            <a
              href="https://optout.networkadvertising.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              NAI opt-out tool
            </a>
            .
          </li>
        </ul>
      </Section>

      <Section id="breach-notification" title="Breach notification">
        <p className="text-sm">
          In the event of a personal data breach, we will notify the relevant
          supervisory authority within{" "}
          <strong>72 hours</strong> of becoming aware of the breach, as
          required under GDPR Article 33. Where the breach is likely to result
          in a high risk to affected individuals, we will also notify those
          individuals without undue delay (GDPR Article 34).
        </p>
        <p className="text-sm">
          Given that we do not store personal identifiers, the risk surface is
          limited to aggregated analytics data. Nonetheless, we treat any
          suspected breach with the same urgency.
        </p>
      </Section>

      <Section id="contact" title="Contact">
        <p className="text-sm">
          For privacy enquiries, data subject rights requests, or concerns
          about this policy:
        </p>
        <address className="not-italic text-sm mt-2 space-y-1">
          <div>
            <strong>Email:</strong>{" "}
            <a
              href="mailto:privacy@calculatetokens.com"
              className="text-indigo-600 hover:underline"
            >
              privacy@calculatetokens.com
            </a>
          </div>
          <div>
            <strong>Site:</strong>{" "}
            <a
              href="https://calculatetokens.com"
              className="text-indigo-600 hover:underline"
            >
              calculatetokens.com
            </a>
          </div>
        </address>
        <p className="text-sm mt-3 text-gray-500">
          We are not required to appoint a Data Protection Officer under
          current processing volumes, but we take privacy obligations
          seriously and respond to all enquiries within 30 days.
        </p>
      </Section>

      <section
        id="security"
        className="mb-10 scroll-mt-6 border-2 border-gray-200 rounded-lg p-6"
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Security policy
        </h2>
        <div className="space-y-4 text-gray-700 leading-relaxed text-sm">
          <p>
            We take security vulnerabilities seriously. If you discover a
            security issue in calculatetokens.com, please report it
            responsibly.
          </p>

          <h3 className="font-semibold text-gray-800">How to report</h3>
          <p>
            Email{" "}
            <a
              href="mailto:security@calculatetokens.com"
              className="text-indigo-600 hover:underline"
            >
              security@calculatetokens.com
            </a>{" "}
            with a description of the issue, steps to reproduce, and the
            potential impact. We do not currently operate a bug bounty
            programme, but we will acknowledge responsible disclosures
            publicly if you wish.
          </p>

          <h3 className="font-semibold text-gray-800">
            Response commitments
          </h3>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li>
              <strong>7-day acknowledgement SLA:</strong> We will acknowledge
              receipt of your report within 7 days and confirm whether we
              consider it a valid security issue.
            </li>
            <li>
              <strong>90-day resolution SLA:</strong> We aim to remediate
              confirmed vulnerabilities within 90 days. Critical
              vulnerabilities affecting user data will be prioritised for
              immediate resolution.
            </li>
          </ul>

          <h3 className="font-semibold text-gray-800">Scope</h3>
          <p>
            In-scope: the calculatetokens.com domain, JavaScript and
            WebAssembly code delivered to browsers, and the Cloudflare Pages
            deployment configuration.
          </p>
          <p>
            Out-of-scope: third-party services (Google, Cloudflare, Railway,
            Umami) — report those directly to the respective vendors.
          </p>

          <h3 className="font-semibold text-gray-800">
            Coordinated disclosure
          </h3>
          <p>
            We ask that you give us the 90-day resolution window before public
            disclosure. We will coordinate a disclosure timeline with you if
            the issue requires more time.
          </p>

          <h3 className="font-semibold text-gray-800">Machine-readable policy</h3>
          <p>
            See{" "}
            <a
              href="/.well-known/security.txt"
              className="text-indigo-600 hover:underline"
            >
              /.well-known/security.txt
            </a>{" "}
            for our machine-readable security disclosure policy.
          </p>
        </div>
      </section>

      <p className="text-xs text-gray-400 mt-8">
        This policy may be updated to reflect changes in our data practices or
        applicable law. Material changes will be reflected in the &ldquo;Last
        updated&rdquo; date at the top of this page.
      </p>
    </div>
  );
}
