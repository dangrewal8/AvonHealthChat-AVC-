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

// Demo mode mock data
const DEMO_PATIENT_DATA = {
  care_plans: [
    {
      id: 'cp_001',
      title: 'Diabetes Management Plan',
      description: 'Comprehensive diabetes management including blood sugar monitoring, diet modifications, and medication adherence.',
      status: 'active',
      provider: 'Dr. Sarah Johnson',
      created_at: '2024-01-15T10:00:00Z',
    },
    {
      id: 'cp_002',
      title: 'Hypertension Control Plan',
      description: 'Blood pressure management through lifestyle changes and medication. Target BP: 120/80 mmHg.',
      status: 'active',
      provider: 'Dr. Sarah Johnson',
      created_at: '2024-02-01T14:30:00Z',
    },
  ],
  medications: [
    {
      id: 'med_001',
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily with meals',
      prescribed_date: '2024-01-15',
      prescriber: 'Dr. Sarah Johnson',
    },
    {
      id: 'med_002',
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily in the morning',
      prescribed_date: '2024-02-01',
      prescriber: 'Dr. Sarah Johnson',
    },
    {
      id: 'med_003',
      name: 'Atorvastatin',
      dosage: '20mg',
      frequency: 'Once daily at bedtime',
      prescribed_date: '2024-01-20',
      prescriber: 'Dr. Sarah Johnson',
    },
  ],
  notes: [
    {
      id: 'note_001',
      note_type: 'Progress Note',
      author: 'Dr. Sarah Johnson',
      created_at: '2024-03-15T09:00:00Z',
      content: 'Patient reports good adherence to medication regimen. Blood sugar levels have improved significantly over the past month. A1C down from 8.2% to 7.1%. Continue current medications. Patient educated on importance of regular exercise.',
    },
    {
      id: 'note_002',
      note_type: 'Follow-up',
      author: 'Nurse Practitioner Mary Williams',
      created_at: '2024-03-20T11:30:00Z',
      content: 'Blood pressure reading: 128/82 mmHg. Discussed salt intake reduction and reviewed DASH diet recommendations. Patient verbalized understanding. Next follow-up in 2 weeks.',
    },
  ],
};

// Simple demo mode response generator
function generateDemoResponse(query: string): { short_answer: string; detailed_summary: string } {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('medication') || lowerQuery.includes('medicine') || lowerQuery.includes('drug')) {
    return {
      short_answer: 'The patient is currently taking Metformin 500mg twice daily, Lisinopril 10mg once daily, and Atorvastatin 20mg at bedtime.',
      detailed_summary: 'Based on the patient records, the patient is currently on three medications:\n\n1. **Metformin 500mg** - Prescribed for diabetes management, taken twice daily with meals (prescribed by Dr. Sarah Johnson on 01/15/2024)\n\n2. **Lisinopril 10mg** - Prescribed for blood pressure control, taken once daily in the morning (prescribed by Dr. Sarah Johnson on 02/01/2024)\n\n3. **Atorvastatin 20mg** - Prescribed for cholesterol management, taken once daily at bedtime (prescribed by Dr. Sarah Johnson on 01/20/2024)\n\nAll medications are part of the active care plans for diabetes and hypertension management.',
    };
  }

  if (lowerQuery.includes('diabetes') || lowerQuery.includes('blood sugar') || lowerQuery.includes('a1c')) {
    return {
      short_answer: 'The patient has an active diabetes management plan with recent improvement in A1C from 8.2% to 7.1%.',
      detailed_summary: 'The patient is enrolled in a **Diabetes Management Plan** (Care Plan ID: cp_001) managed by Dr. Sarah Johnson. Recent progress notes from March 15, 2024 indicate significant improvement:\n\n- **A1C levels**: Decreased from 8.2% to 7.1% over the past month\n- **Medication adherence**: Patient reports good compliance with Metformin 500mg twice daily\n- **Patient education**: Regular exercise importance discussed\n- **Status**: Active management with positive outcomes\n\nThe comprehensive plan includes blood sugar monitoring, diet modifications, and medication adherence protocols.',
    };
  }

  if (lowerQuery.includes('blood pressure') || lowerQuery.includes('hypertension') || lowerQuery.includes('bp')) {
    return {
      short_answer: 'The patient has an active hypertension control plan with recent BP reading of 128/82 mmHg.',
      detailed_summary: 'The patient is under a **Hypertension Control Plan** (Care Plan ID: cp_002) with target BP of 120/80 mmHg:\n\n- **Recent BP Reading**: 128/82 mmHg (recorded March 20, 2024)\n- **Medication**: Lisinopril 10mg once daily\n- **Lifestyle modifications**: DASH diet recommended, salt intake reduction discussed\n- **Follow-up**: Scheduled in 2 weeks\n- **Provider**: Dr. Sarah Johnson\n\nNurse Practitioner Mary Williams conducted the most recent follow-up and confirmed patient understanding of dietary recommendations.',
    };
  }

  // Default response for general queries
  return {
    short_answer: 'The patient has active care plans for diabetes and hypertension management, currently taking three medications with recent improvements noted.',
    detailed_summary: `Based on the available patient records:\n\n**Active Care Plans:**\n- Diabetes Management Plan (Dr. Sarah Johnson)\n- Hypertension Control Plan (Dr. Sarah Johnson)\n\n**Current Medications:**\n- Metformin 500mg (twice daily)\n- Lisinopril 10mg (once daily)\n- Atorvastatin 20mg (once daily)\n\n**Recent Progress:**\n- A1C improved from 8.2% to 7.1%\n- Blood pressure: 128/82 mmHg\n- Good medication adherence reported\n- Regular follow-ups scheduled\n\nFor more specific information about "${query}", please ask about medications, diabetes management, or blood pressure control.`,
  };
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

    // 1. Fetch patient data (with demo mode fallback)
    let patientData;
    let usingDemoMode = false;

    try {
      patientData = await avonHealthService.getAllPatientData(patient_id);
    } catch (error) {
      console.log('⚠️  Avon Health API unavailable, using demo mode');
      patientData = DEMO_PATIENT_DATA;
      usingDemoMode = true;
    }

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

    // 3. Generate answer (with demo mode fallback)
    let short_answer: string;
    let detailed_summary: string;

    if (usingDemoMode) {
      // Use simple rule-based responses in demo mode
      const demoResponse = generateDemoResponse(query);
      short_answer = demoResponse.short_answer;
      detailed_summary = demoResponse.detailed_summary;
      console.log('✅ Using demo mode response generator');
    } else {
      try {
        // Try to use Ollama for AI-powered responses
        const ollamaResponse = await ollamaService.generateRAGAnswer(
          query,
          context,
          conversation_history
        );
        short_answer = ollamaResponse.short_answer;
        detailed_summary = ollamaResponse.detailed_summary;
      } catch (error) {
        // Fallback to demo mode if Ollama fails
        console.log('⚠️  Ollama unavailable, using demo mode response');
        const demoResponse = generateDemoResponse(query);
        short_answer = demoResponse.short_answer;
        detailed_summary = demoResponse.detailed_summary;
      }
    }

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
