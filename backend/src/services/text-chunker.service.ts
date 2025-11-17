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

import { v4 as uuidv4 } from 'uuid';
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
  char_offsets: [number, number]; // within original artifact
  occurred_at: string;
  author?: string;
  source: string;
  created_at: string;
}

/**
 * Sentence with metadata
 */
interface SentenceWithOffset {
  text: string;
  charStart: number;
  charEnd: number;
  wordCount: number;
}

/**
 * Text Chunker Class
 *
 * Chunk documents into overlapping segments for vector embedding
 */
class TextChunker {
  /**
   * Target chunk size (words)
   */
  private readonly MIN_CHUNK_WORDS = 200;
  private readonly MAX_CHUNK_WORDS = 300;

  /**
   * Overlap between chunks (words)
   */
  private readonly OVERLAP_WORDS = 50;

  /**
   * Chunk artifact into overlapping chunks
   *
   * Main entry point for chunking
   *
   * @param artifact - Artifact to chunk
   * @returns Array of chunks with metadata
   */
  chunk(artifact: Artifact): Chunk[] {
    // Handle empty or very short text
    if (!artifact.text || artifact.text.trim().length === 0) {
      return [];
    }

    const text = artifact.text;
    const wordCount = this.countWords(text);

    // If artifact is short, return as single chunk
    if (wordCount <= this.MAX_CHUNK_WORDS) {
      return [
        {
          chunk_id: uuidv4(),
          artifact_id: artifact.id,
          patient_id: artifact.patient_id,
          artifact_type: artifact.type,
          chunk_text: text.trim(),
          char_offsets: [0, text.length],
          occurred_at: artifact.occurred_at,
          author: artifact.author,
          source: artifact.source,
          created_at: new Date().toISOString(),
        },
      ];
    }

    // Split into sentences with char offsets
    const sentences = this.splitIntoSentencesWithOffsets(text);

    // Create chunks with overlap
    const chunks = this.createChunksWithOverlap(sentences, artifact);

    return chunks;
  }

  /**
   * Split text into sentences
   *
   * Simple sentence boundary detection
   *
   * @param text - Text to split
   * @returns Array of sentences
   */
  splitIntoSentences(text: string): string[] {
    const sentences = this.splitIntoSentencesWithOffsets(text);
    return sentences.map((s) => s.text);
  }

  /**
   * Split text into sentences with char offsets
   *
   * Uses regex to detect sentence boundaries while handling common abbreviations
   *
   * @param text - Text to split
   * @returns Array of sentences with char offsets
   */
  private splitIntoSentencesWithOffsets(text: string): SentenceWithOffset[] {
    const sentences: SentenceWithOffset[] = [];

    // Sentence boundary regex
    // Matches: . ! ? followed by space/newline and capital letter
    // Handles common abbreviations: Dr., Mr., Mrs., Ms., etc.
    const sentenceRegex = /([.!?])\s+(?=[A-Z])/g;

    let lastIndex = 0;
    let match;

    while ((match = sentenceRegex.exec(text)) !== null) {
      const endIndex = match.index + 1; // Include the punctuation
      const sentence = text.slice(lastIndex, endIndex).trim();

      if (sentence.length > 0) {
        // Check if this is an abbreviation
        if (this.isAbbreviation(sentence)) {
          continue; // Don't split on abbreviations
        }

        sentences.push({
          text: sentence,
          charStart: lastIndex,
          charEnd: endIndex,
          wordCount: this.countWords(sentence),
        });
      }

      lastIndex = endIndex;
    }

    // Add final sentence
    const finalSentence = text.slice(lastIndex).trim();
    if (finalSentence.length > 0) {
      sentences.push({
        text: finalSentence,
        charStart: lastIndex,
        charEnd: text.length,
        wordCount: this.countWords(finalSentence),
      });
    }

    return sentences;
  }

  /**
   * Check if sentence ends with common abbreviation
   *
   * @param sentence - Sentence to check
   * @returns True if sentence ends with abbreviation
   */
  private isAbbreviation(sentence: string): boolean {
    const abbreviations = [
      'Dr.',
      'Mr.',
      'Mrs.',
      'Ms.',
      'Prof.',
      'Sr.',
      'Jr.',
      'Ph.D.',
      'M.D.',
      'B.A.',
      'M.A.',
      'etc.',
      'vs.',
      'i.e.',
      'e.g.',
    ];

    for (const abbr of abbreviations) {
      if (sentence.endsWith(abbr)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Create chunks with overlap
   *
   * Groups sentences into chunks of 200-300 words with 50-word overlap
   *
   * @param sentences - Sentences with offsets
   * @param artifact - Original artifact
   * @returns Array of chunks
   */
  private createChunksWithOverlap(
    sentences: SentenceWithOffset[],
    artifact: Artifact
  ): Chunk[] {
    const chunks: Chunk[] = [];

    let i = 0;
    while (i < sentences.length) {
      const chunk = this.buildChunk(sentences, i, artifact);
      chunks.push(chunk);

      // Find overlap start point (50 words back from end)
      const overlapStart = this.findOverlapStart(
        sentences,
        i,
        chunk.sentenceCount,
        this.OVERLAP_WORDS
      );

      i = overlapStart;

      // Prevent infinite loop
      if (overlapStart <= i) {
        i = i + chunk.sentenceCount;
      }
    }

    return chunks;
  }

  /**
   * Build single chunk starting from index
   *
   * @param sentences - All sentences
   * @param startIndex - Starting sentence index
   * @param artifact - Original artifact
   * @returns Chunk
   */
  private buildChunk(
    sentences: SentenceWithOffset[],
    startIndex: number,
    artifact: Artifact
  ): Chunk & { sentenceCount: number } {
    let wordCount = 0;
    let sentenceCount = 0;
    const chunkSentences: SentenceWithOffset[] = [];

    // Add sentences until we reach target size
    for (let i = startIndex; i < sentences.length; i++) {
      const sentence = sentences[i];
      const newWordCount = wordCount + sentence.wordCount;

      // Add sentence if we haven't reached minimum or won't exceed maximum
      if (
        newWordCount <= this.MAX_CHUNK_WORDS ||
        wordCount < this.MIN_CHUNK_WORDS
      ) {
        chunkSentences.push(sentence);
        wordCount = newWordCount;
        sentenceCount++;
      } else {
        break;
      }
    }

    // Handle case where no sentences were added (very long sentence)
    if (chunkSentences.length === 0 && startIndex < sentences.length) {
      chunkSentences.push(sentences[startIndex]);
      sentenceCount = 1;
    }

    // Build chunk text and calculate offsets
    const chunkText = chunkSentences.map((s) => s.text).join(' ');
    const charStart = chunkSentences[0].charStart;
    const charEnd = chunkSentences[chunkSentences.length - 1].charEnd;

    return {
      chunk_id: uuidv4(),
      artifact_id: artifact.id,
      patient_id: artifact.patient_id,
      artifact_type: artifact.type,
      chunk_text: chunkText,
      char_offsets: [charStart, charEnd],
      occurred_at: artifact.occurred_at,
      author: artifact.author,
      source: artifact.source,
      created_at: new Date().toISOString(),
      sentenceCount,
    };
  }

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
  private findOverlapStart(
    sentences: SentenceWithOffset[],
    currentStart: number,
    sentenceCount: number,
    overlapWords: number
  ): number {
    const currentEnd = currentStart + sentenceCount;

    // If we're at the end, no next chunk
    if (currentEnd >= sentences.length) {
      return sentences.length;
    }

    // Count back from end to find overlap point
    let wordCount = 0;
    let overlapSentences = 0;

    for (let i = currentEnd - 1; i >= currentStart; i--) {
      wordCount += sentences[i].wordCount;
      overlapSentences++;

      if (wordCount >= overlapWords) {
        break;
      }
    }

    // Start next chunk at overlap point
    return currentEnd - overlapSentences;
  }

  /**
   * Count words in text
   *
   * Simple word count by splitting on whitespace
   *
   * @param text - Text to count
   * @returns Word count
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  }

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
  } {
    if (chunks.length === 0) {
      return {
        total_chunks: 0,
        avg_words_per_chunk: 0,
        min_words: 0,
        max_words: 0,
        avg_chars_per_chunk: 0,
      };
    }

    const wordCounts = chunks.map((c) => this.countWords(c.chunk_text));
    const charCounts = chunks.map((c) => c.chunk_text.length);

    return {
      total_chunks: chunks.length,
      avg_words_per_chunk:
        wordCounts.reduce((sum, c) => sum + c, 0) / chunks.length,
      min_words: Math.min(...wordCounts),
      max_words: Math.max(...wordCounts),
      avg_chars_per_chunk:
        charCounts.reduce((sum, c) => sum + c, 0) / chunks.length,
    };
  }

  /**
   * Verify char offsets
   *
   * Validate that char offsets correctly map to original text
   *
   * @param chunks - Chunks to verify
   * @param originalText - Original artifact text
   * @returns True if all offsets are valid
   */
  verifyOffsets(chunks: Chunk[], originalText: string): boolean {
    for (const chunk of chunks) {
      const [start, end] = chunk.char_offsets;

      // Check bounds
      if (start < 0 || end > originalText.length || start >= end) {
        return false;
      }

      // Extract text using offsets
      const extractedText = originalText.slice(start, end).trim();

      // Check if chunk_text matches (after normalizing whitespace)
      const normalizedChunk = chunk.chunk_text.replace(/\s+/g, ' ').trim();
      const normalizedExtracted = extractedText.replace(/\s+/g, ' ').trim();

      if (normalizedChunk !== normalizedExtracted) {
        return false;
      }
    }

    return true;
  }

  /**
   * Explain text chunker
   *
   * @returns Explanation string
   */
  explain(): string {
    return `Text Chunker:

Purpose:
Chunk documents into overlapping segments for vector embedding and retrieval.

Chunking Strategy:
- Target size: ${this.MIN_CHUNK_WORDS}-${this.MAX_CHUNK_WORDS} words per chunk
- Overlap: ${this.OVERLAP_WORDS} words between chunks
- Preserve sentence boundaries (no mid-sentence splits)
- Track char offsets for provenance

Sentence Splitting:
- Regex-based sentence boundary detection
- Handles common abbreviations (Dr., Mr., Mrs., etc.)
- Splits on: . ! ? followed by space and capital letter

Overlap Strategy:
- Each chunk overlaps with previous by ${this.OVERLAP_WORDS} words
- Ensures continuity across chunk boundaries
- Important for context preservation in retrieval

Char Offset Tracking:
- Each chunk stores [start, end] position in original text
- Required for citation provenance
- Allows mapping retrieved chunks back to source

Edge Cases:
- Very short artifacts (< ${this.MAX_CHUNK_WORDS} words): returned as single chunk
- Empty text: returns empty array
- Very long sentences: included even if exceeds max size

Metadata Preservation:
- artifact_id, patient_id, artifact_type
- occurred_at, author, source
- All metadata copied to each chunk

Integration:
1. Ingest artifact
2. Chunk into overlapping segments
3. Embed each chunk (separate service)
4. Store in vector database
5. Retrieve chunks during query
6. Use char offsets for citation

Tech Stack: Node.js + TypeScript ONLY
NO Python text processing libraries`;
  }
}

// Export singleton instance
const textChunker = new TextChunker();
export default textChunker;
