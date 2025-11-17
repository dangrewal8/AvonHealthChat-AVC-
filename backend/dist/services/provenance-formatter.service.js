"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Provenance Formatter Class
 *
 * Formats provenance for UI display
 */
class ProvenanceFormatter {
    /**
     * Context size (chars before/after cited text)
     */
    CONTEXT_SIZE = 50;
    /**
     * Max snippet length
     */
    MAX_SNIPPET_LENGTH = 200;
    /**
     * Relative date threshold (days)
     */
    RELATIVE_DATE_THRESHOLD_DAYS = 7;
    /**
     * Artifact type to URL path mapping
     */
    TYPE_MAP = {
        care_plan: 'careplans',
        clinical_note: 'notes',
        medication: 'medications',
        lab_result: 'labs',
        imaging: 'imaging',
        note: 'notes',
    };
    /**
     * Format extractions for UI display
     *
     * @param extractions - Extractions to format
     * @param candidates - Retrieved candidates (for chunk lookup)
     * @returns Formatted provenance array
     */
    format(extractions, candidates) {
        // Build candidate lookup map
        const candidateMap = new Map();
        candidates.forEach(candidate => {
            candidateMap.set(candidate.chunk.chunk_id, candidate);
        });
        const formattedProvenances = [];
        extractions.forEach(extraction => {
            if (!extraction.provenance) {
                return; // Skip extractions without provenance
            }
            const candidate = candidateMap.get(extraction.provenance.chunk_id);
            if (!candidate) {
                return; // Skip if chunk not found
            }
            const formatted = this.formatSingle(extraction, candidate);
            formattedProvenances.push(formatted);
        });
        return formattedProvenances;
    }
    /**
     * Format single extraction
     *
     * @param extraction - Extraction to format
     * @param candidate - Retrieval candidate
     * @returns Formatted provenance
     */
    formatSingle(extraction, candidate) {
        const { chunk, score, metadata } = candidate;
        const { provenance } = extraction;
        // Extract snippet with context
        const snippet = this.extractSnippet(chunk.content, provenance.char_offsets);
        // Format date
        const noteDate = this.formatDate(metadata.date);
        // Build source URL
        const sourceUrl = this.buildSourceURL(provenance.artifact_id, metadata.artifact_type || 'note');
        return {
            artifact_id: provenance.artifact_id,
            artifact_type: metadata.artifact_type || 'note',
            snippet,
            note_date: noteDate,
            author: metadata.author,
            source_url: sourceUrl,
            char_offsets: provenance.char_offsets,
            relevance_score: score,
        };
    }
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
    extractSnippet(text, offsets) {
        const [citedStart, citedEnd] = offsets;
        // Calculate context boundaries
        let snippetStart = Math.max(0, citedStart - this.CONTEXT_SIZE);
        let snippetEnd = Math.min(text.length, citedEnd + this.CONTEXT_SIZE);
        // Try to extend to sentence boundaries
        const extendedBoundaries = this.extendToSentenceBoundaries(text, snippetStart, snippetEnd);
        // Only use extended boundaries if within max length
        if (extendedBoundaries.end - extendedBoundaries.start <= this.MAX_SNIPPET_LENGTH) {
            snippetStart = extendedBoundaries.start;
            snippetEnd = extendedBoundaries.end;
        }
        // Extract snippet
        let snippet = text.substring(snippetStart, snippetEnd);
        // Truncate if still too long
        if (snippet.length > this.MAX_SNIPPET_LENGTH) {
            snippet = snippet.substring(0, this.MAX_SNIPPET_LENGTH);
            // Find last space to avoid cutting mid-word
            const lastSpace = snippet.lastIndexOf(' ');
            if (lastSpace > this.MAX_SNIPPET_LENGTH * 0.8) {
                snippet = snippet.substring(0, lastSpace);
            }
        }
        // Add ellipsis if truncated
        const needsStartEllipsis = snippetStart > 0;
        const needsEndEllipsis = snippetEnd < text.length;
        if (needsStartEllipsis) {
            snippet = '...' + snippet;
        }
        if (needsEndEllipsis) {
            snippet = snippet + '...';
        }
        return snippet.trim();
    }
    /**
     * Extend snippet boundaries to complete sentences
     *
     * @param text - Full text
     * @param start - Initial start index
     * @param end - Initial end index
     * @returns Extended boundaries
     */
    extendToSentenceBoundaries(text, start, end) {
        const sentenceEnders = ['.', '!', '?'];
        // Find sentence start (look backwards for sentence ender)
        let extendedStart = start;
        for (let i = start - 1; i >= 0; i--) {
            if (sentenceEnders.includes(text[i])) {
                extendedStart = i + 1;
                break;
            }
            if (start - i > this.CONTEXT_SIZE * 2) {
                break; // Don't extend too far
            }
        }
        // Find sentence end (look forwards for sentence ender)
        let extendedEnd = end;
        for (let i = end; i < text.length; i++) {
            if (sentenceEnders.includes(text[i])) {
                extendedEnd = i + 1;
                break;
            }
            if (i - end > this.CONTEXT_SIZE * 2) {
                break; // Don't extend too far
            }
        }
        return {
            start: extendedStart,
            end: extendedEnd,
        };
    }
    /**
     * Format date for display
     *
     * - Recent (< 7 days): Relative ("2 days ago")
     * - Older: Absolute ("Jan 15, 2025")
     *
     * @param dateString - ISO date string
     * @returns Formatted date string
     */
    formatDate(dateString) {
        if (!dateString) {
            return 'Unknown date';
        }
        const date = new Date(dateString);
        const now = new Date();
        // Calculate days difference
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        // Use relative dates for recent items
        if (diffDays < this.RELATIVE_DATE_THRESHOLD_DAYS) {
            if (diffDays === 0) {
                return 'Today';
            }
            else if (diffDays === 1) {
                return 'Yesterday';
            }
            else {
                return `${diffDays} days ago`;
            }
        }
        // Use absolute dates for older items
        return this.formatAbsoluteDate(date);
    }
    /**
     * Format absolute date
     *
     * @param date - Date object
     * @returns Formatted date string (e.g., "Jan 15, 2025")
     */
    formatAbsoluteDate(date) {
        const months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
        ];
        const month = months[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month} ${day}, ${year}`;
    }
    /**
     * Build source URL
     *
     * @param artifactId - Artifact ID
     * @param type - Artifact type
     * @returns URL to view artifact
     */
    buildSourceURL(artifactId, type) {
        const baseURL = process.env.AVON_BASE_URL || 'http://localhost:3000';
        // Map type to URL path
        const path = this.TYPE_MAP[type] || 'artifacts';
        return `${baseURL}/${path}/${artifactId}`;
    }
    /**
     * Format multiple provenances from same artifact
     *
     * Groups provenances by artifact_id
     *
     * @param provenances - Formatted provenances
     * @returns Grouped provenances
     */
    groupByArtifact(provenances) {
        const grouped = new Map();
        provenances.forEach(provenance => {
            const existing = grouped.get(provenance.artifact_id) || [];
            existing.push(provenance);
            grouped.set(provenance.artifact_id, existing);
        });
        return grouped;
    }
    /**
     * Get unique artifacts
     *
     * @param provenances - Formatted provenances
     * @returns Unique artifact IDs
     */
    getUniqueArtifacts(provenances) {
        const unique = new Set();
        provenances.forEach(p => unique.add(p.artifact_id));
        return Array.from(unique);
    }
    /**
     * Sort by date (most recent first)
     *
     * @param provenances - Formatted provenances
     * @returns Sorted provenances
     */
    sortByDate(provenances) {
        return [...provenances].sort((a, b) => {
            // Extract dates for comparison
            const dateA = this.parseDateFromFormatted(a.note_date);
            const dateB = this.parseDateFromFormatted(b.note_date);
            return dateB.getTime() - dateA.getTime(); // Most recent first
        });
    }
    /**
     * Parse date from formatted string
     *
     * @param formattedDate - Formatted date string
     * @returns Date object
     */
    parseDateFromFormatted(formattedDate) {
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
        // Handle absolute dates (e.g., "Jan 15, 2025")
        return new Date(formattedDate);
    }
    /**
     * Sort by relevance score (highest first)
     *
     * @param provenances - Formatted provenances
     * @returns Sorted provenances
     */
    sortByRelevance(provenances) {
        return [...provenances].sort((a, b) => b.relevance_score - a.relevance_score);
    }
    /**
     * Format as citation list (for display)
     *
     * @param provenances - Formatted provenances
     * @returns Formatted citation list string
     */
    formatAsCitationList(provenances) {
        let formatted = 'Sources:\n';
        formatted += '─'.repeat(80) + '\n\n';
        provenances.forEach((provenance, index) => {
            formatted += `${index + 1}. [${provenance.artifact_type}] ${provenance.artifact_id}\n`;
            formatted += `   Date: ${provenance.note_date}\n`;
            if (provenance.author) {
                formatted += `   Author: ${provenance.author}\n`;
            }
            formatted += `   Snippet: "${provenance.snippet}"\n`;
            formatted += `   Relevance: ${(provenance.relevance_score * 100).toFixed(0)}%\n`;
            formatted += `   URL: ${provenance.source_url}\n\n`;
        });
        return formatted;
    }
    /**
     * Explain formatting process
     *
     * @returns Explanation string
     */
    explain() {
        return `Provenance Formatting Process:

1. Snippet Extraction
   - Extract cited text from chunk
   - Add ${this.CONTEXT_SIZE} characters before and after
   - Extend to sentence boundaries when possible
   - Truncate to max ${this.MAX_SNIPPET_LENGTH} chars
   - Add ellipsis (...) if truncated

2. Date Formatting
   - Recent (< ${this.RELATIVE_DATE_THRESHOLD_DAYS} days): Relative ("2 days ago")
   - Older: Absolute ("Jan 15, 2025")

3. Source URL Construction
   - Base URL: ${process.env.AVON_BASE_URL || 'http://localhost:3000'}
   - Type mapping: ${JSON.stringify(this.TYPE_MAP, null, 2)}
   - Format: {base}/{type}/{artifact_id}

4. Output Format
   - artifact_id: Source artifact
   - artifact_type: Type of artifact
   - snippet: Cited text with context
   - note_date: Formatted date
   - author: Author (if available)
   - source_url: Link to full artifact
   - char_offsets: Original offsets
   - relevance_score: 0-1 score`;
    }
}
// Export singleton instance
const provenanceFormatter = new ProvenanceFormatter();
exports.default = provenanceFormatter;
//# sourceMappingURL=provenance-formatter.service.js.map