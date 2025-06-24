# BCVT Menu - Web Scraper CLI

A Node.js CLI tool built with TypeScript that scrapes web pages and dumps the scraped payload in JSON format.

## Features

- Scrapes web pages and extracts structured data
- Outputs data in JSON format
- TypeScript support with full type safety
- Comprehensive test suite with Jest
- ESLint integration for code quality
- CLI interface with flexible options using yargs

## Installation

```bash
# Install dependencies
yarn install

# Build the project
yarn build
```

## Usage

### Development

```bash
# Run in development mode
yarn dev <url> [options]

# Examples
yarn dev https://example.com
yarn dev https://example.com --pretty
yarn dev https://example.com --output result.json
```

### Production

```bash
# Build and run
yarn build
yarn start <url> [options]

# Or use the binary directly after building
./dist/cli.js <url> [options]
```

### Options

- `<url>` - URL to scrape (required)
- `-o, --output <file>` - Output file (defaults to stdout)
- `-p, --pretty` - Pretty print JSON output
- `-h, --help` - Display help information

## Development

### Scripts

- `yarn build` - Build the TypeScript project
- `yarn dev` - Run in development mode with ts-node
- `yarn test` - Run Jest tests
- `yarn test:watch` - Run tests in watch mode
- `yarn lint` - Run ESLint
- `yarn lint:fix` - Run ESLint with auto-fix
- `yarn clean` - Remove build artifacts

### Project Structure

```
src/
├── cli.ts           # CLI entry point
├── scraper.ts       # Core scraping functionality
├── index.ts         # Main exports
└── __tests__/       # Test files
    └── scraper.test.ts
```

## Output Format

The tool extracts and returns the following data in JSON format:

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

## License

MIT 