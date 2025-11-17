/**
 * Artifact Validation Service
 * Comprehensive validation for normalized Artifact objects
 *
 * Per ChatGPT Requirement: "Validation: Ensure all required fields are present, Type checking, Date validity"
 */

import { Artifact, ArtifactType } from '../types/artifact.types';

/**
 * Validation error/warning interface
 */
export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  value?: any;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

/**
 * Required fields for each artifact type
 */
const REQUIRED_FIELDS: Record<ArtifactType, string[]> = {
  // Tier 1
  note: ['id', 'patient_id', 'occurred_at', 'text', 'source', 'type'],
  document: ['id', 'patient_id', 'occurred_at', 'text', 'source', 'type'],
  medication: ['id', 'patient_id', 'occurred_at', 'text', 'source', 'type'],
  condition: ['id', 'patient_id', 'occurred_at', 'text', 'source', 'type'],
  allergy: ['id', 'patient_id', 'occurred_at', 'text', 'source', 'type'],
  care_plan: ['id', 'patient_id', 'occurred_at', 'text', 'source', 'type'],
  // Tier 2
  form_response: ['id', 'patient_id', 'occurred_at', 'text', 'source', 'type'],
  message: ['id', 'patient_id', 'occurred_at', 'text', 'source', 'type'],
  lab_observation: ['id', 'patient_id', 'occurred_at', 'text', 'source', 'type'],
  vital: ['id', 'patient_id', 'occurred_at', 'text', 'source', 'type'],
  // Tier 3
  appointment: ['id', 'patient_id', 'occurred_at', 'text', 'source', 'type'],
  superbill: ['id', 'patient_id', 'occurred_at', 'text', 'source', 'type'],
  insurance_policy: ['id', 'patient_id', 'occurred_at', 'text', 'source', 'type'],
  task: ['id', 'patient_id', 'occurred_at', 'text', 'source', 'type'],
  family_history: ['id', 'patient_id', 'occurred_at', 'text', 'source', 'type'],
  // Tier 4
  intake_flow: ['id', 'patient_id', 'occurred_at', 'text', 'source', 'type'],
  form: ['id', 'patient_id', 'occurred_at', 'text', 'source', 'type'],
};

/**
 * Field type definitions
 */
const FIELD_TYPES: Record<string, string> = {
  id: 'string',
  patient_id: 'string',
  occurred_at: 'string',
  text: 'string',
  source: 'string',
  type: 'string',
  author: 'string',
  title: 'string',
  meta: 'object',
};

/**
 * Artifact Validator Class
 * Validates artifacts for required fields, type correctness, and date validity
 */
class ArtifactValidator {
  /**
   * Comprehensive validation of an artifact
   * Returns detailed validation result with errors and warnings
   */
  validate(artifact: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 1. Validate required fields
    const requiredErrors = this.validateRequired(artifact);
    errors.push(...requiredErrors);

    // 2. Validate field types
    const typeErrors = this.validateTypes(artifact);
    errors.push(...typeErrors);

    // 3. Validate dates (produces warnings and errors)
    const dateValidation = this.validateDates(artifact);
    errors.push(...dateValidation.errors);
    warnings.push(...dateValidation.warnings);

    // 4. Additional validation
    const additionalValidation = this.validateAdditional(artifact);
    errors.push(...additionalValidation.errors);
    warnings.push(...additionalValidation.warnings);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Simple boolean validation for artifacts
   * Returns true if artifact has no errors
   */
  validateArtifact(artifact: Artifact): boolean {
    const result = this.validate(artifact);
    return result.valid;
  }

  /**
   * Validate required fields are present and non-empty
   */
  validateRequired(artifact: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Check if artifact has a type
    if (!artifact || !artifact.type) {
      errors.push({
        field: 'type',
        message: 'Artifact type is required',
        severity: 'error',
        value: artifact?.type,
      });
      return errors; // Can't proceed without type
    }

    // Get required fields for this artifact type
    const requiredFields = REQUIRED_FIELDS[artifact.type as ArtifactType];
    if (!requiredFields) {
      errors.push({
        field: 'type',
        message: `Invalid artifact type: ${artifact.type}`,
        severity: 'error',
        value: artifact.type,
      });
      return errors;
    }

    // Check each required field
    for (const field of requiredFields) {
      const value = artifact[field];

      // Check if field exists
      if (value === undefined || value === null) {
        errors.push({
          field,
          message: `Required field '${field}' is missing`,
          severity: 'error',
          value,
        });
        continue;
      }

      // Check if field is empty (for strings)
      if (typeof value === 'string' && value.trim().length === 0) {
        errors.push({
          field,
          message: `Required field '${field}' cannot be empty`,
          severity: 'error',
          value,
        });
      }
    }

    return errors;
  }

  /**
   * Validate date fields
   * Checks ISO 8601 format, future dates, and very old dates
   */
  validateDates(artifact: any): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    if (!artifact.occurred_at) {
      return { errors, warnings }; // Already caught by required validation
    }

    const occurredAt = artifact.occurred_at;

    // 1. Validate ISO 8601 format
    if (!this.isValidISODate(occurredAt)) {
      errors.push({
        field: 'occurred_at',
        message: 'Date must be in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)',
        severity: 'error',
        value: occurredAt,
      });
      return { errors, warnings }; // Can't proceed with invalid date
    }

    // 2. Parse and check date validity
    const date = new Date(occurredAt);
    if (isNaN(date.getTime())) {
      errors.push({
        field: 'occurred_at',
        message: 'Invalid date value',
        severity: 'error',
        value: occurredAt,
      });
      return { errors, warnings };
    }

    const now = new Date();

    // 3. Check if date is in the future (warning)
    if (date > now) {
      const diffMs = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      warnings.push({
        field: 'occurred_at',
        message: `Date is in the future (${diffDays} day${diffDays !== 1 ? 's' : ''} from now)`,
        severity: 'warning',
        value: occurredAt,
      });
    }

    // 4. Check if date is too old (> 10 years - warning)
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

    if (date < tenYearsAgo) {
      const diffMs = now.getTime() - date.getTime();
      const diffYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));

      warnings.push({
        field: 'occurred_at',
        message: `Date is very old (${diffYears} year${diffYears !== 1 ? 's' : ''} ago)`,
        severity: 'warning',
        value: occurredAt,
      });
    }

    // 5. Check if date is before 1900 (error)
    const year1900 = new Date('1900-01-01T00:00:00.000Z');
    if (date < year1900) {
      errors.push({
        field: 'occurred_at',
        message: 'Date cannot be before 1900',
        severity: 'error',
        value: occurredAt,
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate field types
   */
  validateTypes(artifact: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate each field's type
    for (const [field, expectedType] of Object.entries(FIELD_TYPES)) {
      const value = artifact[field];

      // Skip if field is not present (handled by required validation)
      if (value === undefined || value === null) {
        continue;
      }

      const actualType = typeof value;

      // Check type match
      if (expectedType === 'object') {
        if (actualType !== 'object' || Array.isArray(value)) {
          errors.push({
            field,
            message: `Field '${field}' must be an object, got ${Array.isArray(value) ? 'array' : actualType}`,
            severity: 'error',
            value,
          });
        }
      } else if (actualType !== expectedType) {
        errors.push({
          field,
          message: `Field '${field}' must be a ${expectedType}, got ${actualType}`,
          severity: 'error',
          value,
        });
      }
    }

    // Validate artifact type is one of the allowed types
    if (artifact.type) {
      const validTypes: ArtifactType[] = [
        // Tier 1
        'note', 'document', 'medication', 'condition', 'allergy', 'care_plan',
        // Tier 2
        'form_response', 'message', 'lab_observation', 'vital',
        // Tier 3
        'appointment', 'superbill', 'insurance_policy', 'task', 'family_history',
        // Tier 4
        'intake_flow', 'form'
      ];
      if (!validTypes.includes(artifact.type)) {
        errors.push({
          field: 'type',
          message: `Invalid artifact type '${artifact.type}'. Must be one of: ${validTypes.join(', ')}`,
          severity: 'error',
          value: artifact.type,
        });
      }
    }

    return errors;
  }

  /**
   * Additional validation checks
   */
  private validateAdditional(artifact: any): { errors: ValidationError[]; warnings: ValidationError[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // 1. Check text field length
    if (artifact.text && typeof artifact.text === 'string') {
      const textLength = artifact.text.length;

      if (textLength === 0) {
        errors.push({
          field: 'text',
          message: 'Text field cannot be empty',
          severity: 'error',
          value: artifact.text,
        });
      } else if (textLength > 50000) {
        warnings.push({
          field: 'text',
          message: `Text is very long (${textLength} characters)`,
          severity: 'warning',
          value: textLength,
        });
      } else if (textLength < 10) {
        warnings.push({
          field: 'text',
          message: `Text is very short (${textLength} characters)`,
          severity: 'warning',
          value: textLength,
        });
      }
    }

    // 2. Check ID format (should not contain spaces or special chars)
    if (artifact.id && typeof artifact.id === 'string') {
      if (/\s/.test(artifact.id)) {
        warnings.push({
          field: 'id',
          message: 'ID contains whitespace',
          severity: 'warning',
          value: artifact.id,
        });
      }

      if (artifact.id === 'unknown' || artifact.id === 'placeholder') {
        warnings.push({
          field: 'id',
          message: `ID is a placeholder value: '${artifact.id}'`,
          severity: 'warning',
          value: artifact.id,
        });
      }
    }

    // 3. Check patient_id format
    if (artifact.patient_id && typeof artifact.patient_id === 'string') {
      if (artifact.patient_id.trim().length === 0) {
        errors.push({
          field: 'patient_id',
          message: 'Patient ID cannot be empty',
          severity: 'error',
          value: artifact.patient_id,
        });
      }
    }

    // 4. Check source URL format
    if (artifact.source && typeof artifact.source === 'string') {
      if (!artifact.source.startsWith('http://') && !artifact.source.startsWith('https://')) {
        warnings.push({
          field: 'source',
          message: 'Source should be a valid URL',
          severity: 'warning',
          value: artifact.source,
        });
      }
    }

    // 5. Check title length (if present)
    if (artifact.title && typeof artifact.title === 'string') {
      if (artifact.title.length > 200) {
        warnings.push({
          field: 'title',
          message: `Title is very long (${artifact.title.length} characters)`,
          severity: 'warning',
          value: artifact.title.length,
        });
      }
    }

    return { errors, warnings };
  }

  /**
   * Check if a string is a valid ISO 8601 date
   */
  private isValidISODate(dateString: string): boolean {
    if (typeof dateString !== 'string') {
      return false;
    }

    // ISO 8601 regex pattern
    // Matches: YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DDTHH:mm:ssZ or YYYY-MM-DD
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;

    if (!iso8601Regex.test(dateString)) {
      return false;
    }

    // Try parsing to ensure it's a valid date
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }

  /**
   * Batch validation
   * Validates multiple artifacts and returns a summary
   */
  validateBatch(artifacts: any[]): {
    totalCount: number;
    validCount: number;
    invalidCount: number;
    warningCount: number;
    results: ValidationResult[];
  } {
    const results = artifacts.map((artifact) => this.validate(artifact));

    const validCount = results.filter((r) => r.valid).length;
    const invalidCount = results.filter((r) => !r.valid).length;
    const warningCount = results.filter((r) => r.warnings.length > 0).length;

    return {
      totalCount: artifacts.length,
      validCount,
      invalidCount,
      warningCount,
      results,
    };
  }

  /**
   * Get validation summary for logging
   */
  getValidationSummary(result: ValidationResult): string {
    if (result.valid && result.warnings.length === 0) {
      return '✓ Valid';
    }

    const parts: string[] = [];

    if (!result.valid) {
      parts.push(`✗ ${result.errors.length} error${result.errors.length !== 1 ? 's' : ''}`);
    } else {
      parts.push('✓ Valid');
    }

    if (result.warnings.length > 0) {
      parts.push(`⚠ ${result.warnings.length} warning${result.warnings.length !== 1 ? 's' : ''}`);
    }

    return parts.join(', ');
  }

  /**
   * Format validation errors for display
   */
  formatErrors(errors: ValidationError[]): string {
    if (errors.length === 0) {
      return 'No errors';
    }

    return errors
      .map((error) => {
        const value = error.value !== undefined ? ` (got: ${JSON.stringify(error.value)})` : '';
        return `  - ${error.field}: ${error.message}${value}`;
      })
      .join('\n');
  }

  /**
   * Format validation warnings for display
   */
  formatWarnings(warnings: ValidationError[]): string {
    if (warnings.length === 0) {
      return 'No warnings';
    }

    return warnings
      .map((warning) => {
        const value = warning.value !== undefined ? ` (${JSON.stringify(warning.value)})` : '';
        return `  - ${warning.field}: ${warning.message}${value}`;
      })
      .join('\n');
  }
}

// Export singleton instance
export const artifactValidator = new ArtifactValidator();
export default artifactValidator;
