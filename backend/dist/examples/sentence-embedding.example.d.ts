/**
 * Sentence Embedding Service Usage Examples
 *
 * NOTE: Uses factory service which enforces Ollama-only processing
 * for HIPAA compliance. All medical data stays local.
 *
 * Demonstrates:
 * - Sentence segmentation with medical abbreviation handling
 * - Sentence-level embedding generation
 * - Storage in FAISS and metadata DB
 * - Two-pass retrieval for precise citations
 * - End-to-end chunk processing
 */
/**
 * Example 1: Sentence segmentation with medical abbreviations
 */
export declare function exampleSentenceSegmentation(): Promise<import("../services/sentence-embedding.service").Sentence[]>;
/**
 * Example 2: Generate sentence-level embeddings
 */
export declare function exampleEmbedSentences(): Promise<import("../services/sentence-embedding.service").SentenceEmbedding[]>;
/**
 * Example 3: Store sentence embeddings
 */
export declare function exampleStoreSentenceEmbeddings(): Promise<import("../services/sentence-embedding.service").SentenceEmbedding[]>;
/**
 * Example 4: End-to-end chunk processing
 */
export declare function exampleProcessChunk(): Promise<number>;
/**
 * Example 5: Two-pass retrieval for precise citations
 */
export declare function exampleTwoPassRetrieval(): Promise<import("../services/sentence-embedding.service").PreciseRetrievalResult[]>;
/**
 * Example 6: Handling long sentences
 */
export declare function exampleLongSentences(): Promise<import("../services/sentence-embedding.service").Sentence[]>;
/**
 * Example 7: Provenance tracking with absolute offsets
 */
export declare function exampleProvenanceTracking(): Promise<void>;
/**
 * Run all examples
 */
export declare function runAllExamples(): Promise<void>;
//# sourceMappingURL=sentence-embedding.example.d.ts.map