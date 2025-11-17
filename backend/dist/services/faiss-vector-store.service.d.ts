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
declare class FAISSVectorStore {
    private index;
    private dimension;
    private idMap;
    private metadataMap;
    private nextIndex;
    private indexPath;
    private isInitialized;
    /**
     * Initialize FAISS index
     * @param dimension - Vector dimensions (768 for Ollama nomic-embed-text)
     */
    initialize(dimension: number): Promise<void>;
    /**
     * Add vectors to the index
     * @param vectors - Array of embedding vectors
     * @param ids - Array of string IDs
     * @param metadata - Array of metadata objects
     */
    addVectors(vectors: number[][], ids: string[], metadata?: any[]): Promise<void>;
    /**
     * Search for similar vectors
     * @param queryVector - Query embedding vector
     * @param k - Number of results to return
     * @returns Array of search results with IDs, scores, and metadata
     */
    search(queryVector: number[], k?: number): Promise<SearchResult[]>;
    /**
     * Save index to disk
     * @param filepath - Path to save the index (optional, uses default if not provided)
     */
    save(filepath?: string): Promise<void>;
    /**
     * Load index from disk
     * @param filepath - Path to load the index from (optional, uses default if not provided)
     */
    load(filepath?: string): Promise<void>;
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
    };
    /**
     * Clear all data
     */
    clear(): void;
    /**
     * Reset and reinitialize index
     */
    reset(dimension?: number): Promise<void>;
    /**
     * Normalize vector to unit length (L2 normalization)
     * Enables cosine similarity using inner product
     */
    private normalizeVector;
    /**
     * Flatten 2D array of vectors into 1D Float32Array for FAISS
     */
    private flattenVectors;
    /**
     * Set index path for save/load operations
     */
    setIndexPath(indexPath: string): void;
}
export declare const faissVectorStore: FAISSVectorStore;
export default faissVectorStore;
//# sourceMappingURL=faiss-vector-store.service.d.ts.map