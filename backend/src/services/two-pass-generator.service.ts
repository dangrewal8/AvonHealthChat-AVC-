/**
 * Two-Pass Generator Service
 *
 * Implements two-pass generation to prevent hallucinations per ChatGPT specification:
 * - Pass 1: Extraction (temperature = 0) - Deterministic fact extraction
 * - Pass 2: Summarization (temperature = 0.3) - Natural language generation
 *
 * Why Two-Pass:
 * - Pass 1 ensures factual extraction with no hallucinations
 * - Pass 2 creates readable summary from extracted facts only
 * - Separation prevents model from inventing unsupported claims
 *
 */

import llmService from './llm-factory.service';
import { RetrievalCandidate } from './retriever-agent.service';
import { StructuredQuery } from './query-understanding-agent.service';
import extractionPromptBuilder, {
  Extraction,
} from './extraction-prompt-builder.service';
import { MedicationDeduplicationService } from './medication-deduplication.service';
import { ExtractionCountVerifierService } from './extraction-count-verifier.service';
// Using console for logging as logger utility doesn't exist

/**
 * Generated answer from summarization pass
 */
export interface GeneratedAnswer {
  short_answer: string; // Under 50 words
  detailed_summary: string; // Under 200 words
  model: string; // Model used
  tokens_used: number; // Total tokens consumed
  extractions_count: number; // Number of extractions summarized
  verification_warnings?: string[]; // Count verification warnings (Phase 1B)
}

/**
 * Complete two-pass result
 */
export interface TwoPassResult {
  extractions: Extraction[]; // Pass 1: Structured extractions
  summary: GeneratedAnswer; // Pass 2: Natural language summary
  pass1_tokens: number; // Tokens used in extraction
  pass2_tokens: number; // Tokens used in summarization
  total_tokens: number; // Combined token usage
  execution_time_ms: number; // Total execution time
}

/**
 * Two-pass generation configuration
 */
export interface TwoPassConfig {
  extraction_model: string; // Model for extraction (default: meditron)
  summarization_model: string; // Model for summarization (default: meditron)
  extraction_temperature: number; // Temperature for extraction (default: 0)
  summarization_temperature: number; // Temperature for summarization (default: 0.3)
  extraction_max_tokens: number; // Max tokens for extraction (default: 2000)
  summarization_max_tokens: number; // Max tokens for summarization (default: 500)
  enable_validation: boolean; // Validate extraction results (default: true)
}

/**
 * Two-Pass Generator Class
 *
 * Orchestrates two-pass generation using LLM factory (Ollama)
 */
class TwoPassGenerator {
  /**
   * Medication deduplication service for pharmaceutical normalization
   */
  private readonly medicationDeduplicator = new MedicationDeduplicationService();

  /**
   * Extraction count verifier for enforcing consistency between extractions and summarization
   */
  private readonly countVerifier = new ExtractionCountVerifierService();

  /**
   * Default configuration
   */
  private readonly DEFAULT_CONFIG: TwoPassConfig = {
    extraction_model: 'meditron', // Not used with factory (factory chooses model)
    summarization_model: 'meditron', // Not used with factory (factory chooses model)
    extraction_temperature: 0, // Deterministic
    summarization_temperature: 0.3, // Slightly creative
    extraction_max_tokens: 2000,
    summarization_max_tokens: 500,
    enable_validation: true,
  };

  /**
   * Summarization system prompt
   */
  private readonly SUMMARIZATION_SYSTEM_PROMPT = `You are a medical summarization assistant.

Your task: Create a concise, accurate summary of extracted information in natural, human-readable language.

Rules:
1. ONLY summarize the provided extractions - DO NOT add new information
2. Write in clear, professional medical language suitable for a chatbot
3. DO NOT include artifact IDs, chunk IDs, or technical metadata in your summary
4. Focus on clinical facts: medications, dosages, conditions, dates, and findings
5. Keep the short answer under 50 words
6. Keep the detailed summary under 200 words
7. Be specific and precise with medical details (drug names, dosages, dates)
8. If no relevant information found, clearly state that
9. CRITICAL: ALWAYS generate a fresh answer from the provided extractions. NEVER copy or reuse previous answers, even if the question seems similar. Each answer must be uniquely generated to prevent patient data mixing.

CRITICAL CONSISTENCY REQUIREMENTS:
- If you receive 3 medication extractions, you MUST mention ALL 3 medications in your summary
- The short answer and detailed summary MUST be consistent with each other and with the extractions
- DO NOT cherry-pick or omit extractions - include ALL provided extractions in your answer
- If the extractions show 3 items, your answer should clearly indicate all 3 items
- Example: If given extractions for "Atorvastatin", "Sertraline", and "Simvastatin", ALL THREE must appear in your answer
- Count accuracy: If you say "X medications", that count MUST match the number of medication extractions you received
- Every extraction provided to you is relevant and must be included in the summary

CRITICAL MEDICATION SUMMARIZATION RULES:
- NEVER confuse medication ROUTE (how taken) with INDICATION (why prescribed)
- Route examples: "oral tablet", "oral capsule", "IV", "topical" - these describe HOW the medication is administered
- Indication examples: "for diabetes", "for depression", "for hypertension" - these describe WHY it's prescribed
- If extraction shows route="oral - tablet" and indication=null, DO NOT say "prescribed for oral tablet use"
- If indication is null/unknown, MUST acknowledge this and guide user to refer to source:
  * "The patient is taking [medication name]. The specific medical indication is not documented in the available records. Please refer to the source medical records for prescribing information."
  * "[Medication name] is prescribed, but the reason for prescription is not specified in the sources. Refer to the original medical documentation for indication details."
  * "While [medication name] is in the patient's medication list, the indication is not available in these records. Please consult the source documents for the reason it was prescribed."
- For multiple medications with unknown indications:
  * "The patient is taking [list medications]. While these medications are documented, the specific medical reasons for prescription are not specified in the available records. Please refer to the source medical documentation for prescribing indications."
- When indication IS known, be specific: "prescribed for [condition]", "to manage [condition]", "for treatment of [condition]"
- If route is mentioned, present it separately: "taken as an oral tablet" or "administered via [route]"

Output Format:
CRITICAL: Respond with ONLY the answer text - NO LABELS, NO PREFIXES of any kind.
DO NOT write "Short answer:", "Detailed summary:", "Answer:", "Summary:", or any other labels.

Line 1: Your concise answer (under 50 words) - Start directly with the answer
[blank line]
Line 3+: Additional details (under 200 words) - Continue directly with more context

CORRECT Example (with known indications):
The patient is taking Atorvastatin 10mg, Lisinopril 20mg, and Metformin 500mg.

These medications were prescribed for cholesterol management, blood pressure control, and diabetes management respectively. The patient should take Atorvastatin in the evening, Lisinopril in the morning, and Metformin with meals twice daily.

CORRECT Example (with unknown indications):
The patient is taking Sertraline, Lisinopril 20mg, and Metformin 500mg.

The patient's current medications include Sertraline (oral capsule), Lisinopril 20mg oral tablet, and Metformin 500mg. While the dosages and administration routes are documented, the specific medical indications for Sertraline are not specified in the available records. Lisinopril is typically used for blood pressure management, and Metformin for diabetes control. Please refer to the original medical records for complete prescribing information.

WRONG Examples (DO NOT DO THIS):
Short answer: The patient is taking...
Detailed summary: These medications were...
Answer: The patient is taking...`;


  /**
   * Generate answer using two-pass approach
   *
   * @param candidates - Retrieval candidates
   * @param query - Structured query
   * @param config - Optional configuration override
   * @returns Complete two-pass result
   */
  async generateAnswer(
    candidates: RetrievalCandidate[],
    query: StructuredQuery,
    config: Partial<TwoPassConfig> = {}
  ): Promise<TwoPassResult> {
    const startTime = Date.now();
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };

    // Pass 1: Extraction (temperature = 0)
    const { extractions, tokens: pass1Tokens } = await this.extractionPass(
      candidates,
      query,
      finalConfig
    );

    // Pass 2: Summarization (temperature = 0.3)
    const { summary, tokens: pass2Tokens } = await this.summarizationPass(
      extractions,
      query,
      finalConfig
    );

    const executionTime = Date.now() - startTime;

    return {
      extractions,
      summary,
      pass1_tokens: pass1Tokens,
      pass2_tokens: pass2Tokens,
      total_tokens: pass1Tokens + pass2Tokens,
      execution_time_ms: executionTime,
    };
  }

  /**
   * Pass 1: Extraction (temperature = 0)
   *
   * Extracts structured facts deterministically
   *
   * @param candidates - Retrieval candidates
   * @param query - Structured query
   * @param config - Configuration
   * @returns Structured extractions and token count
   */
  async extractionPass(
    candidates: RetrievalCandidate[],
    query: StructuredQuery,
    config: TwoPassConfig
  ): Promise<{ extractions: Extraction[]; tokens: number }> {
    // Build extraction prompt
    const fullPrompt = extractionPromptBuilder.buildFullPrompt(candidates, query, 'extraction');

    // Call LLM factory with temperature = 0 (uses Ollama provider)
    const result = await llmService.extract(
      fullPrompt.system_prompt,
      fullPrompt.user_prompt,
      config.extraction_temperature // 0 for deterministic
    );

    // Normalize extractions to handle provenance arrays (LLM sometimes returns arrays instead of objects)
    const normalizedExtractions = this.normalizeExtractions(result.extractions || []);

    // Validate if enabled - but don't fail completely, just filter out invalid extractions
    if (config.enable_validation) {
      const isValid = extractionPromptBuilder.validateExtractionResult({ extractions: normalizedExtractions });
      if (!isValid) {
        console.warn('[TwoPassGenerator] Some extractions failed validation, filtering invalid ones...');
        console.warn('[TwoPassGenerator] Raw extractions:', JSON.stringify(normalizedExtractions, null, 2));

        // Filter to keep only valid extractions instead of failing completely
        const validExtractions = normalizedExtractions.filter((extraction: any) => {
          const hasRequiredFields = extraction.type && extraction.content && extraction.provenance;
          if (!hasRequiredFields) {
            console.warn('[TwoPassGenerator] Skipping extraction - missing required fields:', extraction);
            return false;
          }

          const provenance = extraction.provenance;
          const hasValidProvenance =
            provenance.artifact_id &&
            provenance.chunk_id &&
            Array.isArray(provenance.char_offsets) &&
            provenance.char_offsets.length === 2 &&
            provenance.supporting_text;

          if (!hasValidProvenance) {
            console.warn('[TwoPassGenerator] Skipping extraction - invalid provenance:', extraction);
            return false;
          }

          return true;
        });

        console.log(`[TwoPassGenerator] Kept ${validExtractions.length} valid extractions out of ${normalizedExtractions.length} total`);
        normalizedExtractions = validExtractions;
      }
    }

    // Phase 1A: Pharmaceutical Deduplication
    // Apply medication-specific deduplication to handle:
    // - Salt forms: "Atorvastatin" vs "Atorvastatin Calcium"
    // - Dosage variations: "Lisinopril" vs "Lisinopril 20mg"
    // - Route/form variations: "Metformin" vs "Metformin Oral Tablet"
    console.log(
      `[TwoPassGenerator] Applying medication deduplication (before: ${normalizedExtractions.length} extractions)...`
    );

    const deduplicatedExtractions = this.medicationDeduplicator.deduplicate(
      normalizedExtractions as Extraction[]
    );

    console.log(
      `[TwoPassGenerator] Deduplication complete (after: ${deduplicatedExtractions.length} extractions)`
    );

    // Log statistics for audit trail
    const stats = this.medicationDeduplicator.getStats(normalizedExtractions as Extraction[]);
    if (stats.duplicates_detected > 0) {
      console.log(
        `[TwoPassGenerator] Medication deduplication stats: ${stats.total} medications → ${stats.unique_normalized} unique (removed ${stats.duplicates_detected} duplicates)`
      );
    }

    return {
      extractions: deduplicatedExtractions as Extraction[],
      tokens: result.totalTokens || 0,
    };
  }

  /**
   * Pass 2: Summarization (temperature = 0.3)
   *
   * Creates natural language summary from extractions
   *
   * @param extractions - Extracted facts from pass 1
   * @param query - Structured query
   * @param config - Configuration
   * @returns Generated answer and token count
   */
  async summarizationPass(
    extractions: Extraction[],
    query: StructuredQuery,
    config: TwoPassConfig
  ): Promise<{ summary: GeneratedAnswer; tokens: number }> {
    // Build summarization prompt from extractions
    const userPrompt = this.buildSummarizationPrompt(extractions, query);

    // Call LLM factory with temperature = 0.3 (uses Ollama provider)
    const result = await llmService.summarize(
      this.SUMMARIZATION_SYSTEM_PROMPT,
      userPrompt,
      config.summarization_temperature // 0.3 for slight creativity
    );

    // Parse response into short answer and detailed summary
    const lines = result.summary.split('\n').map(line => line.trim()).filter(line => line);

    // Extract short answer (first line, removing any labels/prefixes)
    let shortAnswer = lines[0] || 'No answer generated';
    // Remove common prefixes/labels that LLM might add despite instructions
    shortAnswer = shortAnswer
      .replace(/^(Short answer|Detailed summary|Summary|Answer|Here is|The answer is):\s*/i, '')
      .replace(/^(Short answer|Detailed summary|Summary|Answer)\s*$/i, '') // Remove if it's just the label alone
      .trim();

    // If first line was just a label, use second line as short answer
    if (!shortAnswer || shortAnswer.length < 3) {
      shortAnswer = lines[1] || 'No answer generated';
      shortAnswer = shortAnswer
        .replace(/^(Short answer|Detailed summary|Summary|Answer|Here is|The answer is):\s*/i, '')
        .trim();
    }

    // Extract detailed summary (all lines after short answer, removing label lines)
    let detailedLines = lines.slice(1).filter(line => {
      // Skip lines that are just labels
      return !(/^(Short answer|Detailed summary|Summary|Answer):\s*$/i.test(line)) &&
             !(/^(Short answer|Detailed summary|Summary|Answer)$/i.test(line));
    });

    // Remove label prefixes from detail lines
    detailedLines = detailedLines.map(line =>
      line.replace(/^(Short answer|Detailed summary|Summary|Answer|Here is|The answer is):\s*/i, '').trim()
    ).filter(line => line.length > 0);

    const detailedSummary = detailedLines.join('\n').trim() || shortAnswer;

    // Phase 1B: Count Verification
    // Verify that summarization counts match extraction counts
    console.log('[TwoPassGenerator] Running count verification...');
    const verification = this.countVerifier.verify(extractions, detailedSummary);

    // Use corrected summary if verification failed
    let finalShortAnswer = shortAnswer;
    let finalDetailedSummary = detailedSummary;

    if (verification.corrected_summary) {
      console.log('[TwoPassGenerator] ⚠️  Count verification FAILED - using corrected summary');
      finalDetailedSummary = verification.corrected_summary;

      // Also correct the short answer (use first line of corrected summary)
      const correctedLines = verification.corrected_summary.split('\n').map(line => line.trim()).filter(line => line);
      finalShortAnswer = correctedLines[0] || finalShortAnswer;

      console.log(`[TwoPassGenerator] Original short answer: "${shortAnswer}"`);
      console.log(`[TwoPassGenerator] Corrected short answer: "${finalShortAnswer}"`);
    } else {
      console.log('[TwoPassGenerator] ✅ Count verification passed');
    }

    // Get model info from factory
    const modelInfo = await llmService.getModelInfo();

    return {
      summary: {
        short_answer: finalShortAnswer,
        detailed_summary: finalDetailedSummary,
        model: `${modelInfo.provider}:${modelInfo.model}`,
        tokens_used: result.totalTokens || 0,
        extractions_count: extractions.length,
        verification_warnings: verification.warnings.length > 0 ? verification.warnings : undefined,
      },
      tokens: result.totalTokens || 0,
    };
  }

  /**
   * Build summarization prompt from extractions
   *
   * @param extractions - Extracted facts
   * @param query - Structured query
   * @returns Summarization user prompt
   */
  private buildSummarizationPrompt(extractions: Extraction[], query: StructuredQuery): string {
    if (extractions.length === 0) {
      return `Query: "${query.original_query}"

No relevant information was extracted from the provided chunks.

Provide a brief response indicating that no information was found.`;
    }

    const extractionsText = extractions
      .map((extraction, i) => {
        const content = JSON.stringify(extraction.content, null, 2);
        const provenance = extraction.provenance;

        return `Extraction ${i + 1}:
Type: ${extraction.type}
Content:
${content}

Supporting Evidence: "${provenance.supporting_text}"
`;
      })
      .join('\n\n');

    return `Query: "${query.original_query}"

Extracted Information:
${extractionsText}

Create a concise, natural-language summary that answers the query:
1. First line: Short answer (under 50 words) - Direct, clinical answer
2. Remaining lines: Detailed summary (under 200 words) - Clinical context and specifics

Remember: Write in natural medical language. DO NOT include artifact IDs or chunk IDs in your response.`;
  }

  /**
   * Get default configuration
   *
   * @returns Default two-pass config
   */
  getDefaultConfig(): TwoPassConfig {
    return { ...this.DEFAULT_CONFIG };
  }

  /**
   * Validate two-pass result
   *
   * @param result - Two-pass result to validate
   * @returns True if valid
   */
  validateResult(result: TwoPassResult): boolean {
    if (!result.extractions || !Array.isArray(result.extractions)) {
      return false;
    }

    if (!result.summary || !result.summary.short_answer || !result.summary.detailed_summary) {
      return false;
    }

    if (result.total_tokens !== result.pass1_tokens + result.pass2_tokens) {
      return false;
    }

    return true;
  }

  /**
   * Generate answer with retries
   *
   * @param candidates - Retrieval candidates
   * @param query - Structured query
   * @param config - Configuration
   * @param maxRetries - Maximum retry attempts (default: 3)
   * @returns Two-pass result
   */
  async generateAnswerWithRetries(
    candidates: RetrievalCandidate[],
    query: StructuredQuery,
    config: Partial<TwoPassConfig> = {},
    maxRetries: number = 3
  ): Promise<TwoPassResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.generateAnswer(candidates, query, config);
      } catch (error) {
        lastError = error as Error;
        console.error(`Attempt ${attempt}/${maxRetries} failed:`, error);

        if (attempt < maxRetries) {
          // Exponential backoff
          const delayMs = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    throw new Error(`Two-pass generation failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  /**
   * Normalize extractions to handle provenance arrays
   *
   * Sometimes the LLM returns provenance as an array instead of a single object.
   * This method normalizes the data structure by taking the first provenance if it's an array.
   *
   * @param extractions - Raw extractions from LLM
   * @returns Normalized extractions with single provenance objects
   */
  private normalizeExtractions(extractions: any[]): Extraction[] {
    return extractions.map((extraction: any, index: number) => {
      // Check if provenance is an array (common LLM mistake)
      if (Array.isArray(extraction.provenance)) {
        console.warn(`[TwoPassGenerator] Extraction ${index}: Provenance is an array, taking first element`);

        // Take the first provenance object from the array
        const firstProvenance = extraction.provenance[0];

        return {
          ...extraction,
          provenance: firstProvenance,
        };
      }

      return extraction;
    });
  }

  /**
   * Explain why two-pass is used
   *
   * @returns Explanation of two-pass approach
   */
  explainTwoPass(): string {
    return `Two-Pass Generation Approach:

Pass 1: Extraction (Temperature = 0)
  - Deterministic fact extraction
  - Prevents hallucinations
  - Structured JSON output
  - Provenance tracking (char offsets + supporting text)

Pass 2: Summarization (Temperature = 0.3)
  - Natural language generation
  - ONLY from extracted facts
  - Slightly creative for readability
  - Cites sources

Why This Works:
  - Separation of concerns: facts vs. language
  - Pass 1 ensures accuracy (temp=0)
  - Pass 2 ensures readability (temp=0.3)
  - Model cannot invent claims in Pass 2 (only has extractions)

Result: Accurate, readable, grounded answers`;
  }

  /**
   * Get summarization system prompt
   *
   * @returns Summarization system prompt
   */
  getSummarizationSystemPrompt(): string {
    return this.SUMMARIZATION_SYSTEM_PROMPT;
  }
}

// Export singleton instance
const twoPassGenerator = new TwoPassGenerator();
export default twoPassGenerator;
