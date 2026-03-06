import OpenAI from 'openai';

export interface ParsedMealName {
  rawName: string;
  name: string;
  weight?: number;
  unit?: string;
  subtitle?: string;
}

interface ModelParsedMealName {
  name?: unknown;
  weight?: unknown;
  unit?: unknown;
  subtitle?: unknown;
}

type MealNameParserClient = Pick<OpenAI, 'chat'>;

const NORMALIZE_MEAL_NAME_SYSTEM_PROMPT = `
You normalize a string representing a meal name.

Rules:

* Strip numbers in parentheses from meal names e.g. (1,3,7) or /1,3,7/ (those are allergens)
* Extract weight/quantity found usually near the end of meal name into a "weight" prop (numeric, e.g. 110, 400)
* Extract the unit of measurement into a unit prop (e.g. гр, мл)
* Extract any parenthesised or slash-enclosed descriptive text usually at the end of the meal name into a subtitle prop
* The name field must be clean — no weight, unit, allergen numbers, or subtitle text
* Omit any property that has no value — do not output null props
* Use гр for grams (not г)
* Apply sentence case to the name field — capitalize the first letter of the first word only, except for proper nouns which should retain their capitalization (e.g. place names, brand names, culinary proper nouns like Брюле or Филаделфия).
* "Камбаната" is venue name, keep it part of the meal name.
`;

interface ParseMealNameOptions {
  throwOnError?: boolean;
}

const UNIT_MAP: Record<string, string> = {
  g: 'гр',
  gr: 'гр',
  гр: 'гр',
  кг: 'кг',
  ml: 'мл',
  мл: 'мл',
  l: 'л',
  л: 'л',
  бр: 'бр',
  'бр.': 'бр',
  pcs: 'бр',
  pc: 'бр',
};

const PARSE_MEAL_NAME_SCHEMA = {
  name: 'parsed_meal_name',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      name: { type: 'string' },
      weight: { type: ['number', 'null'] },
      unit: { type: ['string', 'null'] },
      subtitle: { type: ['string', 'null'] },
    },
    required: ['name', 'weight', 'unit', 'subtitle'],
  },
} as const;

function normalizeUnit(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  return UNIT_MAP[normalized] ?? normalized;
}

function normalizeParsedMealName(rawName: string, parsed: ModelParsedMealName): ParsedMealName {
  const fallbackName = rawName.trim() || rawName;

  const normalizedName = typeof parsed.name === 'string' && parsed.name.trim()
    ? parsed.name.trim()
    : fallbackName;

  const normalizedWeight = typeof parsed.weight === 'number' && Number.isFinite(parsed.weight) && parsed.weight > 0
    ? Number(parsed.weight)
    : undefined;

  const normalizedUnit = normalizeUnit(parsed.unit);

  const normalizedSubtitle = typeof parsed.subtitle === 'string' && parsed.subtitle.trim()
    ? parsed.subtitle.trim()
    : undefined;

  return {
    rawName,
    name: normalizedName,
    ...(normalizedWeight !== undefined ? { weight: normalizedWeight } : {}),
    ...(normalizedUnit ? { unit: normalizedUnit } : {}),
    ...(normalizedSubtitle ? { subtitle: normalizedSubtitle } : {}),
  };
}

function getOpenAiClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });
}

export async function parseMealName(
  rawName: string,
  model: string,
  client?: MealNameParserClient,
  options: ParseMealNameOptions = {}
): Promise<ParsedMealName> {
  const fallbackResult: ParsedMealName = { rawName, name: rawName.trim() || rawName };

  if (!rawName || !rawName.trim()) {
    return fallbackResult;
  }

  try {
    const openai = client ?? getOpenAiClient();

    const response = await openai.chat.completions.create({
      timeout: 1000,
      model,
      messages: [
        {
          role: 'system',
          content: NORMALIZE_MEAL_NAME_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: rawName,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: PARSE_MEAL_NAME_SCHEMA,
      },
      temperature: 0,
      // @ts-ignore
      reasoning_effort: 'none'
    });

    // console.log(JSON.stringify(response, null, 2));

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return fallbackResult;
    }

    const parsed = JSON.parse(content) as ModelParsedMealName;
    return normalizeParsedMealName(rawName, parsed);
  } catch (error) {
    if (options.throwOnError) {
      throw error;
    }
    return fallbackResult;
  }
}
