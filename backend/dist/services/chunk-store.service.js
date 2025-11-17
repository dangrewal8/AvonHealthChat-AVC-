"use strict";
/**
 * Chunk Store Service
 *
 * Storage and metadata management for parsed chunks.
 *
 * Requirements:
 * - In-memory Map storage for demo
 * - Multiple indexes for efficient retrieval
 * - Query filtering by multiple criteria
 * - Cleanup and garbage collection
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Chunk Store Class
 *
 * Manages storage and retrieval of parsed chunks with efficient indexing
 */
class ChunkStore {
    /**
     * Primary storage: chunk_id -> ParsedChunk
     */
    chunks = new Map();
    /**
     * Index: artifact_id -> Set<chunk_id>
     */
    artifactIndex = new Map();
    /**
     * Index: patient_id -> Set<chunk_id>
     */
    patientIndex = new Map();
    /**
     * Index: date (YYYY-MM-DD) -> Set<chunk_id>
     */
    dateIndex = new Map();
    /**
     * Store chunks
     *
     * Store parsed chunks with automatic indexing
     *
     * @param chunks - Chunks to store
     * @returns Store result with statistics
     */
    async store(chunks) {
        const startTime = Date.now();
        let storedCount = 0;
        let skippedCount = 0;
        const errors = [];
        for (const chunk of chunks) {
            try {
                // Validate chunk
                this.validateChunk(chunk);
                // Check if already exists
                if (this.chunks.has(chunk.chunk_id)) {
                    skippedCount++;
                    continue;
                }
                // Store in primary storage
                this.chunks.set(chunk.chunk_id, chunk);
                // Update indexes
                this.updateIndexes(chunk);
                storedCount++;
            }
            catch (error) {
                errors.push(`Chunk ${chunk.chunk_id}: ${error instanceof Error ? error.message : String(error)}`);
                skippedCount++;
            }
        }
        const processingTime = Date.now() - startTime;
        return {
            success: errors.length === 0,
            stored_count: storedCount,
            skipped_count: skippedCount,
            errors,
            processing_time_ms: processingTime,
        };
    }
    /**
     * Retrieve chunk by ID
     *
     * Get single chunk by chunk_id
     *
     * @param chunkId - Chunk ID to retrieve
     * @returns Chunk or null if not found
     */
    async retrieve(chunkId) {
        return this.chunks.get(chunkId) || null;
    }
    /**
     * Query chunks with filters
     *
     * Filter chunks by multiple criteria
     *
     * @param filters - Filter criteria
     * @returns Matching chunks
     */
    async query(filters = {}) {
        let results = null;
        // Apply patient filter
        if (filters.patient_id) {
            const patientChunks = this.patientIndex.get(filters.patient_id);
            if (!patientChunks) {
                return []; // No chunks for this patient
            }
            results = new Set(patientChunks);
        }
        // Apply artifact filter
        if (filters.artifact_id) {
            const artifactChunks = this.artifactIndex.get(filters.artifact_id);
            if (!artifactChunks) {
                return []; // No chunks for this artifact
            }
            results = results
                ? this.intersect(results, artifactChunks)
                : new Set(artifactChunks);
        }
        // Apply date range filter
        if (filters.date_from || filters.date_to) {
            const dateChunks = this.getChunksInDateRange(filters.date_from, filters.date_to);
            results = results ? this.intersect(results, dateChunks) : dateChunks;
        }
        // If no filters applied, get all chunks
        if (results === null) {
            results = new Set(this.chunks.keys());
        }
        // Convert to chunks and apply remaining filters
        let chunks = [];
        for (const chunkId of results) {
            const chunk = this.chunks.get(chunkId);
            if (chunk) {
                chunks.push(chunk);
            }
        }
        // Apply artifact_type filter
        if (filters.artifact_type) {
            chunks = chunks.filter((chunk) => chunk.artifact_type === filters.artifact_type);
        }
        // Apply entity_type filter
        if (filters.entity_type) {
            chunks = chunks.filter((chunk) => chunk.entities.some((entity) => entity.type === filters.entity_type));
        }
        // Apply entity_text filter
        if (filters.entity_text) {
            const searchText = filters.entity_text.toLowerCase();
            chunks = chunks.filter((chunk) => chunk.entities.some((entity) => entity.text.toLowerCase().includes(searchText) ||
                entity.normalized.toLowerCase().includes(searchText)));
        }
        // Sort by date (newest first)
        chunks.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
        // Apply pagination
        const offset = filters.offset || 0;
        const limit = filters.limit || chunks.length;
        return chunks.slice(offset, offset + limit);
    }
    /**
     * Get chunks by patient
     *
     * Retrieve all chunks for a patient
     *
     * @param patientId - Patient ID
     * @returns Array of chunks
     */
    async getByPatient(patientId) {
        return this.query({ patient_id: patientId });
    }
    /**
     * Get chunks by artifact
     *
     * Retrieve all chunks for an artifact
     *
     * @param artifactId - Artifact ID
     * @returns Array of chunks
     */
    async getByArtifact(artifactId) {
        return this.query({ artifact_id: artifactId });
    }
    /**
     * Delete chunk by ID
     *
     * Remove chunk and update indexes
     *
     * @param chunkId - Chunk ID to delete
     * @returns True if deleted, false if not found
     */
    async delete(chunkId) {
        const chunk = this.chunks.get(chunkId);
        if (!chunk) {
            return false;
        }
        // Remove from primary storage
        this.chunks.delete(chunkId);
        // Remove from indexes
        this.removeFromIndexes(chunk);
        return true;
    }
    /**
     * Delete chunks by patient
     *
     * Remove all chunks for a patient
     *
     * @param patientId - Patient ID
     * @returns Number of chunks deleted
     */
    async deleteByPatient(patientId) {
        const chunks = await this.getByPatient(patientId);
        let deletedCount = 0;
        for (const chunk of chunks) {
            const deleted = await this.delete(chunk.chunk_id);
            if (deleted) {
                deletedCount++;
            }
        }
        return deletedCount;
    }
    /**
     * Delete chunks by artifact
     *
     * Remove all chunks for an artifact
     *
     * @param artifactId - Artifact ID
     * @returns Number of chunks deleted
     */
    async deleteByArtifact(artifactId) {
        const chunks = await this.getByArtifact(artifactId);
        let deletedCount = 0;
        for (const chunk of chunks) {
            const deleted = await this.delete(chunk.chunk_id);
            if (deleted) {
                deletedCount++;
            }
        }
        return deletedCount;
    }
    /**
     * Clear all chunks
     *
     * Remove all stored chunks and reset indexes
     *
     * @returns Number of chunks cleared
     */
    async clear() {
        const count = this.chunks.size;
        this.chunks.clear();
        this.artifactIndex.clear();
        this.patientIndex.clear();
        this.dateIndex.clear();
        return count;
    }
    /**
     * Garbage collection
     *
     * Remove chunks older than specified date
     *
     * @param olderThan - ISO 8601 date - remove chunks before this date
     * @returns Number of chunks removed
     */
    async garbageCollect(olderThan) {
        const cutoffDate = new Date(olderThan);
        let removedCount = 0;
        const chunksToRemove = [];
        for (const [chunkId, chunk] of this.chunks) {
            const chunkDate = new Date(chunk.occurred_at);
            if (chunkDate < cutoffDate) {
                chunksToRemove.push(chunkId);
            }
        }
        for (const chunkId of chunksToRemove) {
            const deleted = await this.delete(chunkId);
            if (deleted) {
                removedCount++;
            }
        }
        return removedCount;
    }
    /**
     * Get storage statistics
     *
     * Calculate statistics about stored chunks
     *
     * @returns Storage statistics
     */
    async getStatistics() {
        const patients = new Set();
        const artifacts = new Set();
        const byType = {
            care_plan: 0,
            medication: 0,
            note: 0,
        };
        let oldestDate = null;
        let newestDate = null;
        for (const chunk of this.chunks.values()) {
            patients.add(chunk.patient_id);
            artifacts.add(chunk.artifact_id);
            // Type-safe increment
            const artifactType = chunk.artifact_type;
            byType[artifactType]++;
            const chunkDate = new Date(chunk.occurred_at);
            if (!oldestDate || chunkDate < oldestDate) {
                oldestDate = chunkDate;
            }
            if (!newestDate || chunkDate > newestDate) {
                newestDate = chunkDate;
            }
        }
        return {
            total_chunks: this.chunks.size,
            total_patients: patients.size,
            total_artifacts: artifacts.size,
            chunks_by_type: byType,
            oldest_chunk_date: oldestDate ? oldestDate.toISOString() : null,
            newest_chunk_date: newestDate ? newestDate.toISOString() : null,
            memory_usage_bytes: this.estimateMemoryUsage(),
        };
    }
    /**
     * Count chunks
     *
     * Get total number of stored chunks
     *
     * @returns Chunk count
     */
    count() {
        return this.chunks.size;
    }
    /**
     * Has chunk
     *
     * Check if chunk exists
     *
     * @param chunkId - Chunk ID to check
     * @returns True if exists
     */
    has(chunkId) {
        return this.chunks.has(chunkId);
    }
    /**
     * Update indexes
     *
     * Add chunk to all indexes
     *
     * @param chunk - Chunk to index
     */
    updateIndexes(chunk) {
        // Artifact index
        if (!this.artifactIndex.has(chunk.artifact_id)) {
            this.artifactIndex.set(chunk.artifact_id, new Set());
        }
        this.artifactIndex.get(chunk.artifact_id).add(chunk.chunk_id);
        // Patient index
        if (!this.patientIndex.has(chunk.patient_id)) {
            this.patientIndex.set(chunk.patient_id, new Set());
        }
        this.patientIndex.get(chunk.patient_id).add(chunk.chunk_id);
        // Date index (by date only, not time)
        const dateKey = chunk.occurred_at.split('T')[0]; // YYYY-MM-DD
        if (!this.dateIndex.has(dateKey)) {
            this.dateIndex.set(dateKey, new Set());
        }
        this.dateIndex.get(dateKey).add(chunk.chunk_id);
    }
    /**
     * Remove from indexes
     *
     * Remove chunk from all indexes
     *
     * @param chunk - Chunk to remove
     */
    removeFromIndexes(chunk) {
        // Artifact index
        const artifactSet = this.artifactIndex.get(chunk.artifact_id);
        if (artifactSet) {
            artifactSet.delete(chunk.chunk_id);
            if (artifactSet.size === 0) {
                this.artifactIndex.delete(chunk.artifact_id);
            }
        }
        // Patient index
        const patientSet = this.patientIndex.get(chunk.patient_id);
        if (patientSet) {
            patientSet.delete(chunk.chunk_id);
            if (patientSet.size === 0) {
                this.patientIndex.delete(chunk.patient_id);
            }
        }
        // Date index
        const dateKey = chunk.occurred_at.split('T')[0];
        const dateSet = this.dateIndex.get(dateKey);
        if (dateSet) {
            dateSet.delete(chunk.chunk_id);
            if (dateSet.size === 0) {
                this.dateIndex.delete(dateKey);
            }
        }
    }
    /**
     * Get chunks in date range
     *
     * Query by date range using date index
     *
     * @param dateFrom - Start date (inclusive)
     * @param dateTo - End date (inclusive)
     * @returns Set of chunk IDs
     */
    getChunksInDateRange(dateFrom, dateTo) {
        const results = new Set();
        for (const [dateKey, chunkIds] of this.dateIndex) {
            // Check if date is in range
            if (dateFrom && dateKey < dateFrom.split('T')[0]) {
                continue;
            }
            if (dateTo && dateKey > dateTo.split('T')[0]) {
                continue;
            }
            // Add all chunk IDs for this date
            for (const chunkId of chunkIds) {
                results.add(chunkId);
            }
        }
        return results;
    }
    /**
     * Intersect two sets
     *
     * Return intersection of two sets
     *
     * @param setA - First set
     * @param setB - Second set
     * @returns Intersection
     */
    intersect(setA, setB) {
        const result = new Set();
        for (const item of setA) {
            if (setB.has(item)) {
                result.add(item);
            }
        }
        return result;
    }
    /**
     * Validate chunk
     *
     * Ensure chunk has required fields
     *
     * @param chunk - Chunk to validate
     * @throws Error if invalid
     */
    validateChunk(chunk) {
        if (!chunk.chunk_id) {
            throw new Error('Chunk missing required field: chunk_id');
        }
        if (!chunk.artifact_id) {
            throw new Error('Chunk missing required field: artifact_id');
        }
        if (!chunk.patient_id) {
            throw new Error('Chunk missing required field: patient_id');
        }
        if (!chunk.occurred_at) {
            throw new Error('Chunk missing required field: occurred_at');
        }
        if (!chunk.chunk_text) {
            throw new Error('Chunk missing required field: chunk_text');
        }
    }
    /**
     * Estimate memory usage
     *
     * Rough estimate of memory used by stored chunks
     *
     * @returns Estimated bytes
     */
    estimateMemoryUsage() {
        let bytes = 0;
        // Estimate chunk storage
        for (const chunk of this.chunks.values()) {
            // Text content
            bytes += chunk.chunk_text.length * 2; // UTF-16
            // Metadata
            bytes += 200; // Rough estimate for IDs, dates, etc.
            // Entities
            bytes += chunk.entities.length * 100; // Rough estimate per entity
        }
        // Add index overhead (rough estimate)
        bytes += this.artifactIndex.size * 50;
        bytes += this.patientIndex.size * 50;
        bytes += this.dateIndex.size * 50;
        return bytes;
    }
    /**
     * Explain Chunk Store
     *
     * @returns Explanation string
     */
    explain() {
        return `Chunk Store:

Purpose:
Store and retrieve parsed chunks with efficient indexing for citation validation.

Storage Backend:
- In-memory Map for demo/development
- O(1) lookup by chunk_id
- Can be replaced with PostgreSQL for production

Indexes:
1. Primary: chunk_id -> ParsedChunk
2. Artifact: artifact_id -> Set<chunk_id>
3. Patient: patient_id -> Set<chunk_id>
4. Date: YYYY-MM-DD -> Set<chunk_id>

Query Filtering:
- patient_id: Get all chunks for patient
- artifact_id: Get all chunks for artifact
- artifact_type: Filter by care_plan/medication/note
- date_from/date_to: Date range queries
- entity_type: Has specific entity type
- entity_text: Has entity with text
- limit/offset: Pagination

Efficient Retrieval:
- Index lookups for filtered queries
- Set intersection for multiple filters
- Sorted by date (newest first)
- Pagination support

Operations:
- store(chunks): Store chunks with auto-indexing
- retrieve(chunkId): Get single chunk
- query(filters): Filter and retrieve chunks
- delete(chunkId): Remove chunk
- deleteByPatient(patientId): Remove patient data
- deleteByArtifact(artifactId): Remove artifact chunks
- clear(): Remove all chunks
- garbageCollect(olderThan): Remove old chunks

Cleanup:
- Manual deletion by ID/patient/artifact
- Garbage collection by date
- Automatic index cleanup
- Memory usage tracking

Statistics:
- Total chunks/patients/artifacts
- Breakdown by artifact type
- Date range of stored data
- Memory usage estimate

Integration:
1. Parser Agent creates ParsedChunks
2. Store chunks with indexing
3. Retrieve for citation validation
4. Query for filtered results
5. Cleanup old/deleted data

Tech Stack: Node.js + TypeScript ONLY
In-memory Map storage (production: PostgreSQL)`;
    }
}
// Export singleton instance
const chunkStore = new ChunkStore();
exports.default = chunkStore;
//# sourceMappingURL=chunk-store.service.js.map