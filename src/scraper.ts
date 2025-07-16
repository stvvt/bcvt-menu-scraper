import axios from 'axios';
import * as cheerio from 'cheerio';
import scrapeMealImage from './utils/scrapeMealImage';

export interface MenuData {
  date: string;
  meals: Array<{
    name: string;
    price: string;
    currency?: string;
    imageUrl?: string;
    ean?: string;
  }>;
}

export function extractMenuData(html: string): MenuData | null {
  const $ = cheerio.load(html);
  
  // Find the menu date from heading "Меню за {{date}}"
  let menuDate = '';
  $('h1, h2, h3, h4, h5, h6').each((_, element) => {
    const headingText = $(element).text().trim();
    const dateMatch = headingText.match(/Меню за (.+)/);
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
    
    // Parse price and currency (e.g., "4.20 лв" -> price: "4.20", currency: "лв")
    const priceMatch = priceText.match(/(\d+\.\d+)\s*(.+)/);
    
    if (!name || !priceMatch) {
      return;
    }

    const price = priceMatch[1];
    const currency = priceMatch[2].trim();

    // Extract image URL and EAN
    const { imageUrl, ean } = scrapeMealImage($, name);

    meals.push({ name, price, currency, imageUrl, ean });
  });

  return {
    date: menuDate,
    meals,
  };
}

export async function scrapeMenuUrl(url: string): Promise<MenuData> {
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

    const menuData = extractMenuData(response.data);
    
    if (!menuData) {
      throw new Error('Could not extract menu data from the page');
    }

    return menuData;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch ${url}: ${error.message}`);
    }
    throw error;
  }
} 