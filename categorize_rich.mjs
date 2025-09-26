import { config } from 'dotenv';
import OpenAI from 'openai';

config({ path: '.env.local', debug: false });

/**
 * Categorize a dish
 * 
 * @param {string} dishName 
 * @returns {Promise<string | null>}
 */
async function categorizeDish(dishName) {
  const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
  });

  const response = await openai.chat.completions.create({
    model: 'openai/gpt-4.1-nano',
    messages: [
      {
        role: 'system',
        content: "Ти си асистент, който е запознат с българската кухня до нивото на всяка българска домакиня. Занимаваш се с описание на ястия в български заведения за обществено хранене. Описанията ти трябва да бъдат ясни и за чужденци, които за пръв път виждат тези ястия."
      },
      {
        role: 'system',
        content: "Прочитайки описанието, човек трябва да може да разбере какво е това, дори никога да не го е ял."
      },
      {
        role: 'system',
        content: "Бъди особено прецизен в описанията, когато става дума за ястия, които са уникални за България или региона, такива като дроб сърма, мусака, шопска салата и пр."
      },
      {
        role: 'system',
        content: "Когато ястието е познато на широка аудитория, в много региони, не го наричай 'традиционно българско'."
      },
      {
        role: 'system',
        content: "В случай, че ястието има различни варианти за приготвяне, опиши най-популярния."
      },
      {
        role: 'user', 
        content: `Напиши кратко описание на ястието "${dishName}" на различни езици, като върнеш описанието в полето description, заедно с името в полето name.`
      }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "dish_category",
        schema: {
          type: "object",
          description: "Информация за ястието на разни езици",
          properties: {
            bg: {
              $ref: "#/$defs/localeInfo",
            },
            en: {
              $ref: "#/$defs/localeInfo",
            },
            it: {
              $ref: "#/$defs/localeInfo",
            }
          },
          required: ["bg", "en", "it"],
          $defs: {
            localeInfo: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                },
                description: {
                  type: "string",
                }
              },
              required: ["name", "description"],
              additionalProperties: false
            }
          },
        }
      }
    },
    n: 1,
    max_tokens: 1550
  });

  if (!response.choices[0].message.content) {
    return null;
  }

  return JSON.parse(response.choices[0].message.content);
}

async function main() {
  const dishName = process.argv[2];
  try {
    const dishDescriptor = await categorizeDish(dishName);

    if (dishDescriptor) {
      console.log(JSON.stringify({ [dishName]: dishDescriptor }));
    }
  } catch (error) {
   // return null;
  }
}

main();