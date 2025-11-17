# Medical Prompt Templates Guide

**Specialized prompt templates optimized for medical Q&A with Meditron**

---

## Overview

The Medical Prompt Templates service provides pre-engineered prompts specifically designed for medical use cases with Meditron (medical LLM). All prompts follow medical best practices, include safety disclaimers, and are optimized for clinical accuracy.

**File Location:** `backend/src/services/medical-prompt-templates.service.ts`

---

## Quick Start

```typescript
import medicalPromptTemplates from './services/medical-prompt-templates.service';
import { ClinicalEntityType } from './services/medical-prompt-templates.service';

// Generate a medical Q&A prompt
const prompt = medicalPromptTemplates.medicalQA(
  "What medications is the patient taking for diabetes?",
  [
    "Artifact ID: art_001\nContent: Patient on metformin 500mg BID",
    "Artifact ID: art_002\nContent: HbA1c improved to 7.1%"
  ],
  {
    requireCitations: true,
    requireConfidenceLevel: true
  }
);

// Use with Meditron via LLM service
const response = await llmService.generate(prompt);
```

---

## Available Templates

### 1. Medical Question Answering

**Use Case:** Answer clinical questions based on retrieved patient data.

**Features:**
- Citations to source artifacts
- Confidence level indicators
- Constraint to provided context only
- Automatic medical disclaimers

**Example:**
```typescript
const question = "What is the patient's current blood pressure medication?";

const context = [
  `Artifact ID: artifact_001
  Content: Patient prescribed lisinopril 10mg daily for hypertension.
  BP readings show good control at 125/78 mmHg.`
];

const options = {
  includeDisclaimer: true,       // Add medical disclaimer (default: true)
  requireCitations: true,         // Require [artifact_id] citations (default: true)
  requireConfidenceLevel: true,   // Include confidence level (default: true)
};

const prompt = medicalPromptTemplates.medicalQA(question, context, options);
```

**Expected Response Format:**
```
The patient is currently taking lisinopril 10mg daily for hypertension [artifact_001].
Blood pressure control is good with readings of 125/78 mmHg [artifact_001].

Confidence Level: High (direct evidence from medical record)

⚠️ MEDICAL DISCLAIMER: This information is for educational purposes only...
```

---

### 2. Clinical Entity Extraction

**Use Case:** Extract structured clinical data from medical text.

**Supported Entity Types:**
- `MEDICATION` - Drug name, dose, frequency, route
- `DIAGNOSIS` - Condition name, ICD-10 code, status
- `PROCEDURE` - Procedure name, CPT code, date
- `LAB_RESULT` - Test name, value, unit, reference range
- `VITAL_SIGN` - Vital type (BP, HR, etc.), value, unit
- `ALLERGY` - Allergen, reaction, severity
- `SYMPTOM` - Symptom description, severity, onset

**Example:**
```typescript
const clinicalNote = `
Patient presents with hypertension (BP 160/95) and type 2 diabetes.
Prescribed lisinopril 10mg PO daily and metformin 500mg PO BID.
HbA1c: 7.8% (ref: 4.0-5.6%)
Patient allergic to penicillin (rash).
`;

const entityTypes = [
  ClinicalEntityType.DIAGNOSIS,
  ClinicalEntityType.MEDICATION,
  ClinicalEntityType.LAB_RESULT,
  ClinicalEntityType.ALLERGY
];

const prompt = medicalPromptTemplates.extractClinicalEntities(
  clinicalNote,
  entityTypes
);
```

**Expected Output (JSON):**
```json
{
  "diagnoses": [
    {
      "name": "hypertension",
      "icd10_code": "I10",
      "status": "active"
    },
    {
      "name": "type 2 diabetes mellitus",
      "icd10_code": "E11",
      "status": "active"
    }
  ],
  "medications": [
    {
      "name": "lisinopril",
      "dose": "10mg",
      "frequency": "daily",
      "route": "PO"
    },
    {
      "name": "metformin",
      "dose": "500mg",
      "frequency": "BID",
      "route": "PO"
    }
  ],
  "lab_results": [
    {
      "test_name": "HbA1c",
      "value": "7.8",
      "unit": "%",
      "reference_range": "4.0-5.6%"
    }
  ],
  "allergies": [
    {
      "allergen": "penicillin",
      "reaction": "rash",
      "severity": "moderate"
    }
  ]
}
```

---

### 3. Medical Record Summarization

**Use Case:** Summarize medical records in standard clinical formats.

**Supported Formats:**
- `soap` - SOAP note (Subjective, Objective, Assessment, Plan)
- `brief` - Brief summary (<100 words)
- `detailed` - Comprehensive summary with all clinical details

**Example (SOAP Format):**
```typescript
const medicalRecord = `
Patient: 65yo M presenting with chest pain
HPI: Substernal chest pain, radiating to left arm, started 2h ago
PMH: HTN, DM, HLD
Meds: Lisinopril 10mg, Metformin 500mg BID, Atorvastatin 40mg
Exam: BP 145/88, HR 92, diaphoretic
Labs: Troponin I elevated at 0.8 ng/mL, ECG shows ST elevation
Assessment: Acute inferior STEMI
Plan: Activate cath lab, ASA 325mg, ticagrelor loading, heparin drip
`;

const prompt = medicalPromptTemplates.summarizeMedicalRecord(
  medicalRecord,
  'soap'
);
```

**Expected Output:**
```
S: 65yo M c/o substernal chest pain x 2h, radiating to L arm
O: BP 145/88, HR 92, diaphoretic. Troponin I 0.8 (elevated). ECG: ST elevation
A: Acute inferior STEMI
P: Emergent cath lab activation. ASA 325mg, ticagrelor load, heparin drip.
   Transfer to CCU post-PCI
```

---

### 4. Treatment Plan Analysis

**Use Case:** Analyze treatment plans for safety, completeness, and evidence-based practice.

**Analysis Components:**
- `medications` - Dose, frequency, interactions
- `procedures` - Indications, risks, alternatives
- `followUp` - Timeline, monitoring
- `patientEducation` - Lifestyle, warning signs
- `labOrders` - Baseline tests, monitoring labs

**Example:**
```typescript
const treatmentPlan = `
Diagnosis: Type 2 Diabetes Mellitus, newly diagnosed

Plan:
1. Start metformin 500mg PO BID
2. Lifestyle: diet, exercise
3. Check HbA1c in 3 months
`;

const components = {
  medications: true,
  followUp: true,
  patientEducation: true,
  labOrders: true
};

const prompt = medicalPromptTemplates.analyzeTreatmentPlan(
  treatmentPlan,
  components
);
```

**Expected Output:**
```
Safety Assessment:
- No immediate safety concerns identified
- Metformin dose appropriate for newly diagnosed T2DM

Completeness:
Missing elements:
- Baseline labs: Consider checking Cr, eGFR before metformin
- Patient education on hypoglycemia symptoms needed
- Diet/exercise specifics not detailed

Evidence-Based Recommendations:
- Add SMBG (self-monitoring blood glucose) recommendation
- Consider diabetes education referral
- Specify target HbA1c goal (<7% for most patients)

Overall Assessment:
Plan is reasonable but would benefit from baseline renal function testing
and more detailed patient education.
```

---

### 5. Differential Diagnosis

**Use Case:** Generate differential diagnoses based on patient presentation.

**Example:**
```typescript
const presentation = `
65yo M with sudden onset chest pain (8/10), radiating to left arm.
Associated diaphoresis, SOB. Pain started at rest 1h ago.
Risk factors: HTN, DM, HLD, smoking (20 pack-years)
Vitals: BP 160/95, HR 95, RR 22, SpO2 94% RA
`;

const prompt = medicalPromptTemplates.differentialDiagnosis(
  presentation,
  5  // Top 5 diagnoses
);
```

**Expected Output:**
```
1. Acute Myocardial Infarction (STEMI/NSTEMI)
   - Likelihood: High
   - Supporting Evidence: Chest pain radiating to arm, diaphoresis,
     multiple cardiac risk factors (HTN, DM, HLD, smoking)
   - Distinguishing Features: Typical anginal presentation at rest
   - Next Steps: ECG, troponin, activate cath lab if STEMI

2. Unstable Angina
   - Likelihood: Medium-High
   - Supporting Evidence: Chest pain at rest, cardiac risk factors
   - Distinguishing Features: Pain at rest, but troponin may be negative
   - Next Steps: Serial ECGs, troponin, cardiology consult

[... continues with PE, aortic dissection, etc.]
```

---

### 6. Medication Reconciliation

**Use Case:** Compare medication lists to identify discrepancies and ensure safety.

**Example:**
```typescript
const currentMeds = `
EMR Medication List:
- Lisinopril 10mg PO daily
- Metformin 500mg PO BID
- Atorvastatin 40mg PO at bedtime
`;

const reportedMeds = `
Patient Reports:
- "Blood pressure pill" - morning
- "Diabetes medicine" - twice daily with meals
- "Cholesterol pill" - at night
- Aspirin 81mg daily (NOT in EMR)
`;

const prompt = medicalPromptTemplates.medicationReconciliation(
  currentMeds,
  reportedMeds
);
```

**Expected Output:**
```
MATCHED MEDICATIONS:
1. Lisinopril 10mg = "blood pressure pill"
2. Metformin 500mg BID = "diabetes medicine"
3. Atorvastatin 40mg = "cholesterol pill"

DISCREPANCIES:
- Aspirin 81mg daily reported by patient but NOT in EMR
  Action: Verify with patient, update EMR if confirmed

POTENTIAL INTERACTIONS:
- No concerning interactions identified

RECOMMENDATIONS:
1. Update EMR to include aspirin 81mg daily
2. Educate patient on medication names for better communication
3. Consider medication list printout for patient
```

---

### 7. Lab Result Interpretation

**Use Case:** Interpret lab results in clinical context.

**Example:**
```typescript
const labResults = `
Glucose: 185 mg/dL (ref: 70-100)
HbA1c: 8.2% (ref: 4.0-5.6%)
Creatinine: 1.8 mg/dL (ref: 0.6-1.2)
eGFR: 42 mL/min/1.73m² (ref: >60)
Potassium: 5.3 mEq/L (ref: 3.5-5.0)
`;

const clinicalContext = `
Patient: 58yo M with T2DM, HTN
Medications: Metformin 1000mg BID, Lisinopril 20mg daily
`;

const prompt = medicalPromptTemplates.labResultInterpretation(
  labResults,
  clinicalContext
);
```

**Expected Output:**
```
NORMAL RESULTS:
None - all values abnormal

ABNORMAL RESULTS:

1. Glucose: 185 mg/dL (ref: 70-100)
   - Interpretation: Hyperglycemia
   - Possible Causes: Uncontrolled T2DM, suboptimal medication regimen
   - Recommended Actions: Increase metformin dose or add second agent,
     review diet compliance, check post-prandial timing

2. HbA1c: 8.2% (ref: 4.0-5.6%)
   - Interpretation: Poor glycemic control over past 3 months
   - Possible Causes: Medication non-adherence, diet non-compliance,
     progression of disease
   - Recommended Actions: Intensify diabetes therapy, consider adding
     GLP-1 agonist or insulin

3. Creatinine: 1.8 mg/dL + eGFR: 42 (CKD Stage 3a)
   - Interpretation: Moderate renal impairment
   - Possible Causes: Diabetic nephropathy, hypertensive nephropathy
   - Recommended Actions: Monitor renal function, adjust metformin dose
     if eGFR <45, consider nephrology referral

4. Potassium: 5.3 mEq/L (ref: 3.5-5.0)
   - Interpretation: Mild hyperkalemia
   - Possible Causes: ACE inhibitor (lisinopril) + CKD
   - Recommended Actions: Recheck K+, dietary counseling (low K+ diet),
     monitor closely, may need to adjust lisinopril

CRITICAL VALUES:
None requiring immediate intervention
```

---

## Medical Disclaimers

All prompts automatically include medical disclaimers when appropriate.

### Getting Disclaimer Text

```typescript
// Get short disclaimer
const shortDisclaimer = medicalPromptTemplates.getMedicalDisclaimer('short');
// "This information is for educational purposes only and does not constitute medical advice."

// Get long disclaimer (default)
const longDisclaimer = medicalPromptTemplates.getMedicalDisclaimer('long');
// "⚠️ MEDICAL DISCLAIMER: This information is generated by an AI system..."
```

### Appending Disclaimers to Responses

```typescript
const response = "Patient is taking metformin 500mg BID for diabetes.";

// Append short disclaimer
const withShort = medicalPromptTemplates.appendDisclaimer(response, 'short');

// Append long disclaimer
const withLong = medicalPromptTemplates.appendDisclaimer(response, 'long');
```

---

## Integration with LLM Service

### Using with Ollama/Meditron

```typescript
import llmService from './services/llm-factory.service';
import medicalPromptTemplates from './services/medical-prompt-templates.service';

// Generate prompt
const prompt = medicalPromptTemplates.medicalQA(question, context);

// Use with LLM factory (automatically uses Meditron if configured)
const response = await llmService.generate(prompt, {
  temperature: 0.1,  // Low temperature for medical accuracy
  systemPrompt: '',  // Already included in template
});

console.log(response);
```

### Using with Two-Pass Generation

```typescript
import twoPassGenerator from './services/two-pass-generator.service';
import medicalPromptTemplates from './services/medical-prompt-templates.service';

// Extract entities in pass 1
const extractionPrompt = medicalPromptTemplates.extractClinicalEntities(
  clinicalNote,
  [ClinicalEntityType.MEDICATION, ClinicalEntityType.DIAGNOSIS]
);

const result = await twoPassGenerator.generateAnswer(
  retrievalCandidates,
  structuredQuery
);

// result.extractions contains structured medical entities
// result.summary contains natural language summary with disclaimer
```

---

## Best Practices

### 1. Always Use Low Temperature for Medical Tasks

```typescript
// Good - Deterministic medical extraction
await llmService.extract(prompt, { temperature: 0.0 });

// Good - Slightly creative but still accurate summarization
await llmService.summarize(prompt, { temperature: 0.1 });

// Bad - Too creative for medical facts
await llmService.generate(prompt, { temperature: 0.7 });
```

### 2. Require Citations for Patient Safety

```typescript
const options = {
  requireCitations: true,  // Always enable for medical Q&A
  requireConfidenceLevel: true,  // Helps assess reliability
};

const prompt = medicalPromptTemplates.medicalQA(question, context, options);
```

### 3. Validate JSON Outputs from Entity Extraction

```typescript
const prompt = medicalPromptTemplates.extractClinicalEntities(text, entityTypes);
const response = await llmService.generateJSON(prompt);

// Validate JSON schema
if (!response.medications || !Array.isArray(response.medications)) {
  throw new Error('Invalid entity extraction format');
}

// Validate medical terminology
for (const med of response.medications) {
  if (!med.name || !med.dose || !med.frequency) {
    console.warn('Incomplete medication extraction:', med);
  }
}
```

### 4. Include Clinical Context in Lab Interpretation

```typescript
// Good - Provides context
const prompt = medicalPromptTemplates.labResultInterpretation(
  labResults,
  "Patient with T2DM on metformin, HTN on lisinopril"
);

// Bad - No context
const prompt = medicalPromptTemplates.labResultInterpretation(labResults);
```

### 5. Use Appropriate Summary Format

```typescript
// For quick review - use brief
const brief = medicalPromptTemplates.summarizeMedicalRecord(record, 'brief');

// For comprehensive documentation - use SOAP
const soap = medicalPromptTemplates.summarizeMedicalRecord(record, 'soap');

// For complete clinical picture - use detailed
const detailed = medicalPromptTemplates.summarizeMedicalRecord(record, 'detailed');
```

---

## Examples

See complete usage examples in:
- **File**: `backend/src/examples/medical-prompt-templates.example.ts`

Run examples:
```bash
npm run example:medical-prompts
```

---

## TypeScript Types

### PromptOptions

```typescript
interface PromptOptions {
  includeDisclaimer?: boolean;       // Include medical disclaimer (default: true)
  requireCitations?: boolean;        // Require source citations (default: true)
  requireConfidenceLevel?: boolean;  // Include confidence levels (default: true)
  maxTokens?: number;                // Reserved for future use
  temperature?: number;              // Reserved for future use
}
```

### ClinicalEntityType

```typescript
enum ClinicalEntityType {
  MEDICATION = 'medication',
  DIAGNOSIS = 'diagnosis',
  PROCEDURE = 'procedure',
  LAB_RESULT = 'lab_result',
  VITAL_SIGN = 'vital_sign',
  ALLERGY = 'allergy',
  SYMPTOM = 'symptom',
}
```

### TreatmentPlanComponent

```typescript
interface TreatmentPlanComponent {
  medications?: boolean;      // Analyze medication plan
  procedures?: boolean;       // Analyze procedure plan
  followUp?: boolean;         // Analyze follow-up plan
  patientEducation?: boolean; // Analyze patient education
  labOrders?: boolean;        // Analyze lab orders
}
```

---

## Performance Considerations

### Prompt Length

- **Medical Q&A**: ~500-800 tokens (depends on context)
- **Entity Extraction**: ~300-500 tokens
- **Summarization**: ~400-600 tokens
- **Differential Diagnosis**: ~300-500 tokens

### Recommended Token Budgets

```typescript
const CONTEXT_BUDGET = 2000;  // Max tokens for retrieved context
const PROMPT_BUDGET = 800;    // Max tokens for prompt template
const RESPONSE_BUDGET = 1200; // Max tokens for LLM response
// Total: 4000 tokens (within Meditron's context window)
```

---

## Troubleshooting

### Issue: Responses lack medical terminology

**Solution:** Ensure using Meditron model, not Llama3:
```bash
# Check current model
ollama list | grep meditron

# Update .env
OLLAMA_LLM_MODEL=meditron
```

### Issue: Responses don't include citations

**Solution:** Enable citation requirement:
```typescript
const options = { requireCitations: true };
const prompt = medicalPromptTemplates.medicalQA(question, context, options);
```

### Issue: JSON extraction returns invalid format

**Solution:** Add explicit JSON schema validation:
```typescript
const response = await llmService.generateJSON(prompt);

// Validate against expected schema
const isValid = validateMedicalEntitySchema(response);
if (!isValid) {
  // Retry or use fallback
}
```

---

## Related Documentation

- [Meditron Setup Guide](MEDITRON_SETUP.md)
- [Ollama Setup](OLLAMA_SETUP.md)
- [LLM Factory Service](src/services/llm-factory.service.ts)
- [Two-Pass Generator](src/services/two-pass-generator.service.ts)

---

**Last Updated**: November 2024
**Version**: 1.0.0
**Maintained by**: Avon Health Engineering Team
