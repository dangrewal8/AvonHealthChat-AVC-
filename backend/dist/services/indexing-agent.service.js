"use strict";
/**
 * Indexing Agent Service
 *
 * Orchestrates the complete embedding and indexing pipeline:
 * - Chunk-level embeddings for broad retrieval
 * - Sentence-level embeddings for precise citations
 * - Keyword indexing for hybrid search
 * - Metadata storage for filtering
 * - Progress tracking and error recovery
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const embedding_factory_service_1 = __importDefault(require("./embedding-factory.service"));
const sentence_embedding_service_1 = __importDefault(require("./sentence-embedding.service"));
const faiss_vector_store_service_1 = __importDefault(require("./faiss-vector-store.service"));
const metadata_db_service_1 = __importDefault(require("./metadata-db.service"));
const hybrid_search_service_1 = __importDefault(require("./hybrid-search.service"));
/**
 * Indexing Agent
 *
 * Orchestrates the complete embedding and indexing pipeline
 */
class IndexingAgent {
    metadataCache;
    isInitialized = false;
    constructor() {
        this.metadataCache = {
            chunkMetadata: new Map(),
            patientIndex: new Map(),
            artifactIndex: new Map(),
            typeIndex: new Map(),
            dateIndex: new Map(),
        };
    }
    /**
     * Initialize the indexing agent
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        // Services should already be initialized by application
        this.isInitialized = true;
    }
    /**
     * Index chunks with chunk-level and sentence-level embeddings
     *
     * Pipeline:
     * 1. Extract text from chunks
     * 2. Generate chunk-level embeddings (batch)
     * 3. Segment into sentences and generate sentence-level embeddings (batch)
     * 4. Store in FAISS vector store
     * 5. Store metadata in PostgreSQL
     * 6. Build keyword index for hybrid search
     * 7. Update in-memory metadata cache
     *
     * @param chunks - Array of chunks to index
     * @param onProgress - Optional progress callback
     * @returns IndexingResult
     */
    async indexChunks(chunks, onProgress) {
        const startTime = Date.now();
        const errors = [];
        let chunksIndexed = 0;
        let sentencesIndexed = 0;
        let chunkEmbeddingsGenerated = 0;
        let sentenceEmbeddingsGenerated = 0;
        try {
            // Stage 1: Extract text and validate
            this.reportProgress(onProgress, {
                stage: 'extracting',
                chunksProcessed: 0,
                chunksTotal: chunks.length,
                sentencesProcessed: 0,
                sentencesTotal: 0,
                percentComplete: 0,
            });
            const validChunks = chunks.filter(chunk => {
                if (!chunk.text || chunk.text.trim().length === 0) {
                    errors.push({
                        chunk_id: chunk.chunk_id,
                        error: 'Empty chunk text',
                    });
                    return false;
                }
                return true;
            });
            if (validChunks.length === 0) {
                return {
                    success: false,
                    chunksIndexed: 0,
                    sentencesIndexed: 0,
                    chunkEmbeddingsGenerated: 0,
                    sentenceEmbeddingsGenerated: 0,
                    errors,
                    duration: Date.now() - startTime,
                };
            }
            // Stage 2: Generate chunk-level embeddings (batch)
            this.reportProgress(onProgress, {
                stage: 'embedding_chunks',
                chunksProcessed: 0,
                chunksTotal: validChunks.length,
                sentencesProcessed: 0,
                sentencesTotal: 0,
                percentComplete: 10,
            });
            const chunkTexts = validChunks.map(c => c.text);
            const chunkEmbeddings = await embedding_factory_service_1.default.generateBatchEmbeddings(chunkTexts);
            chunkEmbeddingsGenerated = chunkEmbeddings.length;
            // Stage 3: Segment into sentences and generate sentence-level embeddings
            this.reportProgress(onProgress, {
                stage: 'embedding_sentences',
                chunksProcessed: 0,
                chunksTotal: validChunks.length,
                sentencesProcessed: 0,
                sentencesTotal: 0,
                percentComplete: 30,
            });
            const allSentenceEmbeddings = [];
            let totalSentences = 0;
            for (let i = 0; i < validChunks.length; i++) {
                const chunk = validChunks[i];
                try {
                    // Segment chunk into sentences
                    const sentences = sentence_embedding_service_1.default.segmentIntoSentences(chunk.text, chunk.chunk_id, chunk.absolute_offset);
                    totalSentences += sentences.length;
                    // Generate sentence embeddings
                    const sentenceEmbeddings = await sentence_embedding_service_1.default.embedSentences(sentences, chunk.artifact_id, chunk.metadata);
                    allSentenceEmbeddings.push(...sentenceEmbeddings);
                    sentenceEmbeddingsGenerated += sentenceEmbeddings.length;
                    sentencesIndexed += sentences.length;
                    this.reportProgress(onProgress, {
                        stage: 'embedding_sentences',
                        chunksProcessed: i + 1,
                        chunksTotal: validChunks.length,
                        sentencesProcessed: sentencesIndexed,
                        sentencesTotal: totalSentences,
                        percentComplete: 30 + Math.floor((i + 1) / validChunks.length * 30),
                        currentChunk: chunk.chunk_id,
                    });
                }
                catch (error) {
                    errors.push({
                        chunk_id: chunk.chunk_id,
                        error: `Sentence embedding failed: ${error instanceof Error ? error.message : String(error)}`,
                    });
                }
            }
            // Stage 4: Store in FAISS vector store
            this.reportProgress(onProgress, {
                stage: 'storing',
                chunksProcessed: validChunks.length,
                chunksTotal: validChunks.length,
                sentencesProcessed: sentencesIndexed,
                sentencesTotal: totalSentences,
                percentComplete: 60,
            });
            // Store chunk-level embeddings in FAISS
            try {
                await faiss_vector_store_service_1.default.addVectors(chunkEmbeddings, validChunks.map(c => c.chunk_id));
                chunksIndexed = validChunks.length;
            }
            catch (error) {
                errors.push({
                    chunk_id: 'chunk_storage',
                    error: `FAISS storage failed: ${error instanceof Error ? error.message : String(error)}`,
                });
            }
            // Store chunk metadata in PostgreSQL (batch)
            try {
                const chunkMetadata = validChunks.map(chunk => ({
                    chunk_id: chunk.chunk_id,
                    artifact_id: chunk.artifact_id,
                    patient_id: chunk.metadata?.patient_id || '',
                    artifact_type: chunk.metadata?.artifact_type || '',
                    occurred_at: chunk.metadata?.occurred_at || new Date().toISOString(),
                    author: chunk.metadata?.author || '',
                    chunk_text: chunk.text,
                    char_offsets: [chunk.absolute_offset, chunk.absolute_offset + chunk.text.length],
                    source_url: chunk.metadata?.source_url || '',
                }));
                await metadata_db_service_1.default.insertChunks(chunkMetadata);
            }
            catch (error) {
                errors.push({
                    chunk_id: 'metadata_storage',
                    error: `Metadata storage failed: ${error instanceof Error ? error.message : String(error)}`,
                });
            }
            // Store sentence-level embeddings
            if (allSentenceEmbeddings.length > 0) {
                try {
                    await sentence_embedding_service_1.default.storeSentenceEmbeddings(allSentenceEmbeddings);
                }
                catch (error) {
                    errors.push({
                        chunk_id: 'sentence_storage',
                        error: `Sentence storage failed: ${error instanceof Error ? error.message : String(error)}`,
                    });
                }
            }
            // Stage 5: Build keyword index for hybrid search
            this.reportProgress(onProgress, {
                stage: 'indexing_keywords',
                chunksProcessed: validChunks.length,
                chunksTotal: validChunks.length,
                sentencesProcessed: sentencesIndexed,
                sentencesTotal: totalSentences,
                percentComplete: 80,
            });
            try {
                const documents = validChunks.map((chunk, i) => ({
                    chunk_id: chunk.chunk_id,
                    chunk_text: chunk.text,
                    embedding: chunkEmbeddings[i],
                    metadata: {
                        artifact_id: chunk.artifact_id,
                        patient_id: chunk.metadata?.patient_id || '',
                        artifact_type: chunk.metadata?.artifact_type || '',
                        occurred_at: chunk.metadata?.occurred_at || new Date().toISOString(),
                        author: chunk.metadata?.author || '',
                        source_url: chunk.metadata?.source_url || '',
                    },
                }));
                await hybrid_search_service_1.default.addDocuments(documents);
            }
            catch (error) {
                errors.push({
                    chunk_id: 'keyword_indexing',
                    error: `Keyword indexing failed: ${error instanceof Error ? error.message : String(error)}`,
                });
            }
            // Stage 6: Update in-memory metadata cache
            this.updateMetadataCache(validChunks);
            // Stage 7: Complete
            this.reportProgress(onProgress, {
                stage: 'complete',
                chunksProcessed: validChunks.length,
                chunksTotal: validChunks.length,
                sentencesProcessed: sentencesIndexed,
                sentencesTotal: totalSentences,
                percentComplete: 100,
            });
            return {
                success: errors.length === 0,
                chunksIndexed,
                sentencesIndexed,
                chunkEmbeddingsGenerated,
                sentenceEmbeddingsGenerated,
                errors,
                duration: Date.now() - startTime,
            };
        }
        catch (error) {
            errors.push({
                chunk_id: 'pipeline',
                error: `Pipeline failed: ${error instanceof Error ? error.message : String(error)}`,
            });
            return {
                success: false,
                chunksIndexed,
                sentencesIndexed,
                chunkEmbeddingsGenerated,
                sentenceEmbeddingsGenerated,
                errors,
                duration: Date.now() - startTime,
            };
        }
    }
    /**
     * Reindex an entire artifact
     *
     * Retrieves all chunks for the artifact and reindexes them
     *
     * @param artifactId - Artifact ID to reindex
     * @param onProgress - Optional progress callback
     */
    async reindexArtifact(artifactId, onProgress) {
        // Get all chunk IDs for this artifact from cache
        const artifactChunkIds = this.metadataCache.artifactIndex.get(artifactId);
        if (!artifactChunkIds || artifactChunkIds.size === 0) {
            return {
                success: false,
                chunksIndexed: 0,
                sentencesIndexed: 0,
                chunkEmbeddingsGenerated: 0,
                sentenceEmbeddingsGenerated: 0,
                errors: [
                    {
                        chunk_id: artifactId,
                        error: 'No chunks found for artifact',
                    },
                ],
                duration: 0,
            };
        }
        // Retrieve full chunk metadata
        const chunks = await metadata_db_service_1.default.getChunksByIds(Array.from(artifactChunkIds));
        if (chunks.length === 0) {
            return {
                success: false,
                chunksIndexed: 0,
                sentencesIndexed: 0,
                chunkEmbeddingsGenerated: 0,
                sentenceEmbeddingsGenerated: 0,
                errors: [
                    {
                        chunk_id: artifactId,
                        error: 'Failed to retrieve chunk metadata',
                    },
                ],
                duration: 0,
            };
        }
        // Delete existing chunks from metadata DB
        await metadata_db_service_1.default.deleteChunks(Array.from(artifactChunkIds));
        // Remove from cache
        for (const chunkId of artifactChunkIds) {
            this.removeFromCache(chunkId);
        }
        // Convert DB chunks to indexing format
        const indexingChunks = chunks.map(chunk => ({
            chunk_id: chunk.chunk_id,
            artifact_id: chunk.artifact_id,
            text: chunk.chunk_text,
            chunk_index: 0, // Not stored in DB, use default
            absolute_offset: chunk.char_offsets?.[0] || 0,
            metadata: {
                patient_id: chunk.patient_id,
                artifact_type: chunk.artifact_type,
                occurred_at: typeof chunk.occurred_at === 'string' ? chunk.occurred_at : chunk.occurred_at.toISOString(),
                author: chunk.author,
                source_url: chunk.source_url,
            },
        }));
        // Reindex all chunks
        return this.indexChunks(indexingChunks, onProgress);
    }
    /**
     * Clear the entire index
     *
     * Removes all vectors, metadata, and cache
     */
    async clearIndex() {
        // Clear FAISS vector store
        faiss_vector_store_service_1.default.clear();
        // Note: MetadataDB and HybridSearch don't have clear methods
        // They would need to be manually cleared via SQL or service reinitialization
        // For now, we just clear the in-memory cache
        // Clear in-memory cache
        this.metadataCache.chunkMetadata.clear();
        this.metadataCache.patientIndex.clear();
        this.metadataCache.artifactIndex.clear();
        this.metadataCache.typeIndex.clear();
        this.metadataCache.dateIndex.clear();
    }
    /**
     * Get index statistics
     *
     * @returns IndexStats
     */
    async getIndexStats() {
        // Get stats from metadata DB
        const dbStats = await metadata_db_service_1.default.getStats();
        const totalChunks = dbStats.totalChunks;
        // Use cache for unique counts (more accurate)
        const patients = this.metadataCache.patientIndex.size;
        const artifacts = this.metadataCache.artifactIndex.size;
        const artifactTypes = Array.from(this.metadataCache.typeIndex.keys());
        // Get date range from cache
        const dates = Array.from(this.metadataCache.dateIndex.keys()).sort();
        const earliest = dates.length > 0 ? dates[0] : null;
        const latest = dates.length > 0 ? dates[dates.length - 1] : null;
        // Estimate sentence count (rough: 5 sentences per chunk average)
        const totalSentences = this.metadataCache.chunkMetadata.size * 5;
        // Estimate index sizes
        const vectorSize = totalChunks * 1536 * 4; // 1536-dim vectors, 4 bytes per float
        const sentenceVectorSize = totalSentences * 1536 * 4;
        const totalVectorSize = vectorSize + sentenceVectorSize;
        // Estimate metadata size (rough approximation)
        const avgChunkSize = 500; // characters
        const avgSentenceSize = 100; // characters
        const metadataSize = totalChunks * avgChunkSize + totalSentences * avgSentenceSize;
        return {
            totalChunks,
            totalSentences,
            totalChunkEmbeddings: totalChunks,
            totalSentenceEmbeddings: totalSentences,
            patients,
            artifacts,
            artifactTypes,
            dateRange: {
                earliest,
                latest,
            },
            indexSize: {
                vectorStore: this.formatBytes(totalVectorSize),
                metadata: this.formatBytes(metadataSize),
            },
        };
    }
    /**
     * Get chunks by filter criteria
     *
     * Uses in-memory cache for fast filtering
     *
     * @param filters - Filter criteria
     * @returns Array of chunk IDs
     */
    getChunksByFilter(filters) {
        let resultSet = null;
        // Apply patient filter
        if (filters.patientId && this.metadataCache.patientIndex.has(filters.patientId)) {
            resultSet = new Set(this.metadataCache.patientIndex.get(filters.patientId));
        }
        // Apply artifact filter
        if (filters.artifactId) {
            const artifactChunks = this.metadataCache.artifactIndex.get(filters.artifactId);
            if (artifactChunks) {
                if (resultSet) {
                    resultSet = new Set([...resultSet].filter(id => artifactChunks.has(id)));
                }
                else {
                    resultSet = new Set(artifactChunks);
                }
            }
            else {
                return [];
            }
        }
        // Apply type filter
        if (filters.artifactType) {
            const typeChunks = this.metadataCache.typeIndex.get(filters.artifactType);
            if (typeChunks) {
                if (resultSet) {
                    resultSet = new Set([...resultSet].filter(id => typeChunks.has(id)));
                }
                else {
                    resultSet = new Set(typeChunks);
                }
            }
            else {
                return [];
            }
        }
        // Apply date filter
        if (filters.date) {
            const dateChunks = this.metadataCache.dateIndex.get(filters.date);
            if (dateChunks) {
                if (resultSet) {
                    resultSet = new Set([...resultSet].filter(id => dateChunks.has(id)));
                }
                else {
                    resultSet = new Set(dateChunks);
                }
            }
            else {
                return [];
            }
        }
        return resultSet ? Array.from(resultSet) : [];
    }
    /**
     * Get chunk metadata by ID
     *
     * @param chunkId - Chunk ID
     * @returns Chunk metadata or undefined
     */
    getChunkMetadata(chunkId) {
        return this.metadataCache.chunkMetadata.get(chunkId);
    }
    /**
     * Update in-memory metadata cache
     *
     * @param chunks - Chunks to add to cache
     */
    updateMetadataCache(chunks) {
        for (const chunk of chunks) {
            // Store chunk metadata
            this.metadataCache.chunkMetadata.set(chunk.chunk_id, chunk);
            // Index by patient
            if (chunk.metadata?.patient_id) {
                if (!this.metadataCache.patientIndex.has(chunk.metadata.patient_id)) {
                    this.metadataCache.patientIndex.set(chunk.metadata.patient_id, new Set());
                }
                this.metadataCache.patientIndex.get(chunk.metadata.patient_id).add(chunk.chunk_id);
            }
            // Index by artifact
            if (!this.metadataCache.artifactIndex.has(chunk.artifact_id)) {
                this.metadataCache.artifactIndex.set(chunk.artifact_id, new Set());
            }
            this.metadataCache.artifactIndex.get(chunk.artifact_id).add(chunk.chunk_id);
            // Index by type
            if (chunk.metadata?.artifact_type) {
                if (!this.metadataCache.typeIndex.has(chunk.metadata.artifact_type)) {
                    this.metadataCache.typeIndex.set(chunk.metadata.artifact_type, new Set());
                }
                this.metadataCache.typeIndex.get(chunk.metadata.artifact_type).add(chunk.chunk_id);
            }
            // Index by date
            if (chunk.metadata?.occurred_at) {
                const date = chunk.metadata.occurred_at.split('T')[0]; // Extract YYYY-MM-DD
                if (!this.metadataCache.dateIndex.has(date)) {
                    this.metadataCache.dateIndex.set(date, new Set());
                }
                this.metadataCache.dateIndex.get(date).add(chunk.chunk_id);
            }
        }
    }
    /**
     * Remove chunk from cache
     *
     * @param chunkId - Chunk ID to remove
     */
    removeFromCache(chunkId) {
        const chunk = this.metadataCache.chunkMetadata.get(chunkId);
        if (!chunk)
            return;
        // Remove from chunk metadata
        this.metadataCache.chunkMetadata.delete(chunkId);
        // Remove from patient index
        if (chunk.metadata?.patient_id) {
            const patientChunks = this.metadataCache.patientIndex.get(chunk.metadata.patient_id);
            if (patientChunks) {
                patientChunks.delete(chunkId);
                if (patientChunks.size === 0) {
                    this.metadataCache.patientIndex.delete(chunk.metadata.patient_id);
                }
            }
        }
        // Remove from artifact index
        const artifactChunks = this.metadataCache.artifactIndex.get(chunk.artifact_id);
        if (artifactChunks) {
            artifactChunks.delete(chunkId);
            if (artifactChunks.size === 0) {
                this.metadataCache.artifactIndex.delete(chunk.artifact_id);
            }
        }
        // Remove from type index
        if (chunk.metadata?.artifact_type) {
            const typeChunks = this.metadataCache.typeIndex.get(chunk.metadata.artifact_type);
            if (typeChunks) {
                typeChunks.delete(chunkId);
                if (typeChunks.size === 0) {
                    this.metadataCache.typeIndex.delete(chunk.metadata.artifact_type);
                }
            }
        }
        // Remove from date index
        if (chunk.metadata?.occurred_at) {
            const date = chunk.metadata.occurred_at.split('T')[0];
            const dateChunks = this.metadataCache.dateIndex.get(date);
            if (dateChunks) {
                dateChunks.delete(chunkId);
                if (dateChunks.size === 0) {
                    this.metadataCache.dateIndex.delete(date);
                }
            }
        }
    }
    /**
     * Report progress to callback
     *
     * @param callback - Progress callback function
     * @param progress - Progress information
     */
    reportProgress(callback, progress) {
        if (callback) {
            callback(progress);
        }
    }
    /**
     * Format bytes to human-readable string
     *
     * @param bytes - Number of bytes
     * @returns Formatted string (e.g., "10.5 MB")
     */
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
// Export singleton instance
const indexingAgent = new IndexingAgent();
exports.default = indexingAgent;
//# sourceMappingURL=indexing-agent.service.js.map