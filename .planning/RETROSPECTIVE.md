# CULTR Health — Retrospective

A living document of milestone retrospectives, patterns observed across releases, and lessons learned.

---

## Milestone: v1.0 — cultrclub-web Cloudflare Migration

**Shipped:** 2026-04-22
**Closed:** 2026-04-27
**Phases:** 5 | **Plans:** 9 | **Requirements:** 22/22

### What Was Built

Standalone `cultrclub-web` Next.js 14 app on Cloudflare Pages at `cultrclub.com`, sharing the Neon Postgres database with the cultrhealth.com admin still on Vercel. Free CULTR Club experience (landing, signup, product orders, member recognition) extracted from the monorepo into its own dedicated domain and runtime. `join.cultrhealth.com` retired entirely.

### What Worked

- **`fullResults: true` shim on `@neondatabase/serverless`** — preserving the `.rows` / `.rowCount` shape from `@vercel/postgres` meant zero downstream call-site changes. The whole DB layer migrated in a single PR with grep-clean verification.
- **`nodejs_compat` flag in `wrangler.toml`** — resolved every crypto/Buffer compatibility issue without touching code. We expected to hand-port `attribution.ts` and `mailchimp.ts`; the flag made it unnecessary.
- **Staging-first, with a separate subdomain** — `staging.join.cultrhealth.com` ran on Cloudflare in parallel with the live `join.cultrhealth.com` on Vercel. The 11 validation checks ran against staging without ever touching prod traffic.
- **Hard scope discipline** — explicitly excluded paid checkout, ConsentModal, compliance.ts, and admin from cultrclub-web. The smaller surface kept the cutover from sprawling.
- **Phased plan structure** — bootstrap → extract → adapt → deploy → cut over. Each phase had a clear gate; no parallel work; obvious rollback points.

### What Was Inefficient

- **Vercel domain detachment:** removing `join.cultrhealth.com` via the Vercel dashboard *appeared* to work but silently re-attached on the next deploy. Lost ~half a day to "why is the alias back?" before discovering the API path was required. Codified in CLAUDE.md so future cutovers don't repeat it.
- **Backfilling phase summaries at close:** Phase 04 + 05 had plans but never got SUMMARY.md files during execution. The work shipped, but `roadmap.analyze` reported 73% complete because the SDK keys off summary presence. Backfilled at close, but should have been written real-time.
- **Auto-generated MILESTONES.md accomplishments** — `gsd-sdk milestone.complete` pulled accomplishment text from every SUMMARY.md heading including raw "One-liner:" labels and orphan-phase content. Required manual rewrite. Future: write tighter SUMMARY.md headers, or pre-curate accomplishments.

### Patterns Established

- **Sibling-repo pattern for Cloudflare migrations:** `cultrclub-web/` sits next to `Cultr Health Website/` in `~/Dev-Projects/App-Ideas/`. GSD workspace stays in the source repo while the target builds. Clean.
- **`ADMIN_BASE_URL` env var:** approval emails route to cultrhealth.com admin even when sent from cultrclub-web. Lets us split the front-of-house and back-office across hosting providers.
- **NXDOMAIN > 301 for retiring subdomains** — when traffic data shows no return visitors, drop the subdomain rather than maintaining a forever redirect.
- **Edge runtime declared per-route** with `export const runtime = 'edge'` — required on Cloudflare Pages.

### Key Lessons

1. **Always remove Vercel domain aliases via API, not dashboard.** Codified in CLAUDE.md.
2. **`nodejs_compat` is the difference** between a one-week port and a one-month port. Set it as the default for any future Cloudflare Workers project.
3. **Write SUMMARY.md during execution, not at milestone close.** GSD's verification logic depends on it.
4. **Date everything in absolute terms in memory** — "Apr 22" is unambiguous; "last week" rots fast.

### Cost Observations

- Single GSD workspace, mixed model usage (opus for planning, sonnet for execution).
- 9-day end-to-end timeline (Apr 13 plan → Apr 22 ship → Apr 27 close).
- 96 files changed, +17,644 / −3,793 LOC across the cutover window.

---

## Cross-Milestone Trends

(updated as future milestones close)

### Velocity

| Milestone | Phases | Plans | Active days | LOC delta |
|---|---|---|---|---|
| v1.0 cultrclub-web Cloudflare | 5 | 9 | 9 | +17,644 / −3,793 |

### Recurring patterns

- *(populated as patterns emerge across multiple milestones)*

### Tooling decisions

- *(track when tools are adopted / dropped across milestones)*
