# Phase 6: Skills - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Create three new Claude Code skills and refresh one existing skill so that future sessions working on CULTR's payment and health-data integrations never re-make the Corepay/Authorize.Net naming confusion or guess at integration patterns.

**Deliverables:**
- `.claude/skills/corepay-api/SKILL.md` — full Authorize.Net API surface via Corepay merchant credentials (spec-forward, guides Phase 7)
- `.claude/skills/healthie-api/SKILL.md` — Healthie GraphQL + webhook integration reference
- `.claude/skills/siphox-api/SKILL.md` — refreshed to add the "Known repo bug" gotcha for `lib/siphox/client.ts:80`
- `.gitignore` exceptions for three new skill directories

**SKL-03 (corpay-crossborder) is DROPPED.** The Corpay (Fleetcor) company has zero references in the source code — no disambiguation guard skill is needed. The confusion context is captured in PROJECT.md and CLAUDE.md.

</domain>

<decisions>
## Implementation Decisions

### Corepay skill content and timing
- **D-01:** Skill is **spec-forward** — document the full intended API surface (gatewayFetch pattern, merchantAuthentication envelope, CIM, Accept.js token flow, HMAC-SHA512 webhooks, ARB update next-cycle rule) even though only ARB subscription create exists today. Sections not yet implemented must be clearly marked (e.g., `<!-- Phase 7 work — not yet in codebase -->`).
- **D-02:** The `authorizenet` npm SDK gotcha must include the **failure mode**, not just the rule: explain that the SDK has known issues with the HMAC signature envelope format and breaks webhook verification. Future sessions need WHY.
- **D-03:** The **Vocabulary section** (Corepay ≠ Authorize.Net ≠ Corpay) appears at the very top of the skill, before any other content. Include the Corpay URL that triggered the original confusion (`developer.crossborder.corpay.com`) as a "do not mistake this for CULTR's gateway" reference — this URL is the exact trap.
- **D-04:** Frontmatter trigger: load when code touches `COREPAY_TRANSACTION_KEY`, `NEXT_PUBLIC_COREPAY_API_LOGIN_ID`, `gatewayFetch`, `ARBCreateSubscriptionRequest`, `createCustomerProfile`, or any `lib/payments/corepay-*.ts` file.

### Healthie skill content
- **D-05:** Plan must include a **research sub-task** to fetch the full Healthie webhook event list from official docs and enumerate all ~120+ events in a table. Do not document only the events CULTR actively uses — the Phase 8 dispatcher will need the full catalogue.
- **D-06:** CULTR integration map must call out all four active integration points:
  - `lib/healthie/patient-sync.ts` — CULTR member → Healthie client mapping
  - `lib/healthie/mutations.ts` — appointment CREATE/CANCEL mutations (code-ready, Calendly is active; Healthie scheduling is latent)
  - `app/api/webhook/healthie/` — raw-body webhook route with HMAC-SHA256 (RFC 9421) verification
  - `lib/healthie/lab-sync.ts` — SiPhox biomarker results forwarded to Healthie form answers
- **D-07:** Frontmatter trigger: load when code touches `HEALTHIE_API_KEY`, `healthieRequest`, `HealthieApiError`, or any file in `lib/healthie/`.

### SiPhox skill refresh (SKL-04)
- **D-08:** Targeted edit only — add one new gotcha at the top of the Gotchas section: **"Known repo bug: `lib/siphox/client.ts:80` sends `Authorization: Bearer` but SiPhox requires `Authorization: Token`. Will be fixed in Phase 13."** The existing gotcha #1 ("Auth prefix is Token, not Bearer") documents the spec; the new gotcha documents the live code discrepancy.

### Skill file structure
- **D-09:** All new skills are **single SKILL.md files** — no `references/` subdirectory. Siphox-api's multi-file structure is not replicated for Phase 6. Single-file skills load in one read and are sufficient for the content depth these integrations need.
- **D-10:** All skills include frontmatter trigger conditions matching the siphox-api pattern: `name`, `description` (with trigger conditions embedded in the description text).

### .gitignore exceptions (SKL-05)
- **D-11:** Add three lines to `.gitignore` matching the existing `!.claude/skills/siphox-api/` pattern:
  ```
  !.claude/skills/corepay-api/
  !.claude/skills/healthie-api/
  ```
  (siphox-api exception already exists; no corpay-crossborder exception needed since SKL-03 is dropped)

### Scope change from REQUIREMENTS.md
- **D-12:** **SKL-03 is explicitly removed from scope.** The corpay-crossborder skill was a disambiguation guard for a company with zero presence in the source code. The planner must NOT create `.claude/skills/corpay-crossborder/`. The REQUIREMENTS.md entry for SKL-03 remains as a historical record but is treated as intentionally deferred/cancelled.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing skill reference implementation
- `.claude/skills/siphox-api/SKILL.md` — The established format, depth, frontmatter pattern, and trigger condition style. All new skills must match this format (single-file, trigger-first description, Gotchas section early).

### Source files to read before writing each skill

#### corepay-api skill
- `lib/payments/corepay-gateway.ts` — Only ARB subscription create is implemented; use as the foundation but document the full intended surface
- `lib/config/payments.ts` — COREPAY_CONFIG with env vars, API URLs, sandbox/prod toggle
- `.planning/research/SUMMARY.md` §"CorePay + Authorize.Net Integration" — research notes on the full API surface (ARB, CIM, Accept.js, webhooks, HMAC-SHA512)

#### healthie-api skill
- `lib/healthie/client.ts` — healthieRequest generic wrapper, auth headers, Basic not Bearer
- `lib/healthie/webhooks.ts` — full HMAC-SHA256 RFC 9421 verification implementation
- `lib/healthie/mutations.ts` — top GraphQL mutations CULTR uses
- `lib/healthie/queries.ts` — top GraphQL queries
- `lib/healthie/patient-sync.ts` — CULTR→Healthie member sync pattern
- `lib/healthie/lab-sync.ts` — SiPhox→Healthie biomarker forwarding pattern
- `lib/healthie/schemas.ts` — Zod schemas showing response shapes

#### siphox-api refresh
- `.claude/skills/siphox-api/SKILL.md` — current content; add the Known repo bug gotcha only
- `lib/siphox/client.ts` lines 78–85 — the `Bearer` bug location

### Planning requirements
- `.planning/REQUIREMENTS.md` §Phase 6 — SKL-01, SKL-02, SKL-04, SKL-05 (SKL-03 dropped per D-12)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.claude/skills/siphox-api/SKILL.md`: Template/reference for format — copy structure (frontmatter with trigger description, Overview, Gotchas, Quick reference table, When implementing, CULTR integration patterns)

### Established Patterns
- `.gitignore` already has `!.claude/skills/siphox-api/` exception under a `# Project-specific skills (shared with team)` comment block — append new exceptions under this same block
- `lib/healthie/client.ts` uses `Authorization: Basic <API_KEY>` and `AuthorizationSource: API` headers — this is the #1 gotcha that catches people (JWT-trained sessions assume Bearer)
- `lib/payments/corepay-gateway.ts` uses native `fetch()` via `gatewayFetch()` — no npm SDK. This is the architectural pattern all Phase 7 helpers must follow.

### Integration Points
- The corepay skill directly guides Phase 7 plan creation — it's a spec document, not just documentation
- The healthie skill's events catalogue feeds Phase 8 dispatcher design

</code_context>

<specifics>
## Specific Ideas

- Corepay skill Vocabulary section: include the URL `developer.crossborder.corpay.com` as the specific "do not use this URL" trap reference
- Corepay skill: mark Phase 7 unimplemented sections with HTML comments so they're visible in the markdown source but don't interrupt reading
- SiPhox refresh: the new gotcha should reference the specific line number `lib/siphox/client.ts:80` so the reader can jump directly to the bug

</specifics>

<deferred>
## Deferred Ideas

- **SKL-03 (corpay-crossborder skill)** — Dropped from Phase 6. Corpay (Fleetcor) has zero presence in the source code; a disambiguation guard skill adds noise without value. If creator international payouts are ever scoped, a Corpay research skill can be created then.
- **siphox-api full review** — The refresh in Phase 6 is targeted (one new gotcha). A full review + expansion of the siphox skill (e.g., adding references/ subdir content like endpoints.md) is deferred to after Phase 13 when the `Bearer`→`Token` bug is fixed.

</deferred>

---

*Phase: 6-skills*
*Context gathered: 2026-05-01*
