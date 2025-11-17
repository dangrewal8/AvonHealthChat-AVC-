/**
 * Relationship Extractor Service
 *
 * Extracts clinical relationships from enriched EMR data.
 *
 * Key relationships extracted:
 * 1. Medication → Condition (medication_indication)
 * 2. Care Plan → Condition (care_plan_condition)
 * 3. Procedure → Diagnosis (procedure_diagnosis)
 *
 * Extraction methods:
 * - Direct API relationships (related_condition_ids)
 * - Indication code matching (ICD-10 codes)
 * - Indication text matching (fuzzy text similarity)
 * - Temporal correlation (prescribed ±90 days of diagnosis)
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ClinicalRelationship,
  MedicationWithIndication,
  ConditionWithDetails,
  CarePlanWithGoals,
} from '../types/enrichment.types';

class RelationshipExtractorService {
  /**
   * Extract medication-indication relationships
   *
   * Links medications to conditions via:
   * 1. Direct API relationships (related_condition_ids)
   * 2. Indication code matching (ICD-10)
   * 3. Indication text matching (fuzzy similarity)
   * 4. Temporal correlation (±90 days)
   */
  async extractMedicationIndications(
    medications: MedicationWithIndication[],
    conditions: ConditionWithDetails[]
  ): Promise<ClinicalRelationship[]> {
    const startTime = Date.now();
    const relationships: ClinicalRelationship[] = [];

    console.log(
      `[Relationship Extractor] Extracting medication-indication relationships for ${medications.length} medications and ${conditions.length} conditions`
    );

    for (const medication of medications) {
      // Strategy 1: Direct API relationships
      if (medication.related_condition_ids && medication.related_condition_ids.length > 0) {
        for (const conditionId of medication.related_condition_ids) {
          const condition = conditions.find((c) => c.id === conditionId);
          if (condition) {
            relationships.push(
              this.createMedicationIndicationRelationship(
                medication,
                condition,
                1.0, // High confidence - explicit API relationship
                'explicit_api'
              )
            );
          }
        }
        continue; // Skip other strategies if we have explicit relationships
      }

      // Strategy 2: Indication code matching
      if (medication.indication_code) {
        const matchingCondition = conditions.find(
          (c) => c.code === medication.indication_code
        );
        if (matchingCondition) {
          relationships.push(
            this.createMedicationIndicationRelationship(
              medication,
              matchingCondition,
              0.95, // Very high confidence - code match
              'explicit_api'
            )
          );
          continue;
        }
      }

      // Strategy 3: Indication text matching
      if (medication.indication) {
        const matchingCondition = this.findConditionByTextMatch(
          medication.indication,
          conditions
        );
        if (matchingCondition.condition) {
          relationships.push(
            this.createMedicationIndicationRelationship(
              medication,
              matchingCondition.condition,
              matchingCondition.confidence,
              'llm_inferred'
            )
          );
          continue;
        }
      }

      // Strategy 4: Temporal correlation
      // Link medications to conditions diagnosed ±90 days around prescription date
      const temporalMatches = this.findTemporallyCorrelatedConditions(
        medication,
        conditions
      );
      for (const match of temporalMatches) {
        relationships.push(
          this.createMedicationIndicationRelationship(
            medication,
            match.condition,
            match.confidence,
            'temporal_correlation'
          )
        );
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[Relationship Extractor] ✓ Extracted ${relationships.length} medication-indication relationships (${duration}ms)`
    );

    return relationships;
  }

  /**
   * Extract care plan → condition relationships
   */
  async extractCarePlanConditions(
    carePlans: CarePlanWithGoals[],
    conditions: ConditionWithDetails[]
  ): Promise<ClinicalRelationship[]> {
    const startTime = Date.now();
    const relationships: ClinicalRelationship[] = [];

    console.log(
      `[Relationship Extractor] Extracting care plan-condition relationships for ${carePlans.length} care plans`
    );

    for (const carePlan of carePlans) {
      // Strategy 1: Direct API relationships
      if (carePlan.related_condition_ids && carePlan.related_condition_ids.length > 0) {
        for (const conditionId of carePlan.related_condition_ids) {
          const condition = conditions.find((c) => c.id === conditionId);
          if (condition) {
            relationships.push(
              this.createCarePlanConditionRelationship(carePlan, condition, 1.0, 'explicit_api')
            );
          }
        }
        continue;
      }

      // Strategy 2: Text matching in title/description
      const text = [carePlan.title, carePlan.description].filter(Boolean).join(' ');
      if (text) {
        for (const condition of conditions) {
          const similarity = this.calculateTextSimilarity(text, condition.name);
          if (similarity > 0.7) {
            relationships.push(
              this.createCarePlanConditionRelationship(
                carePlan,
                condition,
                similarity,
                'llm_inferred'
              )
            );
          }
        }
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[Relationship Extractor] ✓ Extracted ${relationships.length} care plan-condition relationships (${duration}ms)`
    );

    return relationships;
  }

  /**
   * Extract all relationships for a patient
   *
   * Main orchestrator method
   */
  async extractAllRelationships(
    medications: MedicationWithIndication[],
    conditions: ConditionWithDetails[],
    carePlans: CarePlanWithGoals[]
  ): Promise<ClinicalRelationship[]> {
    const startTime = Date.now();

    console.log(`[Relationship Extractor] Extracting all relationships`);

    // Extract all relationship types in parallel
    const [medicationIndications, carePlanConditions] = await Promise.all([
      this.extractMedicationIndications(medications, conditions),
      this.extractCarePlanConditions(carePlans, conditions),
    ]);

    const allRelationships = [...medicationIndications, ...carePlanConditions];

    const duration = Date.now() - startTime;
    console.log(
      `[Relationship Extractor] ✓ Extracted ${allRelationships.length} total relationships (${duration}ms)`
    );

    return allRelationships;
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Create a medication-indication relationship
   */
  private createMedicationIndicationRelationship(
    medication: MedicationWithIndication,
    condition: ConditionWithDetails,
    confidence: number,
    method: 'explicit_api' | 'llm_inferred' | 'temporal_correlation' | 'hybrid'
  ): ClinicalRelationship {
    const now = new Date().toISOString();

    return {
      relationship_id: uuidv4(),
      relationship_type: 'medication_indication',

      // Source: Medication
      source_artifact_id: medication.id,
      source_artifact_type: 'medication',
      source_entity_text: `${medication.name} ${medication.dosage || ''} ${
        medication.frequency || ''
      }`.trim(),

      // Target: Condition
      target_artifact_id: condition.id,
      target_artifact_type: 'condition',
      target_entity_text: `${condition.name} ${condition.code ? `(${condition.code})` : ''}`.trim(),

      // Metadata
      patient_id: medication.patient_id,
      confidence_score: confidence,
      extraction_method: method,

      // Temporal
      established_at: medication.prescribed_at,
      ended_at: undefined, // Assume active unless we know otherwise

      // Context
      clinical_notes: medication.reason || medication.indication,
      evidence_chunk_ids: [],

      // Audit
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Create a care plan → condition relationship
   */
  private createCarePlanConditionRelationship(
    carePlan: CarePlanWithGoals,
    condition: ConditionWithDetails,
    confidence: number,
    method: 'explicit_api' | 'llm_inferred' | 'temporal_correlation' | 'hybrid'
  ): ClinicalRelationship {
    const now = new Date().toISOString();

    return {
      relationship_id: uuidv4(),
      relationship_type: 'care_plan_condition',

      // Source: Care Plan
      source_artifact_id: carePlan.id,
      source_artifact_type: 'care_plan',
      source_entity_text: carePlan.title || 'Care Plan',

      // Target: Condition
      target_artifact_id: condition.id,
      target_artifact_type: 'condition',
      target_entity_text: `${condition.name} ${condition.code ? `(${condition.code})` : ''}`.trim(),

      // Metadata
      patient_id: carePlan.patient_id,
      confidence_score: confidence,
      extraction_method: method,

      // Temporal
      established_at: carePlan.created_at,
      ended_at: undefined,

      // Context
      clinical_notes: carePlan.rationale,
      evidence_chunk_ids: [],

      // Audit
      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Find condition by text matching
   *
   * Fuzzy matching between indication text and condition names
   */
  private findConditionByTextMatch(
    indicationText: string,
    conditions: ConditionWithDetails[]
  ): { condition: ConditionWithDetails | null; confidence: number } {
    let bestMatch: ConditionWithDetails | null = null;
    let bestSimilarity = 0;

    for (const condition of conditions) {
      const similarity = this.calculateTextSimilarity(indicationText, condition.name);

      if (similarity > bestSimilarity && similarity > 0.6) {
        bestSimilarity = similarity;
        bestMatch = condition;
      }
    }

    return {
      condition: bestMatch,
      confidence: bestSimilarity,
    };
  }

  /**
   * Find conditions temporally correlated with medication prescription
   *
   * Links medications to conditions diagnosed ±90 days around prescription date
   */
  private findTemporallyCorrelatedConditions(
    medication: MedicationWithIndication,
    conditions: ConditionWithDetails[]
  ): Array<{ condition: ConditionWithDetails; confidence: number }> {
    const matches: Array<{ condition: ConditionWithDetails; confidence: number }> = [];

    if (!medication.prescribed_at) return matches;

    const prescribedDate = new Date(medication.prescribed_at);

    for (const condition of conditions) {
      const diagnosisDate = new Date(condition.diagnosis_date || condition.onset_date || '');
      if (!diagnosisDate || isNaN(diagnosisDate.getTime())) continue;

      // Calculate days between prescription and diagnosis
      const daysDiff = Math.abs(
        (prescribedDate.getTime() - diagnosisDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // If within 90 days, consider it a potential relationship
      if (daysDiff <= 90) {
        // Confidence decreases with temporal distance
        // 0 days = 0.8 confidence, 90 days = 0.5 confidence
        const confidence = Math.max(0.5, 0.8 - (daysDiff / 90) * 0.3);

        // Only include active conditions
        if (condition.status === 'active' || condition.status === undefined) {
          matches.push({ condition, confidence });
        }
      }
    }

    return matches;
  }

  /**
   * Calculate text similarity using simple Jaccard similarity
   *
   * This is a simplified version. For production, consider:
   * - Levenshtein distance
   * - Cosine similarity with TF-IDF
   * - Local LLM-based semantic similarity
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    if (!text1 || !text2) return 0;

    // Normalize and tokenize
    const tokens1 = this.tokenize(text1.toLowerCase());
    const tokens2 = this.tokenize(text2.toLowerCase());

    // Jaccard similarity: |A ∩ B| / |A ∪ B|
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * Tokenize text into words
   */
  private tokenize(text: string): string[] {
    // Remove punctuation and split on whitespace
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2); // Ignore short tokens
  }
}

export const relationshipExtractorService = new RelationshipExtractorService();
export default relationshipExtractorService;
