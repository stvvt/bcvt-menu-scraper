import type { CommandModule } from 'yargs';
import { scrapeMenuUrl } from '../scraper';

const command: CommandModule<{}, { url: string; output?: string; pretty: boolean }> = {
  command: 'menu <url>',
  describe: 'Scrape a Bulgarian restaurant menu page and extract menu data',
  builder: (yargs) => {
    return yargs
      .positional('url', {
        describe: 'URL to scrape menu from',
        type: 'string',
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
        default: false,
      } as const);
  },
  handler: async (argv) => {
    try {
      const data = await scrapeMenuUrl(argv.url);
      const jsonOutput = argv.pretty
        ? JSON.stringify(data, null, 2)
        : JSON.stringify(data);

      if (argv.output) {
        const fs = await import('fs/promises');
        await fs.writeFile(argv.output, jsonOutput);
        console.log(`Output written to ${argv.output}`);
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
