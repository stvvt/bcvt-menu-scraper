---
date: 2026-07-02
topic: eur-only-price-parsing
---

# BCVT EUR-Only Price Parsing — Requirements

## Summary

Fix the BCVT price parser so it captures the euro amount the source now publishes. The source dropped the Bulgarian lev (`лв`) from its price display and now shows euro only (e.g. `1.02 €`). The parser must extract `€` when present and fall back to `лв` only when no euro is shown. Historical `лв` price data stays untouched.

## Problem Frame

The source menu at `https://bcvt.eu/L/S/21254/m/Dirkhlbn` used to publish each price in both лв and EUR during Bulgaria's euro-transition dual-display period (e.g. `4.20 лв. / 2.05 €`). It now shows euro only (e.g. `1.02 €`).

The price parser in `src/utils/extractMenuData.ts` matches price text with the regex `/(\d+\.\d+)\s*(лв)/`, which requires the `лв` suffix. Against euro-only markup that regex matches nothing, so every meal is skipped and `extractMenuData` returns a menu with an empty `meals` array. The failure is silent — no error is thrown, the scraper just stops capturing menu items, and downstream price history stops updating.

The date heading is not affected: the heading regex `/Меню.+за (.+)/` still matches the current heading (`Меню на Кантината за 02/07`), so date extraction continues to work.

## Key Decisions

- **Prefer EUR, fall back to `лв`.** The parser extracts the euro amount when a `€` price is present (covering both euro-only and any reappearance of dual `лв / €` display), and falls back to the `лв` amount only when no euro appears. This records euro going forward and survives a brief return of dual display without a further code change.
- **Leave historical `лв` data untouched.** Existing `лв` price entries in `db/*/merged.json` are not converted or normalized. The per-meal price series becomes mixed-currency across the switchover, and the `currency` field on each entry is what distinguishes old `лв` entries from new EUR ones. This avoids a bulk rewrite of stored data.
- **Record the euro currency as `"EUR"`.** New euro entries store the currency value `"EUR"` (ISO code, stable for downstream comparison and `merge.ts` deduplication) rather than the displayed `"€"` glyph. The `лв` fallback continues to store `"лв"` as before.

## Requirements

- R1. When a price line contains a euro amount, the parser extracts that amount as `price` and records `currency` as `"EUR"`.
- R2. When a price line contains no euro amount but does contain a `лв` amount, the parser extracts the `лв` amount as `price` and records `currency` as `"лв"`.
- R3. When a price line contains both a `лв` and a euro amount (dual display), the parser uses the euro amount and records `currency` as `"EUR"`.
- R4. When a price line contains neither a recognizable euro nor `лв` amount, the meal is skipped, preserving current behavior for unparseable lines.
- R5. Date-heading extraction is unchanged.
- R6. Historical price entries in `db/*/merged.json` are not modified by this change.

## Acceptance Examples

- AE1. **Covers R1, R3.** Given the price text `1.02 €`, when parsed, then `price` is `1.02` and `currency` is `"EUR"`.
- AE2. **Covers R3.** Given the dual price text `4.20 лв. / 2.05 €`, when parsed, then `price` is `2.05` and `currency` is `"EUR"` (the euro amount, not the лв amount).
- AE3. **Covers R2.** Given the price text `4.20 лв` with no euro, when parsed, then `price` is `4.20` and `currency` is `"лв"`.
- AE4. **Covers R4.** Given a price line with no numeric amount, when parsed, then the meal is skipped.

## Scope Boundaries

- Converting or normalizing the historical `лв` entries to EUR (or vice versa) is out of scope. The per-meal series stays mixed-currency; consumers rely on the `currency` field to interpret each entry.
- Changing the date-heading parser or the new `02/07` date format handling is out of scope — it still works.
- Changing how downstream consumers render or compare a mixed-currency price series is out of scope.

## Dependencies / Assumptions

- Assumes the source will continue to publish a decimal euro amount adjacent to a `€` symbol. Verified against the live page on 2026-07-02 (`1.02 €`, `2.05 €`).
- The fixed BGN↔EUR conversion rate (1 EUR = 1.95583 BGN) is noted only to explain the apparent price drop at the switchover; no conversion is performed by this change.

## Sources / Research

- `src/utils/extractMenuData.ts` — price parse at the `priceMatch` regex; the `лв`-only match is the break point.
- `src/merge.ts` — builds the per-meal price history; starts a new price entry whenever `currency` changes, and defaults an absent currency to `лв`.
- `src/__tests__/scraper.test.ts` — existing fixtures include лв-only, euro-only, and dual `лв / €` formats; these tests will need updating to match the prefer-EUR behavior (AE2 in particular changes the expected value from the лв amount to the euro amount).
- `db/bcvt/merged.json` — existing entries are all `currency: "лв"`, confirming the historical series is lev-denominated.
- Live source verified 2026-07-02: `https://bcvt.eu/L/S/21254/m/Dirkhlbn`.
