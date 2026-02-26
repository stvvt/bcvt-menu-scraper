import OpenAI from 'openai';

export interface ParsedMealName {
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
    name: normalizedName,
    ...(normalizedWeight !== undefined ? { weight: normalizedWeight } : {}),
    ...(normalizedUnit ? { unit: normalizedUnit } : {}),
    ...(normalizedSubtitle ? { subtitle: normalizedSubtitle } : {}),
  };
}

function getOpenAiClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required to parse meal names');
  }

  return new OpenAI({ apiKey });
}

export async function parseMealName(
  rawName: string,
  model = 'gpt-4.1-mini',
  client?: MealNameParserClient,
  options: ParseMealNameOptions = {}
): Promise<ParsedMealName> {
  const fallbackResult: ParsedMealName = { name: rawName.trim() || rawName };

  if (!rawName || !rawName.trim()) {
    return fallbackResult;
  }

  try {
    const openai = client ?? getOpenAiClient();

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You extract structured meal-name fields from Bulgarian menu text. Be conservative: when unsure, keep the original meal name and return null for uncertain optional fields.',
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
      max_tokens: 120,
    });

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
