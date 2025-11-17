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

import embeddingService from './embedding-factory.service';
import sentenceEmbeddingService from './sentence-embedding.service';
import faissVectorStore from './faiss-vector-store.service';
import metadataDB from './metadata-db.service';
import hybridSearchEngine from './hybrid-search.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Chunk interface for indexing
 */
export interface Chunk {
  chunk_id: string;
  artifact_id: string;
  text: string;
  chunk_index: number;
  absolute_offset: number; // Character offset within artifact
  metadata?: {
    patient_id?: string;
    artifact_type?: string;
    occurred_at?: string;
    author?: string;
    source_url?: string;
  };
}

/**
 * Result of indexing operation
 */
export interface IndexingResult {
  success: boolean;
  chunksIndexed: number;
  sentencesIndexed: number;
  chunkEmbeddingsGenerated: number;
  sentenceEmbeddingsGenerated: number;
  errors: Array<{
    chunk_id: string;
    error: string;
  }>;
  duration: number; // milliseconds
}

/**
 * Index statistics
 */
export interface IndexStats {
  totalChunks: number;
  totalSentences: number;
  totalChunkEmbeddings: number;
  totalSentenceEmbeddings: number;
  patients: number;
  artifacts: number;
  artifactTypes: string[];
  dateRange: {
    earliest: string | null;
    latest: string | null;
  };
  indexSize: {
    vectorStore: string; // e.g., "10.5 MB"
    metadata: string; // e.g., "2.3 MB"
  };
}

/**
 * Progress tracking for indexing operations
 */
export interface IndexingProgress {
  stage: 'extracting' | 'embedding_chunks' | 'embedding_sentences' | 'storing' | 'indexing_keywords' | 'complete';
  chunksProcessed: number;
  chunksTotal: number;
  sentencesProcessed: number;
  sentencesTotal: number;
  percentComplete: number;
  currentChunk?: string;
  error?: string;
}

/**
 * Progress callback function
 */
export type ProgressCallback = (progress: IndexingProgress) => void;

/**
 * In-memory metadata cache for fast filtering
 */
interface MetadataCache {
  chunkMetadata: Map<string, Chunk>;
  patientIndex: Map<string, Set<string>>; // patient_id -> Set<chunk_id>
  artifactIndex: Map<string, Set<string>>; // artifact_id -> Set<chunk_id>
  typeIndex: Map<string, Set<string>>; // artifact_type -> Set<chunk_id>
  dateIndex: Map<string, Set<string>>; // YYYY-MM-DD -> Set<chunk_id>
}

/**
 * Indexing Agent
 *
 * Orchestrates the complete embedding and indexing pipeline
 */
class IndexingAgent {
  private metadataCache: MetadataCache;
  private isInitialized: boolean = false;

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
  async initialize(): Promise<void> {
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
  async indexChunks(chunks: Chunk[], onProgress?: ProgressCallback): Promise<IndexingResult> {
    const startTime = Date.now();
    const errors: Array<{ chunk_id: string; error: string }> = [];

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
      const chunkEmbeddings = await embeddingService.generateBatchEmbeddings(chunkTexts);
      chunkEmbeddingsGenerated = chunkEmbeddings.length;

      // Stage 3: Segment into sentences and generate sentence-level embeddings
      // DISABLED: Sentence embeddings are not used in production retrieval (too slow for 4710+ chunks)
      // Skip this stage to improve indexing performance from ~2.5 hours to ~30 seconds
      console.log('[Indexing Agent] Skipping sentence embedding generation (disabled for performance)');
      const allSentenceEmbeddings: any[] = [];
      let totalSentences = 0;
      /*
      this.reportProgress(onProgress, {
        stage: 'embedding_sentences',
        chunksProcessed: 0,
        chunksTotal: validChunks.length,
        sentencesProcessed: 0,
        sentencesTotal: 0,
        percentComplete: 30,
      });

      let totalSentences = 0;

      for (let i = 0; i < validChunks.length; i++) {
        const chunk = validChunks[i];

        try {
          // Segment chunk into sentences
          const sentences = sentenceEmbeddingService.segmentIntoSentences(
            chunk.text,
            chunk.chunk_id,
            chunk.absolute_offset
          );

          totalSentences += sentences.length;

          // Generate sentence embeddings
          const sentenceEmbeddings = await sentenceEmbeddingService.embedSentences(
            sentences,
            chunk.artifact_id,
            chunk.metadata
          );

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
        } catch (error) {
          errors.push({
            chunk_id: chunk.chunk_id,
            error: `Sentence embedding failed: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }
      */

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
        await faissVectorStore.addVectors(
          chunkEmbeddings,
          validChunks.map(c => c.chunk_id)
        );
        chunksIndexed = validChunks.length;
      } catch (error) {
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
          patient_id: chunk.metadata?.patient_id || 'UNKNOWN',
          artifact_type: chunk.metadata?.artifact_type || 'unknown',
          occurred_at: chunk.metadata?.occurred_at || new Date().toISOString(),
          author: chunk.metadata?.author || undefined,
          chunk_text: chunk.text,
          char_offsets: [chunk.absolute_offset, chunk.absolute_offset + chunk.text.length],
          source_url: chunk.metadata?.source_url || undefined,
        }));

        await metadataDB.insertChunks(chunkMetadata);
      } catch (error) {
        errors.push({
          chunk_id: 'metadata_storage',
          error: `Metadata storage failed: ${error instanceof Error ? error.message : String(error)}`,
        });
      }

      // Store sentence-level embeddings
      if (allSentenceEmbeddings.length > 0) {
        try {
          await sentenceEmbeddingService.storeSentenceEmbeddings(allSentenceEmbeddings);
        } catch (error) {
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

        await hybridSearchEngine.addDocuments(documents);
      } catch (error) {
        errors.push({
          chunk_id: 'keyword_indexing',
          error: `Keyword indexing failed: ${error instanceof Error ? error.message : String(error)}`,
        });
      }

      // Stage 6: Update in-memory metadata cache
      this.updateMetadataCache(validChunks);

      // Stage 7: Save FAISS index to disk for persistence
      console.log('[Indexing Agent] Saving FAISS index to disk...');
      try {
        await faissVectorStore.save();
        console.log('[Indexing Agent] ✓ FAISS index saved successfully');
      } catch (error) {
        console.error('[Indexing Agent] Failed to save FAISS index:', error);
        errors.push({
          chunk_id: 'faiss_save',
          error: `Failed to save FAISS index: ${error instanceof Error ? error.message : String(error)}`,
        });
      }

      // Stage 8: Save hybrid search index to disk
      console.log('[Indexing Agent] Saving hybrid search index to disk...');
      try {
        await hybridSearchEngine.save();
        console.log('[Indexing Agent] ✓ Hybrid search index saved successfully');
      } catch (error) {
        console.error('[Indexing Agent] Failed to save hybrid search index:', error);
        errors.push({
          chunk_id: 'hybrid_search_save',
          error: `Failed to save hybrid search index: ${error instanceof Error ? error.message : String(error)}`,
        });
      }

      // Stage 9: Save metadata cache to disk
      console.log('[Indexing Agent] Saving metadata cache to disk...');
      try {
        await this.saveMetadataCache();
        console.log('[Indexing Agent] ✓ Metadata cache saved successfully');
      } catch (error) {
        console.error('[Indexing Agent] Failed to save metadata cache:', error);
        errors.push({
          chunk_id: 'metadata_cache_save',
          error: `Failed to save metadata cache: ${error instanceof Error ? error.message : String(error)}`,
        });
      }

      // Stage 10: Complete
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
    } catch (error) {
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
  async reindexArtifact(artifactId: string, onProgress?: ProgressCallback): Promise<IndexingResult> {
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
    const chunks = await metadataDB.getChunksByIds(Array.from(artifactChunkIds));

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
    await metadataDB.deleteChunks(Array.from(artifactChunkIds));

    // Remove from cache
    for (const chunkId of artifactChunkIds) {
      this.removeFromCache(chunkId);
    }

    // Convert DB chunks to indexing format
    const indexingChunks: Chunk[] = chunks.map(chunk => ({
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
  async clearIndex(): Promise<void> {
    // Clear FAISS vector store
    faissVectorStore.clear();

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
  async getIndexStats(): Promise<IndexStats> {
    // Get stats from metadata DB
    const dbStats = await metadataDB.getStats();
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
  getChunksByFilter(filters: {
    patientId?: string;
    artifactId?: string;
    artifactType?: string;
    date?: string;
  }): string[] {
    let resultSet: Set<string> | null = null;

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
        } else {
          resultSet = new Set(artifactChunks);
        }
      } else {
        return [];
      }
    }

    // Apply type filter
    if (filters.artifactType) {
      const typeChunks = this.metadataCache.typeIndex.get(filters.artifactType);
      if (typeChunks) {
        if (resultSet) {
          resultSet = new Set([...resultSet].filter(id => typeChunks.has(id)));
        } else {
          resultSet = new Set(typeChunks);
        }
      } else {
        return [];
      }
    }

    // Apply date filter
    if (filters.date) {
      const dateChunks = this.metadataCache.dateIndex.get(filters.date);
      if (dateChunks) {
        if (resultSet) {
          resultSet = new Set([...resultSet].filter(id => dateChunks.has(id)));
        } else {
          resultSet = new Set(dateChunks);
        }
      } else {
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
  getChunkMetadata(chunkId: string): Chunk | undefined {
    return this.metadataCache.chunkMetadata.get(chunkId);
  }

  /**
   * Update in-memory metadata cache
   *
   * @param chunks - Chunks to add to cache
   */
  private updateMetadataCache(chunks: Chunk[]): void {
    for (const chunk of chunks) {
      // Store chunk metadata
      this.metadataCache.chunkMetadata.set(chunk.chunk_id, chunk);

      // Index by patient
      if (chunk.metadata?.patient_id) {
        if (!this.metadataCache.patientIndex.has(chunk.metadata.patient_id)) {
          this.metadataCache.patientIndex.set(chunk.metadata.patient_id, new Set());
        }
        this.metadataCache.patientIndex.get(chunk.metadata.patient_id)!.add(chunk.chunk_id);
      }

      // Index by artifact
      if (!this.metadataCache.artifactIndex.has(chunk.artifact_id)) {
        this.metadataCache.artifactIndex.set(chunk.artifact_id, new Set());
      }
      this.metadataCache.artifactIndex.get(chunk.artifact_id)!.add(chunk.chunk_id);

      // Index by type
      if (chunk.metadata?.artifact_type) {
        if (!this.metadataCache.typeIndex.has(chunk.metadata.artifact_type)) {
          this.metadataCache.typeIndex.set(chunk.metadata.artifact_type, new Set());
        }
        this.metadataCache.typeIndex.get(chunk.metadata.artifact_type)!.add(chunk.chunk_id);
      }

      // Index by date
      if (chunk.metadata?.occurred_at) {
        const date = chunk.metadata.occurred_at.split('T')[0]; // Extract YYYY-MM-DD
        if (!this.metadataCache.dateIndex.has(date)) {
          this.metadataCache.dateIndex.set(date, new Set());
        }
        this.metadataCache.dateIndex.get(date)!.add(chunk.chunk_id);
      }
    }
  }

  /**
   * Remove chunk from cache
   *
   * @param chunkId - Chunk ID to remove
   */
  private removeFromCache(chunkId: string): void {
    const chunk = this.metadataCache.chunkMetadata.get(chunkId);
    if (!chunk) return;

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
  private reportProgress(callback: ProgressCallback | undefined, progress: IndexingProgress): void {
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
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Save metadata cache to disk for persistence
   * @param filepath - Optional file path (default: ./data/metadata-cache/cache.json)
   */
  async saveMetadataCache(filepath?: string): Promise<void> {
    const savePath = filepath || path.join('./data/metadata-cache', 'cache.json');

    try {
      console.log(`[Indexing Agent] Saving metadata cache to ${savePath}`);

      // Ensure directory exists
      const dir = path.dirname(savePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Convert Maps and Sets to arrays for JSON serialization
      const cacheData = {
        chunkMetadata: Array.from(this.metadataCache.chunkMetadata.entries()),
        patientIndex: Array.from(this.metadataCache.patientIndex.entries()).map(([key, value]) => [
          key,
          Array.from(value),
        ]),
        artifactIndex: Array.from(this.metadataCache.artifactIndex.entries()).map(([key, value]) => [
          key,
          Array.from(value),
        ]),
        typeIndex: Array.from(this.metadataCache.typeIndex.entries()).map(([key, value]) => [
          key,
          Array.from(value),
        ]),
        dateIndex: Array.from(this.metadataCache.dateIndex.entries()).map(([key, value]) => [
          key,
          Array.from(value),
        ]),
      };

      fs.writeFileSync(savePath, JSON.stringify(cacheData, null, 2));

      console.log('[Indexing Agent] ✓ Metadata cache saved successfully');
      console.log(`  Chunk metadata: ${this.metadataCache.chunkMetadata.size}`);
      console.log(`  Patients indexed: ${this.metadataCache.patientIndex.size}`);
      console.log(`  Artifacts indexed: ${this.metadataCache.artifactIndex.size}`);
      console.log(`  File: ${savePath}\n`);
    } catch (error) {
      console.error('[Indexing Agent] Failed to save metadata cache:', error);
      throw new Error(
        `Failed to save metadata cache: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Load metadata cache from disk
   * @param filepath - Optional file path (default: ./data/metadata-cache/cache.json)
   */
  async loadMetadataCache(filepath?: string): Promise<void> {
    const loadPath = filepath || path.join('./data/metadata-cache', 'cache.json');

    try {
      console.log(`[Indexing Agent] Loading metadata cache from ${loadPath}`);

      if (!fs.existsSync(loadPath)) {
        throw new Error(`Cache file not found: ${loadPath}`);
      }

      const cacheData = JSON.parse(fs.readFileSync(loadPath, 'utf-8'));

      // Restore chunkMetadata Map
      this.metadataCache.chunkMetadata = new Map(cacheData.chunkMetadata);

      // Restore patientIndex Map<string, Set<string>>
      this.metadataCache.patientIndex = new Map(
        cacheData.patientIndex.map(([key, value]: [string, string[]]) => [key, new Set(value)])
      );

      // Restore artifactIndex Map<string, Set<string>>
      this.metadataCache.artifactIndex = new Map(
        cacheData.artifactIndex.map(([key, value]: [string, string[]]) => [key, new Set(value)])
      );

      // Restore typeIndex Map<string, Set<string>>
      this.metadataCache.typeIndex = new Map(
        cacheData.typeIndex.map(([key, value]: [string, string[]]) => [key, new Set(value)])
      );

      // Restore dateIndex Map<string, Set<string>>
      this.metadataCache.dateIndex = new Map(
        cacheData.dateIndex.map(([key, value]: [string, string[]]) => [key, new Set(value)])
      );

      console.log('[Indexing Agent] ✓ Metadata cache loaded successfully');
      console.log(`  Chunk metadata: ${this.metadataCache.chunkMetadata.size}`);
      console.log(`  Patients indexed: ${this.metadataCache.patientIndex.size}`);
      console.log(`  Artifacts indexed: ${this.metadataCache.artifactIndex.size}\n`);
    } catch (error) {
      console.error('[Indexing Agent] Failed to load metadata cache:', error);
      throw new Error(
        `Failed to load metadata cache: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// Export singleton instance
const indexingAgent = new IndexingAgent();
export default indexingAgent;
