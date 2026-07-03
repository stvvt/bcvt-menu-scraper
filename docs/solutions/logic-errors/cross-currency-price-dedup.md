---
title: Merge dedup created duplicate price entries across the лв/EUR changeover
date: 2026-07-03
category: docs/solutions/logic-errors
module: menu merge
problem_type: logic_error
component: service_object
symptoms:
  - "Every meal gained a new price entry on the first EUR-era scrape even when the price was unchanged"
  - "merged.json accumulated a 4.55 EUR entry directly after an 8.90 лв entry — the same price in two currencies"
root_cause: logic_error
resolution_type: code_fix
severity: high
tags: [currency-conversion, price-history, deduplication, eur-migration, bgn, peg]
---

# Merge dedup created duplicate price entries across the лв/EUR changeover

## Problem

The merge step appends a new price entry to a meal's history only when the price, currency, weight, or unit changes. When the BCVT source switched its display currency from Bulgarian lev to euro, every meal gained a spurious new entry on the first EUR-era scrape even though the real price was unchanged — violating the merged file's core contract that entries land only on a genuine change.

## Symptoms

- A meal like "Бяла риба пане" showed `8.90 лв` (2025-09-05) immediately followed by `4.55 EUR` (2026-07-03) — the same price expressed in two currencies (8.90 ÷ 1.95583 = 4.55).
- The effect was repo-wide: 46 currency-only duplicate entries across the merged file after the first euro scrape.

## What Didn't Work

- The upstream scraper fix that started emitting `currency: "EUR"` correctly parsed euro prices, but deliberately left the merge comparison untouched — so the raw `prev.currency !== p.currency` check still treated every currency switch as a change. Fixing the parser was necessary but not sufficient; the dedup itself had to become currency-aware.

## Solution

Make the dedup compare prices *through the fixed euro peg* instead of by raw currency/value. Normalize both sides to integer EUR cents at the legally mandated rate (1.95583 лв = 1 EUR) and compare cents; leave same-currency comparison exactly as it was.

```typescript
// Bulgaria's fixed euro-changeover peg: лв per EUR. Set by Council Regulation
// (EU) 2025/1408; the irrevocable rate is 1.95583 лв = 1 EUR.
const LEV_PER_EUR = 1.95583;

function toEurCents(entry: PriceEntry): number | null {
  const amount = parseFloat(entry.price);
  if (Number.isNaN(amount)) return null;
  if (entry.currency === 'EUR') return Math.round(amount * 100);
  if (entry.currency === 'лв') return Math.round((amount / LEV_PER_EUR) * 100);
  return null; // unknown currency -> caller treats as "changed", never merged
}

function pricesEqual(a: PriceEntry, b: PriceEntry): boolean {
  if (a.currency === b.currency) return a.price === b.price;
  const aCents = toEurCents(a);
  const bCents = toEurCents(b);
  if (aCents === null || bCents === null) return false;
  return aCents === bCents;
}
```

The consecutive-dedup check changed from comparing `price` and `currency` directly:

```typescript
// before
if (!prev || prev.price !== p.price || prev.currency !== p.currency ||
    prev.weight !== p.weight || prev.unit !== p.unit) { prices.push(p); }

// after
if (!prev || !pricesEqual(prev, p) ||
    prev.weight !== p.weight || prev.unit !== p.unit) { prices.push(p); }
```

The historical data was healed by re-running `merge_all.sh <venue>`, which regenerates the merged file from the untouched daily files — no data surgery. This also required `yarn build` first, because the merge scripts run the compiled `dist/`, not `src/`.

Two type declarations (`price` in `DailyMenu.meals[]` and `PriceEntry`) were corrected from `number` to `string` at the same time — the runtime data has always been strings like `"8.90"`; the declarations were simply wrong.

## Why This Works

The lev and euro are joined by an irrevocable fixed peg, so `8.90 лв` and `4.55 EUR` are the *same* price, not a change. Converting to integer cents (via `Math.round`) makes the comparison exact and free of floating-point equality artifacts — `4.55 * 100` yields `454.999…`, which rounds to `455`. Because the peg rounding matches the legally mandated conversion, a genuinely unchanged price always matches to the cent, while a real repricing (even one cent off) diverges and is correctly recorded. Unknown currencies and unparseable prices fall through to `null`, which the caller treats as "changed" — the safe direction, since it can never silently suppress a real entry.

## Prevention

- When a comparison keys on a unit that can change representation without changing meaning (currency, timezone, encoding, unit-of-measure), compare *normalized values*, not raw fields.
- Keep the raw-record store (here, the per-day `daily/*.json` files) immutable and treat the merged/derived file as rebuildable. Data bugs in a pure transform are then fixed by re-running the transform, not by editing history.
- Cover the safety branches explicitly. The test suite asserts that an unparseable price and an unrecognized currency both produce *two* entries (never a silent merge), so a future refactor that weakened the null-guard would fail CI. Example:

```typescript
it('unrecognized currency pairing counts as changed, never suppressed', () => {
  const prices = pricesFor('Риба', [
    daily('2025-09-05', '05/09', [{ name: 'Риба', price: '8.90', currency: 'лв' }]),
    daily('2026-07-03', '03/07', [{ name: 'Риба', price: '4.55', currency: 'USD' }]),
  ]);
  expect(prices).toHaveLength(2);
});
```

## Related Issues

- Upstream scraper fix that introduced `currency: "EUR"`: `docs/plans/2026-07-02-001-fix-eur-only-price-parsing-plan.md`
- This fix's plan: `docs/plans/2026-07-03-001-fix-cross-currency-merge-dedup-plan.md`
