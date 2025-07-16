import scrapeMealImage from '../utils/scrapeMealImage';
import * as cheerio from 'cheerio';

describe('getMealImage', () => {
  let $: cheerio.CheerioAPI;
  const expectedImageUrl = 'imageUrl';
  const expectedEan = '123';

  beforeEach(() => {
    const testHtml = `
      <html>
        <body>
          <div class="gridPhoto">
            <img class="priceListFoodImage" src="${expectedImageUrl}" title="[${expectedEan}] test meal" />
          </div>
          <div class="gridPhoto">
            <img class="priceListFoodImage" src="${expectedImageUrl}" title="test meal never" />
          </div>
          <div class="gridPhoto">
            <img class="priceListFoodImage" src="${expectedImageUrl}" title="[wtf] test meal never" />
          </div>
          <div class="gridPhoto">
            <img class="priceListFoodImage" src="${expectedImageUrl}" title="[${expectedEan}] "test" meal with double quotes" />
          </div>
          <div class="gridPhoto">
            <img class="priceListFoodImage" src="${expectedImageUrl}" title="[${expectedEan}] 'test' meal with single quotes" />
          </div>
          <div class="gridPhoto">
            <img class="priceListFoodImage" src="${expectedImageUrl}" title="[${expectedEan}] &quot;test&quot; meal with htmlentities" />
          </div>
        </body>
      </html>
    `;

    $ = cheerio.load(testHtml);
  });

  it('normal case', () => {
    const result = scrapeMealImage($, 'test meal');

    expect(result).toEqual({
      imageUrl: expectedImageUrl,
      ean: expectedEan
    });
  });

  it('double quotes', () => {
    const result = scrapeMealImage($, '"test" meal with double quotes');

    expect(result).toEqual({
      imageUrl: undefined,
      ean: undefined
    });
  });

  it('single quotes', () => {
    const result = scrapeMealImage($, "'test' meal with single quotes");

    expect(result).toEqual({
      imageUrl: expectedImageUrl,
      ean: expectedEan
    });
  });

  it('html entities', () => {
    const result = scrapeMealImage($, '"test" meal with htmlentities');

    expect(result).toEqual({
      imageUrl: expectedImageUrl,
      ean: expectedEan
    });
  });

}); 