---
name: "Deployment: Cloudflare Pages Setup"
about: One-time setup task to connect Cloudflare Pages
title: "chore: connect Cloudflare Pages and configure deploy environment"
labels: "deployment, setup"
---

## Summary

Connect the GitHub repository to Cloudflare Pages for automatic deploy on push to `main`.

## Steps

1. **Create GitHub repository** (if not already done)
   ```
   gh repo create calculatetokens/calculatetokens --public --push --source=.
   ```

2. **Connect Cloudflare Pages**
   - Go to Cloudflare Dashboard → Workers & Pages → Create application → Pages → Connect to Git
   - Select this repository
   - Build settings:
     - Framework preset: Next.js (Static HTML Export)
     - Build command: `npm run build && node scripts/compute-prices-hash.js`
     - Output directory: `out`

3. **Set environment variable**
   - In Cloudflare Pages → Settings → Environment variables → Production:
     - `NEXT_PUBLIC_CSP_MODE` = `analytics`

4. **Verify first deploy**
   - Push to `main` and confirm the Cloudflare Pages build succeeds
   - Check `https://calculatetokens.com/api/v1/prices.json` returns 200 with `Content-Type: application/json`
   - Check `https://calculatetokens.com/sitemap.xml` is reachable

5. **Enable Cloudflare Web Analytics**
   - In Cloudflare Pages → project → Analytics tab → Enable Web Analytics

6. **Initialize pricing snapshots**
   ```bash
   node scripts/check-page-changes.js --init
   git add scripts/pricing-snapshots/
   git commit -m "chore: initialize pricing page snapshots"
   git push
   ```

7. **Submit sitemap to Google Search Console**
   - Verify site ownership via Cloudflare DNS TXT record
   - Submit `https://calculatetokens.com/sitemap.xml`

## Acceptance criteria

- [ ] Push to `main` triggers Cloudflare Pages build within 3 minutes
- [ ] Build completes with zero errors
- [ ] `calculatetokens.com/api/v1/prices.json` returns 200 + `X-Content-Hash` header
- [ ] `calculatetokens.com/sitemap.xml` is reachable
- [ ] Cloudflare Web Analytics shows first pageview within 24 hours
