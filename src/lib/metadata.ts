import { JSDOM } from "jsdom";

export interface UrlMetadata {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  domain?: string;
}

export async function extractMetadata(url: string): Promise<UrlMetadata> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const dom = new JSDOM(html);
    const document = dom.window.document;

    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Extract title
    const title =
      document.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
      document.querySelector('meta[name="twitter:title"]')?.getAttribute("content") ||
      document.querySelector("title")?.textContent ||
      domain;

    // Extract description
    const description =
      document.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
      document.querySelector('meta[name="twitter:description"]')?.getAttribute("content") ||
      document.querySelector('meta[name="description"]')?.getAttribute("content") ||
      undefined;

    // Extract image
    let image =
      document.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
      document.querySelector('meta[name="twitter:image"]')?.getAttribute("content") ||
      undefined;

    // Make image URL absolute if it's relative
    if (image && !image.startsWith("http")) {
      image = new URL(image, url).href;
    }

    // Extract favicon
    let favicon =
      document.querySelector('link[rel="icon"]')?.getAttribute("href") ||
      document.querySelector('link[rel="shortcut icon"]')?.getAttribute("href") ||
      document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href") ||
      "/favicon.ico";

    // Make favicon URL absolute if it's relative
    if (favicon && !favicon.startsWith("http")) {
      favicon = new URL(favicon, url).href;
    }

    return {
      title: title?.trim(),
      description: description?.trim(),
      image,
      favicon,
      domain,
    };
  } catch (error) {
    console.error("Error extracting metadata:", error);
    const urlObj = new URL(url);
    return {
      title: urlObj.hostname,
      domain: urlObj.hostname,
    };
  }
}

/**
 * Generate search tokens for inverted index
 * 
 * This function creates a comprehensive set of tokens for the inverted index:
 * - Whole words for exact matching
 * - Prefixes for autocomplete
 * - Character n-grams for partial matching
 * - Word n-grams for phrase matching
 * 
 * Since we're using a true inverted index now, we don't need to worry about 
 * the 1KB DynamoDB size limit anymore - each token is stored as a separate entry.
 */
export function generateSearchTokens(text: string): string[] {
  if (!text) return [];

  const normalizedText = text.toLowerCase().trim();
  const tokens = new Set<string>();
  
  // Split into words
  const words = normalizedText.split(/\s+/).filter((word) => word.length > 0);
  
  // Limit to reasonable number of words for processing
  const limitedWords = words.slice(0, 100);
  
  // Add the full original text for exact phrase matching
  if (normalizedText.length <= 100) {
    tokens.add(normalizedText);
  }
  
  // Add individual words - most important for search
  for (const word of limitedWords) {
    // Skip very short or very long words
    if (word.length >= 2 && word.length <= 50) {
      tokens.add(word);
      
      // Add prefixes for autocomplete (first 2+ chars)
      if (word.length >= 5) {
        for (let i = 2; i <= Math.min(word.length - 1, 6); i++) {
          tokens.add(word.substring(0, i));
        }
      }
    }
  }
  
  // Add small word n-grams for phrase search
  for (let i = 0; i < Math.min(limitedWords.length, 25); i++) {
    for (let j = i + 1; j <= Math.min(i + 3, limitedWords.length); j++) {
      const wordNgram = limitedWords.slice(i, j).join(" ");
      if (wordNgram.length <= 50) {
        tokens.add(wordNgram);
      }
    }
  }
  
  // Add domain-specific tokens if the text looks like a domain
  if (text.includes('.')) {
    const domainParts = text.split(/[.-]/);
    for (const part of domainParts) {
      if (part.length >= 2) {
        tokens.add(part.toLowerCase());
      }
    }
  }

  return Array.from(tokens);
}

/**
 * Generate search tokens for a query to match against stored n-grams
 */
export function generateQueryTokens(query: string): string[] {
  if (!query) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const tokens = new Set<string>();

  // Add the full query
  tokens.add(normalizedQuery);

  // Add individual words
  const words = normalizedQuery.split(/\s+/).filter((word) => word.length > 0);
  for (const word of words) {
    tokens.add(word);

    // Add prefixes of each word for autocomplete-style matching
    for (let i = 1; i <= word.length; i++) {
      tokens.add(word.slice(0, i));
    }
  }

  // Add character n-grams for partial matching
  for (let i = 0; i < normalizedQuery.length; i++) {
    for (let j = i + 2; j <= Math.min(i + 8, normalizedQuery.length); j++) {
      const ngram = normalizedQuery.slice(i, j);
      if (!ngram.match(/^\s+$/) && !ngram.match(/\s{2,}/)) {
        tokens.add(ngram);
      }
    }
  }

  return Array.from(tokens);
}
