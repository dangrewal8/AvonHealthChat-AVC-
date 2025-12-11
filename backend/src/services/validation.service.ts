/**
 * Response Validation Service
 *
 * Validates and corrects LLM responses to eliminate hallucinations.
 * Implements research-backed techniques including:
 * - Numerical accuracy verification
 * - Citation verification
 * - Temporal query validation
 * - Count consistency enforcement
 * PHASE 2 Enhancements:
 * - date-fns for robust temporal filtering
 * - Citation verification pipeline
 */

import { logger } from '../utils/logger';
import { parseISO, isAfter, isBefore, subMonths, subYears, format } from 'date-fns';

interface ValidationContext {
  query: string;
  response: string;
  structuredExtractions: any[];
  provenance: any[];
  patientData?: any;
}

interface ValidationResult {
  isValid: boolean;
  correctedResponse?: string;
  issues: string[];
  confidence: number;
}

export class ValidationService {
  /**
   * Main validation entry point
   * Validates and corrects response against ground truth
   */
  async validateAndCorrectResponse(context: ValidationContext): Promise<ValidationResult> {
    const issues: string[] = [];
    let correctedResponse = context.response;
    let confidence = 1.0;

    try {
      // 1. Validate numerical accuracy (medications, conditions, allergies)
      const numericalValidation = this.validateNumericalAccuracy(context);
      if (!numericalValidation.isValid) {
        issues.push(...numericalValidation.issues);
        correctedResponse = numericalValidation.correctedResponse || correctedResponse;
        confidence *= 0.8;
      }

      // 2. Validate temporal query correctness (past vs current)
      const temporalValidation = this.validateTemporalQuery(context);
      if (!temporalValidation.isValid) {
        issues.push(...temporalValidation.issues);
        correctedResponse = temporalValidation.correctedResponse || correctedResponse;
        confidence *= 0.9;
      }

      // 3. Validate count consistency (reported count vs extracted entities)
      const countValidation = this.validateCountConsistency(context, correctedResponse);
      if (!countValidation.isValid) {
        issues.push(...countValidation.issues);
        correctedResponse = countValidation.correctedResponse || correctedResponse;
        confidence *= 0.85;
      }

      return {
        isValid: issues.length === 0,
        correctedResponse: issues.length > 0 ? correctedResponse : undefined,
        issues,
        confidence
      };
    } catch (error) {
      logger.error('Validation error:', error);
      return {
        isValid: true, // Fail open - return original response if validation errors
        issues: [`Validation error: ${error}`],
        confidence: 0.5
      };
    }
  }

  /**
   * Validates numerical accuracy against ground truth
   * Fixes hallucinated counts for medications, conditions, allergies
   */
  private validateNumericalAccuracy(context: ValidationContext): ValidationResult {
    const issues: string[] = [];
    let correctedResponse = context.response;

    // Extract reported counts from response
    const medMatch = correctedResponse.match(/(\d+)\s+(?:active\s+)?medication/i);
    const condMatch = correctedResponse.match(/(\d+)\s+(?:diagnosed\s+)?condition/i);
    const allergyMatch = correctedResponse.match(/(\d+)\s+(?:active\s+)?allerg(?:y|ies)/i);

    // Get actual counts from patient data or structured extractions
    let actualMedCount = 0;
    let actualCondCount = 0;
    let actualAllergyCount = 0;

    if (context.patientData) {
      // Prefer patient data as ground truth
      actualMedCount = context.patientData.medications?.filter((m: any) => m.active).length || 0;
      actualCondCount = context.patientData.conditions?.length || 0;
      actualAllergyCount = context.patientData.allergies?.length || 0;
    } else {
      // Fallback to structured extractions
      actualMedCount = context.structuredExtractions.filter(e => e.type === 'medication').length;
      actualCondCount = context.structuredExtractions.filter(e => e.type === 'condition').length;
      actualAllergyCount = context.structuredExtractions.filter(e => e.type === 'allergy').length;
    }

    // Validate medication count
    if (medMatch) {
      const reportedMedCount = parseInt(medMatch[1]);
      if (reportedMedCount !== actualMedCount) {
        issues.push(`Medication count hallucination: Reported ${reportedMedCount} but extracted ${actualMedCount}`);

        // Auto-correct the count
        const wrongPattern = new RegExp(`${reportedMedCount}\\s+(?:active\\s+)?medication`, 'gi');
        correctedResponse = correctedResponse.replace(
          wrongPattern,
          `${actualMedCount} ${actualMedCount === 1 ? 'medication' : 'medications'}`
        );

        logger.warn(`AUTO-CORRECTED: Medication count from ${reportedMedCount} to ${actualMedCount}`);
      }
    }

    // Validate condition count
    if (condMatch) {
      const reportedCondCount = parseInt(condMatch[1]);
      if (reportedCondCount !== actualCondCount) {
        issues.push(`Condition count hallucination: Reported ${reportedCondCount} but extracted ${actualCondCount}`);

        const wrongPattern = new RegExp(`${reportedCondCount}\\s+(?:diagnosed\\s+)?condition`, 'gi');
        correctedResponse = correctedResponse.replace(
          wrongPattern,
          `${actualCondCount} ${actualCondCount === 1 ? 'condition' : 'conditions'}`
        );

        logger.warn(`AUTO-CORRECTED: Condition count from ${reportedCondCount} to ${actualCondCount}`);
      }
    }

    // Validate allergy count
    if (allergyMatch) {
      const reportedAllergyCount = parseInt(allergyMatch[1]);
      if (reportedAllergyCount !== actualAllergyCount) {
        issues.push(`Allergy count hallucination: Reported ${reportedAllergyCount} but extracted ${actualAllergyCount}`);

        const wrongPattern = new RegExp(`${reportedAllergyCount}\\s+(?:active\\s+)?allerg(?:y|ies)`, 'gi');
        correctedResponse = correctedResponse.replace(
          wrongPattern,
          `${actualAllergyCount} ${actualAllergyCount === 1 ? 'allergy' : 'allergies'}`
        );

        logger.warn(`AUTO-CORRECTED: Allergy count from ${reportedAllergyCount} to ${actualAllergyCount}`);
      }
    }

    return {
      isValid: issues.length === 0,
      correctedResponse: issues.length > 0 ? correctedResponse : undefined,
      issues,
      confidence: issues.length === 0 ? 1.0 : 0.7
    };
  }

  /**
   * Validates temporal queries (past vs current medications)
   * Ensures past medication queries don't mention active medications
   */
  private validateTemporalQuery(context: ValidationContext): ValidationResult {
    const issues: string[] = [];
    let correctedResponse = context.response;

    // Detect if this is a past medication query
    const isPastMedQuery = /past|previous|historical|discontinued|stopped|used to take/i.test(context.query);

    if (isPastMedQuery && /medication/i.test(context.query)) {
      // Check if response incorrectly mentions active/current medications
      const mentionsActiveMeds = /currently taking|active medication|is taking/i.test(correctedResponse);

      if (mentionsActiveMeds) {
        issues.push('Past medication query incorrectly mentions active/current medications');

        // Remove any mention of active medications
        correctedResponse = correctedResponse.replace(
          /\.\s*The patient is currently taking \d+ (?:active\s+)?medications?\./gi,
          '.'
        );
        correctedResponse = correctedResponse.replace(
          /\s*The patient is currently taking \d+ (?:active\s+)?medications?\./gi,
          ''
        );

        logger.warn('AUTO-CORRECTED: Removed active medication mention from past medication query');
      }

      // Validate that we're checking inactive medications
      let inactiveMedCount = 0;
      if (context.patientData?.medications) {
        inactiveMedCount = context.patientData.medications.filter((m: any) => m.active === false).length;
      } else if (context.provenance) {
        inactiveMedCount = context.provenance.filter(
          p => p.artifact_type === 'medication' && p.data?.active === false
        ).length;
      }

      if (inactiveMedCount === 0 && !correctedResponse.match(/no.*(?:past|discontinued|historical).*medication/i)) {
        // Should explicitly say no past medications found
        correctedResponse = "No past/discontinued medications found in the patient's records.";
        logger.warn('AUTO-CORRECTED: Replaced response for zero past medications');
      }
    }

    return {
      isValid: issues.length === 0,
      correctedResponse: issues.length > 0 ? correctedResponse : undefined,
      issues,
      confidence: issues.length === 0 ? 1.0 : 0.8
    };
  }

  /**
   * Validates count consistency between reported counts and extracted entities
   * Ensures when LLM says "2 medications", it actually lists 2 medication names
   */
  private validateCountConsistency(context: ValidationContext, response: string): ValidationResult {
    const issues: string[] = [];
    let correctedResponse = response;

    // Count medication names listed in the response
    const medExtractions = context.structuredExtractions.filter(e => e.type === 'medication');
    const listedMedNames = medExtractions.map(e => e.value || e.name).filter(Boolean);

    // Find reported count in response
    const medCountMatch = response.match(/(\d+)\s+(?:active\s+)?medication/i);

    if (medCountMatch && listedMedNames.length > 0) {
      const reportedCount = parseInt(medCountMatch[1]);
      const actualListedCount = listedMedNames.length;

      if (reportedCount !== actualListedCount) {
        issues.push(`Count-name mismatch: Says ${reportedCount} medications but lists ${actualListedCount} names`);

        // Correct the count to match the number of names actually listed
        const wrongPattern = new RegExp(`${reportedCount}\\s+(?:active\\s+)?medication`, 'gi');
        correctedResponse = correctedResponse.replace(
          wrongPattern,
          `${actualListedCount} ${actualListedCount === 1 ? 'medication' : 'medications'}`
        );

        logger.warn(`AUTO-CORRECTED: Count-name consistency from ${reportedCount} to ${actualListedCount}`);
      }
    }

    // Same check for conditions
    const condExtractions = context.structuredExtractions.filter(e => e.type === 'condition');
    const listedCondNames = condExtractions.map(e => e.value || e.name).filter(Boolean);
    const condCountMatch = response.match(/(\d+)\s+(?:diagnosed\s+)?condition/i);

    if (condCountMatch && listedCondNames.length > 0) {
      const reportedCount = parseInt(condCountMatch[1]);
      const actualListedCount = listedCondNames.length;

      if (reportedCount !== actualListedCount) {
        issues.push(`Count-name mismatch: Says ${reportedCount} conditions but lists ${actualListedCount} names`);

        const wrongPattern = new RegExp(`${reportedCount}\\s+(?:diagnosed\\s+)?condition`, 'gi');
        correctedResponse = correctedResponse.replace(
          wrongPattern,
          `${actualListedCount} ${actualListedCount === 1 ? 'condition' : 'conditions'}`
        );

        logger.warn(`AUTO-CORRECTED: Condition count-name consistency from ${reportedCount} to ${actualListedCount}`);
      }
    }

    return {
      isValid: issues.length === 0,
      correctedResponse: issues.length > 0 ? correctedResponse : undefined,
      issues,
      confidence: issues.length === 0 ? 1.0 : 0.75
    };
  }

  /**
   * Validates that all claims in the response are supported by provenance
   * Implements citation verification
   */
  async verifyCitations(context: ValidationContext): Promise<ValidationResult> {
    const issues: string[] = [];

    // Extract key claims from response (medications, conditions, dates, etc.)
    const claims = this.extractClaims(context.response);

    // Check each claim against provenance
    for (const claim of claims) {
      const isSupported = this.isClaimSupported(claim, context.provenance);
      if (!isSupported) {
        issues.push(`Unsupported claim: "${claim}"`);
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      confidence: 1.0 - (issues.length * 0.1)
    };
  }

  /**
   * Extract atomic claims from response text
   */
  private extractClaims(response: string): string[] {
    const claims: string[] = [];

    // Extract medication claims
    const medMatches = response.matchAll(/(?:taking|on|prescribed)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi);
    for (const match of medMatches) {
      claims.push(match[1]);
    }

    // Extract condition claims
    const condMatches = response.matchAll(/(?:diagnosed with|has|condition[s]?:)\s+([^.,;]+)/gi);
    for (const match of condMatches) {
      claims.push(match[1].trim());
    }

    return claims;
  }

  /**
   * Check if a claim is supported by provenance artifacts
   */
  private isClaimSupported(claim: string, provenance: any[]): boolean {
    if (!provenance || provenance.length === 0) return false;

    const claimLower = claim.toLowerCase();

    for (const artifact of provenance) {
      const artifactText = JSON.stringify(artifact.data).toLowerCase();
      if (artifactText.includes(claimLower)) {
        return true;
      }
    }

    return false;
  }

  /**
   * PHASE 2: Enhanced Temporal Filtering with date-fns
   * Filters artifacts by date range based on query temporal expressions
   */
  filterArtifactsByTimeWindow(
    artifacts: any[],
    query: string
  ): { filtered: any[]; time_window?: { start: Date; end: Date; expression: string } } {
    const now = new Date();
    let timeWindow: { start: Date; end: Date; expression: string } | undefined;

    // Detect temporal expressions
    if (/past\s+(\d+)\s+(month|year)s?/i.test(query)) {
      const match = query.match(/past\s+(\d+)\s+(month|year)s?/i);
      const amount = parseInt(match![1]);
      const unit = match![2].toLowerCase();

      const start = unit === 'month' ? subMonths(now, amount) : subYears(now, amount);
      timeWindow = {
        start,
        end: now,
        expression: `past ${amount} ${unit}${amount > 1 ? 's' : ''}`,
      };
    } else if (/last\s+(month|year|week)/i.test(query)) {
      const match = query.match(/last\s+(month|year|week)/i);
      const unit = match![1].toLowerCase();

      if (unit === 'month') {
        timeWindow = { start: subMonths(now, 1), end: now, expression: 'last month' };
      } else if (unit === 'year') {
        timeWindow = { start: subYears(now, 1), end: now, expression: 'last year' };
      }
    } else if (/current|active|ongoing/i.test(query)) {
      // For "current" queries, only include recent data (last 3 months)
      timeWindow = {
        start: subMonths(now, 3),
        end: now,
        expression: 'current/active',
      };
    } else if (/historical|past|discontinued|previous/i.test(query)) {
      // For historical queries, look back further but exclude very recent
      timeWindow = {
        start: subYears(now, 5),
        end: subMonths(now, 1), // Exclude last month to avoid active items
        expression: 'historical/past',
      };
    }

    if (!timeWindow) {
      // No temporal filtering needed
      return { filtered: artifacts };
    }

    console.log(`   📅 Temporal filter: ${timeWindow.expression} (${format(timeWindow.start, 'yyyy-MM-dd')} to ${format(timeWindow.end, 'yyyy-MM-dd')})`);

    // Filter artifacts by date
    const filtered = artifacts.filter((artifact: any) => {
      // Try to find a date field
      const dateField = artifact.occurred_at || artifact.created_at || artifact.start_date || artifact.recorded_at;

      if (!dateField) {
        // No date available, include by default
        return true;
      }

      try {
        const artifactDate = typeof dateField === 'string' ? parseISO(dateField) : new Date(dateField);

        const inRange = isAfter(artifactDate, timeWindow!.start) && isBefore(artifactDate, timeWindow!.end);
        return inRange;
      } catch (error) {
        logger.warn(`Failed to parse date ${dateField}, including artifact by default`);
        return true;
      }
    });

    console.log(`   Filtered ${artifacts.length} → ${filtered.length} artifacts`);

    return { filtered, time_window: timeWindow };
  }
}

export const validationService = new ValidationService();
