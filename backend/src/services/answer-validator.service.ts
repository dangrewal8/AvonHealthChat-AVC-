/**
 * Answer Validator Service
 * Post-processing validation to catch and correct hallucinations
 * Safe to add - doesn't modify existing flow until integrated
 */

import {
  checkDataAvailability,
  generateNoDataResponse,
  validateNoDataResponse,
  detectDataType
} from '../utils/data-availability.util';

export interface ValidationResult {
  valid: boolean;
  issue?: string;
  correctedAnswer?: any;
  hallucinationDetected?: boolean;
}

export interface HallucinationMetrics {
  timestamp: string;
  query: string;
  dataType: string;
  hasData: boolean;
  originalAnswer: string;
  corrected: boolean;
}

export class AnswerValidatorService {
  private hallucinationLog: HallucinationMetrics[] = [];

  /**
   * Validate answer against data availability
   * Main entry point for validation
   */
  validateAnswer(
    query: string,
    answer: string,
    context: string,
    dataType?: string
  ): ValidationResult {

    // Detect data type if not provided
    const detectedTypes = dataType ? [dataType] : detectDataType(query);
    const primaryType = detectedTypes[0] || 'unknown';

    // Check if data is available
    const availabilityCheck = checkDataAvailability(context, primaryType);

    // Validate response matches data availability
    const responseValidation = validateNoDataResponse(answer, availabilityCheck.hasData);

    if (!responseValidation.valid) {
      // Hallucination or false negative detected
      console.warn(`⚠️  Validation issue for ${primaryType}:`, responseValidation.issue);

      // Log the issue
      this.logHallucination({
        timestamp: new Date().toISOString(),
        query,
        dataType: primaryType,
        hasData: availabilityCheck.hasData,
        originalAnswer: answer,
        corrected: false
      });

      return {
        valid: false,
        issue: responseValidation.issue,
        hallucinationDetected: !availabilityCheck.hasData
      };
    }

    return { valid: true };
  }

  /**
   * Auto-correct hallucinated answer
   * Generates corrected response for no-data scenarios
   */
  correctHallucination(
    query: string,
    result: any,
    context: string
  ): any {

    const detectedTypes = detectDataType(query);
    const primaryType = detectedTypes[0] || 'unknown';

    const availabilityCheck = checkDataAvailability(context, primaryType);

    // Only correct if no data exists but answer provides info
    if (!availabilityCheck.hasData) {
      const validation = this.validateAnswer(query, result.short_answer, context, primaryType);

      if (!validation.valid) {
        console.warn(`🔧 Auto-correcting hallucination for ${primaryType}`);

        const correctedResponse = generateNoDataResponse(primaryType);

        // Log correction
        this.logHallucination({
          timestamp: new Date().toISOString(),
          query,
          dataType: primaryType,
          hasData: false,
          originalAnswer: result.short_answer,
          corrected: true
        });

        return {
          ...result,
          short_answer: correctedResponse.short_answer,
          detailed_summary: correctedResponse.detailed_summary,
          structured_extractions: [],
          provenance: [],
          metadata: {
            ...result.metadata,
            hallucination_detected: true,
            hallucination_corrected: true,
            original_answer: result.short_answer
          }
        };
      }
    }

    return result; // No correction needed
  }

  /**
   * Log hallucination for monitoring
   */
  private logHallucination(metrics: HallucinationMetrics): void {
    this.hallucinationLog.push(metrics);

    // Keep last 1000 entries
    if (this.hallucinationLog.length > 1000) {
      this.hallucinationLog.shift();
    }
  }

  /**
   * Get hallucination metrics
   */
  getMetrics(): {
    total: number;
    byCorrected: { corrected: number; notCorrected: number };
    byDataType: Record<string, number>;
    recentHallucinations: HallucinationMetrics[];
  } {
    const total = this.hallucinationLog.length;
    const corrected = this.hallucinationLog.filter(h => h.corrected).length;
    const notCorrected = total - corrected;

    const byDataType: Record<string, number> = {};
    this.hallucinationLog.forEach(h => {
      byDataType[h.dataType] = (byDataType[h.dataType] || 0) + 1;
    });

    return {
      total,
      byCorrected: { corrected, notCorrected },
      byDataType,
      recentHallucinations: this.hallucinationLog.slice(-10)
    };
  }

  /**
   * Get hallucination rate
   */
  getHallucinationRate(): number {
    if (this.hallucinationLog.length === 0) return 0;
    const corrected = this.hallucinationLog.filter(h => h.corrected).length;
    return (corrected / this.hallucinationLog.length) * 100;
  }
}

// Singleton instance for tracking across requests
export const answerValidator = new AnswerValidatorService();
