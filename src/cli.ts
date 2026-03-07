#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { config } from 'dotenv';
import menu from './commands/menu';
import parseMeal from './commands/parseMeal';
import normalizeDailyMenu from './commands/normalizeDailyMenu';
import merge from './commands/merge';

config({ path: '.env.local', debug: false });

yargs(hideBin(process.argv))
  .command(menu)
  .command(parseMeal)
  .command(normalizeDailyMenu)
  .command(merge)
  .version('1.0.0')
  .help()
  .alias('help', 'h')
  .alias('version', 'V')
  .example('$0 https://example.com', 'Scrape example.com and output JSON to stdout')
  .example('$0 https://example.com --pretty', 'Scrape with pretty-printed JSON')
  .example('$0 https://example.com -o result.json', 'Save output to a file')
  .example('$0 menu https://bcvt.eu/L/S/21254/m/Dirkhlbn --pretty', 'Scrape Bulgarian menu')
  .example('$0 parse-meal "Салата Бурата 400гр (розови домати, песто)"', 'Parse a meal name with LLM')
  .parse();
