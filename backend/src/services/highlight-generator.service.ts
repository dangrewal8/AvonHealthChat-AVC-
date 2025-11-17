/**
 * Highlight Generator Service
 *
 * Generates highlights for matched terms in retrieval results per ChatGPT specification.
 *
 * Features:
 * - Exact match highlighting (case-insensitive)
 * - Entity highlighting
 * - Fuzzy match highlighting (Levenshtein-based)
 * - Overlap merging
 * - HTML formatting with <mark> tags
 *
 */

import { Entity } from './entity-extractor.service';
import { RetrievalCandidate } from './retriever-agent.service';

/**
 * Term highlight information for matched terms
 */
export interface TermHighlight {
  start: number; // Character offset in chunk
  end: number; // Character offset in chunk
  term: string; // Matched term (original casing)
  type: 'exact' | 'fuzzy' | 'entity';
}

/**
 * Candidate with highlight information
 */
export interface HighlightedCandidate extends RetrievalCandidate {
  term_highlights: TermHighlight[]; // Renamed to avoid conflict with RetrievalCandidate.highlights
  highlighted_html: string; // HTML with <mark> tags
  highlighted_snippet: string; // Plain text snippet with context
}

/**
 * Highlight generation statistics
 */
export interface HighlightStats {
  total_highlights: number;
  exact_matches: number;
  fuzzy_matches: number;
  entity_matches: number;
  merged_count: number;
  avg_highlights_per_candidate: number;
}

/**
 * Highlight Generator Class
 *
 * Highlights matched terms in retrieval results
 */
class HighlightGenerator {
  /**
   * Fuzzy matching threshold (Levenshtein distance)
   * Lower = more strict (0 = exact match only)
   */
  private readonly DEFAULT_FUZZY_THRESHOLD = 2;

  /**
   * Minimum term length for highlighting
   */
  private readonly MIN_TERM_LENGTH = 3;

  /**
   * Generate highlights for chunk text
   *
   * @param chunkText - Text to highlight
   * @param query - Search query
   * @param entities - Extracted entities
   * @returns Highlights array
   */
  generateHighlights(chunkText: string, query: string, entities: Entity[] = []): TermHighlight[] {
    const highlights: TermHighlight[] = [];

    // Step 1: Highlight exact query terms
    const queryTerms = query.split(/\s+/).filter((t) => t.length >= this.MIN_TERM_LENGTH);
    for (const term of queryTerms) {
      highlights.push(...this.findExactMatches(chunkText, term));
    }

    // Step 2: Highlight extracted entities
    for (const entity of entities) {
      const entityHighlights = this.findExactMatches(chunkText, entity.text);
      // Mark as entity type
      entityHighlights.forEach((h) => {
        h.type = 'entity';
      });
      highlights.push(...entityHighlights);
    }

    // Step 3: Merge overlapping highlights
    return this.mergeOverlappingHighlights(highlights, chunkText);
  }

  /**
   * Find exact matches (case-insensitive)
   *
   * @param text - Text to search
   * @param term - Term to find
   * @returns Exact match highlights
   */
  findExactMatches(text: string, term: string): TermHighlight[] {
    const highlights: TermHighlight[] = [];
    const lowerText = text.toLowerCase();
    const lowerTerm = term.toLowerCase();

    let position = 0;
    while ((position = lowerText.indexOf(lowerTerm, position)) !== -1) {
      highlights.push({
        start: position,
        end: position + term.length,
        term: text.substring(position, position + term.length), // Preserve original casing
        type: 'exact',
      });
      position += term.length;
    }

    return highlights;
  }

  /**
   * Find fuzzy matches using Levenshtein distance
   *
   * @param text - Text to search
   * @param term - Term to find
   * @param threshold - Maximum edit distance (default: 2)
   * @returns Fuzzy match highlights
   */
  findFuzzyMatches(text: string, term: string, threshold: number = this.DEFAULT_FUZZY_THRESHOLD): TermHighlight[] {
    const highlights: TermHighlight[] = [];
    const words = this.extractWords(text);

    for (const word of words) {
      const distance = this.levenshteinDistance(word.text.toLowerCase(), term.toLowerCase());

      if (distance > 0 && distance <= threshold) {
        highlights.push({
          start: word.start,
          end: word.end,
          term: word.text,
          type: 'fuzzy',
        });
      }
    }

    return highlights;
  }

  /**
   * Merge overlapping highlights
   *
   * @param highlights - Highlights to merge
   * @param text - Original text (for term extraction)
   * @returns Merged highlights
   */
  mergeOverlappingHighlights(highlights: TermHighlight[], text: string): TermHighlight[] {
    if (highlights.length === 0) return [];

    // Sort by start position
    highlights.sort((a, b) => a.start - b.start);

    const merged: TermHighlight[] = [highlights[0]];

    for (let i = 1; i < highlights.length; i++) {
      const current = highlights[i];
      const last = merged[merged.length - 1];

      // If overlapping or adjacent, extend the last highlight
      if (current.start <= last.end) {
        last.end = Math.max(last.end, current.end);
        last.term = text.substring(last.start, last.end);

        // Prefer entity type > exact type > fuzzy type
        if (current.type === 'entity' || (current.type === 'exact' && last.type === 'fuzzy')) {
          last.type = current.type;
        }
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  /**
   * Format highlighted text with HTML <mark> tags
   *
   * @param text - Text to format
   * @param highlights - Highlights to apply
   * @returns HTML string with <mark> tags
   */
  formatHighlightedText(text: string, highlights: TermHighlight[]): string {
    if (highlights.length === 0) return text;

    let result = '';
    let lastEnd = 0;

    for (const highlight of highlights) {
      // Add text before highlight
      result += text.substring(lastEnd, highlight.start);

      // Add highlighted term with type-specific CSS class
      const cssClass = `highlight-${highlight.type}`;
      result += `<mark class="${cssClass}">${text.substring(highlight.start, highlight.end)}</mark>`;

      lastEnd = highlight.end;
    }

    // Add remaining text
    result += text.substring(lastEnd);

    return result;
  }

  /**
   * Generate snippet with context around first highlight
   *
   * @param text - Full text
   * @param highlights - Highlights
   * @param maxLength - Maximum snippet length (default: 200)
   * @returns Snippet with context
   */
  generateSnippet(text: string, highlights: TermHighlight[], maxLength: number = 200): string {
    if (highlights.length === 0) {
      // No highlights, return start of text
      return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Center snippet around first highlight
    const firstHighlight = highlights[0];
    const highlightCenter = Math.floor((firstHighlight.start + firstHighlight.end) / 2);

    // Calculate snippet boundaries
    const snippetStart = Math.max(0, highlightCenter - Math.floor(maxLength / 2));
    const snippetEnd = Math.min(text.length, snippetStart + maxLength);

    let snippet = text.substring(snippetStart, snippetEnd);

    // Add ellipsis if truncated
    if (snippetStart > 0) snippet = '...' + snippet;
    if (snippetEnd < text.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Add highlights to retrieval candidate
   *
   * @param candidate - Retrieval candidate
   * @param query - Search query
   * @param entities - Extracted entities
   * @returns Highlighted candidate
   */
  addHighlights(candidate: RetrievalCandidate, query: string, entities: Entity[] = []): HighlightedCandidate {
    const termHighlights = this.generateHighlights(candidate.chunk.content, query, entities);

    return {
      ...candidate,
      term_highlights: termHighlights,
      highlighted_html: this.formatHighlightedText(candidate.chunk.content, termHighlights),
      highlighted_snippet: this.generateSnippet(candidate.chunk.content, termHighlights),
    };
  }

  /**
   * Batch add highlights to multiple candidates
   *
   * @param candidates - Candidates to highlight
   * @param query - Search query
   * @param entities - Extracted entities
   * @returns Highlighted candidates
   */
  batchAddHighlights(
    candidates: RetrievalCandidate[],
    query: string,
    entities: Entity[] = []
  ): HighlightedCandidate[] {
    return candidates.map((candidate) => this.addHighlights(candidate, query, entities));
  }

  /**
   * Calculate highlight statistics
   *
   * @param candidates - Highlighted candidates
   * @returns Statistics
   */
  calculateStats(candidates: HighlightedCandidate[]): HighlightStats {
    if (candidates.length === 0) {
      return {
        total_highlights: 0,
        exact_matches: 0,
        fuzzy_matches: 0,
        entity_matches: 0,
        merged_count: 0,
        avg_highlights_per_candidate: 0,
      };
    }

    let totalHighlights = 0;
    let exactMatches = 0;
    let fuzzyMatches = 0;
    let entityMatches = 0;

    for (const candidate of candidates) {
      totalHighlights += candidate.term_highlights.length;

      for (const highlight of candidate.term_highlights) {
        if (highlight.type === 'exact') exactMatches++;
        else if (highlight.type === 'fuzzy') fuzzyMatches++;
        else if (highlight.type === 'entity') entityMatches++;
      }
    }

    return {
      total_highlights: totalHighlights,
      exact_matches: exactMatches,
      fuzzy_matches: fuzzyMatches,
      entity_matches: entityMatches,
      merged_count: 0, // Tracked during merge if needed
      avg_highlights_per_candidate: totalHighlights / candidates.length,
    };
  }

  /**
   * Find candidates with most highlights
   *
   * @param candidates - Highlighted candidates
   * @param topN - Number of top candidates (default: 5)
   * @returns Top candidates by highlight count
   */
  findMostHighlighted(candidates: HighlightedCandidate[], topN: number = 5): HighlightedCandidate[] {
    return candidates.sort((a, b) => b.term_highlights.length - a.term_highlights.length).slice(0, topN);
  }

  /**
   * Extract words with positions from text
   *
   * @param text - Text to extract words from
   * @returns Words with start/end positions
   */
  private extractWords(text: string): Array<{ text: string; start: number; end: number }> {
    const words: Array<{ text: string; start: number; end: number }> = [];
    const regex = /\b\w+\b/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      words.push({
        text: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }

    return words;
  }

  /**
   * Calculate Levenshtein distance between two strings
   *
   * @param str1 - First string
   * @param str2 - Second string
   * @returns Edit distance
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const len1 = str1.length;
    const len2 = str2.length;

    // Create distance matrix
    const matrix: number[][] = Array(len1 + 1)
      .fill(null)
      .map(() => Array(len2 + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    // Calculate distances
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // Deletion
          matrix[i][j - 1] + 1, // Insertion
          matrix[i - 1][j - 1] + cost // Substitution
        );
      }
    }

    return matrix[len1][len2];
  }

  /**
   * Get highlight density (highlights per 100 characters)
   *
   * @param text - Text
   * @param highlights - Highlights
   * @returns Density score
   */
  getHighlightDensity(text: string, highlights: TermHighlight[]): number {
    if (text.length === 0) return 0;
    return (highlights.length / text.length) * 100;
  }

  /**
   * Explain highlights for a candidate
   *
   * @param candidate - Highlighted candidate
   * @returns Human-readable explanation
   */
  explainHighlights(candidate: HighlightedCandidate): string {
    const lines = [
      `Highlight Analysis: ${candidate.chunk.chunk_id}`,
      `${'='.repeat(60)}`,
      ``,
      `Total Highlights: ${candidate.term_highlights.length}`,
      ``,
    ];

    if (candidate.term_highlights.length === 0) {
      lines.push(`  (No matches found)`);
      return lines.join('\n');
    }

    const byType = {
      exact: candidate.term_highlights.filter((h) => h.type === 'exact').length,
      fuzzy: candidate.term_highlights.filter((h) => h.type === 'fuzzy').length,
      entity: candidate.term_highlights.filter((h) => h.type === 'entity').length,
    };

    lines.push(`Breakdown by Type:`);
    lines.push(`  Exact Matches:  ${byType.exact}`);
    lines.push(`  Fuzzy Matches:  ${byType.fuzzy}`);
    lines.push(`  Entity Matches: ${byType.entity}`);
    lines.push(``);

    lines.push(`Highlighted Terms:`);
    candidate.term_highlights.slice(0, 10).forEach((h, i) => {
      lines.push(`  ${i + 1}. "${h.term}" (${h.type}) at position ${h.start}-${h.end}`);
    });

    if (candidate.term_highlights.length > 10) {
      lines.push(`  ... and ${candidate.term_highlights.length - 10} more`);
    }

    return lines.join('\n');
  }

  /**
   * Compare highlights before and after merging
   *
   * @param beforeMerge - Highlights before merging
   * @param afterMerge - Highlights after merging
   * @returns Comparison details
   */
  compareBeforeAfterMerge(
    beforeMerge: TermHighlight[],
    afterMerge: TermHighlight[]
  ): {
    before_count: number;
    after_count: number;
    merged_count: number;
    merge_ratio: number;
  } {
    return {
      before_count: beforeMerge.length,
      after_count: afterMerge.length,
      merged_count: beforeMerge.length - afterMerge.length,
      merge_ratio: afterMerge.length / beforeMerge.length,
    };
  }

  /**
   * Get default fuzzy threshold
   *
   * @returns Fuzzy threshold
   */
  getFuzzyThreshold(): number {
    return this.DEFAULT_FUZZY_THRESHOLD;
  }

  /**
   * Get minimum term length
   *
   * @returns Minimum term length
   */
  getMinTermLength(): number {
    return this.MIN_TERM_LENGTH;
  }
}

// Export singleton instance
const highlightGenerator = new HighlightGenerator();
export default highlightGenerator;
