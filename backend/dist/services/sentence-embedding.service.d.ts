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
/**
 * Sentence interface
 */
export interface Sentence {
    sentence_id: string;
    chunk_id: string;
    text: string;
    char_offsets: [number, number];
    absolute_offsets: [number, number];
}
/**
 * Sentence embedding interface
 */
export interface SentenceEmbedding {
    sentence_id: string;
    chunk_id: string;
    artifact_id: string;
    embedding: number[];
    text: string;
    absolute_offsets: [number, number];
    metadata?: {
        patient_id?: string;
        artifact_type?: string;
        occurred_at?: string;
    };
}
/**
 * Two-pass retrieval result
 */
export interface PreciseRetrievalResult {
    sentence_id: string;
    chunk_id: string;
    artifact_id: string;
    score: number;
    text: string;
    absolute_offsets: [number, number];
    metadata?: {
        patient_id?: string;
        artifact_type?: string;
        occurred_at?: string;
        author?: string;
    };
}
/**
 * Sentence Embedding Service Class
 * Handles sentence-level embeddings for precise citations
 */
declare class SentenceEmbeddingService {
    private readonly medicalAbbreviations;
    private readonly maxSentenceLength;
    /**
     * Segment chunk text into sentences
     * Handles medical abbreviations and returns sentences with offsets
     * @param chunkText - Text to segment
     * @param chunkId - Parent chunk ID
     * @param chunkAbsoluteOffset - Absolute offset of chunk within artifact
     * @returns Array of sentences with offsets
     */
    segmentIntoSentences(chunkText: string, chunkId: string, chunkAbsoluteOffset?: number): Sentence[];
    /**
     * Split text into sentence segments, handling medical abbreviations
     * @param text - Text to split
     * @returns Array of sentence segments
     */
    private splitIntoSegments;
    /**
     * Check if punctuation at position is actually a sentence end
     * (not just an abbreviation)
     * @param text - Full text
     * @param position - Position of punctuation
     * @param currentSegment - Current segment being built
     * @returns True if this is a sentence end
     */
    private isSentenceEnd;
    /**
     * Split a long sentence into smaller sub-sentences
     * @param sentence - Long sentence to split
     * @param offset - Starting offset
     * @returns Array of sub-sentences with offsets
     */
    private splitLongSentence;
    /**
     * Generate embeddings for sentences
     * @param sentences - Array of sentences to embed
     * @param artifactId - Parent artifact ID
     * @param metadata - Optional metadata
     * @returns Array of sentence embeddings
     */
    embedSentences(sentences: Sentence[], artifactId: string, metadata?: {
        patient_id?: string;
        artifact_type?: string;
        occurred_at?: string;
    }): Promise<SentenceEmbedding[]>;
    /**
     * Store sentence embeddings in FAISS and PostgreSQL
     * @param embeddings - Array of sentence embeddings to store
     */
    storeSentenceEmbeddings(embeddings: SentenceEmbedding[]): Promise<void>;
    /**
     * Two-pass retrieval strategy
     * First pass: Retrieve relevant chunks
     * Second pass: Find exact supporting sentences within chunks
     *
     * @param queryEmbedding - Query embedding vector
     * @param options - Retrieval options
     * @returns Array of precise retrieval results with sentence-level citations
     */
    twoPassRetrieval(queryEmbedding: number[], options?: {
        chunkK?: number;
        sentenceK?: number;
        filters?: {
            patientId?: string;
            dateFrom?: string;
            dateTo?: string;
            artifactTypes?: string[];
        };
    }): Promise<PreciseRetrievalResult[]>;
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
    processChunk(chunkId: string, chunkText: string, artifactId: string, chunkAbsoluteOffset?: number, metadata?: {
        patient_id?: string;
        artifact_type?: string;
        occurred_at?: string;
    }): Promise<number>;
    /**
     * Get statistics about sentence segmentation
     */
    getSegmentationStats(sentences: Sentence[]): {
        totalSentences: number;
        averageLength: number;
        minLength: number;
        maxLength: number;
        sentencesOverLimit: number;
    };
}
export declare const sentenceEmbeddingService: SentenceEmbeddingService;
export default sentenceEmbeddingService;
//# sourceMappingURL=sentence-embedding.service.d.ts.map