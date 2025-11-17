import config from '../config/env.config';
import {
  Artifact,
  ArtifactType,
  NormalizationResult,
} from '../types/artifact.types';
import artifactValidator, { ValidationResult } from './validation.service';

class NormalizationService {
  /**
   * Normalize a care plan from raw API data
   */
  normalizeCarePlan(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'care_plan',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['created_at', 'updated_at', 'date']),
      title: this.extractTitle(rawData),
      text: this.extractText(rawData, [
        'description',
        'content',
        'text',
        'plan',
        'summary',
      ]),
      source: this.constructSourceUrl('care_plans', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'created_at', 'updated_at']),
    };

    return artifact;
  }

  /**
   * Normalize a medication from raw API data
   */
  normalizeMedication(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'medication',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData, ['prescriber', 'prescribed_by', 'doctor']),
      occurred_at: this.extractDate(rawData, [
        'prescribed_at',
        'start_date',
        'created_at',
        'date',
      ]),
      title: this.extractMedicationTitle(rawData),
      text: this.extractMedicationText(rawData),
      source: this.constructSourceUrl('medications', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'prescribed_at']),
    };

    return artifact;
  }

  /**
   * Normalize a clinical note from raw API data
   */
  normalizeNote(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'note',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['created_at', 'note_date', 'date', 'timestamp']),
      title: this.extractTitle(rawData, ['title', 'subject', 'note_type']),
      text: this.extractText(rawData, ['content', 'text', 'body', 'note']),
      source: this.constructSourceUrl('notes', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'created_at']),
    };

    return artifact;
  }

  /**
   * Normalize a clinical document from raw API data
   */
  normalizeDocument(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'document',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['created_at', 'document_date', 'date']),
      title: this.extractTitle(rawData, ['title', 'document_type', 'type', 'name']),
      text: this.extractText(rawData, ['content', 'text', 'body', 'document_text']),
      source: this.constructSourceUrl('documents', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'created_at']),
    };

    return artifact;
  }

  /**
   * Normalize a condition/diagnosis from raw API data
   */
  normalizeCondition(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'condition',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData, ['diagnosing_provider', 'provider', 'author']),
      occurred_at: this.extractDate(rawData, ['onset_date', 'diagnosis_date', 'created_at']),
      title: this.extractConditionTitle(rawData),
      text: this.extractConditionText(rawData),
      source: this.constructSourceUrl('conditions', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'onset_date']),
    };

    return artifact;
  }

  /**
   * Normalize an allergy from raw API data
   */
  normalizeAllergy(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'allergy',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['onset_date', 'created_at', 'recorded_at']),
      title: this.extractAllergyTitle(rawData),
      text: this.extractAllergyText(rawData),
      source: this.constructSourceUrl('allergies', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'onset_date']),
    };

    return artifact;
  }

  normalizeFormResponse(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'form_response',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['submitted_at', 'created_at', 'date']),
      title: this.extractTitle(rawData, ['form_name', 'title', 'name', 'form_title']),
      text: this.extractText(rawData, ['response_text', 'responses', 'text', 'content', 'body']),
      source: this.constructSourceUrl('form_responses', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'submitted_at']),
    };

    return artifact;
  }

  normalizeMessage(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'message',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['sent_at', 'created_at', 'date', 'timestamp']),
      title: this.extractTitle(rawData, ['subject', 'title', 'topic']),
      text: this.extractText(rawData, ['message', 'body', 'content', 'text']),
      source: this.constructSourceUrl('messages', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'sent_at']),
    };

    return artifact;
  }

  normalizeLabObservation(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'lab_observation',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['observed_at', 'created_at', 'date', 'result_date']),
      title: this.extractTitle(rawData, ['test_name', 'observation_name', 'title', 'name']),
      text: this.extractText(rawData, ['result', 'value', 'observation', 'text', 'content']),
      source: this.constructSourceUrl('lab_observations', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'observed_at']),
    };

    return artifact;
  }

  normalizeVital(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'vital',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['measured_at', 'created_at', 'date', 'timestamp']),
      title: this.extractTitle(rawData, ['vital_type', 'name', 'title', 'type']),
      text: this.extractText(rawData, ['value', 'measurement', 'result', 'text', 'content']),
      source: this.constructSourceUrl('vitals', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'measured_at']),
    };

    return artifact;
  }

  /**
   * Normalize appointment data
   */
  normalizeAppointment(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'appointment',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['appointment_date', 'scheduled_at', 'created_at', 'date']),
      title: this.extractTitle(rawData, ['reason', 'appointment_type', 'title', 'name', 'type']),
      text: this.extractText(rawData, ['notes', 'description', 'text', 'content', 'reason']),
      source: this.constructSourceUrl('appointments', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'appointment_date']),
    };

    return artifact;
  }

  /**
   * Normalize superbill data
   */
  normalizeSuperbill(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'superbill',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['service_date', 'created_at', 'date', 'billed_at']),
      title: this.extractTitle(rawData, ['billing_code', 'procedure_code', 'title', 'name']),
      text: this.extractText(rawData, ['description', 'diagnosis', 'text', 'content', 'notes']),
      source: this.constructSourceUrl('superbills', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'service_date']),
    };

    return artifact;
  }

  /**
   * Normalize insurance policy data
   */
  normalizeInsurancePolicy(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'insurance_policy',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['effective_date', 'created_at', 'date', 'start_date']),
      title: this.extractTitle(rawData, ['policy_number', 'payer_name', 'title', 'name', 'carrier']),
      text: this.extractText(rawData, ['coverage_details', 'description', 'text', 'content', 'notes']),
      source: this.constructSourceUrl('insurance_policies', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'effective_date']),
    };

    return artifact;
  }

  /**
   * Normalize task data
   */
  normalizeTask(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'task',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['due_date', 'created_at', 'date', 'assigned_at']),
      title: this.extractTitle(rawData, ['task_title', 'title', 'name', 'description']),
      text: this.extractText(rawData, ['description', 'instructions', 'text', 'content', 'notes']),
      source: this.constructSourceUrl('tasks', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'due_date']),
    };

    return artifact;
  }

  /**
   * Normalize family history data
   */
  normalizeFamilyHistory(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'family_history',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['recorded_at', 'created_at', 'date']),
      title: this.extractTitle(rawData, ['condition', 'diagnosis', 'title', 'name', 'relationship']),
      text: this.extractText(rawData, ['details', 'description', 'text', 'content', 'notes']),
      source: this.constructSourceUrl('family_histories', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'recorded_at']),
    };

    return artifact;
  }

  /**
   * Normalize intake flow data
   */
  normalizeIntakeFlow(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'intake_flow',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['created_at', 'updated_at', 'date']),
      title: this.extractTitle(rawData, ['name', 'title', 'flow_name', 'description']),
      text: this.extractText(rawData, ['description', 'details', 'text', 'content', 'notes']),
      source: this.constructSourceUrl('intake_flows', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'created_at']),
    };

    return artifact;
  }

  /**
   * Normalize form data
   */
  normalizeForm(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'form',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['created_at', 'updated_at', 'date']),
      title: this.extractTitle(rawData, ['name', 'title', 'form_name', 'form_title']),
      text: this.extractText(rawData, ['description', 'details', 'text', 'content', 'questions']),
      source: this.constructSourceUrl('forms', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'created_at']),
    };

    return artifact;
  }

  /**
   * Normalize any artifact with validation
   */
  normalize(rawData: any, type: ArtifactType): NormalizationResult {
    let artifact: Artifact;

    switch (type) {
      // Tier 1
      case 'note':
        artifact = this.normalizeNote(rawData);
        break;
      case 'document':
        artifact = this.normalizeDocument(rawData);
        break;
      case 'medication':
        artifact = this.normalizeMedication(rawData);
        break;
      case 'condition':
        artifact = this.normalizeCondition(rawData);
        break;
      case 'allergy':
        artifact = this.normalizeAllergy(rawData);
        break;
      case 'care_plan':
        artifact = this.normalizeCarePlan(rawData);
        break;
      // Tier 2
      case 'form_response':
        artifact = this.normalizeFormResponse(rawData);
        break;
      case 'message':
        artifact = this.normalizeMessage(rawData);
        break;
      case 'lab_observation':
        artifact = this.normalizeLabObservation(rawData);
        break;
      case 'vital':
        artifact = this.normalizeVital(rawData);
        break;
      // Tier 3
      case 'appointment':
        artifact = this.normalizeAppointment(rawData);
        break;
      case 'superbill':
        artifact = this.normalizeSuperbill(rawData);
        break;
      case 'insurance_policy':
        artifact = this.normalizeInsurancePolicy(rawData);
        break;
      case 'task':
        artifact = this.normalizeTask(rawData);
        break;
      case 'family_history':
        artifact = this.normalizeFamilyHistory(rawData);
        break;
      // Tier 4
      case 'intake_flow':
        artifact = this.normalizeIntakeFlow(rawData);
        break;
      case 'form':
        artifact = this.normalizeForm(rawData);
        break;
      default:
        throw new Error(`Unknown artifact type: ${type}`);
    }

    const validation = this.validateArtifact(artifact);

    return {
      artifact,
      validation,
    };
  }

  /**
   * Normalize a batch of artifacts
   */
  normalizeBatch(rawDataArray: any[], type: ArtifactType): Artifact[] {
    return rawDataArray
      .map((rawData) => {
        try {
          const result = this.normalize(rawData, type);
          if (!result.validation.valid) {
            console.warn(
              `[Normalization] Artifact ${result.artifact.id} has validation errors:`,
              result.validation.errors
            );
          }
          return result.artifact;
        } catch (error) {
          console.error('[Normalization] Failed to normalize artifact:', error);
          return null;
        }
      })
      .filter((artifact): artifact is Artifact => artifact !== null);
  }

  /**
   * Extract ID from raw data
   */
  private extractId(rawData: any): string {
    return String(rawData.id || rawData._id || rawData.artifact_id || 'unknown');
  }

  /**
   * Extract patient ID from raw data
   */
  private extractPatientId(rawData: any): string {
    return String(rawData.patient_id || rawData.patientId || rawData.patient || '');
  }

  /**
   * Extract author from raw data
   */
  private extractAuthor(rawData: any, fields: string[] = ['author', 'created_by']): string | undefined {
    for (const field of fields) {
      if (rawData[field]) {
        const author = rawData[field];
        if (typeof author === 'string') {
          return author;
        } else if (typeof author === 'object' && author.name) {
          return author.name;
        }
      }
    }
    return undefined;
  }

  /**
   * Extract and normalize date to ISO 8601
   */
  private extractDate(rawData: any, fields: string[]): string {
    for (const field of fields) {
      if (rawData[field]) {
        const normalized = this.normalizeDate(rawData[field]);
        if (normalized) {
          return normalized;
        }
      }
    }

    // Default to current timestamp if no date found
    console.warn('[Normalization] No date found, using current timestamp');
    return new Date().toISOString();
  }

  /**
   * Normalize various date formats to ISO 8601
   */
  private normalizeDate(dateValue: any): string | null {
    if (!dateValue) {
      return null;
    }

    try {
      let date: Date;

      if (typeof dateValue === 'string') {
        // Try parsing as ISO 8601 first
        date = new Date(dateValue);
      } else if (typeof dateValue === 'number') {
        // Assume Unix timestamp (in seconds or milliseconds)
        date = new Date(dateValue > 10000000000 ? dateValue : dateValue * 1000);
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        return null;
      }

      // Validate the date
      if (isNaN(date.getTime())) {
        return null;
      }

      return date.toISOString();
    } catch (error) {
      console.warn(`[Normalization] Failed to parse date: ${dateValue}`, error);
      return null;
    }
  }

  /**
   * Extract title from raw data
   */
  private extractTitle(rawData: any, fields: string[] = ['title', 'name']): string | undefined {
    for (const field of fields) {
      if (rawData[field] && typeof rawData[field] === 'string') {
        return rawData[field];
      }
    }
    return undefined;
  }

  /**
   * Extract text content from raw data (checks multiple possible fields)
   */
  private extractText(rawData: any, fields: string[]): string {
    for (const field of fields) {
      const value = rawData[field];

      if (!value) continue;

      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      } else if (typeof value === 'object') {
        // Handle nested objects
        const extracted = this.extractTextFromObject(value);
        if (extracted) {
          return extracted;
        }
      }
    }

    // Fallback: try to extract any meaningful text
    const fallback = this.extractAnyText(rawData);
    if (fallback) {
      return fallback;
    }

    // Last resort: return stringified object
    return JSON.stringify(rawData);
  }

  /**
   * Extract text from nested objects
   */
  private extractTextFromObject(obj: any): string | null {
    if (!obj || typeof obj !== 'object') {
      return null;
    }

    // Try common text fields in nested objects
    const textFields = ['text', 'content', 'value', 'description', 'body'];
    for (const field of textFields) {
      if (obj[field] && typeof obj[field] === 'string') {
        return obj[field].trim();
      }
    }

    // If object has string values, concatenate them
    const strings = Object.values(obj)
      .filter((v) => typeof v === 'string' && v.trim().length > 0)
      .map((v) => String(v).trim());

    if (strings.length > 0) {
      return strings.join(' ');
    }

    return null;
  }

  /**
   * Extract any meaningful text from the object
   */
  private extractAnyText(obj: any): string | null {
    if (!obj || typeof obj !== 'object') {
      return null;
    }

    const meaningfulFields = Object.entries(obj)
      .filter(([key, value]) => {
        // Skip IDs, timestamps, and other metadata
        const skipKeys = ['id', '_id', 'patient_id', 'created_at', 'updated_at', 'timestamp'];
        return (
          !skipKeys.includes(key) &&
          value &&
          typeof value === 'string' &&
          value.trim().length > 10
        );
      })
      .map(([_, value]) => String(value).trim());

    if (meaningfulFields.length > 0) {
      return meaningfulFields.join(' ');
    }

    return null;
  }

  /**
   * Extract medication-specific title
   */
  private extractMedicationTitle(rawData: any): string | undefined {
    const name = rawData.name || rawData.medication_name || rawData.drug_name;
    const dosage = rawData.dosage || rawData.dose || rawData.strength;

    if (name && dosage) {
      return `${name} ${dosage}`;
    } else if (name) {
      return name;
    }

    return undefined;
  }

  /**
   * Extract medication-specific text
   */
  private extractMedicationText(rawData: any): string {
    const parts: string[] = [];

    const name = rawData.name || rawData.medication_name || rawData.drug_name;
    if (name) parts.push(`Medication: ${name}`);

    const dosage = rawData.dosage || rawData.dose || rawData.strength;
    if (dosage) parts.push(`Dosage: ${dosage}`);

    const frequency = rawData.frequency || rawData.schedule;
    if (frequency) parts.push(`Frequency: ${frequency}`);

    const instructions = rawData.instructions || rawData.directions;
    if (instructions) parts.push(`Instructions: ${instructions}`);

    const indication = rawData.indication || rawData.reason;
    if (indication) parts.push(`Indication: ${indication}`);

    if (parts.length > 0) {
      return parts.join('. ');
    }

    // Fallback
    return this.extractText(rawData, ['description', 'content', 'text', 'notes']);
  }

  /**
   * Extract condition-specific title
   */
  private extractConditionTitle(rawData: any): string | undefined {
    const name = rawData.name || rawData.condition_name || rawData.diagnosis;
    const code = rawData.code || rawData.icd10_code || rawData.icd_code;

    if (name && code) {
      return `${name} (${code})`;
    } else if (name) {
      return name;
    }

    return undefined;
  }

  /**
   * Extract condition-specific text
   */
  private extractConditionText(rawData: any): string {
    const parts: string[] = [];

    const name = rawData.name || rawData.condition_name || rawData.diagnosis;
    if (name) parts.push(`Diagnosis: ${name}`);

    const code = rawData.code || rawData.icd10_code || rawData.icd_code;
    if (code) parts.push(`Code: ${code}`);

    const status = rawData.status || rawData.clinical_status;
    if (status) parts.push(`Status: ${status}`);

    const onset = rawData.onset_date || rawData.diagnosis_date;
    if (onset) parts.push(`Onset: ${onset}`);

    const severity = rawData.severity;
    if (severity) parts.push(`Severity: ${severity}`);

    const notes = rawData.clinical_notes || rawData.notes || rawData.description;
    if (notes) parts.push(`Notes: ${notes}`);

    if (parts.length > 0) {
      return parts.join('. ');
    }

    // Fallback
    return this.extractText(rawData, ['description', 'content', 'text', 'summary']);
  }

  /**
   * Extract allergy-specific title
   */
  private extractAllergyTitle(rawData: any): string | undefined {
    return (
      rawData.allergen ||
      rawData.substance ||
      rawData.name ||
      rawData.allergy_name ||
      undefined
    );
  }

  /**
   * Extract allergy-specific text
   */
  private extractAllergyText(rawData: any): string {
    const parts: string[] = [];

    const allergen = rawData.allergen || rawData.substance || rawData.name;
    if (allergen) parts.push(`Allergen: ${allergen}`);

    const reaction = rawData.reaction || rawData.reaction_type;
    if (reaction) {
      const reactionText = Array.isArray(reaction) ? reaction.join(', ') : reaction;
      parts.push(`Reaction: ${reactionText}`);
    }

    const severity = rawData.severity || rawData.criticality;
    if (severity) parts.push(`Severity: ${severity}`);

    const category = rawData.category || rawData.allergy_type;
    if (category) parts.push(`Category: ${category}`);

    const onset = rawData.onset_date;
    if (onset) parts.push(`Onset: ${onset}`);

    const notes = rawData.notes || rawData.description || rawData.comments;
    if (notes) parts.push(`Notes: ${notes}`);

    if (parts.length > 0) {
      return parts.join('. ');
    }

    // Fallback
    return this.extractText(rawData, ['description', 'content', 'text']);
  }

  /**
   * Construct source URL for an artifact
   */
  private constructSourceUrl(type: string, id: string): string {
    const baseUrl = config.avon.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    return `${baseUrl}/v2/${type}/${id}`;
  }

  /**
   * Extract metadata (exclude common fields)
   */
  private extractMeta(rawData: any, excludeFields: string[]): Record<string, any> | undefined {
    const meta: Record<string, any> = {};

    for (const [key, value] of Object.entries(rawData)) {
      if (!excludeFields.includes(key) && value !== null && value !== undefined) {
        meta[key] = value;
      }
    }

    return Object.keys(meta).length > 0 ? meta : undefined;
  }

  /**
   * Validate an artifact using the comprehensive validation service
   */
  validateArtifact(artifact: Artifact): ValidationResult {
    return artifactValidator.validate(artifact);
  }
}

export const normalizationService = new NormalizationService();
export default normalizationService;
