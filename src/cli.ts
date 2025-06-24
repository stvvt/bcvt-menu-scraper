#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { scrapeUrl, scrapeMenuUrl } from './scraper';

interface Arguments {
  url: string;
  output?: string;
  pretty?: boolean;
}

interface MenuArguments {
  url: string;
  output?: string;
  pretty?: boolean;
}

const argv = yargs(hideBin(process.argv))
  .command(
    '$0 <url>',
    'Scrape a web page and dump the scraped payload in JSON format',
    (yargs) => {
      return yargs
        .positional('url', {
          describe: 'URL to scrape',
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
    async (argv: any) => {
      try {
        const data = await scrapeUrl(argv.url);
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
    }
  )
  .command(
    'menu <url>',
    'Scrape a Bulgarian restaurant menu page and extract menu data',
    (yargs) => {
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
    async (argv: any) => {
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
    }
  )
  .version('1.0.0')
  .help()
  .alias('help', 'h')
  .alias('version', 'V')
  .example('$0 https://example.com', 'Scrape example.com and output JSON to stdout')
  .example('$0 https://example.com --pretty', 'Scrape with pretty-printed JSON')
  .example('$0 https://example.com -o result.json', 'Save output to a file')
  .example('$0 menu https://bcvt.eu/L/S/21254/m/Dirkhlbn --pretty', 'Scrape Bulgarian menu')
  .parse(); 