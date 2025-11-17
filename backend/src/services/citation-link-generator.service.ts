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
  index: number; // Citation number [1], [2], [3]
  artifact_id: string; // Source artifact ID
  url: string; // Full URL with deep link
  display_text: string; // Display text (e.g., "[1]", "[2]")
  tooltip: string; // Tooltip text (artifact type + date)
  artifact_type?: string; // Type of artifact
  note_date?: string; // Formatted date
  author?: string; // Author name
  snippet?: string; // Text snippet
}

/**
 * Grouped citation (multiple citations from same artifact)
 */
export interface GroupedCitation {
  artifact_id: string; // Artifact ID
  indices: number[]; // Citation indices [1, 3, 5]
  url: string; // Base URL to artifact
  display_text: string; // Display text (e.g., "[1, 3, 5]")
  tooltip: string; // Tooltip text
  artifact_type: string; // Type of artifact
  note_date: string; // Formatted date
  author?: string; // Author name
  citation_count: number; // Number of citations
}

/**
 * Citation Link Generator Class
 *
 * Generates clickable citation links from provenance
 */
class CitationLinkGenerator {
  /**
   * Base URL for Avon Health API
   */
  private readonly baseURL: string;

  /**
   * Enable text highlighting in deep links
   */
  private readonly enableHighlighting: boolean;

  constructor() {
    this.baseURL = process.env.AVON_BASE_URL || 'http://localhost:3000';
    this.enableHighlighting = process.env.ENABLE_CITATION_HIGHLIGHTING === 'true';
  }

  /**
   * Generate citation links from provenance
   *
   * @param provenance - Formatted provenance array
   * @returns Array of citation links
   */
  generateLinks(provenance: FormattedProvenance[]): CitationLink[] {
    const links: CitationLink[] = [];

    provenance.forEach((p, index) => {
      const link = this.createLink(p, index + 1);
      links.push(link);
    });

    return links;
  }

  /**
   * Create citation link from provenance
   *
   * @param provenance - Single provenance entry
   * @param index - Citation index (1-based)
   * @returns Citation link
   */
  private createLink(provenance: FormattedProvenance, index: number): CitationLink {
    // Build deep link URL
    const url = this.buildDeepLink(
      provenance.artifact_id,
      provenance.char_offsets,
      provenance.artifact_type
    );

    // Format display text
    const displayText = `[${index}]`;

    // Build tooltip
    const tooltip = this.buildTooltip(provenance);

    return {
      index,
      artifact_id: provenance.artifact_id,
      url,
      display_text: displayText,
      tooltip,
      artifact_type: provenance.artifact_type,
      note_date: provenance.note_date,
      author: provenance.author,
      snippet: provenance.snippet,
    };
  }

  /**
   * Build deep link to artifact with optional text highlighting
   *
   * @param artifactId - Artifact ID
   * @param offsets - Character offsets [start, end]
   * @param artifactType - Type of artifact
   * @returns Deep link URL
   */
  buildDeepLink(
    artifactId: string,
    offsets: [number, number],
    artifactType: string = 'note'
  ): string {
    // Sanitize artifact ID
    const safeId = this.sanitizeURLParam(artifactId);

    // Build base artifact URL
    let url = `${this.baseURL}/${this.getArtifactPath(artifactType)}/${safeId}`;

    // Add text highlighting params if enabled
    if (this.enableHighlighting && offsets) {
      const [start, end] = offsets;
      url += `?highlight=${start}-${end}`;
    }

    return url;
  }

  /**
   * Get URL path for artifact type
   *
   * @param artifactType - Type of artifact
   * @returns URL path segment
   */
  private getArtifactPath(artifactType: string): string {
    const typeMap: Record<string, string> = {
      care_plan: 'careplans',
      clinical_note: 'notes',
      medication: 'medications',
      lab_result: 'labs',
      imaging: 'imaging',
      note: 'notes',
    };

    return typeMap[artifactType] || 'artifacts';
  }

  /**
   * Build tooltip text
   *
   * @param provenance - Provenance entry
   * @returns Tooltip text
   */
  private buildTooltip(provenance: FormattedProvenance): string {
    const parts: string[] = [];

    // Add artifact type
    parts.push(this.formatArtifactType(provenance.artifact_type));

    // Add date
    if (provenance.note_date) {
      parts.push(provenance.note_date);
    }

    // Add author
    if (provenance.author) {
      parts.push(`by ${provenance.author}`);
    }

    return parts.join(' • ');
  }

  /**
   * Format artifact type for display
   *
   * @param type - Artifact type
   * @returns Formatted type
   */
  private formatArtifactType(type: string): string {
    const formatted = type
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return formatted;
  }

  /**
   * Sanitize URL parameter
   *
   * @param param - Parameter value
   * @returns Sanitized parameter
   */
  private sanitizeURLParam(param: string): string {
    // Encode URI component and validate
    const encoded = encodeURIComponent(param);

    // Remove any potentially dangerous characters
    return encoded.replace(/[<>'"]/g, '');
  }

  /**
   * Validate URL
   *
   * @param url - URL to validate
   * @returns True if valid
   */
  validateURL(url: string): boolean {
    try {
      const parsed = new URL(url);

      // Check protocol
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }

      // Check host matches base URL
      const baseHost = new URL(this.baseURL).host;
      if (parsed.host !== baseHost) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Group citations by artifact
   *
   * Groups multiple citations from the same artifact
   *
   * @param links - Citation links
   * @returns Grouped citations
   */
  groupByArtifact(links: CitationLink[]): GroupedCitation[] {
    const grouped = new Map<string, CitationLink[]>();

    // Group by artifact_id
    links.forEach(link => {
      const existing = grouped.get(link.artifact_id) || [];
      existing.push(link);
      grouped.set(link.artifact_id, existing);
    });

    // Convert to GroupedCitation array
    const result: GroupedCitation[] = [];

    grouped.forEach((citationLinks, artifactId) => {
      const first = citationLinks[0];
      const indices = citationLinks.map(l => l.index).sort((a, b) => a - b);

      result.push({
        artifact_id: artifactId,
        indices,
        url: first.url.split('?')[0], // Remove highlight params
        display_text: `[${indices.join(', ')}]`,
        tooltip: first.tooltip,
        artifact_type: first.artifact_type || 'note',
        note_date: first.note_date || 'Unknown',
        author: first.author,
        citation_count: citationLinks.length,
      });
    });

    return result;
  }

  /**
   * Format citation links as inline references
   *
   * @param links - Citation links
   * @returns Formatted inline references string
   */
  formatInlineReferences(links: CitationLink[]): string {
    return links.map(link => link.display_text).join(' ');
  }

  /**
   * Format citation links as bibliography
   *
   * @param links - Citation links
   * @returns Formatted bibliography string
   */
  formatBibliography(links: CitationLink[]): string {
    let bibliography = 'Sources:\n';
    bibliography += '─'.repeat(80) + '\n\n';

    links.forEach(link => {
      bibliography += `${link.display_text} `;
      bibliography += `${this.formatArtifactType(link.artifact_type || 'note')} `;
      bibliography += `(${link.note_date || 'Unknown date'})`;
      if (link.author) {
        bibliography += ` by ${link.author}`;
      }
      bibliography += `\n    ${link.url}`;
      if (link.snippet) {
        bibliography += `\n    "${link.snippet.substring(0, 100)}..."`;
      }
      bibliography += '\n\n';
    });

    return bibliography;
  }

  /**
   * Format grouped citations as bibliography
   *
   * @param grouped - Grouped citations
   * @returns Formatted bibliography string
   */
  formatGroupedBibliography(grouped: GroupedCitation[]): string {
    let bibliography = 'Sources:\n';
    bibliography += '─'.repeat(80) + '\n\n';

    grouped.forEach(group => {
      bibliography += `${group.display_text} `;
      bibliography += `${this.formatArtifactType(group.artifact_type)} `;
      bibliography += `(${group.note_date})`;
      if (group.author) {
        bibliography += ` by ${group.author}`;
      }
      bibliography += ` - ${group.citation_count} citations`;
      bibliography += `\n    ${group.url}\n\n`;
    });

    return bibliography;
  }

  /**
   * Generate HTML links
   *
   * @param links - Citation links
   * @returns HTML string with clickable links
   */
  generateHTML(links: CitationLink[]): string {
    return links
      .map(
        link =>
          `<a href="${link.url}" title="${link.tooltip}" class="citation-link">${link.display_text}</a>`
      )
      .join(' ');
  }

  /**
   * Generate Markdown links
   *
   * @param links - Citation links
   * @returns Markdown string with links
   */
  generateMarkdown(links: CitationLink[]): string {
    return links.map(link => `[${link.index}](${link.url} "${link.tooltip}")`).join(' ');
  }

  /**
   * Get unique artifacts count
   *
   * @param links - Citation links
   * @returns Number of unique artifacts
   */
  getUniqueArtifactsCount(links: CitationLink[]): number {
    const unique = new Set(links.map(link => link.artifact_id));
    return unique.size;
  }

  /**
   * Get citations by artifact type
   *
   * @param links - Citation links
   * @param artifactType - Type to filter by
   * @returns Filtered citation links
   */
  getCitationsByType(links: CitationLink[], artifactType: string): CitationLink[] {
    return links.filter(link => link.artifact_type === artifactType);
  }

  /**
   * Sort citations by date
   *
   * @param links - Citation links
   * @param ascending - Sort order (default: false = newest first)
   * @returns Sorted citation links
   */
  sortByDate(links: CitationLink[], ascending: boolean = false): CitationLink[] {
    const sorted = [...links].sort((a, b) => {
      const dateA = this.parseDateFromFormatted(a.note_date || '');
      const dateB = this.parseDateFromFormatted(b.note_date || '');

      return ascending
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

    return sorted;
  }

  /**
   * Parse date from formatted string
   *
   * @param formattedDate - Formatted date string
   * @returns Date object
   */
  private parseDateFromFormatted(formattedDate: string): Date {
    // Handle relative dates
    if (formattedDate === 'Today') {
      return new Date();
    }
    if (formattedDate === 'Yesterday') {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      return date;
    }
    if (formattedDate.endsWith(' days ago')) {
      const days = parseInt(formattedDate.split(' ')[0]);
      const date = new Date();
      date.setDate(date.getDate() - days);
      return date;
    }

    // Handle absolute dates
    return new Date(formattedDate);
  }

  /**
   * Get base URL
   *
   * @returns Base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Set highlighting enabled
   *
   * @param enabled - Enable/disable highlighting
   */
  setHighlightingEnabled(enabled: boolean): void {
    (this as any).enableHighlighting = enabled;
  }

  /**
   * Check if highlighting is enabled
   *
   * @returns True if enabled
   */
  isHighlightingEnabled(): boolean {
    return this.enableHighlighting;
  }

  /**
   * Explain citation link generator
   *
   * @returns Explanation string
   */
  explain(): string {
    return `Citation Link Generator Process:

1. Link Generation
   - Base URL: ${this.baseURL}
   - Artifact type mapping to URL paths
   - Numbered citations: [1], [2], [3]
   - Deep links to specific artifacts

2. Deep Linking
   - URL format: {base}/{type}/{artifact_id}
   - Optional highlighting: ?highlight={start}-{end}
   - Highlighting enabled: ${this.enableHighlighting}

3. Display Formatting
   - Display text: [1], [2], [3]
   - Tooltips: "Clinical Note • 2 days ago • by Dr. Smith"
   - HTML links: <a href="..." title="...">
   - Markdown links: [1](url "tooltip")

4. Citation Grouping
   - Group by artifact_id
   - Combined indices: [1, 3, 5]
   - Citation counts per artifact

5. URL Safety
   - Parameter sanitization
   - URL encoding
   - Protocol validation (http/https only)
   - Host validation

6. Formatting Options
   - Inline references: [1] [2] [3]
   - Bibliography with full details
   - Grouped bibliography by artifact
   - HTML output
   - Markdown output

Base URL: ${this.baseURL}
Highlighting: ${this.enableHighlighting ? 'Enabled' : 'Disabled'}`;
  }
}

// Export singleton instance
const citationLinkGenerator = new CitationLinkGenerator();
export default citationLinkGenerator;
