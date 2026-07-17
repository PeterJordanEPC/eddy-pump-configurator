# EDDY Pump — Pump & Dredge Configurator

Static React configurator for `https://configurator.eddypump.com/`. The browser collects project context and displays only recommendations returned by the private API; it contains no recommendation sizing table, CRM credentials, customer records, pricing, or approval state.

## Architecture and release order

```text
GitHub Pages (static, locally bundled React)
  → POST /v1/recommendations/preview (authoritative rules + RULES_VERSION)
  → POST /v1/submissions (authoritative final recommendation + secure intake)
  → reconcile the displayed result if final authority changed it
```

**Deploy the compatible backend before this frontend.** The frontend requires the strict preview endpoint. Builds use the current Railway production origin (`https://api-production-1940.up.railway.app`) by default, so unresolved custom DNS cannot block the configurator. Set `CONFIGURATOR_API_BASE` to an HTTPS origin at build time to override the primary origin; Railway remains the network fallback. Both code and CSP are generated from `build-config.js`, the single API-origin configuration source.

No live form should be submitted during frontend testing. HubSpot/CRM behavior remains private-backend responsibility.

## Business behavior

- Dredging: application → material → production → **deployment → compatible power**.
- Excavator attachment offers and accepts hydraulic power only.
- Process pump: application → material → flow → **head context for every flow range** → power → configuration.
- Flow/production determines size; deployment determines equipment family; power remains authoritative.
- The frontend does not contain a product recommendation matrix. It sends canonical answer IDs to `POST /v1/recommendations/preview` and displays the returned recommendation.
- The final submission response is authoritative and replaces the preview when they differ.
- No 5-inch or HH2000 recommendation exists in frontend code.

## Development

Requires Node.js 22.12+ and npm.

```bash
npm ci
npm run test
npm run build
npm run check
npm run test:e2e       # installs/runs Playwright Chromium separately as needed
npm audit --audit-level=high
```

`npm run build` deterministically generates `app.js` and `index.html`. Do not edit them directly. Production source maps are disabled and `*.map` is ignored. `index.html` contains the release ID from `build-config.js`.

Example custom-origin build: `CONFIGURATOR_API_BASE=https://api-configurator.eddypump.com npm run build`. The override is validated as a path-free HTTPS origin and added to both the bundle and generated `connect-src` policy.

### Source layout

- `src/domain/` — canonical question tracks, compatibility validation, answer pruning, idempotency tracking
- `src/config/assets.js` — explicit local asset manifest (no missing-image probes)
- `src/api/client.js` — preview/submission transport, safe errors, fallback, timeout, reconciliation
- `src/components/` — React UI components
- `styles.css` — external responsive/accessibility styles
- `build-config.js` / `scripts/build.mjs` — one API/CSP/release/source-map build configuration
- `test/` — Vitest/jsdom/Testing Library domain, API, flow, validation, retry, and accessibility tests
- `e2e/` — Playwright + axe desktop/mobile smoke scaffolding
- `scripts/check-build.mjs` — generated hardening assertions

## Validation and resilience

Frontend HTML constraints mirror the backend schema: trimmed 2–120 character name, native `type="email"` validity plus an obvious domain-completeness check (the domain must contain a non-edge dot), 500-character other material, canonical numeric bounds, and 4,000-character notes. This is a usability check, not proof that an address or domain exists; the backend remains authoritative. Backend details are never rendered directly; errors map to customer-safe messages with direct phone/email fallback.

Preview has loading, safe error, and retry states. Submission uses `AbortController` with a 20-second timeout. An unchanged payload retry preserves its idempotency key; any customer/answer/project edit creates a new key.

## Privacy and accessibility

Submission requests project contact and does not subscribe the user to marketing. `privacy.html` explains use and prohibited sensitive data. Phone and email fallback remain visible in the form and `<noscript>` path.

Question/result pages use an `h1`. Success uses a focusable heading inside `role="status"` with `aria-live="polite"`. Controls retain 48px minimum targets, strong focus styles, reduced-motion behavior, and compact mobile cards.

## Assets

Only files listed in `src/config/assets.js` are requested. `images/dredging.webp` is a genuine WebP file with the matching extension; other cards use lightweight local SVG blueprint art. Images use dimensions, async decoding, and lazy loading where appropriate.

## CI and Pages

- `.github/workflows/ci.yml`: least-privilege read permissions, concurrency cancellation, lockfile install without lifecycle scripts, high-severity audit, unit/behavioral/build checks, generated-file diff gate, Playwright/axe desktop+mobile, and diff whitespace check.
- `.github/workflows/pages.yml`: explicit Pages artifact and deploy jobs, deployment environment, scoped OIDC/Pages permissions only on deploy, and serialized production deployments.

External release gates remain: backend canonical preview contract deployed with its declared `RULES_VERSION`, backend CORS allows the Pages origin, and GitHub Pages environment approval/settings configured. If the custom API origin is enabled, its DNS/TLS must first be verified. GitHub Pages must provide clickjacking protection as an HTTP `Content-Security-Policy: frame-ancestors 'none'` or `X-Frame-Options: DENY` response header; `frame-ancestors` is intentionally not placed in the meta CSP because browsers ignore it there.
