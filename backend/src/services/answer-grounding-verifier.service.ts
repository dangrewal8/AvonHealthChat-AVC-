/**
 * Answer Grounding Verifier Service
 *
 * Phase 9: Verifies that all statements in an answer are grounded in source material.
 * Decomposes answers into atomic facts and verifies each against source chunks.
 *
 * Tech Stack: PostgreSQL (raw SQL), Ollama (local embeddings), TypeScript strict mode
 * HIPAA Compliant: All processing local, no external APIs
 */

import { Pool } from 'pg';
import {
  GroundingResult,
  StatementGrounding,
  VerificationMethod,
  GroundingVerificationRecord,
} from '../types/hallucination-prevention.types';
import { RetrievalCandidate } from '../services/retriever-agent.service';
import embeddingService from '../services/embedding-factory.service';
import { v4 as uuidv4 } from 'uuid';

class AnswerGroundingVerifierService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'avon_health_rag',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    console.log('[Grounding Verifier] PostgreSQL pool initialized');
  }

  /**
   * Verify an answer against source material
   */
  async verifyAnswer(
    conversationId: string,
    answer: string,
    sources: RetrievalCandidate[]
  ): Promise<GroundingResult> {
    try {
      console.log(`[Grounding Verifier] Verifying answer for conversation ${conversationId}`);

      // Step 1: Decompose answer into atomic statements
      const statements = await this.decomposeIntoStatements(answer);
      console.log(`[Grounding Verifier] Decomposed into ${statements.length} statements`);

      // Step 2: Verify each statement
      const groundings: StatementGrounding[] = [];
      for (let i = 0; i < statements.length; i++) {
        const grounding = await this.verifyStatement(statements[i], i, sources);
        groundings.push(grounding);
      }

      // Step 3: Calculate overall grounding score
      const groundingScore = this.calculateGroundingScore(groundings);

      // Step 4: Identify unsupported statements
      const unsupportedStatements = groundings
        .filter(g => !g.is_grounded)
        .map(g => g.statement);

      // Step 5: Generate warnings
      const warnings = this.generateWarnings(groundings);

      // Step 6: Store grounding results to database
      await this.storeGroundingResults(conversationId, groundings);

      const result: GroundingResult = {
        conversation_id: conversationId,
        overall_grounded: unsupportedStatements.length === 0,
        grounding_score: groundingScore,
        statements: groundings,
        unsupported_statements: unsupportedStatements,
        warnings,
        verified_at: new Date(),
      };

      console.log(
        `[Grounding Verifier] Verification complete: ` +
        `${groundings.filter(g => g.is_grounded).length}/${groundings.length} statements grounded, ` +
        `score: ${groundingScore.toFixed(2)}`
      );

      return result;
    } catch (error) {
      console.error('[Grounding Verifier] Error verifying answer:', error);
      throw new Error(`Failed to verify answer: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Decompose answer into atomic statements
   * Uses simple sentence splitting with clause analysis
   */
  async decomposeIntoStatements(answer: string): Promise<string[]> {
    // Clean the answer
    const cleanAnswer = answer.trim();

    // Split by sentence boundaries
    const sentences = cleanAnswer.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

    const statements: string[] = [];

    for (const sentence of sentences) {
      // Further split complex sentences by coordinating conjunctions
      const clauses = sentence.split(/,\s*(?:and|but|or|yet)\s+/i);

      for (const clause of clauses) {
        const trimmed = clause.trim();
        if (trimmed.length > 10) { // Ignore very short fragments
          statements.push(trimmed);
        }
      }
    }

    return statements;
  }

  /**
   * Verify a single statement against sources
   */
  async verifyStatement(
    statement: string,
    index: number,
    sources: RetrievalCandidate[]
  ): Promise<StatementGrounding> {
    const statementLower = statement.toLowerCase();

    // Method 1: Check for exact text match
    for (const source of sources) {
      const chunkTextLower = source.chunk.content.toLowerCase();

      if (chunkTextLower.includes(statementLower)) {
        return {
          statement,
          statement_index: index,
          is_grounded: true,
          source_chunk_id: source.chunk.chunk_id,
          source_artifact_id: source.chunk.artifact_id,
          source_text: source.chunk.content,
          supporting_evidence: this.extractSupportingEvidence(source.chunk.content, statement),
          grounding_confidence: 0.95,
          verification_method: 'exact_match',
        };
      }
    }

    // Method 2: Check for partial/fuzzy match
    for (const source of sources) {
      const chunkWords = new Set(
        source.chunk.content.toLowerCase().split(/\s+/)
      );
      const statementWords = statementLower.split(/\s+/);

      // Calculate word overlap
      const matchingWords = statementWords.filter(word =>
        word.length > 3 && chunkWords.has(word)
      );

      const overlapRatio = matchingWords.length / statementWords.length;

      if (overlapRatio > 0.6) {
        return {
          statement,
          statement_index: index,
          is_grounded: true,
          source_chunk_id: source.chunk.chunk_id,
          source_artifact_id: source.chunk.artifact_id,
          source_text: source.chunk.content,
          supporting_evidence: this.extractSupportingEvidence(source.chunk.content, statement),
          grounding_confidence: 0.7 + (overlapRatio * 0.2),
          verification_method: 'semantic_match',
          similarity_score: overlapRatio,
        };
      }
    }

    // Method 3: Semantic similarity using embeddings (expensive, only if needed)
    const semanticMatch = await this.checkSemanticSimilarity(statement, sources);
    if (semanticMatch) {
      return semanticMatch;
    }

    // Method 4: No grounding found
    return {
      statement,
      statement_index: index,
      is_grounded: false,
      grounding_confidence: 0.0,
      verification_method: 'unsupported',
    };
  }

  /**
   * Check semantic similarity using embeddings
   */
  private async checkSemanticSimilarity(
    statement: string,
    sources: RetrievalCandidate[]
  ): Promise<StatementGrounding | null> {
    try {
      // Generate embedding for statement
      const statementEmbedding = await embeddingService.generateEmbedding(statement);

      // Check similarity with each source chunk
      for (const source of sources) {
        // Generate embedding for chunk (would ideally be pre-computed)
        const chunkEmbedding = await embeddingService.generateEmbedding(
          source.chunk.content
        );

        // Calculate cosine similarity
        const similarity = this.cosineSimilarity(statementEmbedding, chunkEmbedding);

        if (similarity > 0.75) { // High semantic similarity threshold
          return {
            statement,
            statement_index: -1, // Will be set by caller
            is_grounded: true,
            source_chunk_id: source.chunk.chunk_id,
            source_artifact_id: source.chunk.artifact_id,
            source_text: source.chunk.content,
            supporting_evidence: this.extractSupportingEvidence(source.chunk.content, statement),
            grounding_confidence: similarity * 0.9, // Slightly discounted
            verification_method: 'semantic_match',
            similarity_score: similarity,
          };
        }
      }

      return null;
    } catch (error) {
      console.warn('[Grounding Verifier] Semantic similarity check failed:', error);
      return null;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Extract supporting evidence from chunk (context around statement)
   */
  private extractSupportingEvidence(chunkText: string, statement: string): string {
    // Find the most relevant sentence from the chunk
    const chunkSentences = chunkText.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 0);

    // Find sentence with most word overlap
    const statementWords = new Set(statement.toLowerCase().split(/\s+/));

    let bestSentence = '';
    let bestOverlap = 0;

    for (const sentence of chunkSentences) {
      const sentenceWords = sentence.toLowerCase().split(/\s+/);
      const overlap = sentenceWords.filter(word => statementWords.has(word)).length;

      if (overlap > bestOverlap) {
        bestOverlap = overlap;
        bestSentence = sentence;
      }
    }

    return bestSentence || chunkText.substring(0, 200);
  }

  /**
   * Calculate overall grounding score
   */
  private calculateGroundingScore(groundings: StatementGrounding[]): number {
    if (groundings.length === 0) return 0.0;

    const groundedCount = groundings.filter(g => g.is_grounded).length;
    const totalConfidence = groundings.reduce((sum, g) => sum + g.grounding_confidence, 0);

    // Weighted score: 70% based on count, 30% based on confidence
    const countScore = groundedCount / groundings.length;
    const confidenceScore = totalConfidence / groundings.length;

    return countScore * 0.7 + confidenceScore * 0.3;
  }

  /**
   * Generate warnings based on grounding results
   */
  private generateWarnings(groundings: StatementGrounding[]): string[] {
    const warnings: string[] = [];

    const unsupportedCount = groundings.filter(g => !g.is_grounded).length;
    if (unsupportedCount > 0) {
      warnings.push(
        `${unsupportedCount} statement(s) are not grounded in source material`
      );
    }

    const lowConfidenceCount = groundings.filter(
      g => g.is_grounded && g.grounding_confidence < 0.7
    ).length;
    if (lowConfidenceCount > 0) {
      warnings.push(
        `${lowConfidenceCount} statement(s) have low grounding confidence (<0.7)`
      );
    }

    const inferenceCount = groundings.filter(
      g => g.verification_method === 'inference'
    ).length;
    if (inferenceCount > groundings.length * 0.3) {
      warnings.push(
        `High proportion of inferred statements (${inferenceCount}/${groundings.length}) - verify accuracy`
      );
    }

    return warnings;
  }

  /**
   * Store grounding results to database
   */
  private async storeGroundingResults(
    conversationId: string,
    groundings: StatementGrounding[]
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      // Batch insert all grounding records
      const query = `
        INSERT INTO grounding_verification (
          id,
          conversation_id,
          statement,
          statement_index,
          is_grounded,
          source_chunk_id,
          source_artifact_id,
          source_text,
          supporting_evidence,
          grounding_confidence,
          verification_method,
          similarity_score,
          verified_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
      `;

      for (const grounding of groundings) {
        const values = [
          uuidv4(),
          conversationId,
          grounding.statement,
          grounding.statement_index,
          grounding.is_grounded,
          grounding.source_chunk_id ?? null,
          grounding.source_artifact_id ?? null,
          grounding.source_text ?? null,
          grounding.supporting_evidence ?? null,
          grounding.grounding_confidence,
          grounding.verification_method,
          grounding.similarity_score ?? null,
        ];

        await client.query(query, values);
      }

      console.log(`[Grounding Verifier] Stored ${groundings.length} grounding records`);
    } catch (error) {
      console.error('[Grounding Verifier] Error storing grounding results:', error);
      // Don't throw - grounding verification failure shouldn't block the response
    } finally {
      client.release();
    }
  }

  /**
   * Get grounding results for a conversation
   */
  async getGroundingResults(conversationId: string): Promise<GroundingVerificationRecord[]> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT * FROM grounding_verification
        WHERE conversation_id = $1
        ORDER BY statement_index ASC
      `;

      const result = await client.query(query, [conversationId]);

      return result.rows.map(row => ({
        id: row.id,
        conversation_id: row.conversation_id,
        statement: row.statement,
        statement_index: row.statement_index,
        is_grounded: row.is_grounded,
        source_chunk_id: row.source_chunk_id,
        source_artifact_id: row.source_artifact_id,
        source_text: row.source_text,
        supporting_evidence: row.supporting_evidence,
        grounding_confidence: parseFloat(row.grounding_confidence),
        verification_method: row.verification_method as VerificationMethod,
        similarity_score: row.similarity_score ? parseFloat(row.similarity_score) : null,
        verified_at: new Date(row.verified_at),
      }));
    } catch (error) {
      console.error('[Grounding Verifier] Error getting grounding results:', error);
      throw new Error(`Failed to get grounding results: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    console.log('[Grounding Verifier] PostgreSQL pool closed');
  }
}

// Export singleton instance
const answerGroundingVerifier = new AnswerGroundingVerifierService();
export default answerGroundingVerifier;
