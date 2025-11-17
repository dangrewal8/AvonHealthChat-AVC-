/**
 * Medical Prompt Templates Usage Examples
 *
 * Demonstrates how to use medical prompt templates with Meditron.
 */

import medicalPromptTemplates, {
  ClinicalEntityType,
  PromptOptions,
  TreatmentPlanComponent,
} from '../services/medical-prompt-templates.service';

/**
 * Example 1: Medical Question Answering with Citations
 */
export function exampleMedicalQA() {
  console.log('Example 1: Medical Question Answering\n');
  console.log('='.repeat(80));

  const question = "What medications is the patient currently taking for diabetes?";

  const context = [
    `Artifact ID: artifact_001
Date: 2024-01-15
Content: Patient prescribed metformin 500mg twice daily for type 2 diabetes management.
Blood glucose levels have improved significantly since starting therapy.`,

    `Artifact ID: artifact_002
Date: 2024-02-10
Content: Patient reports good medication adherence. HbA1c improved from 8.2% to 7.1%.
Continue current diabetes medication regimen.`,
  ];

  const options: PromptOptions = {
    includeDisclaimer: true,
    requireCitations: true,
    requireConfidenceLevel: true,
  };

  const prompt = medicalPromptTemplates.medicalQA(question, context, options);

  console.log(prompt);
  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Example 2: Clinical Entity Extraction
 */
export function exampleEntityExtraction() {
  console.log('Example 2: Clinical Entity Extraction\n');
  console.log('='.repeat(80));

  const clinicalNote = `
Patient presents with hypertension (BP 160/95) and type 2 diabetes mellitus.
Prescribed:
- Lisinopril 10mg PO daily for HTN
- Metformin 500mg PO BID for DM

Lab results:
- HbA1c: 7.8% (reference: 4.0-5.6%)
- Creatinine: 1.1 mg/dL (reference: 0.6-1.2 mg/dL)

Patient reports penicillin allergy (rash).
`;

  const entityTypes = [
    ClinicalEntityType.DIAGNOSIS,
    ClinicalEntityType.MEDICATION,
    ClinicalEntityType.LAB_RESULT,
    ClinicalEntityType.ALLERGY,
  ];

  const prompt = medicalPromptTemplates.extractClinicalEntities(clinicalNote, entityTypes);

  console.log(prompt);
  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Example 3: Medical Record Summarization (SOAP Format)
 */
export function exampleMedicalSummarization() {
  console.log('Example 3: Medical Record Summarization (SOAP)\n');
  console.log('='.repeat(80));

  const medicalRecord = `
Date: 2024-11-03
Patient: John Doe, 65yo M

Chief Complaint: Chest pain

HPI: Patient reports sudden onset of substernal chest pain while at rest,
radiating to left arm. Associated with diaphoresis and shortness of breath.
Pain started 2 hours ago. Denies nausea, vomiting. No prior cardiac history.

PMH: Hypertension (on lisinopril 10mg daily), Type 2 DM (on metformin 500mg BID),
Hyperlipidemia (on atorvastatin 40mg daily)

Medications: Lisinopril 10mg daily, Metformin 500mg BID, Atorvastatin 40mg daily

Allergies: NKDA

Physical Exam:
- Vitals: BP 145/88, HR 92, RR 18, Temp 98.6F, SpO2 96% on RA
- Gen: Anxious, diaphoretic
- CV: Regular rate, no murmurs
- Lungs: Clear bilaterally
- Abd: Soft, non-tender

Labs:
- Troponin I: 0.8 ng/mL (elevated, ref <0.04)
- ECG: ST elevation in leads II, III, aVF

Assessment: Acute inferior STEMI

Plan:
- Activate Cath Lab for emergent PCI
- ASA 325mg chewed
- Ticagrelor 180mg loading dose
- Heparin bolus + drip
- Transfer to CCU post-PCI
`;

  const prompt = medicalPromptTemplates.summarizeMedicalRecord(medicalRecord, 'soap');

  console.log(prompt);
  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Example 4: Treatment Plan Analysis
 */
export function exampleTreatmentPlanAnalysis() {
  console.log('Example 4: Treatment Plan Analysis\n');
  console.log('='.repeat(80));

  const treatmentPlan = `
Diagnosis: Type 2 Diabetes Mellitus, newly diagnosed

Treatment Plan:
1. Start metformin 500mg PO BID with meals
2. Lifestyle modifications: diet, exercise
3. Check HbA1c in 3 months

Patient education: monitor for hypoglycemia symptoms
`;

  const components: TreatmentPlanComponent = {
    medications: true,
    procedures: false,
    followUp: true,
    patientEducation: true,
    labOrders: true,
  };

  const prompt = medicalPromptTemplates.analyzeTreatmentPlan(treatmentPlan, components);

  console.log(prompt);
  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Example 5: Differential Diagnosis
 */
export function exampleDifferentialDiagnosis() {
  console.log('Example 5: Differential Diagnosis\n');
  console.log('='.repeat(80));

  const presentation = `
65-year-old male presents with:
- Sudden onset substernal chest pain (8/10 severity)
- Radiating to left arm and jaw
- Associated diaphoresis, nausea
- Shortness of breath
- Pain started 1 hour ago while at rest

Risk factors:
- Hypertension
- Type 2 Diabetes
- Hyperlipidemia
- Family history of CAD (father MI at age 60)
- Current smoker (20 pack-years)

Vital signs:
- BP: 160/95 mmHg
- HR: 95 bpm
- RR: 22/min
- SpO2: 94% on room air
`;

  const prompt = medicalPromptTemplates.differentialDiagnosis(presentation, 5);

  console.log(prompt);
  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Example 6: Medication Reconciliation
 */
export function exampleMedicationReconciliation() {
  console.log('Example 6: Medication Reconciliation\n');
  console.log('='.repeat(80));

  const currentMeds = `
Current Medication List (EMR):
1. Lisinopril 10mg PO daily
2. Metformin 500mg PO BID
3. Atorvastatin 40mg PO daily at bedtime
`;

  const reportedMeds = `
Patient-Reported Medications:
- "Blood pressure pill" - takes in the morning
- "Diabetes medicine" - takes twice a day with meals
- "Cholesterol medication" - takes at night
- Aspirin 81mg daily (not in EMR)
`;

  const prompt = medicalPromptTemplates.medicationReconciliation(currentMeds, reportedMeds);

  console.log(prompt);
  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Example 7: Lab Result Interpretation
 */
export function exampleLabInterpretation() {
  console.log('Example 7: Lab Result Interpretation\n');
  console.log('='.repeat(80));

  const labResults = `
Complete Metabolic Panel:
- Glucose: 185 mg/dL (ref: 70-100)
- Creatinine: 1.8 mg/dL (ref: 0.6-1.2)
- eGFR: 42 mL/min/1.73m² (ref: >60)
- Potassium: 5.3 mEq/L (ref: 3.5-5.0)
- Sodium: 138 mEq/L (ref: 135-145)

Lipid Panel:
- Total Cholesterol: 245 mg/dL (ref: <200)
- LDL: 165 mg/dL (ref: <100)
- HDL: 38 mg/dL (ref: >40)
- Triglycerides: 210 mg/dL (ref: <150)

HbA1c: 8.2% (ref: 4.0-5.6%)
`;

  const clinicalContext = `
Patient: 58yo M with Type 2 Diabetes Mellitus, Hypertension
Current Medications: Metformin 1000mg BID, Lisinopril 20mg daily
`;

  const prompt = medicalPromptTemplates.labResultInterpretation(labResults, clinicalContext);

  console.log(prompt);
  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Example 8: Appending Disclaimers
 */
export function exampleDisclaimers() {
  console.log('Example 8: Medical Disclaimers\n');
  console.log('='.repeat(80));

  const response = `
The patient is currently taking metformin 500mg twice daily for type 2 diabetes management.
Recent HbA1c shows good glycemic control at 7.1%.
`;

  console.log('Short Disclaimer:');
  console.log('-'.repeat(80));
  const withShortDisclaimer = medicalPromptTemplates.appendDisclaimer(response, 'short');
  console.log(withShortDisclaimer);
  console.log();

  console.log('Long Disclaimer:');
  console.log('-'.repeat(80));
  const withLongDisclaimer = medicalPromptTemplates.appendDisclaimer(response, 'long');
  console.log(withLongDisclaimer);

  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Example 9: Brief Medical Summary
 */
export function exampleBriefSummary() {
  console.log('Example 9: Brief Medical Summary\n');
  console.log('='.repeat(80));

  const medicalRecord = `
Patient: 72yo F with multiple chronic conditions

History:
- HTN x 15 years, well-controlled on lisinopril
- Type 2 DM x 10 years, on metformin + insulin glargine
- CAD s/p MI 2018, on aspirin + atorvastatin
- CKD stage 3 (eGFR 45)
- Osteoarthritis bilateral knees

Recent Visit: Patient reports increased knee pain, requests refill of pain medications.

Current Medications: Lisinopril 20mg daily, Metformin 1000mg BID, Insulin glargine 20 units qHS,
Aspirin 81mg daily, Atorvastatin 40mg daily, Acetaminophen PRN
`;

  const prompt = medicalPromptTemplates.summarizeMedicalRecord(medicalRecord, 'brief');

  console.log(prompt);
  console.log('\n' + '='.repeat(80) + '\n');
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║          MEDICAL PROMPT TEMPLATES - USAGE EXAMPLES                           ║');
  console.log('║          Optimized for Meditron via Ollama                                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝');
  console.log('\n');

  exampleMedicalQA();
  exampleEntityExtraction();
  exampleMedicalSummarization();
  exampleTreatmentPlanAnalysis();
  exampleDifferentialDiagnosis();
  exampleMedicationReconciliation();
  exampleLabInterpretation();
  exampleDisclaimers();
  exampleBriefSummary();

  console.log('✅ All examples completed!\n');
  console.log('These prompts are ready to use with Meditron via the Ollama LLM service.\n');
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}
