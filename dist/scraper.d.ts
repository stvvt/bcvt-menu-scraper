export interface ScrapedData {
    url: string;
    title?: string;
    meta: {
        description?: string;
        keywords?: string;
        author?: string;
    };
    headings: {
        h1: string[];
        h2: string[];
        h3: string[];
    };
    links: Array<{
        text: string;
        href: string;
    }>;
    images: Array<{
        src: string;
        alt?: string;
    }>;
    text: string;
    scrapedAt: string;
}
export interface MenuData {
    date: string;
    meals: Array<{
        name: string;
        price: string;
    }>;
}
export declare function extractMenuData(html: string): MenuData | null;
export declare function scrapeUrl(url: string): Promise<ScrapedData>;
export declare function scrapeMenuUrl(url: string): Promise<MenuData>;
//# sourceMappingURL=scraper.d.ts.map