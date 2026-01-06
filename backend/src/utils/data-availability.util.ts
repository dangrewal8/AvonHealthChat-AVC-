/**
 * Data Availability Utility
 * Safe helper functions to check if data exists
 * Non-invasive - doesn't modify existing code flow
 */

export interface DataAvailabilityCheck {
  hasData: boolean;
  recordCount: number;
  dataType: string;
  message: string;
}

/**
 * Check if context indicates no data is available
 * Used to detect when LLM should say "not available"
 */
export function checkDataAvailability(context: string, dataType: string): DataAvailabilityCheck {
  const contextLower = context.toLowerCase();

  // Indicators that no data exists
  const noDataIndicators = [
    '0 records',
    '0 meds',
    '0 conditions',
    '0 allergies',
    '0 notes',
    'no relevant patient data',
    'no meaningful content',
    'not available',
    'not documented',
    'no data available'
  ];

  const hasNoDataIndicator = noDataIndicators.some(indicator =>
    contextLower.includes(indicator.toLowerCase())
  );

  // ENHANCED: Check for JSON-style counts (e.g., "appointments":0 or "family_history":0)
  const jsonCountPattern = new RegExp(`"${dataType}":\\s*0`, 'i');
  const hasZeroCountInJSON = jsonCountPattern.test(context);

  // Extract record count if available
  const recordCountMatch = context.match(/(\d+)\s+(record|medication|condition|allergy|note|document|appointment|insurance|family history)/i);
  const recordCount = recordCountMatch ? parseInt(recordCountMatch[1]) : -1;

  const hasData = !hasNoDataIndicator && !hasZeroCountInJSON && recordCount !== 0;

  return {
    hasData,
    recordCount: hasZeroCountInJSON ? 0 : recordCount,
    dataType,
    message: hasData
      ? `Data available for ${dataType} (${recordCount >= 0 ? recordCount : 'unknown'} records)`
      : `No data available for ${dataType}`
  };
}

/**
 * Generate standard "not available" response
 * Ensures consistent messaging across the system
 */
export function generateNoDataResponse(dataType: string): {
  short_answer: string;
  detailed_summary: string;
} {
  const dataTypeReadable = dataType.replace(/_/g, ' ');

  return {
    short_answer: `This information is not available in the patient's current records.`,
    detailed_summary: `No ${dataTypeReadable} data is documented for this patient. The system cannot provide information that doesn't exist in the medical records. Please consult with the patient directly or check if additional records need to be uploaded to the system.`
  };
}

/**
 * Detect data type from query
 * Helps route queries to appropriate validation
 */
export function detectDataType(query: string): string[] {
  const queryLower = query.toLowerCase();
  const detectedTypes: string[] = [];

  const patterns: Record<string, RegExp[]> = {
    family_history: [/family|genetic|hereditary|parent|sibling|maternal|paternal/i],
    appointments: [/appointment|scheduled|visit|next.*see|upcoming/i],
    insurance_policies: [/insurance|coverage|policy|copay|deductible|provider/i],
    medications: [/medication|medicine|drug|prescription|pill/i],
    conditions: [/condition|diagnosis|disease|illness/i],
    allergies: [/allergy|allergies|allergic|reaction/i],
    vitals: [/vital|blood pressure|heart rate|temperature|bp/i],
    care_plans: [/care plan|treatment plan|plan of care/i],
    notes: [/note|visit|encounter|assessment/i],
    documents: [/document|file|report|lab result|imaging/i]
  };

  for (const [dataType, regexList] of Object.entries(patterns)) {
    if (regexList.some(regex => regex.test(queryLower))) {
      detectedTypes.push(dataType);
    }
  }

  return detectedTypes;
}

/**
 * Check if query expects data to exist
 * Helps determine if "not available" is appropriate
 */
export function queryExpectsData(query: string): boolean {
  const queryLower = query.toLowerCase();

  // Question patterns that expect data
  const dataExpectingPatterns = [
    /^what (is|are|was|were)/i,
    /^does .* have/i,
    /^how many/i,
    /^when (was|is|did|were)/i,
    /^who/i,
    /^which/i,
    /^where/i,
    /list/i,
    /show/i,
    /tell me about/i
  ];

  return dataExpectingPatterns.some(pattern => pattern.test(query));
}

/**
 * Validate that "not available" response is appropriate
 * Returns true if response correctly handles no-data scenario
 */
export function validateNoDataResponse(
  response: string,
  hasData: boolean
): { valid: boolean; issue?: string } {

  const responseLower = response.toLowerCase();

  const noDataPhrases = [
    'not available',
    'no information',
    'not documented',
    'no records',
    'not found',
    'no data',
    'cannot be determined',
    'no.*documented'
  ];

  const hasNoDataPhrase = noDataPhrases.some(phrase => {
    const regex = new RegExp(phrase, 'i');
    return regex.test(responseLower);
  });

  // Case 1: No data exists
  if (!hasData) {
    if (!hasNoDataPhrase) {
      return {
        valid: false,
        issue: 'Data does not exist but response provides information (potential hallucination)'
      };
    }
    return { valid: true };
  }

  // Case 2: Data exists
  if (hasData) {
    if (hasNoDataPhrase) {
      return {
        valid: false,
        issue: 'Data exists but response says "not available" (false negative)'
      };
    }
    return { valid: true };
  }

  return { valid: true };
}
