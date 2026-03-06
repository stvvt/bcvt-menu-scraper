import { config } from 'dotenv';
import OpenAI from 'openai';

config({ path: '.env.local', debug: false });

const CATEGORIES = 'закуски, супи, салати, десерти, предястия, основни ястия, гарнитури, напитки';

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
        content: `Категоризирай ястие в: ${CATEGORIES}. Отговори само с категорията.`
      },
      {
        role: 'user',
        content: dishName
      }
    ],
    max_tokens: 20
  });

  return response.choices[0].message.content;
}

async function main() {
  const dishName = process.argv[2];
  const category = await categorizeDish(dishName);

  if (category) {
    console.log(JSON.stringify({ [dishName]: category.trim().toLowerCase() }));
  }
}

main();