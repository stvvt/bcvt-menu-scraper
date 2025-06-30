#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const scraper_1 = require("./scraper");
const argv = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .command('$0 <url>', 'Scrape a web page and dump the scraped payload in JSON format', (yargs) => {
    return yargs
        .positional('url', {
        describe: 'URL to scrape',
        type: 'string',
        demandOption: true,
    })
        .option('output', {
        alias: 'o',
        type: 'string',
        description: 'Output file (defaults to stdout)',
    })
        .option('pretty', {
        alias: 'p',
        type: 'boolean',
        description: 'Pretty print JSON output',
        default: false,
    });
}, async (argv) => {
    try {
        const data = await (0, scraper_1.scrapeUrl)(argv.url);
        const jsonOutput = argv.pretty
            ? JSON.stringify(data, null, 2)
            : JSON.stringify(data);
        if (argv.output) {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await fs.writeFile(argv.output, jsonOutput);
            console.log(`Output written to ${argv.output}`);
        }
        else {
            console.log(jsonOutput);
        }
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
})
    .command('menu <url>', 'Scrape a Bulgarian restaurant menu page and extract menu data', (yargs) => {
    return yargs
        .positional('url', {
        describe: 'URL to scrape menu from',
        type: 'string',
        demandOption: true,
    })
        .option('output', {
        alias: 'o',
        type: 'string',
        description: 'Output file (defaults to stdout)',
    })
        .option('pretty', {
        alias: 'p',
        type: 'boolean',
        description: 'Pretty print JSON output',
        default: false,
    });
}, async (argv) => {
    try {
        const data = await (0, scraper_1.scrapeMenuUrl)(argv.url);
        const jsonOutput = argv.pretty
            ? JSON.stringify(data, null, 2)
            : JSON.stringify(data);
        if (argv.output) {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await fs.writeFile(argv.output, jsonOutput);
            console.log(`Output written to ${argv.output}`);
        }
        else {
            console.log(jsonOutput);
        }
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
})
    .version('1.0.0')
    .help()
    .alias('help', 'h')
    .alias('version', 'V')
    .example('$0 https://example.com', 'Scrape example.com and output JSON to stdout')
    .example('$0 https://example.com --pretty', 'Scrape with pretty-printed JSON')
    .example('$0 https://example.com -o result.json', 'Save output to a file')
    .example('$0 menu https://bcvt.eu/L/S/21254/m/Dirkhlbn --pretty', 'Scrape Bulgarian menu')
    .parse();
//# sourceMappingURL=cli.js.map