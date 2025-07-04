/**
 * Client-side metadata extraction to avoid region-based content issues
 * Server-side metadata extraction is avoided because our eu-central-1 infrastructure
 * causes many websites to serve German content instead of English
 */

export interface UrlMetadata {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  domain?: string;
}

/**
 * Check if we're running in a browser environment
 */
const isBrowser = typeof window !== "undefined";

/**
 * Client-side metadata extraction using CORS proxy
 * This avoids region-based content issues by running in the user's browser
 */
export async function extractMetadataClient(url: string): Promise<UrlMetadata> {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Basic metadata from URL structure
    const metadata: UrlMetadata = {
      domain,
      favicon: `https://${domain}/favicon.ico`,
    };

    // Get title from URL path
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      metadata.title = lastPart.replace(/[-_]/g, " ").replace(/\.[^/.]+$/, "");
    }

    if (!metadata.title) {
      metadata.title = domain.replace(/^www\./, "");
    }

    // Try to enhance with actual page metadata using multiple CORS proxy services
    try {
      // List of CORS proxy services to try as fallbacks
      const corsProxies = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://cors-anywhere.herokuapp.com/${url}`,
        `https://thingproxy.freeboard.io/fetch/${url}`,
      ];

      let html = null;

      // Try each CORS proxy service
      for (const proxyUrl of corsProxies) {
        try {
          const response = await fetch(proxyUrl, {
            headers: {
              "Accept-Language": "en-US,en;q=0.9",
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
            // Add timeout to prevent hanging
            signal: AbortSignal.timeout(10000), // 10 second timeout
          });

          if (response.ok) {
            const data = await response.json();
            
            // Handle different proxy response formats
            if (proxyUrl.includes('allorigins.win')) {
              html = data.contents;
            } else if (proxyUrl.includes('corsproxy.io')) {
              html = data;
            } else {
              html = data;
            }

            if (html) {
              console.log(`Successfully fetched metadata using: ${proxyUrl}`);
              break; // Success! Exit the loop
            }
          }
        } catch (proxyError) {
          console.warn(`CORS proxy ${proxyUrl} failed:`, proxyError);
          continue; // Try next proxy
        }
      }

      if (html) {
        // Parse HTML to extract metadata
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        // Extract title
        const title =
          doc.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
          doc.querySelector('meta[name="twitter:title"]')?.getAttribute("content") ||
          doc.querySelector("title")?.textContent ||
          metadata.title;

        // Extract description
        const description =
          doc.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
          doc.querySelector('meta[name="twitter:description"]')?.getAttribute("content") ||
          doc.querySelector('meta[name="description"]')?.getAttribute("content");

        // Extract image
        let image =
          doc.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
          doc.querySelector('meta[name="twitter:image"]')?.getAttribute("content");

        // Make image URL absolute if it's relative
        if (image && !image.startsWith("http")) {
          image = new URL(image, url).href;
        }

        // Extract favicon
        let favicon =
          doc.querySelector('link[rel="icon"]')?.getAttribute("href") ||
          doc.querySelector('link[rel="shortcut icon"]')?.getAttribute("href") ||
          metadata.favicon;

        // Make favicon URL absolute if it's relative
        if (favicon && !favicon.startsWith("http")) {
          favicon = new URL(favicon, url).href;
        }

        return {
          title: title?.trim() || metadata.title,
          description: description?.trim(),
          image: image || undefined,
          favicon,
          domain: metadata.domain,
        };
      }
    } catch (proxyError) {
      console.warn("All CORS proxies failed, using basic metadata:", proxyError);
    }

    return metadata;
  } catch (error) {
    console.error("Error extracting client-side metadata:", error);

    // Fallback to basic URL info
    try {
      const urlObj = new URL(url);
      return {
        title: urlObj.hostname.replace(/^www\./, ""),
        domain: urlObj.hostname,
        favicon: `https://${urlObj.hostname}/favicon.ico`,
      };
    } catch {
      return {
        title: url,
        domain: url,
      };
    }
  }
}

/**
 * Basic metadata extraction from URL structure only
 * Used as fallback when client-side extraction fails
 */
function extractBasicMetadata(url: string): UrlMetadata {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Basic metadata from URL structure only
    const metadata: UrlMetadata = {
      domain,
      favicon: `https://${domain}/favicon.ico`,
    };

    // Get title from URL path
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      metadata.title = lastPart.replace(/[-_]/g, " ").replace(/\.[^/.]+$/, "");
    }

    if (!metadata.title) {
      metadata.title = domain.replace(/^www\./, "");
    }

    return metadata;
  } catch (error) {
    console.error("Error extracting basic metadata:", error);
    return {
      title: url,
      domain: url,
    };
  }
}

/**
 * Client-side only metadata extraction
 * Always uses client-side extraction to avoid region-based content issues
 * Falls back to basic URL parsing if client-side extraction fails
 */
export async function extractMetadata(url: string): Promise<UrlMetadata> {
  if (isBrowser) {
    // Use client-side extraction with CORS proxy to get rich metadata
    // This uses the user's IP/location, avoiding region-specific content
    return extractMetadataClient(url);
  } else {
    // Server-side: only basic URL parsing, no external requests
    // This avoids getting German content from our eu-central-1 infrastructure
    console.warn("Server-side metadata extraction avoided to prevent region-specific content");
    return extractBasicMetadata(url);
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
  if (text.includes(".")) {
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
 *
 * This version prioritizes exact phrase matching while still maintaining
 * good fuzzy search capabilities.
 */
export function generateQueryTokens(query: string): string[] {
  if (!query) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const tokens = new Set<string>();

  // Create a structure to track token types for scoring
  const exactPhraseToken = `__exact__:${normalizedQuery}`;

  // Add the exact phrase token with a special prefix for exact matching
  tokens.add(exactPhraseToken);

  // Add the full query as is (still important)
  tokens.add(normalizedQuery);

  // Add individual words
  const words = normalizedQuery.split(/\s+/).filter((word) => word.length > 0);
  for (const word of words) {
    if (word.length >= 2) {
      tokens.add(word);

      // Only add prefixes for words 3+ characters to reduce noise
      if (word.length >= 3) {
        // Add prefixes of each word for autocomplete-style matching
        // But limit to meaningful prefixes (at least 3 characters)
        for (let i = 3; i <= word.length; i++) {
          tokens.add(word.slice(0, i));
        }
      }
    }
  }

  // Reduce the number of n-grams to minimize noise
  // Only generate n-grams for short queries (less than 3 words)
  if (words.length < 3) {
    // Add character n-grams for partial matching
    // More selective - only 3-5 character n-grams
    for (let i = 0; i < normalizedQuery.length; i++) {
      for (let j = i + 3; j <= Math.min(i + 5, normalizedQuery.length); j++) {
        const ngram = normalizedQuery.slice(i, j);
        if (!ngram.match(/^\s+$/) && !ngram.match(/\s{2,}/)) {
          tokens.add(ngram);
        }
      }
    }
  }

  return Array.from(tokens);
}
