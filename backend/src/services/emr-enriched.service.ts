/**
 * EMR Enriched Service
 *
 * Extends EMRService to fetch medications WITH indications, conditions WITH details,
 * and care plans WITH goals from the Avon Health API.
 *
 * Key differences from base EMRService:
 * - Extracts indications from medication notes/fields
 * - Enriches conditions with severity, status, clinical context
 * - Parses care plan goals and interventions from description fields
 */

import emrService from './emr.service';
import {
  MedicationWithIndication,
  ConditionWithDetails,
  CarePlanWithGoals,
} from '../types/enrichment.types';

class EMREnrichedService {
  /**
   * Fetch medications WITH indication extraction
   *
   * Extracts indication from:
   * 1. Direct API fields (indication, reason, indication_code)
   * 2. Notes/description fields (pattern matching)
   * 3. Related condition IDs (if available)
   */
  async fetchMedicationsWithIndication(
    patientId: string
  ): Promise<MedicationWithIndication[]> {
    const startTime = Date.now();

    try {
      console.log(`[EMR Enriched] Fetching medications with indications for ${patientId}`);

      // Fetch base medication data
      const medicationResult = await emrService.fetchMedications(patientId);
      const medications = medicationResult.data;

      // Transform to enriched format
      const enrichedMedications: MedicationWithIndication[] = medications.map((med: any) => {
        // Extract indication from various fields
        const indication = this.extractIndicationFromMedication(med);

        return {
          id: med.id,
          patient_id: med.patient_id || patientId,
          name: med.name || med.medication_name || 'Unknown',
          dosage: med.dosage || med.dose || med.strength,
          frequency: med.frequency || med.schedule,
          route: med.route || med.administration_route,
          prescribed_at: med.prescribed_at || med.start_date || med.created_at,
          prescriber: med.prescriber || med.prescribing_provider || med.provider,

          // NEW: Indication fields
          indication: indication.indication,
          indication_code: indication.code,
          indication_code_system: indication.codeSystem,
          reason: indication.reason,

          // Related condition IDs (if API provides them)
          related_condition_ids: med.related_condition_ids || med.condition_ids || [],

          // Preserve all original fields
          ...med,
        };
      });

      const duration = Date.now() - startTime;
      console.log(
        `[EMR Enriched] ✓ Enriched ${enrichedMedications.length} medications (${duration}ms)`
      );

      return enrichedMedications;
    } catch (error) {
      console.error(`[EMR Enriched] Failed to fetch medications with indications:`, error);
      throw error;
    }
  }

  /**
   * Fetch conditions WITH clinical details
   *
   * Enriches conditions with:
   * - Status (active, resolved, etc.)
   * - Severity
   * - Clinical notes
   * - Related medication IDs
   */
  async fetchConditionsWithDetails(patientId: string): Promise<ConditionWithDetails[]> {
    const startTime = Date.now();

    try {
      console.log(`[EMR Enriched] Fetching conditions with details for ${patientId}`);

      // Fetch base condition data
      const conditionResult = await emrService.fetchConditions(patientId);
      const conditions = conditionResult.data;

      // Transform to enriched format
      const enrichedConditions: ConditionWithDetails[] = conditions.map((cond: any) => {
        return {
          id: cond.id,
          patient_id: cond.patient_id || patientId,
          name: cond.name || cond.condition_name || cond.diagnosis || 'Unknown Condition',
          code: cond.code || cond.icd10_code || cond.diagnosis_code,
          code_system: cond.code_system || (cond.code ? 'ICD10' : undefined),
          status: cond.status || cond.clinical_status || this.inferStatus(cond),
          severity: cond.severity || this.inferSeverity(cond),
          onset_date: cond.onset_date || cond.start_date,
          diagnosis_date: cond.diagnosis_date || cond.recorded_date || cond.created_at,
          clinical_notes: cond.clinical_notes || cond.notes || cond.description,

          // Related medication IDs (if available)
          related_medication_ids: cond.related_medication_ids || cond.medication_ids || [],

          // Preserve all original fields
          ...cond,
        };
      });

      const duration = Date.now() - startTime;
      console.log(`[EMR Enriched] ✓ Enriched ${enrichedConditions.length} conditions (${duration}ms)`);

      return enrichedConditions;
    } catch (error) {
      console.error(`[EMR Enriched] Failed to fetch conditions with details:`, error);
      throw error;
    }
  }

  /**
   * Fetch care plans WITH goals and interventions
   *
   * Parses care plan description to extract:
   * - Goals (target outcomes)
   * - Interventions (actions to achieve goals)
   * - Rationale (clinical reasoning)
   */
  async fetchCarePlansWithGoals(patientId: string): Promise<CarePlanWithGoals[]> {
    const startTime = Date.now();

    try {
      console.log(`[EMR Enriched] Fetching care plans with goals for ${patientId}`);

      // Fetch base care plan data
      const carePlanResult = await emrService.fetchCarePlans(patientId);
      const carePlans = carePlanResult.data;

      // Transform to enriched format
      const enrichedCarePlans: CarePlanWithGoals[] = carePlans.map((plan: any) => {
        // Extract goals and interventions from description
        const goals = this.extractGoals(plan);
        const interventions = this.extractInterventions(plan);

        return {
          id: plan.id,
          patient_id: plan.patient_id || patientId,
          title: plan.title || plan.name || 'Care Plan',
          description: plan.description || plan.notes,
          created_at: plan.created_at || plan.start_date,

          // NEW: Parsed goals and interventions
          goals,
          interventions,
          rationale: plan.rationale || this.extractRationale(plan),

          // Related condition IDs
          related_condition_ids: plan.related_condition_ids || plan.condition_ids || [],

          // Preserve all original fields
          ...plan,
        };
      });

      const duration = Date.now() - startTime;
      console.log(`[EMR Enriched] ✓ Enriched ${enrichedCarePlans.length} care plans (${duration}ms)`);

      return enrichedCarePlans;
    } catch (error) {
      console.error(`[EMR Enriched] Failed to fetch care plans with goals:`, error);
      throw error;
    }
  }

  /**
   * Fetch ALL enriched data for a patient
   *
   * Convenience method to fetch medications, conditions, and care plans with enrichment
   */
  async fetchAllEnriched(patientId: string): Promise<{
    medications: MedicationWithIndication[];
    conditions: ConditionWithDetails[];
    carePlans: CarePlanWithGoals[];
  }> {
    const startTime = Date.now();

    console.log(`[EMR Enriched] Fetching all enriched data for ${patientId}`);

    try {
      // Fetch all in parallel
      const [medications, conditions, carePlans] = await Promise.all([
        this.fetchMedicationsWithIndication(patientId),
        this.fetchConditionsWithDetails(patientId),
        this.fetchCarePlansWithGoals(patientId),
      ]);

      const duration = Date.now() - startTime;
      console.log(
        `[EMR Enriched] ✓ Fetched all enriched data for ${patientId} (${medications.length} meds, ${conditions.length} conditions, ${carePlans.length} plans, ${duration}ms)`
      );

      return {
        medications,
        conditions,
        carePlans,
      };
    } catch (error) {
      console.error(`[EMR Enriched] Failed to fetch all enriched data:`, error);
      throw error;
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Extract indication from medication fields or notes
   *
   * Strategy:
   * 1. Check direct fields (indication, reason, indication_code)
   * 2. Pattern match in notes/description for "for <condition>" or "indication: <condition>"
   * 3. Extract ICD-10 codes if present
   */
  private extractIndicationFromMedication(med: any): {
    indication?: string;
    code?: string;
    codeSystem?: string;
    reason?: string;
  } {
    // 1. Direct fields
    if (med.indication || med.reason) {
      return {
        indication: med.indication,
        code: med.indication_code || med.icd10_code,
        codeSystem: med.indication_code_system || (med.indication_code ? 'ICD10' : undefined),
        reason: med.reason || med.clinical_reason,
      };
    }

    // 2. Pattern matching in notes/description
    const text = [
      med.notes,
      med.description,
      med.clinical_notes,
      med.prescriber_notes,
      med.instructions,
    ]
      .filter(Boolean)
      .join(' ');

    if (text) {
      // Pattern: "for <condition>" or "indication: <condition>"
      const indicationMatch = text.match(
        /(?:for|indication:|prescribed for|treating)\s+([A-Z][a-zA-Z\s]+?)(?:\.|,|;|$|\()/i
      );
      if (indicationMatch) {
        const indication = indicationMatch[1].trim();

        // Try to extract ICD-10 code (format: E78.5, I10, etc.)
        const codeMatch = text.match(/\b([A-Z]\d{2}(?:\.\d{1,2})?)\b/);

        return {
          indication,
          code: codeMatch ? codeMatch[1] : undefined,
          codeSystem: codeMatch ? 'ICD10' : undefined,
          reason: indication,
        };
      }
    }

    // 3. No indication found
    return {};
  }

  /**
   * Extract goals from care plan description
   *
   * Pattern: "Goal: <goal text>" or "- <goal text>" or numbered goals
   */
  private extractGoals(plan: any): Array<{
    description: string;
    target_date?: string;
    achievement_status?: string;
  }> {
    const text = plan.description || plan.notes || plan.goals_text || '';

    if (!text) return [];

    // Pattern: "Goal:", "Goals:", "Objectives:", or bullet points with goal keywords
    const goalPattern =
      /(?:^|\n)\s*(?:Goal|Objective|Target|Aim)s?[:\s]+([^\n]+)|(?:^|\n)\s*[-*•]\s*(.+?(?:improve|reduce|achieve|maintain|manage|control|prevent)[^\n]*)/gi;

    const goals: Array<{
      description: string;
      target_date?: string;
      achievement_status?: string;
    }> = [];
    let match;

    while ((match = goalPattern.exec(text)) !== null) {
      const description = (match[1] || match[2])?.trim();
      if (description && description.length > 5) {
        goals.push({
          description,
          target_date: this.extractDate(description),
          achievement_status: this.extractAchievementStatus(description),
        });
      }
    }

    return goals;
  }

  /**
   * Extract interventions from care plan description
   *
   * Pattern: "Intervention:", medication names, therapy types
   */
  private extractInterventions(plan: any): Array<{
    description: string;
    type?: string;
  }> {
    const text = plan.description || plan.notes || plan.interventions_text || '';

    if (!text) return [];

    // Pattern: "Intervention:", "Action:", "Treatment:", or bullet points
    const interventionPattern =
      /(?:^|\n)\s*(?:Intervention|Action|Treatment|Therapy|Plan)s?[:\s]+([^\n]+)|(?:^|\n)\s*[-*•]\s*(.+?(?:prescribe|administer|provide|refer|monitor|educate|counsel)[^\n]*)/gi;

    const interventions: Array<{
      description: string;
      type?: string;
    }> = [];
    let match;

    while ((match = interventionPattern.exec(text)) !== null) {
      const description = (match[1] || match[2])?.trim();
      if (description && description.length > 5) {
        interventions.push({
          description,
          type: this.inferInterventionType(description),
        });
      }
    }

    return interventions;
  }

  /**
   * Extract rationale from care plan
   */
  private extractRationale(plan: any): string | undefined {
    const text = plan.description || plan.notes || '';

    // Pattern: "Rationale:", "Reason:", "Because:", etc.
    const rationaleMatch = text.match(/(?:Rationale|Reason|Because)[:\s]+([^\n]+)/i);

    return rationaleMatch ? rationaleMatch[1].trim() : undefined;
  }

  /**
   * Infer condition status from available data
   */
  private inferStatus(cond: any): string {
    // Check for explicit status indicators
    if (cond.resolved || cond.resolved_at || cond.end_date) return 'resolved';
    if (cond.inactive) return 'inactive';
    if (cond.historical) return 'historical';

    // Default to active if recently diagnosed (within last year)
    if (cond.diagnosis_date || cond.created_at) {
      const diagnosisDate = new Date(cond.diagnosis_date || cond.created_at);
      const now = new Date();
      const daysSince = (now.getTime() - diagnosisDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince > 365) return 'historical';
    }

    return 'active';
  }

  /**
   * Infer severity from condition data
   */
  private inferSeverity(cond: any): string | undefined {
    const text = [cond.name, cond.notes, cond.description].filter(Boolean).join(' ').toLowerCase();

    if (text.includes('severe') || text.includes('critical') || text.includes('acute'))
      return 'severe';
    if (text.includes('moderate')) return 'moderate';
    if (text.includes('mild') || text.includes('minor')) return 'mild';

    return undefined;
  }

  /**
   * Extract date from text (format: "by MM/DD/YYYY" or "within N months")
   */
  private extractDate(text: string): string | undefined {
    const dateMatch = text.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/);
    return dateMatch ? dateMatch[1] : undefined;
  }

  /**
   * Extract achievement status from goal text
   */
  private extractAchievementStatus(text: string): string | undefined {
    const lower = text.toLowerCase();
    if (lower.includes('achieved') || lower.includes('met')) return 'achieved';
    if (lower.includes('in progress') || lower.includes('ongoing')) return 'in_progress';
    if (lower.includes('not met') || lower.includes('failed')) return 'not_achieved';

    return undefined;
  }

  /**
   * Infer intervention type from description
   */
  private inferInterventionType(description: string): string {
    const lower = description.toLowerCase();

    if (lower.includes('prescribe') || lower.includes('medication')) return 'medication';
    if (lower.includes('therapy') || lower.includes('counseling')) return 'therapy';
    if (lower.includes('refer') || lower.includes('referral')) return 'referral';
    if (lower.includes('educate') || lower.includes('education')) return 'education';
    if (lower.includes('monitor') || lower.includes('follow-up')) return 'monitoring';

    return 'other';
  }
}

export const emrEnrichedService = new EMREnrichedService();
export default emrEnrichedService;
