---
phase: 07-schema-gateway-plumbing
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - migrations/063_webhook_events.sql
  - migrations/064_provider_payment_profile_id.sql
  - migrations/065_provider_columns_remaining_tables.sql
autonomous: true
requirements: [PLB-01, PLB-02, PLB-03, PLB-04]
must_haves:
  truths:
    - "macOS-duplicate migration files at 037, 038, 039, 040 are deleted from the repo before any new migration ships"
    - "webhook_events table exists with provider-agnostic event log: (id, provider, event_id, event_type, raw_payload JSONB, processed_at) and UNIQUE (provider, event_id)"
    - "memberships.provider_payment_profile_id VARCHAR(255) column exists for CIM payment profile reference"
    - "creator_customer_portfolio.provider_subscription_id, siphox_kit_orders.provider_subscription_id, asher_orders.provider_payment_intent_id columns all exist"
    - "pending_intakes.stripe_payment_intent_id has been renamed to provider_checkout_id (column actually stores cs_* checkout session IDs)"
  artifacts:
    - path: "migrations/063_webhook_events.sql"
      provides: "Provider-agnostic webhook event log table"
      contains: "CREATE TABLE webhook_events"
    - path: "migrations/064_provider_payment_profile_id.sql"
      provides: "CIM payment profile reference on memberships"
      contains: "ALTER TABLE memberships ADD COLUMN provider_payment_profile_id"
    - path: "migrations/065_provider_columns_remaining_tables.sql"
      provides: "Provider columns on creator_customer_portfolio, siphox_kit_orders, asher_orders, pending_intakes"
      contains: "RENAME COLUMN stripe_payment_intent_id TO provider_checkout_id"
  key_links:
    - from: "migrations/063_webhook_events.sql"
      to: "app/api/webhook/corepay/route.ts (Plan 02)"
      via: "INSERT into webhook_events with UNIQUE (provider, event_id) conflict-safe idempotency"
      pattern: "ON CONFLICT \\(provider, event_id\\) DO NOTHING"
    - from: "migrations/064_provider_payment_profile_id.sql"
      to: "lib/payments/authorize-net-cim.ts (Plan 02)"
      via: "memberships.provider_payment_profile_id column populated by createCustomerPaymentProfile responses"
      pattern: "provider_payment_profile_id"
---

<objective>
Land the three Phase 7 migrations (063 webhook_events, 064 provider_payment_profile_id, 065 provider columns on remaining tables) AFTER first cleaning the four macOS-duplicate migration files (037–040) that the migration runner would otherwise double-apply.

Purpose: Prepare the database schema so Plan 02 (gateway helpers + webhook receiver) and Plan 03 (boot validation + smoke route) have the columns and tables they need. PLB-04 (duplicate cleanup) MUST run before PLB-01/02/03 apply because `scripts/run-migration.mjs` accepts any file under `migrations/`; if a glob picks up `037_generic_ehr_identity 2.sql`, it applies the same DDL twice.

Output: 3 new SQL migration files in `migrations/`, 4 macOS-duplicate files deleted, all five files committed in a single phase-07 commit.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/STATE.md
@.planning/REQUIREMENTS.md
@.planning/research/SUMMARY.md
@.claude/skills/corepay-api/SKILL.md
@migrations/004_payment_provider.sql
@scripts/run-migration.mjs

<interfaces>
<!-- Existing schema landmarks the new migrations depend on -->

From migrations/004_payment_provider.sql (already applied — Apr 2025):
- memberships.payment_provider VARCHAR(20) DEFAULT 'stripe' CHECK (payment_provider IN ('stripe','authorize_net','klarna','affirm'))
- memberships.provider_customer_id VARCHAR(255)         -- Authorize.Net customerProfileId
- memberships.provider_subscription_id VARCHAR(255)     -- Authorize.Net subscriptionId
- orders.payment_provider VARCHAR(20)
- orders.provider_transaction_id VARCHAR(255)

What 064 adds on top:
- memberships.provider_payment_profile_id VARCHAR(255)  -- Authorize.Net customerPaymentProfileId (the card-on-file inside CIM)

What 065 adds on remaining tables:
- creator_customer_portfolio.provider_subscription_id VARCHAR(255)
- siphox_kit_orders.provider_subscription_id VARCHAR(255)
- asher_orders.provider_payment_intent_id VARCHAR(255)
- pending_intakes.stripe_payment_intent_id RENAMED TO pending_intakes.provider_checkout_id  -- column actually stores cs_* checkout session IDs

From scripts/run-migration.mjs:
- Usage: node scripts/run-migration.mjs migrations/<file>.sql
- Splits on `;`, strips `--` comments, executes via @vercel/postgres `sql.query(statement)` in order.
- Picks up any file under migrations/ matching the explicit path argument (no glob), so duplicates only matter if a developer or CI loop scripts a glob.

From .planning/research/SUMMARY.md §8 — verified-present macOS dups as of 2026-04-28:
- migrations/037_generic_ehr_identity 2.sql      (sibling: 037_generic_ehr_identity.sql)
- migrations/038_membership_shipping_address 2.sql (sibling: 038_membership_shipping_address.sql)
- migrations/039_siphox_ehr_linkage 2.sql        (sibling: 039_siphox_ehr_linkage.sql)
- migrations/040_member_onboarding 2.sql         (sibling: 040_member_onboarding.sql)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Diff and delete the four macOS-duplicate migration files (PLB-04)</name>
  <files>migrations/037_generic_ehr_identity 2.sql, migrations/038_membership_shipping_address 2.sql, migrations/039_siphox_ehr_linkage 2.sql, migrations/040_member_onboarding 2.sql</files>
  <read_first>
    - CLAUDE.md (for migration runner conventions and HIPAA note about not creating files; we only DELETE here)
    - .planning/REQUIREMENTS.md (PLB-04 verbatim — diff requirement, "identical → delete; divergent → manual reconcile")
    - .planning/research/SUMMARY.md §8 (cleanup prerequisite; macOS-dup file list confirmed 2026-04-28)
    - migrations/037_generic_ehr_identity.sql (canonical sibling)
    - migrations/037_generic_ehr_identity 2.sql (duplicate to diff)
    - migrations/038_membership_shipping_address.sql (canonical sibling)
    - migrations/038_membership_shipping_address 2.sql (duplicate to diff)
    - migrations/039_siphox_ehr_linkage.sql (canonical sibling)
    - migrations/039_siphox_ehr_linkage 2.sql (duplicate to diff)
    - migrations/040_member_onboarding.sql (canonical sibling)
    - migrations/040_member_onboarding 2.sql (duplicate to diff)
  </read_first>
  <action>
    Run `git status migrations/` first to confirm none of the duplicates is staged or modified locally. Then for each pair (037, 038, 039, 040), run:

    ```bash
    diff -q "migrations/<NNN>_<name>.sql" "migrations/<NNN>_<name> 2.sql"
    ```

    Expected output for all four pairs (per SUMMARY.md §8 the dups are byte-identical to siblings — same file size, same mtime): `Files <a> and <b> differ` MUST NOT appear. Acceptable output: `(empty)` or `Files <a> and <b> are identical` (older diff implementations).

    DECISION RULES:
    - If `diff -q` exits 0 (identical) for all four pairs → proceed to delete with `git rm "migrations/<NNN>_<name> 2.sql"` (use git rm so the deletion is staged for the phase commit). Run for all four.
    - If ANY pair shows differences → STOP. Do NOT delete. Surface the divergent pair, run `diff -u <canonical> <dup>` for it, paste the unified diff into the task summary. Do not proceed to Task 2; the phase needs a developer to reconcile which content is canonical.

    After the four deletions, verify only the four canonical files remain:

    ```bash
    ls migrations/ | grep -E '^03[789]_|^040_' | grep -v ' 2\.sql$'
    ```

    Expected output (4 lines exactly):
    ```
    037_generic_ehr_identity.sql
    038_membership_shipping_address.sql
    039_siphox_ehr_linkage.sql
    040_member_onboarding.sql
    ```

    Do NOT use `rm`; always use `git rm` so the staging area reflects the deletion.
  </action>
  <verify>
    <automated>test ! -f "migrations/037_generic_ehr_identity 2.sql" && test ! -f "migrations/038_membership_shipping_address 2.sql" && test ! -f "migrations/039_siphox_ehr_linkage 2.sql" && test ! -f "migrations/040_member_onboarding 2.sql" && ls migrations/ | grep -cE ' 2\.sql$| 4\.sql$'</automated>
  </verify>
  <acceptance_criteria>
    - `test ! -f "migrations/037_generic_ehr_identity 2.sql"` exits 0 (file gone)
    - `test ! -f "migrations/038_membership_shipping_address 2.sql"` exits 0
    - `test ! -f "migrations/039_siphox_ehr_linkage 2.sql"` exits 0
    - `test ! -f "migrations/040_member_onboarding 2.sql"` exits 0
    - `ls migrations/ | grep -cE ' 2\.sql$| 4\.sql$'` returns `0` (no leftover macOS dups in any numbering range)
    - `git status migrations/` shows the four files in the "Changes to be committed" section as deleted (`D`)
    - The four canonical siblings (037/038/039/040 without the " 2") still exist and were not modified
  </acceptance_criteria>
  <done>
    Four macOS-duplicate files staged-deleted via `git rm`, four canonical siblings untouched, no other migration files modified, `git status` clean except for the four staged deletions.
  </done>
</task>

<task type="auto">
  <name>Task 2: Create migrations 063, 064, 065 (PLB-01, PLB-02, PLB-03)</name>
  <files>migrations/063_webhook_events.sql, migrations/064_provider_payment_profile_id.sql, migrations/065_provider_columns_remaining_tables.sql</files>
  <read_first>
    - .planning/REQUIREMENTS.md (PLB-01, PLB-02, PLB-03 verbatim — exact column lists, UNIQUE constraint, rename note)
    - .planning/research/SUMMARY.md §1 item 3 (idempotency rationale: Postgres UNIQUE replaces Redis)
    - .planning/research/SUMMARY.md §4.2 (one CIM customer profile per email lifetime, many payment profiles per customer profile — Authorize.Net hard limits 10 payment profiles per customer)
    - .planning/research/SUMMARY.md §4.7 (dispatcher pattern — webhook_events feeds the dispatcher in Phase 8)
    - .planning/research/SUMMARY.md §8 (table list for 065: creator_customer_portfolio, siphox_kit_orders, asher_orders, pending_intakes; pending_intakes.stripe_payment_intent_id is misnamed — it stores `cs_*` checkout session IDs, hence the rename)
    - .claude/skills/corepay-api/SKILL.md "Database columns" section (the three provider_* columns and their Authorize.Net mapping)
    - .claude/skills/corepay-api/SKILL.md gotcha #4 (HMAC verify uses request.text() before any other body access)
    - migrations/004_payment_provider.sql (already-applied baseline — DO NOT re-add provider_customer_id or provider_subscription_id on memberships; pattern to mirror for new ALTER TABLEs)
    - migrations/007_stripe_idempotency.sql (existing Stripe-only idempotency table — webhook_events replaces it post-Phase 13)
    - migrations/008_asher_med_tables.sql (asher_orders schema — verify column doesn't exist yet)
    - migrations/009_creator_affiliate_portal.sql (creator_customer_portfolio schema baseline)
    - migrations/020_siphox_tables.sql (siphox_kit_orders schema baseline)
    - scripts/run-migration.mjs (statement parsing — naive split on `;` after stripping `--` comments, so DO $$…$$ blocks break it; use dollar-quoted plpgsql function instead)
  </read_first>
  <action>
    Create three migration files in `migrations/` in a single mechanical pass. All three files use verbatim DDL pre-specified below. No design decisions to make at execution time.

    **File 1 — `migrations/063_webhook_events.sql` (PLB-01):**

    ```sql
    -- 063_webhook_events.sql
    -- Phase 7 PLB-01 — provider-agnostic webhook event log + idempotency.
    -- Replaces stripe_idempotency (migration 007) post-Phase 13.
    -- Used by: app/api/webhook/corepay/route.ts (Plan 02), and post-Phase 8 by Stripe route too.

    CREATE TABLE IF NOT EXISTS webhook_events (
      id BIGSERIAL PRIMARY KEY,
      provider VARCHAR(32) NOT NULL,
      event_id VARCHAR(255) NOT NULL,
      event_type VARCHAR(128) NOT NULL,
      raw_payload JSONB NOT NULL,
      processed_at TIMESTAMPTZ,
      received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT webhook_events_provider_event_id_unique UNIQUE (provider, event_id),
      CONSTRAINT webhook_events_provider_check CHECK (provider IN ('stripe', 'authorize_net'))
    );

    CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_event_type
      ON webhook_events (provider, event_type);

    CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at
      ON webhook_events (received_at DESC);
    ```

    Choices baked into 063:
    - `BIGSERIAL` (not SERIAL) — webhook volume across both providers will exceed 2.1B over project lifetime.
    - `provider VARCHAR(32)` — matches `memberships.payment_provider VARCHAR(20)` pattern with headroom; CHECK constraint mirrors allowed providers (stripe + authorize_net only; klarna/affirm out of scope per HRD-08 sunset).
    - `event_id VARCHAR(255)` — Stripe `evt_*` IDs ≤66 chars, Authorize.Net UUIDs are 36; 255 is provider-future safe.
    - `processed_at TIMESTAMPTZ` (nullable) — NULL = received but not yet dispatched. Plan 02 PLB-09 INSERTs with `processed_at = NOW()` since the dispatcher is a stub there.
    - UNIQUE constraint name `webhook_events_provider_event_id_unique` is what `INSERT … ON CONFLICT (provider, event_id) DO NOTHING` collides on (Plan 02 uses the column tuple).
    - NO foreign-key reference to `memberships` — webhook events arrive before membership is created (subscription.created event fires the membership INSERT).

    **File 2 — `migrations/064_provider_payment_profile_id.sql` (PLB-02):**

    ```sql
    -- 064_provider_payment_profile_id.sql
    -- Phase 7 PLB-02 — Authorize.Net CIM payment profile reference on memberships.
    -- Builds on migration 004 (which added provider_customer_id, provider_subscription_id).
    -- Authorize.Net mapping: customerPaymentProfileId — the card-on-file inside CIM.
    -- Up to 10 payment profiles per customer profile (Authorize.Net hard limit).

    ALTER TABLE memberships
      ADD COLUMN IF NOT EXISTS provider_payment_profile_id VARCHAR(255);

    CREATE INDEX IF NOT EXISTS idx_memberships_provider_payment_profile_id
      ON memberships (provider_payment_profile_id)
      WHERE provider_payment_profile_id IS NOT NULL;

    COMMENT ON COLUMN memberships.provider_payment_profile_id IS
      'Authorize.Net customerPaymentProfileId (CIM). Links membership to a specific saved card. Phase 7 PLB-02. Up to 10 per customerProfileId.';
    ```

    Choices baked into 064:
    - VARCHAR(255) — matches migration 004's `provider_customer_id` / `provider_subscription_id` pattern.
    - Partial index `WHERE provider_payment_profile_id IS NOT NULL` — avoids bloat for the long Stripe-tail of memberships that will never have this populated.
    - NO CHECK constraint — Authorize.Net can return profile IDs in numeric or alphanumeric form across versions.

    **File 3 — `migrations/065_provider_columns_remaining_tables.sql` (PLB-03):**

    The pending_intakes rename is wrapped in a `CREATE OR REPLACE FUNCTION … $func$ … $func$` block instead of a bare `DO $$…$$` block, because `scripts/run-migration.mjs` line 28 does naive `split(';')` after stripping comments. A bare `DO` block contains internal `;` characters (after `END IF` and inside SELECT statements) that the naive splitter would chop apart, breaking the migration. The `$func$` dollar-quoting hides the internal `;` from the splitter.

    ```sql
    -- 065_provider_columns_remaining_tables.sql
    -- Phase 7 PLB-03 — finish provider-column rollout to the remaining tables.
    -- Tables: creator_customer_portfolio, siphox_kit_orders, asher_orders, pending_intakes.
    -- See .planning/research/SUMMARY.md §8 for the rationale.
    -- The pending_intakes RENAME is critical — the column was misnamed; it stores cs_* checkout session IDs, NOT pi_* payment intent IDs.

    -- creator_customer_portfolio: subscription reference for creator-attributed memberships
    ALTER TABLE creator_customer_portfolio
      ADD COLUMN IF NOT EXISTS provider_subscription_id VARCHAR(255);

    CREATE INDEX IF NOT EXISTS idx_creator_customer_portfolio_provider_subscription_id
      ON creator_customer_portfolio (provider_subscription_id)
      WHERE provider_subscription_id IS NOT NULL;

    -- siphox_kit_orders: subscription reference for blood-test kit orders bound to a subscription
    ALTER TABLE siphox_kit_orders
      ADD COLUMN IF NOT EXISTS provider_subscription_id VARCHAR(255);

    CREATE INDEX IF NOT EXISTS idx_siphox_kit_orders_provider_subscription_id
      ON siphox_kit_orders (provider_subscription_id)
      WHERE provider_subscription_id IS NOT NULL;

    -- asher_orders: payment-intent reference for one-shot product orders
    ALTER TABLE asher_orders
      ADD COLUMN IF NOT EXISTS provider_payment_intent_id VARCHAR(255);

    CREATE INDEX IF NOT EXISTS idx_asher_orders_provider_payment_intent_id
      ON asher_orders (provider_payment_intent_id)
      WHERE provider_payment_intent_id IS NOT NULL;

    -- pending_intakes: rename misnamed stripe_payment_intent_id (actually stores cs_* checkout session IDs) → provider_checkout_id.
    -- Wrapped in a dollar-quoted plpgsql function (NOT a bare DO $$…$$ block) so scripts/run-migration.mjs's naive split(';') doesn't chop the body.
    CREATE OR REPLACE FUNCTION __phase7_rename_pending_intakes_column() RETURNS void AS $func$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pending_intakes' AND column_name = 'stripe_payment_intent_id')
         AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pending_intakes' AND column_name = 'provider_checkout_id')
      THEN
        EXECUTE 'ALTER TABLE pending_intakes RENAME COLUMN stripe_payment_intent_id TO provider_checkout_id';
      END IF;
    END;
    $func$ LANGUAGE plpgsql;

    SELECT __phase7_rename_pending_intakes_column();

    DROP FUNCTION __phase7_rename_pending_intakes_column();

    COMMENT ON COLUMN pending_intakes.provider_checkout_id IS
      'Provider checkout session ID (Stripe cs_*, Authorize.Net subscriptionId). Renamed from stripe_payment_intent_id in migration 065 — column was misnamed; it stores checkout session IDs, not payment intent IDs.';
    ```

    Total statement count for 065: 10 (3 ALTER TABLE + 3 CREATE INDEX + CREATE FUNCTION + SELECT + DROP FUNCTION + COMMENT). Each `;` outside the `$func$` body cleanly delimits one statement.

    Choices baked into 065:
    - All four ALTER TABLE statements use `IF NOT EXISTS` for re-run safety.
    - The pending_intakes rename uses a dollar-quoted plpgsql function (NOT a bare `DO $$…$$`) — the naive split runner would otherwise chop inside the body. The internal `EXECUTE 'ALTER TABLE …'` lets us conditionally rename, since `ALTER TABLE … RENAME COLUMN` doesn't support `IF EXISTS` in supported Postgres versions.
    - The function is dropped immediately after use so it doesn't pollute the schema.
  </action>
  <verify>
    <automated>test -f migrations/063_webhook_events.sql && test -f migrations/064_provider_payment_profile_id.sql && test -f migrations/065_provider_columns_remaining_tables.sql && grep -q "CREATE TABLE IF NOT EXISTS webhook_events" migrations/063_webhook_events.sql && grep -q "UNIQUE (provider, event_id)" migrations/063_webhook_events.sql && grep -q "raw_payload JSONB" migrations/063_webhook_events.sql && grep -q "ADD COLUMN IF NOT EXISTS provider_payment_profile_id VARCHAR(255)" migrations/064_provider_payment_profile_id.sql && grep -q "CREATE INDEX IF NOT EXISTS idx_memberships_provider_payment_profile_id" migrations/064_provider_payment_profile_id.sql && grep -q "ALTER TABLE creator_customer_portfolio" migrations/065_provider_columns_remaining_tables.sql && grep -q "ALTER TABLE siphox_kit_orders" migrations/065_provider_columns_remaining_tables.sql && grep -q "ALTER TABLE asher_orders" migrations/065_provider_columns_remaining_tables.sql && grep -q "RENAME COLUMN stripe_payment_intent_id TO provider_checkout_id" migrations/065_provider_columns_remaining_tables.sql && grep -q "CREATE OR REPLACE FUNCTION __phase7_rename_pending_intakes_column" migrations/065_provider_columns_remaining_tables.sql && ! grep -qE "^DO \\\$\\\$" migrations/065_provider_columns_remaining_tables.sql</automated>
  </verify>
  <acceptance_criteria>
    **063_webhook_events.sql (PLB-01):**
    - `test -f migrations/063_webhook_events.sql` exits 0
    - `grep -q "CREATE TABLE IF NOT EXISTS webhook_events" migrations/063_webhook_events.sql` exits 0
    - `grep -q "provider VARCHAR" migrations/063_webhook_events.sql` exits 0
    - `grep -q "event_id VARCHAR" migrations/063_webhook_events.sql` exits 0
    - `grep -q "event_type VARCHAR" migrations/063_webhook_events.sql` exits 0
    - `grep -q "raw_payload JSONB" migrations/063_webhook_events.sql` exits 0
    - `grep -q "processed_at TIMESTAMPTZ" migrations/063_webhook_events.sql` exits 0
    - `grep -q "UNIQUE (provider, event_id)" migrations/063_webhook_events.sql` exits 0
    - `grep -qE "CHECK \(provider IN \('stripe', 'authorize_net'\)\)" migrations/063_webhook_events.sql` exits 0
    - File contains no `STRIPE_*` env-var references and no Stripe-specific logic
    - Statement count: `node -e "console.log(require('fs').readFileSync('migrations/063_webhook_events.sql','utf8').split(';').filter(s=>s.trim().length).length)"` prints `3`

    **064_provider_payment_profile_id.sql (PLB-02):**
    - `test -f migrations/064_provider_payment_profile_id.sql` exits 0
    - `grep -q "ALTER TABLE memberships" migrations/064_provider_payment_profile_id.sql` exits 0
    - `grep -q "ADD COLUMN IF NOT EXISTS provider_payment_profile_id VARCHAR(255)" migrations/064_provider_payment_profile_id.sql` exits 0
    - `grep -q "CREATE INDEX IF NOT EXISTS idx_memberships_provider_payment_profile_id" migrations/064_provider_payment_profile_id.sql` exits 0
    - `grep -q "WHERE provider_payment_profile_id IS NOT NULL" migrations/064_provider_payment_profile_id.sql` exits 0
    - File contains the `COMMENT ON COLUMN` statement
    - File does NOT add `provider_customer_id` or `provider_subscription_id` (those exist from migration 004)

    **065_provider_columns_remaining_tables.sql (PLB-03):**
    - `test -f migrations/065_provider_columns_remaining_tables.sql` exits 0
    - `grep -q "ALTER TABLE creator_customer_portfolio" migrations/065_provider_columns_remaining_tables.sql` exits 0
    - `grep -q "ALTER TABLE siphox_kit_orders" migrations/065_provider_columns_remaining_tables.sql` exits 0
    - `grep -q "ALTER TABLE asher_orders" migrations/065_provider_columns_remaining_tables.sql` exits 0
    - `grep -q "RENAME COLUMN stripe_payment_intent_id TO provider_checkout_id" migrations/065_provider_columns_remaining_tables.sql` exits 0
    - `grep -q "provider_subscription_id VARCHAR(255)" migrations/065_provider_columns_remaining_tables.sql` exits 0
    - `grep -q "provider_payment_intent_id VARCHAR(255)" migrations/065_provider_columns_remaining_tables.sql` exits 0
    - `grep -cE "CREATE INDEX IF NOT EXISTS idx_(creator_customer_portfolio|siphox_kit_orders|asher_orders)_provider_" migrations/065_provider_columns_remaining_tables.sql` returns `3` (one partial index per added column)
    - `grep -q "CREATE OR REPLACE FUNCTION __phase7_rename_pending_intakes_column" migrations/065_provider_columns_remaining_tables.sql` exits 0 (dollar-quoted function guard)
    - `grep -q "DROP FUNCTION __phase7_rename_pending_intakes_column" migrations/065_provider_columns_remaining_tables.sql` exits 0 (cleanup)
    - `grep -qE "^DO \$\$" migrations/065_provider_columns_remaining_tables.sql` exits 1 (no bare DO block — would break the naive splitter)
  </acceptance_criteria>
  <done>
    Three SQL files exist with the verbatim content specified above. 063 has CREATE TABLE + 2 indexes (3 statements). 064 has ALTER TABLE + CREATE INDEX (partial) + COMMENT (3 statements). 065 has 3 ALTER TABLE + 3 CREATE INDEX + CREATE FUNCTION + SELECT + DROP FUNCTION + COMMENT (10 statements), with the pending_intakes rename guarded via a dollar-quoted plpgsql function instead of a bare DO block.
  </done>
</task>

<task type="auto">
  <name>Task 3: Apply migrations 063, 064, 065 against Neon and verify schema</name>
  <files>(no file modifications — DB-only)</files>
  <read_first>
    - scripts/run-migration.mjs (usage: node scripts/run-migration.mjs migrations/<file>.sql)
    - migrations/063_webhook_events.sql (created in Task 2)
    - migrations/064_provider_payment_profile_id.sql (created in Task 2)
    - migrations/065_provider_columns_remaining_tables.sql (created in Task 2)
    - .env (or .env.local) for `POSTGRES_URL` — must be the staging Neon DB URL, NOT production
  </read_first>
  <action>
    Apply the three new migrations IN ORDER against staging Neon. Production application is OUT OF SCOPE for Phase 7 (gated on full phase verification per ROADMAP.md success criteria).

    Step 1 — verify env points at staging:
    ```bash
    # POSTGRES_URL must contain "staging" or be the staging branch URL.
    # Surface only host (no creds): node -e "const u=new URL(process.env.POSTGRES_URL);console.log(u.host,u.pathname)"
    node -e "const u=new URL(process.env.POSTGRES_URL || require('fs').readFileSync('.env','utf8').split('\\n').find(l=>l.startsWith('POSTGRES_URL='))?.split('=')[1]?.replace(/['\"]/g,'').trim() || '');console.log(u.host || 'NO_URL', u.pathname || '')"
    ```
    Refuse to proceed if the host is the production Neon project (verify with the staging-vs-prod project IDs from CLAUDE.md if known; otherwise pause and ask). Only continue if host clearly indicates staging.

    Step 2 — apply each migration in order:
    ```bash
    node scripts/run-migration.mjs migrations/063_webhook_events.sql
    node scripts/run-migration.mjs migrations/064_provider_payment_profile_id.sql
    node scripts/run-migration.mjs migrations/065_provider_columns_remaining_tables.sql
    ```

    Each invocation must print `✓ Success` on every executed statement and exit 0.

    Step 3 — verify schema landed:
    ```bash
    node -e "
    const { sql } = require('@vercel/postgres');
    (async () => {
      // Verify webhook_events table
      const we = await sql\`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='webhook_events' ORDER BY ordinal_position\`;
      console.log('webhook_events columns:', we.rows.map(r => r.column_name).join(','));

      // Verify webhook_events UNIQUE constraint
      const wec = await sql\`SELECT conname FROM pg_constraint WHERE conrelid='webhook_events'::regclass AND contype='u'\`;
      console.log('webhook_events unique constraints:', wec.rows.map(r => r.conname).join(','));

      // Verify memberships.provider_payment_profile_id
      const m = await sql\`SELECT column_name FROM information_schema.columns WHERE table_name='memberships' AND column_name='provider_payment_profile_id'\`;
      console.log('memberships.provider_payment_profile_id exists:', m.rows.length === 1);

      // Verify creator_customer_portfolio.provider_subscription_id
      const ccp = await sql\`SELECT column_name FROM information_schema.columns WHERE table_name='creator_customer_portfolio' AND column_name='provider_subscription_id'\`;
      console.log('creator_customer_portfolio.provider_subscription_id exists:', ccp.rows.length === 1);

      // Verify siphox_kit_orders.provider_subscription_id
      const sko = await sql\`SELECT column_name FROM information_schema.columns WHERE table_name='siphox_kit_orders' AND column_name='provider_subscription_id'\`;
      console.log('siphox_kit_orders.provider_subscription_id exists:', sko.rows.length === 1);

      // Verify asher_orders.provider_payment_intent_id
      const ao = await sql\`SELECT column_name FROM information_schema.columns WHERE table_name='asher_orders' AND column_name='provider_payment_intent_id'\`;
      console.log('asher_orders.provider_payment_intent_id exists:', ao.rows.length === 1);

      // Verify pending_intakes rename: provider_checkout_id exists, stripe_payment_intent_id does not
      const pi_new = await sql\`SELECT column_name FROM information_schema.columns WHERE table_name='pending_intakes' AND column_name='provider_checkout_id'\`;
      const pi_old = await sql\`SELECT column_name FROM information_schema.columns WHERE table_name='pending_intakes' AND column_name='stripe_payment_intent_id'\`;
      console.log('pending_intakes.provider_checkout_id exists:', pi_new.rows.length === 1);
      console.log('pending_intakes.stripe_payment_intent_id exists:', pi_old.rows.length === 1, '(should be false)');
    })();
    "
    ```

    All eight printed lines must show the expected truthy results. Capture this output into the task summary.

    Step 4 — idempotency re-run check (CRITICAL — proves IF NOT EXISTS guards work):
    Re-run all three migrations a second time. They MUST exit 0 with no errors. Any error here means a non-idempotent statement slipped in and the migration files are unsafe.

    ```bash
    node scripts/run-migration.mjs migrations/063_webhook_events.sql
    node scripts/run-migration.mjs migrations/064_provider_payment_profile_id.sql
    node scripts/run-migration.mjs migrations/065_provider_columns_remaining_tables.sql
    ```

    All three exit 0. Schema unchanged.
  </action>
  <verify>
    <automated>node -e "const { sql } = require('@vercel/postgres'); (async () => { const r = await sql\`SELECT 1 FROM information_schema.tables WHERE table_name='webhook_events'\`; const m = await sql\`SELECT 1 FROM information_schema.columns WHERE table_name='memberships' AND column_name='provider_payment_profile_id'\`; const pi_new = await sql\`SELECT 1 FROM information_schema.columns WHERE table_name='pending_intakes' AND column_name='provider_checkout_id'\`; const pi_old = await sql\`SELECT 1 FROM information_schema.columns WHERE table_name='pending_intakes' AND column_name='stripe_payment_intent_id'\`; if (r.rows.length === 1 && m.rows.length === 1 && pi_new.rows.length === 1 && pi_old.rows.length === 0) { console.log('PASS'); process.exit(0); } else { console.log('FAIL', { webhook_events: r.rows.length, mem_col: m.rows.length, pi_new: pi_new.rows.length, pi_old: pi_old.rows.length }); process.exit(1); } })()"</automated>
  </verify>
  <acceptance_criteria>
    - All three migrations apply against staging Neon with `node scripts/run-migration.mjs ...` exiting 0
    - `webhook_events` table exists with columns: id, provider, event_id, event_type, raw_payload, processed_at, received_at (verified via information_schema)
    - `webhook_events` has UNIQUE constraint covering (provider, event_id) (verified via pg_constraint)
    - `memberships.provider_payment_profile_id` exists as VARCHAR(255)
    - `creator_customer_portfolio.provider_subscription_id` exists
    - `siphox_kit_orders.provider_subscription_id` exists
    - `asher_orders.provider_payment_intent_id` exists
    - `pending_intakes.provider_checkout_id` exists
    - `pending_intakes.stripe_payment_intent_id` does NOT exist (rename succeeded)
    - Re-running all three migrations a second time exits 0 with no errors (idempotency proven)
    - The verification node script (in `<verify><automated>`) prints `PASS` and exits 0
  </acceptance_criteria>
  <done>
    All three migrations applied to staging Neon, schema verified via information_schema queries, idempotency proven by clean re-run, verification script prints `PASS`.
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| developer-shell → migration runner | `scripts/run-migration.mjs` accepts ANY file path argument; a developer running a glob can apply duplicates |
| migration runner → Neon staging DB | Raw SQL via @vercel/postgres; no parameterized escaping needed for DDL |
| Neon staging DB → Neon production DB | Production application is out-of-scope for this plan; gated on full phase verification |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-07-01 | Tampering | macOS-duplicate migration files in `migrations/` | mitigate | PLB-04 deletes the four `*_2.sql` siblings via `git rm` after byte-equality diff check; if divergent, plan halts pending developer reconciliation. Without this, a future glob `node scripts/run-migration.mjs migrations/*.sql` (which the project does NOT do today, but a developer might add) would re-apply identical DDL twice. |
| T-07-02 | Denial of Service | Migration 063 webhook_events table without indexes | mitigate | Two indexes added: `(provider, event_type)` for dispatcher lookups, `(received_at DESC)` for replay UI. Without indexes, a heavy webhook queue would degrade dispatcher performance. |
| T-07-03 | Information Disclosure | webhook_events.raw_payload JSONB containing PII (Authorize.Net billing names, last-4) | accept | Plan 02 webhook handler MUST NOT log this column at INFO level. HIPAA-compliant since billing name + last-4 are NOT PHI. Future Sentry beforeSend (Plan 03 PLB-12) provides backstop scrubbing. The DDL itself is safe; the threat is in downstream logging. |
| T-07-04 | Spoofing | Webhook events with forged provider+event_id pairs | mitigate | UNIQUE (provider, event_id) prevents idempotency bypass. Combined with HMAC verification (Plan 02 PLB-08), forged events cannot collide with real ones. |
| T-07-05 | Tampering | Naive split(';') in scripts/run-migration.mjs splits inside DO $$…$$ blocks | mitigate | Migration 065 uses `CREATE OR REPLACE FUNCTION … $func$ … $func$` instead of a bare DO block. The dollar-quoted body is opaque to the naive splitter. |
| T-07-06 | Elevation of Privilege | Production Neon DB accidentally targeted from a developer shell with prod creds | mitigate | Task 3 step 1 surfaces the host of `POSTGRES_URL` and refuses to proceed if it points at production. Defense in depth: production application of migrations is OUT OF SCOPE for Phase 7. |
| T-07-07 | Information Disclosure | pending_intakes.provider_checkout_id COMMENT reveals "actually stores cs_*" | accept | Comment is documentation-as-code, visible only to DBAs with `\d pending_intakes` access. Not a leak vector. |
</threat_model>

<verification>
**Plan-level verification (run after all 3 tasks complete):**

1. macOS-dup cleanup:
   ```bash
   ls migrations/ | grep -cE ' 2\.sql$| 4\.sql$'
   ```
   Expected output: `0`

2. New migrations exist:
   ```bash
   ls -la migrations/063_webhook_events.sql migrations/064_provider_payment_profile_id.sql migrations/065_provider_columns_remaining_tables.sql
   ```
   All three files present, none empty.

3. DB schema verification (Task 3's verify script):
   ```bash
   node -e "const { sql } = require('@vercel/postgres'); (async () => { /* see Task 3 verify */ })()"
   ```
   Prints `PASS` and exits 0.

4. Idempotency proven:
   Re-running all three migrations exits 0.

5. No statement-splitter regressions:
   `grep -q '^DO \$\$' migrations/065_provider_columns_remaining_tables.sql` exits 1 (no bare DO block; uses dollar-quoted function guard instead).
</verification>

<success_criteria>
- All 4 macOS-duplicate files (037–040, " 2.sql" siblings) staged-deleted via `git rm`
- 3 new migration files (063, 064, 065) created with the exact schemas specified
- All 3 new migrations applied to staging Neon, schema verified
- All 3 new migrations are idempotent (clean re-run)
- `pending_intakes` column rename completed (stripe_payment_intent_id → provider_checkout_id)
- No production DB touched in this plan
- All `<acceptance_criteria>` automated checks pass on every task
</success_criteria>

<output>
After completion, create `.planning/phases/07-schema-gateway-plumbing/07-01-SUMMARY.md` documenting:
- Files deleted (with confirmed byte-identical diff results)
- Files created (with the row count of statements per migration)
- Schema verification output from Task 3
- Idempotency re-run timestamps
- Any deviations from plan
</output>
