import type { CommandModule } from 'yargs';
import { parseMealName } from '../utils/parseMealName';

const command: CommandModule<{}, { name: string; model?: string; pretty: boolean }> = {
  command: 'parse-meal <name>',
  describe: 'Parse a raw meal name into structured fields (name, weight, unit, subtitle)',
  builder: (yargs) => {
    return yargs
      .positional('name', {
        describe: 'Raw meal name to parse',
        type: 'string',
        demandOption: true,
      } as const)
      .option('model', {
        alias: 'm',
        type: 'string',
        description: 'OpenAI model to use',
        default: process.env.OPENAI_MODEL,
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
      const parsed = await parseMealName(argv.name, argv.model!, undefined, { throwOnError: true });
      const jsonOutput = argv.pretty
        ? JSON.stringify(parsed, null, 2)
        : JSON.stringify(parsed);

      console.log(jsonOutput);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  },
};

export default command;
