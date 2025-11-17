"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Metadata Filter Class
 *
 * Efficient metadata-based filtering for chunks
 * Pre-filters data before vector search to reduce search space
 */
class MetadataFilter {
    indexes;
    indexesBuilt = false;
    constructor() {
        this.indexes = {
            byPatient: new Map(),
            byType: new Map(),
            byAuthor: new Map(),
            byDate: new Map(),
            chunks: new Map(),
        };
    }
    /**
     * Build indexes for efficient filtering
     *
     * Call this after loading chunks to enable fast lookups
     *
     * @param chunks - Array of chunks to index
     */
    buildIndexes(chunks) {
        const startTime = Date.now();
        // Clear existing indexes
        this.clearIndexes();
        // Build indexes
        for (const chunk of chunks) {
            // Store chunk by ID
            this.indexes.chunks.set(chunk.chunk_id, chunk);
            // Index by patient
            if (!this.indexes.byPatient.has(chunk.patient_id)) {
                this.indexes.byPatient.set(chunk.patient_id, new Set());
            }
            this.indexes.byPatient.get(chunk.patient_id).add(chunk.chunk_id);
            // Index by artifact type
            const artifactType = chunk.metadata.artifact_type;
            if (!this.indexes.byType.has(artifactType)) {
                this.indexes.byType.set(artifactType, new Set());
            }
            this.indexes.byType.get(artifactType).add(chunk.chunk_id);
            // Index by author (if present)
            if (chunk.metadata.author) {
                if (!this.indexes.byAuthor.has(chunk.metadata.author)) {
                    this.indexes.byAuthor.set(chunk.metadata.author, new Set());
                }
                this.indexes.byAuthor.get(chunk.metadata.author).add(chunk.chunk_id);
            }
            // Index by date
            const date = chunk.metadata.date;
            if (date) {
                if (!this.indexes.byDate.has(date)) {
                    this.indexes.byDate.set(date, new Set());
                }
                this.indexes.byDate.get(date).add(chunk.chunk_id);
            }
        }
        this.indexesBuilt = true;
        const endTime = Date.now();
        console.log(`Indexes built for ${chunks.length} chunks in ${endTime - startTime}ms`);
    }
    /**
     * Clear all indexes
     */
    clearIndexes() {
        this.indexes.byPatient.clear();
        this.indexes.byType.clear();
        this.indexes.byAuthor.clear();
        this.indexes.byDate.clear();
        this.indexes.chunks.clear();
        this.indexesBuilt = false;
    }
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
    filterByDate(chunks, from, to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            throw new Error('Invalid date format. Use ISO 8601 format.');
        }
        return chunks.filter((chunk) => {
            const chunkDate = new Date(chunk.metadata.date);
            if (isNaN(chunkDate.getTime())) {
                return false; // Skip chunks with invalid dates
            }
            return chunkDate >= fromDate && chunkDate <= toDate;
        });
    }
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
    filterByType(chunks, types) {
        if (!types || types.length === 0) {
            return chunks;
        }
        const typeSet = new Set(types);
        return chunks.filter((chunk) => typeSet.has(chunk.metadata.artifact_type));
    }
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
    filterByPatient(chunks, patientId) {
        if (!patientId) {
            return chunks;
        }
        return chunks.filter((chunk) => chunk.patient_id === patientId);
    }
    /**
     * Filter chunks by author
     *
     * @param chunks - Chunks to filter
     * @param author - Author name
     * @returns Filtered chunks
     */
    filterByAuthor(chunks, author) {
        if (!author) {
            return chunks;
        }
        return chunks.filter((chunk) => chunk.metadata.author === author);
    }
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
    applyFilters(chunks, filters) {
        let filtered = chunks;
        // Filter by patient ID
        if (filters.patient_id) {
            filtered = this.filterByPatient(filtered, filters.patient_id);
        }
        // Filter by artifact types
        if (filters.artifact_types && filters.artifact_types.length > 0) {
            filtered = this.filterByType(filtered, filters.artifact_types);
        }
        // Filter by date range
        if (filters.date_from && filters.date_to) {
            filtered = this.filterByDate(filtered, filters.date_from, filters.date_to);
        }
        else if (filters.date_from) {
            // Only start date provided
            filtered = this.filterByDate(filtered, filters.date_from, new Date().toISOString());
        }
        else if (filters.date_to) {
            // Only end date provided
            filtered = this.filterByDate(filtered, '1970-01-01T00:00:00Z', filters.date_to);
        }
        // Filter by author
        if (filters.author) {
            filtered = this.filterByAuthor(filtered, filters.author);
        }
        return filtered;
    }
    /**
     * Apply filters with detailed result statistics
     *
     * @param chunks - Chunks to filter
     * @param filters - Filter criteria
     * @returns Filter result with statistics
     */
    applyFiltersWithStats(chunks, filters) {
        const startTime = Date.now();
        const totalBefore = chunks.length;
        const filtersApplied = [];
        // Apply filters
        const filtered = this.applyFilters(chunks, filters);
        // Track which filters were applied
        if (filters.patient_id)
            filtersApplied.push('patient_id');
        if (filters.artifact_types)
            filtersApplied.push('artifact_types');
        if (filters.date_from || filters.date_to)
            filtersApplied.push('date_range');
        if (filters.author)
            filtersApplied.push('author');
        const endTime = Date.now();
        return {
            chunks: filtered,
            total_before: totalBefore,
            total_after: filtered.length,
            filters_applied: filtersApplied,
            execution_time_ms: endTime - startTime,
        };
    }
    /**
     * Apply filters using indexes for fast lookup
     *
     * This is significantly faster than applyFilters for large datasets
     * Requires buildIndexes() to be called first
     *
     * @param filters - Filter criteria
     * @returns Filtered chunks
     */
    applyFiltersWithIndexes(filters) {
        if (!this.indexesBuilt) {
            throw new Error('Indexes not built. Call buildIndexes() first.');
        }
        // Start with all chunk IDs
        let candidateIds = null;
        // Filter by patient ID (using index)
        if (filters.patient_id) {
            const patientChunks = this.indexes.byPatient.get(filters.patient_id);
            if (!patientChunks) {
                return []; // No chunks for this patient
            }
            candidateIds = new Set(patientChunks);
        }
        // Filter by artifact types (using index)
        if (filters.artifact_types && filters.artifact_types.length > 0) {
            const typeChunks = new Set();
            for (const type of filters.artifact_types) {
                const chunks = this.indexes.byType.get(type);
                if (chunks) {
                    chunks.forEach((id) => typeChunks.add(id));
                }
            }
            if (candidateIds) {
                // Intersect with existing candidates (AND logic)
                candidateIds = new Set([...candidateIds].filter((id) => typeChunks.has(id)));
            }
            else {
                candidateIds = typeChunks;
            }
        }
        // Filter by author (using index)
        if (filters.author) {
            const authorChunks = this.indexes.byAuthor.get(filters.author);
            if (!authorChunks) {
                return []; // No chunks for this author
            }
            if (candidateIds) {
                candidateIds = new Set([...candidateIds].filter((id) => authorChunks.has(id)));
            }
            else {
                candidateIds = new Set(authorChunks);
            }
        }
        // If no filters applied, use all chunks
        if (!candidateIds) {
            candidateIds = new Set(this.indexes.chunks.keys());
        }
        // Convert chunk IDs to chunks
        const chunks = Array.from(candidateIds)
            .map((id) => this.indexes.chunks.get(id))
            .filter((chunk) => chunk !== undefined);
        // Filter by date range (no index, linear scan)
        if (filters.date_from || filters.date_to) {
            const from = filters.date_from || '1970-01-01T00:00:00Z';
            const to = filters.date_to || new Date().toISOString();
            return this.filterByDate(chunks, from, to);
        }
        return chunks;
    }
    /**
     * Get filter for vector store (Chroma/FAISS)
     *
     * Converts FilterCriteria to vector store query format
     *
     * @param filters - Filter criteria
     * @returns Vector store filter object
     */
    getVectorStoreFilter(filters) {
        const where = {};
        // Chroma-style where clause
        if (filters.patient_id) {
            where.patient_id = filters.patient_id;
        }
        if (filters.artifact_types && filters.artifact_types.length > 0) {
            where['metadata.artifact_type'] = {
                $in: filters.artifact_types,
            };
        }
        if (filters.date_from && filters.date_to) {
            where['metadata.date'] = {
                $gte: filters.date_from,
                $lte: filters.date_to,
            };
        }
        else if (filters.date_from) {
            where['metadata.date'] = {
                $gte: filters.date_from,
            };
        }
        else if (filters.date_to) {
            where['metadata.date'] = {
                $lte: filters.date_to,
            };
        }
        if (filters.author) {
            where['metadata.author'] = filters.author;
        }
        return where;
    }
    /**
     * Get chunk IDs for FAISS pre-filtering
     *
     * Returns array of chunk IDs that match filters
     * Use with FAISS to search only matching vectors
     *
     * @param filters - Filter criteria
     * @returns Array of chunk IDs
     */
    getFilteredChunkIds(filters) {
        if (this.indexesBuilt) {
            const chunks = this.applyFiltersWithIndexes(filters);
            return chunks.map((c) => c.chunk_id);
        }
        else {
            throw new Error('Indexes not built. Call buildIndexes() first for getFilteredChunkIds.');
        }
    }
    /**
     * Check if filters will match any chunks
     *
     * @param filters - Filter criteria
     * @returns True if at least one chunk matches
     */
    hasMatchingChunks(filters) {
        if (!this.indexesBuilt) {
            throw new Error('Indexes not built. Call buildIndexes() first.');
        }
        const chunks = this.applyFiltersWithIndexes(filters);
        return chunks.length > 0;
    }
    /**
     * Get filter statistics
     *
     * @param filters - Filter criteria
     * @returns Statistics about filter selectivity
     */
    getFilterStats(filters) {
        if (!this.indexesBuilt) {
            throw new Error('Indexes not built. Call buildIndexes() first.');
        }
        const totalChunks = this.indexes.chunks.size;
        const chunks = this.applyFiltersWithIndexes(filters);
        const matchingChunks = chunks.length;
        const selectivity = totalChunks > 0 ? matchingChunks / totalChunks : 0;
        const filtersApplied = [];
        if (filters.patient_id)
            filtersApplied.push('patient_id');
        if (filters.artifact_types)
            filtersApplied.push('artifact_types');
        if (filters.date_from || filters.date_to)
            filtersApplied.push('date_range');
        if (filters.author)
            filtersApplied.push('author');
        return {
            total_chunks: totalChunks,
            matching_chunks: matchingChunks,
            selectivity,
            filters_applied: filtersApplied,
        };
    }
    /**
     * Get index statistics
     *
     * @returns Index statistics
     */
    getIndexStats() {
        return {
            total_chunks: this.indexes.chunks.size,
            unique_patients: this.indexes.byPatient.size,
            unique_types: this.indexes.byType.size,
            unique_authors: this.indexes.byAuthor.size,
            unique_dates: this.indexes.byDate.size,
            indexes_built: this.indexesBuilt,
        };
    }
    /**
     * Validate filter criteria
     *
     * @param filters - Filter criteria to validate
     * @returns Validation result
     */
    validateFilters(filters) {
        const errors = [];
        // Validate patient ID
        if (filters.patient_id !== undefined && typeof filters.patient_id !== 'string') {
            errors.push('patient_id must be a string');
        }
        // Validate artifact types
        if (filters.artifact_types !== undefined) {
            if (!Array.isArray(filters.artifact_types)) {
                errors.push('artifact_types must be an array');
            }
            else if (filters.artifact_types.some((t) => typeof t !== 'string')) {
                errors.push('artifact_types must be an array of strings');
            }
        }
        // Validate dates
        if (filters.date_from) {
            const fromDate = new Date(filters.date_from);
            if (isNaN(fromDate.getTime())) {
                errors.push('date_from must be a valid ISO 8601 date');
            }
        }
        if (filters.date_to) {
            const toDate = new Date(filters.date_to);
            if (isNaN(toDate.getTime())) {
                errors.push('date_to must be a valid ISO 8601 date');
            }
        }
        // Validate date range
        if (filters.date_from && filters.date_to) {
            const fromDate = new Date(filters.date_from);
            const toDate = new Date(filters.date_to);
            if (fromDate > toDate) {
                errors.push('date_from must be before date_to');
            }
        }
        // Validate author
        if (filters.author !== undefined && typeof filters.author !== 'string') {
            errors.push('author must be a string');
        }
        return {
            valid: errors.length === 0,
            errors,
        };
    }
    /**
     * Batch filter multiple filter criteria
     *
     * @param chunks - Chunks to filter
     * @param filtersList - Array of filter criteria
     * @returns Array of filtered chunk arrays
     */
    batchFilter(chunks, filtersList) {
        return filtersList.map((filters) => this.applyFilters(chunks, filters));
    }
    /**
     * Get all chunks from indexes
     *
     * @returns Array of all indexed chunks
     */
    getAllChunks() {
        if (!this.indexesBuilt) {
            throw new Error('Indexes not built. Call buildIndexes() first.');
        }
        return Array.from(this.indexes.chunks.values());
    }
}
// Export singleton instance
const metadataFilter = new MetadataFilter();
exports.default = metadataFilter;
//# sourceMappingURL=metadata-filter.service.js.map