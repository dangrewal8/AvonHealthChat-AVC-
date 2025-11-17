/**
 * Text Chunker Examples
 *
 * Demonstrates document chunking for vector embedding
 */
/**
 * Example 1: Basic Chunking
 *
 * Chunk a document into overlapping segments
 */
declare function example1_basicChunking(): void;
/**
 * Example 2: Short Artifact (Single Chunk)
 *
 * Very short artifacts returned as single chunk
 */
declare function example2_shortArtifact(): void;
/**
 * Example 3: Long Artifact (Multiple Chunks)
 *
 * Long documents split into overlapping chunks
 */
declare function example3_longArtifact(): void;
/**
 * Example 4: Chunk Overlap Verification
 *
 * Verify that chunks have proper 50-word overlap
 */
declare function example4_chunkOverlap(): void;
/**
 * Example 5: Char Offset Tracking
 *
 * Verify char offsets map correctly to original text
 */
declare function example5_charOffsetTracking(): void;
/**
 * Example 6: Sentence Splitting
 *
 * Demonstrate sentence boundary detection
 */
declare function example6_sentenceSplitting(): void;
/**
 * Example 7: Edge Case - Empty Text
 *
 * Handle empty or whitespace-only text
 */
declare function example7_edgeCaseEmptyText(): void;
/**
 * Example 8: Edge Case - Very Long Sentence
 *
 * Handle sentences that exceed max chunk size
 */
declare function example8_edgeCaseVeryLongSentence(): void;
/**
 * Example 9: Chunk Statistics
 *
 * Analyze chunk quality metrics
 */
declare function example9_chunkStatistics(): void;
/**
 * Example 10: Offset Verification
 *
 * Verify all chunks have valid char offsets
 */
declare function example10_offsetVerification(): void;
/**
 * Example 11: Real-World Medical Note
 *
 * Chunk actual clinical documentation
 */
declare function example11_realWorldMedicalNote(): void;
/**
 * Example 12: Integration with Artifact Types
 *
 * Chunk different artifact types
 */
declare function example12_artifactTypeIntegration(): void;
/**
 * Example 13: Metadata Preservation
 *
 * Verify all metadata is preserved in chunks
 */
declare function example13_metadataPreservation(): void;
/**
 * Example 14: Multiple Chunks from Same Artifact
 *
 * Demonstrate overlap and continuity
 */
declare function example14_multipleChunksOverlap(): void;
/**
 * Example 15: Explain Text Chunker
 *
 * Get detailed explanation of text chunking
 */
declare function example15_explainTextChunker(): void;
export { example1_basicChunking, example2_shortArtifact, example3_longArtifact, example4_chunkOverlap, example5_charOffsetTracking, example6_sentenceSplitting, example7_edgeCaseEmptyText, example8_edgeCaseVeryLongSentence, example9_chunkStatistics, example10_offsetVerification, example11_realWorldMedicalNote, example12_artifactTypeIntegration, example13_metadataPreservation, example14_multipleChunksOverlap, example15_explainTextChunker, };
//# sourceMappingURL=text-chunker.example.d.ts.map