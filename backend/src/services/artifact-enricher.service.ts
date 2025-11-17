/**
 * Artifact Enricher Service
 *
 * Creates enriched versions of artifacts with full clinical context and relationships.
 *
 * Transforms:
 * - Original: "Medication: Atorvastatin (oral - tablet)"
 * - Enriched: "Medication: Atorvastatin 40mg daily. Indication: Hyperlipidemia (ICD-10: E78.5).
 *              Prescribed for management of elevated cholesterol as part of cardiovascular risk
 *              reduction. Related Conditions: Hyperlipidemia (active), Type 2 Diabetes (active).
 *              Prescribed by: Dr. Smith."
 *
 * Quality Metrics:
 * - Completeness Score: How much information is included (0.0-1.0)
 * - Context Depth Score: How many relationships are captured (0.0-1.0)
 */

import { v4 as uuidv4 } from 'uuid';
import {
  EnrichedArtifact,
  MedicationWithIndication,
  ConditionWithDetails,
  CarePlanWithGoals,
  ClinicalRelationship,
} from '../types/enrichment.types';

class ArtifactEnricherService {
  /**
   * Enrich a medication artifact
   *
   * Adds:
   * - Indication and clinical rationale
   * - Related conditions
   * - Dosage and administration details
   * - Prescriber information
   */
  enrichMedication(
    medication: MedicationWithIndication,
    relationships: ClinicalRelationship[],
    allConditions: ConditionWithDetails[]
  ): EnrichedArtifact {
    // Find relationships where this medication is the source
    const medicationRelationships = relationships.filter(
      (r) => r.source_artifact_id === medication.id && r.relationship_type === 'medication_indication'
    );

    // Get related conditions
    const relatedConditions = medicationRelationships
      .map((r) => allConditions.find((c) => c.id === r.target_artifact_id))
      .filter((c): c is ConditionWithDetails => c !== undefined);

    // Build original text
    const originalText = this.buildMedicationOriginalText(medication);

    // Build enriched text
    const enrichedText = this.buildMedicationEnrichedText(medication, relatedConditions);

    // Build structured extractions
    const extracted_entities = {
      medication: {
        name: medication.name,
        dosage: medication.dosage,
        frequency: medication.frequency,
        route: medication.route,
      },
      indication: medication.indication,
      indication_code: medication.indication_code,
      related_conditions: relatedConditions.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        status: c.status,
      })),
    };

    // Build clinical context
    const clinical_context = {
      prescriber: medication.prescriber,
      prescribed_date: medication.prescribed_at,
      indication_text: medication.indication,
      reason: medication.reason,
      active_conditions: relatedConditions.filter((c) => c.status === 'active').length,
    };

    // Calculate quality scores
    const completeness_score = this.calculateMedicationCompletenessScore(medication);
    const context_depth_score = this.calculateContextDepthScore(
      medicationRelationships.length,
      relatedConditions.length
    );

    const now = new Date().toISOString();

    return {
      artifact_id: medication.id,
      patient_id: medication.patient_id,
      artifact_type: 'medication',
      occurred_at: medication.prescribed_at,

      original_text: originalText,
      enriched_text: enrichedText,

      extracted_entities,
      clinical_context,

      related_artifact_ids: relatedConditions.map((c) => c.id),
      relationship_summary: this.buildRelationshipSummary(medicationRelationships),

      enrichment_version: '1.0.0',
      enriched_at: now,
      enrichment_method: 'hybrid',

      completeness_score,
      context_depth_score,

      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Enrich a condition artifact
   *
   * Adds:
   * - Related medications (treatments)
   * - Related care plans
   * - Clinical status and severity
   * - Management context
   */
  enrichCondition(
    condition: ConditionWithDetails,
    relationships: ClinicalRelationship[],
    allMedications: MedicationWithIndication[],
    allCarePlans: CarePlanWithGoals[]
  ): EnrichedArtifact {
    // Find relationships where this condition is the target
    const conditionRelationships = relationships.filter(
      (r) => r.target_artifact_id === condition.id
    );

    // Get related medications (treatments for this condition)
    const relatedMedications = conditionRelationships
      .filter((r) => r.relationship_type === 'medication_indication')
      .map((r) => allMedications.find((m) => m.id === r.source_artifact_id))
      .filter((m): m is MedicationWithIndication => m !== undefined);

    // Get related care plans
    const relatedCarePlans = conditionRelationships
      .filter((r) => r.relationship_type === 'care_plan_condition')
      .map((r) => allCarePlans.find((p) => p.id === r.source_artifact_id))
      .filter((p): p is CarePlanWithGoals => p !== undefined);

    // Build original text
    const originalText = this.buildConditionOriginalText(condition);

    // Build enriched text
    const enrichedText = this.buildConditionEnrichedText(
      condition,
      relatedMedications,
      relatedCarePlans
    );

    // Build structured extractions
    const extracted_entities = {
      condition: {
        name: condition.name,
        code: condition.code,
        code_system: condition.code_system,
        status: condition.status,
        severity: condition.severity,
      },
      related_medications: relatedMedications.map((m) => ({
        id: m.id,
        name: m.name,
        dosage: m.dosage,
      })),
      related_care_plans: relatedCarePlans.map((p) => ({
        id: p.id,
        title: p.title,
      })),
    };

    // Build clinical context
    const clinical_context = {
      onset_date: condition.onset_date,
      diagnosis_date: condition.diagnosis_date,
      status: condition.status,
      severity: condition.severity,
      treatment_count: relatedMedications.length,
      has_care_plan: relatedCarePlans.length > 0,
    };

    // Calculate quality scores
    const completeness_score = this.calculateConditionCompletenessScore(condition);
    const context_depth_score = this.calculateContextDepthScore(
      conditionRelationships.length,
      relatedMedications.length + relatedCarePlans.length
    );

    const now = new Date().toISOString();

    return {
      artifact_id: condition.id,
      patient_id: condition.patient_id,
      artifact_type: 'condition',
      occurred_at: condition.diagnosis_date || condition.onset_date || now,

      original_text: originalText,
      enriched_text: enrichedText,

      extracted_entities,
      clinical_context,

      related_artifact_ids: [
        ...relatedMedications.map((m) => m.id),
        ...relatedCarePlans.map((p) => p.id),
      ],
      relationship_summary: this.buildRelationshipSummary(conditionRelationships),

      enrichment_version: '1.0.0',
      enriched_at: now,
      enrichment_method: 'hybrid',

      completeness_score,
      context_depth_score,

      created_at: now,
      updated_at: now,
    };
  }

  /**
   * Enrich a care plan artifact
   */
  enrichCarePlan(
    carePlan: CarePlanWithGoals,
    relationships: ClinicalRelationship[],
    allConditions: ConditionWithDetails[]
  ): EnrichedArtifact {
    // Find relationships where this care plan is the source
    const carePlanRelationships = relationships.filter(
      (r) => r.source_artifact_id === carePlan.id && r.relationship_type === 'care_plan_condition'
    );

    // Get related conditions
    const relatedConditions = carePlanRelationships
      .map((r) => allConditions.find((c) => c.id === r.target_artifact_id))
      .filter((c): c is ConditionWithDetails => c !== undefined);

    // Build original text
    const originalText = this.buildCarePlanOriginalText(carePlan);

    // Build enriched text
    const enrichedText = this.buildCarePlanEnrichedText(carePlan, relatedConditions);

    // Build structured extractions
    const extracted_entities = {
      care_plan: {
        title: carePlan.title,
        goals: carePlan.goals,
        interventions: carePlan.interventions,
      },
      related_conditions: relatedConditions.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
      })),
    };

    // Build clinical context
    const clinical_context = {
      created_date: carePlan.created_at,
      goals_count: carePlan.goals?.length || 0,
      interventions_count: carePlan.interventions?.length || 0,
      rationale: carePlan.rationale,
    };

    // Calculate quality scores
    const completeness_score = this.calculateCarePlanCompletenessScore(carePlan);
    const context_depth_score = this.calculateContextDepthScore(
      carePlanRelationships.length,
      relatedConditions.length
    );

    const now = new Date().toISOString();

    return {
      artifact_id: carePlan.id,
      patient_id: carePlan.patient_id,
      artifact_type: 'care_plan',
      occurred_at: carePlan.created_at,

      original_text: originalText,
      enriched_text: enrichedText,

      extracted_entities,
      clinical_context,

      related_artifact_ids: relatedConditions.map((c) => c.id),
      relationship_summary: this.buildRelationshipSummary(carePlanRelationships),

      enrichment_version: '1.0.0',
      enriched_at: now,
      enrichment_method: 'hybrid',

      completeness_score,
      context_depth_score,

      created_at: now,
      updated_at: now,
    };
  }

  // ============================================================================
  // TEXT BUILDING METHODS
  // ============================================================================

  private buildMedicationOriginalText(medication: MedicationWithIndication): string {
    return `Medication: ${medication.name}${medication.dosage ? ` ${medication.dosage}` : ''}${
      medication.frequency ? ` ${medication.frequency}` : ''
    }${medication.route ? ` (${medication.route})` : ''}`;
  }

  private buildMedicationEnrichedText(
    medication: MedicationWithIndication,
    relatedConditions: ConditionWithDetails[]
  ): string {
    const parts: string[] = [];

    // Base medication info
    parts.push(
      `Medication: ${medication.name}${medication.dosage ? ` ${medication.dosage}` : ''}${
        medication.frequency ? ` ${medication.frequency}` : ''
      }${medication.route ? ` (${medication.route})` : ''}.`
    );

    // Indication
    if (medication.indication) {
      parts.push(
        `Indication: ${medication.indication}${
          medication.indication_code ? ` (${medication.indication_code})` : ''
        }.`
      );
    }

    // Reason/Rationale
    if (medication.reason && medication.reason !== medication.indication) {
      parts.push(`Prescribed for ${medication.reason}.`);
    }

    // Related conditions
    if (relatedConditions.length > 0) {
      const conditionList = relatedConditions
        .map((c) => `${c.name}${c.status ? ` (${c.status})` : ''}`)
        .join(', ');
      parts.push(`Related Conditions: ${conditionList}.`);
    }

    // Prescriber
    if (medication.prescriber) {
      parts.push(`Prescribed by: ${medication.prescriber}.`);
    }

    // Prescribed date
    if (medication.prescribed_at) {
      const date = new Date(medication.prescribed_at).toLocaleDateString();
      parts.push(`Prescribed on: ${date}.`);
    }

    return parts.join(' ');
  }

  private buildConditionOriginalText(condition: ConditionWithDetails): string {
    return `Condition: ${condition.name}${condition.code ? ` (${condition.code})` : ''}${
      condition.status ? `, Status: ${condition.status}` : ''
    }`;
  }

  private buildConditionEnrichedText(
    condition: ConditionWithDetails,
    relatedMedications: MedicationWithIndication[],
    relatedCarePlans: CarePlanWithGoals[]
  ): string {
    const parts: string[] = [];

    // Base condition info
    parts.push(
      `Condition: ${condition.name}${condition.code ? ` (${condition.code})` : ''}.`
    );

    // Status and severity
    if (condition.status || condition.severity) {
      const statusText = [
        condition.status ? `Status: ${condition.status}` : '',
        condition.severity ? `Severity: ${condition.severity}` : '',
      ]
        .filter(Boolean)
        .join(', ');
      parts.push(statusText + '.');
    }

    // Diagnosis date
    if (condition.diagnosis_date) {
      const date = new Date(condition.diagnosis_date).toLocaleDateString();
      parts.push(`Diagnosed on: ${date}.`);
    }

    // Related medications (treatments)
    if (relatedMedications.length > 0) {
      const medList = relatedMedications
        .map((m) => `${m.name}${m.dosage ? ` ${m.dosage}` : ''}`)
        .join(', ');
      parts.push(`Current Treatments: ${medList}.`);
    }

    // Care plans
    if (relatedCarePlans.length > 0) {
      parts.push(`Active care plan with ${relatedCarePlans[0].goals?.length || 0} goals.`);
    }

    // Clinical notes
    if (condition.clinical_notes) {
      parts.push(`Notes: ${condition.clinical_notes}`);
    }

    return parts.join(' ');
  }

  private buildCarePlanOriginalText(carePlan: CarePlanWithGoals): string {
    return `Care Plan: ${carePlan.title || 'Untitled'}${
      carePlan.description ? ` - ${carePlan.description.substring(0, 100)}` : ''
    }`;
  }

  private buildCarePlanEnrichedText(
    carePlan: CarePlanWithGoals,
    relatedConditions: ConditionWithDetails[]
  ): string {
    const parts: string[] = [];

    // Title
    parts.push(`Care Plan: ${carePlan.title || 'Patient Care Plan'}.`);

    // Related conditions
    if (relatedConditions.length > 0) {
      const conditionList = relatedConditions.map((c) => c.name).join(', ');
      parts.push(`Addresses: ${conditionList}.`);
    }

    // Goals
    if (carePlan.goals && carePlan.goals.length > 0) {
      parts.push(`Goals (${carePlan.goals.length}):`);
      carePlan.goals.forEach((goal, i) => {
        parts.push(`${i + 1}. ${goal.description}`);
      });
    }

    // Interventions
    if (carePlan.interventions && carePlan.interventions.length > 0) {
      parts.push(`Interventions (${carePlan.interventions.length}):`);
      carePlan.interventions.forEach((intervention, i) => {
        parts.push(`${i + 1}. ${intervention.description}`);
      });
    }

    // Rationale
    if (carePlan.rationale) {
      parts.push(`Rationale: ${carePlan.rationale}`);
    }

    return parts.join(' ');
  }

  // ============================================================================
  // QUALITY SCORING METHODS
  // ============================================================================

  /**
   * Calculate completeness score for medication (0.0-1.0)
   *
   * Checks presence of:
   * - Name (required)
   * - Dosage (+0.2)
   * - Frequency (+0.2)
   * - Route (+0.1)
   * - Indication (+0.3)
   * - Prescriber (+0.1)
   * - Date (+0.1)
   */
  calculateMedicationCompletenessScore(medication: MedicationWithIndication): number {
    let score = 0.0;

    if (medication.name) score += 0.0; // Required, no points
    if (medication.dosage) score += 0.2;
    if (medication.frequency) score += 0.2;
    if (medication.route) score += 0.1;
    if (medication.indication || medication.indication_code) score += 0.3;
    if (medication.prescriber) score += 0.1;
    if (medication.prescribed_at) score += 0.1;

    return Math.min(1.0, score);
  }

  /**
   * Calculate completeness score for condition (0.0-1.0)
   */
  calculateConditionCompletenessScore(condition: ConditionWithDetails): number {
    let score = 0.0;

    if (condition.name) score += 0.0; // Required
    if (condition.code) score += 0.3;
    if (condition.status) score += 0.2;
    if (condition.severity) score += 0.1;
    if (condition.diagnosis_date || condition.onset_date) score += 0.2;
    if (condition.clinical_notes) score += 0.2;

    return Math.min(1.0, score);
  }

  /**
   * Calculate completeness score for care plan (0.0-1.0)
   */
  calculateCarePlanCompletenessScore(carePlan: CarePlanWithGoals): number {
    let score = 0.0;

    if (carePlan.title) score += 0.2;
    if (carePlan.description) score += 0.2;
    if (carePlan.goals && carePlan.goals.length > 0) score += 0.3;
    if (carePlan.interventions && carePlan.interventions.length > 0) score += 0.2;
    if (carePlan.rationale) score += 0.1;

    return Math.min(1.0, score);
  }

  /**
   * Calculate context depth score (0.0-1.0)
   *
   * Based on number of relationships and related entities
   * - 0 relationships = 0.0
   * - 1 relationship = 0.5
   * - 2+ relationships = 0.7
   * - 3+ relationships = 0.9
   * - 5+ relationships = 1.0
   */
  calculateContextDepthScore(relationshipCount: number, relatedEntityCount: number): number {
    if (relationshipCount === 0 && relatedEntityCount === 0) return 0.0;
    if (relationshipCount === 1 || relatedEntityCount === 1) return 0.5;
    if (relationshipCount === 2 || relatedEntityCount === 2) return 0.7;
    if (relationshipCount >= 3 || relatedEntityCount >= 3) return 0.9;
    if (relationshipCount >= 5 || relatedEntityCount >= 5) return 1.0;

    return 0.5;
  }

  /**
   * Build relationship summary text
   */
  private buildRelationshipSummary(relationships: ClinicalRelationship[]): string {
    if (relationships.length === 0) return 'No explicit relationships found.';

    const byType: Record<string, number> = {};
    relationships.forEach((r) => {
      byType[r.relationship_type] = (byType[r.relationship_type] || 0) + 1;
    });

    const summary = Object.entries(byType)
      .map(([type, count]) => `${count} ${type.replace(/_/g, ' ')}`)
      .join(', ');

    return `${relationships.length} relationship(s): ${summary}`;
  }
}

export const artifactEnricherService = new ArtifactEnricherService();
export default artifactEnricherService;
