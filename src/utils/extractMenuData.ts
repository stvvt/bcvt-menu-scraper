import * as cheerio from 'cheerio';
import scrapeMealImage from './scrapeMealImage';
import { MenuData } from '../scraper';

export function extractMenuData(html: string): MenuData | null {

  const $ = cheerio.load(html);
  
  // Find the menu date from heading "Меню за {{date}}"
  let menuDate = '';
  $('h1, h2, h3, h4, h5, h6').each((_, element) => {
    const headingText = $(element).text().trim();

    const dateMatch = headingText.match(/Меню.+за (.+)/);
    if (dateMatch) {
      menuDate = dateMatch[1];
      return false; // Break the loop
    }
  });

  if (!menuDate) {
    return null;
  }

  // Extract meals and prices using proper BCVT HTML selectors
  const meals: MenuData['meals'] = [];

  // Find all products in the price list
  $('.priceListHolder .product').each((_, productElement) => {
    const $product = $(productElement);
    
    // Extract meal name using the specific selector
    const nameElement = $product.find('.productName');
    const name = nameElement.text().trim();
    
    // Extract price using the specific selector
    const priceElement = $product.find('> b.nowrap');
    const priceText = priceElement.text().trim();
    const weightElement = $product.find('small.quiet');

    const [weight, unit] = weightElement.length > 0 ? weightElement.text().trim().split(' ') : [];

    // Parse price and currency (e.g., "4.20 лв" -> price: "4.20", currency: "лв")
    const priceMatch = priceText.match(/(\d+\.\d+)\s*(лв)/);
    
    if (!name || !priceMatch) {
      return;
    }

    const price = priceMatch[1];
    const currency = priceMatch[2].trim();

    // Extract image URL and EAN
    const { imageUrl, ean } = scrapeMealImage($, name);

    meals.push({ name, price, currency, imageUrl, ean, weight, unit });
  });

  return {
    date: menuDate,
    meals,
  };
}