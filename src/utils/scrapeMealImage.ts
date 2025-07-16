import type { CheerioAPI } from 'cheerio';

function scrapeMealImage($: CheerioAPI, mealName: string) {
  const $productImage = $(`.gridPhoto img.priceListFoodImage[title$="${mealName.replace(/"/g, '\\"')}"]`);
  const imageUrl = $productImage.attr('src');
  const imageTitle = $productImage.attr('title');
  const [, ean] = imageTitle?.match(/^\[(\d+)\]\s+(.*)$/) ?? [];

  return { imageUrl, ean };
}

export default scrapeMealImage;