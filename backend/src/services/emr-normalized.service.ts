import emrService from './emr.service';
import normalizationService from './normalization.service';
import { Artifact } from '../types/artifact.types';
import { FilterOptions } from '../types/emr.types';

/**
 * Extended EMR service that returns normalized Artifact objects
 */
class EMRNormalizedService {
  /**
   * Fetch and normalize care plans for a patient
   */
  async fetchCarePlans(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchCarePlans(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'care_plan');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  /**
   * Fetch and normalize medications for a patient
   */
  async fetchMedications(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchMedications(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'medication');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  /**
   * Fetch and normalize clinical notes for a patient
   */
  async fetchNotes(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchNotes(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'note');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  /**
   * Fetch and normalize clinical documents for a patient
   */
  async fetchDocuments(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchDocuments(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'document');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  /**
   * Fetch and normalize conditions for a patient
   */
  async fetchConditions(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchConditions(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'condition');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  /**
   * Fetch and normalize allergies for a patient
   */
  async fetchAllergies(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchAllergies(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'allergy');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  async fetchFormResponses(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchFormResponses(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'form_response');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  async fetchMessages(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchMessages(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'message');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  async fetchLabObservations(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchLabObservations(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'lab_observation');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  async fetchVitals(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchVitals(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'vital');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  async fetchAppointments(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchAppointments(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'appointment');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  async fetchSuperbills(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchSuperbills(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'superbill');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  async fetchInsurancePolicies(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchInsurancePolicies(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'insurance_policy');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  async fetchTasks(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchTasks(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'task');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  async fetchFamilyHistories(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchFamilyHistories(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'family_history');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  async fetchIntakeFlows(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchIntakeFlows(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'intake_flow');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  async fetchForms(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchForms(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'form');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  /**
   * Fetch and normalize all EMR data for a patient (Tier 1 + Tier 2 + Tier 3 + Tier 4)
   */
  async fetchAll(patientId: string): Promise<{
    artifacts: Artifact[];
    byType: {
      notes: Artifact[];
      documents: Artifact[];
      medications: Artifact[];
      conditions: Artifact[];
      allergies: Artifact[];
      carePlans: Artifact[];
      formResponses: Artifact[];
      messages: Artifact[];
      labObservations: Artifact[];
      vitals: Artifact[];
      appointments: Artifact[];
      superbills: Artifact[];
      insurancePolicies: Artifact[];
      tasks: Artifact[];
      familyHistories: Artifact[];
      intakeFlows: Artifact[];
      forms: Artifact[];
    };
    cached: boolean;
    fetchTime: number;
    totalCount: number;
  }> {
    const result = await emrService.fetchAll(patientId);

    const notes = normalizationService.normalizeBatch(result.notes, 'note');
    const documents = normalizationService.normalizeBatch(result.documents, 'document');
    const medications = normalizationService.normalizeBatch(result.medications, 'medication');
    const conditions = normalizationService.normalizeBatch(result.conditions, 'condition');
    const allergies = normalizationService.normalizeBatch(result.allergies, 'allergy');
    const carePlans = normalizationService.normalizeBatch(result.carePlans, 'care_plan');
    const formResponses = normalizationService.normalizeBatch(result.formResponses, 'form_response');
    const messages = normalizationService.normalizeBatch(result.messages, 'message');
    const labObservations = normalizationService.normalizeBatch(result.labObservations, 'lab_observation');
    const vitals = normalizationService.normalizeBatch(result.vitals, 'vital');
    const appointments = normalizationService.normalizeBatch(result.appointments, 'appointment');
    const superbills = normalizationService.normalizeBatch(result.superbills, 'superbill');
    const insurancePolicies = normalizationService.normalizeBatch(result.insurancePolicies, 'insurance_policy');
    const tasks = normalizationService.normalizeBatch(result.tasks, 'task');
    const familyHistories = normalizationService.normalizeBatch(result.familyHistories, 'family_history');
    const intakeFlows = normalizationService.normalizeBatch(result.intakeFlows, 'intake_flow');
    const forms = normalizationService.normalizeBatch(result.forms, 'form');

    const artifacts = [
      ...notes,
      ...documents,
      ...medications,
      ...conditions,
      ...allergies,
      ...carePlans,
      ...formResponses,
      ...messages,
      ...labObservations,
      ...vitals,
      ...appointments,
      ...superbills,
      ...insurancePolicies,
      ...tasks,
      ...familyHistories,
      ...intakeFlows,
      ...forms,
    ];

    // Set patient_id on all artifacts (normalization doesn't populate this field)
    artifacts.forEach(artifact => {
      artifact.patient_id = patientId;
    });

    return {
      artifacts,
      byType: {
        notes,
        documents,
        medications,
        conditions,
        allergies,
        carePlans,
        formResponses,
        messages,
        labObservations,
        vitals,
        appointments,
        superbills,
        insurancePolicies,
        tasks,
        familyHistories,
        intakeFlows,
        forms,
      },
      cached: result.cached,
      fetchTime: result.fetchTime,
      totalCount: artifacts.length,
    };
  }

  /**
   * Validate all artifacts and return only valid ones
   */
  async fetchAllValid(patientId: string): Promise<{
    artifacts: Artifact[];
    invalidCount: number;
    cached: boolean;
    fetchTime: number;
  }> {
    const result = await this.fetchAll(patientId);

    const validArtifacts = result.artifacts.filter((artifact) => {
      const validation = normalizationService.validateArtifact(artifact);
      if (!validation.valid) {
        console.warn(
          `[EMR Normalized] Invalid artifact ${artifact.id}:`,
          validation.errors
        );
      }
      return validation.valid;
    });

    return {
      artifacts: validArtifacts,
      invalidCount: result.artifacts.length - validArtifacts.length,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }
}

export const emrNormalizedService = new EMRNormalizedService();
export default emrNormalizedService;
