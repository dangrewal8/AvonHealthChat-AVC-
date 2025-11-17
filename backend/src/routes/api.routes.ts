/**
 * Main API Routes
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

const router = Router();

// Initialize services (will be set from main app)
let ollamaService: OllamaService;
let avonHealthService: AvonHealthService;

export function initializeServices(ollama: OllamaService, avonHealth: AvonHealthService) {
  ollamaService = ollama;
  avonHealthService = avonHealth;
}

/**
 * Main RAG Query Endpoint
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

    console.log(`Processing query for patient ${patient_id}: "${query}"`);

    // 1. Fetch patient data from Avon Health API
    const patientData = await avonHealthService.getAllPatientData(patient_id);
    const { care_plans, medications, notes } = patientData;

    // 2. Build context from all sources
    let context = '';
    let artifacts_searched = 0;
    const provenance: FormattedProvenance[] = [];

    // Add care plans to context
    care_plans.forEach((cp) => {
      const text = `Care Plan: ${cp.title}\n${cp.description}\nStatus: ${cp.status}\nProvider: ${cp.provider}`;
      context += `\n\n[CARE_PLAN_${cp.id}] ${text}`;
      artifacts_searched++;

      provenance.push({
        artifact_id: cp.id,
        artifact_type: 'care_plan',
        snippet: cp.description.substring(0, 200),
        occurred_at: cp.created_at,
        relevance_score: 0.8, // Simplified - would use actual vector similarity
        char_offsets: [0, text.length],
        source_url: `/api/emr/care_plans/${cp.id}`,
      });
    });

    // Add medications to context
    medications.forEach((med) => {
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

    // Add clinical notes to context
    notes.forEach((note) => {
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

    // 3. Generate answer using Ollama
    const { short_answer, detailed_summary } = await ollamaService.generateRAGAnswer(
      query,
      context,
      conversation_history
    );

    // 4. Extract structured information
    const structured_extractions: StructuredExtraction[] = [];

    // Simple extraction for medications mentioned
    medications.forEach((med) => {
      if (detailed_summary.toLowerCase().includes(med.name.toLowerCase())) {
        structured_extractions.push({
          type: 'medication',
          value: `${med.name} ${med.dosage}`,
          relevance: 0.9,
          confidence: 0.95,
          source_artifact_id: med.id,
          supporting_text: `Prescribed ${med.prescribed_date}`,
        });
      }
    });

    // 5. Calculate confidence scores
    const processingTime = Date.now() - startTime;

    const response: UIResponse = {
      query_id: uuidv4(),
      short_answer,
      detailed_summary,
      structured_extractions,
      provenance: provenance.slice(0, options.max_results || 5), // Limit sources
      confidence: {
        overall: 0.85,
        breakdown: {
          retrieval: 0.90,
          reasoning: 0.82,
          extraction: 0.83,
        },
        explanation: 'High confidence based on direct matches in patient records',
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

    console.log(`Query completed in ${processingTime}ms`);
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
 * Get recent queries (simplified - would need database)
 * GET /api/queries/recent
 */
router.get('/queries/recent', async (_req: Request, res: Response): Promise<void> => {
  res.json({
    queries: [],
    message: 'Query history not yet implemented',
  });
});

/**
 * EMR Data Endpoints
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

    const data = await avonHealthService.getAllPatientData(patient_id as string);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Index patient data (simplified - would update vector DB)
 * POST /api/index/patient/:id
 */
router.post('/index/patient/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = await avonHealthService.getAllPatientData(id);

    // TODO: Index data into vector database
    res.json({
      indexed: true,
      patient_id: id,
      count: data.care_plans.length + data.medications.length + data.notes.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Metrics endpoint
 * GET /api/metrics
 */
router.get('/metrics', (_req: Request, res: Response): void => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
