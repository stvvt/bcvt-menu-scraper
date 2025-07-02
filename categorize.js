async function categorizeDish(dishName) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-4.1-nano',
      messages: [
        {
          role: 'user',
          content: `Категоризирай ястието "${dishName}" като едно от: супи, салати, десерти, предястия, основни ястие, гарнитури, напитки. Отговори с един вариант.`
        }
      ]
    })
  });

  return response.json();
}

async function main() {
  const dishName = process.argv[2];
  const result = await categorizeDish(dishName);
  const category = result.choices[0].message.content;

  if (category) {
    console.log(JSON.stringify({ [dishName]: category.trim().toLowerCase() }));
  }
}

main();