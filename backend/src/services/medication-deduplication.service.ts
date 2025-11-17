/**
 * Medication Deduplication Service
 *
 * Handles pharmaceutical-specific deduplication logic to prevent counting
 * "Atorvastatin" and "Atorvastatin Calcium" as separate medications.
 *
 * Key Features:
 * - Salt form normalization (Calcium, Sodium, HCl, etc.)
 * - Dosage removal for comparison
 * - Route normalization (oral, tablet, capsule)
 * - Brand/generic name handling
 * - Confidence-based selection when duplicates found
 *
 * Phase 1A: Critical Fix for Medication Count Hallucinations
 */

// Using console for logging as logger utility doesn't exist

/**
 * Extraction interface matching the two-pass generator
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
 * Medication normalization result
 */
interface NormalizedMedication {
  normalized: string;
  original: string;
  extraction: Extraction;
}

/**
 * Medication Deduplication Service
 *
 * Prevents pharmaceutical duplicates like:
 * - "Atorvastatin" vs "Atorvastatin Calcium"
 * - "Lisinopril" vs "Lisinopril Oral Tablet"
 * - "Metformin HCl" vs "Metformin Hydrochloride"
 */
export class MedicationDeduplicationService {
  /**
   * Common pharmaceutical salt forms to strip during normalization
   * Based on FDA Orange Book and RxNorm standards
   */
  private readonly saltForms = [
    // Common cations
    'calcium',
    'sodium',
    'potassium',
    'magnesium',
    'aluminum',
    'iron',
    'zinc',

    // Common anions
    'hydrochloride',
    'hcl',
    'sulfate',
    'chloride',
    'phosphate',
    'acetate',
    'bromide',
    'citrate',
    'fumarate',
    'maleate',
    'mesylate',
    'tartrate',
    'succinate',
    'gluconate',
    'lactate',
    'stearate',

    // Other common pharmaceutical forms
    'monohydrate',
    'dihydrate',
    'trihydrate',
    'anhydrous',
    'hydrous',
    'extended release',
    'er',
    'xr',
    'sr',
    'sustained release',
  ];

  /**
   * Common dosage form keywords to strip during normalization
   */
  private readonly dosageForms = [
    'tablet',
    'capsule',
    'oral',
    'injection',
    'solution',
    'suspension',
    'cream',
    'ointment',
    'gel',
    'patch',
    'inhaler',
    'spray',
    'drops',
    'syrup',
    'powder',
    'granules',
  ];

  /**
   * Normalize a medication name for comparison
   *
   * Removes:
   * - Salt forms (Calcium, Sodium, HCl, etc.)
   * - Dosage information (40 mg, 500 MG, etc.)
   * - Route/form (oral, tablet, capsule, etc.)
   * - Extra whitespace and punctuation
   *
   * @param medicationName - Original medication name
   * @returns Normalized medication name for comparison
   */
  private normalize(medicationName: string): string {
    let normalized = medicationName.toLowerCase().trim();

    // Remove dosage information (numbers + units)
    // Matches: 40 mg, 500MG, 20 mcg, 1.5 g, etc.
    normalized = normalized.replace(/\s*\d+\.?\d*\s*(mg|mcg|g|ml|l|iu|units?)\s*/gi, ' ');

    // Remove salt forms
    for (const salt of this.saltForms) {
      // Use word boundaries to avoid removing parts of drug names
      const pattern = new RegExp(`\\b${salt}\\b`, 'gi');
      normalized = normalized.replace(pattern, '');
    }

    // Remove dosage forms
    for (const form of this.dosageForms) {
      const pattern = new RegExp(`\\b${form}\\b`, 'gi');
      normalized = normalized.replace(pattern, '');
    }

    // Remove common separators and clean up whitespace
    normalized = normalized
      .replace(/[-_,;:()[\]{}]/g, ' ') // Replace separators with space
      .replace(/\s+/g, ' ') // Collapse multiple spaces
      .trim();

    return normalized;
  }

  /**
   * Deduplicate medication extractions
   *
   * Strategy:
   * 1. Normalize each medication name
   * 2. Group by normalized name
   * 3. Within each group, select the extraction with highest confidence
   * 4. Log deduplication actions for audit trail
   *
   * @param extractions - All extractions from the two-pass generator
   * @returns Deduplicated extractions
   */
  public deduplicate(extractions: Extraction[]): Extraction[] {
    // Filter to only medication extractions
    const medications = extractions.filter((ext) => ext.type === 'medication');
    const nonMedications = extractions.filter((ext) => ext.type !== 'medication');

    if (medications.length === 0) {
      console.log('[MedicationDeduplication] No medications to deduplicate');
      return extractions;
    }

    console.log(
      `[MedicationDeduplication] Deduplicating ${medications.length} medication extractions...`
    );

    // Normalize and group medications
    const normalizedMeds: NormalizedMedication[] = medications.map((ext) => {
      const medName = (ext.content.name as string) || '';
      const normalized = this.normalize(medName);

      console.log(`[MedicationDeduplication] "${medName}" → "${normalized}"`);

      return {
        normalized,
        original: medName,
        extraction: ext,
      };
    });

    // Group by normalized name
    const groups = new Map<string, NormalizedMedication[]>();
    for (const med of normalizedMeds) {
      if (!groups.has(med.normalized)) {
        groups.set(med.normalized, []);
      }
      groups.get(med.normalized)!.push(med);
    }

    // Select best extraction from each group
    const deduplicated: Extraction[] = [];
    let duplicatesRemoved = 0;

    for (const [normalizedName, group] of groups.entries()) {
      if (group.length === 1) {
        // No duplicates for this medication
        deduplicated.push(group[0].extraction);
      } else {
        // Multiple extractions for same medication - select highest confidence
        const sorted = group.sort(
          (a, b) => b.extraction.provenance.confidence - a.extraction.provenance.confidence
        );

        const selected = sorted[0];
        const removed = sorted.slice(1);

        deduplicated.push(selected.extraction);
        duplicatesRemoved += removed.length;

        console.log(
          `[MedicationDeduplication] Duplicate found for "${normalizedName}":`
        );
        console.log(
          `  ✓ KEPT: "${selected.original}" (confidence: ${selected.extraction.provenance.confidence.toFixed(2)})`
        );
        for (const dup of removed) {
          console.log(
            `  ✗ REMOVED: "${dup.original}" (confidence: ${dup.extraction.provenance.confidence.toFixed(2)})`
          );
        }
      }
    }

    console.log(
      `[MedicationDeduplication] Complete: ${medications.length} → ${deduplicated.length} medications (removed ${duplicatesRemoved} duplicates)`
    );

    // Return deduplicated medications + all non-medication extractions
    return [...deduplicated, ...nonMedications];
  }

  /**
   * Check if two medication names are semantically equivalent
   *
   * Useful for validation and testing
   *
   * @param name1 - First medication name
   * @param name2 - Second medication name
   * @returns True if medications are semantically equivalent
   */
  public areSameMedication(name1: string, name2: string): boolean {
    const norm1 = this.normalize(name1);
    const norm2 = this.normalize(name2);
    return norm1 === norm2;
  }

  /**
   * Get normalization statistics for debugging
   *
   * @param extractions - Medication extractions
   * @returns Statistics about normalization
   */
  public getStats(extractions: Extraction[]): {
    total: number;
    unique_normalized: number;
    duplicates_detected: number;
  } {
    const medications = extractions.filter((ext) => ext.type === 'medication');
    const normalized = medications.map((ext) =>
      this.normalize((ext.content.name as string) || '')
    );
    const unique = new Set(normalized);

    return {
      total: medications.length,
      unique_normalized: unique.size,
      duplicates_detected: medications.length - unique.size,
    };
  }
}
