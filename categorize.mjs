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
    model: 'openai/gpt-5-nano',
    messages: [
      {
        role: 'system', 
        content: "Ти си асистент, който категоризира ястия в една от следните категории: закуски, супи, салати, десерти, предястия, основни ястия, гарнитури, напитки. Отговорът ти трябва да е точно една от изброените!"
      },
      {
        role: 'user', 
        content: `Категоризирай ястието "${dishName}"`
      }
    ],
    n: 1,
    max_tokens: 550
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