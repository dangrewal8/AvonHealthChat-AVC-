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
    }>, validationContext?: {
        structuredExtractions?: any[];
        provenance?: any[];
        patientData?: any;
    }): Promise<{
        short_answer: string;
        detailed_summary: string;
        validationApplied?: boolean;
        validationIssues?: string[];
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
    /**
     * COLLABORATIVE MULTI-MODEL ANSWER GENERATION (2-STAGE PIPELINE)
     *
     * STAGE 1: Llama 3 as Orchestrator
     * - Analyzes query and identifies data categories needed
     * - Creates focused extraction tasks for each specialized model
     * - Synthesizes final answer from all model outputs
     *
     * STAGE 2: Specialized Medical Models as Extractors (DEPRECATED - see generateFastAnswer)
     * - Meditron: Medical entity extraction (drug names, dosages, ICD codes) - 100% benchmark
     * - Llama 3: Temporal/timeline analysis and clinical reasoning - 95% avg, 100% medical Q&A
     *
     * NOTE: This collaborative pipeline is DEPRECATED. Production uses generateFastAnswer()
     * with 2-model architecture + fact-checking for better performance
     */
    generateCollaborativeAnswer(query: string, patientData: {
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
    }, structuredExtractions: Array<{
        type: string;
        value: string;
        relevance: number;
        confidence: number;
        source_artifact_id: string;
        supporting_text: string;
    }>): Promise<{
        short_answer: string;
        detailed_summary: string;
        reasoning_chain: string[];
        confidence: number;
        sources: Array<{
            artifact_id: string;
            artifact_type: string;
            relevant_excerpt: string;
            relevance_score: number;
        }>;
    }>;
    /**
     * OPTIMIZED FAST ANSWER GENERATION WITH FACT-CHECKING
     * Ultra-minimal context, short prompts, parallel execution
     * Always uses 2 models: Meditron for entities + Llama 3 for answer AND fact-checking
     */
    generateFastAnswer(query: string, patientData: any, structuredExtractions: any[], _modelCount?: 1 | 2 | 3): Promise<{
        short_answer: string;
        detailed_summary: string;
        reasoning_chain: string[];
        confidence: number;
        sources: any[];
    }>;
    /**
     * OPTIMIZED HYBRID 2-MODEL PIPELINE (2025 Research-Based)
     *
     * Pipeline:
     * - Stage 1 (Parallel): Meditron extraction + Llama3 answer → 30-40s
     * - Stage 2 (Sequential): Meditron verification → 20-30s
     * Total: ~50-70 seconds
     *
     * Optimizations Applied:
     * - Meditron for medical entity extraction (leverages medical training)
     * - Llama3 for fast answer generation (general AI, very fast)
     * - Parallel stage 1 (extraction + answer happen simultaneously)
     * - Meditron verification leverages already-loaded model
     * - Smart context management (miniContext = 300 chars vs 70KB full)
     *
     * Why this works:
     * - Meditron extracts medical entities better (ICD codes, dosages, medical terms)
     * - Llama3 generates natural language answers faster
     * - Parallel execution where safe, sequential where needed
     * - Both models stay warm in memory after first call
     */
    generateFastAnswerSequential(query: string, patientData: any, structuredExtractions: any[]): Promise<{
        short_answer: string;
        detailed_summary: string;
        reasoning_chain: string[];
        confidence: number;
        sources: any[];
    }>;
    /**
     * Check if data records are empty templates vs having real content
     * Returns {hasContent: boolean, emptyMessage: string}
     */
    private analyzeDataCompleteness;
    /**
     * Build minimal context (target: <1000 tokens)
     * Smart filtering based on query keywords
     */
    private buildMiniContext;
    /**
     * PHASE 1: Chain of Verification (CoVe) Implementation
     * Research-backed technique that improves accuracy by 15-23%
     *
     * Process:
     * 1. Generate initial answer
     * 2. Generate verification questions
     * 3. Answer verification questions
     * 4. Produce final verified answer
     *
     * @param query - User's medical query
     * @param context - Patient data context
     * @param initialAnswer - The initial generated answer to verify
     */
    chainOfVerification(query: string, context: string, initialAnswer: string): Promise<{
        verified_answer: string;
        verification_questions: string[];
        verification_answers: string[];
        verification_passed: boolean;
    }>;
}
//# sourceMappingURL=ollama.service.d.ts.map