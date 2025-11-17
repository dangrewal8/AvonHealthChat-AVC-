/**
 * Citation Link Generator Service
 *
 * Generates clickable citation links for UI display.
 *
 * Features:
 * - Numbered citations [1], [2], [3]
 * - Deep links to specific artifacts
 * - Optional text highlighting
 * - Tooltips with artifact info
 * - Citation grouping
 * - URL safety and validation
 *
 */
import { FormattedProvenance } from './provenance-formatter.service';
/**
 * Citation link for UI display
 */
export interface CitationLink {
    index: number;
    artifact_id: string;
    url: string;
    display_text: string;
    tooltip: string;
    artifact_type?: string;
    note_date?: string;
    author?: string;
    snippet?: string;
}
/**
 * Grouped citation (multiple citations from same artifact)
 */
export interface GroupedCitation {
    artifact_id: string;
    indices: number[];
    url: string;
    display_text: string;
    tooltip: string;
    artifact_type: string;
    note_date: string;
    author?: string;
    citation_count: number;
}
/**
 * Citation Link Generator Class
 *
 * Generates clickable citation links from provenance
 */
declare class CitationLinkGenerator {
    /**
     * Base URL for Avon Health API
     */
    private readonly baseURL;
    /**
     * Enable text highlighting in deep links
     */
    private readonly enableHighlighting;
    constructor();
    /**
     * Generate citation links from provenance
     *
     * @param provenance - Formatted provenance array
     * @returns Array of citation links
     */
    generateLinks(provenance: FormattedProvenance[]): CitationLink[];
    /**
     * Create citation link from provenance
     *
     * @param provenance - Single provenance entry
     * @param index - Citation index (1-based)
     * @returns Citation link
     */
    private createLink;
    /**
     * Build deep link to artifact with optional text highlighting
     *
     * @param artifactId - Artifact ID
     * @param offsets - Character offsets [start, end]
     * @param artifactType - Type of artifact
     * @returns Deep link URL
     */
    buildDeepLink(artifactId: string, offsets: [number, number], artifactType?: string): string;
    /**
     * Get URL path for artifact type
     *
     * @param artifactType - Type of artifact
     * @returns URL path segment
     */
    private getArtifactPath;
    /**
     * Build tooltip text
     *
     * @param provenance - Provenance entry
     * @returns Tooltip text
     */
    private buildTooltip;
    /**
     * Format artifact type for display
     *
     * @param type - Artifact type
     * @returns Formatted type
     */
    private formatArtifactType;
    /**
     * Sanitize URL parameter
     *
     * @param param - Parameter value
     * @returns Sanitized parameter
     */
    private sanitizeURLParam;
    /**
     * Validate URL
     *
     * @param url - URL to validate
     * @returns True if valid
     */
    validateURL(url: string): boolean;
    /**
     * Group citations by artifact
     *
     * Groups multiple citations from the same artifact
     *
     * @param links - Citation links
     * @returns Grouped citations
     */
    groupByArtifact(links: CitationLink[]): GroupedCitation[];
    /**
     * Format citation links as inline references
     *
     * @param links - Citation links
     * @returns Formatted inline references string
     */
    formatInlineReferences(links: CitationLink[]): string;
    /**
     * Format citation links as bibliography
     *
     * @param links - Citation links
     * @returns Formatted bibliography string
     */
    formatBibliography(links: CitationLink[]): string;
    /**
     * Format grouped citations as bibliography
     *
     * @param grouped - Grouped citations
     * @returns Formatted bibliography string
     */
    formatGroupedBibliography(grouped: GroupedCitation[]): string;
    /**
     * Generate HTML links
     *
     * @param links - Citation links
     * @returns HTML string with clickable links
     */
    generateHTML(links: CitationLink[]): string;
    /**
     * Generate Markdown links
     *
     * @param links - Citation links
     * @returns Markdown string with links
     */
    generateMarkdown(links: CitationLink[]): string;
    /**
     * Get unique artifacts count
     *
     * @param links - Citation links
     * @returns Number of unique artifacts
     */
    getUniqueArtifactsCount(links: CitationLink[]): number;
    /**
     * Get citations by artifact type
     *
     * @param links - Citation links
     * @param artifactType - Type to filter by
     * @returns Filtered citation links
     */
    getCitationsByType(links: CitationLink[], artifactType: string): CitationLink[];
    /**
     * Sort citations by date
     *
     * @param links - Citation links
     * @param ascending - Sort order (default: false = newest first)
     * @returns Sorted citation links
     */
    sortByDate(links: CitationLink[], ascending?: boolean): CitationLink[];
    /**
     * Parse date from formatted string
     *
     * @param formattedDate - Formatted date string
     * @returns Date object
     */
    private parseDateFromFormatted;
    /**
     * Get base URL
     *
     * @returns Base URL
     */
    getBaseURL(): string;
    /**
     * Set highlighting enabled
     *
     * @param enabled - Enable/disable highlighting
     */
    setHighlightingEnabled(enabled: boolean): void;
    /**
     * Check if highlighting is enabled
     *
     * @returns True if enabled
     */
    isHighlightingEnabled(): boolean;
    /**
     * Explain citation link generator
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const citationLinkGenerator: CitationLinkGenerator;
export default citationLinkGenerator;
//# sourceMappingURL=citation-link-generator.service.d.ts.map