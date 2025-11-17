/**
 * Conversation History Service
 *
 * Phase 9: Stores and retrieves all patient conversations with quality metrics.
 * Provides reasoning reference capability and conversation analysis.
 *
 * Tech Stack: PostgreSQL (raw SQL, no ORM), TypeScript strict mode
 */

import { Pool, PoolClient } from 'pg';
import {
  ConversationRecord,
  SourceReference,
  QualityTrends,
  TimeRange,
} from '../types/hallucination-prevention.types';
import { Extraction } from '../services/extraction-prompt-builder.service';
import { RetrievalCandidate } from '../services/retriever-agent.service';
import { v4 as uuidv4 } from 'uuid';

class ConversationHistoryService {
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

    console.log('[Conversation History] PostgreSQL pool initialized');
  }

  /**
   * Store a complete conversation record
   */
  async storeConversation(
    conversation: Omit<ConversationRecord, 'id' | 'created_at' | 'updated_at'>
  ): Promise<string> {
    const client = await this.pool.connect();

    try {
      const id = uuidv4();
      const query = `
        INSERT INTO conversation_history (
          id,
          patient_id,
          query,
          query_intent,
          query_timestamp,
          short_answer,
          detailed_summary,
          model_used,
          extractions,
          sources,
          retrieval_candidates,
          grounding_score,
          consistency_score,
          confidence_score,
          hallucination_risk,
          overall_quality_score,
          enrichment_enabled,
          multi_hop_enabled,
          reasoning_enabled,
          execution_time_ms,
          retrieval_time_ms,
          generation_time_ms,
          created_at,
          updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
          $17, $18, $19, $20, $21, $22, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING id
      `;

      const values = [
        id,
        conversation.patient_id,
        conversation.query,
        conversation.query_intent,
        conversation.query_timestamp,
        conversation.short_answer,
        conversation.detailed_summary,
        conversation.model_used,
        JSON.stringify(conversation.extractions),
        JSON.stringify(conversation.sources),
        conversation.retrieval_candidates
          ? JSON.stringify(conversation.retrieval_candidates)
          : null,
        conversation.grounding_score ?? null,
        conversation.consistency_score ?? null,
        conversation.confidence_score ?? null,
        conversation.hallucination_risk ?? null,
        conversation.overall_quality_score ?? null,
        conversation.enrichment_enabled,
        conversation.multi_hop_enabled,
        conversation.reasoning_enabled,
        conversation.execution_time_ms ?? null,
        conversation.retrieval_time_ms ?? null,
        conversation.generation_time_ms ?? null,
      ];

      const result = await client.query(query, values);

      console.log(`[Conversation History] Stored conversation ${id} for patient ${conversation.patient_id}`);
      return id;
    } catch (error) {
      console.error('[Conversation History] Error storing conversation:', error);
      throw new Error(`Failed to store conversation: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Update quality metrics for an existing conversation
   */
  async updateQualityMetrics(
    conversationId: string,
    metrics: {
      grounding_score?: number;
      consistency_score?: number;
      confidence_score?: number;
      hallucination_risk?: number;
      overall_quality_score?: number;
    }
  ): Promise<void> {
    const client = await this.pool.connect();

    try {
      const query = `
        UPDATE conversation_history
        SET
          grounding_score = COALESCE($2, grounding_score),
          consistency_score = COALESCE($3, consistency_score),
          confidence_score = COALESCE($4, confidence_score),
          hallucination_risk = COALESCE($5, hallucination_risk),
          overall_quality_score = COALESCE($6, overall_quality_score),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      const values = [
        conversationId,
        metrics.grounding_score ?? null,
        metrics.consistency_score ?? null,
        metrics.confidence_score ?? null,
        metrics.hallucination_risk ?? null,
        metrics.overall_quality_score ?? null,
      ];

      await client.query(query, values);

      console.log(`[Conversation History] Updated quality metrics for conversation ${conversationId}`);
    } catch (error) {
      console.error('[Conversation History] Error updating quality metrics:', error);
      throw new Error(`Failed to update quality metrics: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get a single conversation by ID
   */
  async getConversation(conversationId: string): Promise<ConversationRecord | null> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT * FROM conversation_history
        WHERE id = $1
      `;

      const result = await client.query(query, [conversationId]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToConversation(result.rows[0]);
    } catch (error) {
      console.error('[Conversation History] Error getting conversation:', error);
      throw new Error(`Failed to get conversation: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get all conversations for a patient (most recent first)
   */
  async getConversationsByPatient(
    patientId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ConversationRecord[]> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT * FROM conversation_history
        WHERE patient_id = $1
        ORDER BY query_timestamp DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await client.query(query, [patientId, limit, offset]);

      return result.rows.map(row => this.mapRowToConversation(row));
    } catch (error) {
      console.error('[Conversation History] Error getting conversations by patient:', error);
      throw new Error(`Failed to get conversations: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Search conversations by query text
   */
  async searchConversations(
    patientId: string,
    searchQuery: string,
    limit: number = 20
  ): Promise<ConversationRecord[]> {
    const client = await this.pool.connect();

    try {
      // Use PostgreSQL full-text search
      const query = `
        SELECT * FROM conversation_history
        WHERE patient_id = $1
          AND to_tsvector('english', query) @@ plainto_tsquery('english', $2)
        ORDER BY query_timestamp DESC
        LIMIT $3
      `;

      const result = await client.query(query, [patientId, searchQuery, limit]);

      return result.rows.map(row => this.mapRowToConversation(row));
    } catch (error) {
      console.error('[Conversation History] Error searching conversations:', error);
      throw new Error(`Failed to search conversations: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get similar past queries for a patient
   * Uses semantic similarity based on query text overlap
   */
  async getSimilarPastQueries(
    patientId: string,
    currentQuery: string,
    limit: number = 5
  ): Promise<ConversationRecord[]> {
    const client = await this.pool.connect();

    try {
      // Use PostgreSQL trigram similarity
      const query = `
        SELECT *, similarity(query, $2) as sim_score
        FROM conversation_history
        WHERE patient_id = $1
          AND similarity(query, $2) > 0.3
        ORDER BY sim_score DESC
        LIMIT $3
      `;

      const result = await client.query(query, [patientId, currentQuery, limit]);

      return result.rows.map(row => this.mapRowToConversation(row));
    } catch (error) {
      // If pg_trgm extension not installed, fall back to simple text search
      console.warn('[Conversation History] Trigram similarity not available, using basic search');
      return this.searchConversations(patientId, currentQuery, limit);
    } finally {
      client.release();
    }
  }

  /**
   * Get quality trends for a patient over a time range
   */
  async getQualityTrends(
    patientId: string,
    timeRange: TimeRange
  ): Promise<QualityTrends | null> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT
          $1 as patient_id,
          $2 as time_period,
          $3::timestamp as period_start,
          $4::timestamp as period_end,
          COUNT(*) as total_queries,
          AVG(grounding_score) as avg_grounding_score,
          AVG(consistency_score) as avg_consistency_score,
          AVG(confidence_score) as avg_confidence_score,
          AVG(hallucination_risk) as avg_hallucination_risk,
          AVG(overall_quality_score) as avg_overall_quality,
          COUNT(*) FILTER (WHERE grounding_score < 0.7) as low_grounding_count,
          COUNT(*) FILTER (WHERE consistency_score < 0.8) as inconsistent_count,
          COUNT(*) FILTER (WHERE confidence_score < 0.6) as low_confidence_count,
          COUNT(*) FILTER (WHERE hallucination_risk > 0.3) as high_hallucination_count,
          AVG(execution_time_ms) as avg_execution_time_ms,
          PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_execution_time_ms
        FROM conversation_history
        WHERE patient_id = $1
          AND query_timestamp >= $3
          AND query_timestamp <= $4
      `;

      const values = [
        patientId,
        timeRange.period,
        timeRange.start,
        timeRange.end,
      ];

      const result = await client.query(query, values);

      if (result.rows.length === 0 || result.rows[0].total_queries === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        patient_id: patientId,
        time_period: timeRange.period,
        period_start: timeRange.start,
        period_end: timeRange.end,
        total_queries: parseInt(row.total_queries),
        avg_grounding_score: parseFloat(row.avg_grounding_score) || 0,
        avg_consistency_score: parseFloat(row.avg_consistency_score) || 0,
        avg_confidence_score: parseFloat(row.avg_confidence_score) || 0,
        avg_hallucination_risk: parseFloat(row.avg_hallucination_risk) || 0,
        avg_overall_quality: parseFloat(row.avg_overall_quality) || 0,
        low_grounding_count: parseInt(row.low_grounding_count) || 0,
        inconsistent_count: parseInt(row.inconsistent_count) || 0,
        low_confidence_count: parseInt(row.low_confidence_count) || 0,
        high_hallucination_count: parseInt(row.high_hallucination_count) || 0,
        avg_execution_time_ms: parseInt(row.avg_execution_time_ms) || 0,
        p95_execution_time_ms: parseInt(row.p95_execution_time_ms) || 0,
      };
    } catch (error) {
      console.error('[Conversation History] Error getting quality trends:', error);
      throw new Error(`Failed to get quality trends: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get conversations with low quality scores (for review)
   */
  async getLowQualityConversations(
    patientId: string | null,
    qualityThreshold: number = 0.7,
    limit: number = 20
  ): Promise<ConversationRecord[]> {
    const client = await this.pool.connect();

    try {
      let query: string;
      let values: any[];

      if (patientId) {
        query = `
          SELECT * FROM conversation_history
          WHERE patient_id = $1
            AND overall_quality_score < $2
          ORDER BY overall_quality_score ASC, query_timestamp DESC
          LIMIT $3
        `;
        values = [patientId, qualityThreshold, limit];
      } else {
        query = `
          SELECT * FROM conversation_history
          WHERE overall_quality_score < $1
          ORDER BY overall_quality_score ASC, query_timestamp DESC
          LIMIT $2
        `;
        values = [qualityThreshold, limit];
      }

      const result = await client.query(query, values);

      return result.rows.map(row => this.mapRowToConversation(row));
    } catch (error) {
      console.error('[Conversation History] Error getting low quality conversations:', error);
      throw new Error(`Failed to get low quality conversations: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get recent conversations (for dashboard)
   */
  async getRecentConversations(
    limit: number = 10
  ): Promise<ConversationRecord[]> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT * FROM conversation_history
        ORDER BY query_timestamp DESC
        LIMIT $1
      `;

      const result = await client.query(query, [limit]);

      return result.rows.map(row => this.mapRowToConversation(row));
    } catch (error) {
      console.error('[Conversation History] Error getting recent conversations:', error);
      throw new Error(`Failed to get recent conversations: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Delete old conversations (data retention)
   */
  async deleteOldConversations(olderThanDays: number): Promise<number> {
    const client = await this.pool.connect();

    try {
      const query = `
        DELETE FROM conversation_history
        WHERE query_timestamp < NOW() - INTERVAL '${olderThanDays} days'
      `;

      const result = await client.query(query);

      console.log(`[Conversation History] Deleted ${result.rowCount} conversations older than ${olderThanDays} days`);
      return result.rowCount || 0;
    } catch (error) {
      console.error('[Conversation History] Error deleting old conversations:', error);
      throw new Error(`Failed to delete old conversations: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      client.release();
    }
  }

  /**
   * Map database row to ConversationRecord
   */
  private mapRowToConversation(row: any): ConversationRecord {
    return {
      id: row.id,
      patient_id: row.patient_id,
      query: row.query,
      query_intent: row.query_intent,
      query_timestamp: new Date(row.query_timestamp),
      short_answer: row.short_answer,
      detailed_summary: row.detailed_summary,
      model_used: row.model_used,
      extractions: row.extractions,
      sources: row.sources,
      retrieval_candidates: row.retrieval_candidates || undefined,
      grounding_score: row.grounding_score,
      consistency_score: row.consistency_score,
      confidence_score: row.confidence_score,
      hallucination_risk: row.hallucination_risk,
      overall_quality_score: row.overall_quality_score,
      enrichment_enabled: row.enrichment_enabled,
      multi_hop_enabled: row.multi_hop_enabled,
      reasoning_enabled: row.reasoning_enabled,
      execution_time_ms: row.execution_time_ms,
      retrieval_time_ms: row.retrieval_time_ms,
      generation_time_ms: row.generation_time_ms,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    };
  }

  /**
   * Close database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
    console.log('[Conversation History] PostgreSQL pool closed');
  }
}

// Export singleton instance
const conversationHistoryService = new ConversationHistoryService();
export default conversationHistoryService;
