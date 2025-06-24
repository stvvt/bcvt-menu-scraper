import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedData {
  url: string;
  title?: string;
  meta: {
    description?: string;
    keywords?: string;
    author?: string;
  };
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  links: Array<{
    text: string;
    href: string;
  }>;
  images: Array<{
    src: string;
    alt?: string;
  }>;
  text: string;
  scrapedAt: string;
}

export async function scrapeUrl(url: string): Promise<ScrapedData> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
      }
    });

    const $ = cheerio.load(response.data);

    // Extract title
    const title = $('title').text().trim();

    // Extract meta information
    const meta = {
      description: $('meta[name="description"]').attr('content'),
      keywords: $('meta[name="keywords"]').attr('content'),
      author: $('meta[name="author"]').attr('content'),
    };

    // Extract headings
    const headings = {
      h1: $('h1').map((_, el) => $(el).text().trim()).get(),
      h2: $('h2').map((_, el) => $(el).text().trim()).get(),
      h3: $('h3').map((_, el) => $(el).text().trim()).get(),
    };

    // Extract links
    const links = $('a[href]').map((_, el) => ({
      text: $(el).text().trim(),
      href: $(el).attr('href') || '',
    })).get();

    // Extract images
    const images = $('img[src]').map((_, el) => ({
      src: $(el).attr('src') || '',
      alt: $(el).attr('alt'),
    })).get();

    // Extract all text content
    const text = $('body').text().replace(/\s+/g, ' ').trim();

    return {
      url,
      title: title || undefined,
      meta,
      headings,
      links,
      images,
      text,
      scrapedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
    throw error;
  }
} 