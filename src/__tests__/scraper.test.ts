import { scrapeMenuUrl } from '../scraper';
import * as scraperUtils from '../utils/extractMenuData';
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
          { name: 'Болярска милинка', price: '4.20', currency: 'лв', weight: '190', unit: 'гр', ean: undefined, imageUrl: undefined },
          { name: 'Таратор', price: '2.90', currency: 'лв', weight: '150', unit: 'гр', ean: undefined, imageUrl: undefined },
          { name: 'Наденица с праз на скара', price: '3.00', currency: 'лв', weight: undefined, unit: undefined, ean: undefined, imageUrl: undefined }
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