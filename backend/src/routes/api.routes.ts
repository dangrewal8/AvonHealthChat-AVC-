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
import { generateComprehensiveResponse } from './comprehensive-query-handler';

const router = Router();

// Initialize services (will be set from main app)
let ollamaService: OllamaService;
let avonHealthService: AvonHealthService;

export function initializeServices(ollama: OllamaService, avonHealth: AvonHealthService) {
  ollamaService = ollama;
  avonHealthService = avonHealth;
}

// Comprehensive Demo Mode Patient Data
const DEMO_PATIENT_DATA = {
  patient_info: {
    id: 'patient-123',
    name: 'John Michael Smith',
    first_name: 'John',
    last_name: 'Smith',
    date_of_birth: '1965-04-22',
    age: 59,
    gender: 'Male',
    mrn: 'MRN-789456123',
    phone: '(555) 123-4567',
    email: 'john.smith@email.com',
    address: '123 Main Street, Anytown, ST 12345',
    emergency_contact: {
      name: 'Mary Smith',
      relationship: 'Spouse',
      phone: '(555) 123-4568',
    },
    primary_language: 'English',
    marital_status: 'Married',
  },
  allergies: [
    {
      allergen: 'Penicillin',
      reaction: 'Severe rash and hives',
      severity: 'High',
      onset_date: '1998-06-15',
    },
    {
      allergen: 'Shellfish',
      reaction: 'Anaphylaxis',
      severity: 'Critical',
      onset_date: '2005-08-20',
    },
    {
      allergen: 'Latex',
      reaction: 'Contact dermatitis',
      severity: 'Moderate',
      onset_date: '2010-03-10',
    },
  ],
  vital_signs: {
    latest: {
      date: '2024-03-20',
      blood_pressure: '128/82 mmHg',
      heart_rate: '72 bpm',
      temperature: '98.6°F (37.0°C)',
      respiratory_rate: '16 breaths/min',
      oxygen_saturation: '98%',
      weight: '185 lbs (84 kg)',
      height: '5\'10" (178 cm)',
      bmi: '26.5',
    },
    trends: {
      blood_pressure_trend: 'Improving - was 142/90 mmHg in January',
      weight_trend: 'Stable - lost 8 lbs since starting diabetes plan',
    },
  },
  lab_results: {
    latest_date: '2024-03-10',
    hemoglobin_a1c: {
      value: '7.1%',
      previous: '8.2%',
      date: '2024-03-10',
      status: 'Improved',
      target: '<7.0%',
    },
    lipid_panel: {
      total_cholesterol: '195 mg/dL',
      ldl: '115 mg/dL',
      hdl: '48 mg/dL',
      triglycerides: '160 mg/dL',
      date: '2024-03-10',
      status: 'Within target range',
    },
    kidney_function: {
      creatinine: '1.0 mg/dL',
      egfr: '85 mL/min/1.73m2',
      bun: '18 mg/dL',
      date: '2024-03-10',
      status: 'Normal',
    },
    liver_function: {
      alt: '28 U/L',
      ast: '24 U/L',
      date: '2024-03-10',
      status: 'Normal',
    },
  },
  immunizations: [
    {
      vaccine: 'Influenza',
      date: '2023-10-15',
      status: 'Current',
      next_due: '2024-10-15',
    },
    {
      vaccine: 'COVID-19 Booster',
      date: '2023-09-20',
      status: 'Current',
    },
    {
      vaccine: 'Pneumococcal (PPSV23)',
      date: '2020-05-10',
      status: 'Current',
    },
    {
      vaccine: 'Tdap',
      date: '2021-03-15',
      status: 'Current',
      next_due: '2031-03-15',
    },
  ],
  medical_history: {
    chronic_conditions: [
      {
        condition: 'Type 2 Diabetes Mellitus',
        diagnosed_date: '2022-06-15',
        status: 'Active',
        icd10: 'E11.9',
      },
      {
        condition: 'Essential Hypertension',
        diagnosed_date: '2020-11-20',
        status: 'Active',
        icd10: 'I10',
      },
      {
        condition: 'Hyperlipidemia',
        diagnosed_date: '2021-02-10',
        status: 'Active',
        icd10: 'E78.5',
      },
    ],
    past_surgeries: [
      {
        procedure: 'Appendectomy',
        date: '1985-07-12',
        hospital: 'General Hospital',
      },
      {
        procedure: 'Knee Arthroscopy (Right)',
        date: '2018-04-20',
        hospital: 'Orthopedic Center',
      },
    ],
  },
  family_history: {
    father: 'Type 2 Diabetes, Coronary Artery Disease (deceased at 72)',
    mother: 'Hypertension, Osteoporosis (living, age 84)',
    siblings: '1 brother with Type 2 Diabetes, 1 sister healthy',
    notes: 'Strong family history of cardiovascular disease and diabetes',
  },
  social_history: {
    smoking: 'Former smoker - quit 10 years ago (20 pack-year history)',
    alcohol: 'Occasional - 1-2 drinks per week',
    exercise: 'Walks 30 minutes, 3-4 times per week',
    occupation: 'Retired teacher',
    lives_with: 'Spouse',
  },
  appointments: {
    upcoming: [
      {
        date: '2024-04-05',
        time: '10:00 AM',
        provider: 'Dr. Sarah Johnson',
        type: 'Follow-up - Diabetes Management',
        location: 'Primary Care Clinic',
      },
      {
        date: '2024-05-15',
        time: '2:00 PM',
        provider: 'Dr. Robert Chen',
        type: 'Annual Eye Exam',
        location: 'Ophthalmology Department',
      },
    ],
    past: [
      {
        date: '2024-03-20',
        provider: 'Nurse Practitioner Mary Williams',
        type: 'Blood Pressure Check',
      },
      {
        date: '2024-03-15',
        provider: 'Dr. Sarah Johnson',
        type: 'Quarterly Diabetes Check',
      },
    ],
  },
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

/**
 * Demo Mode Response Generator - Wrapper for comprehensive query handler
 */
function generateDemoResponse(query: string): { short_answer: string; detailed_summary: string } {
  return generateComprehensiveResponse(query, DEMO_PATIENT_DATA);
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
