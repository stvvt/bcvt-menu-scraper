import { scrapeMenuUrl } from '../scraper';
import * as scraperUtils from '../utils/extractMenuData';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('scraper', () => {
  describe('extractMenuData', () => {
    it('should prefer the euro amount from a dual лв/€ display', () => {
      const mockHtml = `
        <html>
          <body>
            <h2>Меню за 24-ти юни</h2>
            <div class="priceListHolder">
              <div class="product">
                <span><span class='productName'>Болярска милинка</span><small class="quiet"> 190 гр</small></span> <b class="nowrap" style="align-items: end; padding-left: 5px;">4.20 лв.&nbsp;/&nbsp;2.05 €</b>
              </div>
              <div class="product">
                <span><span class='productName'>Таратор</span><small class="quiet"> 150 гр</small></span> <b class="nowrap" style="align-items: end; padding-left: 5px;">2.90 лв.&nbsp;/&nbsp;2.05 €</b>
              </div>
              <div class="product" >
                  <span><span class='productName'>Наденица с праз на скара</span></span> <b class="nowrap" style="align-items: end; padding-left: 5px;">3.00 лв.&nbsp;/&nbsp;1.53 €</b>
              </div>
            </div>
          </body>
        </html>
      `;

      const result = scraperUtils.extractMenuData(mockHtml);

      expect(result).toEqual({
        date: '24-ти юни',
        meals: [
          { name: 'Болярска милинка', price: '2.05', currency: 'EUR', weight: '190', unit: 'гр', ean: undefined, imageUrl: undefined },
          { name: 'Таратор', price: '2.05', currency: 'EUR', weight: '150', unit: 'гр', ean: undefined, imageUrl: undefined },
          { name: 'Наденица с праз на скара', price: '1.53', currency: 'EUR', weight: undefined, unit: undefined, ean: undefined, imageUrl: undefined }
        ]
      });
    });

    it('should extract euro-only prices and preserve weight/unit', () => {
      const mockHtml = `
        <html>
          <body>
            <h2>Меню за 02/07</h2>
            <div class="priceListHolder">
              <div class="product">
                <span><span class='productName'>Кроасан с масло</span><small class="quiet"> 70 гр</small></span> <b class="nowrap">1.02 €</b>
              </div>
              <div class="product">
                <span><span class='productName'>Сандвич с кайма и кашкавал</span></span> <b class="nowrap">2.05 €</b>
              </div>
            </div>
          </body>
        </html>
      `;

      const result = scraperUtils.extractMenuData(mockHtml);

      expect(result).toEqual({
        date: '02/07',
        meals: [
          { name: 'Кроасан с масло', price: '1.02', currency: 'EUR', weight: '70', unit: 'гр', ean: undefined, imageUrl: undefined },
          { name: 'Сандвич с кайма и кашкавал', price: '2.05', currency: 'EUR', weight: undefined, unit: undefined, ean: undefined, imageUrl: undefined }
        ]
      });
    });

    it('should fall back to лв when no euro amount is shown', () => {
      const mockHtml = `
        <html>
          <body>
            <h2>Меню за 24-ти юни</h2>
            <div class="priceListHolder">
              <div class="product">
                <span><span class='productName'>Таратор</span></span> <b class="nowrap">2.90 лв</b>
              </div>
            </div>
          </body>
        </html>
      `;

      const result = scraperUtils.extractMenuData(mockHtml);

      expect(result).toEqual({
        date: '24-ти юни',
        meals: [
          { name: 'Таратор', price: '2.90', currency: 'лв', weight: undefined, unit: undefined, ean: undefined, imageUrl: undefined }
        ]
      });
    });

    it('should skip products with no recognizable price', () => {
      const mockHtml = `
        <html>
          <body>
            <h2>Меню за 02/07</h2>
            <div class="priceListHolder">
              <div class="product">
                <span><span class='productName'>Специалитет на деня</span></span> <b class="nowrap">цена при поискване</b>
              </div>
              <div class="product">
                <span><span class='productName'>Кроасан с масло</span></span> <b class="nowrap">1.02 €</b>
              </div>
            </div>
          </body>
        </html>
      `;

      const result = scraperUtils.extractMenuData(mockHtml);

      expect(result).toEqual({
        date: '02/07',
        meals: [
          { name: 'Кроасан с масло', price: '1.02', currency: 'EUR', weight: undefined, unit: undefined, ean: undefined, imageUrl: undefined }
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

      const result = scraperUtils.extractMenuData(mockHtml);
      expect(result).toBeNull();
    });
  });

  describe('scrapeMenuUrl', () => {
    it('should scrape and extract menu data from URL', async () => {
      mockedAxios.get.mockResolvedValue({ data: 'mockHtml' });

      // Mock extractMenuData to avoid executing real code
      const extractMenuDataSpy = jest.spyOn(scraperUtils, 'extractMenuData')
        .mockReturnValue({ date: 'mock', meals: [] });

      await scrapeMenuUrl('https://bcvt.eu/test');

      expect(extractMenuDataSpy).toHaveBeenCalledWith('mockHtml');
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