"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractMenuData = extractMenuData;
exports.scrapeUrl = scrapeUrl;
exports.scrapeMenuUrl = scrapeMenuUrl;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
function extractMenuData(html) {
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
    const meals = [];
    // Find all products in the price list
    $('.priceListHolder .product').each((_, productElement) => {
        const $product = $(productElement);
        // Extract meal name using the specific selector
        const nameElement = $product.find('.productName');
        const name = nameElement.text().trim();
        // Extract price using the specific selector
        const priceElement = $product.find('> b.nowrap');
        const priceText = priceElement.text().trim();
        // Extract numeric price from text (e.g., "4.20 лв" -> "4.20")
        const priceMatch = priceText.match(/(\d+\.\d+)/);
        if (name && priceMatch) {
            const price = priceMatch[1];
            meals.push({ name, price });
        }
    });
    return {
        date: menuDate,
        meals
    };
}
async function scrapeUrl(url) {
    try {
        const response = await axios_1.default.get(url, {
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
        const $ = cheerio.load(response.data);
        // Extract title
        const title = $('title').text().trim();
        // Extract meta information
        const meta = {
            description: $('meta[name="description"]').attr('content'),
            keywords: $('meta[name="keywords"]').attr('content'),
            author: $('meta[name="author"]').attr('content'),
        };
        // Extract headings
        const headings = {
            h1: $('h1').map((_, el) => $(el).text().trim()).get(),
            h2: $('h2').map((_, el) => $(el).text().trim()).get(),
            h3: $('h3').map((_, el) => $(el).text().trim()).get(),
        };
        // Extract links
        const links = $('a[href]').map((_, el) => ({
            text: $(el).text().trim(),
            href: $(el).attr('href') || '',
        })).get();
        // Extract images
        const images = $('img[src]').map((_, el) => ({
            src: $(el).attr('src') || '',
            alt: $(el).attr('alt'),
        })).get();
        // Extract all text content
        const text = $('body').text().replace(/\s+/g, ' ').trim();
        return {
            url,
            title: title || undefined,
            meta,
            headings,
            links,
            images,
            text,
            scrapedAt: new Date().toISOString(),
        };
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            throw new Error(`Failed to fetch ${url}: ${error.message}`);
        }
        throw error;
    }
}
async function scrapeMenuUrl(url) {
    try {
        const response = await axios_1.default.get(url, {
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
    }
    catch (error) {
        if (axios_1.default.isAxiosError(error)) {
            throw new Error(`Failed to fetch ${url}: ${error.message}`);
        }
        throw error;
    }
}
//# sourceMappingURL=scraper.js.map