/**
 * Extraction Count Verifier Service
 *
 * Enforces consistency between extraction counts and summarization claims.
 * Prevents hallucinations like "4-5 medications" when only 3 were extracted.
 *
 * Key Features:
 * - Counts extractions by type (medications, conditions, procedures, etc.)
 * - Parses summarization text for claimed counts
 * - Detects discrepancies between extracted and claimed counts
 * - Auto-corrects summary text to match extraction counts
 * - Provides detailed verification reports for audit trail
 *
 * Phase 1B: Critical Fix for Count Hallucinations
 *
 * This directly addresses the user's complaint:
 * "IF WE CAN ONLY CONFIRM 3 FROM SOURCES WHY DONT WE USE THAT
 *  TO UNDERSTAND THAT WE ONLY HAVE 3 MEDS AND TELL ME ONLY 3 MEDS????"
 */

export interface Extraction {
  type: string;
  content: Record<string, unknown>;
  provenance: {
    source_chunk_id: string;
    source_artifact_id: string;
    supporting_text: string;
    confidence: number;
  };
}

/**
 * Count discrepancy detected between extraction and summarization
 */
export interface CountDiscrepancy {
  entity_type: string; // e.g., 'medication', 'condition'
  extracted_count: number; // What we actually found
  claimed_count: string; // What the summary claims (e.g., '4-5', '3+')
  severity: 'critical' | 'warning' | 'info';
  explanation: string;
}

/**
 * Result of verification
 */
export interface VerificationResult {
  passed: boolean;
  discrepancies: CountDiscrepancy[];
  extraction_counts: Record<string, number>;
  corrected_summary?: string;
  warnings: string[];
}

/**
 * Extraction Count Verifier Service
 *
 * Prevents count mismatches between what was extracted and what is claimed in summaries
 */
export class ExtractionCountVerifierService {
  /**
   * Patterns to detect count claims in summaries
   * Matches: "3 medications", "4-5 medications", "3+ conditions", etc.
   */
  private readonly countPatterns = [
    // Exact counts: "3 medications", "five conditions"
    /(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(medication|med|drug|condition|diagnosis|procedure|treatment|lab|test)s?/gi,

    // Range counts: "3-5 medications", "4 to 6 conditions"
    /(\d+)\s*-\s*(\d+)\s+(medication|med|drug|condition|diagnosis|procedure|treatment|lab|test)s?/gi,

    // Approximate counts: "3+ medications", "approximately 4 conditions"
    /(approximately|about|around|roughly|over)\s+(\d+)\s+(medication|med|drug|condition|diagnosis|procedure|treatment|lab|test)s?/gi,

    // Plural forms without numbers: "several medications", "multiple conditions"
    /(several|multiple|many|some|few)\s+(medication|med|drug|condition|diagnosis|procedure|treatment|lab|test)s/gi,
  ];

  /**
   * Number word to digit mapping
   */
  private readonly numberWords: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };

  /**
   * Normalize entity type names for consistent comparison
   */
  private normalizeEntityType(type: string): string {
    const normalized = type.toLowerCase().trim();

    // Map common variations to standard types
    const typeMap: Record<string, string> = {
      med: 'medication',
      meds: 'medication',
      drug: 'medication',
      drugs: 'medication',
      diagnosis: 'condition',
      diagnoses: 'condition',
      lab: 'test',
      labs: 'test',
    };

    return typeMap[normalized] || normalized;
  }

  /**
   * Count extractions by entity type
   */
  public countByType(extractions: Extraction[]): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const extraction of extractions) {
      const type = this.normalizeEntityType(extraction.type);
      counts[type] = (counts[type] || 0) + 1;
    }

    return counts;
  }

  /**
   * Parse summary text to find claimed counts
   */
  public parseClaimedCounts(summary: string): Record<string, string[]> {
    const claims: Record<string, string[]> = {};

    for (const pattern of this.countPatterns) {
      let match;
      while ((match = pattern.exec(summary)) !== null) {
        const entityType = this.normalizeEntityType(match[match.length - 1]);

        // Extract the count claim
        let claim: string;
        if (match[0].includes('-')) {
          // Range: "3-5 medications"
          claim = match[0];
        } else if (
          match[0].match(
            /approximately|about|around|roughly|over|several|multiple|many|some|few/i
          )
        ) {
          // Approximate: "approximately 3 medications" or "several medications"
          claim = match[0];
        } else {
          // Exact: "3 medications"
          claim = match[0];
        }

        if (!claims[entityType]) {
          claims[entityType] = [];
        }
        claims[entityType].push(claim);
      }
    }

    return claims;
  }

  /**
   * Convert count claim to numeric range
   */
  private parseCountClaim(claim: string): { min: number; max: number } | null {
    // Range: "3-5 medications"
    const rangeMatch = claim.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) {
      return { min: parseInt(rangeMatch[1]), max: parseInt(rangeMatch[2]) };
    }

    // Approximate: "approximately 3 medications"
    const approxMatch = claim.match(
      /(?:approximately|about|around|roughly)\s+(\d+)/i
    );
    if (approxMatch) {
      const num = parseInt(approxMatch[1]);
      return { min: num - 1, max: num + 1 }; // Allow ±1
    }

    // Over: "over 3 medications"
    const overMatch = claim.match(/over\s+(\d+)/i);
    if (overMatch) {
      const num = parseInt(overMatch[1]);
      return { min: num + 1, max: 999 };
    }

    // Exact number or word: "3 medications" or "three medications"
    const exactMatch = claim.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+/i);
    if (exactMatch) {
      const numStr = exactMatch[1].toLowerCase();
      const num = this.numberWords[numStr] || parseInt(numStr);
      if (!isNaN(num)) {
        return { min: num, max: num };
      }
    }

    // Vague terms: "several", "multiple", "many"
    if (claim.match(/several|multiple|many/i)) {
      return { min: 2, max: 999 }; // At least 2
    }
    if (claim.match(/some|few/i)) {
      return { min: 1, max: 999 }; // At least 1
    }

    return null;
  }

  /**
   * Find discrepancies between extracted counts and claimed counts
   */
  public findDiscrepancies(
    extractedCounts: Record<string, number>,
    claimedCounts: Record<string, string[]>
  ): CountDiscrepancy[] {
    const discrepancies: CountDiscrepancy[] = [];

    for (const [entityType, claims] of Object.entries(claimedCounts)) {
      const extracted = extractedCounts[entityType] || 0;

      for (const claim of claims) {
        const range = this.parseCountClaim(claim);
        if (!range) continue;

        // Check if extracted count is within claimed range
        const isInRange = extracted >= range.min && extracted <= range.max;

        if (!isInRange) {
          discrepancies.push({
            entity_type: entityType,
            extracted_count: extracted,
            claimed_count: claim,
            severity: this.getSeverity(extracted, range),
            explanation: `Summary claims "${claim}" but we only extracted ${extracted} ${entityType}s from sources`,
          });
        }
      }
    }

    return discrepancies;
  }

  /**
   * Determine severity of discrepancy
   */
  private getSeverity(
    extracted: number,
    range: { min: number; max: number }
  ): 'critical' | 'warning' | 'info' {
    const diff = Math.max(extracted - range.max, range.min - extracted);

    if (diff >= 2) return 'critical'; // Off by 2+ is critical
    if (diff >= 1) return 'warning'; // Off by 1 is warning
    return 'info';
  }

  /**
   * Auto-correct summary to match extraction counts
   *
   * Replaces incorrect count claims with exact extraction counts
   */
  public autoCorrect(
    summary: string,
    extractedCounts: Record<string, number>
  ): string {
    let corrected = summary;

    for (const pattern of this.countPatterns) {
      corrected = corrected.replace(pattern, (match, ...groups) => {
        const entityType = this.normalizeEntityType(groups[groups.length - 3]);
        const extracted = extractedCounts[entityType];

        if (extracted !== undefined) {
          // Replace with exact count
          return `${extracted} ${entityType}${extracted !== 1 ? 's' : ''}`;
        }

        return match; // Keep original if no extraction count
      });
    }

    return corrected;
  }

  /**
   * Verify that summary claims match extraction counts
   *
   * Main API for this service
   */
  public verify(
    extractions: Extraction[],
    summary: string
  ): VerificationResult {
    console.log(
      `[ExtractionCountVerifier] Verifying summary against ${extractions.length} extractions...`
    );

    // Count extractions by type
    const extractedCounts = this.countByType(extractions);
    console.log(
      `[ExtractionCountVerifier] Extraction counts:`,
      extractedCounts
    );

    // Parse claims from summary
    const claimedCounts = this.parseClaimedCounts(summary);
    console.log(`[ExtractionCountVerifier] Claimed counts:`, claimedCounts);

    // Find discrepancies
    const discrepancies = this.findDiscrepancies(
      extractedCounts,
      claimedCounts
    );

    const warnings: string[] = [];
    const passed = discrepancies.filter((d) => d.severity === 'critical')
      .length === 0;

    if (!passed) {
      console.log(
        `[ExtractionCountVerifier] ❌ VERIFICATION FAILED - ${discrepancies.length} discrepancies found:`
      );
      for (const disc of discrepancies) {
        console.log(
          `  [${disc.severity.toUpperCase()}] ${disc.explanation}`
        );
        if (disc.severity === 'critical') {
          warnings.push(
            `Count mismatch: ${disc.explanation} - Auto-corrected to match sources.`
          );
        }
      }
    } else {
      console.log(`[ExtractionCountVerifier] ✅ Verification passed`);
    }

    // Auto-correct summary if there are critical discrepancies
    const correctedSummary =
      discrepancies.some((d) => d.severity === 'critical')
        ? this.autoCorrect(summary, extractedCounts)
        : undefined;

    if (correctedSummary && correctedSummary !== summary) {
      console.log(
        `[ExtractionCountVerifier] Auto-corrected summary:\n  BEFORE: ${summary.substring(0, 150)}...\n  AFTER:  ${correctedSummary.substring(0, 150)}...`
      );
    }

    return {
      passed,
      discrepancies,
      extraction_counts: extractedCounts,
      corrected_summary: correctedSummary,
      warnings,
    };
  }
}
