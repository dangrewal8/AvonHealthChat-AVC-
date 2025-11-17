"use strict";
/**
 * Sentence Embedding Service
 * Implements sentence-level embeddings for precise citations
 *
 * Features:
 * - Natural language sentence segmentation
 * - Medical abbreviation handling
 * - Dual indexing (chunk + sentence level)
 * - Two-pass retrieval strategy
 * - Precise provenance with character offsets
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sentenceEmbeddingService = void 0;
const embedding_factory_service_1 = __importDefault(require("./embedding-factory.service"));
const faiss_vector_store_service_1 = __importDefault(require("./faiss-vector-store.service"));
const metadata_db_service_1 = __importDefault(require("./metadata-db.service"));
const uuid_1 = require("uuid");
/**
 * Sentence Embedding Service Class
 * Handles sentence-level embeddings for precise citations
 */
class SentenceEmbeddingService {
    // Medical abbreviations that should not trigger sentence breaks
    medicalAbbreviations = new Set([
        'Dr',
        'Mr',
        'Mrs',
        'Ms',
        'vs',
        'etc',
        'e.g',
        'i.e',
        'Inc',
        'Ltd',
        'Jr',
        'Sr',
        'Ph.D',
        'M.D',
        'R.N',
        'mg',
        'ml',
        'cc',
        'kg',
        'lb',
        'oz',
        'cm',
        'mm',
        'in',
        'ft',
    ]);
    // Maximum sentence length for optimal embedding
    maxSentenceLength = 200;
    /**
     * Segment chunk text into sentences
     * Handles medical abbreviations and returns sentences with offsets
     * @param chunkText - Text to segment
     * @param chunkId - Parent chunk ID
     * @param chunkAbsoluteOffset - Absolute offset of chunk within artifact
     * @returns Array of sentences with offsets
     */
    segmentIntoSentences(chunkText, chunkId, chunkAbsoluteOffset = 0) {
        const sentences = [];
        // Split on sentence boundaries (., !, ?)
        // But preserve medical abbreviations
        const segments = this.splitIntoSegments(chunkText);
        let currentOffset = 0;
        for (const segment of segments) {
            const trimmed = segment.trim();
            if (trimmed.length === 0) {
                currentOffset += segment.length;
                continue;
            }
            // Find start and end positions
            const startIndex = chunkText.indexOf(trimmed, currentOffset);
            const endIndex = startIndex + trimmed.length;
            // Split long sentences
            if (trimmed.length > this.maxSentenceLength) {
                const subSentences = this.splitLongSentence(trimmed, startIndex);
                sentences.push(...subSentences.map((sub) => ({
                    sentence_id: (0, uuid_1.v4)(),
                    chunk_id: chunkId,
                    text: sub.text,
                    char_offsets: [sub.start, sub.end],
                    absolute_offsets: [
                        chunkAbsoluteOffset + sub.start,
                        chunkAbsoluteOffset + sub.end,
                    ],
                })));
            }
            else {
                sentences.push({
                    sentence_id: (0, uuid_1.v4)(),
                    chunk_id: chunkId,
                    text: trimmed,
                    char_offsets: [startIndex, endIndex],
                    absolute_offsets: [
                        chunkAbsoluteOffset + startIndex,
                        chunkAbsoluteOffset + endIndex,
                    ],
                });
            }
            currentOffset = endIndex;
        }
        return sentences;
    }
    /**
     * Split text into sentence segments, handling medical abbreviations
     * @param text - Text to split
     * @returns Array of sentence segments
     */
    splitIntoSegments(text) {
        const segments = [];
        let currentSegment = '';
        let i = 0;
        while (i < text.length) {
            const char = text[i];
            currentSegment += char;
            // Check for sentence-ending punctuation
            if (char === '.' || char === '!' || char === '?') {
                // Check if this is actually a sentence end
                if (this.isSentenceEnd(text, i, currentSegment)) {
                    segments.push(currentSegment);
                    currentSegment = '';
                }
            }
            i++;
        }
        // Add remaining text
        if (currentSegment.trim().length > 0) {
            segments.push(currentSegment);
        }
        return segments;
    }
    /**
     * Check if punctuation at position is actually a sentence end
     * (not just an abbreviation)
     * @param text - Full text
     * @param position - Position of punctuation
     * @param currentSegment - Current segment being built
     * @returns True if this is a sentence end
     */
    isSentenceEnd(text, position, currentSegment) {
        // Check for abbreviations before the punctuation
        const words = currentSegment.trim().split(/\s+/);
        const lastWord = words[words.length - 1];
        // Remove the punctuation to get the abbreviation
        const possibleAbbreviation = lastWord.slice(0, -1);
        // Check if it's a known medical abbreviation
        if (this.medicalAbbreviations.has(possibleAbbreviation)) {
            return false;
        }
        // Check what comes after the punctuation
        const nextChar = text[position + 1];
        // If followed by whitespace and uppercase, likely sentence end
        if (nextChar && /\s/.test(nextChar)) {
            const nextNonWhitespace = text.slice(position + 1).match(/\S/);
            if (nextNonWhitespace && /[A-Z]/.test(nextNonWhitespace[0])) {
                return true;
            }
        }
        // If at end of text, it's a sentence end
        if (position === text.length - 1) {
            return true;
        }
        // Default: treat as sentence end if followed by space
        return nextChar === ' ' || nextChar === '\n';
    }
    /**
     * Split a long sentence into smaller sub-sentences
     * @param sentence - Long sentence to split
     * @param offset - Starting offset
     * @returns Array of sub-sentences with offsets
     */
    splitLongSentence(sentence, offset) {
        const subSentences = [];
        // Split on commas, semicolons, or "and"/"or"
        const parts = sentence.split(/([,;]|\sand\s|\sor\s)/);
        let currentPart = '';
        let currentStart = offset;
        for (const part of parts) {
            if (currentPart.length + part.length > this.maxSentenceLength && currentPart.length > 0) {
                // Save current part
                const trimmed = currentPart.trim();
                subSentences.push({
                    text: trimmed,
                    start: currentStart,
                    end: currentStart + currentPart.length,
                });
                currentPart = part;
                currentStart += currentPart.length;
            }
            else {
                currentPart += part;
            }
        }
        // Add remaining part
        if (currentPart.trim().length > 0) {
            const trimmed = currentPart.trim();
            subSentences.push({
                text: trimmed,
                start: currentStart,
                end: currentStart + currentPart.length,
            });
        }
        return subSentences;
    }
    /**
     * Generate embeddings for sentences
     * @param sentences - Array of sentences to embed
     * @param artifactId - Parent artifact ID
     * @param metadata - Optional metadata
     * @returns Array of sentence embeddings
     */
    async embedSentences(sentences, artifactId, metadata) {
        if (sentences.length === 0) {
            return [];
        }
        console.log(`[SentenceEmbedding] Generating embeddings for ${sentences.length} sentences`);
        try {
            // Extract text from sentences
            const texts = sentences.map((s) => s.text);
            // Generate embeddings in batch
            const startTime = Date.now();
            const embeddings = await embedding_factory_service_1.default.generateBatchEmbeddings(texts);
            const duration = Date.now() - startTime;
            console.log(`[SentenceEmbedding] ✓ Generated ${embeddings.length} embeddings (${duration}ms, ${Math.round(duration / embeddings.length)}ms per sentence)`);
            // Create sentence embedding objects
            const sentenceEmbeddings = sentences.map((sentence, i) => ({
                sentence_id: sentence.sentence_id,
                chunk_id: sentence.chunk_id,
                artifact_id: artifactId,
                embedding: embeddings[i],
                text: sentence.text,
                absolute_offsets: sentence.absolute_offsets,
                metadata,
            }));
            return sentenceEmbeddings;
        }
        catch (error) {
            console.error('[SentenceEmbedding] Failed to generate embeddings:', error);
            throw error;
        }
    }
    /**
     * Store sentence embeddings in FAISS and PostgreSQL
     * @param embeddings - Array of sentence embeddings to store
     */
    async storeSentenceEmbeddings(embeddings) {
        if (embeddings.length === 0) {
            return;
        }
        console.log(`[SentenceEmbedding] Storing ${embeddings.length} sentence embeddings`);
        try {
            // 1. Store in FAISS vector store
            const vectors = embeddings.map((e) => e.embedding);
            const ids = embeddings.map((e) => e.sentence_id);
            const metadata = embeddings.map((e) => ({
                sentence_id: e.sentence_id,
                chunk_id: e.chunk_id,
                artifact_id: e.artifact_id,
                absolute_offsets: e.absolute_offsets,
                ...e.metadata,
            }));
            await faiss_vector_store_service_1.default.addVectors(vectors, ids, metadata);
            // 2. Store in PostgreSQL (using metadata DB with sentence-specific columns)
            // Note: This requires a separate sentence_metadata table
            // For now, we'll skip this and use FAISS metadata only
            // In production, you'd want a dedicated sentence_metadata table
            console.log(`[SentenceEmbedding] ✓ Stored ${embeddings.length} sentence embeddings\n`);
        }
        catch (error) {
            console.error('[SentenceEmbedding] Failed to store embeddings:', error);
            throw error;
        }
    }
    /**
     * Two-pass retrieval strategy
     * First pass: Retrieve relevant chunks
     * Second pass: Find exact supporting sentences within chunks
     *
     * @param queryEmbedding - Query embedding vector
     * @param options - Retrieval options
     * @returns Array of precise retrieval results with sentence-level citations
     */
    async twoPassRetrieval(queryEmbedding, options = {}) {
        const chunkK = options.chunkK || 10;
        const sentenceK = options.sentenceK || 3;
        console.log(`[SentenceEmbedding] Two-pass retrieval: k=${chunkK} chunks, ${sentenceK} sentences per chunk`);
        try {
            // First pass: Retrieve relevant chunks
            console.log('  Pass 1: Retrieving relevant chunks...');
            // Apply metadata filters if provided
            let candidateChunkIds;
            if (options.filters) {
                candidateChunkIds = await metadata_db_service_1.default.filterChunks({
                    patientId: options.filters.patientId || '',
                    fromDate: options.filters.dateFrom,
                    toDate: options.filters.dateTo,
                    types: options.filters.artifactTypes,
                });
                console.log(`  Filtered to ${candidateChunkIds.length} candidate chunks`);
            }
            // Search chunks (this would use chunk-level embeddings)
            const chunkResults = await faiss_vector_store_service_1.default.search(queryEmbedding, chunkK * 2);
            // Filter by candidate IDs if applicable
            let filteredChunks = chunkResults;
            if (candidateChunkIds) {
                const candidateSet = new Set(candidateChunkIds);
                filteredChunks = chunkResults.filter((r) => candidateSet.has(r.id));
            }
            const topChunks = filteredChunks.slice(0, chunkK);
            console.log(`  Found ${topChunks.length} relevant chunks`);
            // Second pass: Find exact supporting sentences within chunks
            console.log('  Pass 2: Finding supporting sentences...');
            const preciseResults = [];
            // For each chunk, search for the most relevant sentences
            // Note: In a real implementation, you'd maintain a separate sentence-level FAISS index
            // For this demo, we'll simulate by searching sentence embeddings stored with sentence_id prefix
            // Search all sentence-level embeddings
            const sentenceResults = await faiss_vector_store_service_1.default.search(queryEmbedding, chunkK * sentenceK);
            // Group by chunk and take top sentences per chunk
            const sentencesByChunk = new Map();
            for (const result of sentenceResults) {
                const chunkId = result.metadata?.chunk_id;
                if (!chunkId)
                    continue;
                // Only include sentences from top chunks
                const isInTopChunks = topChunks.some((c) => c.id === chunkId);
                if (!isInTopChunks)
                    continue;
                if (!sentencesByChunk.has(chunkId)) {
                    sentencesByChunk.set(chunkId, []);
                }
                sentencesByChunk.get(chunkId).push(result);
            }
            // Take top sentences from each chunk
            for (const [chunkId, sentences] of sentencesByChunk.entries()) {
                const topSentences = sentences
                    .sort((a, b) => b.score - a.score)
                    .slice(0, sentenceK);
                for (const sentence of topSentences) {
                    // Retrieve full sentence metadata
                    const chunk = await metadata_db_service_1.default.getChunkById(chunkId);
                    preciseResults.push({
                        sentence_id: sentence.id,
                        chunk_id: chunkId,
                        artifact_id: sentence.metadata?.artifact_id || '',
                        score: sentence.score,
                        text: chunk?.chunk_text || '',
                        absolute_offsets: sentence.metadata?.absolute_offsets || [0, 0],
                        metadata: {
                            patient_id: sentence.metadata?.patient_id,
                            artifact_type: sentence.metadata?.artifact_type,
                            occurred_at: sentence.metadata?.occurred_at,
                            author: chunk?.author,
                        },
                    });
                }
            }
            // Sort by score and return
            preciseResults.sort((a, b) => b.score - a.score);
            console.log(`[SentenceEmbedding] ✓ Found ${preciseResults.length} precise sentences\n`);
            return preciseResults;
        }
        catch (error) {
            console.error('[SentenceEmbedding] Two-pass retrieval failed:', error);
            throw error;
        }
    }
    /**
     * Process a complete chunk: segment, embed, and store sentences
     * Convenience method for end-to-end processing
     *
     * @param chunkId - Chunk ID
     * @param chunkText - Chunk text
     * @param artifactId - Parent artifact ID
     * @param chunkAbsoluteOffset - Absolute offset of chunk within artifact
     * @param metadata - Optional metadata
     * @returns Number of sentences processed
     */
    async processChunk(chunkId, chunkText, artifactId, chunkAbsoluteOffset = 0, metadata) {
        console.log(`[SentenceEmbedding] Processing chunk: ${chunkId}`);
        try {
            // Step 1: Segment into sentences
            const sentences = this.segmentIntoSentences(chunkText, chunkId, chunkAbsoluteOffset);
            console.log(`  Segmented into ${sentences.length} sentences`);
            if (sentences.length === 0) {
                console.log('  No sentences to process');
                return 0;
            }
            // Step 2: Generate embeddings
            const sentenceEmbeddings = await this.embedSentences(sentences, artifactId, metadata);
            // Step 3: Store embeddings
            await this.storeSentenceEmbeddings(sentenceEmbeddings);
            console.log(`[SentenceEmbedding] ✓ Processed ${sentenceEmbeddings.length} sentences\n`);
            return sentenceEmbeddings.length;
        }
        catch (error) {
            console.error('[SentenceEmbedding] Failed to process chunk:', error);
            throw error;
        }
    }
    /**
     * Get statistics about sentence segmentation
     */
    getSegmentationStats(sentences) {
        if (sentences.length === 0) {
            return {
                totalSentences: 0,
                averageLength: 0,
                minLength: 0,
                maxLength: 0,
                sentencesOverLimit: 0,
            };
        }
        const lengths = sentences.map((s) => s.text.length);
        const averageLength = lengths.reduce((sum, len) => sum + len, 0) / lengths.length;
        const minLength = Math.min(...lengths);
        const maxLength = Math.max(...lengths);
        const sentencesOverLimit = lengths.filter((len) => len > this.maxSentenceLength).length;
        return {
            totalSentences: sentences.length,
            averageLength: Math.round(averageLength),
            minLength,
            maxLength,
            sentencesOverLimit,
        };
    }
}
// Export singleton instance
exports.sentenceEmbeddingService = new SentenceEmbeddingService();
exports.default = exports.sentenceEmbeddingService;
//# sourceMappingURL=sentence-embedding.service.js.map