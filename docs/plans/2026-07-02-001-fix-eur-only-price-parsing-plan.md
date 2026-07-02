---
title: "fix: EUR-only price parsing for BCVT scraper"
date: 2026-07-02
type: fix
origin: docs/brainstorms/2026-07-02-eur-only-price-parsing-requirements.md
depth: lightweight
---

# fix: EUR-only Price Parsing for BCVT Scraper

## Summary

Update the BCVT price parser to capture the euro amount the source now publishes. Extract `€` when present (currency `"EUR"`) and fall back to `лв` only when no euro is shown. Historical `лв` data is left untouched; the `currency` field distinguishes old entries from new.

## Problem Frame

The source at `https://bcvt.eu/L/S/21254/m/Dirkhlbn` dropped the Bulgarian lev from its price display during Bulgaria's euro changeover and now shows euro only (e.g. `1.02 €`). The parser in `src/utils/extractMenuData.ts` matches price text with `/(\d+\.\d+)\s*(лв)/`, which requires the `лв` suffix. Against euro-only markup that regex matches nothing, so every meal is skipped and `extractMenuData` returns an empty `meals` array — a silent failure that stops price-history capture with no error raised. The date-heading regex is unaffected and still parses the current heading.

## Requirements

Carried from origin (`docs/brainstorms/2026-07-02-eur-only-price-parsing-requirements.md`).

- R1. When a price line contains a euro amount, extract that amount as `price` and record `currency` as `"EUR"`.
- R2. When a price line has no euro amount but does have a `лв` amount, extract the `лв` amount as `price` and record `currency` as `"лв"`.
- R3. When a price line contains both `лв` and euro (dual display), use the euro amount and record `currency` as `"EUR"`.
- R4. When a price line contains neither a recognizable euro nor `лв` amount, skip the meal (unchanged behavior).
- R5. Date-heading extraction is unchanged.
- R6. Historical price entries in `db/*/merged.json` are not modified by this change.

---

## Key Technical Decisions

- **Prefer EUR, fall back to `лв` via two-stage matching** (see origin: `docs/brainstorms/2026-07-02-eur-only-price-parsing-requirements.md`): attempt a euro match first; only if it fails attempt the `лв` match. A single combined regex can't express "prefer euro when both are present" cleanly, and euro-first ordering satisfies R1–R3 in one code path.
- **Record the euro currency as `"EUR"`** (ISO code), not the displayed `"€"` glyph, for stable string comparison in `src/merge.ts` dedup and for downstream consumers. The `лв` fallback keeps recording `"лв"` as today.
- **No data migration** (R6): the per-meal series in `db/*/merged.json` stays mixed-currency across the switchover; the `currency` field carries the distinction. Out of scope for this plan.

---

## Implementation Units

### U1. Prefer-EUR price parsing in `extractMenuData`

- **Goal:** Parse the euro price the source now emits, falling back to `лв`, and record the correct `currency`.
- **Requirements:** R1, R2, R3, R4, R5, R6.
- **Dependencies:** none.
- **Files:**
  - `src/utils/extractMenuData.ts` — replace the `лв`-only price match with euro-preferred, `лв`-fallback extraction.
  - `src/__tests__/scraper.test.ts` — update the existing dual-format expectation and add format-coverage cases.
- **Approach:** Where the code currently computes `priceMatch` from `/(\d+\.\d+)\s*(лв)/`, first try to match a euro amount (a decimal number immediately followed by optional whitespace and `€`); on a hit, set `price` to the numeric portion and `currency` to `"EUR"`. On a miss, try the existing `лв` match and set `currency` to `"лв"`. If neither matches, `return` early to skip the meal (preserving current behavior). The euro-first regex naturally selects the trailing `2.05 €` from a dual `4.20 лв. / 2.05 €` string. Weight/unit parsing from `small.quiet` and image/EAN extraction are unchanged.
- **Patterns to follow:** mirror the existing regex-capture-then-guard style already in `src/utils/extractMenuData.ts`; keep the early-`return` skip for unparseable products.
- **Test scenarios:**
  - Covers AE1. Euro-only price text `1.02 €` → `price` `"1.02"`, `currency` `"EUR"`.
  - Covers AE2. Dual price text `4.20 лв. / 2.05 €` → `price` `"2.05"`, `currency` `"EUR"` (euro amount, not the лв amount) — this replaces the current dual-format expectation, which asserts the лв value.
  - Covers AE3. `лв`-only price text `4.20 лв` (no euro) → `price` `"4.20"`, `currency` `"лв"`.
  - Covers AE4. Product with a name but no numeric price → meal is skipped (absent from `meals`).
  - Regression: a euro-only product carrying `small.quiet` weight (e.g. `190 гр`) still yields `weight` `"190"`, `unit` `"гр"` alongside the EUR price.
  - Regression (R5): a page whose heading has no `Меню ... за` match still returns `null`.
- **Verification:** `yarn test` passes with the updated and added cases; a live scrape of `https://bcvt.eu/L/S/21254/m/Dirkhlbn` returns a non-empty `meals` array with `price` values matching the displayed euro amounts and `currency: "EUR"`.

---

## Scope Boundaries

- In scope: euro-preferred price parsing and its test coverage in `src/utils/extractMenuData.ts` / `src/__tests__/scraper.test.ts`.
- Out of scope: converting or normalizing historical `лв` entries in `db/*/merged.json` (R6); the date-heading parser and the `02/07` date format (unaffected); how downstream consumers render or compare a mixed-currency series.

### Deferred to Follow-Up Work

- None identified.

---

## Sources & Research

- `src/utils/extractMenuData.ts` — `priceMatch` regex is the break point; euro-only markup matches nothing.
- `src/merge.ts` — builds per-meal price history; starts a new entry when `currency` changes and defaults an absent currency to `лв`. No change needed since the scraper always sets `currency`.
- `src/__tests__/scraper.test.ts` — existing dual-format fixture asserts the `лв` value and `currency: "лв"`; the prefer-EUR change flips its expected value to the euro amount and `"EUR"`.
- `db/bcvt/merged.json` — existing entries are all `currency: "лв"`, confirming the historical series is lev-denominated.
- Live source verified 2026-07-02: `1.02 €`, `2.05 €` (euro-only display).
