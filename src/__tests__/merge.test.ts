import { mergeDailyMenus, type DailyMenu } from '../merge';

type MealInput = {
  name: string;
  price: string;
  currency?: string;
  weight?: string;
  unit?: string;
};

function daily(filename: string, date: string, meals: MealInput[]) {
  return {
    filename,
    data: { date, meals } as unknown as DailyMenu,
  };
}

function pricesFor(name: string, files: ReturnType<typeof daily>[]) {
  const merged = mergeDailyMenus(files);
  const meal = merged.find((m) => m.name === name);
  return meal ? meal.prices : [];
}

describe('mergeDailyMenus cross-currency dedup', () => {
  it('AE1: лв followed by peg-equal EUR produces one entry, лв stays latest', () => {
    const prices = pricesFor('Риба', [
      daily('2025-09-05', '05/09', [
        { name: 'Риба', price: '8.90', currency: 'лв', weight: '200', unit: 'гр' },
      ]),
      daily('2026-07-03', '03/07', [
        { name: 'Риба', price: '4.55', currency: 'EUR', weight: '200', unit: 'гр' },
      ]),
    ]);
    expect(prices).toHaveLength(1);
    expect(prices[0]).toMatchObject({ price: '8.90', currency: 'лв' });
  });

  it('AE2: лв followed by non-peg EUR produces two entries', () => {
    const prices = pricesFor('Риба', [
      daily('2025-09-05', '05/09', [
        { name: 'Риба', price: '8.90', currency: 'лв' },
      ]),
      daily('2026-07-03', '03/07', [
        { name: 'Риба', price: '4.60', currency: 'EUR' },
      ]),
    ]);
    expect(prices).toHaveLength(2);
    expect(prices[1]).toMatchObject({ price: '4.60', currency: 'EUR' });
  });

  it('AE3: weight change produces two entries even when price matches through the peg', () => {
    const prices = pricesFor('Риба', [
      daily('2025-09-05', '05/09', [
        { name: 'Риба', price: '8.90', currency: 'лв', weight: '200', unit: 'гр' },
      ]),
      daily('2026-07-03', '03/07', [
        { name: 'Риба', price: '4.55', currency: 'EUR', weight: '250', unit: 'гр' },
      ]),
    ]);
    expect(prices).toHaveLength(2);
  });

  it('AE4: identical EUR entries produce one entry', () => {
    const prices = pricesFor('Риба', [
      daily('2026-07-03', '03/07', [
        { name: 'Риба', price: '4.55', currency: 'EUR', weight: '200', unit: 'гр' },
      ]),
      daily('2026-07-04', '04/07', [
        { name: 'Риба', price: '4.55', currency: 'EUR', weight: '200', unit: 'гр' },
      ]),
    ]);
    expect(prices).toHaveLength(1);
  });

  it('reverse direction: EUR followed by peg-equal лв produces one entry', () => {
    const prices = pricesFor('Риба', [
      daily('2026-07-03', '03/07', [
        { name: 'Риба', price: '4.55', currency: 'EUR' },
      ]),
      daily('2026-07-04', '04/07', [
        { name: 'Риба', price: '8.90', currency: 'лв' },
      ]),
    ]);
    expect(prices).toHaveLength(1);
    expect(prices[0]).toMatchObject({ price: '4.55', currency: 'EUR' });
  });

  it('absent currency defaults to лв and dedups against peg-equal EUR', () => {
    const prices = pricesFor('Риба', [
      daily('2025-07-03', '03/07', [{ name: 'Риба', price: '8.90' }]),
      daily('2026-07-03', '03/07', [
        { name: 'Риба', price: '4.55', currency: 'EUR' },
      ]),
    ]);
    expect(prices).toHaveLength(1);
    expect(prices[0]).toMatchObject({ price: '8.90' });
  });

  it('unparseable price in a cross-currency pair is not silently merged', () => {
    const prices = pricesFor('Риба', [
      daily('2025-09-05', '05/09', [
        { name: 'Риба', price: 'по договаряне', currency: 'лв' },
      ]),
      daily('2026-07-03', '03/07', [
        { name: 'Риба', price: '4.55', currency: 'EUR' },
      ]),
    ]);
    expect(prices).toHaveLength(2);
  });

  it('unrecognized currency pairing counts as changed, never suppressed', () => {
    const prices = pricesFor('Риба', [
      daily('2025-09-05', '05/09', [
        { name: 'Риба', price: '8.90', currency: 'лв' },
      ]),
      daily('2026-07-03', '03/07', [
        { name: 'Риба', price: '4.55', currency: 'USD' },
      ]),
    ]);
    expect(prices).toHaveLength(2);
  });

  it('rounding boundary: near-miss conversion counts as a real change', () => {
    // 8.99 лв / 1.95583 = 4.5965 -> 460 cents; 4.59 EUR -> 459 cents
    const prices = pricesFor('Риба', [
      daily('2025-09-05', '05/09', [
        { name: 'Риба', price: '8.99', currency: 'лв' },
      ]),
      daily('2026-07-03', '03/07', [
        { name: 'Риба', price: '4.59', currency: 'EUR' },
      ]),
    ]);
    expect(prices).toHaveLength(2);
  });
});

describe('mergeDailyMenus same-currency dedup (regression)', () => {
  it('same лв price collapses to one entry', () => {
    const prices = pricesFor('Риба', [
      daily('2025-07-03', '03/07', [
        { name: 'Риба', price: '8.90', currency: 'лв' },
      ]),
      daily('2025-08-03', '03/08', [
        { name: 'Риба', price: '8.90', currency: 'лв' },
      ]),
    ]);
    expect(prices).toHaveLength(1);
  });

  it('changed лв price produces two entries', () => {
    const prices = pricesFor('Риба', [
      daily('2025-07-03', '03/07', [
        { name: 'Риба', price: '8.90', currency: 'лв' },
      ]),
      daily('2025-08-03', '03/08', [
        { name: 'Риба', price: '9.20', currency: 'лв' },
      ]),
    ]);
    expect(prices).toHaveLength(2);
  });
});
