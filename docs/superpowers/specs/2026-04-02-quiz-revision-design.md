# Quiz Revision — Design Spec

**Date:** 2026-04-02
**Goal:** Revise the recommendation quiz to reflect current staging.cultrhealth.com product offering, improve tier/therapy recommendation accuracy, and persist quiz data for analytics.

## Context

The current quiz (5 questions, client-side only) has several problems:
- Budget ranges ($500-800, $800-1000, $1000+) don't match actual pricing (Core $149-239, Catalyst+ $499, Concierge $1,049)
- No distinction between Core GLP-1 therapies (Semaglutide $149, Tirzepatide $199, Retatrutide $239)
- Zero data persistence — no way to analyze quiz responses, drop-off, or conversion
- "Experience level" question doesn't meaningfully differentiate tiers

## Revised Question Flow (7 questions)

### Q1: "What brings you to CULTR?" (visual cards, single-select, auto-advance)

| ID | Label | Emoji | Tier Scores | Med Scores |
|---|---|---|---|---|
| `weight-loss` | Lose weight | 🔥 | core: 3, catalyst: 2 | metabolic: 5 |
| `performance` | Peak performance | ⚡ | catalyst: 4, concierge: 3 | growth_factor: 4 |
| `longevity` | Live longer | 🧬 | catalyst: 4, concierge: 3 | bioregulator: 4 |
| `recovery` | Recover faster | 💪 | catalyst: 3, core: 2 | repair: 5 |
| `hormones` | Optimize hormones | 📈 | core: 3, catalyst: 4 | hormonal: 4 |
| `learn` | Learn & self-guide | 📚 | club: 5, core: 1 | *(none)* |

### Q2: "What are you experiencing?" (multi-select with Continue button)

| ID | Label | Emoji | Scores |
|---|---|---|---|
| `fatigue` | Low energy | 😴 | metabolic: 2, bioregulator: 2 |
| `weight` | Stubborn weight | ⚖️ | metabolic: 4 |
| `sleep` | Poor sleep | 🌙 | bioregulator: 3, neuropeptide: 2 |
| `focus` | Brain fog | 🧠 | neuropeptide: 4 |
| `joints` | Joint pain | 🦴 | repair: 5 |
| `libido` | Low libido | ❤️ | hormonal: 4 |
| `aging` | Feeling old | ⏳ | bioregulator: 3, growth_factor: 2 |

### Q3: "How many areas do you want to address?" (single-select, auto-advance)

| ID | Label | Tier Scores |
|---|---|---|
| `learning-only` | Just learning for now | club: 5 |
| `single-therapy` | Just one thing | core: 4 |
| `multi-therapy` | 2–3 areas | catalyst: 4 |
| `full-protocol` | Full optimization — as many as it takes | concierge: 5 |

### Q4: "Have you tried GLP-1 weight loss medications before?" (CONDITIONAL — single-select, auto-advance)

**Show condition:** Q1 answer is `weight-loss` OR Q2 answers include `weight`.
**Skip behavior:** If condition is false, skip to Q5. Progress bar and question count adjust dynamically.

| ID | Label | GLP-1 Scores |
|---|---|---|
| `never-glp1` | No, I'm brand new | semaglutide: 5 |
| `tried-sema` | Yes, I've tried one before | tirzepatide: 5 |
| `tried-multiple` | Yes, I've tried multiple | retatrutide: 5 |
| `not-sure` | Not sure | semaglutide: 3 |

### Q5: "How much provider access do you want?" (single-select, auto-advance)

| ID | Label | Tier Scores |
|---|---|---|
| `self-guided` | I'll handle it myself | club: 5 |
| `light-touch` | Check-ins when I need them | core: 3 |
| `regular` | Regular guidance (2x/month) | catalyst: 4 |
| `white-glove` | Unlimited — I want a full care team | concierge: 5 |

### Q6: "How much are you willing to invest in your health monthly?" (single-select, auto-advance)

| ID | Label | Tier Scores |
|---|---|---|
| `free` | $0 — just exploring | club: 5 |
| `starter` | $149 – $239/mo | core: 4 |
| `committed` | $499/mo | catalyst: 4 |
| `all-in` | $1,049/mo | concierge: 5 |

### Q7: "What matters most to you?" (single-select, triggers results)

| ID | Label | Tier Scores | GLP-1 Scores |
|---|---|---|---|
| `affordability` | Keeping costs low | core: 3, club: 2 | semaglutide: 2 |
| `results` | Getting the best results | catalyst: 3 | retatrutide: 2 |
| `convenience` | Having everything handled for me | concierge: 4 | *(none)* |
| `education` | Understanding what I'm putting in my body | club: 3 | *(none)* |

## Scoring Engine

### Tier Recommendation (unchanged algorithm)
1. Accumulate tier scores (club, core, catalyst, concierge) from all answered questions
2. Highest score wins → `recommendedTier`
3. Ties broken by: concierge > catalyst > core > club (upgrade bias)

### GLP-1 Therapy Recommendation (new)
1. Only runs when `recommendedTier === 'core'`
2. Accumulate GLP-1 sub-scores (semaglutide, tirzepatide, retatrutide) from Q4 + Q7
3. Highest score wins → `coreTherapy` (uses `CORE_THERAPIES` from `plans.ts`)
4. Default fallback: semaglutide (lowest cost, safest entry point)
5. If Q4 was skipped (non-weight-loss Core user), default to `undefined` — results show "Starting at $149" with all 3 options

### Medication Recommendations (unchanged)
Same category → medication mapping. Top 3 medication categories by score, deduplicated.

## Extended QuizResult Type

```typescript
export interface QuizResult {
  recommendedTier: PlanTier;
  tierName: string;
  tierPrice: number;
  recommendedMedications: { id: string; name: string; description: string }[];
  primaryGoal: string;
  coreTherapy?: CoreTherapy;  // NEW — specific GLP-1 when tier=core and determinable
}
```

## Results Page Updates

### When `coreTherapy` is defined (Core tier + specific GLP-1 recommended):
- Plan card shows therapy name: "CULTR Core — Tirzepatide"
- Price shows exact amount: "$199/mo" (not "Starting at $149")
- CTA: "Join CULTR Core" links to `/join/core?therapy=tirzepatide`

### When `coreTherapy` is undefined (Core tier but no GLP-1 context):
- Plan card shows: "CULTR Core"
- Price shows: "Starting at $149/mo"
- CTA: "Join CULTR Core" links to `/join/core` (user picks therapy on checkout page)

### All other tiers:
- No change to current behavior
- Catalyst+: "$499/mo", Concierge: "$1,049/mo", Club: "Free"

## Data Persistence

### New table: `quiz_responses` (migration `035_quiz_responses.sql`)

```sql
CREATE TABLE IF NOT EXISTS quiz_responses (
  id SERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  answers JSONB NOT NULL,
  recommended_tier TEXT NOT NULL,
  recommended_therapy TEXT,
  clicked_join BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_quiz_responses_completed_at ON quiz_responses (completed_at);
CREATE INDEX idx_quiz_responses_tier ON quiz_responses (recommended_tier);
```

### New API: `POST /api/quiz/submit`

**Request:**
```json
{
  "sessionId": "uuid-v4",
  "answers": { "primary-goal": "weight-loss", ... },
  "recommendedTier": "core",
  "recommendedTherapy": "tirzepatide"
}
```

**Response:** `{ success: true }` (201) or `{ error: "..." }` (400/500)

**Validation:** Zod schema — sessionId required string, answers required object, recommendedTier must be valid PlanTier, recommendedTherapy optional string.

### Join click tracking: `PATCH /api/quiz/submit`

**Request:** `{ "sessionId": "uuid-v4" }`
**Action:** `UPDATE quiz_responses SET clicked_join = true WHERE session_id = $1`

### Client-side integration:
1. Generate `sessionId` (crypto.randomUUID()) when quiz starts
2. On results render: fire `POST /api/quiz/submit` (fire-and-forget, no await blocking UI)
3. On Join CTA click: fire `PATCH /api/quiz/submit` before `router.push()` navigation

## Conditional Question Logic (QuizClient)

The component needs to handle Q4 being conditionally shown:

```typescript
// Compute active questions based on current answers
function getActiveQuestions(answers: Record<string, string | string[]>): QuizQuestion[] {
  return QUIZ_QUESTIONS.filter(q => {
    if (q.id === 'glp1-history') {
      const goal = answers['primary-goal'];
      const symptoms = answers['symptoms'] as string[] | undefined;
      return goal === 'weight-loss' || symptoms?.includes('weight');
    }
    return true;
  });
}
```

Progress bar and "X of Y" counter use `activeQuestions.length` instead of `QUIZ_QUESTIONS.length`.

## Join Page Integration

`app/join/[tier]/page.tsx` reads optional `?therapy=` search param:
- If present and matches a valid `CORE_THERAPIES` slug, pre-select that therapy in the Core therapy selector
- If absent or invalid, show the normal therapy selector (no pre-selection)
- This is a minor change — just reading the search param and setting initial state.

## Files to Modify

| File | Change Type | Description |
|---|---|---|
| `lib/config/quiz.ts` | **Major rewrite** | 7 new questions, extended types, updated scoring engine with GLP-1 sub-scores, conditional question metadata |
| `app/quiz/QuizClient.tsx` | **Major update** | Conditional question flow, session ID, API calls for persistence, updated results view for Core therapy |
| `app/api/quiz/submit/route.ts` | **New file** | POST (save response) + PATCH (track join click) |
| `migrations/035_quiz_responses.sql` | **New file** | quiz_responses table + indexes |
| `app/join/[tier]/page.tsx` | **Minor update** | Read `?therapy=` query param, pre-select Core therapy |

## Verification

1. **Quiz flow:** Navigate to `/quiz`, complete quiz with weight-loss goal → verify 7 questions shown, Q4 (GLP-1 history) appears
2. **Quiz flow (non-weight):** Complete quiz with "Peak performance" goal, no "Stubborn weight" symptom → verify 6 questions shown, Q4 skipped
3. **Core recommendation:** Answer to drive Core tier + specific GLP-1 → verify results show exact therapy and price
4. **Non-Core recommendation:** Drive to Catalyst+ → verify results show $499/mo with no `coreTherapy`
5. **Data persistence:** After quiz completion, query `SELECT * FROM quiz_responses` → verify row with correct answers JSON
6. **Join click tracking:** Click "Join" CTA, verify `clicked_join = true` in DB
7. **Join page pre-selection:** Follow `/join/core?therapy=tirzepatide` → verify Tirzepatide is pre-selected
8. **Progress bar:** Verify progress bar shows correct count (6/6 or 7/7) based on conditional question
