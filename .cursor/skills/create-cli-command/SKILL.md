---
name: create-cli-command
description: Create a new CLI command for the bcvt-menu-scraper project. Use when adding a new subcommand, CLI feature, or when the user asks to create a command.
---

# Create CLI Command

## Overview

Commands are yargs `CommandModule` objects in `src/commands/`. Each file exports a single default command, registered in `src/cli.ts`.

## Steps

1. Create `src/commands/<commandName>.ts` using the template below
2. Import and register in `src/cli.ts` with `.command(commandName)`
3. Optionally add `.example()` lines in `src/cli.ts`

## Command Template

```typescript
import type { CommandModule } from 'yargs';

const command: CommandModule<{}, { /* argv types */ }> = {
  command: 'command-name <positional>',
  describe: 'Short description for --help',
  builder: (yargs) => {
    return yargs
      .positional('positional', {
        describe: 'What this argument is',
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
        default: true,
      } as const);
  },
  handler: async (argv) => {
    try {
      // Command logic here
      const result = {};

      const jsonOutput = argv.pretty
        ? JSON.stringify(result, null, 2)
        : JSON.stringify(result);

      if (argv.output) {
        const fs = await import('fs/promises');
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
```

## Registration in cli.ts

```typescript
import commandName from './commands/commandName';

// Add to the yargs chain:
yargs(hideBin(process.argv))
  // ...existing commands...
  .command(commandName)
```

## Conventions

- **Naming**: kebab-case for `command` string, camelCase for filename
- **Common options**: `--output`/`-o` for file output, `--pretty`/`-p` for JSON formatting
- **Output**: JSON to stdout by default, stderr for status messages
- **Error handling**: try/catch → `console.error` → `process.exit(1)`
- **Variadic args**: use `<args..>` positional with `array: true`
- **Option typing**: add `as const` to each positional/option for correct inference

## Existing Commands Reference

| File | Command | Purpose |
|------|---------|---------|
| `menu.ts` | `menu <url>` | Scrape a menu URL |
| `parseMeal.ts` | `parse-meal <name>` | Parse meal name via LLM |
| `normalizeDailyMenu.ts` | `normalize-daily-menu <file>` | Normalize meals in a daily menu |
| `merge.ts` | `merge <files..>` | Merge daily menu files |
