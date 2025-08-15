import axios from 'axios';
import { extractMenuData } from './utils/extractMenuData';
export interface MenuData {
  date: string;
  meals: Array<{
    name: string;
    price: string;
    currency?: string;
    imageUrl?: string;
    ean?: string;
    weight?: string;
    unit?: string;
  }>;
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