export interface DailyMenu {
  date: string;
  meals: Array<{
    name: string;
    price: number;
    currency?: string;
    imageUrl?: string;
    weight?: string;
    unit?: string;
  }>;
}

export interface PriceEntry {
  dateText: string;
  date: string;
  price: number;
  currency: string;
  weight?: string;
  unit?: string;
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
        prev.price !== p.price ||
        prev.currency !== p.currency ||
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
