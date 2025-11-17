/**
 * FAISS Vector Store Service
 * High-performance vector similarity search using FAISS
 *
 * Features:
 * - IndexFlatIP for exact search (~10ms)
 * - L2 normalization for cosine similarity
 * - Batch insertions for efficiency
 * - Disk persistence (save/load)
 *
 * Note: This version uses faiss-node which only supports IndexFlatIP (exact search).
 * For large datasets (> 100K vectors), consider using Python FAISS with IVF/HNSW indices.
 */

import { IndexFlatIP } from 'faiss-node';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Search result interface
 */
export interface SearchResult {
  id: string;
  score: number;
  metadata?: any;
}

/**
 * FAISS Vector Store Configuration
 */
export interface FAISSVectorStoreConfig {
  dimension: number;
  indexPath: string;
}

/**
 * FAISS Vector Store Class
 * Manages vector storage and similarity search using FAISS
 */
class FAISSVectorStore {
  private index: IndexFlatIP | null = null;
  private dimension: number = 0;
  private idMap: Map<number, string> = new Map();
  private metadataMap: Map<string, any> = new Map();
  private nextIndex: number = 0;
  private indexPath: string = './data/faiss';
  private isInitialized: boolean = false;

  /**
   * Initialize FAISS index
   * @param dimension - Vector dimensions (768 for Ollama nomic-embed-text)
   */
  async initialize(dimension: number): Promise<void> {
    try {
      console.log('[FAISS] Initializing vector store');
      console.log(`  Dimension: ${dimension}`);
      console.log(`  Index Type: IndexFlatIP (exact search)`);

      this.dimension = dimension;

      // Create IndexFlatIP for exact search
      // Inner product similarity (with normalized vectors = cosine similarity)
      this.index = new IndexFlatIP(dimension);

      this.isInitialized = true;
      console.log('[FAISS] ✓ Initialization complete\n');
    } catch (error) {
      console.error('[FAISS] Initialization failed:', error);
      throw new Error(`Failed to initialize FAISS index: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add vectors to the index
   * @param vectors - Array of embedding vectors
   * @param ids - Array of string IDs
   * @param metadata - Array of metadata objects
   */
  async addVectors(
    vectors: number[][],
    ids: string[],
    metadata: any[] = []
  ): Promise<void> {
    if (!this.isInitialized || !this.index) {
      throw new Error('FAISS index not initialized. Call initialize() first.');
    }

    if (vectors.length === 0) {
      throw new Error('Cannot add empty vectors array');
    }

    if (vectors.length !== ids.length) {
      throw new Error(`Vectors and IDs length mismatch: ${vectors.length} vs ${ids.length}`);
    }

    if (metadata.length > 0 && metadata.length !== ids.length) {
      throw new Error(`Metadata and IDs length mismatch: ${metadata.length} vs ${ids.length}`);
    }

    try {
      console.log(`[FAISS] Adding ${vectors.length} vectors to index`);

      // Validate dimensions
      const firstVector = vectors[0];
      if (firstVector.length !== this.dimension) {
        throw new Error(
          `Vector dimension mismatch: expected ${this.dimension}, got ${firstVector.length}`
        );
      }

      // Normalize vectors for cosine similarity
      const normalizedVectors = vectors.map((vector) => this.normalizeVector(vector));

      // Add vectors to index
      const startTime = Date.now();
      const flatVectors = this.flattenVectors(normalizedVectors);
      this.index.add(Array.from(flatVectors));

      // Store ID and metadata mappings
      for (let i = 0; i < ids.length; i++) {
        const internalId = this.nextIndex + i;
        const externalId = ids[i];

        this.idMap.set(internalId, externalId);

        if (metadata.length > 0) {
          this.metadataMap.set(externalId, metadata[i]);
        }
      }

      this.nextIndex += vectors.length;

      const duration = Date.now() - startTime;
      console.log(`[FAISS] ✓ Added ${vectors.length} vectors (${duration}ms)`);
      console.log(`[FAISS] Total vectors in index: ${this.index.ntotal()}\n`);
    } catch (error) {
      console.error('[FAISS] Failed to add vectors:', error);
      throw new Error(`Failed to add vectors: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Search for similar vectors
   * @param queryVector - Query embedding vector
   * @param k - Number of results to return
   * @returns Array of search results with IDs, scores, and metadata
   */
  async search(queryVector: number[], k: number = 10): Promise<SearchResult[]> {
    if (!this.isInitialized || !this.index) {
      throw new Error('FAISS index not initialized. Call initialize() first.');
    }

    if (this.index.ntotal() === 0) {
      console.warn('[FAISS] Index is empty, returning no results');
      return [];
    }

    if (queryVector.length !== this.dimension) {
      throw new Error(
        `Query vector dimension mismatch: expected ${this.dimension}, got ${queryVector.length}`
      );
    }

    try {
      const startTime = Date.now();

      // Normalize query vector for cosine similarity
      const normalizedQuery = this.normalizeVector(queryVector);

      // Search for k nearest neighbors
      const actualK = Math.min(k, this.index.ntotal());
      const results = this.index.search(normalizedQuery, actualK);

      const duration = Date.now() - startTime;

      // Map internal IDs to external IDs and attach metadata
      const searchResults: SearchResult[] = [];
      for (let i = 0; i < results.labels.length; i++) {
        const internalId = results.labels[i];
        const score = results.distances[i];

        // Skip invalid results (FAISS returns -1 for no match)
        if (internalId === -1) {
          continue;
        }

        const externalId = this.idMap.get(internalId);
        if (!externalId) {
          console.warn(`[FAISS] Missing ID mapping for internal ID ${internalId}`);
          continue;
        }

        const metadata = this.metadataMap.get(externalId);

        searchResults.push({
          id: externalId,
          score,
          metadata,
        });
      }

      console.log(
        `[FAISS] ✓ Search complete: found ${searchResults.length} results (${duration}ms)`
      );

      return searchResults;
    } catch (error) {
      console.error('[FAISS] Search failed:', error);
      throw new Error(`Failed to search: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Save index to disk
   * @param filepath - Path to save the index (optional, uses default if not provided)
   */
  async save(filepath?: string): Promise<void> {
    if (!this.isInitialized || !this.index) {
      throw new Error('FAISS index not initialized. Cannot save.');
    }

    const savePath = filepath || path.join(this.indexPath, 'index.faiss');

    try {
      console.log(`[FAISS] Saving index to ${savePath}`);

      // Ensure directory exists
      const dir = path.dirname(savePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Save FAISS index
      this.index.write(savePath);

      // Save metadata
      const metadataPath = savePath.replace('.faiss', '.metadata.json');
      const metadata = {
        dimension: this.dimension,
        nextIndex: this.nextIndex,
        idMap: Array.from(this.idMap.entries()),
        metadataMap: Array.from(this.metadataMap.entries()),
      };

      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

      console.log('[FAISS] ✓ Index saved successfully');
      console.log(`  Index file: ${savePath}`);
      console.log(`  Metadata file: ${metadataPath}\n`);
    } catch (error) {
      console.error('[FAISS] Failed to save index:', error);
      throw new Error(`Failed to save index: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load index from disk
   * @param filepath - Path to load the index from (optional, uses default if not provided)
   */
  async load(filepath?: string): Promise<void> {
    const loadPath = filepath || path.join(this.indexPath, 'index.faiss');

    try {
      console.log(`[FAISS] Loading index from ${loadPath}`);

      if (!fs.existsSync(loadPath)) {
        throw new Error(`Index file not found: ${loadPath}`);
      }

      // Load metadata
      const metadataPath = loadPath.replace('.faiss', '.metadata.json');
      if (!fs.existsSync(metadataPath)) {
        throw new Error(`Metadata file not found: ${metadataPath}`);
      }

      const metadataContent = fs.readFileSync(metadataPath, 'utf-8');
      const metadata = JSON.parse(metadataContent);

      this.dimension = metadata.dimension;
      this.nextIndex = metadata.nextIndex;
      this.idMap = new Map(metadata.idMap);
      this.metadataMap = new Map(metadata.metadataMap);

      // Load FAISS index
      this.index = IndexFlatIP.read(loadPath);

      this.isInitialized = true;

      console.log('[FAISS] ✓ Index loaded successfully');
      console.log(`  Dimension: ${this.dimension}`);
      console.log(`  Index Type: IndexFlatIP`);
      console.log(`  Total vectors: ${this.index.ntotal()}`);
      console.log(`  ID mappings: ${this.idMap.size}\n`);
    } catch (error) {
      console.error('[FAISS] Failed to load index:', error);
      throw new Error(`Failed to load index: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get index statistics
   */
  getStats(): {
    dimension: number;
    indexType: string;
    totalVectors: number;
    idMappings: number;
    metadataEntries: number;
    isInitialized: boolean;
  } {
    return {
      dimension: this.dimension,
      indexType: 'IndexFlatIP (exact)',
      totalVectors: this.index ? this.index.ntotal() : 0,
      idMappings: this.idMap.size,
      metadataEntries: this.metadataMap.size,
      isInitialized: this.isInitialized,
    };
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.idMap.clear();
    this.metadataMap.clear();
    this.nextIndex = 0;
    console.log('[FAISS] ✓ Cleared all mappings');
  }

  /**
   * Reset and reinitialize index
   */
  async reset(dimension?: number): Promise<void> {
    this.clear();
    this.index = null;
    this.isInitialized = false;

    if (dimension !== undefined) {
      await this.initialize(dimension);
    }
  }

  /**
   * Normalize vector to unit length (L2 normalization)
   * Enables cosine similarity using inner product
   */
  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));

    if (magnitude === 0) {
      console.warn('[FAISS] Warning: Zero magnitude vector, returning as-is');
      return vector;
    }

    return vector.map((val) => val / magnitude);
  }

  /**
   * Flatten 2D array of vectors into 1D Float32Array for FAISS
   */
  private flattenVectors(vectors: number[][]): Float32Array {
    const totalElements = vectors.length * this.dimension;
    const flatArray = new Float32Array(totalElements);

    for (let i = 0; i < vectors.length; i++) {
      for (let j = 0; j < this.dimension; j++) {
        flatArray[i * this.dimension + j] = vectors[i][j];
      }
    }

    return flatArray;
  }

  /**
   * Set index path for save/load operations
   */
  setIndexPath(indexPath: string): void {
    this.indexPath = indexPath;
  }
}

// Export singleton instance
export const faissVectorStore = new FAISSVectorStore();
export default faissVectorStore;
