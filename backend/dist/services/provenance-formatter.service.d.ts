/**
 * Provenance Formatter Service
 *
 * Formats provenance/citations for UI display.
 *
 * Features:
 * - Snippet extraction with context (50 chars before/after)
 * - Date formatting (relative vs absolute)
 * - Source URL construction
 * - Sentence-aware truncation
 * - Ellipsis for truncated text
 *
 */
import { Extraction } from './extraction-prompt-builder.service';
import { RetrievalCandidate } from './retriever-agent.service';
/**
 * Formatted provenance for UI display
 */
export interface FormattedProvenance {
    artifact_id: string;
    artifact_type: string;
    snippet: string;
    note_date: string;
    author?: string;
    source_url: string;
    char_offsets: [number, number];
    relevance_score: number;
}
/**
 * Provenance Formatter Class
 *
 * Formats provenance for UI display
 */
declare class ProvenanceFormatter {
    /**
     * Context size (chars before/after cited text)
     */
    private readonly CONTEXT_SIZE;
    /**
     * Max snippet length
     */
    private readonly MAX_SNIPPET_LENGTH;
    /**
     * Relative date threshold (days)
     */
    private readonly RELATIVE_DATE_THRESHOLD_DAYS;
    /**
     * Artifact type to URL path mapping
     */
    private readonly TYPE_MAP;
    /**
     * Format extractions for UI display
     *
     * @param extractions - Extractions to format
     * @param candidates - Retrieved candidates (for chunk lookup)
     * @returns Formatted provenance array
     */
    format(extractions: Extraction[], candidates: RetrievalCandidate[]): FormattedProvenance[];
    /**
     * Format single extraction
     *
     * @param extraction - Extraction to format
     * @param candidate - Retrieval candidate
     * @returns Formatted provenance
     */
    private formatSingle;
    /**
     * Extract snippet with context
     *
     * Extracts cited text with 50 characters before and after.
     * - Adds ellipsis if truncated
     * - Keeps complete sentences when possible
     * - Max length: 200 characters
     *
     * @param text - Full chunk text
     * @param offsets - Character offsets [start, end]
     * @returns Snippet with context
     */
    extractSnippet(text: string, offsets: [number, number]): string;
    /**
     * Extend snippet boundaries to complete sentences
     *
     * @param text - Full text
     * @param start - Initial start index
     * @param end - Initial end index
     * @returns Extended boundaries
     */
    private extendToSentenceBoundaries;
    /**
     * Format date for display
     *
     * - Recent (< 7 days): Relative ("2 days ago")
     * - Older: Absolute ("Jan 15, 2025")
     *
     * @param dateString - ISO date string
     * @returns Formatted date string
     */
    formatDate(dateString?: string): string;
    /**
     * Format absolute date
     *
     * @param date - Date object
     * @returns Formatted date string (e.g., "Jan 15, 2025")
     */
    private formatAbsoluteDate;
    /**
     * Build source URL
     *
     * @param artifactId - Artifact ID
     * @param type - Artifact type
     * @returns URL to view artifact
     */
    buildSourceURL(artifactId: string, type: string): string;
    /**
     * Format multiple provenances from same artifact
     *
     * Groups provenances by artifact_id
     *
     * @param provenances - Formatted provenances
     * @returns Grouped provenances
     */
    groupByArtifact(provenances: FormattedProvenance[]): Map<string, FormattedProvenance[]>;
    /**
     * Get unique artifacts
     *
     * @param provenances - Formatted provenances
     * @returns Unique artifact IDs
     */
    getUniqueArtifacts(provenances: FormattedProvenance[]): string[];
    /**
     * Sort by date (most recent first)
     *
     * @param provenances - Formatted provenances
     * @returns Sorted provenances
     */
    sortByDate(provenances: FormattedProvenance[]): FormattedProvenance[];
    /**
     * Parse date from formatted string
     *
     * @param formattedDate - Formatted date string
     * @returns Date object
     */
    private parseDateFromFormatted;
    /**
     * Sort by relevance score (highest first)
     *
     * @param provenances - Formatted provenances
     * @returns Sorted provenances
     */
    sortByRelevance(provenances: FormattedProvenance[]): FormattedProvenance[];
    /**
     * Format as citation list (for display)
     *
     * @param provenances - Formatted provenances
     * @returns Formatted citation list string
     */
    formatAsCitationList(provenances: FormattedProvenance[]): string;
    /**
     * Explain formatting process
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const provenanceFormatter: ProvenanceFormatter;
export default provenanceFormatter;
//# sourceMappingURL=provenance-formatter.service.d.ts.map