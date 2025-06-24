# BCVT Menu - Web Scraper CLI

A Node.js CLI tool built with TypeScript that scrapes web pages and dumps the scraped payload in JSON format.

## Features

- **General web scraping** - Extract comprehensive data from any website
- **Bulgarian menu scraping** - Specialized extraction for BCVT restaurant menus using proper HTML selectors
- **JSON output** - Clean, structured data format
- **Chrome-like requests** - Stealth headers to avoid detection
- **TypeScript support** - Full type safety and modern development
- **Comprehensive testing** - Jest test suite with 7/7 tests passing
- **Code quality** - ESLint integration for clean code
- **Flexible CLI** - Multiple commands and output options using yargs

## Installation

```bash
# Install dependencies
yarn install

# Build the project
yarn build
```

## Usage

The CLI tool supports two modes: general web scraping and specialized Bulgarian menu scraping.

### General Web Scraping

```bash
# Run in development mode
yarn dev <url> [options]

# Examples
yarn dev https://example.com
yarn dev https://example.com --pretty
yarn dev https://example.com --output result.json
```

### Bulgarian Menu Scraping

For Bulgarian restaurant menus (specifically BCVT format), use the `menu` command:

```bash
# Scrape a Bulgarian menu
yarn dev menu <url> [options]

# Real example with BCVT restaurant menu
yarn dev menu https://bcvt.eu/L/S/21254/m/Dirkhlbn --pretty
yarn dev menu https://bcvt.eu/L/S/21254/m/Dirkhlbn --output menu.json
```

### Production Usage

```bash
# Build and run general scraping
yarn build
yarn start <url> [options]
node dist/cli.js https://example.com --pretty

# Build and run menu scraping
node dist/cli.js menu https://bcvt.eu/L/S/21254/m/Dirkhlbn --pretty
```

### Command Options

#### General Scraping: `bcvt-menu <url>`
- `<url>` - URL to scrape (required)
- `-o, --output <file>` - Output file (defaults to stdout)
- `-p, --pretty` - Pretty print JSON output
- `-h, --help` - Display help information

#### Menu Scraping: `bcvt-menu menu <url>`
- `<url>` - URL to scrape menu from (required)
- `-o, --output <file>` - Output file (defaults to stdout)
- `-p, --pretty` - Pretty print JSON output
- `-h, --help` - Display help information

## Development

### Available Scripts

- `yarn build` - Build the TypeScript project
- `yarn dev <url>` - Run general scraping in development mode
- `yarn dev menu <url>` - Run menu scraping in development mode
- `yarn test` - Run Jest tests (7/7 passing)
- `yarn test:watch` - Run tests in watch mode
- `yarn lint` - Run ESLint code quality checks
- `yarn lint:fix` - Run ESLint with auto-fix
- `yarn clean` - Remove build artifacts

### Project Structure

```
src/
├── cli.ts              # CLI entry point with yargs commands
├── scraper.ts          # Core scraping & menu extraction
├── index.ts            # Main exports
└── __tests__/          # Jest test files
    └── scraper.test.ts # 7 comprehensive tests
```

### Real-World Usage Examples

```bash
# Extract complete website data
yarn dev https://github.com/microsoft/vscode --pretty

# Get Bulgarian restaurant menu for today
yarn dev menu https://bcvt.eu/L/S/21254/m/Dirkhlbn --pretty

# Save menu data to file for processing
yarn dev menu https://bcvt.eu/L/S/21254/m/Dirkhlbn -o daily-menu.json

# Production usage after building
yarn build
node dist/cli.js menu https://bcvt.eu/L/S/21254/m/Dirkhlbn --pretty
```

## Output Formats

### General Web Scraping Output

The general scraping tool extracts comprehensive web page data:

```json
{
  "url": "https://example.com",
  "title": "Page Title",
  "meta": {
    "description": "Page description",
    "keywords": "keyword1, keyword2",
    "author": "Author name"
  },
  "headings": {
    "h1": ["Main heading"],
    "h2": ["Sub heading 1", "Sub heading 2"],
    "h3": ["Sub sub heading"]
  },
  "links": [
    {
      "text": "Link text",
      "href": "https://link-url.com"
    }
  ],
  "images": [
    {
      "src": "image.jpg",
      "alt": "Image description"
    }
  ],
  "text": "All page text content...",
  "scrapedAt": "2023-10-01T12:00:00.000Z"
}
```

### Bulgarian Menu Scraping Output

The menu scraping extracts structured restaurant menu data:

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

**Real Example Output:**
When scraping `https://bcvt.eu/L/S/21254/m/Dirkhlbn`, you get 21 Bulgarian dishes with their names in Cyrillic and prices in лв (Bulgarian leva).

## License

MIT 