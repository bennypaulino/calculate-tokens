#!/usr/bin/env node
// Generates public/_headers with the correct Content-Security-Policy for the
// current NEXT_PUBLIC_CSP_MODE. Run as a prebuild step before `next build`.
//
// analytics mode: includes wasm-unsafe-eval; excludes AdSense domains.
// adsense mode:   excludes wasm-unsafe-eval; includes AdSense domains and
//                 worker-src https://workers.calculatetokens.com.
'use strict';

const fs = require('fs');
const path = require('path');

const mode = process.env.NEXT_PUBLIC_CSP_MODE;

if (!mode || (mode !== 'analytics' && mode !== 'adsense')) {
  console.error('[generate-headers] FAIL: NEXT_PUBLIC_CSP_MODE must be "analytics" or "adsense".');
  process.exit(1);
}

const HEADERS_PATH = path.resolve(__dirname, '../public/_headers');

// In adsense mode the workers subdomain (workers.calculatetokens.com) serves the
// worker bundles cross-origin. Module workers require CORS, so the subdomain must
// send Access-Control-Allow-Origin and Cross-Origin-Resource-Policy headers.
const BASE_HEADERS = [
  'X-Frame-Options: DENY',
  'X-Content-Type-Options: nosniff',
  'Referrer-Policy: strict-origin-when-cross-origin',
  'Permissions-Policy: camera=(), microphone=(), geolocation=()',
];

const ADSENSE_EXTRA_HEADERS = [
  'Access-Control-Allow-Origin: *',
  'Cross-Origin-Resource-Policy: cross-origin',
];

const sharedHeaderLines =
  mode === 'adsense'
    ? [...BASE_HEADERS, ...ADSENSE_EXTRA_HEADERS]
    : BASE_HEADERS;

const SHARED_HEADERS = sharedHeaderLines.map(h => `  ${h}`).join('\n');

// NOTE ON 'unsafe-inline': Next.js static export embeds a unique RSC payload as
// an inline <script> on every page. Hash-pinning them unioned 4,064 hashes into
// one 219,918-byte header line -- 110x Cloudflare Pages' 2,000-char-per-line
// limit in _headers -- so the ENTIRE CSP was silently discarded and production
// served no CSP at all. Every other header on the same rule survived, which is
// why it went unnoticed. A host-restricted CSP that actually ships beats a
// hash-perfect one that does not. Per-page <meta> CSP would restore hashing;
// see the PR discussion.
const ANALYTICS_CSP =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://static.cloudflareinsights.com https://cloud.umami.is; " +
  "worker-src 'self' blob:; " +
  "connect-src 'self' https://cloudflareinsights.com https://static.cloudflareinsights.com https://cloud.umami.is https://api-gateway.umami.dev; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data:; " +
  "font-src 'self' https://fonts.gstatic.com; " +
  "frame-ancestors 'none'";

// AdSense needs considerably more than the two hosts previously listed: ad
// creatives inject inline scripts, beacons hit adtrafficquality.google for
// invalid-traffic detection, and creatives frame several google domains.
// connect-src 'self' alone blocked every AdSense beacon AND both analytics
// providers.
const ADSENSE_CSP =
  "default-src 'self'; " +
  "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com " +
  "https://googleads.g.doubleclick.net https://tpc.googlesyndication.com " +
  "https://partner.googleadservices.com https://adservice.google.com " +
  "https://www.googletagservices.com https://fundingchoicesmessages.google.com " +
  "https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google " +
  "https://static.cloudflareinsights.com https://cloud.umami.is; " +
  "worker-src 'self' https://workers.calculatetokens.com; " +
  "connect-src 'self' https://pagead2.googlesyndication.com " +
  "https://googleads.g.doubleclick.net https://ep1.adtrafficquality.google " +
  "https://ep2.adtrafficquality.google https://csi.gstatic.com https://www.google.com " +
  "https://cloudflareinsights.com https://static.cloudflareinsights.com " +
  "https://cloud.umami.is https://api-gateway.umami.dev; " +
  "style-src 'self' 'unsafe-inline'; " +
  "img-src 'self' data: https:; " +
  "media-src 'self' https:; " +
  "font-src 'self' https://fonts.gstatic.com; " +
  "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com " +
  "https://www.google.com https://pagead2.googlesyndication.com " +
  "https://ep2.adtrafficquality.google blob:; " +
  "frame-ancestors 'none'";

const csp = mode === 'analytics' ? ANALYTICS_CSP : ADSENSE_CSP;

// Cache-Control rules — Cloudflare _headers uses most-specific-wins ordering.
// Note: Next.js static export serves HTML at directory paths (e.g. /compare/foo/),
// NOT at .html paths — so /*.html never fires. The /* catch-all must carry the HTML
// cache policy. s-maxage lets the CDN edge cache pages; Cloudflare Pages
// auto-purges the edge cache on every deploy so stale HTML is never served.
const CACHE_SECTIONS = [
  // Fingerprinted immutable assets — hash in filename guarantees safe long-term cache
  '/_next/static/*\n  Cache-Control: public, max-age=31536000, immutable',
  // WASM and worker bundles — also fingerprinted at build time
  '/*.wasm\n  Cache-Control: public, max-age=31536000, immutable',
  '/*.worker.js\n  Cache-Control: public, max-age=31536000, immutable',
  // Static images and icons (not fingerprinted, 1-day TTL)
  '/images/*\n  Cache-Control: public, max-age=86400',
  '/*.svg\n  Cache-Control: public, max-age=86400',
  '/*.jpg\n  Cache-Control: public, max-age=86400',
  '/*.png\n  Cache-Control: public, max-age=86400',
  '/*.ico\n  Cache-Control: public, max-age=86400',
].join('\n\n');

// Read existing _headers to preserve the /api/v1/prices.json section (set by compute-prices-hash.js).
let pricesSection =
  '/api/v1/prices.json\n' +
  '  X-Content-Hash: placeholder\n' +
  '  Access-Control-Allow-Origin: *\n' +
  '  Content-Type: application/json; charset=utf-8\n' +
  '  Cache-Control: public, max-age=86400, stale-while-revalidate=86400';

if (fs.existsSync(HEADERS_PATH)) {
  const existing = fs.readFileSync(HEADERS_PATH, 'utf8');
  const match = existing.match(/^\/api\/v1\/prices\.json\n(?:[ \t]+[^\n]+\n?)*/m);
  if (match) pricesSection = match[0].trimEnd();
}

// HTML pages are served at directory paths (/compare/foo/) not .html paths,
// so the /* rule must carry the Cache-Control for all HTML. s-maxage allows
// Cloudflare edge caching while max-age=0 forces browsers to revalidate.
// Cloudflare Pages purges the edge cache on every deploy.
const HTML_CACHE = '  Cache-Control: public, max-age=0, s-maxage=3600, stale-while-revalidate=86400';

const content =
  `/*\n${SHARED_HEADERS}\n  Content-Security-Policy: ${csp}\n${HTML_CACHE}\n\n` +
  `${CACHE_SECTIONS}\n\n${pricesSection}\n`;

fs.writeFileSync(HEADERS_PATH, content, 'utf8');
console.log(`[generate-headers] Wrote public/_headers (mode=${mode})`);
