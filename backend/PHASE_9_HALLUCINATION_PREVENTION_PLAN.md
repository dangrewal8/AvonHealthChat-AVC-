# Phase 9: Hallucination Prevention & Quality Assurance System

**Date:** 2025-11-16
**Status:** PLANNING
**Prerequisites:** Phases 1-8 COMPLETE
**Objective:** Build comprehensive hallucination prevention system with conversation history, answer grounding, consistency checking, and confidence calibration

---

## 🎯 Overview

### Current Hallucination Prevention Mechanisms

**Already Implemented (Phases 1-8):**
- ✅ Two-pass generation (extraction → summarization)
- ✅ Deterministic extraction (temperature=0)
- ✅ Citation validation service
- ✅ Artifact validation service
- ✅ Extraction count verifier
- ✅ Medication deduplication
- ✅ Provenance tracking for all extractions
- ✅ Explicit anti-hallucination prompts
- ✅ Low temperature settings

**Gap Analysis - What's Missing:**
- ❌ Conversation history storage & analysis
- ❌ Cross-query consistency checking
- ❌ Answer grounding verification (fact-checking against source)
- ❌ Confidence calibration & uncertainty quantification
- ❌ Temporal consistency validation
- ❌ Multi-response cross-validation
- ❌ Hallucination detection metrics
- ❌ Automated quality monitoring dashboard

---

## 📚 Research Summary: Hallucination Prevention Techniques

### 1. Retrieval-Augmented Generation (RAG) Enhancements ✅
**Status:** IMPLEMENTED in Phases 1-8
- Reduces hallucinations by 42-68% (research shows)
- Medical AI applications achieve up to 89% factual accuracy with trusted sources
- Our system uses: FAISS vector store + PostgreSQL metadata + relationship-aware retrieval

### 2. Grounding & Verification
**Status:** PARTIAL - Need to enhance

**Key Techniques:**
- **Contextual Grounding**: Check if response is factually accurate based on source
- **Post-Response Refinement**: Decompose response into atomic statements, verify each against source
- **External Validation**: Verify against trusted knowledge bases (PubMed for medical)
- **Ontological Grounding**: Constrain outputs through entity recognition + ontology alignment

**Research Results:**
- Ontological grounding reduced attribute hallucinations by 33%
- Maintained 92% terminological consistency with FDA drug labeling

### 3. Multi-Model Cross-Validation
**Key Technique:** SelfCheckGPT
- Compare multiple generated responses for consistency
- If model provides varying answers → signals potential hallucination
- Detect response variance across temperature settings

### 4. Chain-of-Thought (CoT) Reasoning ✅
**Status:** IMPLEMENTED via reasoning prompts (Phase 6)
- Encourages step-by-step reasoning before answer
- Makes hallucinations more detectable in reasoning chain

### 5. Human-in-the-Loop Validation
**Best Practice for Medical AI:**
- Require domain expert review for high-stakes outputs
- Never deploy without human oversight in medical contexts
- Embed validation layers directly into EHR systems

### 6. Knowledge Graph Integration
**Research Shows:**
- Structured knowledge graphs provide factual grounding
- Reduce erroneous/fabricated content in medical diagnosis
- Examples: Wikidata, DBpedia, medical ontologies (SNOMED, ICD-10)

### 7. Combined Approach Results
**Stanford 2024 Study:**
- RAG + RLHF + Guardrails → 96% reduction in hallucinations vs baseline

---

## 🏗️ Phase 9 Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────────┐
│            Phase 9: Hallucination Prevention System             │
└─────────────────────────────────────────────────────────────────┘

1. CONVERSATION HISTORY (New)
   ├── Store all queries + responses in PostgreSQL
   ├── Track query intent, extractions, sources, confidence
   ├── Enable reasoning reference (view past reasoning chains)
   └── Temporal consistency validation across queries

2. ANSWER GROUNDING VERIFIER (New)
   ├── Decompose response into atomic facts
   ├── Verify each fact against source chunks
   ├── Flag unsupported statements
   ├── Calculate grounding score (0.0-1.0)
   └── Provide fact-level citations

3. CROSS-QUERY CONSISTENCY CHECKER (New)
   ├── Detect contradictions across queries for same patient
   ├── Flag if current answer contradicts previous answers
   ├── Track entity mentions over time (medication changes)
   └── Consistency score per query

4. CONFIDENCE CALIBRATION (New)
   ├── Uncertainty quantification for each extraction
   ├── Aggregate confidence at answer level
   ├── Threshold-based warnings ("Low confidence: verify source")
   ├── Calibrated probability estimates
   └── Confidence breakdown by category

5. HALLUCINATION DETECTION (New)
   ├── Multi-response variance detection (SelfCheckGPT approach)
   ├── Semantic consistency scoring
   ├── Factual consistency with source
   ├── Temporal consistency with history
   └── Real-time hallucination alerts

6. QUALITY METRICS DASHBOARD (New)
   ├── Grounding score trends
   ├── Consistency score trends
   ├── Confidence calibration metrics
   ├── Hallucination detection rate
   └── Per-query quality reports

7. ENHANCED EXISTING SYSTEMS
   ├── Two-pass generator → add grounding verification
   ├── Citation validator → add temporal validation
   └── Extraction verifier → add cross-query checks
```

---

## 🗄️ Database Schema Extensions

### New Tables

#### 1. `conversation_history`
```sql
CREATE TABLE IF NOT EXISTS conversation_history (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  query TEXT NOT NULL,
  query_intent TEXT,
  query_timestamp TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Response details
  short_answer TEXT NOT NULL,
  detailed_summary TEXT NOT NULL,
  model_used TEXT NOT NULL,

  -- Extraction & sources
  extractions JSONB NOT NULL,  -- Array of Extraction objects
  sources JSONB NOT NULL,      -- Array of source artifacts
  retrieval_candidates JSONB,  -- Retrieved chunks

  -- Quality metrics
  grounding_score DECIMAL(3,2),           -- 0.00-1.00
  consistency_score DECIMAL(3,2),         -- 0.00-1.00
  confidence_score DECIMAL(3,2),          -- 0.00-1.00
  hallucination_risk DECIMAL(3,2),        -- 0.00-1.00

  -- Metadata
  enrichment_enabled BOOLEAN DEFAULT false,
  multi_hop_enabled BOOLEAN DEFAULT false,
  reasoning_enabled BOOLEAN DEFAULT false,
  execution_time_ms INTEGER,

  -- Indexes
  CONSTRAINT fk_patient FOREIGN KEY (patient_id)
    REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_conversation_patient ON conversation_history(patient_id);
CREATE INDEX idx_conversation_timestamp ON conversation_history(query_timestamp DESC);
CREATE INDEX idx_conversation_quality ON conversation_history(grounding_score, consistency_score);
CREATE GIN INDEX idx_conversation_extractions ON conversation_history(extractions);
```

#### 2. `grounding_verification`
```sql
CREATE TABLE IF NOT EXISTS grounding_verification (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,

  -- Atomic fact from response
  statement TEXT NOT NULL,
  statement_index INTEGER NOT NULL,

  -- Source verification
  is_grounded BOOLEAN NOT NULL,
  source_chunk_id TEXT,
  source_text TEXT,
  supporting_evidence TEXT,

  -- Scoring
  grounding_confidence DECIMAL(3,2),  -- 0.00-1.00
  verification_method TEXT,  -- 'exact_match' | 'semantic_match' | 'inference' | 'unsupported'

  -- Timestamps
  verified_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id)
    REFERENCES conversation_history(id) ON DELETE CASCADE
);

CREATE INDEX idx_grounding_conversation ON grounding_verification(conversation_id);
CREATE INDEX idx_grounding_unsupported ON grounding_verification(is_grounded) WHERE is_grounded = false;
```

#### 3. `consistency_checks`
```sql
CREATE TABLE IF NOT EXISTS consistency_checks (
  id TEXT PRIMARY KEY,
  patient_id TEXT NOT NULL,
  current_conversation_id TEXT NOT NULL,
  previous_conversation_id TEXT,

  -- Consistency details
  check_type TEXT NOT NULL,  -- 'entity_consistency' | 'temporal_consistency' | 'semantic_consistency'
  is_consistent BOOLEAN NOT NULL,
  inconsistency_description TEXT,

  -- Conflicting information
  current_statement TEXT,
  previous_statement TEXT,

  -- Scoring
  consistency_score DECIMAL(3,2),
  severity TEXT,  -- 'low' | 'medium' | 'high' | 'critical'

  -- Timestamps
  checked_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_current_conv FOREIGN KEY (current_conversation_id)
    REFERENCES conversation_history(id) ON DELETE CASCADE,
  CONSTRAINT fk_previous_conv FOREIGN KEY (previous_conversation_id)
    REFERENCES conversation_history(id) ON DELETE SET NULL
);

CREATE INDEX idx_consistency_patient ON consistency_checks(patient_id);
CREATE INDEX idx_consistency_current ON consistency_checks(current_conversation_id);
CREATE INDEX idx_consistency_issues ON consistency_checks(is_consistent) WHERE is_consistent = false;
```

#### 4. `confidence_metrics`
```sql
CREATE TABLE IF NOT EXISTS confidence_metrics (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  extraction_index INTEGER NOT NULL,

  -- Confidence breakdown
  retrieval_confidence DECIMAL(3,2),      -- Based on similarity scores
  source_confidence DECIMAL(3,2),         -- Based on source quality
  extraction_confidence DECIMAL(3,2),     -- Based on LLM confidence
  consistency_confidence DECIMAL(3,2),    -- Based on cross-query consistency
  aggregate_confidence DECIMAL(3,2) NOT NULL,  -- Overall confidence

  -- Uncertainty quantification
  uncertainty_level TEXT,  -- 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  uncertainty_explanation TEXT,

  -- Timestamps
  calculated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_conversation FOREIGN KEY (conversation_id)
    REFERENCES conversation_history(id) ON DELETE CASCADE
);

CREATE INDEX idx_confidence_conversation ON confidence_metrics(conversation_id);
CREATE INDEX idx_confidence_low ON confidence_metrics(aggregate_confidence) WHERE aggregate_confidence < 0.7;
```

---

## 🔧 Services to Implement

### Service 1: Conversation History Service
**File:** `src/services/conversation-history.service.ts`

**Responsibilities:**
- Store query + response + metadata to `conversation_history` table
- Retrieve conversation history for a patient
- Search conversations by query intent or keywords
- Calculate history-based statistics

**Key Methods:**
```typescript
interface ConversationHistoryService {
  // Storage
  storeConversation(conversation: ConversationRecord): Promise<string>;

  // Retrieval
  getConversationsByPatient(patientId: string, limit?: number): Promise<ConversationRecord[]>;
  getConversation(conversationId: string): Promise<ConversationRecord | null>;
  searchConversations(patientId: string, query: string): Promise<ConversationRecord[]>;

  // Analysis
  getQualityTrends(patientId: string): Promise<QualityTrends>;
  getSimilarPastQueries(patientId: string, currentQuery: string): Promise<ConversationRecord[]>;
}
```

---

### Service 2: Answer Grounding Verifier
**File:** `src/services/answer-grounding-verifier.service.ts`

**Responsibilities:**
- Decompose response into atomic statements
- Verify each statement against source chunks
- Calculate grounding score
- Provide fact-level citations
- Flag unsupported statements

**Key Methods:**
```typescript
interface AnswerGroundingVerifier {
  // Verification
  verifyAnswer(
    answer: string,
    sources: RetrievalCandidate[]
  ): Promise<GroundingResult>;

  // Statement decomposition
  decomposeIntoStatements(answer: string): Promise<string[]>;

  // Individual fact verification
  verifyStatement(
    statement: string,
    sources: RetrievalCandidate[]
  ): Promise<StatementGrounding>;

  // Scoring
  calculateGroundingScore(groundings: StatementGrounding[]): number;
}

interface GroundingResult {
  overall_grounded: boolean;
  grounding_score: number;  // 0.0-1.0
  statements: StatementGrounding[];
  unsupported_statements: string[];
  warnings: string[];
}

interface StatementGrounding {
  statement: string;
  is_grounded: boolean;
  source_chunk_id?: string;
  supporting_evidence?: string;
  confidence: number;
  verification_method: 'exact_match' | 'semantic_match' | 'inference' | 'unsupported';
}
```

**Verification Algorithm:**
1. Decompose answer into atomic statements using sentence splitting + clause analysis
2. For each statement:
   - Check for exact match in source chunks (high confidence)
   - Check for semantic match using embeddings (medium confidence)
   - Check for logical inference from source (low-medium confidence)
   - Mark as unsupported if no match found
3. Calculate grounding score: (grounded_statements / total_statements)
4. Flag unsupported statements for review

---

### Service 3: Cross-Query Consistency Checker
**File:** `src/services/cross-query-consistency.service.ts`

**Responsibilities:**
- Compare current answer with past answers for same patient
- Detect contradictions
- Track entity changes over time
- Calculate consistency score

**Key Methods:**
```typescript
interface CrossQueryConsistencyChecker {
  // Consistency checking
  checkConsistency(
    currentConversation: ConversationRecord,
    patientId: string
  ): Promise<ConsistencyResult>;

  // Entity tracking
  trackEntityChanges(
    entity: string,
    entityType: string,
    patientId: string
  ): Promise<EntityHistory[]>;

  // Contradiction detection
  detectContradictions(
    current: ConversationRecord,
    history: ConversationRecord[]
  ): Promise<Contradiction[]>;
}

interface ConsistencyResult {
  is_consistent: boolean;
  consistency_score: number;  // 0.0-1.0
  contradictions: Contradiction[];
  warnings: string[];
}

interface Contradiction {
  current_statement: string;
  previous_statement: string;
  previous_conversation_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
}
```

**Consistency Checks:**
1. **Entity Consistency**: If query asks "What medications?", check if list matches previous medication queries
2. **Temporal Consistency**: If medication was discontinued, shouldn't appear in current list
3. **Semantic Consistency**: If previous answer said "no diabetes", current shouldn't say "diabetes medications"

---

### Service 4: Confidence Calibration Service
**File:** `src/services/confidence-calibration.service.ts`

**Responsibilities:**
- Calculate confidence scores for extractions
- Aggregate confidence at answer level
- Provide uncertainty quantification
- Generate confidence-based warnings

**Key Methods:**
```typescript
interface ConfidenceCalibrationService {
  // Confidence calculation
  calculateConfidence(
    extraction: Extraction,
    candidate: RetrievalCandidate,
    historyContext?: ConversationRecord[]
  ): Promise<ConfidenceScore>;

  // Aggregation
  aggregateConfidence(scores: ConfidenceScore[]): AggregateConfidence;

  // Uncertainty quantification
  quantifyUncertainty(score: ConfidenceScore): UncertaintyLevel;
}

interface ConfidenceScore {
  retrieval_confidence: number;     // Based on similarity score
  source_confidence: number;        // Based on source type/quality
  extraction_confidence: number;    // Based on LLM internal confidence
  consistency_confidence: number;   // Based on history consistency
  aggregate_confidence: number;     // Weighted average
}

interface AggregateConfidence {
  overall_confidence: number;
  confidence_breakdown: ConfidenceScore[];
  uncertainty_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  recommendation: string;  // "High confidence" | "Verify source" | "Consult provider"
}
```

**Confidence Formula:**
```
retrieval_confidence = similarity_score (from FAISS)
source_confidence = artifact_type_weight (note=1.0, document=0.9, message=0.7, etc.)
extraction_confidence = temperature_inverse (temp=0 → 1.0, temp=0.3 → 0.85)
consistency_confidence = consistency_score (from cross-query check)

aggregate_confidence = weighted_average(
  retrieval: 0.3,
  source: 0.25,
  extraction: 0.25,
  consistency: 0.2
)
```

---

### Service 5: Hallucination Detector
**File:** `src/services/hallucination-detector.service.ts`

**Responsibilities:**
- Multi-response variance detection (SelfCheckGPT approach)
- Semantic consistency scoring
- Real-time hallucination risk assessment

**Key Methods:**
```typescript
interface HallucinationDetector {
  // Multi-response detection
  detectViaMultiResponse(
    query: string,
    candidates: RetrievalCandidate[],
    numSamples: number
  ): Promise<HallucinationRisk>;

  // Consistency scoring
  scoreSemanticConsistency(responses: string[]): number;

  // Risk assessment
  assessHallucinationRisk(
    groundingScore: number,
    consistencyScore: number,
    confidenceScore: number
  ): HallucinationRisk;
}

interface HallucinationRisk {
  risk_level: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  risk_score: number;  // 0.0-1.0
  contributing_factors: string[];
  recommendation: string;
}
```

**SelfCheckGPT Approach:**
1. Generate response 3-5 times with slightly different temperatures (0.0, 0.1, 0.2)
2. Compare responses for consistency
3. High variance → likely hallucination
4. Low variance → likely grounded

---

### Service 6: Quality Metrics Aggregator
**File:** `src/services/quality-metrics-aggregator.service.ts`

**Responsibilities:**
- Aggregate all quality metrics
- Calculate trends over time
- Generate quality reports
- Provide dashboard data

**Key Methods:**
```typescript
interface QualityMetricsAggregator {
  // Aggregation
  aggregateMetrics(
    conversationId: string
  ): Promise<QualityMetrics>;

  // Trends
  getQualityTrends(
    patientId: string,
    timeRange: TimeRange
  ): Promise<QualityTrends>;

  // Reports
  generateQualityReport(
    conversationId: string
  ): Promise<QualityReport>;
}

interface QualityMetrics {
  grounding_score: number;
  consistency_score: number;
  confidence_score: number;
  hallucination_risk: number;
  overall_quality_score: number;  // Weighted combination
}
```

---

## 🔄 Integration with Existing System

### Enhanced Query Controller
**Modify:** `src/controllers/enhanced-query.controller.ts`

**Changes:**
```typescript
// After generating answer, add Phase 9 quality checks
const twoPassResult = await twoPassGenerator.generate(...);

// 1. Store conversation history
const conversationId = await conversationHistory.storeConversation({
  patient_id,
  query,
  ...twoPassResult
});

// 2. Verify grounding
const groundingResult = await groundingVerifier.verifyAnswer(
  twoPassResult.summary.short_answer,
  candidates
);

// 3. Check consistency
const consistencyResult = await consistencyChecker.checkConsistency(
  conversationId,
  patient_id
);

// 4. Calculate confidence
const confidenceScore = await confidenceCalibration.aggregateConfidence(
  twoPassResult.extractions
);

// 5. Detect hallucinations
const hallucinationRisk = await hallucinationDetector.assessHallucinationRisk(
  groundingResult.grounding_score,
  consistencyResult.consistency_score,
  confidenceScore.overall_confidence
);

// 6. Return enhanced response
return {
  ...standardResponse,
  quality_metrics: {
    grounding_score: groundingResult.grounding_score,
    consistency_score: consistencyResult.consistency_score,
    confidence_score: confidenceScore.overall_confidence,
    hallucination_risk: hallucinationRisk.risk_score,
    overall_quality: calculateOverallQuality(...)
  },
  warnings: [
    ...groundingResult.warnings,
    ...consistencyResult.warnings,
    ...hallucinationRisk.warnings
  ]
};
```

---

## 📊 Feature Flags (Phase 9)

**Environment Variables:**
```bash
# Phase 9: Hallucination Prevention
ENABLE_CONVERSATION_HISTORY=true
ENABLE_GROUNDING_VERIFICATION=true
ENABLE_CONSISTENCY_CHECKING=true
ENABLE_CONFIDENCE_CALIBRATION=true
ENABLE_HALLUCINATION_DETECTION=false  # Expensive, enable carefully

# Thresholds
GROUNDING_SCORE_THRESHOLD=0.7
CONSISTENCY_SCORE_THRESHOLD=0.8
CONFIDENCE_SCORE_THRESHOLD=0.6
HALLUCINATION_RISK_THRESHOLD=0.3

# Multi-response detection settings
HALLUCINATION_DETECTION_SAMPLES=3
HALLUCINATION_DETECTION_TEMP_RANGE=0.1
```

---

## 📈 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Grounding Score | >0.85 | % of statements supported by source |
| Consistency Score | >0.90 | % of answers consistent with history |
| Confidence Calibration | >0.80 | Correlation between confidence and accuracy |
| Hallucination Detection Rate | <0.05 | % of responses flagged as high risk |
| False Positive Rate | <0.10 | % of good answers incorrectly flagged |
| Response Time Impact | <500ms | Additional latency from quality checks |

---

## 🚀 Implementation Timeline

### Week 1: Foundation
- [ ] Create database migrations (4 new tables)
- [ ] Create type definitions
- [ ] Implement Conversation History Service
- [ ] Test conversation storage & retrieval

### Week 2: Grounding & Consistency
- [ ] Implement Answer Grounding Verifier
- [ ] Implement Cross-Query Consistency Checker
- [ ] Test grounding verification
- [ ] Test consistency checking

### Week 3: Confidence & Detection
- [ ] Implement Confidence Calibration Service
- [ ] Implement Hallucination Detector
- [ ] Test confidence scoring
- [ ] Test multi-response detection

### Week 4: Integration & Metrics
- [ ] Implement Quality Metrics Aggregator
- [ ] Integrate with Enhanced Query Controller
- [ ] Create quality dashboard endpoint
- [ ] End-to-end testing

### Week 5: Production Deployment
- [ ] Load testing with quality checks
- [ ] Performance optimization
- [ ] Feature flag rollout (10% → 50% → 100%)
- [ ] Monitoring and alerting

---

## 🔒 HIPAA Compliance

All Phase 9 components maintain HIPAA compliance:
- ✅ All conversation history stored in local PostgreSQL
- ✅ No external API calls for quality checks
- ✅ All processing local (Ollama-based)
- ✅ Audit trail for all quality assessments
- ✅ Data retention policies configurable

---

## 📝 Next Steps

1. Review and approve this plan
2. Create database migration (005_hallucination_prevention_schema.sql)
3. Start with Conversation History Service (foundational)
4. Iterate through services week by week
5. Continuous testing and validation

---

**Status:** PLANNING COMPLETE - Ready for Implementation
**Dependencies:** Phases 1-8 complete ✅
**Estimated Duration:** 5 weeks
**Risk Level:** MEDIUM (new functionality, performance impact)
