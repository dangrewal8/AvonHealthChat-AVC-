/**
 * Reasoning Prompt Builder Service
 *
 * Phase 6: Reasoning Generation
 *
 * Builds prompts with clinical reasoning context for the LLM.
 * Transforms retrieved chunks into reasoning-rich prompts that help
 * the LLM understand clinical relationships and provide rationale.
 *
 * Key Features:
 * - Adds clinical context to prompts
 * - Includes relationship explanations
 * - Provides reasoning instructions
 * - Cross-references related artifacts
 *
 * Example Transformation:
 * Before: "Patient is on Atorvastatin"
 * After: "Patient is on Atorvastatin 40mg daily for Hyperlipidemia (ICD-10: E78.5).
 *         This medication was prescribed to manage elevated cholesterol as part of
 *         cardiovascular risk reduction, particularly relevant given the patient's
 *         comorbid Type 2 Diabetes."
 */

import { EnhancedRetrievalCandidate } from './multi-hop-retriever.service';
import { StructuredQuery } from './query-understanding-agent.service';

/**
 * Reasoning Context for a single artifact
 */
export interface ReasoningContext {
  artifact_id: string;
  artifact_type: string;
  primary_text: string; // Main chunk text
  enriched_text?: string; // Enriched version with context
  clinical_rationale?: string; // Why this artifact exists
  related_conditions?: string[]; // Related condition names
  related_medications?: string[]; // Related medication names
  temporal_context?: string; // When this occurred relative to other events
  relationships: {
    type: string; // 'treats', 'diagnosed_with', 'manages', etc.
    target: string; // Related artifact
    confidence: number;
  }[];
}

/**
 * Reasoning Prompt with full clinical context
 */
export interface ReasoningPrompt {
  system_prompt: string; // Instructions for the LLM
  context_section: string; // Clinical context and relationships
  query_section: string; // The actual user query
  reasoning_instructions: string; // How to reason about the answer
  full_prompt: string; // Complete prompt ready for LLM
}

class ReasoningPromptBuilderService {
  /**
   * Build reasoning-rich prompt from retrieval candidates
   *
   * Main entry point - transforms retrieved chunks into a prompt
   * that includes clinical reasoning context
   */
  async buildPrompt(
    query: StructuredQuery,
    candidates: EnhancedRetrievalCandidate[],
    options?: {
      includeRelationships?: boolean; // Include relationship explanations (default: true)
      includeRationale?: boolean; // Include clinical rationale (default: true)
      maxContextChunks?: number; // Limit context chunks (default: 10)
      reasoningStyle?: 'detailed' | 'concise'; // Reasoning verbosity (default: 'detailed')
    }
  ): Promise<ReasoningPrompt> {
    const opts = {
      includeRelationships: options?.includeRelationships !== false,
      includeRationale: options?.includeRationale !== false,
      maxContextChunks: options?.maxContextChunks || 10,
      reasoningStyle: options?.reasoningStyle || 'detailed',
    };

    console.log(
      `[Reasoning Prompt Builder] Building prompt for query: "${query.original_query}"`
    );

    // Step 1: Extract reasoning context from candidates
    const contexts = await this.extractReasoningContexts(candidates, opts.maxContextChunks);

    // Step 2: Build system prompt with reasoning instructions
    const systemPrompt = this.buildSystemPrompt(query.intent, opts.reasoningStyle);

    // Step 3: Build context section with clinical relationships
    const contextSection = this.buildContextSection(contexts, opts);

    // Step 4: Build query section
    const querySection = this.buildQuerySection(query);

    // Step 5: Build reasoning instructions
    const reasoningInstructions = this.buildReasoningInstructions(query.intent, opts);

    // Step 6: Combine into full prompt
    const fullPrompt = this.combinePrompt(
      systemPrompt,
      contextSection,
      querySection,
      reasoningInstructions
    );

    console.log(
      `[Reasoning Prompt Builder] ✓ Built prompt with ${contexts.length} context chunks`
    );

    return {
      system_prompt: systemPrompt,
      context_section: contextSection,
      query_section: querySection,
      reasoning_instructions: reasoningInstructions,
      full_prompt: fullPrompt,
    };
  }

  /**
   * Extract reasoning contexts from retrieval candidates
   */
  private async extractReasoningContexts(
    candidates: EnhancedRetrievalCandidate[],
    maxChunks: number
  ): Promise<ReasoningContext[]> {
    const contexts: ReasoningContext[] = [];

    const limitedCandidates = candidates.slice(0, maxChunks);

    for (const candidate of limitedCandidates) {
      const context: ReasoningContext = {
        artifact_id: candidate.chunk.artifact_id,
        artifact_type: candidate.metadata.artifact_type,
        primary_text: candidate.chunk.content,
        enriched_text: candidate.enriched_text,
        clinical_rationale: this.extractRationale(candidate),
        related_conditions: this.extractRelatedConditions(candidate),
        related_medications: this.extractRelatedMedications(candidate),
        temporal_context: this.buildTemporalContext(candidate),
        relationships: this.buildRelationships(candidate),
      };

      contexts.push(context);
    }

    return contexts;
  }

  /**
   * Build system prompt with reasoning instructions
   */
  private buildSystemPrompt(intent: string, reasoningStyle: string): string {
    const basePrompt = `You are a clinical reasoning assistant helping healthcare providers understand patient information.

Your role is to:
1. Analyze clinical data with attention to relationships between diagnoses, medications, and treatments
2. Provide evidence-based reasoning for clinical decisions
3. Identify important connections between different aspects of patient care
4. Present information clearly with clinical rationale

CRITICAL CONSISTENCY REQUIREMENTS:
- The short answer and detailed summary MUST report the same medications, diagnoses, and counts
- If the short answer mentions 2 medications, the detailed summary MUST also mention exactly 2 medications
- Do NOT introduce new information in the detailed summary that contradicts the short answer
- Ensure all sections (short answer, detailed summary, key information) are consistent and synchronized

TEMPORAL FILTERING REQUIREMENTS:
- Unless explicitly asked for historical data, report ONLY currently active medications
- Use the most recent date for each medication to determine if it's currently active
- Mark medications from older dates as "previously prescribed" if they don't appear in recent records
- Prioritize the most recent clinical data when multiple dates exist
- If a medication appears multiple times with different dates, use the MOST RECENT occurrence

ACCURACY REQUIREMENTS:
- State accurate counts: "The patient takes X medications" must match the actual count you list
- Avoid duplicates: Each medication should appear only once in your response
- Be precise: If you say "2 medications", list exactly 2, not 1 or 3`;

    const styleInstruction =
      reasoningStyle === 'detailed'
        ? `\n\nProvide detailed clinical reasoning, including:
- WHY medications are prescribed (indications, therapeutic goals)
- HOW diagnoses relate to treatments
- WHAT clinical considerations influenced decisions
- WHEN temporal relationships are clinically significant
- WHICH sources you used to determine current vs. historical status`
        : `\n\nProvide concise clinical reasoning focused on key points.`;

    return basePrompt + styleInstruction;
  }

  /**
   * Build context section with clinical relationships
   */
  private buildContextSection(
    contexts: ReasoningContext[],
    options: {
      includeRelationships: boolean;
      includeRationale: boolean;
    }
  ): string {
    let section = '## Clinical Context\n\n';

    // Group by artifact type
    const byType: Record<string, ReasoningContext[]> = {};
    contexts.forEach((ctx) => {
      if (!byType[ctx.artifact_type]) {
        byType[ctx.artifact_type] = [];
      }
      byType[ctx.artifact_type].push(ctx);
    });

    // Build sections by type
    Object.entries(byType).forEach(([type, ctxs]) => {
      section += `### ${this.formatArtifactType(type)}\n\n`;

      ctxs.forEach((ctx, idx) => {
        // Use enriched text if available, otherwise primary text
        const text = ctx.enriched_text || ctx.primary_text;
        section += `${idx + 1}. ${text}\n`;

        // Add clinical rationale if available and requested
        if (options.includeRationale && ctx.clinical_rationale) {
          section += `   **Rationale:** ${ctx.clinical_rationale}\n`;
        }

        // Add relationships if requested
        if (options.includeRelationships && ctx.relationships.length > 0) {
          section += `   **Related to:** `;
          const relTexts = ctx.relationships.map(
            (r) => `${r.target} (${r.type}, ${(r.confidence * 100).toFixed(0)}% confidence)`
          );
          section += relTexts.join(', ') + '\n';
        }

        // Add temporal context if available
        if (ctx.temporal_context) {
          section += `   **Timing:** ${ctx.temporal_context}\n`;
        }

        section += '\n';
      });
    });

    return section;
  }

  /**
   * Build query section
   */
  private buildQuerySection(query: StructuredQuery): string {
    let section = `## Patient Query\n\n`;
    section += `${query.original_query}\n\n`;

    // Add entity context if available
    if (query.entities && query.entities.length > 0) {
      section += `**Specific focus:** ${query.entities.map((e) => e.text).join(', ')}\n\n`;
    }

    return section;
  }

  /**
   * Build reasoning instructions
   */
  private buildReasoningInstructions(intent: string, options: any): string {
    let instructions = `## Reasoning Instructions\n\n`;

    instructions += `When formulating your response:\n\n`;
    instructions += `1. **Connect the dots:** Explain how medications, diagnoses, and treatments relate to each other\n`;
    instructions += `2. **Provide rationale:** For each clinical decision, explain the "why" based on the context\n`;
    instructions += `3. **Consider temporal relationships:** Note when timing of events is clinically significant\n`;
    instructions += `4. **Cross-reference:** When multiple artifacts relate to the same condition, synthesize the information\n`;
    instructions += `5. **Be evidence-based:** Ground your reasoning in the clinical data provided\n\n`;

    // Intent-specific instructions
    if (intent === 'RETRIEVE_MEDICATIONS') {
      instructions += `For medication queries:\n\n`;

      instructions += `**STEP 1: IDENTIFY CURRENT MEDICATIONS**\n`;
      instructions += `- Review all medication sources and their dates\n`;
      instructions += `- For each unique medication, identify the MOST RECENT date\n`;
      instructions += `- Medications from the most recent dates (within last 30-90 days) are considered CURRENTLY ACTIVE\n`;
      instructions += `- Older medications without recent records should be considered HISTORICAL/DISCONTINUED\n`;
      instructions += `- If a medication appears multiple times, use ONLY the most recent occurrence\n\n`;

      instructions += `**STEP 2: DEDUPLICATE MEDICATIONS**\n`;
      instructions += `- Remove duplicate medications (same name, different dates)\n`;
      instructions += `- Keep only ONE entry per unique medication (the most recent)\n`;
      instructions += `- Normalize medication names (e.g., "Atorvastatin" and "Atorvastatin Calcium" are the same)\n\n`;

      instructions += `**STEP 3: COUNT ACCURATELY**\n`;
      instructions += `- Count the deduplicated, currently active medications\n`;
      instructions += `- This count MUST match what you report in ALL sections (short answer, detailed summary, key information)\n`;
      instructions += `- Example: If you count 2 active medications, your short answer should say "2 medications" and detailed summary should list exactly 2\n\n`;

      instructions += `**STEP 4: FORMAT YOUR RESPONSE**\n`;
      instructions += `For EACH currently active medication, provide:\n`;
      instructions += `- Medication name, dosage, and frequency\n`;
      instructions += `- Indication (what condition it treats)\n`;
      instructions += `- Therapeutic goal or clinical rationale\n`;
      instructions += `- Related diagnoses that contextualize the prescription\n`;
      instructions += `- Source date (e.g., "as of Oct 1, 2024")\n\n`;

      instructions += `**STEP 5: BE TRANSPARENT**\n`;
      instructions += `- Explain your reasoning: "Based on the most recent records from [date], the patient is currently taking..."\n`;
      instructions += `- If there are historical medications, mention them separately: "Previously prescribed medications include..."\n`;
      instructions += `- If uncertain about current status, acknowledge it: "The most recent record from [date] shows..."\n\n`;

      instructions += `**CONSISTENCY CHECK**\n`;
      instructions += `Before finalizing, verify:\n`;
      instructions += `✓ Short answer count matches detailed summary count\n`;
      instructions += `✓ No duplicate medications in your response\n`;
      instructions += `✓ All medications listed are from recent dates (current, not historical)\n`;
      instructions += `✓ Counts are accurate: "X medications" means you list exactly X medications\n\n`;
    } else if (intent === 'RETRIEVE_DIAGNOSIS') {
      instructions += `For diagnosis queries:\n`;
      instructions += `- State the diagnosis with any relevant codes (ICD-10)\n`;
      instructions += `- Explain how it's being managed (medications, treatments)\n`;
      instructions += `- Note the diagnostic timeline if relevant\n`;
      instructions += `- Connect to related conditions or treatments\n\n`;
    }

    return instructions;
  }

  /**
   * Combine all sections into full prompt
   */
  private combinePrompt(
    systemPrompt: string,
    contextSection: string,
    querySection: string,
    reasoningInstructions: string
  ): string {
    return `${systemPrompt}\n\n---\n\n${contextSection}\n${querySection}\n${reasoningInstructions}`;
  }

  /**
   * Extract clinical rationale from candidate
   */
  private extractRationale(candidate: EnhancedRetrievalCandidate): string | undefined {
    // Look for rationale in enriched text
    if (candidate.enriched_text) {
      // Simple extraction - look for common rationale patterns
      const patterns = [
        /prescribed for ([^.]+)/i,
        /indicated for ([^.]+)/i,
        /to treat ([^.]+)/i,
        /to manage ([^.]+)/i,
      ];

      for (const pattern of patterns) {
        const match = candidate.enriched_text.match(pattern);
        if (match) {
          return match[1].trim();
        }
      }
    }

    return undefined;
  }

  /**
   * Extract related conditions from candidate
   */
  private extractRelatedConditions(candidate: EnhancedRetrievalCandidate): string[] {
    const conditions: string[] = [];

    if (candidate.enriched_text) {
      // Look for "Related Conditions:" section in enriched text
      const match = candidate.enriched_text.match(/Related Conditions:([^.]+)/i);
      if (match) {
        const conditionText = match[1].trim();
        // Split by comma and clean up
        const parts = conditionText.split(',').map((c) => c.trim());
        conditions.push(...parts.slice(0, 5)); // Limit to 5
      }
    }

    return conditions;
  }

  /**
   * Extract related medications from candidate
   */
  private extractRelatedMedications(candidate: EnhancedRetrievalCandidate): string[] {
    const medications: string[] = [];

    if (candidate.enriched_text) {
      // Look for "Related Medications:" section
      const match = candidate.enriched_text.match(/Related Medications:([^.]+)/i);
      if (match) {
        const medText = match[1].trim();
        const parts = medText.split(',').map((m) => m.trim());
        medications.push(...parts.slice(0, 5));
      }
    }

    return medications;
  }

  /**
   * Build temporal context from candidate metadata
   */
  private buildTemporalContext(candidate: EnhancedRetrievalCandidate): string | undefined {
    if (candidate.metadata.date) {
      const date = new Date(candidate.metadata.date);
      const now = new Date();
      const daysAgo = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      if (daysAgo === 0) {
        return 'Today';
      } else if (daysAgo === 1) {
        return 'Yesterday';
      } else if (daysAgo < 7) {
        return `${daysAgo} days ago`;
      } else if (daysAgo < 30) {
        const weeks = Math.floor(daysAgo / 7);
        return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
      } else if (daysAgo < 365) {
        const months = Math.floor(daysAgo / 30);
        return `${months} month${months > 1 ? 's' : ''} ago`;
      } else {
        const years = Math.floor(daysAgo / 365);
        return `${years} year${years > 1 ? 's' : ''} ago`;
      }
    }

    return undefined;
  }

  /**
   * Build relationships from candidate
   */
  private buildRelationships(candidate: EnhancedRetrievalCandidate): ReasoningContext['relationships'] {
    const relationships: ReasoningContext['relationships'] = [];

    // Extract from relationship_path if available
    if (candidate.relationship_path && candidate.relationship_path.length > 0) {
      // Simplified - in real implementation, would look up relationship details
      candidate.relationship_path.forEach((relId) => {
        relationships.push({
          type: 'related_to',
          target: relId,
          confidence: 0.8,
        });
      });
    }

    return relationships;
  }

  /**
   * Format artifact type for display
   */
  private formatArtifactType(type: string): string {
    const formatted: Record<string, string> = {
      medication: 'Medications',
      condition: 'Diagnoses & Conditions',
      care_plan: 'Care Plans',
      lab_result: 'Laboratory Results',
      procedure: 'Procedures',
      note: 'Clinical Notes',
    };

    return formatted[type] || type.charAt(0).toUpperCase() + type.slice(1);
  }
}

export const reasoningPromptBuilderService = new ReasoningPromptBuilderService();
export default reasoningPromptBuilderService;
