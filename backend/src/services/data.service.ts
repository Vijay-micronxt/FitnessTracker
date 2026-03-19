import * as fs from 'fs';
import * as path from 'path';

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

  async loadData(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Load from data directory within the project
      const dataPath = path.join(
        __dirname,
        '../../data/darebee_guides.json'
      );

      if (!fs.existsSync(dataPath)) {
        console.warn(`Data file not found at ${dataPath}`);
        return;
      }

      const rawData = fs.readFileSync(dataPath, 'utf-8');
      const data = JSON.parse(rawData);

      // Parse articles from the JSON structure
      if (data.articles && Array.isArray(data.articles)) {
        this.articles = data.articles.map((article: any) => ({
          id: article.id,
          url: article.url,
          title: article.title,
          content: this.extractTextContent(article.elements),
          category: 'Fitness Guide',
          images: this.extractImageUrls(article.elements),
        }));
        console.log(`Loaded ${this.articles.length} articles from data source`);
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
