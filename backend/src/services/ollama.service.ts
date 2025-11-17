/**
 * Ollama Service
 * Handles embeddings and LLM generation using local Ollama instance
 * HIPAA-compliant - all processing stays local
 */

import axios, { AxiosInstance } from 'axios';
import type {
  OllamaEmbeddingRequest,
  OllamaEmbeddingResponse,
  OllamaGenerateRequest,
  OllamaGenerateResponse,
  AppError,
} from '../types';

export class OllamaService {
  private client: AxiosInstance;
  private embeddingModel: string;
  private llmModel: string;
  private maxTokens: number;
  private temperature: number;

  constructor(
    baseUrl: string,
    embeddingModel: string,
    llmModel: string,
    maxTokens: number,
    temperature: number
  ) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 300000, // 5 minutes for large LLM requests
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.embeddingModel = embeddingModel;
    this.llmModel = llmModel;
    this.maxTokens = maxTokens;
    this.temperature = temperature;
  }

  /**
   * Check if Ollama service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/api/tags');
      return response.status === 200;
    } catch (error) {
      console.error('Ollama health check failed:', error);
      return false;
    }
  }

  /**
   * Generate embedding for text using nomic-embed-text
   * Returns 768-dimensional vector
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const request: OllamaEmbeddingRequest = {
        model: this.embeddingModel,
        prompt: text,
      };

      const response = await this.client.post<OllamaEmbeddingResponse>(
        '/api/embeddings',
        request
      );

      return response.data.embedding;
    } catch (error: any) {
      console.error('Ollama embedding error:', error.message);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  /**
   * Generate text using Meditron LLM
   */
  async generate(
    prompt: string,
    systemPrompt?: string,
    temperature?: number
  ): Promise<string> {
    try {
      const request: OllamaGenerateRequest = {
        model: this.llmModel,
        prompt,
        system: systemPrompt,
        temperature: temperature ?? this.temperature,
        max_tokens: this.maxTokens,
        stream: false,
      };

      const response = await this.client.post<OllamaGenerateResponse>(
        '/api/generate',
        request
      );

      return response.data.response;
    } catch (error: any) {
      console.error('Ollama generation error:', error.message);
      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }

  /**
   * Generate structured answer from retrieved documents
   */
  async generateRAGAnswer(
    query: string,
    context: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<{ short_answer: string; detailed_summary: string }> {
    const systemPrompt = `You are a HIPAA-compliant medical AI assistant analyzing patient Electronic Medical Records (EMR).

Guidelines:
1. Answer ONLY based on the provided context - do not use external knowledge
2. If information is not in the context, say "I don't see that information in the records"
3. Always cite specific sources (care plans, medications, notes)
4. Use medical terminology appropriately
5. Be precise with dates, dosages, and medical details
6. Maintain patient privacy - only reference patient by ID, not name`;

    let historyContext = '';
    if (conversationHistory && conversationHistory.length > 0) {
      historyContext = '\n\nConversation History:\n' +
        conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    }

    const prompt = `${historyContext}

Context from Patient Records:
${context}

Question: ${query}

Provide two responses:
1. SHORT_ANSWER: A brief 1-2 sentence answer
2. DETAILED_SUMMARY: A comprehensive explanation with citations

Format your response exactly as:
SHORT_ANSWER: [your brief answer]

DETAILED_SUMMARY: [your detailed answer with citations]`;

    const response = await this.generate(prompt, systemPrompt);

    // Parse response
    const shortMatch = response.match(/SHORT_ANSWER:\s*(.+?)(?=\n\nDETAILED_SUMMARY:)/s);
    const detailedMatch = response.match(/DETAILED_SUMMARY:\s*(.+)$/s);

    return {
      short_answer: shortMatch ? shortMatch[1].trim() : response.substring(0, 200),
      detailed_summary: detailedMatch ? detailedMatch[1].trim() : response,
    };
  }

  /**
   * Extract structured information from text
   */
  async extractStructuredInfo(
    text: string,
    targetTypes: string[]
  ): Promise<Array<{ type: string; value: string; confidence: number }>> {
    const systemPrompt = `You are a medical information extraction system. Extract structured information from clinical text.`;

    const prompt = `Extract the following types of information from this clinical text:
${targetTypes.join(', ')}

Clinical Text:
${text}

For each piece of information found, provide:
- type: one of [${targetTypes.join(', ')}]
- value: the extracted value
- confidence: 0-1 score

Format as JSON array:
[{"type": "medication", "value": "Lisinopril 10mg", "confidence": 0.95}, ...]`;

    try {
      const response = await this.generate(prompt, systemPrompt, 0.0);
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (error) {
      console.error('Structured extraction failed:', error);
      return [];
    }
  }
}
