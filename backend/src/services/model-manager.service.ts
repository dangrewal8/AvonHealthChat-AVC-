/**
 * Model Manager Service
 * Intelligent routing and management of multiple medical LLM models
 * Handles model selection, health checking, and performance optimization
 */

import type {
  MedicalModel,
  TaskType,
  ModelConfig,
  ModelHealth,
  RoutingDecision,
} from '../types';
import axios, { AxiosInstance } from 'axios';

export class ModelManagerService {
  private ollamaClient: AxiosInstance;
  private models: Map<MedicalModel, ModelConfig>;
  private modelHealth: Map<MedicalModel, ModelHealth>;
  private lastHealthCheck: Date;

  constructor(ollamaBaseUrl: string) {
    this.ollamaClient = axios.create({
      baseURL: ollamaBaseUrl,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.models = new Map();
    this.modelHealth = new Map();
    this.lastHealthCheck = new Date(0);

    this.initializeModelConfigs();
  }

  /**
   * Initialize model configurations for 2-model production system
   */
  private initializeModelConfigs(): void {
    // PRODUCTION MODEL 1: Meditron-7B
    // Specialized for entity extraction (100% accuracy on medications, dosages, ICD codes)
    this.models.set('meditron', {
      name: 'meditron',
      ollamaModelName: 'meditron:latest',
      displayName: 'Meditron 7B',
      description: 'Medical LLM adapted from Llama 2, trained on 48.1B tokens of clinical guidelines, PubMed papers, and medical abstracts. 100% accuracy on entity extraction.',
      specialization: [
        'entity_extraction',
        'data_structuring',
      ],
      parameterSize: '7B',
      quantization: 'Q4_0',
      contextWindow: 4096,
      performance: {
        overallAccuracy: 0.56,
        clinicalNER: 1.0, // 100% on entity extraction
        computationalEfficiency: 'medium',
      },
      enabled: true,
    });

    // PRODUCTION MODEL 2: Llama 3 8B
    // Best overall performance (95% avg), used for answer generation AND fact-checking
    this.models.set('llama3', {
      name: 'llama3',
      ollamaModelName: 'llama3:latest',
      displayName: 'Llama 3 8B',
      description: 'General-purpose LLM from Meta with best overall performance (95% avg). Used for primary answer generation and fact-checking.',
      specialization: [
        'medical_qa',
        'clinical_reasoning',
        'general_query',
        'fallback',
      ],
      parameterSize: '8B',
      quantization: 'Q4_0',
      contextWindow: 8192,
      performance: {
        overallAccuracy: 0.95,
        medQA: 1.0, // 100% on medical Q&A
        computationalEfficiency: 'high',
      },
      enabled: true,
    });
  }

  /**
   * Get all model configurations
   */
  public getAllModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  /**
   * Get specific model configuration
   */
  public getModelConfig(model: MedicalModel): ModelConfig | undefined {
    return this.models.get(model);
  }

  /**
   * Get enabled models only
   */
  public getEnabledModels(): ModelConfig[] {
    return this.getAllModels().filter((m) => m.enabled);
  }

  /**
   * Check health status of all models
   * Returns health status map
   */
  public async checkModelsHealth(forceCheck: boolean = false): Promise<Map<MedicalModel, ModelHealth>> {
    const now = new Date();
    const timeSinceLastCheck = now.getTime() - this.lastHealthCheck.getTime();

    // Only check every 5 minutes unless forced
    if (!forceCheck && timeSinceLastCheck < 5 * 60 * 1000) {
      return this.modelHealth;
    }

    console.log('🏥 Checking health status of all medical models...');

    try {
      // Get list of available models from Ollama
      const response = await this.ollamaClient.get('/api/tags');
      const availableModels: string[] = response.data.models.map((m: any) => m.name);

      // Check each configured model
      for (const [modelName, config] of this.models.entries()) {
        const startTime = Date.now();
        const isAvailable = availableModels.some(
          (m) => m === config.ollamaModelName || m.includes(config.ollamaModelName)
        );

        this.modelHealth.set(modelName, {
          model: modelName,
          available: isAvailable,
          lastChecked: now,
          responseTimeMs: Date.now() - startTime,
          error: isAvailable ? undefined : 'Model not found in Ollama',
        });

        console.log(`  ${isAvailable ? '✅' : '❌'} ${config.displayName}: ${isAvailable ? 'Available' : 'Not installed'}`);
      }

      this.lastHealthCheck = now;
    } catch (error: any) {
      console.error('❌ Failed to check model health:', error.message);

      // Mark all models as unavailable on error
      for (const modelName of this.models.keys()) {
        this.modelHealth.set(modelName, {
          model: modelName,
          available: false,
          lastChecked: now,
          error: error.message,
        });
      }
    }

    return this.modelHealth;
  }

  /**
   * Intelligent model routing based on task type and query
   * Returns the best model for the given task
   */
  public async routeModel(
    taskType: TaskType,
    query: string,
    preferredModel?: MedicalModel
  ): Promise<RoutingDecision> {
    // First, ensure we have recent health data
    await this.checkModelsHealth();

    // If user specified a preferred model and it's available, use it
    if (preferredModel) {
      const health = this.modelHealth.get(preferredModel);
      const config = this.models.get(preferredModel);

      if (health?.available && config) {
        return {
          selectedModel: preferredModel,
          taskType,
          reason: `User-specified model: ${config.displayName}`,
          confidence: 1.0,
          alternatives: this.getAlternativeModels(taskType, preferredModel),
        };
      }
    }

    // Intelligent routing based on task type
    const routing = this.selectBestModel(taskType, query);
    return routing;
  }

  /**
   * Select best model based on task type and availability
   */
  private selectBestModel(taskType: TaskType, query: string): RoutingDecision {
    const queryLower = query.toLowerCase();

    // Score each model for this task
    const modelScores: Array<{ model: MedicalModel; score: number; reason: string }> = [];

    for (const [modelName, config] of this.models.entries()) {
      const health = this.modelHealth.get(modelName);
      if (!health?.available || !config.enabled) {
        continue; // Skip unavailable models
      }

      let score = 0;
      let reason = '';

      // Base score: specialization match
      if (config.specialization.includes(taskType)) {
        score += 50;
        reason = `Specialized for ${taskType}`;
      }

      // Bonus points for specific task types
      switch (taskType) {
        case 'entity_extraction':
        case 'data_structuring':
          // Meditron: 100% score on entity extraction and medical codes
          if (modelName === 'meditron') {
            score += 40;
            reason = 'Meditron scored 100% on entity extraction benchmarks';
          } else if (modelName === 'llama3') {
            score += 35;
            reason = 'Llama 3 scored 100% on entity extraction (reliable fallback)';
          }
          break;

        case 'medical_qa':
        case 'clinical_reasoning':
          // Llama 3: Best overall performance (95% avg, 100% medical Q&A)
          if (modelName === 'llama3') {
            score += 40;
            reason = 'Llama 3 best overall performance (95% avg, 100% medical Q&A, 70% clinical reasoning)';
          } else if (modelName === 'meditron') {
            score += 15;
            reason = 'Meditron fallback for medical queries';
          }
          break;

        case 'general_query':
          // Llama 3: Best for general tasks
          if (modelName === 'llama3') {
            score += 40;
            reason = 'Llama 3 excels at instruction following and general tasks';
          } else if (modelName === 'meditron') {
            score += 15;
            reason = 'Meditron fallback for general queries';
          }
          break;

        case 'fallback':
          // Meditron as reliable fallback
          if (modelName === 'meditron') {
            score += 10;
            reason = 'Meditron as baseline fallback';
          }
          break;
      }

      // Query content analysis - boost scores based on keywords
      if (queryLower.includes('extract') || queryLower.includes('identify') || queryLower.includes('list')) {
        if (modelName === 'meditron') score += 20; // Best at extraction (100% benchmark)
        else if (modelName === 'llama3') score += 15; // Also excellent (100% benchmark)
      }
      if (queryLower.includes('why') || queryLower.includes('how') || queryLower.includes('explain')) {
        if (modelName === 'llama3') score += 20; // Best at reasoning (95% avg, 70% clinical reasoning)
        else if (modelName === 'meditron') score += 10; // Fallback
      }

      // Performance metrics bonus
      if (config.performance.overallAccuracy) {
        score += config.performance.overallAccuracy * 10;
      }

      modelScores.push({ model: modelName, score, reason });
    }

    // Sort by score descending
    modelScores.sort((a, b) => b.score - a.score);

    if (modelScores.length === 0) {
      // Fallback to meditron if no models available
      return {
        selectedModel: 'meditron',
        taskType,
        reason: 'Emergency fallback - no specialized models available',
        confidence: 0.3,
        alternatives: [],
      };
    }

    const best = modelScores[0];
    const alternatives = modelScores
      .slice(1, 3)
      .map((m) => ({ model: m.model, suitability: m.score / 100 }));

    return {
      selectedModel: best.model,
      taskType,
      reason: best.reason || `Best match for ${taskType}`,
      confidence: Math.min(best.score / 100, 1.0),
      alternatives,
    };
  }

  /**
   * Get alternative models for a task
   */
  private getAlternativeModels(taskType: TaskType, excludeModel?: MedicalModel): Array<{ model: MedicalModel; suitability: number }> {
    const alternatives: Array<{ model: MedicalModel; suitability: number }> = [];

    for (const [modelName, config] of this.models.entries()) {
      if (modelName === excludeModel) continue;

      const health = this.modelHealth.get(modelName);
      if (!health?.available || !config.enabled) continue;

      if (config.specialization.includes(taskType)) {
        alternatives.push({ model: modelName, suitability: 0.8 });
      }
    }

    return alternatives;
  }

  /**
   * Get Ollama model name for a medical model
   */
  public getOllamaModelName(model: MedicalModel): string {
    const config = this.models.get(model);
    return config?.ollamaModelName || 'meditron:latest'; // Default fallback
  }

  /**
   * Classify query to determine task type
   * Uses heuristics and keyword matching
   */
  public classifyQuery(query: string): TaskType {
    const queryLower = query.toLowerCase();

    // Entity extraction patterns
    if (
      /\b(list|show|extract|identify|find|what\s+(medications?|drugs?|conditions?|diagnoses|allergies))\b/.test(queryLower) ||
      /\b(current|active|taking|prescribed)\s+(medications?|drugs?)\b/.test(queryLower)
    ) {
      return 'entity_extraction';
    }

    // Medical Q&A patterns
    if (
      /\b(why|how|when|where|explain|describe|what\s+is)\b/.test(queryLower) ||
      /\?(.*)(reason|cause|treatment|procedure|diagnosis)/.test(queryLower)
    ) {
      return 'medical_qa';
    }

    // Clinical reasoning patterns
    if (
      /\b(assess|evaluate|analyze|interpret|recommend|suggest|advise)\b/.test(queryLower) ||
      /\b(diagnosis|prognosis|treatment plan|clinical|symptoms?)\b/.test(queryLower)
    ) {
      return 'clinical_reasoning';
    }

    // Data structuring patterns
    if (
      /\b(structure|organize|parse|format|summarize|timeline)\b/.test(queryLower) ||
      /\b(history|overview|summary|report)\b/.test(queryLower)
    ) {
      return 'data_structuring';
    }

    // Default to general query
    return 'general_query';
  }

  /**
   * Get model statistics and performance info
   */
  public async getModelStatistics(): Promise<Array<{
    model: MedicalModel;
    config: ModelConfig;
    health: ModelHealth | undefined;
  }>> {
    await this.checkModelsHealth();

    return Array.from(this.models.entries()).map(([modelName, config]) => ({
      model: modelName,
      config,
      health: this.modelHealth.get(modelName),
    }));
  }

  /**
   * Enable or disable a model
   */
  public setModelEnabled(model: MedicalModel, enabled: boolean): boolean {
    const config = this.models.get(model);
    if (config) {
      config.enabled = enabled;
      console.log(`📝 Model ${config.displayName} ${enabled ? 'enabled' : 'disabled'}`);
      return true;
    }
    return false;
  }
}
