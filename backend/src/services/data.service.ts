import * as fs from 'fs';
import * as path from 'path';
import { Domain } from '../types';

const DOMAIN_CONFIG: Record<Domain, { file: string; category: string }> = {
  fitness: { file: 'darebee_guides.json', category: 'Fitness Guide' },
  plants: { file: 'ugaoo_products.json', category: 'Plant Guide' },
};

export interface Article {
  id: string;
  url: string;
  title: string;
  content: string;
  category?: string;
  images?: string[]; // Image URLs extracted from article
}

export class DataService {
  private articles: Article[] = [];
  private isLoaded = false;
  private domain: Domain;

  constructor(domain: Domain) {
    this.domain = domain;
  }

  async loadData(): Promise<void> {
    if (this.isLoaded) return;

    const { file, category } = DOMAIN_CONFIG[this.domain];

    try {
      const dataPath = path.join(__dirname, '../../data', file);

      if (!fs.existsSync(dataPath)) {
        console.warn(`Data file not found at ${dataPath}`);
        return;
      }

      const rawData = fs.readFileSync(dataPath, 'utf-8');
      const data = JSON.parse(rawData);

      // Darebee fitness format: { articles: [{ id, url, title, elements }] }
      if (data.articles && Array.isArray(data.articles)) {
        this.articles = data.articles.map((article: any) => ({
          id: article.id,
          url: article.url,
          title: article.title,
          content: this.extractTextContent(article.elements),
          category,
          images: this.extractImageUrls(article.elements),
        }));
        console.log(`Loaded ${this.articles.length} ${this.domain} articles from data source`);
      }

      // Ugaoo plants format: { products: [{ handle, url, title, description, images: [] }] }
      if (data.products && Array.isArray(data.products)) {
        this.articles = data.products.map((product: any) => ({
          id: product.handle || product.shopify_product_id || product.url,
          url: product.url,
          title: product.title,
          content: [
            product.description || '',
            (product.tags || []).join(', '),
            product.category || '',
            product.product_type || '',
          ].filter(Boolean).join(' '),
          category: product.category || product.product_type || category,
          images: Array.isArray(product.images) ? product.images.slice(0, 5) : [],
        }));
        console.log(`Loaded ${this.articles.length} ${this.domain} products from data source`);
      }

      this.isLoaded = true;
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  private extractTextContent(elements: any[]): string {
    if (!Array.isArray(elements)) return '';

    let text = '';
    for (const element of elements) {
      if (element.type === 'paragraph' && element.text) {
        text += element.text + ' ';
      } else if (element.type === 'heading' && element.text) {
        text += element.text + ' ';
      } else if (element.type === 'list' && element.items) {
        text += element.items.join(' ') + ' ';
      } else if (element.elements && Array.isArray(element.elements)) {
        text += this.extractTextContent(element.elements);
      }
    }
    return text.trim();
  }

  private static readonly PLANT_CATEGORIES = new Set([
    'indoor plants', 'low light plants', 'xl plants', 'fruit plants',
    'vegetable seeds', 'flower seeds', 'flower bulbs', 'herb seeds',
    'tree & grass seeds', 'seeds kits',
  ]);

  private isPlantProduct(article: Article): boolean {
    const cat = (article.category || '').toLowerCase();
    return DataService.PLANT_CATEGORIES.has(cat) ||
      cat.includes('plant') ||
      cat.includes('seed') ||
      cat.includes('bulb');
  }

  searchArticles(query: string, limit: number = 3): Article[] {
    if (!this.isLoaded || this.articles.length === 0) {
      return [];
    }

    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

    // Score articles based on keyword matches
    const scored = this.articles.map(article => {
      let score = 0;

      // Title matches score higher
      const titleLower = article.title.toLowerCase();
      queryWords.forEach(word => {
        if (titleLower.includes(word)) score += 5;
      });

      // Content matches
      const contentLower = article.content.toLowerCase();
      queryWords.forEach(word => {
        const matches = (contentLower.match(new RegExp(word, 'g')) || []).length;
        score += matches;
      });

      // Boost plant-category products so accessories/appliances rank lower
      if (this.domain === 'plants' && this.isPlantProduct(article)) {
        score *= 2;
      }

      return { article, score };
    });

    // Return top results
    return scored
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.article);
  }

  getAllArticles(): Article[] {
    return this.articles;
  }

  private extractImageUrls(elements: any[]): string[] {
    if (!Array.isArray(elements)) return [];

    const images: string[] = [];
    for (const element of elements) {
      if (element.type === 'image' && element.src) {
        images.push(element.src);
      }
    }
    return images;
  }
}
