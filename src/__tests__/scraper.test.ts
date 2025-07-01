import { scrapeUrl, extractMenuData, scrapeMenuUrl } from '../scraper';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('scraper', () => {
  describe('scrapeUrl', () => {


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

  describe('extractMenuData', () => {
    it('should extract Bulgarian menu data correctly', () => {
      const mockHtml = `
        <html>
          <body>
            <h2>Меню за 24-ти юни</h2>
            <div class="priceListHolder">
              <div class="product">
                <span class="productName">Болярска милинка</span>
                <b class="nowrap">4.20 лв</b>
              </div>
              <div class="product">
                <span class="productName">Болярска триъгълна баница</span>
                <b class="nowrap">3.20 лв</b>
              </div>
              <div class="product">
                <span class="productName">Сандвич с кайма и кашкавал</span>
                <b class="nowrap">4.00 лв</b>
              </div>
              <div class="product">
                <span class="productName">Таратор</span>
                <b class="nowrap">2.90 лв</b>
              </div>
            </div>
          </body>
        </html>
      `;

      const result = extractMenuData(mockHtml);

      expect(result).toEqual({
        date: '24-ти юни',
        meals: [
          { name: 'Болярска милинка', price: '4.20', currency: 'лв' },
          { name: 'Болярска триъгълна баница', price: '3.20', currency: 'лв' },
          { name: 'Сандвич с кайма и кашкавал', price: '4.00', currency: 'лв' },
          { name: 'Таратор', price: '2.90', currency: 'лв' }
        ]
      });
    });



    it('should return null if no menu date found', () => {
      const mockHtml = `
        <html>
          <body>
            <p>Some random content without menu header</p>
            <p>Random dish 5.00 лв</p>
          </body>
        </html>
      `;

      const result = extractMenuData(mockHtml);
      expect(result).toBeNull();
    });
  });

  describe('scrapeMenuUrl', () => {
    it('should scrape and extract menu data from URL', async () => {
      const mockHtml = `
        <html>
          <body>
            <h2>Меню за 24-ти юни</h2>
            <div class="priceListHolder">
              <div class="product">
                <span class="productName">Болярска милинка</span>
                <b class="nowrap">4.20 лв</b>
              </div>
              <div class="product">
                <span class="productName">Таратор</span>
                <b class="nowrap">2.90 лв</b>
              </div>
            </div>
          </body>
        </html>
      `;

      mockedAxios.get.mockResolvedValue({ data: mockHtml });

      const result = await scrapeMenuUrl('https://bcvt.eu/test');

      expect(result).toEqual({
        date: '24-ти юни',
        meals: [
          { name: 'Болярска милинка', price: '4.20', currency: 'лв' },
          { name: 'Таратор', price: '2.90', currency: 'лв' }
        ]
      });
    });

    it('should throw error if no menu data found', async () => {
      const mockHtml = '<html><body>No menu here</body></html>';
      mockedAxios.get.mockResolvedValue({ data: mockHtml });

      await expect(scrapeMenuUrl('https://bcvt.eu/test')).rejects.toThrow(
        'Could not extract menu data from the page'
      );
    });
  });
}); 