/**
 * Ollama Service
 * Handles embeddings and LLM generation using local Ollama instance
 * HIPAA-compliant - all processing stays local
 */
export declare class OllamaService {
    private client;
    private embeddingModel;
    private defaultLlmModel;
    private maxTokens;
    private temperature;
    constructor(baseUrl: string, embeddingModel: string, defaultLlmModel: string, maxTokens: number, temperature: number);
    /**
     * Check if Ollama service is available
     */
    healthCheck(): Promise<boolean>;
    /**
     * Generate embedding for text using nomic-embed-text
     * Returns 768-dimensional vector
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * Generate text using specified LLM model
     * @param prompt - The input prompt
     * @param systemPrompt - Optional system instruction
     * @param temperature - Sampling temperature (0.0 to 1.0)
     * @param format - Optional output format ('json' or undefined)
     * @param model - Optional specific model to use (defaults to configured model)
     */
    generate(prompt: string, systemPrompt?: string, temperature?: number, format?: 'json' | undefined, model?: string): Promise<string>;
    /**
     * Generate structured answer from retrieved documents
     * ENHANCED with extensive medical question-answering guidelines
     */
    generateRAGAnswer(query: string, context: string, conversationHistory?: Array<{
        role: string;
        content: string;
    }>): Promise<{
        short_answer: string;
        detailed_summary: string;
    }>;
    /**
     * Chain-of-Thought Reasoning for Complex Medical Questions
     * Enables multi-step reasoning and dynamic data analysis
     * @param model - Optional specific model to use for reasoning
     */
    reasonWithChainOfThought(query: string, patientData: {
        patient: any;
        care_plans: any[];
        medications: any[];
        notes: any[];
        allergies: any[];
        conditions: any[];
        vitals: any[];
        family_history: any[];
        appointments: any[];
        documents: any[];
        form_responses: any[];
        insurance_policies: any[];
    }, conversationHistory?: Array<{
        role: string;
        content: string;
    }>, model?: string): Promise<{
        short_answer: string;
        detailed_summary: string;
        reasoning_chain: string[];
    }>;
    /**
     * Extract structured information from text
     */
    extractStructuredInfo(text: string, targetTypes: string[]): Promise<Array<{
        type: string;
        value: string;
        confidence: number;
    }>>;
}
//# sourceMappingURL=ollama.service.d.ts.map