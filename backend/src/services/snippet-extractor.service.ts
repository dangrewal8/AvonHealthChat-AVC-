/**
 * Snippet Extraction Service
 *
 * Extract snippets from text per ChatGPT specification.
 *
 * ChatGPT Requirements:
 * - "Include 50 chars before and after cited text"
 * - "Add ellipsis for truncation"
 * - "Keep complete sentences if possible"
 * - "Max snippet length: 200 chars"
 *
 * Features:
 * - Configurable context window (default: 50 chars)
 * - Max snippet length enforcement (default: 200 chars)
 * - Sentence boundary detection
 * - Smart ellipsis handling
 * - Pure string manipulation
 *
 * NO external text processing libraries
 */

/**
 * Snippet configuration
 */
export interface SnippetConfig {
  contextChars: number; // chars before and after (default 50)
  maxLength: number; // max snippet length (default 200)
  preferSentences: boolean; // expand to sentence boundaries (default true)
  addEllipsis: boolean; // add "..." for truncation (default true)
}

/**
 * Default configuration per ChatGPT spec
 */
const DEFAULT_CONFIG: SnippetConfig = {
  contextChars: 50,
  maxLength: 200,
  preferSentences: true,
  addEllipsis: true,
};

/**
 * Snippet Extractor Class
 *
 * Extract snippets with context per ChatGPT specification
 */
class SnippetExtractor {
  /**
   * Extract snippet from text with context
   *
   * Per ChatGPT Spec:
   * - Include 50 chars before and after cited text
   * - Max snippet length: 200 chars
   * - Keep complete sentences if possible
   * - Add ellipsis for truncation
   *
   * @param text - Full text
   * @param charOffsets - [start, end] character offsets of cited text
   * @param config - Snippet configuration (optional)
   * @returns Extracted snippet with context
   */
  extract(
    text: string,
    charOffsets: [number, number],
    config: Partial<SnippetConfig> = {}
  ): string {
    // Merge with defaults
    const cfg: SnippetConfig = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    const [start, end] = charOffsets;

    // Validate offsets
    if (start < 0 || end > text.length || start > end) {
      throw new Error('Invalid character offsets');
    }

    // Step 1: Calculate context window (50 chars before and after per spec)
    let snippetStart = Math.max(0, start - cfg.contextChars);
    let snippetEnd = Math.min(text.length, end + cfg.contextChars);

    // Step 2: Expand to sentence boundaries if preferred
    if (cfg.preferSentences) {
      const sentenceStart = this.findSentenceBoundary(text, snippetStart, 'backward');
      const sentenceEnd = this.findSentenceBoundary(text, snippetEnd, 'forward');

      // Only use sentence boundaries if it doesn't exceed max length
      if (sentenceEnd - sentenceStart <= cfg.maxLength) {
        snippetStart = sentenceStart;
        snippetEnd = sentenceEnd;
      }
    }

    // Step 3: Enforce max length (200 chars per spec)
    if (snippetEnd - snippetStart > cfg.maxLength) {
      // Truncate, keeping the cited portion in the middle
      const citedLength = end - start;
      const remainingContext = cfg.maxLength - citedLength;
      const beforeContext = Math.floor(remainingContext / 2);
      const afterContext = remainingContext - beforeContext;

      snippetStart = Math.max(0, start - beforeContext);
      snippetEnd = Math.min(text.length, end + afterContext);
    }

    // Step 4: Extract snippet
    let snippet = text.substring(snippetStart, snippetEnd);

    // Step 5: Add ellipsis if truncated
    if (cfg.addEllipsis) {
      if (snippetStart > 0) {
        snippet = '...' + snippet;
      }
      if (snippetEnd < text.length) {
        snippet = snippet + '...';
      }
    }

    return snippet.trim();
  }

  /**
   * Find sentence boundary
   *
   * Searches for sentence endings: . ! ? followed by space or end
   *
   * @param text - Text to search
   * @param position - Starting position
   * @param direction - Search direction ('forward' | 'backward')
   * @returns Position of sentence boundary
   */
  findSentenceBoundary(
    text: string,
    position: number,
    direction: 'forward' | 'backward'
  ): number {
    // Sentence endings: . ! ? followed by space, newline, or end
    const sentenceEndings = /[.!?][\s\n]/g;

    if (direction === 'backward') {
      // Search backwards from position
      for (let i = position; i >= 0; i--) {
        if (sentenceEndings.test(text.substring(i, i + 2))) {
          return i + 2; // After the punctuation and space
        }
      }
      return 0; // Start of text
    } else {
      // Search forward from position
      for (let i = position; i < text.length - 1; i++) {
        if (sentenceEndings.test(text.substring(i, i + 2))) {
          return i + 2; // After the punctuation and space
        }
      }
      return text.length; // End of text
    }
  }

  /**
   * Extract multiple snippets from same text
   *
   * Useful for extracting multiple citations from same document
   *
   * @param text - Full text
   * @param offsetsList - Array of [start, end] character offsets
   * @param config - Snippet configuration (optional)
   * @returns Array of extracted snippets
   */
  extractMultiple(
    text: string,
    offsetsList: [number, number][],
    config: Partial<SnippetConfig> = {}
  ): string[] {
    return offsetsList.map(offsets => this.extract(text, offsets, config));
  }

  /**
   * Extract snippet and highlight cited portion
   *
   * Returns snippet with markers around cited text
   *
   * @param text - Full text
   * @param charOffsets - [start, end] character offsets of cited text
   * @param config - Snippet configuration (optional)
   * @param markers - Highlight markers (default: ['**', '**'])
   * @returns Snippet with highlighted cited portion
   */
  extractWithHighlight(
    text: string,
    charOffsets: [number, number],
    config: Partial<SnippetConfig> = {},
    markers: [string, string] = ['**', '**']
  ): string {
    const cfg: SnippetConfig = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    const [start, end] = charOffsets;

    // Calculate snippet boundaries (same logic as extract)
    let snippetStart = Math.max(0, start - cfg.contextChars);
    let snippetEnd = Math.min(text.length, end + cfg.contextChars);

    if (cfg.preferSentences) {
      const sentenceStart = this.findSentenceBoundary(text, snippetStart, 'backward');
      const sentenceEnd = this.findSentenceBoundary(text, snippetEnd, 'forward');

      if (sentenceEnd - sentenceStart <= cfg.maxLength) {
        snippetStart = sentenceStart;
        snippetEnd = sentenceEnd;
      }
    }

    if (snippetEnd - snippetStart > cfg.maxLength) {
      const citedLength = end - start;
      const remainingContext = cfg.maxLength - citedLength;
      const beforeContext = Math.floor(remainingContext / 2);
      const afterContext = remainingContext - beforeContext;

      snippetStart = Math.max(0, start - beforeContext);
      snippetEnd = Math.min(text.length, end + afterContext);
    }

    // Build snippet with highlight
    const before = text.substring(snippetStart, start);
    const cited = text.substring(start, end);
    const after = text.substring(end, snippetEnd);

    let snippet = before + markers[0] + cited + markers[1] + after;

    // Add ellipsis
    if (cfg.addEllipsis) {
      if (snippetStart > 0) {
        snippet = '...' + snippet;
      }
      if (snippetEnd < text.length) {
        snippet = snippet + '...';
      }
    }

    return snippet.trim();
  }

  /**
   * Get snippet info (for debugging)
   *
   * Returns snippet plus metadata
   *
   * @param text - Full text
   * @param charOffsets - [start, end] character offsets
   * @param config - Snippet configuration (optional)
   * @returns Snippet with metadata
   */
  getSnippetInfo(
    text: string,
    charOffsets: [number, number],
    config: Partial<SnippetConfig> = {}
  ): {
    snippet: string;
    snippetStart: number;
    snippetEnd: number;
    snippetLength: number;
    citedStart: number;
    citedEnd: number;
    citedLength: number;
    hasStartEllipsis: boolean;
    hasEndEllipsis: boolean;
    usedSentenceBoundaries: boolean;
  } {
    const cfg: SnippetConfig = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    const [start, end] = charOffsets;

    // Calculate boundaries
    let snippetStart = Math.max(0, start - cfg.contextChars);
    let snippetEnd = Math.min(text.length, end + cfg.contextChars);
    let usedSentenceBoundaries = false;

    if (cfg.preferSentences) {
      const sentenceStart = this.findSentenceBoundary(text, snippetStart, 'backward');
      const sentenceEnd = this.findSentenceBoundary(text, snippetEnd, 'forward');

      if (sentenceEnd - sentenceStart <= cfg.maxLength) {
        snippetStart = sentenceStart;
        snippetEnd = sentenceEnd;
        usedSentenceBoundaries = true;
      }
    }

    if (snippetEnd - snippetStart > cfg.maxLength) {
      const citedLength = end - start;
      const remainingContext = cfg.maxLength - citedLength;
      const beforeContext = Math.floor(remainingContext / 2);
      const afterContext = remainingContext - beforeContext;

      snippetStart = Math.max(0, start - beforeContext);
      snippetEnd = Math.min(text.length, end + afterContext);
    }

    const snippet = this.extract(text, charOffsets, config);

    return {
      snippet,
      snippetStart,
      snippetEnd,
      snippetLength: snippetEnd - snippetStart,
      citedStart: start,
      citedEnd: end,
      citedLength: end - start,
      hasStartEllipsis: snippetStart > 0,
      hasEndEllipsis: snippetEnd < text.length,
      usedSentenceBoundaries,
    };
  }

  /**
   * Validate snippet extraction
   *
   * Check if snippet contains the cited text
   *
   * @param text - Full text
   * @param charOffsets - [start, end] character offsets
   * @param config - Snippet configuration (optional)
   * @returns True if snippet contains cited text
   */
  validateSnippet(
    text: string,
    charOffsets: [number, number],
    config: Partial<SnippetConfig> = {}
  ): boolean {
    const snippet = this.extract(text, charOffsets, config);
    const citedText = text.substring(charOffsets[0], charOffsets[1]);

    // Remove ellipsis for comparison
    const cleanSnippet = snippet.replace(/^\.\.\.|\.\.\.$/g, '').trim();

    return cleanSnippet.includes(citedText);
  }

  /**
   * Explain snippet extraction
   *
   * @returns Explanation string
   */
  explain(): string {
    return `Snippet Extractor:

ChatGPT Requirements:
✓ Include 50 chars before and after cited text
✓ Add ellipsis for truncation
✓ Keep complete sentences if possible
✓ Max snippet length: 200 chars

Features:
- Configurable context window (default: 50 chars)
- Max snippet length enforcement (default: 200 chars)
- Sentence boundary detection (. ! ?)
- Smart ellipsis handling
- Highlight support

Default Configuration:
  contextChars: 50
  maxLength: 200
  preferSentences: true
  addEllipsis: true

Usage:
  const snippet = snippetExtractor.extract(text, [start, end]);
  const highlighted = snippetExtractor.extractWithHighlight(text, [start, end]);

Tech Stack: Node.js + TypeScript (pure string manipulation)
NO external text processing libraries`;
  }
}

// Export singleton instance
const snippetExtractor = new SnippetExtractor();
export default snippetExtractor;
