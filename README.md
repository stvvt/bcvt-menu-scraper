# BCVT Menu Scraper CLI

A Node.js CLI tool built with TypeScript that scrapes BCVT restaurant menus and outputs the menu data in JSON format.

## Features

- **BCVT menu extraction** - Specialized scraping for BCVT restaurant menus using proper HTML selectors
- **JSON output** - Clean, structured menu data format
- **Chrome-like requests** - Stealth headers to avoid detection
- **TypeScript support** - Full type safety and modern development
- **Comprehensive testing** - Jest test suite with 7/7 tests passing
- **Code quality** - ESLint integration for clean code
- **CLI interface** - Command-line tool with output options using yargs

## Installation

```bash
# Install dependencies
yarn install

# Build the project
yarn build
```

## Usage

This CLI tool is specifically designed to scrape BCVT restaurant menus.

### BCVT Menu Scraping

```bash
# Scrape a BCVT menu
yarn dev <url> [options]

# Real example with BCVT restaurant menu
yarn dev https://bcvt.eu/L/S/21254/m/Dirkhlbn --pretty
yarn dev https://bcvt.eu/L/S/21254/m/Dirkhlbn --output menu.json
```

### Production Usage

```bash
# Build and run BCVT menu scraping
yarn build
yarn start <url> [options]

# Use the binary directly after building
node dist/cli.js https://bcvt.eu/L/S/21254/m/Dirkhlbn --pretty
```

### Command Options

#### BCVT Menu Scraping: `bcvt-menu <url>`
- `<url>` - BCVT menu URL to scrape (required)
- `-o, --output <file>` - Output file (defaults to stdout)
- `-p, --pretty` - Pretty print JSON output
- `-h, --help` - Display help information

## Development

### Available Scripts

- `yarn build` - Build the TypeScript project
- `yarn dev <url>` - Run BCVT menu scraping in development mode
- `yarn test` - Run Jest tests (7/7 passing)
- `yarn test:watch` - Run tests in watch mode
- `yarn lint` - Run ESLint code quality checks
- `yarn lint:fix` - Run ESLint with auto-fix
- `yarn clean` - Remove build artifacts

### Project Structure

```
src/
├── cli.ts              # CLI entry point with yargs commands
├── scraper.ts          # Core BCVT menu extraction
├── index.ts            # Main exports
└── __tests__/          # Jest test files
    └── scraper.test.ts # 7 comprehensive tests
```

### Real-World Usage Examples

```bash
# Get BCVT restaurant menu for today
yarn dev https://bcvt.eu/L/S/21254/m/Dirkhlbn --pretty

# Save menu data to file for processing
yarn dev https://bcvt.eu/L/S/21254/m/Dirkhlbn -o daily-menu.json

# Production usage after building
yarn build
node dist/cli.js https://bcvt.eu/L/S/21254/m/Dirkhlbn --pretty
```

## Output Format

The BCVT menu scraper extracts structured restaurant menu data:

```json
{
  "date": "24-ти юни",
  "meals": [
    {
      "name": "Болярска милинка",
      "price": "4.20"
    },
    {
      "name": "Болярска триъгълна баница", 
      "price": "3.20"
    },
    {
      "name": "Таратор",
      "price": "2.90"
    },
    {
      "name": "Пастицио със сос болонезе",
      "price": "7.90"
    }
  ]
}
```

## License

MIT 