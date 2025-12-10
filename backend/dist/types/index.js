"use strict";
/**
 * TypeScript Type Definitions
 * Avon Health RAG System Backend
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = exports.NormalizationError = exports.AvonAPIError = void 0;
exports.isCarePlanArtifact = isCarePlanArtifact;
exports.isMedicationArtifact = isMedicationArtifact;
exports.isNoteArtifact = isNoteArtifact;
/**
 * Type guard for CarePlanArtifact
 */
function isCarePlanArtifact(artifact) {
    return artifact.type === 'care_plan';
}
/**
 * Type guard for MedicationArtifact
 */
function isMedicationArtifact(artifact) {
    return artifact.type === 'medication';
}
/**
 * Type guard for NoteArtifact
 */
function isNoteArtifact(artifact) {
    return artifact.type === 'note';
}
/**
 * Custom error for Avon Health API failures
 */
class AvonAPIError extends Error {
    constructor(message, statusCode, endpoint, originalError) {
        super(message);
        this.statusCode = statusCode;
        this.endpoint = endpoint;
        this.originalError = originalError;
        this.name = 'AvonAPIError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AvonAPIError = AvonAPIError;
/**
 * Custom error for artifact normalization failures
 */
class NormalizationError extends Error {
    constructor(message, artifactType, artifactId, originalData) {
        super(message);
        this.artifactType = artifactType;
        this.artifactId = artifactId;
        this.originalData = originalData;
        this.name = 'NormalizationError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.NormalizationError = NormalizationError;
// ============================================================================
// Error Types
// ============================================================================
class AppError extends Error {
    constructor(message, statusCode = 500, code) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
//# sourceMappingURL=index.js.map