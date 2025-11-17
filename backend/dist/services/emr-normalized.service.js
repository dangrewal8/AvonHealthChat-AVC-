"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.emrNormalizedService = void 0;
const emr_service_1 = __importDefault(require("./emr.service"));
const normalization_service_1 = __importDefault(require("./normalization.service"));
/**
 * Extended EMR service that returns normalized Artifact objects
 */
class EMRNormalizedService {
    /**
     * Fetch and normalize care plans for a patient
     */
    async fetchCarePlans(patientId, options) {
        const result = await emr_service_1.default.fetchCarePlans(patientId, options);
        const artifacts = normalization_service_1.default.normalizeBatch(result.data, 'care_plan');
        return {
            artifacts,
            cached: result.cached,
            fetchTime: result.fetchTime,
        };
    }
    /**
     * Fetch and normalize medications for a patient
     */
    async fetchMedications(patientId, options) {
        const result = await emr_service_1.default.fetchMedications(patientId, options);
        const artifacts = normalization_service_1.default.normalizeBatch(result.data, 'medication');
        return {
            artifacts,
            cached: result.cached,
            fetchTime: result.fetchTime,
        };
    }
    /**
     * Fetch and normalize clinical notes for a patient
     */
    async fetchNotes(patientId, options) {
        const result = await emr_service_1.default.fetchNotes(patientId, options);
        const artifacts = normalization_service_1.default.normalizeBatch(result.data, 'note');
        return {
            artifacts,
            cached: result.cached,
            fetchTime: result.fetchTime,
        };
    }
    /**
     * Fetch and normalize clinical documents for a patient
     */
    async fetchDocuments(patientId, options) {
        const result = await emr_service_1.default.fetchDocuments(patientId, options);
        const artifacts = normalization_service_1.default.normalizeBatch(result.data, 'document');
        return {
            artifacts,
            cached: result.cached,
            fetchTime: result.fetchTime,
        };
    }
    /**
     * Fetch and normalize conditions for a patient
     */
    async fetchConditions(patientId, options) {
        const result = await emr_service_1.default.fetchConditions(patientId, options);
        const artifacts = normalization_service_1.default.normalizeBatch(result.data, 'condition');
        return {
            artifacts,
            cached: result.cached,
            fetchTime: result.fetchTime,
        };
    }
    /**
     * Fetch and normalize allergies for a patient
     */
    async fetchAllergies(patientId, options) {
        const result = await emr_service_1.default.fetchAllergies(patientId, options);
        const artifacts = normalization_service_1.default.normalizeBatch(result.data, 'allergy');
        return {
            artifacts,
            cached: result.cached,
            fetchTime: result.fetchTime,
        };
    }
    async fetchFormResponses(patientId, options) {
        const result = await emr_service_1.default.fetchFormResponses(patientId, options);
        const artifacts = normalization_service_1.default.normalizeBatch(result.data, 'form_response');
        return {
            artifacts,
            cached: result.cached,
            fetchTime: result.fetchTime,
        };
    }
    async fetchMessages(patientId, options) {
        const result = await emr_service_1.default.fetchMessages(patientId, options);
        const artifacts = normalization_service_1.default.normalizeBatch(result.data, 'message');
        return {
            artifacts,
            cached: result.cached,
            fetchTime: result.fetchTime,
        };
    }
    async fetchLabObservations(patientId, options) {
        const result = await emr_service_1.default.fetchLabObservations(patientId, options);
        const artifacts = normalization_service_1.default.normalizeBatch(result.data, 'lab_observation');
        return {
            artifacts,
            cached: result.cached,
            fetchTime: result.fetchTime,
        };
    }
    async fetchVitals(patientId, options) {
        const result = await emr_service_1.default.fetchVitals(patientId, options);
        const artifacts = normalization_service_1.default.normalizeBatch(result.data, 'vital');
        return {
            artifacts,
            cached: result.cached,
            fetchTime: result.fetchTime,
        };
    }
    async fetchAppointments(patientId, options) {
        const result = await emr_service_1.default.fetchAppointments(patientId, options);
        const artifacts = normalization_service_1.default.normalizeBatch(result.data, 'appointment');
        return {
            artifacts,
            cached: result.cached,
            fetchTime: result.fetchTime,
        };
    }
    async fetchSuperbills(patientId, options) {
        const result = await emr_service_1.default.fetchSuperbills(patientId, options);
        const artifacts = normalization_service_1.default.normalizeBatch(result.data, 'superbill');
        return {
            artifacts,
            cached: result.cached,
            fetchTime: result.fetchTime,
        };
    }
    async fetchInsurancePolicies(patientId, options) {
        const result = await emr_service_1.default.fetchInsurancePolicies(patientId, options);
        const artifacts = normalization_service_1.default.normalizeBatch(result.data, 'insurance_policy');
        return {
            artifacts,
            cached: result.cached,
            fetchTime: result.fetchTime,
        };
    }
    async fetchTasks(patientId, options) {
        const result = await emr_service_1.default.fetchTasks(patientId, options);
        const artifacts = normalization_service_1.default.normalizeBatch(result.data, 'task');
        return {
            artifacts,
            cached: result.cached,
            fetchTime: result.fetchTime,
        };
    }
    async fetchFamilyHistories(patientId, options) {
        const result = await emr_service_1.default.fetchFamilyHistories(patientId, options);
        const artifacts = normalization_service_1.default.normalizeBatch(result.data, 'family_history');
        return {
            artifacts,
            cached: result.cached,
            fetchTime: result.fetchTime,
        };
    }
    async fetchIntakeFlows(patientId, options) {
        const result = await emr_service_1.default.fetchIntakeFlows(patientId, options);
        const artifacts = normalization_service_1.default.normalizeBatch(result.data, 'intake_flow');
        return {
            artifacts,
            cached: result.cached,
            fetchTime: result.fetchTime,
        };
    }
    async fetchForms(patientId, options) {
        const result = await emr_service_1.default.fetchForms(patientId, options);
        const artifacts = normalization_service_1.default.normalizeBatch(result.data, 'form');
        return {
            artifacts,
            cached: result.cached,
            fetchTime: result.fetchTime,
        };
    }
    /**
     * Fetch and normalize all EMR data for a patient (Tier 1 + Tier 2 + Tier 3 + Tier 4)
     */
    async fetchAll(patientId) {
        const result = await emr_service_1.default.fetchAll(patientId);
        const notes = normalization_service_1.default.normalizeBatch(result.notes, 'note');
        const documents = normalization_service_1.default.normalizeBatch(result.documents, 'document');
        const medications = normalization_service_1.default.normalizeBatch(result.medications, 'medication');
        const conditions = normalization_service_1.default.normalizeBatch(result.conditions, 'condition');
        const allergies = normalization_service_1.default.normalizeBatch(result.allergies, 'allergy');
        const carePlans = normalization_service_1.default.normalizeBatch(result.carePlans, 'care_plan');
        const formResponses = normalization_service_1.default.normalizeBatch(result.formResponses, 'form_response');
        const messages = normalization_service_1.default.normalizeBatch(result.messages, 'message');
        const labObservations = normalization_service_1.default.normalizeBatch(result.labObservations, 'lab_observation');
        const vitals = normalization_service_1.default.normalizeBatch(result.vitals, 'vital');
        const appointments = normalization_service_1.default.normalizeBatch(result.appointments, 'appointment');
        const superbills = normalization_service_1.default.normalizeBatch(result.superbills, 'superbill');
        const insurancePolicies = normalization_service_1.default.normalizeBatch(result.insurancePolicies, 'insurance_policy');
        const tasks = normalization_service_1.default.normalizeBatch(result.tasks, 'task');
        const familyHistories = normalization_service_1.default.normalizeBatch(result.familyHistories, 'family_history');
        const intakeFlows = normalization_service_1.default.normalizeBatch(result.intakeFlows, 'intake_flow');
        const forms = normalization_service_1.default.normalizeBatch(result.forms, 'form');
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
    async fetchAllValid(patientId) {
        const result = await this.fetchAll(patientId);
        const validArtifacts = result.artifacts.filter((artifact) => {
            const validation = normalization_service_1.default.validateArtifact(artifact);
            if (!validation.valid) {
                console.warn(`[EMR Normalized] Invalid artifact ${artifact.id}:`, validation.errors);
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
exports.emrNormalizedService = new EMRNormalizedService();
exports.default = exports.emrNormalizedService;
//# sourceMappingURL=emr-normalized.service.js.map