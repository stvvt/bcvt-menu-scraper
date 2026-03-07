import type { CommandModule } from 'yargs';
import { mergeDailyMenus, type DailyMenu } from '../merge';
import fs from 'fs/promises';
import path from 'path';

const command: CommandModule<{}, { files: string[]; output?: string; pretty: boolean }> = {
  command: 'merge <files..>',
  describe: 'Merge daily menu files into a single price/image history index',
  builder: (yargs) => {
    return yargs
      .positional('files', {
        describe: 'Daily menu JSON files to merge',
        type: 'string',
        array: true,
        demandOption: true,
      } as const)
      .option('output', {
        alias: 'o',
        type: 'string',
        description: 'Output file (defaults to stdout)',
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
      const inputs: Array<{ filename: string; data: DailyMenu }> = [];
      for (const file of argv.files) {
        const raw = await fs.readFile(file, 'utf8');
        const data = JSON.parse(raw) as DailyMenu;
        const filename = path.basename(file, '.json');
        inputs.push({ filename, data });
      }
      const merged = mergeDailyMenus(inputs);
      const jsonOutput = argv.pretty
        ? JSON.stringify(merged, null, 2)
        : JSON.stringify(merged);

      if (argv.output) {
        await fs.writeFile(argv.output, jsonOutput);
        console.error(`Output written to ${argv.output}`);
      } else {
        console.log(jsonOutput);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  },
};

export default command;
