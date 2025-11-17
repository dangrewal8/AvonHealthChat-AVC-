# Option B: Multi-Stage Implementation Prompts

**Purpose:** Staged prompts for comprehensive RAG implementation supporting ALL 27 data endpoints
**Approach:** Efficient, tech-stack-compliant, testable incremental implementation

---

# STAGE 1: Type Definitions + Tier 1 Medical Data

## Tech Stack Compliance

**REQUIRED TECH STACK:**
- ✅ Node.js 18+
- ✅ TypeScript (strict mode)
- ✅ Express.js
- ✅ PostgreSQL with `pg` package (raw SQL only)
- ✅ Ollama (local AI - HIPAA compliant)
  - Meditron 7B (medical LLM)
  - nomic-embed-text (768-dimensional embeddings)
- ✅ FAISS vector database (local storage)
- ❌ NO ORMs (Prisma, TypeORM, Sequelize)
- ❌ NO Python
- ❌ NO external AI APIs (OpenAI, Anthropic, etc.)

## Objective

Extend the RAG system to support **3 new Tier 1 medical data types** (in addition to existing 3):
- ✅ Existing: `care_plan`, `medication`, `note`
- 🆕 New: `document`, `condition`, `allergy`

This will increase supported records from ~900 to ~2,200 (662 notes + 718 documents + 155 meds + 201 conditions + 204 allergies + 82 care plans).

## Files to Modify

### 1. `/backend/src/types/artifact.types.ts`

**Current:**
```typescript
export type ArtifactType = 'care_plan' | 'medication' | 'note';
```

**Change to:**
```typescript
export type ArtifactType =
  // Tier 1 - Critical Medical Data
  | 'note'          // ✅ Existing: 662 records
  | 'document'      // 🆕 NEW: 718 records (lab reports, imaging, referrals)
  | 'medication'    // ✅ Existing: 155 records
  | 'condition'     // 🆕 NEW: 201 records (diagnoses, ICD-10 codes)
  | 'allergy'       // 🆕 NEW: 204 records (allergens, reactions)
  | 'care_plan';    // ✅ Existing: 82 records
```

### 2. `/backend/src/types/emr.types.ts`

**Line 1 - Make same change as above:**
```typescript
export type ArtifactType =
  | 'note'
  | 'document'
  | 'medication'
  | 'condition'
  | 'allergy'
  | 'care_plan';
```

**Lines 56-63 - Update FetchAllResult interface:**
```typescript
export interface FetchAllResult {
  // Tier 1 types
  notes: any[];
  documents: any[];        // 🆕 NEW
  medications: any[];
  conditions: any[];       // 🆕 NEW
  allergies: any[];        // 🆕 NEW
  carePlans: any[];
  cached: boolean;
  fetchTime: number;
  totalCount: number;
}
```

### 3. `/backend/src/services/emr.service.ts`

**Add 3 new fetch methods (after existing methods, around line 60):**

```typescript
  /**
   * Fetch clinical documents for a patient
   */
  async fetchDocuments(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('document', '/v2/documents', patientId, options);
  }

  /**
   * Fetch conditions/diagnoses for a patient
   */
  async fetchConditions(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('condition', '/v2/conditions', patientId, options);
  }

  /**
   * Fetch allergies for a patient
   */
  async fetchAllergies(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('allergy', '/v2/allergies', patientId, options);
  }
```

**Update fetchAll() method (lines 65-101) to include new types:**

**Current:**
```typescript
  async fetchAll(patientId: string): Promise<FetchAllResult> {
    const startTime = Date.now();

    console.log(`[EMR Service] Fetching all data for patient ${patientId}`);

    try {
      // Fetch all data in parallel
      const [carePlansResult, medicationsResult, notesResult] = await Promise.all([
        this.fetchCarePlans(patientId),
        this.fetchMedications(patientId),
        this.fetchNotes(patientId),
      ]);

      const fetchTime = Date.now() - startTime;
      const cached =
        carePlansResult.cached && medicationsResult.cached && notesResult.cached;

      const totalCount =
        carePlansResult.count + medicationsResult.count + notesResult.count;

      console.log(
        `[EMR Service] ✓ Fetched all data for patient ${patientId} (${totalCount} total items, cached: ${cached}, ${fetchTime}ms)`
      );

      return {
        carePlans: carePlansResult.data,
        medications: medicationsResult.data,
        notes: notesResult.data,
        cached,
        fetchTime,
        totalCount,
      };
    } catch (error) {
      console.error(`[EMR Service] Failed to fetch all data for patient ${patientId}:`, error);
      throw error;
    }
  }
```

**Replace with:**
```typescript
  async fetchAll(patientId: string): Promise<FetchAllResult> {
    const startTime = Date.now();

    console.log(`[EMR Service] Fetching all data for patient ${patientId}`);

    try {
      // Fetch all Tier 1 data in parallel
      const [
        notesResult,
        documentsResult,
        medicationsResult,
        conditionsResult,
        allergiesResult,
        carePlansResult,
      ] = await Promise.all([
        this.fetchNotes(patientId),
        this.fetchDocuments(patientId),
        this.fetchMedications(patientId),
        this.fetchConditions(patientId),
        this.fetchAllergies(patientId),
        this.fetchCarePlans(patientId),
      ]);

      const fetchTime = Date.now() - startTime;

      const allResults = [
        notesResult,
        documentsResult,
        medicationsResult,
        conditionsResult,
        allergiesResult,
        carePlansResult,
      ];

      const cached = allResults.every((r) => r.cached);
      const totalCount = allResults.reduce((sum, r) => sum + r.count, 0);

      console.log(
        `[EMR Service] ✓ Fetched all Tier 1 data for patient ${patientId} (${totalCount} total items, cached: ${cached}, ${fetchTime}ms)`
      );

      return {
        notes: notesResult.data,
        documents: documentsResult.data,
        medications: medicationsResult.data,
        conditions: conditionsResult.data,
        allergies: allergiesResult.data,
        carePlans: carePlansResult.data,
        cached,
        fetchTime,
        totalCount,
      };
    } catch (error) {
      console.error(`[EMR Service] Failed to fetch all data for patient ${patientId}:`, error);
      throw error;
    }
  }
```

### 4. `/backend/src/services/normalization.service.ts`

**Add 3 new normalization methods (after existing normalization methods, around line 77):**

```typescript
  /**
   * Normalize a clinical document from raw API data
   */
  normalizeDocument(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'document',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['created_at', 'document_date', 'date']),
      title: this.extractTitle(rawData, ['title', 'document_type', 'type', 'name']),
      text: this.extractText(rawData, ['content', 'text', 'body', 'document_text']),
      source: this.constructSourceUrl('documents', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'created_at']),
    };

    return artifact;
  }

  /**
   * Normalize a condition/diagnosis from raw API data
   */
  normalizeCondition(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'condition',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData, ['diagnosing_provider', 'provider', 'author']),
      occurred_at: this.extractDate(rawData, ['onset_date', 'diagnosis_date', 'created_at']),
      title: this.extractConditionTitle(rawData),
      text: this.extractConditionText(rawData),
      source: this.constructSourceUrl('conditions', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'onset_date']),
    };

    return artifact;
  }

  /**
   * Normalize an allergy from raw API data
   */
  normalizeAllergy(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'allergy',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['onset_date', 'created_at', 'recorded_at']),
      title: this.extractAllergyTitle(rawData),
      text: this.extractAllergyText(rawData),
      source: this.constructSourceUrl('allergies', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'onset_date']),
    };

    return artifact;
  }
```

**Add 3 helper methods for text extraction (after existing helpers, around line 354):**

```typescript
  /**
   * Extract condition-specific title
   */
  private extractConditionTitle(rawData: any): string | undefined {
    const name = rawData.name || rawData.condition_name || rawData.diagnosis;
    const code = rawData.code || rawData.icd10_code || rawData.icd_code;

    if (name && code) {
      return `${name} (${code})`;
    } else if (name) {
      return name;
    }

    return undefined;
  }

  /**
   * Extract condition-specific text
   */
  private extractConditionText(rawData: any): string {
    const parts: string[] = [];

    const name = rawData.name || rawData.condition_name || rawData.diagnosis;
    if (name) parts.push(`Diagnosis: ${name}`);

    const code = rawData.code || rawData.icd10_code || rawData.icd_code;
    if (code) parts.push(`Code: ${code}`);

    const status = rawData.status || rawData.clinical_status;
    if (status) parts.push(`Status: ${status}`);

    const onset = rawData.onset_date || rawData.diagnosis_date;
    if (onset) parts.push(`Onset: ${onset}`);

    const severity = rawData.severity;
    if (severity) parts.push(`Severity: ${severity}`);

    const notes = rawData.clinical_notes || rawData.notes || rawData.description;
    if (notes) parts.push(`Notes: ${notes}`);

    if (parts.length > 0) {
      return parts.join('. ');
    }

    // Fallback
    return this.extractText(rawData, ['description', 'content', 'text', 'summary']);
  }

  /**
   * Extract allergy-specific title
   */
  private extractAllergyTitle(rawData: any): string | undefined {
    return (
      rawData.allergen ||
      rawData.substance ||
      rawData.name ||
      rawData.allergy_name ||
      undefined
    );
  }

  /**
   * Extract allergy-specific text
   */
  private extractAllergyText(rawData: any): string {
    const parts: string[] = [];

    const allergen = rawData.allergen || rawData.substance || rawData.name;
    if (allergen) parts.push(`Allergen: ${allergen}`);

    const reaction = rawData.reaction || rawData.reaction_type;
    if (reaction) {
      const reactionText = Array.isArray(reaction) ? reaction.join(', ') : reaction;
      parts.push(`Reaction: ${reactionText}`);
    }

    const severity = rawData.severity || rawData.criticality;
    if (severity) parts.push(`Severity: ${severity}`);

    const category = rawData.category || rawData.allergy_type;
    if (category) parts.push(`Category: ${category}`);

    const onset = rawData.onset_date;
    if (onset) parts.push(`Onset: ${onset}`);

    const notes = rawData.notes || rawData.description || rawData.comments;
    if (notes) parts.push(`Notes: ${notes}`);

    if (parts.length > 0) {
      return parts.join('. ');
    }

    // Fallback
    return this.extractText(rawData, ['description', 'content', 'text']);
  }
```

**Update normalize() switch statement (around line 84-96):**

**Current:**
```typescript
  normalize(rawData: any, type: ArtifactType): NormalizationResult {
    let artifact: Artifact;

    switch (type) {
      case 'care_plan':
        artifact = this.normalizeCarePlan(rawData);
        break;
      case 'medication':
        artifact = this.normalizeMedication(rawData);
        break;
      case 'note':
        artifact = this.normalizeNote(rawData);
        break;
      default:
        throw new Error(`Unknown artifact type: ${type}`);
    }

    const validation = this.validateArtifact(artifact);

    return {
      artifact,
      validation,
    };
  }
```

**Replace with:**
```typescript
  normalize(rawData: any, type: ArtifactType): NormalizationResult {
    let artifact: Artifact;

    switch (type) {
      case 'note':
        artifact = this.normalizeNote(rawData);
        break;
      case 'document':
        artifact = this.normalizeDocument(rawData);
        break;
      case 'medication':
        artifact = this.normalizeMedication(rawData);
        break;
      case 'condition':
        artifact = this.normalizeCondition(rawData);
        break;
      case 'allergy':
        artifact = this.normalizeAllergy(rawData);
        break;
      case 'care_plan':
        artifact = this.normalizeCarePlan(rawData);
        break;
      default:
        throw new Error(`Unknown artifact type: ${type}`);
    }

    const validation = this.validateArtifact(artifact);

    return {
      artifact,
      validation,
    };
  }
```

### 5. `/backend/src/services/emr-normalized.service.ts`

**Add 3 new wrapper methods (after existing methods, around line 62):**

```typescript
  /**
   * Fetch and normalize clinical documents for a patient
   */
  async fetchDocuments(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchDocuments(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'document');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  /**
   * Fetch and normalize conditions for a patient
   */
  async fetchConditions(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchConditions(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'condition');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  /**
   * Fetch and normalize allergies for a patient
   */
  async fetchAllergies(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchAllergies(patientId, options);

    const artifacts = normalizationService.normalizeBatch(result.data, 'allergy');

    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }
```

**Update fetchAll() method (lines 67-97):**

**Current:**
```typescript
  async fetchAll(patientId: string): Promise<{
    artifacts: Artifact[];
    byType: {
      carePlans: Artifact[];
      medications: Artifact[];
      notes: Artifact[];
    };
    cached: boolean;
    fetchTime: number;
    totalCount: number;
  }> {
    const result = await emrService.fetchAll(patientId);

    const carePlans = normalizationService.normalizeBatch(result.carePlans, 'care_plan');
    const medications = normalizationService.normalizeBatch(result.medications, 'medication');
    const notes = normalizationService.normalizeBatch(result.notes, 'note');

    const artifacts = [...carePlans, ...medications, ...notes];

    return {
      artifacts,
      byType: {
        carePlans,
        medications,
        notes,
      },
      cached: result.cached,
      fetchTime: result.fetchTime,
      totalCount: artifacts.length,
    };
  }
```

**Replace with:**
```typescript
  async fetchAll(patientId: string): Promise<{
    artifacts: Artifact[];
    byType: {
      notes: Artifact[];
      documents: Artifact[];
      medications: Artifact[];
      conditions: Artifact[];
      allergies: Artifact[];
      carePlans: Artifact[];
    };
    cached: boolean;
    fetchTime: number;
    totalCount: number;
  }> {
    const result = await emrService.fetchAll(patientId);

    const notes = normalizationService.normalizeBatch(result.notes, 'note');
    const documents = normalizationService.normalizeBatch(result.documents, 'document');
    const medications = normalizationService.normalizeBatch(result.medications, 'medication');
    const conditions = normalizationService.normalizeBatch(result.conditions, 'condition');
    const allergies = normalizationService.normalizeBatch(result.allergies, 'allergy');
    const carePlans = normalizationService.normalizeBatch(result.carePlans, 'care_plan');

    const artifacts = [
      ...notes,
      ...documents,
      ...medications,
      ...conditions,
      ...allergies,
      ...carePlans,
    ];

    return {
      artifacts,
      byType: {
        notes,
        documents,
        medications,
        conditions,
        allergies,
        carePlans,
      },
      cached: result.cached,
      fetchTime: result.fetchTime,
      totalCount: artifacts.length,
    };
  }
```

### 6. `/backend/src/controllers/indexing.controller.ts`

**Update statistics reporting in indexPatient() method (lines 74-82 and 187-196):**

**Find this code (around line 74):**
```typescript
      const carePlansCount = emrData.byType.carePlans.length;
      const medicationsCount = emrData.byType.medications.length;
      const notesCount = emrData.byType.notes.length;
      const totalArtifacts = emrData.totalCount;

      console.log(
        `[Indexing] ✓ Fetched ${totalArtifacts} artifacts (${fetchTime}ms):`,
        `${carePlansCount} care plans, ${medicationsCount} medications, ${notesCount} notes`
      );
```

**Replace with:**
```typescript
      const notesCount = emrData.byType.notes.length;
      const documentsCount = emrData.byType.documents.length;
      const medicationsCount = emrData.byType.medications.length;
      const conditionsCount = emrData.byType.conditions.length;
      const allergiesCount = emrData.byType.allergies.length;
      const carePlansCount = emrData.byType.carePlans.length;
      const totalArtifacts = emrData.totalCount;

      console.log(
        `[Indexing] ✓ Fetched ${totalArtifacts} Tier 1 artifacts (${fetchTime}ms):`,
        `${notesCount} notes, ${documentsCount} documents, ${medicationsCount} medications, ` +
        `${conditionsCount} conditions, ${allergiesCount} allergies, ${carePlansCount} care plans`
      );
```

**Find this code (around line 89):**
```typescript
          byType: {
            care_plans: 0,
            medications: 0,
            notes: 0,
          },
```

**Replace with:**
```typescript
          byType: {
            notes: 0,
            documents: 0,
            medications: 0,
            conditions: 0,
            allergies: 0,
            care_plans: 0,
          },
```

**Find this code (around line 137):**
```typescript
          byType: {
            care_plans: carePlansCount,
            medications: medicationsCount,
            notes: notesCount,
          },
```

**Replace with:**
```typescript
          byType: {
            notes: notesCount,
            documents: documentsCount,
            medications: medicationsCount,
            conditions: conditionsCount,
            allergies: allergiesCount,
            care_plans: carePlansCount,
          },
```

**Find this code (around line 186):**
```typescript
        byType: {
          care_plans: carePlansCount,
          medications: medicationsCount,
          notes: notesCount,
        },
```

**Replace with:**
```typescript
        byType: {
          notes: notesCount,
          documents: documentsCount,
          medications: medicationsCount,
          conditions: conditionsCount,
          allergies: allergiesCount,
          care_plans: carePlansCount,
        },
```

**Find this code (around line 200):**
```typescript
        artifacts: {
          care_plans: carePlansCount,
          medications: medicationsCount,
          notes: notesCount,
          total: totalArtifacts,
        },
```

**Replace with:**
```typescript
        artifacts: {
          notes: notesCount,
          documents: documentsCount,
          medications: medicationsCount,
          conditions: conditionsCount,
          allergies: allergiesCount,
          care_plans: carePlansCount,
          total: totalArtifacts,
        },
```

## Testing & Verification

### Step 1: Compile TypeScript
```bash
cd /home/dangr/Avonhealthtest/backend
npm run build
```

**Expected:** No compilation errors. If errors occur, fix type mismatches.

### Step 2: Run Indexing Endpoint
```bash
curl -X POST http://localhost:3001/api/index/patient/user_3kmUMGZdObZMsmXwp0T8Pfp4e5u1 \
  -H "Content-Type: application/json" \
  -d '{"force_reindex": true}'
```

**Expected Response:**
```json
{
  "success": true,
  "indexed_count": 2222,
  "byType": {
    "notes": 662,
    "documents": 718,
    "medications": 155,
    "conditions": 201,
    "allergies": 204,
    "care_plans": 82
  },
  "chunks_created": ~1500,
  "processing_time_ms": <varies>
}
```

### Step 3: Verify Data Fetching

Check backend logs for:
```
[EMR Service] Fetching all data for patient user_3kmUMGZdObZMsmXwp0T8Pfp4e5u1
[EMR Service] ✓ Fetched all Tier 1 data for patient ... (2222 total items, ...)
[Indexing] ✓ Fetched 2222 Tier 1 artifacts (...ms): 662 notes, 718 documents, ...
```

### Step 4: Test Chat Queries (if chat endpoint exists)

```bash
# Test allergy query
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What allergies does this patient have?"}'

# Test condition query
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What medical conditions does the patient have?"}'

# Test document query
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me recent lab reports or imaging results"}'
```

**Expected:** Responses should reference allergies, conditions, and documents in the answer.

## Success Criteria

✅ **TypeScript compiles without errors**
✅ **Indexing endpoint returns 2,222 records (up from ~900)**
✅ **byType shows all 6 artifact types with correct counts**
✅ **Chunks created increases to ~1,500 (from ~500)**
✅ **Chat queries can retrieve allergies, conditions, and documents**
✅ **No runtime errors in backend logs**

## Notes

- All changes use existing infrastructure (fetchData, normalizeBatch, etc.)
- No architectural changes needed
- Total new code: ~300 lines across 6 files
- Implementation time: ~1 hour
- Tech stack compliant (TypeScript, Node.js, no ORMs, no Python)

---

# STAGE 2: Tier 2 High-Value Data Types

## Tech Stack Compliance

**REQUIRED TECH STACK:**
- ✅ Node.js 18+
- ✅ TypeScript (strict mode)
- ✅ Express.js
- ✅ PostgreSQL with `pg` package (raw SQL only)
- ✅ Ollama (local AI - HIPAA compliant)
  - Meditron 7B (medical LLM)
  - nomic-embed-text (768-dimensional embeddings)
- ✅ FAISS vector database (local storage)
- ❌ NO ORMs (Prisma, TypeORM, Sequelize)
- ❌ NO Python
- ❌ NO external AI APIs (OpenAI, Anthropic, etc.)

## Objective

Add **4 new Tier 2 data types** with high RAG value:
- 🆕 `form_response` (748 records) - Patient intake forms, health questionnaires
- 🆕 `message` (891 records) - Patient-provider messages
- 🆕 `lab_observation` (419 records) - Individual lab test results
- 🆕 `vital` (199 records) - Vital sign measurements

This will increase total records from ~2,200 to ~4,500.

## Files to Modify

### 1. `/backend/src/types/artifact.types.ts`

**Add to ArtifactType:**
```typescript
export type ArtifactType =
  // Tier 1 - Critical Medical Data
  | 'note'
  | 'document'
  | 'medication'
  | 'condition'
  | 'allergy'
  | 'care_plan'
  // Tier 2 - High Value Data
  | 'form_response'    // 🆕 NEW: 748 records
  | 'message'          // 🆕 NEW: 891 records
  | 'lab_observation'  // 🆕 NEW: 419 records
  | 'vital';           // 🆕 NEW: 199 records
```

### 2. `/backend/src/types/emr.types.ts`

**Update ArtifactType (same as above)**

**Update FetchAllResult:**
```typescript
export interface FetchAllResult {
  // Tier 1
  notes: any[];
  documents: any[];
  medications: any[];
  conditions: any[];
  allergies: any[];
  carePlans: any[];
  // Tier 2
  formResponses: any[];      // 🆕 NEW
  messages: any[];           // 🆕 NEW
  labObservations: any[];    // 🆕 NEW
  vitals: any[];             // 🆕 NEW
  cached: boolean;
  fetchTime: number;
  totalCount: number;
}
```

### 3. `/backend/src/services/emr.service.ts`

**Add 4 fetch methods:**
```typescript
  /**
   * Fetch form responses for a patient
   */
  async fetchFormResponses(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('form_response', '/v2/form_responses', patientId, options);
  }

  /**
   * Fetch messages for a patient
   */
  async fetchMessages(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('message', '/v2/messages', patientId, options);
  }

  /**
   * Fetch lab observations for a patient
   */
  async fetchLabObservations(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('lab_observation', '/v2/lab_observations', patientId, options);
  }

  /**
   * Fetch vital signs for a patient
   */
  async fetchVitals(
    patientId: string,
    options?: FilterOptions
  ): Promise<FetchResult<any[]>> {
    return this.fetchData('vital', '/v2/vitals', patientId, options);
  }
```

**Update fetchAll() to include Tier 2:**
```typescript
  async fetchAll(patientId: string): Promise<FetchAllResult> {
    const startTime = Date.now();

    console.log(`[EMR Service] Fetching all data for patient ${patientId}`);

    try {
      // Fetch Tier 1 + Tier 2 data in parallel
      const [
        notesResult,
        documentsResult,
        medicationsResult,
        conditionsResult,
        allergiesResult,
        carePlansResult,
        formResponsesResult,
        messagesResult,
        labObservationsResult,
        vitalsResult,
      ] = await Promise.all([
        this.fetchNotes(patientId),
        this.fetchDocuments(patientId),
        this.fetchMedications(patientId),
        this.fetchConditions(patientId),
        this.fetchAllergies(patientId),
        this.fetchCarePlans(patientId),
        this.fetchFormResponses(patientId),
        this.fetchMessages(patientId),
        this.fetchLabObservations(patientId),
        this.fetchVitals(patientId),
      ]);

      const fetchTime = Date.now() - startTime;

      const allResults = [
        notesResult,
        documentsResult,
        medicationsResult,
        conditionsResult,
        allergiesResult,
        carePlansResult,
        formResponsesResult,
        messagesResult,
        labObservationsResult,
        vitalsResult,
      ];

      const cached = allResults.every((r) => r.cached);
      const totalCount = allResults.reduce((sum, r) => sum + r.count, 0);

      console.log(
        `[EMR Service] ✓ Fetched all Tier 1+2 data for patient ${patientId} (${totalCount} total items, cached: ${cached}, ${fetchTime}ms)`
      );

      return {
        notes: notesResult.data,
        documents: documentsResult.data,
        medications: medicationsResult.data,
        conditions: conditionsResult.data,
        allergies: allergiesResult.data,
        carePlans: carePlansResult.data,
        formResponses: formResponsesResult.data,
        messages: messagesResult.data,
        labObservations: labObservationsResult.data,
        vitals: vitalsResult.data,
        cached,
        fetchTime,
        totalCount,
      };
    } catch (error) {
      console.error(`[EMR Service] Failed to fetch all data for patient ${patientId}:`, error);
      throw error;
    }
  }
```

### 4. `/backend/src/services/normalization.service.ts`

**Add 4 normalization methods + helpers:**

```typescript
  /**
   * Normalize a form response from raw API data
   */
  normalizeFormResponse(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'form_response',
      patient_id: this.extractPatientId(rawData),
      author: this.extractPatientId(rawData), // Patient is the author
      occurred_at: this.extractDate(rawData, ['submitted_at', 'completed_at', 'created_at']),
      title: this.extractTitle(rawData, ['form_name', 'form_title', 'name']),
      text: this.extractFormResponseText(rawData),
      source: this.constructSourceUrl('form_responses', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'submitted_at']),
    };

    return artifact;
  }

  /**
   * Normalize a message from raw API data
   */
  normalizeMessage(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'message',
      patient_id: this.extractPatientId(rawData),
      author: this.extractMessageAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['created_at', 'sent_at', 'timestamp']),
      title: this.extractTitle(rawData, ['subject']),
      text: this.extractText(rawData, ['body', 'content', 'message', 'text']),
      source: this.constructSourceUrl('messages', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'created_at']),
    };

    return artifact;
  }

  /**
   * Normalize a lab observation from raw API data
   */
  normalizeLabObservation(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'lab_observation',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData, ['ordering_provider', 'provider']),
      occurred_at: this.extractDate(rawData, ['collected_at', 'result_date', 'created_at']),
      title: this.extractLabObservationTitle(rawData),
      text: this.extractLabObservationText(rawData),
      source: this.constructSourceUrl('lab_observations', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'collected_at']),
    };

    return artifact;
  }

  /**
   * Normalize vital signs from raw API data
   */
  normalizeVital(rawData: any): Artifact {
    const artifact: Artifact = {
      id: this.extractId(rawData),
      type: 'vital',
      patient_id: this.extractPatientId(rawData),
      author: this.extractAuthor(rawData),
      occurred_at: this.extractDate(rawData, ['measured_at', 'recorded_at', 'created_at']),
      title: this.extractVitalTitle(rawData),
      text: this.extractVitalText(rawData),
      source: this.constructSourceUrl('vitals', this.extractId(rawData)),
      meta: this.extractMeta(rawData, ['id', 'patient_id', 'measured_at']),
    };

    return artifact;
  }
```

**Add helper methods:**

```typescript
  /**
   * Extract form response text (convert Q&A to readable format)
   */
  private extractFormResponseText(rawData: any): string {
    const parts: string[] = [];

    const formName = rawData.form_name || rawData.form_title || rawData.name;
    if (formName) parts.push(`Form: ${formName}`);

    // Extract question-answer pairs
    const responses = rawData.responses || rawData.answers || rawData.fields;
    if (Array.isArray(responses)) {
      responses.forEach((response: any) => {
        const question = response.question || response.field_name || response.label;
        const answer = response.answer || response.value || response.response;

        if (question && answer) {
          const answerText = Array.isArray(answer) ? answer.join(', ') : answer;
          parts.push(`Q: ${question}\nA: ${answerText}`);
        }
      });
    } else if (responses && typeof responses === 'object') {
      // Handle object format { question1: answer1, question2: answer2 }
      for (const [question, answer] of Object.entries(responses)) {
        if (answer) {
          const answerText = Array.isArray(answer) ? answer.join(', ') : String(answer);
          parts.push(`Q: ${question}\nA: ${answerText}`);
        }
      }
    }

    if (parts.length > 0) {
      return parts.join('\n\n');
    }

    // Fallback
    return this.extractText(rawData, ['content', 'text', 'data']);
  }

  /**
   * Extract message author (sender name)
   */
  private extractMessageAuthor(rawData: any): string | undefined {
    const sender = rawData.sender || rawData.from || rawData.author;

    if (!sender) return undefined;

    if (typeof sender === 'string') {
      return sender;
    } else if (typeof sender === 'object') {
      return sender.name || sender.display_name || sender.email || undefined;
    }

    return undefined;
  }

  /**
   * Extract lab observation title
   */
  private extractLabObservationTitle(rawData: any): string | undefined {
    const testName = rawData.test_name || rawData.name || rawData.observation_name;
    const code = rawData.loinc_code || rawData.code;

    if (testName && code) {
      return `${testName} (${code})`;
    } else if (testName) {
      return testName;
    }

    return undefined;
  }

  /**
   * Extract lab observation text
   */
  private extractLabObservationText(rawData: any): string {
    const parts: string[] = [];

    const testName = rawData.test_name || rawData.name || rawData.observation_name;
    if (testName) parts.push(`Test: ${testName}`);

    const value = rawData.value || rawData.result || rawData.result_value;
    const unit = rawData.unit || rawData.result_unit;
    if (value !== undefined && value !== null) {
      const valueText = unit ? `${value} ${unit}` : String(value);
      parts.push(`Result: ${valueText}`);
    }

    const referenceRange = rawData.reference_range || rawData.normal_range;
    if (referenceRange) parts.push(`Reference Range: ${referenceRange}`);

    const abnormalFlag = rawData.abnormal_flag || rawData.abnormal || rawData.flag;
    if (abnormalFlag) parts.push(`Abnormal: ${abnormalFlag === true ? 'Yes' : abnormalFlag}`);

    const interpretation = rawData.interpretation || rawData.comment || rawData.notes;
    if (interpretation) parts.push(`Interpretation: ${interpretation}`);

    const status = rawData.status;
    if (status) parts.push(`Status: ${status}`);

    if (parts.length > 0) {
      return parts.join('. ');
    }

    // Fallback
    return this.extractText(rawData, ['description', 'content', 'text']);
  }

  /**
   * Extract vital signs title
   */
  private extractVitalTitle(rawData: any): string | undefined {
    const measuredAt = rawData.measured_at || rawData.recorded_at;
    if (measuredAt) {
      const date = new Date(measuredAt).toLocaleDateString();
      return `Vital Signs - ${date}`;
    }
    return 'Vital Signs';
  }

  /**
   * Extract vital signs text
   */
  private extractVitalText(rawData: any): string {
    const parts: string[] = [];

    // Blood pressure
    const systolic = rawData.blood_pressure_systolic || rawData.bp_systolic || rawData.systolic;
    const diastolic = rawData.blood_pressure_diastolic || rawData.bp_diastolic || rawData.diastolic;
    if (systolic && diastolic) {
      parts.push(`Blood Pressure: ${systolic}/${diastolic} mmHg`);
    } else if (systolic) {
      parts.push(`Systolic BP: ${systolic} mmHg`);
    }

    // Heart rate
    const heartRate = rawData.heart_rate || rawData.pulse || rawData.hr;
    if (heartRate) parts.push(`Heart Rate: ${heartRate} bpm`);

    // Temperature
    const temperature = rawData.temperature || rawData.temp;
    const tempUnit = rawData.temperature_unit || 'F';
    if (temperature) parts.push(`Temperature: ${temperature}°${tempUnit}`);

    // Respiratory rate
    const respiratoryRate = rawData.respiratory_rate || rawData.rr;
    if (respiratoryRate) parts.push(`Respiratory Rate: ${respiratoryRate} breaths/min`);

    // Oxygen saturation
    const oxygenSaturation = rawData.oxygen_saturation || rawData.spo2 || rawData.o2_sat;
    if (oxygenSaturation) parts.push(`O2 Saturation: ${oxygenSaturation}%`);

    // Weight
    const weight = rawData.weight;
    const weightUnit = rawData.weight_unit || 'lbs';
    if (weight) parts.push(`Weight: ${weight} ${weightUnit}`);

    // Height
    const height = rawData.height;
    const heightUnit = rawData.height_unit || 'in';
    if (height) parts.push(`Height: ${height} ${heightUnit}`);

    // BMI
    const bmi = rawData.bmi || rawData.body_mass_index;
    if (bmi) parts.push(`BMI: ${bmi}`);

    // Notes
    const notes = rawData.notes || rawData.comments;
    if (notes) parts.push(`Notes: ${notes}`);

    if (parts.length > 0) {
      return parts.join('. ');
    }

    // Fallback
    return this.extractText(rawData, ['description', 'content', 'text']);
  }
```

**Update normalize() switch:**
```typescript
  normalize(rawData: any, type: ArtifactType): NormalizationResult {
    let artifact: Artifact;

    switch (type) {
      // Tier 1
      case 'note':
        artifact = this.normalizeNote(rawData);
        break;
      case 'document':
        artifact = this.normalizeDocument(rawData);
        break;
      case 'medication':
        artifact = this.normalizeMedication(rawData);
        break;
      case 'condition':
        artifact = this.normalizeCondition(rawData);
        break;
      case 'allergy':
        artifact = this.normalizeAllergy(rawData);
        break;
      case 'care_plan':
        artifact = this.normalizeCarePlan(rawData);
        break;
      // Tier 2
      case 'form_response':
        artifact = this.normalizeFormResponse(rawData);
        break;
      case 'message':
        artifact = this.normalizeMessage(rawData);
        break;
      case 'lab_observation':
        artifact = this.normalizeLabObservation(rawData);
        break;
      case 'vital':
        artifact = this.normalizeVital(rawData);
        break;
      default:
        throw new Error(`Unknown artifact type: ${type}`);
    }

    const validation = this.validateArtifact(artifact);

    return {
      artifact,
      validation,
    };
  }
```

### 5. `/backend/src/services/emr-normalized.service.ts`

**Add 4 wrapper methods + update fetchAll:**

```typescript
  /**
   * Fetch and normalize form responses for a patient
   */
  async fetchFormResponses(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchFormResponses(patientId, options);
    const artifacts = normalizationService.normalizeBatch(result.data, 'form_response');
    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  /**
   * Fetch and normalize messages for a patient
   */
  async fetchMessages(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchMessages(patientId, options);
    const artifacts = normalizationService.normalizeBatch(result.data, 'message');
    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  /**
   * Fetch and normalize lab observations for a patient
   */
  async fetchLabObservations(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchLabObservations(patientId, options);
    const artifacts = normalizationService.normalizeBatch(result.data, 'lab_observation');
    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  /**
   * Fetch and normalize vital signs for a patient
   */
  async fetchVitals(
    patientId: string,
    options?: FilterOptions
  ): Promise<{ artifacts: Artifact[]; cached: boolean; fetchTime: number }> {
    const result = await emrService.fetchVitals(patientId, options);
    const artifacts = normalizationService.normalizeBatch(result.data, 'vital');
    return {
      artifacts,
      cached: result.cached,
      fetchTime: result.fetchTime,
    };
  }

  /**
   * Fetch and normalize all EMR data for a patient (Tier 1 + Tier 2)
   */
  async fetchAll(patientId: string): Promise<{
    artifacts: Artifact[];
    byType: {
      notes: Artifact[];
      documents: Artifact[];
      medications: Artifact[];
      conditions: Artifact[];
      allergies: Artifact[];
      carePlans: Artifact[];
      formResponses: Artifact[];
      messages: Artifact[];
      labObservations: Artifact[];
      vitals: Artifact[];
    };
    cached: boolean;
    fetchTime: number;
    totalCount: number;
  }> {
    const result = await emrService.fetchAll(patientId);

    // Tier 1
    const notes = normalizationService.normalizeBatch(result.notes, 'note');
    const documents = normalizationService.normalizeBatch(result.documents, 'document');
    const medications = normalizationService.normalizeBatch(result.medications, 'medication');
    const conditions = normalizationService.normalizeBatch(result.conditions, 'condition');
    const allergies = normalizationService.normalizeBatch(result.allergies, 'allergy');
    const carePlans = normalizationService.normalizeBatch(result.carePlans, 'care_plan');

    // Tier 2
    const formResponses = normalizationService.normalizeBatch(result.formResponses, 'form_response');
    const messages = normalizationService.normalizeBatch(result.messages, 'message');
    const labObservations = normalizationService.normalizeBatch(result.labObservations, 'lab_observation');
    const vitals = normalizationService.normalizeBatch(result.vitals, 'vital');

    const artifacts = [
      ...notes,
      ...documents,
      ...medications,
      ...conditions,
      ...allergies,
      ...carePlans,
      ...formResponses,
      ...messages,
      ...labObservations,
      ...vitals,
    ];

    return {
      artifacts,
      byType: {
        notes,
        documents,
        medications,
        conditions,
        allergies,
        carePlans,
        formResponses,
        messages,
        labObservations,
        vitals,
      },
      cached: result.cached,
      fetchTime: result.fetchTime,
      totalCount: artifacts.length,
    };
  }
```

### 6. `/backend/src/controllers/indexing.controller.ts`

**Update statistics to include Tier 2 types:**

```typescript
      // After Tier 1 counts, add:
      const formResponsesCount = emrData.byType.formResponses.length;
      const messagesCount = emrData.byType.messages.length;
      const labObservationsCount = emrData.byType.labObservations.length;
      const vitalsCount = emrData.byType.vitals.length;

      console.log(
        `[Indexing] ✓ Fetched ${totalArtifacts} Tier 1+2 artifacts (${fetchTime}ms):`,
        `${notesCount} notes, ${documentsCount} documents, ${medicationsCount} medications, ` +
        `${conditionsCount} conditions, ${allergiesCount} allergies, ${carePlansCount} care plans, ` +
        `${formResponsesCount} forms, ${messagesCount} messages, ${labObservationsCount} labs, ${vitalsCount} vitals`
      );

      // Update all byType objects to include:
      byType: {
        notes: notesCount,
        documents: documentsCount,
        medications: medicationsCount,
        conditions: conditionsCount,
        allergies: allergiesCount,
        care_plans: carePlansCount,
        form_responses: formResponsesCount,
        messages: messagesCount,
        lab_observations: labObservationsCount,
        vitals: vitalsCount,
      },
```

## Testing & Verification

### Step 1: Compile & Run
```bash
npm run build
curl -X POST http://localhost:3001/api/index/patient/user_3kmUMGZdObZMsmXwp0T8Pfp4e5u1 \
  -H "Content-Type: application/json" \
  -d '{"force_reindex": true}'
```

**Expected indexed_count:** ~4,479 (662+718+155+201+204+82+748+891+419+199)

### Step 2: Test Queries
```bash
# Form responses
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What did the patient report in their intake forms?"}'

# Messages
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Show me recent messages from the patient"}'

# Lab observations
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the patient'\''s latest lab test results?"}'

# Vitals
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What are the patient'\''s recent vital signs?"}'
```

## Success Criteria

✅ **Indexed count: ~4,479 records**
✅ **byType shows all 10 types**
✅ **Chunks created: ~2,500+**
✅ **Chat can retrieve forms, messages, labs, and vitals**

---

# STAGE 3: Tier 3 Contextual Data Types

## Tech Stack Compliance

**REQUIRED TECH STACK:**
- ✅ Node.js 18+, TypeScript (strict), Express.js
- ✅ PostgreSQL with `pg` (raw SQL only)
- ✅ Ollama (local AI - HIPAA compliant)
- ✅ FAISS (local vectors)
- ❌ NO ORMs, NO Python, NO external AI APIs

## Objective

Add **5 new Tier 3 data types** for contextual information:
- 🆕 `appointment` (46 records) - Visit scheduling and outcomes
- 🆕 `superbill` (177 records) - Billing summaries with CPT codes
- 🆕 `insurance_policy` (122 records) - Coverage information
- 🆕 `task` (20 records) - Care tasks and action items
- 🆕 `family_history` (7 records) - Genetic risk factors

This completes Option B with ~4,900 total records.

## Implementation Notes

Follow the same pattern as Stages 1 and 2:
1. Add to ArtifactType in both type files
2. Add fetch methods to emr.service.ts
3. Add normalization logic to normalization.service.ts
4. Add wrappers to emr-normalized.service.ts
5. Update statistics in indexing.controller.ts

**Key Normalization Strategies:**

**Appointments:**
```typescript
title: `${appointment_type} - ${provider_name}`
text: "Type: {type}. Reason: {reason}. Provider: {provider}. Date: {scheduled_at}. Status: {status}. Outcome: {outcome_notes}"
```

**Superbills:**
```typescript
title: `Superbill - ${visit_date}`
text: "CPT Codes: {cpt_codes}. Diagnoses: {diagnosis_codes}. Summary: {visit_summary}"
```

**Insurance Policies:**
```typescript
title: `${carrier_name} - ${policy_type}`
text: "Carrier: {carrier}. Policy Number: {policy_number}. Coverage: {coverage_type}. Effective: {effective_date} to {end_date}"
```

**Tasks:**
```typescript
title: task_description
text: "Task: {description}. Status: {status}. Priority: {priority}. Due: {due_date}. Assignee: {assignee}"
```

**Family History:**
```typescript
title: `${relation} - ${condition}`
text: "Relation: {relation}. Condition: {condition}. Age of Onset: {age_of_onset}. Status: {status}. Notes: {notes}"
```

## Final Verification

After Stage 3 completion:

```bash
curl -X POST http://localhost:3001/api/index/patient/user_3kmUMGZdObZMsmXwp0T8Pfp4e5u1
```

**Expected Response:**
```json
{
  "success": true,
  "indexed_count": ~4851,
  "byType": {
    "notes": 662,
    "documents": 718,
    "medications": 155,
    "conditions": 201,
    "allergies": 204,
    "care_plans": 82,
    "form_responses": 748,
    "messages": 891,
    "lab_observations": 419,
    "vitals": 199,
    "appointments": 46,
    "superbills": 177,
    "insurance_policies": 122,
    "tasks": 20,
    "family_histories": 7
  },
  "chunks_created": ~2940
}
```

---

# Implementation Summary

## Total Effort (All 3 Stages)

- **Files modified:** 6
- **New lines of code:** ~790
- **New data types:** 12 (from 3 to 15)
- **Records supported:** ~4,900 (from ~900)
- **Implementation time:** ~4 hours

## Verification Checklist

✅ All 15 artifact types defined in type files
✅ All fetch methods implemented in emr.service
✅ All normalization logic in normalization.service
✅ All wrappers in emr-normalized.service
✅ Statistics updated in indexing.controller
✅ TypeScript compiles without errors
✅ Indexing endpoint returns all types
✅ Chat queries work for all data types
✅ No runtime errors in logs
✅ Tech stack compliance maintained throughout

## Next Steps (After Stage 3)

**Stage 4: Frontend Integration**
- Update UI to display all 15 artifact types
- Add filtering by type
- Show metadata fields for each type

**Stage 5: Query Enhancement**
- Teach LLM about new data types in system prompt
- Add type-specific query patterns
- Improve citation accuracy for new types

**Option B Complete! 🎉**
