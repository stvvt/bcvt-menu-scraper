import type { MenuData } from '../scraper';
import { parseMealName } from './parseMealName';

type Meal = MenuData['meals'][number];

async function normalizeMeal(meal: MenuData['meals'][number], model: string): Promise<Meal> {
  console.warn('Normalizing meal:', meal.name);
  if (meal.rawName) {
    console.log('Meal already normalized:');
    return meal;
  }
  const parsed = await parseMealName(meal.name, model);
  const result = {
    ...meal,
    rawName: meal.name,
    name: parsed.name,
    weight: parsed.weight?.toString(),
    unit: parsed.unit,
    subtitle: parsed.subtitle,
  };
  console.warn('Result:', result);
  return result;
}

export default normalizeMeal;