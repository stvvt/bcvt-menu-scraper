---
title: "Cross-Currency Merge Dedup - Plan"
date: 2026-07-03
type: fix
topic: cross-currency-merge-dedup
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-brainstorm
execution: code
---

# Cross-Currency Merge Dedup - Plan

## Goal Capsule

- **Objective:** Stop the merge from recording a new price entry when only the display currency changed (лв → EUR) and the real price is unchanged.
- **Product authority:** This document; decisions confirmed in dialogue on 2026-07-03. Product Contract unchanged by planning.
- **Open blockers:** None.
- **Stop conditions:** Surface rather than guess if the rebuild diff removes anything other than currency-only entries, or if real data shows a лв/EUR pair that should match but differs by more than rounding.

---

## Product Contract

### Summary

Teach the merge dedup that лв and EUR prices are comparable through Bulgaria's fixed peg (1.95583 лв per EUR). A new scrape entry is recorded only when the price — normalized to EUR — or the weight/unit actually changed. Currency-only transitions are suppressed; the standing лв entry persists until a genuine change.

### Problem Frame

During Bulgaria's euro changeover the BCVT source switched its price display from лв to EUR. The scraper now records `currency: "EUR"` (per `docs/plans/2026-07-02-001-fix-eur-only-price-parsing-plan.md`), but the merge dedup compares `price` and `currency` as raw values. Every meal therefore gained a new price entry on the first EUR-era scrape even when the price is economically identical — e.g. "Бяла риба пане" in `db/bcvt/merged.json` gained a `4.55 EUR` entry on 2026-07-03 despite the standing `8.90 лв` entry being the same price (8.90 ÷ 1.95583 = 4.5505 → 4.55). This violates the file's core contract: entries land in `merged.json` only on real change.

### Key Decisions

- **Exact peg match, no tolerance.** Compare across currencies by converting the лв amount to EUR at the fixed rate 1.95583, rounded to the nearest cent, and requiring an exact match. This mirrors the legally mandated conversion rounding, so genuine unchanged prices always match, while a EUR price even one cent off the converted value counts as a real change.
- **The standing лв entry persists.** When a currency-only transition is suppressed, nothing is appended, rewritten, or flagged — the meal's latest entry stays лв-denominated until the venue actually changes the price. Truest to "entries only on real change"; consumers can convert via the peg for display.
- **Remediation is a rebuild, not surgery.** `merge_all.sh` regenerates `merged.json` from all daily files, so re-running it after the fix removes the spurious EUR entries from 2026-07-02 and 2026-07-03. Daily files are the untouched raw record.

### Requirements

- R1. When comparing a price entry against the previous entry in a meal's series and the currencies differ (лв vs EUR), compare their values by converting the лв amount to EUR at the fixed peg 1.95583, rounded to the nearest cent.
- R2. When the converted values match exactly and weight and unit are unchanged, the new entry is not added; the earlier entry remains the meal's latest.
- R3. When the converted values differ by any amount, the new entry is recorded as a real price change.
- R4. A change in weight or unit still starts a new entry regardless of currency.
- R5. Same-currency comparison behavior is unchanged.
- R6. Daily files under `db/*/daily/` and historical лв entries are not modified; `merged.json` is corrected by re-running the merge after the fix.

### Acceptance Examples

- AE1. **Covers R1, R2.** Given a standing entry `8.90 лв` (weight `200 гр`), when the next scrape yields `4.55 EUR` (weight `200 гр`), then no new entry is added and `8.90 лв` remains the latest.
- AE2. **Covers R3.** Given a standing entry `8.90 лв`, when the next scrape yields `4.60 EUR`, then a new `4.60 EUR` entry is recorded.
- AE3. **Covers R4.** Given a standing entry `8.90 лв` with weight `200 гр`, when the next scrape yields `4.55 EUR` with weight `250 гр`, then a new entry is recorded.
- AE4. **Covers R5.** Given a standing entry `4.55 EUR`, when the next scrape yields `4.55 EUR` with identical weight/unit, then no new entry is added (existing behavior).
- AE5. **Covers R6.** After the fix, re-running `merge_all.sh bcvt` produces a `merged.json` where "Бяла риба пане" has no 2026-07-03 entry and ends at the 2025-09-05 `8.90 лв` entry.

### Scope Boundaries

- No rewriting or normalizing historical лв entries to EUR — same stance as the 2026-07-02 parser fix.
- No tolerance window in the comparison; near-misses are real changes by definition.
- No schema additions (no currency-transition flags or markers).
- Scraper parsing and date handling are unchanged.
- How downstream consumers render a mixed-currency series is out of scope.

### Sources & Research

- `src/merge.ts` — consecutive-entry dedup compares `price`, `currency`, `weight`, `unit` as raw values; the `currency` mismatch is what admits the spurious entries.
- `merge_all.sh` / `merge.sh` — merged output is rebuilt from `db/<venue>/daily/*.json` on every run, which makes the data remediation automatic.
- `db/bcvt/merged.json` — "Бяла риба пане" shows the defect: `8.90 лв` (2025-09-05) followed by `4.55 EUR` (2026-07-03), the same price through the peg.
- `docs/plans/2026-07-02-001-fix-eur-only-price-parsing-plan.md` — the scraper-side EUR fix that introduced `currency: "EUR"` entries and deliberately left merge comparison untouched.

---

## Planning Contract

### Key Technical Decisions

- **Normalize to EUR integer cents when currencies differ.** When two consecutive entries carry different currencies, convert the лв amount to EUR cents (`amount ÷ 1.95583`, rounded to the nearest cent) and compare cent values. Integer-cent comparison avoids floating-point equality artifacts. Same-currency comparison keeps today's raw value equality untouched (R5).
- **Symmetric rule, лв is the only converted side.** The rule handles either ordering (лв then EUR, or EUR then лв) by always converting whichever side is лв. An unrecognized currency pairing falls back to current behavior — currency difference counts as a change — so the fix can never suppress an entry it doesn't understand.
- **Align price types to runtime reality (string).** `src/merge.ts` declares `price: number` in `DailyMenu` and `PriceEntry`, but daily JSON and `merged.json` both carry strings (`"8.90"`). The comparison change must parse these, so the type declarations are corrected to `string` in the same unit rather than perpetuating the lie.
- **Default absent currency to `лв`** — already the merge's behavior (`m.currency ?? 'лв'`); the conversion path relies on it for pre-2026-07-02 daily files that carry no `currency` field.

---

## Implementation Units

### U1. Cross-currency-aware dedup in the merge

- **Goal:** Consecutive entries that differ only in currency but match through the fixed peg no longer produce a new price entry.
- **Requirements:** R1, R2, R3, R4, R5.
- **Dependencies:** none.
- **Files:**
  - `src/merge.ts` — extend the consecutive-entry dedup comparison; correct `price` type declarations to `string`.
  - `src/__tests__/merge.test.ts` — new; first test coverage for the merge module.
- **Approach:** In the dedup loop, replace the bare `prev.price !== p.price || prev.currency !== p.currency` pair with a price-equality helper: same currency → compare raw values as today; лв vs EUR → convert the лв side to EUR cents at 1.95583 (nearest cent) and compare cents; any other pairing → unequal. Weight/unit comparison is unchanged and still runs regardless of the price outcome.
- **Patterns to follow:** keep the single-pass consecutive-dedup style already in `src/merge.ts`; mirror the existing test structure in `src/__tests__/scraper.test.ts` (plain jest `describe`/`it` with inline fixtures).
- **Test scenarios:**
  - Covers AE1. `8.90 лв` (weight `200 гр`) followed by `4.55 EUR` (weight `200 гр`) → one price entry; the лв entry remains latest.
  - Covers AE2. `8.90 лв` followed by `4.60 EUR` → two entries.
  - Covers AE3. `8.90 лв` weight `200 гр` followed by `4.55 EUR` weight `250 гр` → two entries (weight change wins even when price matches through the peg).
  - Covers AE4. `4.55 EUR` followed by `4.55 EUR`, identical weight/unit → one entry.
  - Reverse direction: `4.55 EUR` followed by `8.90 лв` → one entry (symmetry).
  - Entry with no `currency` field followed by the peg-equivalent EUR amount → one entry (absent currency defaults to лв).
  - Same-currency regression: `8.90 лв` followed by `9.20 лв` → two entries; `8.90 лв` followed by `8.90 лв` → one entry.
  - Rounding boundary: a лв amount whose EUR conversion rounds to a cent value one off the scraped EUR price (e.g. `8.99 лв` vs `4.59 EUR`, converted 4.5965 → 4.60) → two entries.
- **Verification:** `yarn test` passes with the new suite; existing scraper tests unaffected.

### U2. Rebuild merged data

- **Goal:** `db/bcvt/merged.json` no longer contains the spurious currency-only entries from 2026-07-02 and 2026-07-03.
- **Requirements:** R6.
- **Dependencies:** U1.
- **Files:** `db/bcvt/merged.json` — regenerated output only; no daily files touched.
- **Approach:** Rebuild via `merge_all.sh bcvt`, which regenerates the file from all `db/bcvt/daily/*.json`.
- **Execution note:** The merge scripts run the compiled `dist/` output, not `src/` — run `yarn build` before the rebuild or the fix won't be in effect.
- **Test scenarios:** Test expectation: none — deterministic data regeneration, verified by inspection (AE5).
- **Verification:** Covers AE5. "Бяла риба пане" ends at the 2025-09-05 `8.90 лв` entry with no 2026-07-03 entry; the diff against the previous `merged.json` removes only currency-only EUR entries (and their `dateText`/`date` fields), nothing else.

---

## Verification Contract

| Gate | Command / check | Proves |
|---|---|---|
| Unit tests | `yarn test` | U1 comparison behavior, all AE-linked scenarios, same-currency regression |
| Build | `yarn build` | Compiled `dist/` carries the fix before any script runs |
| Data rebuild | `./merge_all.sh bcvt` | U2 regeneration path works end to end |
| Data spot-check | Inspect `db/bcvt/merged.json` diff | Only currency-only entries removed; historical лв entries intact (AE5, R6) |

---

## Definition of Done

- All U1 test scenarios implemented and `yarn test` green.
- `db/bcvt/merged.json` regenerated after `yarn build`; spot-check confirms AE5 and that the diff removes only currency-only entries.
- Daily files under `db/bcvt/daily/` untouched (R6).
- No leftover experimental or dead-end code in the diff.
