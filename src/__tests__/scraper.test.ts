import { extractMenuData, scrapeMenuUrl } from '../scraper';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('scraper', () => {
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