export interface DailyMenu {
  date: string;
  meals: Array<{
    name: string;
    price: string;
    currency?: string;
    imageUrl?: string;
    weight?: string;
    unit?: string;
  }>;
}

export interface PriceEntry {
  dateText: string;
  date: string;
  price: string;
  currency: string;
  weight?: string;
  unit?: string;
}

// Bulgaria's fixed euro-changeover peg: лв per EUR. Set by Council Regulation
// (EU) 2025/1408; the irrevocable rate is 1.95583 лв = 1 EUR.
const LEV_PER_EUR = 1.95583;

// Convert a price entry to integer EUR cents for cross-currency comparison,
// or null when the currency isn't one we can convert. Integer cents avoid
// floating-point equality artifacts.
function toEurCents(entry: PriceEntry): number | null {
  const amount = parseFloat(entry.price);
  if (Number.isNaN(amount)) return null;
  if (entry.currency === 'EUR') return Math.round(amount * 100);
  if (entry.currency === 'лв') return Math.round((amount / LEV_PER_EUR) * 100);
  return null;
}

// Two entries carry the same price when they match after normalizing to EUR
// at the fixed peg. Same-currency entries compare raw values as before; an
// unrecognized currency pairing counts as changed (never silently suppressed).
function pricesEqual(a: PriceEntry, b: PriceEntry): boolean {
  if (a.currency === b.currency) return a.price === b.price;
  const aCents = toEurCents(a);
  const bCents = toEurCents(b);
  if (aCents === null || bCents === null) return false;
  return aCents === bCents;
}

export interface ImageEntry {
  date: string;
  imageUrl: string;
}

export interface MergedMeal {
  name: string;
  prices: PriceEntry[];
  images: ImageEntry[];
}

export function mergeDailyMenus(
  files: Array<{ filename: string; data: DailyMenu }>
): MergedMeal[] {
  // Case-insensitive unique names, first-seen casing wins
  const nameMap = new Map<string, string>();
  for (const f of files)
    for (const m of f.data.meals)
      if (!nameMap.has(m.name.toLowerCase()))
        nameMap.set(m.name.toLowerCase(), m.name);

  const results: MergedMeal[] = [];

  for (const canonicalName of nameMap.values()) {
    const key = canonicalName.toLowerCase();

    // Collect price entries across all files
    const allPrices: PriceEntry[] = [];
    for (const f of files) {
      for (const m of f.data.meals) {
        if (m.name.toLowerCase() !== key) continue;
        if (m.price == null) continue;
        const entry: PriceEntry = {
          dateText: f.data.date,
          date: f.filename,
          price: m.price,
          currency: m.currency ?? 'лв',
        };
        if (m.weight != null) entry.weight = m.weight;
        if (m.unit != null) entry.unit = m.unit;
        allPrices.push(entry);
      }
    }

    // Deduplicate consecutive entries where price/currency/weight/unit are unchanged
    const prices: PriceEntry[] = [];
    for (const p of allPrices) {
      const prev = prices[prices.length - 1];
      if (
        !prev ||
        !pricesEqual(prev, p) ||
        prev.weight !== p.weight ||
        prev.unit !== p.unit
      ) {
        prices.push(p);
      }
    }

    // Collect image entries
    const allImages: ImageEntry[] = [];
    for (const f of files) {
      for (const m of f.data.meals) {
        if (m.name.toLowerCase() !== key) continue;
        if (m.imageUrl == null) continue;
        allImages.push({ date: f.filename, imageUrl: m.imageUrl });
      }
    }

    // Deduplicate consecutive identical imageUrls
    const images: ImageEntry[] = [];
    for (const img of allImages) {
      const prev = images[images.length - 1];
      if (!prev || prev.imageUrl !== img.imageUrl) {
        images.push(img);
      }
    }

    if (prices.length > 0) {
      results.push({ name: canonicalName, prices, images });
    }
  }

  results.sort((a, b) => a.name.localeCompare(b.name));
  return results;
}
