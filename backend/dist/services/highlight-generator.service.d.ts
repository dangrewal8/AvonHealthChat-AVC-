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
    start: number;
    end: number;
    term: string;
    type: 'exact' | 'fuzzy' | 'entity';
}
/**
 * Candidate with highlight information
 */
export interface HighlightedCandidate extends RetrievalCandidate {
    term_highlights: TermHighlight[];
    highlighted_html: string;
    highlighted_snippet: string;
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
declare class HighlightGenerator {
    /**
     * Fuzzy matching threshold (Levenshtein distance)
     * Lower = more strict (0 = exact match only)
     */
    private readonly DEFAULT_FUZZY_THRESHOLD;
    /**
     * Minimum term length for highlighting
     */
    private readonly MIN_TERM_LENGTH;
    /**
     * Generate highlights for chunk text
     *
     * @param chunkText - Text to highlight
     * @param query - Search query
     * @param entities - Extracted entities
     * @returns Highlights array
     */
    generateHighlights(chunkText: string, query: string, entities?: Entity[]): TermHighlight[];
    /**
     * Find exact matches (case-insensitive)
     *
     * @param text - Text to search
     * @param term - Term to find
     * @returns Exact match highlights
     */
    findExactMatches(text: string, term: string): TermHighlight[];
    /**
     * Find fuzzy matches using Levenshtein distance
     *
     * @param text - Text to search
     * @param term - Term to find
     * @param threshold - Maximum edit distance (default: 2)
     * @returns Fuzzy match highlights
     */
    findFuzzyMatches(text: string, term: string, threshold?: number): TermHighlight[];
    /**
     * Merge overlapping highlights
     *
     * @param highlights - Highlights to merge
     * @param text - Original text (for term extraction)
     * @returns Merged highlights
     */
    mergeOverlappingHighlights(highlights: TermHighlight[], text: string): TermHighlight[];
    /**
     * Format highlighted text with HTML <mark> tags
     *
     * @param text - Text to format
     * @param highlights - Highlights to apply
     * @returns HTML string with <mark> tags
     */
    formatHighlightedText(text: string, highlights: TermHighlight[]): string;
    /**
     * Generate snippet with context around first highlight
     *
     * @param text - Full text
     * @param highlights - Highlights
     * @param maxLength - Maximum snippet length (default: 200)
     * @returns Snippet with context
     */
    generateSnippet(text: string, highlights: TermHighlight[], maxLength?: number): string;
    /**
     * Add highlights to retrieval candidate
     *
     * @param candidate - Retrieval candidate
     * @param query - Search query
     * @param entities - Extracted entities
     * @returns Highlighted candidate
     */
    addHighlights(candidate: RetrievalCandidate, query: string, entities?: Entity[]): HighlightedCandidate;
    /**
     * Batch add highlights to multiple candidates
     *
     * @param candidates - Candidates to highlight
     * @param query - Search query
     * @param entities - Extracted entities
     * @returns Highlighted candidates
     */
    batchAddHighlights(candidates: RetrievalCandidate[], query: string, entities?: Entity[]): HighlightedCandidate[];
    /**
     * Calculate highlight statistics
     *
     * @param candidates - Highlighted candidates
     * @returns Statistics
     */
    calculateStats(candidates: HighlightedCandidate[]): HighlightStats;
    /**
     * Find candidates with most highlights
     *
     * @param candidates - Highlighted candidates
     * @param topN - Number of top candidates (default: 5)
     * @returns Top candidates by highlight count
     */
    findMostHighlighted(candidates: HighlightedCandidate[], topN?: number): HighlightedCandidate[];
    /**
     * Extract words with positions from text
     *
     * @param text - Text to extract words from
     * @returns Words with start/end positions
     */
    private extractWords;
    /**
     * Calculate Levenshtein distance between two strings
     *
     * @param str1 - First string
     * @param str2 - Second string
     * @returns Edit distance
     */
    private levenshteinDistance;
    /**
     * Get highlight density (highlights per 100 characters)
     *
     * @param text - Text
     * @param highlights - Highlights
     * @returns Density score
     */
    getHighlightDensity(text: string, highlights: TermHighlight[]): number;
    /**
     * Explain highlights for a candidate
     *
     * @param candidate - Highlighted candidate
     * @returns Human-readable explanation
     */
    explainHighlights(candidate: HighlightedCandidate): string;
    /**
     * Compare highlights before and after merging
     *
     * @param beforeMerge - Highlights before merging
     * @param afterMerge - Highlights after merging
     * @returns Comparison details
     */
    compareBeforeAfterMerge(beforeMerge: TermHighlight[], afterMerge: TermHighlight[]): {
        before_count: number;
        after_count: number;
        merged_count: number;
        merge_ratio: number;
    };
    /**
     * Get default fuzzy threshold
     *
     * @returns Fuzzy threshold
     */
    getFuzzyThreshold(): number;
    /**
     * Get minimum term length
     *
     * @returns Minimum term length
     */
    getMinTermLength(): number;
}
declare const highlightGenerator: HighlightGenerator;
export default highlightGenerator;
//# sourceMappingURL=highlight-generator.service.d.ts.map