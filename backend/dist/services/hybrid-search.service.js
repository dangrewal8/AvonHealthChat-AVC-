"use strict";
/**
 * Hybrid Search Engine Service
 * Combines keyword search (BM25) and semantic search (vector similarity)
 *
 * Features:
 * - BM25 keyword scoring
 * - Vector similarity (cosine similarity)
 * - Hybrid score combination (alpha weighting)
 * - Metadata pre-filtering (date, type, patient)
 * - Recency boosting with time decay
 * - Snippet extraction
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hybridSearchEngine = void 0;
const faiss_vector_store_service_1 = __importDefault(require("./faiss-vector-store.service"));
const metadata_db_service_1 = __importDefault(require("./metadata-db.service"));
/**
 * Hybrid Search Engine Class
 * Manages in-memory keyword index and integrates with FAISS for semantic search
 */
class HybridSearchEngine {
    documents = new Map();
    documentFrequency = new Map();
    averageDocLength = 0;
    totalDocuments = 0;
    // BM25 parameters
    k1 = 1.5; // Term frequency saturation parameter
    b = 0.75; // Length normalization parameter
    // Recency decay parameters
    halfLifeDays = 180; // 6 months
    /**
     * Add a document to the search engine
     * Indexes both keyword (BM25) and vector (FAISS)
     * @param doc - Document with chunk text, embedding, and metadata
     */
    async addDocument(doc) {
        try {
            // 1. Tokenize and index for keyword search
            const tokens = this.tokenize(doc.chunk_text);
            const termFreqs = this.computeTermFrequency(tokens);
            const bm25Doc = {
                chunk_id: doc.chunk_id,
                tokens,
                length: tokens.length,
                termFreqs,
            };
            this.documents.set(doc.chunk_id, bm25Doc);
            // 2. Update document frequency counts
            const uniqueTerms = new Set(tokens);
            uniqueTerms.forEach((term) => {
                const count = this.documentFrequency.get(term) || 0;
                this.documentFrequency.set(term, count + 1);
            });
            // 3. Update average document length
            this.totalDocuments++;
            this.averageDocLength =
                (this.averageDocLength * (this.totalDocuments - 1) + tokens.length) /
                    this.totalDocuments;
            // 4. Add to FAISS vector store
            await faiss_vector_store_service_1.default.addVectors([doc.embedding], [doc.chunk_id], [doc.metadata]);
            // 5. Add to metadata database
            const dbChunk = {
                chunk_id: doc.chunk_id,
                artifact_id: doc.metadata.artifact_id,
                patient_id: doc.metadata.patient_id,
                artifact_type: doc.metadata.artifact_type,
                occurred_at: doc.metadata.occurred_at,
                author: doc.metadata.author,
                chunk_text: doc.chunk_text,
                source_url: doc.metadata.source_url,
            };
            await metadata_db_service_1.default.insertChunks([dbChunk]);
        }
        catch (error) {
            console.error('[HybridSearch] Failed to add document:', error);
            throw error;
        }
    }
    /**
     * Batch add documents (more efficient than individual adds)
     * @param docs - Array of documents
     */
    async addDocuments(docs) {
        if (docs.length === 0) {
            return;
        }
        console.log(`[HybridSearch] Adding ${docs.length} documents in batch`);
        try {
            // 1. Index all documents for keyword search
            for (const doc of docs) {
                const tokens = this.tokenize(doc.chunk_text);
                const termFreqs = this.computeTermFrequency(tokens);
                const bm25Doc = {
                    chunk_id: doc.chunk_id,
                    tokens,
                    length: tokens.length,
                    termFreqs,
                };
                this.documents.set(doc.chunk_id, bm25Doc);
                // Update document frequency
                const uniqueTerms = new Set(tokens);
                uniqueTerms.forEach((term) => {
                    const count = this.documentFrequency.get(term) || 0;
                    this.documentFrequency.set(term, count + 1);
                });
            }
            // 2. Update average document length
            const totalLength = docs.reduce((sum, doc) => {
                const tokens = this.tokenize(doc.chunk_text);
                return sum + tokens.length;
            }, 0);
            this.totalDocuments += docs.length;
            this.averageDocLength =
                (this.averageDocLength * (this.totalDocuments - docs.length) + totalLength) /
                    this.totalDocuments;
            // 3. Add to FAISS (batch)
            const embeddings = docs.map((doc) => doc.embedding);
            const ids = docs.map((doc) => doc.chunk_id);
            const metadata = docs.map((doc) => doc.metadata);
            await faiss_vector_store_service_1.default.addVectors(embeddings, ids, metadata);
            // 4. Add to metadata database (batch)
            const dbChunks = docs.map((doc) => ({
                chunk_id: doc.chunk_id,
                artifact_id: doc.metadata.artifact_id,
                patient_id: doc.metadata.patient_id,
                artifact_type: doc.metadata.artifact_type,
                occurred_at: doc.metadata.occurred_at,
                author: doc.metadata.author,
                chunk_text: doc.chunk_text,
                source_url: doc.metadata.source_url,
            }));
            await metadata_db_service_1.default.insertChunks(dbChunks);
            console.log(`[HybridSearch] ✓ Added ${docs.length} documents`);
        }
        catch (error) {
            console.error('[HybridSearch] Failed to add documents:', error);
            throw error;
        }
    }
    /**
     * Hybrid search combining keyword and semantic search
     * @param query - Search query text
     * @param queryEmbedding - Query embedding vector
     * @param options - Search options
     * @returns Array of search results
     */
    async search(query, queryEmbedding, options) {
        try {
            console.log(`[HybridSearch] Searching: "${query}"`);
            console.log(`  k=${options.k}, alpha=${options.alpha}`);
            const startTime = Date.now();
            // Step 1: Pre-filter by metadata if filters provided
            let candidateChunkIds = null;
            if (options.filters) {
                candidateChunkIds = await this.preFilterByMetadata(options.filters);
                console.log(`  Filtered to ${candidateChunkIds.length} candidates`);
                if (candidateChunkIds.length === 0) {
                    console.log(`  No candidates after filtering`);
                    return [];
                }
            }
            // Step 2: Get semantic search results (vector similarity)
            const semanticResults = await this.semanticSearch(queryEmbedding, candidateChunkIds, options.k * 3 // Get more results for reranking
            );
            // Step 3: Get keyword search results (BM25)
            const keywordResults = this.keywordSearch(query, candidateChunkIds, options.k * 3);
            // Step 4: Combine scores using alpha weighting
            const combinedResults = await this.combineScores(semanticResults, keywordResults, options.alpha, options.recencyBoost !== false // Default true
            );
            // Step 5: Sort by combined score and take top k
            combinedResults.sort((a, b) => b.score - a.score);
            const topResults = combinedResults.slice(0, options.k);
            // Step 6: Retrieve full chunk data and create snippets
            const finalResults = await this.enrichResults(topResults, query, options.snippetLength || 150);
            const duration = Date.now() - startTime;
            console.log(`[HybridSearch] ✓ Found ${finalResults.length} results (${duration}ms)\n`);
            return finalResults;
        }
        catch (error) {
            console.error('[HybridSearch] Search failed:', error);
            throw error;
        }
    }
    /**
     * Pre-filter chunks by metadata (date, type, patient)
     * @param filters - Filter criteria
     * @returns Array of chunk IDs that match filters
     */
    async preFilterByMetadata(filters) {
        return await metadata_db_service_1.default.filterChunks({
            patientId: filters.patientId || '',
            fromDate: filters.dateFrom,
            toDate: filters.dateTo,
            types: filters.artifactTypes,
        });
    }
    /**
     * Semantic search using FAISS vector similarity
     * @param queryEmbedding - Query embedding vector
     * @param candidateIds - Optional list of candidate chunk IDs to search within
     * @param k - Number of results
     * @returns Array of results with semantic scores
     */
    async semanticSearch(queryEmbedding, candidateIds, k) {
        // Note: FAISS doesn't support filtering by IDs, so we search all and filter after
        const faissResults = await faiss_vector_store_service_1.default.search(queryEmbedding, k * 2);
        // Filter by candidate IDs if provided
        let results = faissResults;
        if (candidateIds !== null) {
            const candidateSet = new Set(candidateIds);
            results = faissResults.filter((r) => candidateSet.has(r.id));
        }
        return results.slice(0, k).map((r) => ({
            chunk_id: r.id,
            score: r.score,
        }));
    }
    /**
     * Keyword search using BM25 algorithm
     * @param query - Search query
     * @param candidateIds - Optional list of candidate chunk IDs
     * @param k - Number of results
     * @returns Array of results with BM25 scores
     */
    keywordSearch(query, candidateIds, k) {
        const queryTokens = this.tokenize(query);
        if (queryTokens.length === 0) {
            return [];
        }
        const scores = [];
        // Filter documents by candidate IDs if provided
        const documentsToSearch = candidateIds
            ? Array.from(this.documents.entries()).filter(([id]) => candidateIds.includes(id))
            : Array.from(this.documents.entries());
        // Calculate BM25 score for each document
        for (const [chunk_id, doc] of documentsToSearch) {
            const score = this.calculateBM25(queryTokens, doc);
            if (score > 0) {
                scores.push({ chunk_id, score });
            }
        }
        // Sort by score and return top k
        scores.sort((a, b) => b.score - a.score);
        return scores.slice(0, k);
    }
    /**
     * Calculate BM25 score for a document given query tokens
     * @param queryTokens - Tokenized query
     * @param doc - Document to score
     * @returns BM25 score
     */
    calculateBM25(queryTokens, doc) {
        let score = 0;
        for (const term of queryTokens) {
            const termFreq = doc.termFreqs.get(term) || 0;
            if (termFreq === 0) {
                continue;
            }
            // Calculate IDF (Inverse Document Frequency)
            const docFreq = this.documentFrequency.get(term) || 0;
            const idf = Math.log((this.totalDocuments - docFreq + 0.5) / (docFreq + 0.5) + 1);
            // Calculate BM25 component
            const numerator = termFreq * (this.k1 + 1);
            const denominator = termFreq +
                this.k1 * (1 - this.b + this.b * (doc.length / this.averageDocLength));
            score += idf * (numerator / denominator);
        }
        return score;
    }
    /**
     * Combine semantic and keyword scores with alpha weighting
     * @param semanticResults - Results from semantic search
     * @param keywordResults - Results from keyword search
     * @param alpha - Weight for semantic score (0-1)
     * @param applyRecencyBoost - Whether to apply time decay boost
     * @returns Combined results
     */
    async combineScores(semanticResults, keywordResults, alpha, applyRecencyBoost) {
        // Normalize scores to 0-1 range
        const normalizedSemantic = this.normalizeScores(semanticResults);
        const normalizedKeyword = this.normalizeScores(keywordResults);
        // Create maps for easy lookup
        const semanticMap = new Map(normalizedSemantic.map((r) => [r.chunk_id, r.score]));
        const keywordMap = new Map(normalizedKeyword.map((r) => [r.chunk_id, r.score]));
        // Get all unique chunk IDs
        const allChunkIds = new Set([
            ...semanticResults.map((r) => r.chunk_id),
            ...keywordResults.map((r) => r.chunk_id),
        ]);
        // Get recency boosts if needed
        let recencyBoosts = null;
        if (applyRecencyBoost) {
            recencyBoosts = await this.calculateRecencyBoosts(Array.from(allChunkIds));
        }
        // Combine scores
        const combined = [];
        for (const chunk_id of allChunkIds) {
            const semanticScore = semanticMap.get(chunk_id) || 0;
            const keywordScore = keywordMap.get(chunk_id) || 0;
            const recencyBoost = recencyBoosts?.get(chunk_id) || 1.0;
            // Combined score: alpha * semantic + (1-alpha) * keyword
            const baseScore = alpha * semanticScore + (1 - alpha) * keywordScore;
            // Apply recency boost
            const finalScore = baseScore * recencyBoost;
            combined.push({
                chunk_id,
                score: finalScore,
                semanticScore,
                keywordScore,
                recencyBoost,
            });
        }
        return combined;
    }
    /**
     * Normalize scores to 0-1 range using min-max normalization
     * @param results - Results with raw scores
     * @returns Results with normalized scores
     */
    normalizeScores(results) {
        if (results.length === 0) {
            return [];
        }
        const scores = results.map((r) => r.score);
        const minScore = Math.min(...scores);
        const maxScore = Math.max(...scores);
        const range = maxScore - minScore;
        if (range === 0) {
            // All scores are the same
            return results.map((r) => ({ ...r, score: 1.0 }));
        }
        return results.map((r) => ({
            chunk_id: r.chunk_id,
            score: (r.score - minScore) / range,
        }));
    }
    /**
     * Calculate recency boost using exponential time decay
     * Boost = 2^(-age_in_days / half_life_days)
     * @param chunkIds - Chunk IDs to calculate boosts for
     * @returns Map of chunk_id to boost factor (0-1)
     */
    async calculateRecencyBoosts(chunkIds) {
        const chunks = await metadata_db_service_1.default.getChunksByIds(chunkIds);
        const boosts = new Map();
        const now = Date.now();
        for (const chunk of chunks) {
            const occurredAt = new Date(chunk.occurred_at).getTime();
            const ageInDays = (now - occurredAt) / (1000 * 60 * 60 * 24);
            // Exponential decay: 2^(-age / half_life)
            const boost = Math.pow(2, -ageInDays / this.halfLifeDays);
            boosts.set(chunk.chunk_id, boost);
        }
        return boosts;
    }
    /**
     * Enrich results with full chunk data and snippets
     * @param results - Combined search results
     * @param query - Original query for snippet highlighting
     * @param snippetLength - Length of snippet in characters
     * @returns Final search results
     */
    async enrichResults(results, query, snippetLength) {
        const chunkIds = results.map((r) => r.chunk_id);
        const chunks = await metadata_db_service_1.default.getChunksByIds(chunkIds);
        // Create map for easy lookup
        const chunkMap = new Map(chunks.map((c) => [c.chunk_id, c]));
        const finalResults = [];
        for (const result of results) {
            const chunk = chunkMap.get(result.chunk_id);
            if (!chunk) {
                console.warn(`[HybridSearch] Chunk not found: ${result.chunk_id}`);
                continue;
            }
            // Extract snippet
            const snippet = this.extractSnippet(chunk.chunk_text, query, snippetLength);
            finalResults.push({
                chunk_id: result.chunk_id,
                score: result.score,
                semanticScore: result.semanticScore,
                keywordScore: result.keywordScore,
                recencyBoost: result.recencyBoost,
                snippet,
                metadata: {
                    artifact_id: chunk.artifact_id,
                    patient_id: chunk.patient_id,
                    artifact_type: chunk.artifact_type,
                    occurred_at: typeof chunk.occurred_at === 'string'
                        ? chunk.occurred_at
                        : chunk.occurred_at.toISOString(),
                    author: chunk.author,
                    source_url: chunk.source_url,
                },
            });
        }
        return finalResults;
    }
    /**
     * Extract snippet from text around query terms
     * @param text - Full chunk text
     * @param query - Search query
     * @param maxLength - Maximum snippet length
     * @returns Snippet with ellipsis if truncated
     */
    extractSnippet(text, query, maxLength) {
        const queryTokens = this.tokenize(query);
        if (queryTokens.length === 0 || text.length <= maxLength) {
            return text.substring(0, maxLength);
        }
        // Find first occurrence of any query term
        const textLower = text.toLowerCase();
        let bestIndex = -1;
        for (const token of queryTokens) {
            const index = textLower.indexOf(token);
            if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
                bestIndex = index;
            }
        }
        if (bestIndex === -1) {
            // No query terms found, return beginning
            return text.substring(0, maxLength) + (text.length > maxLength ? '...' : '');
        }
        // Extract snippet centered on query term
        const start = Math.max(0, bestIndex - Math.floor(maxLength / 2));
        const end = Math.min(text.length, start + maxLength);
        let snippet = text.substring(start, end);
        if (start > 0) {
            snippet = '...' + snippet;
        }
        if (end < text.length) {
            snippet = snippet + '...';
        }
        return snippet;
    }
    /**
     * Tokenize text into lowercase alphanumeric tokens
     * @param text - Text to tokenize
     * @returns Array of tokens
     */
    tokenize(text) {
        // Convert to lowercase and split on non-alphanumeric characters
        const tokens = text
            .toLowerCase()
            .split(/[^a-z0-9]+/)
            .filter((token) => token.length > 0);
        // Remove common stop words
        const stopWords = new Set([
            'a',
            'an',
            'and',
            'are',
            'as',
            'at',
            'be',
            'by',
            'for',
            'from',
            'has',
            'he',
            'in',
            'is',
            'it',
            'its',
            'of',
            'on',
            'that',
            'the',
            'to',
            'was',
            'will',
            'with',
        ]);
        return tokens.filter((token) => !stopWords.has(token) && token.length > 1);
    }
    /**
     * Compute term frequency for a list of tokens
     * @param tokens - Array of tokens
     * @returns Map of term to frequency
     */
    computeTermFrequency(tokens) {
        const termFreqs = new Map();
        for (const token of tokens) {
            const count = termFreqs.get(token) || 0;
            termFreqs.set(token, count + 1);
        }
        return termFreqs;
    }
    /**
     * Get index statistics
     */
    getStats() {
        return {
            totalDocuments: this.totalDocuments,
            totalTerms: this.documentFrequency.size,
            averageDocLength: this.averageDocLength,
        };
    }
    /**
     * Clear all indexed data
     */
    clear() {
        this.documents.clear();
        this.documentFrequency.clear();
        this.averageDocLength = 0;
        this.totalDocuments = 0;
        console.log('[HybridSearch] Index cleared');
    }
}
// Export singleton instance
exports.hybridSearchEngine = new HybridSearchEngine();
exports.default = exports.hybridSearchEngine;
//# sourceMappingURL=hybrid-search.service.js.map