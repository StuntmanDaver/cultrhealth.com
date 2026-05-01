# Phase 6: Skills - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01
**Phase:** 6-skills
**Areas discussed:** Corepay skill timing, Healthie events depth, Skill file structure, Corpay skill scope

---

## Corepay Skill Timing

| Option | Description | Selected |
|--------|-------------|----------|
| Spec-forward | Document full intended API surface; mark unimplemented sections | ✓ |
| Current state only | Document only what exists in corepay-gateway.ts today | |
| Hybrid | Separate "what exists" + "planned API surface" sections | |

**User's choice:** Spec-forward

**Notes:** —

---

| Option | Description | Selected |
|--------|-------------|----------|
| Include failure mode | Explain WHY no SDK (HMAC envelope breakage) | ✓ |
| Just the rule | "No SDK" gotcha without failure mode detail | |

**User's choice:** Include failure mode

---

| Option | Description | Selected |
|--------|-------------|----------|
| Include Corpay URL trap | Reference developer.crossborder.corpay.com in Vocabulary section | ✓ |
| Name disambiguation only | No URLs, just entity descriptions | |

**User's choice:** Include the URL trap

---

## Healthie Events Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Research step — fetch from Healthie docs | Enumerate all ~120+ events in a table | ✓ |
| CULTR-used events only | ~10–15 events CULTR actively subscribes to | |
| Categories only | Event categories + link to official docs | |

**User's choice:** Research step — fetch from Healthie docs

---

Integration map areas: all four selected (patient-sync, appointment scheduling, webhook handler, lab-sync).

---

## Skill File Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Single SKILL.md only | Self-contained, no references/ subdir | ✓ |
| Match siphox-api exactly | SKILL.md + references/ subdirectory | |
| Hybrid — only for corepay | references/ for corepay only | |

**User's choice:** Single SKILL.md only

Trigger conditions: yes, follow siphox-api pattern (embedded in frontmatter description).

---

## Corpay Skill Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Warning card only | Minimal disambiguation notice | |
| Warning + API overview | Brief Corpay Cross-Border API summary | |
| Skip SKL-03 entirely | Don't create corpay-crossborder at all | ✓ |

**User's choice:** Skip SKL-03 entirely

**Notes:** User clarified that corepay.net is CULTR's actual processor. No Corpay (Fleetcor) references exist in source code — disambiguation guard skill is unnecessary. SKL-03 dropped from scope.

---

## Deferred Ideas

- **SKL-03 (corpay-crossborder skill)** — dropped. No Fleetcor/Corpay presence in source code.
- **siphox-api full review** — deferred to post-Phase 13 (after Bearer→Token bug is fixed).
