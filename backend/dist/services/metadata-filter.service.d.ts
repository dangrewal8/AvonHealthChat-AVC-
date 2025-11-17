/**
 * Metadata Filter Service
 *
 * Provides metadata-based filtering to narrow retrieval before vector search
 * Reduces search space and improves performance
 *
 * Features:
 * - Date range filtering
 * - Artifact type filtering
 * - Patient ID filtering
 * - Author filtering
 * - Efficient indexing for fast lookups
 * - Combined filters with AND logic
 *
 */
/**
 * Chunk with metadata
 */
export interface Chunk {
    chunk_id: string;
    artifact_id: string;
    patient_id: string;
    content: string;
    metadata: {
        artifact_type: string;
        date: string;
        author?: string;
        section?: string;
        [key: string]: any;
    };
    embedding?: number[];
}
/**
 * Filter criteria for metadata-based filtering
 */
export interface FilterCriteria {
    patient_id?: string;
    artifact_types?: string[];
    date_from?: string;
    date_to?: string;
    author?: string;
}
/**
 * Filter result with statistics
 */
export interface FilterResult {
    chunks: Chunk[];
    total_before: number;
    total_after: number;
    filters_applied: string[];
    execution_time_ms: number;
}
/**
 * Metadata Filter Class
 *
 * Efficient metadata-based filtering for chunks
 * Pre-filters data before vector search to reduce search space
 */
declare class MetadataFilter {
    private indexes;
    private indexesBuilt;
    constructor();
    /**
     * Build indexes for efficient filtering
     *
     * Call this after loading chunks to enable fast lookups
     *
     * @param chunks - Array of chunks to index
     */
    buildIndexes(chunks: Chunk[]): void;
    /**
     * Clear all indexes
     */
    clearIndexes(): void;
    /**
     * Filter chunks by date range
     *
     * @param chunks - Chunks to filter
     * @param from - Start date (ISO 8601)
     * @param to - End date (ISO 8601)
     * @returns Filtered chunks
     *
     * @example
     * filterByDate(chunks, "2024-01-01T00:00:00Z", "2024-03-31T23:59:59Z")
     */
    filterByDate(chunks: Chunk[], from: string, to: string): Chunk[];
    /**
     * Filter chunks by artifact types
     *
     * @param chunks - Chunks to filter
     * @param types - Array of artifact types
     * @returns Filtered chunks
     *
     * @example
     * filterByType(chunks, ["medication_order", "prescription"])
     */
    filterByType(chunks: Chunk[], types: string[]): Chunk[];
    /**
     * Filter chunks by patient ID
     *
     * @param chunks - Chunks to filter
     * @param patientId - Patient identifier
     * @returns Filtered chunks
     *
     * @example
     * filterByPatient(chunks, "patient_123")
     */
    filterByPatient(chunks: Chunk[], patientId: string): Chunk[];
    /**
     * Filter chunks by author
     *
     * @param chunks - Chunks to filter
     * @param author - Author name
     * @returns Filtered chunks
     */
    filterByAuthor(chunks: Chunk[], author: string): Chunk[];
    /**
     * Apply multiple filters with AND logic
     *
     * @param chunks - Chunks to filter
     * @param filters - Filter criteria
     * @returns Filtered chunks
     *
     * @example
     * applyFilters(chunks, {
     *   patient_id: "patient_123",
     *   artifact_types: ["medication_order"],
     *   date_from: "2024-01-01T00:00:00Z",
     *   date_to: "2024-03-31T23:59:59Z"
     * })
     */
    applyFilters(chunks: Chunk[], filters: FilterCriteria): Chunk[];
    /**
     * Apply filters with detailed result statistics
     *
     * @param chunks - Chunks to filter
     * @param filters - Filter criteria
     * @returns Filter result with statistics
     */
    applyFiltersWithStats(chunks: Chunk[], filters: FilterCriteria): FilterResult;
    /**
     * Apply filters using indexes for fast lookup
     *
     * This is significantly faster than applyFilters for large datasets
     * Requires buildIndexes() to be called first
     *
     * @param filters - Filter criteria
     * @returns Filtered chunks
     */
    applyFiltersWithIndexes(filters: FilterCriteria): Chunk[];
    /**
     * Get filter for vector store (Chroma/FAISS)
     *
     * Converts FilterCriteria to vector store query format
     *
     * @param filters - Filter criteria
     * @returns Vector store filter object
     */
    getVectorStoreFilter(filters: FilterCriteria): any;
    /**
     * Get chunk IDs for FAISS pre-filtering
     *
     * Returns array of chunk IDs that match filters
     * Use with FAISS to search only matching vectors
     *
     * @param filters - Filter criteria
     * @returns Array of chunk IDs
     */
    getFilteredChunkIds(filters: FilterCriteria): string[];
    /**
     * Check if filters will match any chunks
     *
     * @param filters - Filter criteria
     * @returns True if at least one chunk matches
     */
    hasMatchingChunks(filters: FilterCriteria): boolean;
    /**
     * Get filter statistics
     *
     * @param filters - Filter criteria
     * @returns Statistics about filter selectivity
     */
    getFilterStats(filters: FilterCriteria): {
        total_chunks: number;
        matching_chunks: number;
        selectivity: number;
        filters_applied: string[];
    };
    /**
     * Get index statistics
     *
     * @returns Index statistics
     */
    getIndexStats(): {
        total_chunks: number;
        unique_patients: number;
        unique_types: number;
        unique_authors: number;
        unique_dates: number;
        indexes_built: boolean;
    };
    /**
     * Validate filter criteria
     *
     * @param filters - Filter criteria to validate
     * @returns Validation result
     */
    validateFilters(filters: FilterCriteria): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Batch filter multiple filter criteria
     *
     * @param chunks - Chunks to filter
     * @param filtersList - Array of filter criteria
     * @returns Array of filtered chunk arrays
     */
    batchFilter(chunks: Chunk[], filtersList: FilterCriteria[]): Chunk[][];
    /**
     * Get all chunks from indexes
     *
     * @returns Array of all indexed chunks
     */
    getAllChunks(): Chunk[];
}
declare const metadataFilter: MetadataFilter;
export default metadataFilter;
//# sourceMappingURL=metadata-filter.service.d.ts.map