import { scrapeUrl } from '../scraper';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('scraper', () => {
  describe('scrapeUrl', () => {
    it('should scrape basic HTML content', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Test Page</title>
            <meta name="description" content="Test description">
            <meta name="keywords" content="test, scraping">
          </head>
          <body>
            <h1>Main Heading</h1>
            <h2>Sub Heading</h2>
            <p>Some paragraph text.</p>
            <a href="https://example.com">Example Link</a>
            <img src="test.jpg" alt="Test Image">
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({
        data: mockHtml,
      });

      const result = await scrapeUrl('https://test.com');

      expect(result).toMatchObject({
        url: 'https://test.com',
        title: 'Test Page',
        meta: {
          description: 'Test description',
          keywords: 'test, scraping',
        },
        headings: {
          h1: ['Main Heading'],
          h2: ['Sub Heading'],
          h3: [],
        },
        links: [
          {
            text: 'Example Link',
            href: 'https://example.com',
          },
        ],
        images: [
          {
            src: 'test.jpg',
            alt: 'Test Image',
          },
        ],
      });

      expect(result.text).toContain('Main Heading');
      expect(result.text).toContain('Some paragraph text');
      expect(result.scrapedAt).toBeDefined();
      expect(new Date(result.scrapedAt)).toBeInstanceOf(Date);
    });

    it('should handle axios errors', async () => {
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        message: 'Network Error',
      });
      mockedAxios.isAxiosError.mockReturnValue(true);

      await expect(scrapeUrl('https://invalid.com')).rejects.toThrow(
        'Failed to fetch https://invalid.com: Network Error'
      );
    });

    it('should handle empty HTML', async () => {
      mockedAxios.get.mockResolvedValue({
        data: '<html><body></body></html>',
      });

      const result = await scrapeUrl('https://empty.com');

      expect(result).toMatchObject({
        url: 'https://empty.com',
        title: undefined,
        meta: {
          description: undefined,
          keywords: undefined,
          author: undefined,
        },
        headings: {
          h1: [],
          h2: [],
          h3: [],
        },
        links: [],
        images: [],
        text: '',
      });
    });

    it('should use Chrome-like headers', async () => {
      const mockHtml = '<html><body><h1>Test</h1></body></html>';
      mockedAxios.get.mockResolvedValue({ data: mockHtml });

      await scrapeUrl('https://test.com');

      expect(mockedAxios.get).toHaveBeenCalledWith('https://test.com', {
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
    });
  });
}); 