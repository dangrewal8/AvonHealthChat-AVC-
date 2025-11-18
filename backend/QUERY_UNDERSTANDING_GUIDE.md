# Enhanced Query Understanding & Question Answering Guide

## Overview

The Avon Health RAG chatbot now features advanced natural language processing (NLP) capabilities to understand and answer medical questions with high accuracy.

## Features

### 1. Medical Abbreviation Expansion

The system automatically expands 40+ medical abbreviations:

| Abbreviation | Expands To | Example Query |
|--------------|------------|---------------|
| `meds` | medications | "What meds is the pt taking?" |
| `pt` | patient | "How old is the pt?" |
| `BP` | blood pressure | "What's the pt's BP?" |
| `A1C` | hemoglobin A1C | "What is the latest A1C?" |
| `Dr` / `doc` | doctor | "Who is the doc treating this patient?" |
| `T2DM` | type 2 diabetes | "Does pt have T2DM?" |
| `HTN` | hypertension | "Is the patient on HTN medication?" |
| `RX` | prescription | "What RX does the patient have?" |

**Full list:** BP, HR, RR, temp, med/meds, rx, doc/dr, NP, pt, dx, hx, FH, SH, LDL, HDL, eGFR, ALT, AST, BMI, wt, ht, DM, T2DM, HTN, A1C/HbA1c

### 2. Synonym Mapping

Questions are matched across synonyms:

**Medications:**
- "What medications does the patient take?"
- "What medicines is the patient on?"
- "List all drugs prescribed"
- "What prescriptions does the patient have?"
- "Show me their pills"

**All understood as:** medications intent (95%+ confidence)

**Other Categories with Synonyms:**
- **Allergies:** allergy, allergic, reaction, sensitive, sensitivity, intolerance
- **Vital Signs:** vitals, signs, BP, pulse, temperature, heart rate
- **Lab Results:** labs, tests, bloodwork, laboratory results
- **Diabetes:** diabetic, blood sugar, glucose, A1C, T2DM
- **Hypertension:** high blood pressure, HTN, elevated BP
- **Doctor:** physician, provider, clinician, practitioner
- **Appointments:** visit, appt, scheduled, upcoming, follow-up

### 3. Intent Detection

The system detects 18 different medical query intents:

| Intent | Example Questions | Confidence |
|--------|------------------|------------|
| **name** | "What is the patient's name?", "Who is this patient?" | 85-100% |
| **age** | "How old is the patient?", "Patient's birth date?" | 85-100% |
| **medications** | "What medications?", "List all meds" | 90-100% |
| **allergies** | "Any allergies?", "What is patient allergic to?" | 85-100% |
| **vitals** | "What are the vital signs?", "Latest BP?" | 80-95% |
| **labs** | "Lab results?", "Recent bloodwork?" | 80-95% |
| **diabetes** | "A1C level?", "Blood sugar management?" | 85-100% |
| **blood_pressure** | "What's the BP?", "Hypertension status?" | 85-100% |
| **care_plans** | "Active care plans?", "Treatment plan?" | 75-90% |
| **diagnosis** | "What conditions?", "Current diagnoses?" | 75-90% |
| **doctor** | "Who is the provider?", "Treating physician?" | 80-95% |
| **appointments** | "Next visit?", "Upcoming appointments?" | 75-90% |
| **immunizations** | "Vaccination status?", "Recent shots?" | 80-95% |
| **medical_history** | "Past medical history?", "Prior conditions?" | 70-85% |
| **family_history** | "Family history?", "Hereditary conditions?" | 75-90% |
| **social_history** | "Does patient smoke?", "Alcohol use?" | 70-85% |
| **emergency_contact** | "Emergency contact info?", "Who to call?" | 80-95% |
| **contact_info** | "Patient's phone number?", "Email address?" | 80-95% |

### 4. Query Complexity Analysis

Questions are automatically classified:

#### Simple Questions (Score 0-1)
```
- "What is the patient's name?"
- "How old is the patient?"
- "What medications does the patient take?"
```

**Processing:**
- Quick response
- Direct answer from single data source
- High confidence (85-100%)

#### Moderate Questions (Score 2-3)
```
- "What medications and diagnoses does the patient have?"
- "Recent lab results and vital signs?"
- "Has the patient's blood pressure improved?"
```

**Processing:**
- Multi-source context
- May require aggregation
- Moderate confidence (70-85%)

#### Complex Questions (Score 4+)
```
- "Compare the patient's A1C levels over the past year and explain the trend"
- "What are the patient's medications, why were they prescribed, and are they working?"
- "Has the patient's diabetes management improved since starting metformin?"
```

**Processing:**
- Requires multiple data sources
- Temporal analysis
- Comparison or trend analysis
- Explanation required
- Confidence varies (60-85%)

### 5. Entity Extraction

The system extracts specific entities from queries:

**Medications:**
```
Query: "Is the patient taking metformin or lisinopril?"
Extracted: ["metformin", "lisinopril"]
```

**Conditions:**
```
Query: "Does the patient have diabetes or hypertension?"
Extracted: ["diabetes", "hypertension"]
```

**Dates:**
```
Query: "Lab results from 10/15/2024?"
Extracted: ["10/15/2024"]
```

**Numbers:**
```
Query: "What medications does the 65 year old patient take?"
Extracted: [65]
```

### 6. Question Type Detection

| Type | Examples | Optimized For |
|------|----------|---------------|
| **what** | "What medications?", "What's the BP?" | Fact retrieval |
| **when** | "When was the last visit?", "When prescribed?" | Temporal queries |
| **who** | "Who is the doctor?", "Who prescribed this?" | Provider info |
| **where** | "Where is the appointment?", "Where to call?" | Location info |
| **how** | "How is diabetes managed?", "How to contact?" | Explanation |
| **why** | "Why was this prescribed?" | Reasoning |
| **boolean** | "Is patient diabetic?", "Does patient have allergies?" | Yes/No |
| **list** | "List all medications", "Show care plans" | Enumeration |

### 7. Multi-Part Question Handling

**Detection:**
```
"What medications does the patient take and what are their dosages?"
→ Detected as multi-part
```

**Processing:**
- Both parts addressed in single response
- Context shared across parts
- Structured answer with all requested information

**Example:**
```
Query: "What is the patient's name and age?"

Answer:
- Name: John Doe
- Age: 65 years old (born 03/15/1959)
```

### 8. Follow-Up Question Detection

The system recognizes when questions reference previous context:

```
User: "What medications does the patient take?"
Bot: "The patient takes Metformin 500mg twice daily..."

User: "What about allergies?"  ← Follow-up detected
Bot: [Uses context from previous query]
```

**Indicators:**
- Pronouns: "What about", "How about"
- References: "That", "Those", "It", "Them"
- Additions: "Also", "Too", "As well"

### 9. Temporal Context

Questions with time context get prioritized data:

**Keywords:** recent, latest, last, current, now, today, yesterday, this week, this month

```
"What are the patient's recent lab results?"
→ Sorts results by date, shows most recent first

"Has the A1C improved?"
→ Compares current vs. previous values
```

### 10. Trend Analysis

Questions asking about changes:

**Keywords:** change, improved, worse, better, trend, progress, over time

```
"Has the patient's blood pressure improved?"
→ Analyzes BP readings over time
→ Provides trend (improving/stable/worsening)
```

## Query Processing Pipeline

```
1. Query Input
   ↓
2. Normalization
   - Expand abbreviations
   - Remove filler words
   - Standardize format
   ↓
3. Analysis
   - Detect intent (18 categories)
   - Extract entities (meds, conditions, dates)
   - Determine complexity (simple/moderate/complex)
   - Identify question type (what/when/who/etc.)
   - Check for multi-part
   - Check for follow-up
   ↓
4. Context Building
   - Fetch data from Avon Health API
   - Prioritize sources based on intent
   - Build comprehensive context
   ↓
5. RAG Generation
   - Pass context to Ollama LLM
   - Generate evidence-based answer
   - Extract structured data
   - Provide source citations
   ↓
6. Response
   - Short answer (1-2 sentences)
   - Detailed summary
   - Structured extractions
   - Provenance (sources)
   - Confidence scores
```

## Example Queries & Responses

### Simple Query
```
Query: "What meds does the pt take?"

Analysis:
- Intent: medications (100% confidence)
- Complexity: simple
- Question Type: what
- Normalized: "medications patient take"

Response:
- Short Answer: "Patient takes 3 medications: Metformin 500mg, Lisinopril 10mg, and Atorvastatin 20mg"
- Confidence: 95%
- Sources: 3 medication records
```

### Moderate Query
```
Query: "What is the patient's BP and A1C?"

Analysis:
- Intent: vitals (75% confidence)
- Complexity: moderate (multi-part)
- Question Type: what
- Multi-part: true

Response:
- Short Answer: "BP: 128/78 mmHg (measured today), A1C: 6.8% (from last month)"
- Confidence: 88%
- Sources: vital signs, lab results
```

### Complex Query
```
Query: "Has the patient's diabetes management improved since starting metformin?"

Analysis:
- Intent: diabetes (85% confidence)
- Complexity: complex (trend analysis, temporal, comparison)
- Question Type: boolean
- Entities: ["metformin"]
- Trend: true

Response:
- Short Answer: "Yes, diabetes management has improved. A1C decreased from 8.2% to 6.8% over 3 months."
- Detailed: Trend analysis with before/after comparison
- Confidence: 82%
- Sources: medication history, lab results (2 time points)
```

## Confidence Scoring

The system provides confidence scores:

| Range | Meaning | Common Causes |
|-------|---------|---------------|
| **90-100%** | Very High | Exact intent match, simple query, clear data |
| **75-89%** | High | Good intent match, moderate complexity |
| **60-74%** | Moderate | Ambiguous intent, complex query, limited data |
| **<60%** | Low | Unclear intent, missing data, very complex |

**Confidence Breakdown:**
- **Retrieval:** How well data was found (did we get relevant EMR data?)
- **Reasoning:** How well LLM understood the question
- **Extraction:** How well structured data was extracted

## Best Practices for Questions

### ✅ DO

1. **Use natural language:**
   - "What medications does the patient take?"
   - "Show me the patient's allergies"

2. **Use medical abbreviations:**
   - "What's the pt's BP?"
   - "Latest A1C results?"

3. **Ask specific questions:**
   - "What is the patient's current metformin dosage?"
   - "When was the patient last seen?"

4. **Request multiple items:**
   - "What medications and allergies does the patient have?"

### ❌ DON'T

1. **Use overly vague questions:**
   - "Tell me about the patient" (too broad)
   - Better: "What is the patient's name and age?"

2. **Ask unrelated questions:**
   - "What's the weather?" (not medical)

3. **Expect data not in EMR:**
   - "What does the patient eat for breakfast?" (not in medical records)

## Response Format

Every response includes:

```json
{
  "query_id": "uuid",
  "short_answer": "Direct 1-2 sentence answer",
  "detailed_summary": "Comprehensive explanation",
  "structured_extractions": [
    {
      "type": "medication",
      "value": "Metformin 500mg",
      "confidence": 0.95,
      "source": "medication_123"
    }
  ],
  "provenance": [
    {
      "artifact_type": "medication",
      "snippet": "Metformin 500mg twice daily",
      "source_url": "avon://medications/123",
      "relevance_score": 0.98
    }
  ],
  "confidence": {
    "overall": 0.92,
    "breakdown": {
      "retrieval": 0.95,
      "reasoning": 0.90,
      "extraction": 0.91
    },
    "explanation": "Answer from 3 medication records"
  }
}
```

## Advanced Features

### Smart Context Prioritization

Based on detected intent, the system prioritizes relevant data:

```
Query: "What medications?"
Priority: medications → care_plans → notes

Query: "What diagnoses?"
Priority: care_plans → notes → medications

Query: "Latest vitals?"
Priority: notes → care_plans → medications
```

### Conversation History

The system can use conversation history for context:

```typescript
{
  "query": "What about allergies?",
  "conversation_history": [
    {
      "role": "user",
      "content": "What medications does the patient take?"
    },
    {
      "role": "assistant",
      "content": "Patient takes Metformin 500mg..."
    }
  ]
}
```

### Suggestions

The system provides suggestions for unclear queries:

```
Query: "Tell me about the patient"
Suggestions:
- "Query intent unclear - results may be broad"
- "Consider asking specific questions like 'What medications?' or 'What diagnoses?'"
```

---

**Last Updated:** 2025-11-18
**NLP Version:** 2.0 (Enhanced with entity extraction and complexity analysis)
