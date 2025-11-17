/**
 * Enrichment Storage Service
 *
 * Handles all database operations for enriched artifacts and clinical relationships.
 * Uses raw SQL with PostgreSQL (no ORM per tech stack requirements).
 *
 * Operations:
 * - Store enriched artifacts
 * - Store clinical relationships
 * - Batch inserts/updates
 * - Query enriched data by patient ID
 */

import { Pool, PoolClient } from 'pg';
import {
  EnrichedArtifact,
  ClinicalRelationship,
  EnrichmentResult,
} from '../types/enrichment.types';

class EnrichmentStorageService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DB || 'avon_health_rag',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      max: 20, // Maximum pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    console.log('[Enrichment Storage] PostgreSQL pool initialized');
  }

  /**
   * Store a single enriched artifact
   */
  async storeEnrichedArtifact(artifact: EnrichedArtifact): Promise<void> {
    const client = await this.pool.connect();

    try {
      const query = `
        INSERT INTO enriched_artifacts (
          artifact_id,
          patient_id,
          artifact_type,
          occurred_at,
          original_text,
          enriched_text,
          extracted_entities,
          clinical_context,
          related_artifact_ids,
          relationship_summary,
          enrichment_version,
          enriched_at,
          enrichment_method,
          completeness_score,
          context_depth_score,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (artifact_id) DO UPDATE SET
          enriched_text = EXCLUDED.enriched_text,
          extracted_entities = EXCLUDED.extracted_entities,
          clinical_context = EXCLUDED.clinical_context,
          related_artifact_ids = EXCLUDED.related_artifact_ids,
          relationship_summary = EXCLUDED.relationship_summary,
          enrichment_version = EXCLUDED.enrichment_version,
          enriched_at = EXCLUDED.enriched_at,
          enrichment_method = EXCLUDED.enrichment_method,
          completeness_score = EXCLUDED.completeness_score,
          context_depth_score = EXCLUDED.context_depth_score,
          updated_at = CURRENT_TIMESTAMP
      `;

      const values = [
        artifact.artifact_id,
        artifact.patient_id,
        artifact.artifact_type,
        artifact.occurred_at,
        artifact.original_text,
        artifact.enriched_text,
        JSON.stringify(artifact.extracted_entities),
        JSON.stringify(artifact.clinical_context),
        artifact.related_artifact_ids,
        artifact.relationship_summary,
        artifact.enrichment_version,
        artifact.enriched_at,
        artifact.enrichment_method,
        artifact.completeness_score,
        artifact.context_depth_score,
        artifact.created_at,
        artifact.updated_at,
      ];

      await client.query(query, values);
    } finally {
      client.release();
    }
  }

  /**
   * Store multiple enriched artifacts in a batch
   */
  async storeEnrichedArtifacts(artifacts: EnrichedArtifact[]): Promise<void> {
    if (artifacts.length === 0) return;

    const startTime = Date.now();
    console.log(`[Enrichment Storage] Storing ${artifacts.length} enriched artifacts`);

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      for (const artifact of artifacts) {
        const query = `
          INSERT INTO enriched_artifacts (
            artifact_id,
            patient_id,
            artifact_type,
            occurred_at,
            original_text,
            enriched_text,
            extracted_entities,
            clinical_context,
            related_artifact_ids,
            relationship_summary,
            enrichment_version,
            enriched_at,
            enrichment_method,
            completeness_score,
            context_depth_score,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (artifact_id) DO UPDATE SET
            enriched_text = EXCLUDED.enriched_text,
            extracted_entities = EXCLUDED.extracted_entities,
            clinical_context = EXCLUDED.clinical_context,
            related_artifact_ids = EXCLUDED.related_artifact_ids,
            relationship_summary = EXCLUDED.relationship_summary,
            enrichment_version = EXCLUDED.enrichment_version,
            enriched_at = EXCLUDED.enriched_at,
            enrichment_method = EXCLUDED.enrichment_method,
            completeness_score = EXCLUDED.completeness_score,
            context_depth_score = EXCLUDED.context_depth_score,
            updated_at = CURRENT_TIMESTAMP
        `;

        const values = [
          artifact.artifact_id,
          artifact.patient_id,
          artifact.artifact_type,
          artifact.occurred_at,
          artifact.original_text,
          artifact.enriched_text,
          JSON.stringify(artifact.extracted_entities),
          JSON.stringify(artifact.clinical_context),
          artifact.related_artifact_ids,
          artifact.relationship_summary,
          artifact.enrichment_version,
          artifact.enriched_at,
          artifact.enrichment_method,
          artifact.completeness_score,
          artifact.context_depth_score,
          artifact.created_at,
          artifact.updated_at,
        ];

        await client.query(query, values);
      }

      await client.query('COMMIT');

      const duration = Date.now() - startTime;
      console.log(
        `[Enrichment Storage] ✓ Stored ${artifacts.length} enriched artifacts (${duration}ms)`
      );
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Enrichment Storage] Failed to store enriched artifacts:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Store a single clinical relationship
   */
  async storeRelationship(relationship: ClinicalRelationship): Promise<void> {
    const client = await this.pool.connect();

    try {
      const query = `
        INSERT INTO clinical_relationships (
          relationship_id,
          relationship_type,
          source_artifact_id,
          source_artifact_type,
          source_entity_text,
          target_artifact_id,
          target_artifact_type,
          target_entity_text,
          patient_id,
          confidence_score,
          extraction_method,
          established_at,
          ended_at,
          clinical_notes,
          evidence_chunk_ids,
          created_at,
          updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (relationship_id) DO UPDATE SET
          confidence_score = EXCLUDED.confidence_score,
          extraction_method = EXCLUDED.extraction_method,
          ended_at = EXCLUDED.ended_at,
          clinical_notes = EXCLUDED.clinical_notes,
          evidence_chunk_ids = EXCLUDED.evidence_chunk_ids,
          updated_at = CURRENT_TIMESTAMP
      `;

      const values = [
        relationship.relationship_id,
        relationship.relationship_type,
        relationship.source_artifact_id,
        relationship.source_artifact_type,
        relationship.source_entity_text,
        relationship.target_artifact_id,
        relationship.target_artifact_type,
        relationship.target_entity_text,
        relationship.patient_id,
        relationship.confidence_score,
        relationship.extraction_method,
        relationship.established_at,
        relationship.ended_at || null,
        relationship.clinical_notes || null,
        relationship.evidence_chunk_ids || [],
        relationship.created_at,
        relationship.updated_at,
      ];

      await client.query(query, values);
    } finally {
      client.release();
    }
  }

  /**
   * Store multiple clinical relationships in a batch
   */
  async storeRelationships(relationships: ClinicalRelationship[]): Promise<void> {
    if (relationships.length === 0) return;

    const startTime = Date.now();
    console.log(`[Enrichment Storage] Storing ${relationships.length} clinical relationships`);

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      for (const relationship of relationships) {
        const query = `
          INSERT INTO clinical_relationships (
            relationship_id,
            relationship_type,
            source_artifact_id,
            source_artifact_type,
            source_entity_text,
            target_artifact_id,
            target_artifact_type,
            target_entity_text,
            patient_id,
            confidence_score,
            extraction_method,
            established_at,
            ended_at,
            clinical_notes,
            evidence_chunk_ids,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
          ON CONFLICT (relationship_id) DO UPDATE SET
            confidence_score = EXCLUDED.confidence_score,
            extraction_method = EXCLUDED.extraction_method,
            ended_at = EXCLUDED.ended_at,
            clinical_notes = EXCLUDED.clinical_notes,
            evidence_chunk_ids = EXCLUDED.evidence_chunk_ids,
            updated_at = CURRENT_TIMESTAMP
        `;

        const values = [
          relationship.relationship_id,
          relationship.relationship_type,
          relationship.source_artifact_id,
          relationship.source_artifact_type,
          relationship.source_entity_text,
          relationship.target_artifact_id,
          relationship.target_artifact_type,
          relationship.target_entity_text,
          relationship.patient_id,
          relationship.confidence_score,
          relationship.extraction_method,
          relationship.established_at,
          relationship.ended_at || null,
          relationship.clinical_notes || null,
          relationship.evidence_chunk_ids || [],
          relationship.created_at,
          relationship.updated_at,
        ];

        await client.query(query, values);
      }

      await client.query('COMMIT');

      const duration = Date.now() - startTime;
      console.log(
        `[Enrichment Storage] ✓ Stored ${relationships.length} clinical relationships (${duration}ms)`
      );
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Enrichment Storage] Failed to store clinical relationships:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get enriched artifacts by patient ID
   */
  async getEnrichedArtifactsByPatient(patientId: string): Promise<EnrichedArtifact[]> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT * FROM enriched_artifacts
        WHERE patient_id = $1
        ORDER BY occurred_at DESC
      `;

      const result = await client.query(query, [patientId]);

      return result.rows.map((row) => ({
        artifact_id: row.artifact_id,
        patient_id: row.patient_id,
        artifact_type: row.artifact_type,
        occurred_at: row.occurred_at,
        original_text: row.original_text,
        enriched_text: row.enriched_text,
        extracted_entities: row.extracted_entities,
        clinical_context: row.clinical_context,
        related_artifact_ids: row.related_artifact_ids,
        relationship_summary: row.relationship_summary,
        enrichment_version: row.enrichment_version,
        enriched_at: row.enriched_at,
        enrichment_method: row.enrichment_method,
        completeness_score: row.completeness_score,
        context_depth_score: row.context_depth_score,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get clinical relationships by patient ID
   */
  async getRelationshipsByPatient(patientId: string): Promise<ClinicalRelationship[]> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT * FROM clinical_relationships
        WHERE patient_id = $1
        ORDER BY established_at DESC
      `;

      const result = await client.query(query, [patientId]);

      return result.rows.map((row) => ({
        relationship_id: row.relationship_id,
        relationship_type: row.relationship_type,
        source_artifact_id: row.source_artifact_id,
        source_artifact_type: row.source_artifact_type,
        source_entity_text: row.source_entity_text,
        target_artifact_id: row.target_artifact_id,
        target_artifact_type: row.target_artifact_type,
        target_entity_text: row.target_entity_text,
        patient_id: row.patient_id,
        confidence_score: row.confidence_score,
        extraction_method: row.extraction_method,
        established_at: row.established_at,
        ended_at: row.ended_at,
        clinical_notes: row.clinical_notes,
        evidence_chunk_ids: row.evidence_chunk_ids,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get relationships for a specific artifact
   */
  async getRelationshipsByArtifact(artifactId: string): Promise<ClinicalRelationship[]> {
    const client = await this.pool.connect();

    try {
      const query = `
        SELECT * FROM clinical_relationships
        WHERE source_artifact_id = $1 OR target_artifact_id = $1
        ORDER BY confidence_score DESC
      `;

      const result = await client.query(query, [artifactId]);

      return result.rows.map((row) => ({
        relationship_id: row.relationship_id,
        relationship_type: row.relationship_type,
        source_artifact_id: row.source_artifact_id,
        source_artifact_type: row.source_artifact_type,
        source_entity_text: row.source_entity_text,
        target_artifact_id: row.target_artifact_id,
        target_artifact_type: row.target_artifact_type,
        target_entity_text: row.target_entity_text,
        patient_id: row.patient_id,
        confidence_score: row.confidence_score,
        extraction_method: row.extraction_method,
        established_at: row.established_at,
        ended_at: row.ended_at,
        clinical_notes: row.clinical_notes,
        evidence_chunk_ids: row.evidence_chunk_ids,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
    } finally {
      client.release();
    }
  }

  /**
   * Get enrichment statistics for a patient
   */
  async getEnrichmentStats(patientId: string): Promise<{
    total_artifacts: number;
    total_relationships: number;
    avg_completeness: number;
    avg_context_depth: number;
    by_type: Record<string, number>;
  }> {
    const client = await this.pool.connect();

    try {
      // Get artifact stats
      const artifactQuery = `
        SELECT
          COUNT(*) as total_artifacts,
          AVG(completeness_score) as avg_completeness,
          AVG(context_depth_score) as avg_context_depth,
          artifact_type,
          COUNT(*) as type_count
        FROM enriched_artifacts
        WHERE patient_id = $1
        GROUP BY artifact_type
      `;

      const artifactResult = await client.query(artifactQuery, [patientId]);

      // Get relationship count
      const relationshipQuery = `
        SELECT COUNT(*) as total_relationships
        FROM clinical_relationships
        WHERE patient_id = $1
      `;

      const relationshipResult = await client.query(relationshipQuery, [patientId]);

      // Build response
      const byType: Record<string, number> = {};
      let totalArtifacts = 0;
      let sumCompleteness = 0;
      let sumContextDepth = 0;

      for (const row of artifactResult.rows) {
        byType[row.artifact_type] = parseInt(row.type_count);
        totalArtifacts += parseInt(row.type_count);
        sumCompleteness += parseFloat(row.avg_completeness) * parseInt(row.type_count);
        sumContextDepth += parseFloat(row.avg_context_depth) * parseInt(row.type_count);
      }

      return {
        total_artifacts: totalArtifacts,
        total_relationships: parseInt(relationshipResult.rows[0]?.total_relationships || '0'),
        avg_completeness: totalArtifacts > 0 ? sumCompleteness / totalArtifacts : 0,
        avg_context_depth: totalArtifacts > 0 ? sumContextDepth / totalArtifacts : 0,
        by_type: byType,
      };
    } finally {
      client.release();
    }
  }

  /**
   * Clear all enriched data for a patient (for testing/re-enrichment)
   */
  async clearPatientEnrichment(patientId: string): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      await client.query('DELETE FROM clinical_relationships WHERE patient_id = $1', [patientId]);
      await client.query('DELETE FROM enriched_artifacts WHERE patient_id = $1', [patientId]);

      await client.query('COMMIT');

      console.log(`[Enrichment Storage] Cleared enrichment data for patient ${patientId}`);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('[Enrichment Storage] Failed to clear patient enrichment:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close the database pool (for graceful shutdown)
   */
  async close(): Promise<void> {
    await this.pool.end();
    console.log('[Enrichment Storage] Database pool closed');
  }
}

export const enrichmentStorageService = new EnrichmentStorageService();
export default enrichmentStorageService;
