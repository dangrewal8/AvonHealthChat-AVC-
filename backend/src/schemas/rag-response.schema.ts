/**
 * PHASE 2: JSON Schema Validation with Zod
 * Eliminates parsing errors and ensures consistent LLM output format
 */

import { z } from 'zod';

/**
 * Schema for LLM RAG response
 * Enforces structured output format to prevent parsing failures
 */
export const RAGResponseSchema = z.object({
  short_answer: z.string().min(10, 'Short answer must be at least 10 characters').max(500, 'Short answer too long'),
  detailed_summary: z.string().min(20, 'Detailed summary must be at least 20 characters'),
  reasoning: z.array(z.string()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  sources_cited: z.array(z.string()).optional(),
});

export type RAGResponse = z.infer<typeof RAGResponseSchema>;

/**
 * Schema for Chain of Verification response
 */
export const CoVeResponseSchema = z.object({
  verification_questions: z.array(z.string()).min(3).max(5),
  verification_answers: z.array(
    z.object({
      question: z.string(),
      answer: z.enum(['YES', 'NO']),
      explanation: z.string(),
    })
  ),
  verified_answer: z.string().min(10),
  verification_passed: z.boolean(),
});

export type CoVeResponse = z.infer<typeof CoVeResponseSchema>;

/**
 * Schema for structured medical extractions
 */
export const MedicalExtractionSchema = z.object({
  type: z.enum(['medication', 'condition', 'allergy', 'vital', 'procedure']),
  value: z.string(),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  active: z.boolean().optional(),
  confidence: z.number().min(0).max(1),
});

export type MedicalExtraction = z.infer<typeof MedicalExtractionSchema>;

/**
 * Validation helper: Parse and validate LLM response
 * Auto-retry if validation fails
 */
export async function validateRAGResponse(
  rawResponse: string,
  retryFn?: () => Promise<string>
): Promise<{ valid: boolean; data?: RAGResponse; errors?: string[] }> {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(rawResponse);

    // Validate against schema
    const result = RAGResponseSchema.safeParse(parsed);

    if (result.success) {
      return {
        valid: true,
        data: result.data,
      };
    } else {
      const errors = result.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`);
      console.warn('⚠️  RAG response validation failed:', errors);

      // Auto-retry if function provided
      if (retryFn) {
        console.log('   🔄 Retrying LLM call...');
        const retryResponse = await retryFn();
        return validateRAGResponse(retryResponse); // Recursive call without retry
      }

      return {
        valid: false,
        errors,
      };
    }
  } catch (error: any) {
    console.error('❌ Failed to parse RAG response as JSON:', error.message);

    // Try regex extraction as fallback
    const shortMatch = rawResponse.match(/short_answer['":\s]+(.*?)(?=[,}])/i);
    const detailedMatch = rawResponse.match(/detailed_summary['":\s]+(.*?)(?=[,}])/is);

    if (shortMatch && detailedMatch) {
      console.log('   ✅ Extracted using regex fallback');
      return {
        valid: true,
        data: {
          short_answer: shortMatch[1].trim(),
          detailed_summary: detailedMatch[1].trim(),
        },
      };
    }

    return {
      valid: false,
      errors: ['Failed to parse response as JSON or extract with regex'],
    };
  }
}

/**
 * Validate temporal filtering date range
 */
export const TimeWindowSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  expression: z.string(), // Original temporal expression
});

export type TimeWindow = z.infer<typeof TimeWindowSchema>;
