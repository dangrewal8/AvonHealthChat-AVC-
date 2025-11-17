/**
 * Enrichment Orchestrator Service
 *
 * Main orchestrator for the enrichment pipeline.
 * Coordinates all enrichment services to transform raw EMR data into enriched,
 * relationship-aware artifacts.
 *
 * Pipeline:
 * 1. Fetch enriched data from Avon Health API (EMREnrichedService)
 * 2. Extract clinical relationships (RelationshipExtractorService)
 * 3. Enrich artifacts with context (ArtifactEnricherService)
 * 4. Store enriched artifacts and relationships (EnrichmentStorageService)
 * 5. Return enrichment results and statistics
 *
 * Usage:
 * const result = await enrichmentOrchestrator.enrichPatient('patient-123');
 */

import emrEnrichedService from './emr-enriched.service';
import relationshipExtractorService from './relationship-extractor.service';
import artifactEnricherService from './artifact-enricher.service';
import enrichmentStorageService from './enrichment-storage.service';
import {
  EnrichedArtifact,
  ClinicalRelationship,
  EnrichmentResult,
} from '../types/enrichment.types';

class EnrichmentOrchestratorService {
  /**
   * Enrich all data for a patient
   *
   * Main entry point for the enrichment pipeline
   */
  async enrichPatient(patientId: string, options?: {
    clearExisting?: boolean; // Clear existing enrichment data before re-enriching
    dryRun?: boolean; // Don't store to database, just return results
  }): Promise<EnrichmentResult> {
    const startTime = Date.now();
    const errors: Array<{ artifact_id: string; error: string }> = [];

    console.log(`\n[Enrichment Orchestrator] Starting enrichment for patient ${patientId}`);
    console.log('========================================\n');

    try {
      // Step 0: Clear existing enrichment if requested
      if (options?.clearExisting) {
        console.log('[Enrichment Orchestrator] Clearing existing enrichment data...');
        await enrichmentStorageService.clearPatientEnrichment(patientId);
      }

      // Step 1: Fetch enriched data from Avon Health API
      console.log('[Enrichment Orchestrator] Step 1: Fetching enriched EMR data...');
      const { medications, conditions, carePlans } = await emrEnrichedService.fetchAllEnriched(
        patientId
      );
      console.log(
        `[Enrichment Orchestrator] ✓ Fetched ${medications.length} medications, ${conditions.length} conditions, ${carePlans.length} care plans`
      );

      // Step 2: Extract clinical relationships
      console.log('[Enrichment Orchestrator] Step 2: Extracting clinical relationships...');
      const relationships = await relationshipExtractorService.extractAllRelationships(
        medications,
        conditions,
        carePlans
      );
      console.log(`[Enrichment Orchestrator] ✓ Extracted ${relationships.length} relationships`);

      // Step 3: Enrich artifacts with context
      console.log('[Enrichment Orchestrator] Step 3: Enriching artifacts...');
      const enrichedArtifacts: EnrichedArtifact[] = [];

      // Enrich medications
      for (const medication of medications) {
        try {
          const enriched = artifactEnricherService.enrichMedication(
            medication,
            relationships,
            conditions
          );
          enrichedArtifacts.push(enriched);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push({ artifact_id: medication.id, error: errorMessage });
          console.error(
            `[Enrichment Orchestrator] Failed to enrich medication ${medication.id}:`,
            error
          );
        }
      }

      // Enrich conditions
      for (const condition of conditions) {
        try {
          const enriched = artifactEnricherService.enrichCondition(
            condition,
            relationships,
            medications,
            carePlans
          );
          enrichedArtifacts.push(enriched);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push({ artifact_id: condition.id, error: errorMessage });
          console.error(
            `[Enrichment Orchestrator] Failed to enrich condition ${condition.id}:`,
            error
          );
        }
      }

      // Enrich care plans
      for (const carePlan of carePlans) {
        try {
          const enriched = artifactEnricherService.enrichCarePlan(
            carePlan,
            relationships,
            conditions
          );
          enrichedArtifacts.push(enriched);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push({ artifact_id: carePlan.id, error: errorMessage });
          console.error(
            `[Enrichment Orchestrator] Failed to enrich care plan ${carePlan.id}:`,
            error
          );
        }
      }

      console.log(`[Enrichment Orchestrator] ✓ Enriched ${enrichedArtifacts.length} artifacts`);

      // Step 4: Store enriched artifacts and relationships (unless dry run)
      if (!options?.dryRun) {
        console.log('[Enrichment Orchestrator] Step 4: Storing enriched data...');

        await Promise.all([
          enrichmentStorageService.storeEnrichedArtifacts(enrichedArtifacts),
          enrichmentStorageService.storeRelationships(relationships),
        ]);

        console.log('[Enrichment Orchestrator] ✓ Stored all enriched data to database');
      } else {
        console.log(
          '[Enrichment Orchestrator] Step 4: Skipped storage (dry run mode)'
        );
      }

      // Step 5: Return results
      const duration = Date.now() - startTime;
      const result: EnrichmentResult = {
        success: errors.length === 0,
        artifacts_enriched: enrichedArtifacts.length,
        relationships_created: relationships.length,
        entities_extracted: this.countEntities(enrichedArtifacts),
        errors,
        duration_ms: duration,
      };

      console.log('\n========================================');
      console.log('[Enrichment Orchestrator] Enrichment Summary:');
      console.log(`  ✓ Artifacts enriched: ${result.artifacts_enriched}`);
      console.log(`  ✓ Relationships created: ${result.relationships_created}`);
      console.log(`  ✓ Entities extracted: ${result.entities_extracted}`);
      console.log(`  ⚠ Errors: ${result.errors.length}`);
      console.log(`  ⏱ Duration: ${result.duration_ms}ms`);
      console.log('========================================\n');

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('[Enrichment Orchestrator] Enrichment failed:', error);

      return {
        success: false,
        artifacts_enriched: 0,
        relationships_created: 0,
        entities_extracted: 0,
        errors: [
          {
            artifact_id: 'PIPELINE',
            error: error instanceof Error ? error.message : String(error),
          },
        ],
        duration_ms: duration,
      };
    }
  }

  /**
   * Enrich medications only (for selective enrichment)
   */
  async enrichMedicationsOnly(patientId: string): Promise<EnrichmentResult> {
    const startTime = Date.now();
    const errors: Array<{ artifact_id: string; error: string }> = [];

    try {
      console.log(
        `[Enrichment Orchestrator] Enriching medications only for patient ${patientId}`
      );

      // Fetch medications and conditions
      const [medications, conditions] = await Promise.all([
        emrEnrichedService.fetchMedicationsWithIndication(patientId),
        emrEnrichedService.fetchConditionsWithDetails(patientId),
      ]);

      // Extract medication-indication relationships
      const relationships = await relationshipExtractorService.extractMedicationIndications(
        medications,
        conditions
      );

      // Enrich medications
      const enrichedArtifacts: EnrichedArtifact[] = [];
      for (const medication of medications) {
        try {
          const enriched = artifactEnricherService.enrichMedication(
            medication,
            relationships,
            conditions
          );
          enrichedArtifacts.push(enriched);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push({ artifact_id: medication.id, error: errorMessage });
        }
      }

      // Store
      await Promise.all([
        enrichmentStorageService.storeEnrichedArtifacts(enrichedArtifacts),
        enrichmentStorageService.storeRelationships(relationships),
      ]);

      const duration = Date.now() - startTime;
      return {
        success: errors.length === 0,
        artifacts_enriched: enrichedArtifacts.length,
        relationships_created: relationships.length,
        entities_extracted: this.countEntities(enrichedArtifacts),
        errors,
        duration_ms: duration,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        artifacts_enriched: 0,
        relationships_created: 0,
        entities_extracted: 0,
        errors: [
          {
            artifact_id: 'PIPELINE',
            error: error instanceof Error ? error.message : String(error),
          },
        ],
        duration_ms: duration,
      };
    }
  }

  /**
   * Get enrichment stats for a patient
   */
  async getPatientEnrichmentStats(patientId: string) {
    return enrichmentStorageService.getEnrichmentStats(patientId);
  }

  /**
   * Get all enriched artifacts for a patient
   */
  async getEnrichedArtifacts(patientId: string): Promise<EnrichedArtifact[]> {
    return enrichmentStorageService.getEnrichedArtifactsByPatient(patientId);
  }

  /**
   * Get all relationships for a patient
   */
  async getRelationships(patientId: string): Promise<ClinicalRelationship[]> {
    return enrichmentStorageService.getRelationshipsByPatient(patientId);
  }

  /**
   * Get enriched artifact by ID (with relationships)
   */
  async getEnrichedArtifactWithRelationships(artifactId: string): Promise<{
    artifact: EnrichedArtifact | null;
    relationships: ClinicalRelationship[];
  }> {
    const [artifacts, relationships] = await Promise.all([
      enrichmentStorageService.getEnrichedArtifactsByPatient(''), // Will need to modify query to get by artifact_id
      enrichmentStorageService.getRelationshipsByArtifact(artifactId),
    ]);

    const artifact = artifacts.find((a) => a.artifact_id === artifactId) || null;

    return { artifact, relationships };
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Count total entities extracted across all artifacts
   */
  private countEntities(enrichedArtifacts: EnrichedArtifact[]): number {
    let count = 0;

    for (const artifact of enrichedArtifacts) {
      const entities = artifact.extracted_entities;

      // Count top-level entities
      if (entities.medication) count++;
      if (entities.condition) count++;
      if (entities.care_plan) count++;

      // Count related entities
      if (Array.isArray(entities.related_conditions)) {
        count += entities.related_conditions.length;
      }
      if (Array.isArray(entities.related_medications)) {
        count += entities.related_medications.length;
      }
      if (Array.isArray(entities.related_care_plans)) {
        count += entities.related_care_plans.length;
      }
    }

    return count;
  }
}

export const enrichmentOrchestratorService = new EnrichmentOrchestratorService();
export default enrichmentOrchestratorService;
