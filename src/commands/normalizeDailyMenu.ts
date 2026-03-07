import type { CommandModule } from 'yargs';
import type { MenuData } from '../scraper';
import fs from 'fs/promises';
import normalizeMeal from '../utils/normalizeMeal';

const command: CommandModule<{}, { file: string; model: string; pretty: boolean }> = {
  command: 'normalize-daily-menu <file>',
  describe: 'Normalize meal names in a daily menu file',
  builder: (yargs) => {
    return yargs
      .positional('file', {
        describe: 'Daily menu file to normalize',
        type: 'string',
        demandOption: true,
      } as const)
      .option('model', {
        alias: 'm',
        type: 'string',
        description: 'OpenAI model to use',
        default: process.env.OPENAI_MODEL!,
      } as const)
      .option('pretty', {
        alias: 'p',
        type: 'boolean',
        description: 'Pretty print JSON output',
        default: true,
      } as const);
  },
  handler: async (argv) => {
    try {
      const file = await fs.readFile(argv.file, 'utf8');
      const data = JSON.parse(file) as MenuData;
      const normalizedMeals: MenuData['meals'] = [];
      for (const meal of data.meals) {
        const normalizedMeal = await normalizeMeal(meal, argv.model);
        normalizedMeals.push(normalizedMeal);
      }
      const output = {
        ...data,
        meals: normalizedMeals,
      };
      const jsonOutput = argv.pretty
        ? JSON.stringify(output, null, 2)
        : JSON.stringify(output);
      console.log(jsonOutput);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  },
};

export default command;
