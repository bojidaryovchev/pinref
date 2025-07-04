/**
 * Server-side metadata extraction with proper error handling
 * Uses direct HTTP requests to fetch page metadata
 */

export interface UrlMetadata {
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  domain?: string;
}

/**
 * Server-side metadata extraction using direct HTTP requests
 * This is more reliable than client-side CORS proxy approaches
 */
export async function extractMetadata(url: string): Promise<UrlMetadata> {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname;

    // Basic metadata from URL structure
    const metadata: UrlMetadata = {
      domain,
      favicon: `https://${domain}/favicon.ico`,
    };

    // Get title from URL path as fallback
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      metadata.title = lastPart.replace(/[-_]/g, " ").replace(/\.[^/.]+$/, "");
    }

    if (!metadata.title) {
      metadata.title = domain.replace(/^www\./, "");
    }

    // Try to enhance with actual page metadata
    try {
      const response = await fetch(url, {
        headers: {
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (response.ok) {
        const html = await response.text();
        
        // Parse HTML to extract metadata using improved regex patterns
        const extractMeta = (pattern: RegExp): string | undefined => {
          const match = html.match(pattern);
          if (match && match[1]) {
            // Decode HTML entities
            return match[1]
              .replace(/&quot;/g, '"')
              .replace(/&apos;/g, "'")
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .trim();
          }
          return undefined;
        };

        // Extract title with better patterns for YouTube and other sites
        const title =
          extractMeta(/<meta\s+property=["']og:title["']\s+content=["']([^"']*?)["'][^>]*>/i) ||
          extractMeta(/<meta\s+name=["']twitter:title["']\s+content=["']([^"']*?)["'][^>]*>/i) ||
          extractMeta(/<meta\s+property=["']twitter:title["']\s+content=["']([^"']*?)["'][^>]*>/i) ||
          extractMeta(/<meta\s+name=["']title["']\s+content=["']([^"']*?)["'][^>]*>/i) ||
          extractMeta(/<title[^>]*>([^<]+)<\/title>/i) ||
          metadata.title;

        // Extract description with better patterns
        const description =
          extractMeta(/<meta\s+property=["']og:description["']\s+content=["']([^"']*?)["'][^>]*>/i) ||
          extractMeta(/<meta\s+name=["']twitter:description["']\s+content=["']([^"']*?)["'][^>]*>/i) ||
          extractMeta(/<meta\s+property=["']twitter:description["']\s+content=["']([^"']*?)["'][^>]*>/i) ||
          extractMeta(/<meta\s+name=["']description["']\s+content=["']([^"']*?)["'][^>]*>/i) ||
          extractMeta(/<meta\s+itemprop=["']description["']\s+content=["']([^"']*?)["'][^>]*>/i);

        // Extract image with better patterns for YouTube and other sites
        let image =
          extractMeta(/<meta\s+property=["']og:image["']\s+content=["']([^"']*?)["'][^>]*>/i) ||
          extractMeta(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']*?)["'][^>]*>/i) ||
          extractMeta(/<meta\s+property=["']twitter:image["']\s+content=["']([^"']*?)["'][^>]*>/i) ||
          extractMeta(/<meta\s+itemprop=["']image["']\s+content=["']([^"']*?)["'][^>]*>/i) ||
          extractMeta(/<meta\s+name=["']thumbnail["']\s+content=["']([^"']*?)["'][^>]*>/i);

        // Make image URL absolute if it's relative
        if (image && !image.startsWith("http")) {
          image = new URL(image, url).href;
        }

        // Extract favicon with better patterns  
        let favicon =
          extractMeta(/<link\s+rel=["']icon["']\s+href=["']([^"']*?)["'][^>]*>/i) ||
          extractMeta(/<link\s+rel=["']shortcut icon["']\s+href=["']([^"']*?)["'][^>]*>/i) ||
          extractMeta(/<link\s+rel=["']apple-touch-icon["']\s+href=["']([^"']*?)["'][^>]*>/i) ||
          extractMeta(/<link\s+rel=["']mask-icon["']\s+href=["']([^"']*?)["'][^>]*>/i) ||
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
    } catch (fetchError) {
      console.warn("Failed to fetch metadata from URL:", fetchError);
    }

    return metadata;
  } catch (error) {
    console.error("Error extracting metadata:", error);

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
