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
    contextChars: number;
    maxLength: number;
    preferSentences: boolean;
    addEllipsis: boolean;
}
/**
 * Snippet Extractor Class
 *
 * Extract snippets with context per ChatGPT specification
 */
declare class SnippetExtractor {
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
    extract(text: string, charOffsets: [number, number], config?: Partial<SnippetConfig>): string;
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
    findSentenceBoundary(text: string, position: number, direction: 'forward' | 'backward'): number;
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
    extractMultiple(text: string, offsetsList: [number, number][], config?: Partial<SnippetConfig>): string[];
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
    extractWithHighlight(text: string, charOffsets: [number, number], config?: Partial<SnippetConfig>, markers?: [string, string]): string;
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
    getSnippetInfo(text: string, charOffsets: [number, number], config?: Partial<SnippetConfig>): {
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
    };
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
    validateSnippet(text: string, charOffsets: [number, number], config?: Partial<SnippetConfig>): boolean;
    /**
     * Explain snippet extraction
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const snippetExtractor: SnippetExtractor;
export default snippetExtractor;
//# sourceMappingURL=snippet-extractor.service.d.ts.map