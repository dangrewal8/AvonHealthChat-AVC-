/**
 * Text Chunker Service
 *
 * Chunk documents for vector embedding and retrieval.
 *
 * Requirements:
 * - Target size: 200-300 words per chunk
 * - Overlap: 50 words between chunks
 * - Preserve sentence boundaries
 * - Track char offsets for provenance
 * - Keep metadata with each chunk
 *
 * NO Python text processing libraries
 */
import { Artifact } from '../types/artifact.types';
/**
 * Chunk interface
 */
export interface Chunk {
    chunk_id: string;
    artifact_id: string;
    patient_id: string;
    artifact_type: string;
    chunk_text: string;
    char_offsets: [number, number];
    occurred_at: string;
    author?: string;
    source: string;
    created_at: string;
}
/**
 * Text Chunker Class
 *
 * Chunk documents into overlapping segments for vector embedding
 */
declare class TextChunker {
    /**
     * Target chunk size (words)
     */
    private readonly MIN_CHUNK_WORDS;
    private readonly MAX_CHUNK_WORDS;
    /**
     * Overlap between chunks (words)
     */
    private readonly OVERLAP_WORDS;
    /**
     * Chunk artifact into overlapping chunks
     *
     * Main entry point for chunking
     *
     * @param artifact - Artifact to chunk
     * @returns Array of chunks with metadata
     */
    chunk(artifact: Artifact): Chunk[];
    /**
     * Split text into sentences
     *
     * Simple sentence boundary detection
     *
     * @param text - Text to split
     * @returns Array of sentences
     */
    splitIntoSentences(text: string): string[];
    /**
     * Split text into sentences with char offsets
     *
     * Uses regex to detect sentence boundaries while handling common abbreviations
     *
     * @param text - Text to split
     * @returns Array of sentences with char offsets
     */
    private splitIntoSentencesWithOffsets;
    /**
     * Check if sentence ends with common abbreviation
     *
     * @param sentence - Sentence to check
     * @returns True if sentence ends with abbreviation
     */
    private isAbbreviation;
    /**
     * Create chunks with overlap
     *
     * Groups sentences into chunks of 200-300 words with 50-word overlap
     *
     * @param sentences - Sentences with offsets
     * @param artifact - Original artifact
     * @returns Array of chunks
     */
    private createChunksWithOverlap;
    /**
     * Build single chunk starting from index
     *
     * @param sentences - All sentences
     * @param startIndex - Starting sentence index
     * @param artifact - Original artifact
     * @returns Chunk
     */
    private buildChunk;
    /**
     * Find starting index for next chunk with overlap
     *
     * Calculates where next chunk should start to achieve desired overlap
     *
     * @param sentences - All sentences
     * @param currentStart - Current chunk start index
     * @param sentenceCount - Number of sentences in current chunk
     * @param overlapWords - Desired overlap in words
     * @returns Next chunk start index
     */
    private findOverlapStart;
    /**
     * Count words in text
     *
     * Simple word count by splitting on whitespace
     *
     * @param text - Text to count
     * @returns Word count
     */
    private countWords;
    /**
     * Get chunk statistics
     *
     * Analyze chunks for quality metrics
     *
     * @param chunks - Chunks to analyze
     * @returns Statistics object
     */
    getChunkStats(chunks: Chunk[]): {
        total_chunks: number;
        avg_words_per_chunk: number;
        min_words: number;
        max_words: number;
        avg_chars_per_chunk: number;
    };
    /**
     * Verify char offsets
     *
     * Validate that char offsets correctly map to original text
     *
     * @param chunks - Chunks to verify
     * @param originalText - Original artifact text
     * @returns True if all offsets are valid
     */
    verifyOffsets(chunks: Chunk[], originalText: string): boolean;
    /**
     * Explain text chunker
     *
     * @returns Explanation string
     */
    explain(): string;
}
declare const textChunker: TextChunker;
export default textChunker;
//# sourceMappingURL=text-chunker.service.d.ts.map