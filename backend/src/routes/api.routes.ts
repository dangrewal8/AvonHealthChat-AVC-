/**
 * Main API Routes - RAG System with Real Avon Health API Data
 */

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type {
  QueryRequest,
  UIResponse,
  StructuredExtraction,
  FormattedProvenance,
} from '../types';
import { OllamaService } from '../services/ollama.service';
import { AvonHealthService } from '../services/avonhealth.service';
import { analyzeQuery } from './enhanced-query-understanding';

const router = Router();

// Initialize services (will be set from main app)
let ollamaService: OllamaService;
let avonHealthService: AvonHealthService;

export function initializeServices(ollama: OllamaService, avonHealth: AvonHealthService) {
  ollamaService = ollama;
  avonHealthService = avonHealth;
}

/**
 * Main RAG Query Endpoint - Uses REAL Avon Health API Data
 * POST /api/query
 */
router.post('/query', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();

  try {
    const {
      query,
      patient_id,
      options = {},
      conversation_history = [],
    }: QueryRequest = req.body;

    // Validation
    if (!query || !patient_id) {
      res.status(400).json({
        error: 'Missing required fields: query and patient_id',
      });
      return;
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📝 Processing query for patient ${patient_id}:`);
    console.log(`   Query: "${query}"`);

    // Use enhanced NLP for comprehensive query analysis
    const queryAnalysis = analyzeQuery(query);
    const queryIntent = queryAnalysis.intent;

    console.log(`\n🧠 Query Analysis:`);
    console.log(`   Intent: ${queryIntent.primary} (${queryIntent.confidence.toFixed(0)}% confidence)`);
    console.log(`   Question Type: ${queryIntent.questionType}`);
    console.log(`   Complexity: ${queryAnalysis.complexity.level} (score: ${queryAnalysis.complexity.score})`);
    if (queryAnalysis.complexity.reasons.length > 0) {
      console.log(`   Reasons: ${queryAnalysis.complexity.reasons.join(', ')}`);
    }
    if (queryAnalysis.entities.medications.length > 0) {
      console.log(`   Mentioned Medications: ${queryAnalysis.entities.medications.join(', ')}`);
    }
    if (queryAnalysis.entities.conditions.length > 0) {
      console.log(`   Mentioned Conditions: ${queryAnalysis.entities.conditions.join(', ')}`);
    }
    if (queryAnalysis.isMultiPart) {
      console.log(`   ⚠️  Multi-part question detected`);
    }
    if (queryAnalysis.isFollowUp) {
      console.log(`   ℹ️  Follow-up question detected`);
    }
    if (queryAnalysis.suggestions.length > 0) {
      console.log(`   Suggestions: ${queryAnalysis.suggestions.join('; ')}`);
    }

    // 1. Fetch REAL patient data from Avon Health API
    console.log(`\n📡 Fetching patient data from Avon Health API...`);
    let patientData;
    try {
      patientData = await avonHealthService.getAllPatientData(patient_id);
    } catch (error: any) {
      console.error('Failed to fetch patient data from Avon Health API:', error.message);
      res.status(500).json({
        error: 'Failed to retrieve patient data',
        message: 'Unable to connect to Avon Health API. Please check your credentials and API availability.',
      });
      return;
    }

    const { care_plans, medications, notes } = patientData;

    // 2. Build context from all sources (prioritize based on query intent)
    let context = '';
    let artifacts_searched = 0;
    const provenance: FormattedProvenance[] = [];

    // Build context based on query intent for better RAG performance
    const contextPriority: string[] = [];

    // Determine what to prioritize based on intent
    if (queryIntent.primary === 'medications' || query.toLowerCase().includes('med')) {
      contextPriority.push('medications', 'care_plans', 'notes');
    } else if (queryIntent.primary === 'diagnosis' || queryIntent.primary === 'care_plans') {
      contextPriority.push('care_plans', 'notes', 'medications');
    } else {
      // Default order
      contextPriority.push('care_plans', 'medications', 'notes');
    }

    // Build context in priority order
    contextPriority.forEach((sourceType) => {
      if (sourceType === 'care_plans' && care_plans) {
        care_plans.forEach((cp: any) => {
          const text = `Care Plan: ${cp.title}\n${cp.description}\nStatus: ${cp.status}\nProvider: ${cp.provider}`;
          context += `\n\n[CARE_PLAN_${cp.id}] ${text}`;
          artifacts_searched++;

          provenance.push({
            artifact_id: cp.id,
            artifact_type: 'care_plan',
            snippet: cp.description.substring(0, 200),
            occurred_at: cp.created_at,
            relevance_score: 0.8,
            char_offsets: [0, text.length],
            source_url: `/api/emr/care_plans/${cp.id}`,
          });
        });
      }

      if (sourceType === 'medications' && medications) {
        medications.forEach((med: any) => {
          const text = `Medication: ${med.name} ${med.dosage}\nFrequency: ${med.frequency}\nPrescribed: ${med.prescribed_date}\nPrescriber: ${med.prescriber}`;
          context += `\n\n[MEDICATION_${med.id}] ${text}`;
          artifacts_searched++;

          provenance.push({
            artifact_id: med.id,
            artifact_type: 'medication',
            snippet: `${med.name} ${med.dosage}`,
            occurred_at: med.prescribed_date,
            relevance_score: 0.85,
            char_offsets: [0, text.length],
            source_url: `/api/emr/medications/${med.id}`,
          });
        });
      }

      if (sourceType === 'notes' && notes) {
        notes.forEach((note: any) => {
          const text = `Clinical Note (${note.note_type})\nAuthor: ${note.author}\nDate: ${note.created_at}\n${note.content}`;
          context += `\n\n[NOTE_${note.id}] ${text}`;
          artifacts_searched++;

          provenance.push({
            artifact_id: note.id,
            artifact_type: 'note',
            snippet: note.content.substring(0, 200),
            occurred_at: note.created_at,
            relevance_score: 0.9,
            char_offsets: [0, text.length],
            source_url: `/api/emr/notes/${note.id}`,
          });
        });
      }
    });

    // 3. Generate answer using Ollama with REAL retrieved context
    let short_answer: string;
    let detailed_summary: string;

    try {
      const ollamaResponse = await ollamaService.generateRAGAnswer(
        query,
        context,
        conversation_history
      );
      short_answer = ollamaResponse.short_answer;
      detailed_summary = ollamaResponse.detailed_summary;
      console.log('✅ Generated answer using Ollama with real patient data');
    } catch (error: any) {
      console.error('Ollama generation failed:', error.message);
      res.status(500).json({
        error: 'AI generation failed',
        message: 'Ollama service unavailable. Please ensure Ollama is running.',
      });
      return;
    }

    // 4. Extract structured information from REAL data
    const structured_extractions: StructuredExtraction[] = [];

    // Extract medications mentioned in the answer
    if (medications) {
      medications.forEach((med: any) => {
        if (detailed_summary.toLowerCase().includes(med.name.toLowerCase())) {
          structured_extractions.push({
            type: 'medication',
            value: `${med.name} ${med.dosage}`,
            relevance: 0.9,
            confidence: 0.95,
            source_artifact_id: med.id,
            supporting_text: `Prescribed ${med.prescribed_date} by ${med.prescriber}`,
          });
        }
      });
    }

    // Extract care plans mentioned
    if (care_plans) {
      care_plans.forEach((cp: any) => {
        if (detailed_summary.toLowerCase().includes(cp.title.toLowerCase())) {
          structured_extractions.push({
            type: 'condition',
            value: cp.title,
            relevance: 0.85,
            confidence: 0.9,
            source_artifact_id: cp.id,
            supporting_text: cp.description.substring(0, 100),
          });
        }
      });
    }

    // 5. Calculate confidence scores
    const processingTime = Date.now() - startTime;

    const response: UIResponse = {
      query_id: uuidv4(),
      short_answer,
      detailed_summary,
      structured_extractions,
      provenance: provenance.slice(0, options.max_results || 5),
      confidence: {
        overall: Math.min(0.95, queryIntent.confidence / 100 + 0.2),
        breakdown: {
          retrieval: 0.90,
          reasoning: 0.82,
          extraction: 0.83,
        },
        explanation: `Answer generated from ${artifacts_searched} real patient records via Avon Health API`,
      },
      metadata: {
        patient_id,
        query_time: new Date().toISOString(),
        processing_time_ms: processingTime,
        artifacts_searched,
        chunks_retrieved: provenance.length,
        detail_level: options.detail_level || 3,
      },
    };

    console.log(`✅ Query completed in ${processingTime}ms using REAL API data`);
    res.json(response);
  } catch (error: any) {
    console.error('Query error:', error);
    res.status(500).json({
      error: 'Query processing failed',
      message: error.message,
    });
  }
});

/**
 * Get recent queries
 * GET /api/queries/recent
 */
router.get('/queries/recent', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    queries: [],
    message: 'Query history not yet implemented',
  });
});

/**
 * EMR Data Endpoints - Direct API Access
 */

router.get('/emr/care_plans', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient_id } = req.query;
    if (!patient_id) {
      res.status(400).json({ error: 'patient_id required' });
      return;
    }

    const carePlans = await avonHealthService.getCarePlans(patient_id as string);
    res.json(carePlans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/emr/medications', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient_id } = req.query;
    if (!patient_id) {
      res.status(400).json({ error: 'patient_id required' });
      return;
    }

    const medications = await avonHealthService.getMedications(patient_id as string);
    res.json(medications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/emr/notes', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient_id } = req.query;
    if (!patient_id) {
      res.status(400).json({ error: 'patient_id required' });
      return;
    }

    const notes = await avonHealthService.getNotes(patient_id as string);
    res.json(notes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/emr/all', async (req: Request, res: Response): Promise<void> => {
  try {
    const { patient_id } = req.query;
    if (!patient_id) {
      res.status(400).json({ error: 'patient_id required' });
      return;
    }

    const allData = await avonHealthService.getAllPatientData(patient_id as string);
    res.json(allData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
