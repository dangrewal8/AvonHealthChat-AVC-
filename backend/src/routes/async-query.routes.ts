/**
 * Async Query Routes - Polling-based architecture for long-running queries
 * 
 * Solves Cloudflare 100-second timeout issue by:
 * 1. Returning job_id immediately
 * 2. Processing query in background
 * 3. Allowing frontend to poll for status
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { jobQueue } from '../services/job-queue.service';
import type { QueryRequest, UIResponse } from '../types';
import { OllamaService } from '../services/ollama.service';
import { AvonHealthService } from '../services/avonhealth.service';
import { ModelManagerService } from '../services/model-manager.service';
import { VerificationService } from '../services/verification.service';
import { DataCompartmentService } from '../services/data-compartment.service';
import { analyzeQuery } from './enhanced-query-understanding';
import { sanitizeQuery } from '../middleware/validation';
import { perfMon } from '../middleware/performance';
import { checkDataAvailability, generateNoDataResponse, detectDataType } from '../utils/data-availability.util';
import { answerValidator } from '../services/answer-validator.service';

const router = Router();

// Services will be initialized from main app
let ollamaService: OllamaService;
let avonHealthService: AvonHealthService;
let modelManager: ModelManagerService;
let verificationService: VerificationService;
let dataCompartmentService: DataCompartmentService;

export function initializeAsyncServices(
  ollama: OllamaService,
  avonHealth: AvonHealthService,
  modelMgr: ModelManagerService
) {
  ollamaService = ollama;
  avonHealthService = avonHealth;
  modelManager = modelMgr;
  verificationService = new VerificationService(ollama, modelMgr);
  dataCompartmentService = new DataCompartmentService(avonHealth);
  console.log('✅ Async query services initialized');
  console.log('   📊 Data compartmentalization enabled (smart data fetching)');
}

/**
 * Normalize patient ID
 */
function normalizePatientId(patientId: string): string {
  const mapping: Record<string, string> = {
    patient123: 'user_n15wtm6xCNQGrmgfMCGOVaqEq0S2',
    demo: 'user_n15wtm6xCNQGrmgfMCGOVaqEq0S2',
  };
  return mapping[patientId] || patientId;
}

/**
 * POST /api/query/async
 * Submit a query for async processing
 * Returns immediately with job_id
 */
router.post('/async', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query, patient_id, options }: QueryRequest = req.body;

    // Validation
    if (!query || typeof query !== 'string') {
      res.status(400).json({ error: 'query is required and must be a string' });
      return;
    }

    if (!patient_id || typeof patient_id !== 'string') {
      res.status(400).json({ error: 'patient_id is required and must be a string' });
      return;
    }

    // Create job
    const jobId = uuidv4();
    const job = jobQueue.createJob(jobId);

    // Start async processing (don't await)
    processQueryAsync(jobId, query, patient_id, options).catch((error) => {
      console.error(`❌ Async query failed for job ${jobId}:`, error);
      jobQueue.markFailed(jobId, error.message);
    });

    // Return immediately
    res.json({
      job_id: jobId,
      status: 'pending',
      estimated_completion_ms: 120000, // 2 minutes
      poll_url: `/api/query/status/${jobId}`,
    });
  } catch (error: any) {
    console.error('Error creating async query:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/query/status/:jobId
 * Check status of async query
 */
router.get('/status/:jobId', (req: Request, res: Response): void => {
  try {
    const { jobId } = req.params;
    const job = jobQueue.getJob(jobId);

    if (!job) {
      res.status(404).json({ error: 'Job not found or expired' });
      return;
    }

    // Return job status
    res.json({
      job_id: job.job_id,
      status: job.status,
      progress: job.progress,
      result: job.result,
      error: job.error,
      created_at: job.created_at,
      updated_at: job.updated_at,
    });
  } catch (error: any) {
    console.error('Error checking job status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Process query asynchronously with REAL production RAG pipeline
 */
async function processQueryAsync(
  jobId: string,
  rawQuery: string,
  rawPatientId: string,
  options?: any
): Promise<void> {
  const startTime = Date.now();

  try {
    jobQueue.markProcessing(jobId, 0);
    console.log(`\n🔄 Processing async query ${jobId}: "${rawQuery}"`);

    // Sanitize and normalize
    const query = sanitizeQuery(rawQuery);
    const patient_id = normalizePatientId(rawPatientId);

    // Progress: 10% - Query analysis
    jobQueue.markProcessing(jobId, 10);
    const queryAnalysis = analyzeQuery(query);
    console.log(`   Intent: ${queryAnalysis.intent.primary}`);

    // Progress: 20% - Fetch patient data (SMART: only what's needed based on query)
    jobQueue.markProcessing(jobId, 20);
    console.log(`\n📡 Fetching patient data (smart compartmentalization)...`);

    const compartmentalizedData = await perfMon.track('async-fetch-patient-data', async () => {
      return await dataCompartmentService.fetchRequiredData(query, patient_id);
    });

    // Normalize to full format (fills empty arrays for missing compartments)
    const patientData = dataCompartmentService.normalizeData(compartmentalizedData);

    // ANTI-HALLUCINATION: Check data availability and short-circuit if no data exists
    const detectedTypes = detectDataType(query);
    const primaryType = detectedTypes[0];

    if (primaryType) {
      // Build mini-context string for availability check
      const miniContext = JSON.stringify({
        medications: patientData.medications?.length || 0,
        conditions: patientData.conditions?.length || 0,
        allergies: patientData.allergies?.length || 0,
        family_history: patientData.family_history?.length || 0,
        appointments: patientData.appointments?.length || 0,
        insurance_policies: patientData.insurance_policies?.length || 0,
        notes: patientData.notes?.length || 0,
        care_plans: patientData.care_plans?.length || 0,
        vitals: patientData.vitals?.length || 0,
        documents: patientData.documents?.length || 0,
      });

      const availabilityCheck = checkDataAvailability(miniContext, primaryType);

      if (!availabilityCheck.hasData) {
        // Short-circuit - return "not available" immediately without calling LLM
        console.log(`⚠️  No data for ${primaryType} - short-circuit response`);

        const noDataResponse = generateNoDataResponse(primaryType);

        const processingTime = Date.now() - startTime;

        const result: UIResponse = {
          query_id: jobId,
          ...noDataResponse,
          structured_extractions: [],
          provenance: [],
          confidence: {
            overall: 1.0,
            breakdown: { retrieval: 1.0, reasoning: 1.0, extraction: 1.0 },
            explanation: 'No data available - did not query LLM'
          },
          metadata: {
            patient_id,
            query_time: new Date().toISOString(),
            processing_time_ms: processingTime,
            artifacts_searched: 0,
            chunks_retrieved: 0,
            detail_level: 3,
          }
        };

        jobQueue.markCompleted(jobId, result);
        console.log(`✅ Query short-circuited in ${(processingTime / 1000).toFixed(1)}s (no data)`);
        return;
      }
    }

    // Progress: 40% - Data fetched, starting AI processing
    jobQueue.markProcessing(jobId, 40);

    // MODEL ROUTING: Use fastest model (Llama 3) for 1-2 minute target
    const classifiedTaskType = options?.task_type || modelManager.classifyQuery(query);
    const routingDecision = await modelManager.routeModel(classifiedTaskType, query);
    const selectedModel = routingDecision.selectedModel;
    const ollamaModelName = modelManager.getOllamaModelName(selectedModel);

    console.log(`   ✅ Selected: ${selectedModel}`);
    console.log(`   💡 Reason: ${routingDecision.reason}`);

    // Progress: 50% - Generating answer with AI
    jobQueue.markProcessing(jobId, 50);

    // Use verification service with 'none' strategy (fastest - just chain-of-thought)
    const verificationResponse = await verificationService.verifyResponse(
      query,
      {
        patient: patientData.patient,
        care_plans: patientData.care_plans,
        medications: patientData.medications,
        notes: patientData.notes,
        allergies: patientData.allergies,
        conditions: patientData.conditions,
        vitals: patientData.vitals,
        family_history: patientData.family_history,
        appointments: patientData.appointments,
        documents: patientData.documents,
        form_responses: patientData.form_responses,
        insurance_policies: patientData.insurance_policies,
      },
      [], // no conversation history for now
      'none', // Use fastest verification strategy
      ollamaModelName
    );

    // ANTI-HALLUCINATION: Validate and auto-correct response if needed
    const contextForValidation = JSON.stringify({
      medications: patientData.medications?.length || 0,
      conditions: patientData.conditions?.length || 0,
      allergies: patientData.allergies?.length || 0,
      family_history: patientData.family_history?.length || 0,
      appointments: patientData.appointments?.length || 0,
      insurance_policies: patientData.insurance_policies?.length || 0,
      notes: patientData.notes?.length || 0,
      care_plans: patientData.care_plans?.length || 0,
      vitals: patientData.vitals?.length || 0,
      documents: patientData.documents?.length || 0,
    });

    const validatedResponse = answerValidator.correctHallucination(
      query,
      verificationResponse,
      contextForValidation
    );

    // Progress: 90% - Formatting response
    jobQueue.markProcessing(jobId, 90);

    const processingTime = Date.now() - startTime;
    console.log(`✅ Query processed in ${(processingTime / 1000).toFixed(1)}s`);

    // Convert structured_extractions to provenance format (with real dates and snippets)
    const provenance = (validatedResponse.structured_extractions || []).map((extraction: any, index: number) => ({
      artifact_id: extraction.source_artifact_id || `source_${index}`,
      artifact_type: extraction.type || 'medication',
      snippet: extraction.supporting_text || extraction.value || '',
      supporting_content: extraction.supporting_text || '', // Enhanced evidence with full details
      occurred_at: extraction.occurred_at || new Date().toISOString(),
      relevance_score: extraction.relevance || extraction.confidence || 0.8,
      char_offsets: [0, (extraction.supporting_text || extraction.value || '').length] as [number, number],
      source_url: `/api/emr/${extraction.type || 'data'}/${extraction.source_artifact_id || ''}`,
    }));

    // Build final response (using validated response)
    const result: UIResponse = {
      query_id: jobId,
      short_answer: validatedResponse.short_answer,
      detailed_summary: validatedResponse.detailed_summary,
      structured_extractions: validatedResponse.structured_extractions || [],
      provenance,
      confidence: {
        overall: verificationResponse.consensus_score || 0.9,
        breakdown: {
          retrieval: 0.9,
          reasoning: 0.9,
          extraction: 0.9,
        },
        explanation: `Confidence: ${((verificationResponse.consensus_score || 0.9) * 100).toFixed(0)}% based on ${verificationResponse.verification_used} verification`,
      },
      metadata: {
        patient_id,
        query_time: new Date().toISOString(),
        processing_time_ms: processingTime,
        artifacts_searched: validatedResponse.structured_extractions?.length || 0,
        chunks_retrieved: verificationResponse.sources?.length || 0,
        detail_level: 3,
        ...(validatedResponse.metadata || {}), // Include any hallucination detection metadata
      },
    };

    jobQueue.markCompleted(jobId, result);
    console.log(`✅ Async query completed: ${jobId}`);
  } catch (error: any) {
    console.error(`❌ Async query failed: ${jobId}`, error);
    jobQueue.markFailed(jobId, error.message);
    throw error;
  }
}

export default router;
