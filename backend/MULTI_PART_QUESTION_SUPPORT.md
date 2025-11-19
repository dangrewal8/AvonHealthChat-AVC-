# Multi-Part Question Support

**Date:** 2025-11-18
**Feature:** Enhanced query handling for complex multi-part questions

## Overview

The RAG system now supports sophisticated multi-part questions, allowing users to ask for multiple pieces of information in a single query. This enables more natural and efficient information retrieval.

---

## Supported Question Patterns

### 1. **List-Style Questions**
Ask for multiple items in a single query using commas or "and".

**Examples:**
- ✅ "What are the patient's blood pressure and allergies?"
- ✅ "What is the patient's name, age, and email?"
- ✅ "Show me temperature, pulse, and oxygen saturation"
- ✅ "Tell me the patient's medications, allergies, and vital signs"

**Output Format (3+ items):**
```
1. The patient's most recent blood pressure is 120/80 (recorded November 15, 2025)
2. The patient has 3 active allergies: Penicillin, Peanuts, Latex
3. The patient's name is Sample Patient
```

**Output Format (2 items):**
```
The patient's most recent blood pressure is 120/80 (recorded November 15, 2025). The patient has 3 active allergies: Penicillin, Peanuts, Latex.
```

---

### 2. **Dual Question Format**
Ask two complete questions joined by "and".

**Examples:**
- ✅ "What medications is the patient taking and what are their allergies?"
- ✅ "When was the last visit and who is the patient's doctor?"
- ✅ "What is the patient's age and what conditions do they have?"
- ✅ "How many medications is the patient on and what is their blood pressure?"

**Output Format:**
```
The patient is currently taking 5 medications, including Lisinopril (10mg), Metformin (500mg), Atorvastatin (20mg). The patient has 3 active allergies: Penicillin, Peanuts, Latex.
```

---

### 3. **Temporal Comparisons**
Compare current vs. past states of medical data.

#### Medications: Active vs. Inactive

**Examples:**
- ✅ "What are the current medications and past medications?"
- ✅ "Show me active medications and inactive medications"
- ✅ "What medications is the patient taking now and what medications did they take before?"

**Output Format:**
```
Currently taking 5 medications: Lisinopril (10mg), Metformin (500mg), Atorvastatin (20mg), Levothyroxine (50mcg), Aspirin (81mg). Previously took 12 medications: Warfarin (5mg), Hydrochlorothiazide (25mg), Simvastatin (40mg), Amlodipine (5mg), Omeprazole (20mg), and others.
```

#### Allergies: Active vs. Inactive

**Examples:**
- ✅ "What are the active allergies and inactive allergies?"
- ✅ "Show me current allergies and past allergies"
- ✅ "What allergies does the patient have now and what allergies are historical?"

**Output Format:**
```
Active allergies (3): Penicillin, Peanuts, Latex. Inactive allergies (2): Sulfa drugs, Shellfish.
```

---

## Implementation Details

### Multi-Part Detection Algorithm

The system uses 4 detection patterns:

**Pattern 1: List Extraction**
```regex
/^what (?:is|are) (?:the )?(?:patient'?s? )?(.+)$/i
```
Splits on commas and "and", reconstructs as individual questions.

**Pattern 2: Show/Tell Commands**
```regex
/^(?:show|tell|give) (?:me )?(?:the )?(?:patient'?s? )?(.+)$/i
```
Handles imperative forms like "show me X and Y".

**Pattern 3: Dual Questions**
Detects two complete questions joined by "and":
- Both parts must start with question words (what, when, who, where, how, is, are, does)

**Pattern 4: Temporal Comparisons**
```regex
/(?:current|active|present).+(?:and|,).+(?:past|previous|historical|inactive)/i
```
Specialized handling for comparing current vs. past states.

---

## Answer Formatting

### Two Parts
Answers are concatenated with a space:
```
Answer 1. Answer 2.
```

### Three or More Parts
Formatted as a numbered list:
```
1. Answer 1
2. Answer 2
3. Answer 3
```

---

## Examples with Real Data

### Example 1: Basic Demographics
**Query:**
"What is the patient's name, age, and email?"

**Response:**
```
1. The patient's name is Sample Patient
2. The patient is 35 years old (born January 1, 1990)
3. Patient contact information: Email: sample+prosper@demo.com
```

---

### Example 2: Mixed Data Types
**Query:**
"What are the patient's allergies and vital signs?"

**Response:**
```
The patient has 3 active allergies: Penicillin, Peanuts, Latex. Latest vital signs (November 15, 2025): BP: 120/80, Pulse: 72, Temp: 98.6°F, O2: 98%.
```

---

### Example 3: Temporal Comparison
**Query:**
"Show me current medications and past medications"

**Response:**
```
Currently taking 5 medications: Lisinopril (10mg), Metformin (500mg), Atorvastatin (20mg), Levothyroxine (50mcg), Aspirin (81mg). Previously took 12 medications: Warfarin (5mg), Hydrochlorothiazide (25mg), Simvastatin (40mg), Amlodipine (5mg), Omeprazole (20mg), and others.
```

---

### Example 4: Complex Medical Query
**Query:**
"What medications is the patient taking, what are their allergies, and what is their blood pressure?"

**Response:**
```
1. The patient is currently taking 5 medications, including Lisinopril (10mg), Metformin (500mg), Atorvastatin (20mg)
2. The patient has 3 active allergies: Penicillin, Peanuts, Latex
3. The patient's most recent blood pressure is 120/80 (recorded November 15, 2025)
```

---

## Limitations & Edge Cases

### Known Limitations:
1. **Maximum 10 parts recommended** - Beyond 10 parts, response may become unwieldy
2. **Each part must be independently answerable** - Cannot handle dependencies between parts
3. **Ambiguous "and" detection** - May not detect multi-part in complex sentences

### Edge Cases Handled:
✅ Short phrases like "blood pressure and allergies"
✅ Comma-separated lists with or without "and"
✅ Questions in any order (current/past or past/current)
✅ Mixed question styles within single query

---

## Technical Architecture

### Code Location
`/backend/src/routes/api.routes.ts`

**Lines 70-173:** Multi-part detection and processing
**Lines 269-295:** Temporal medication comparison
**Lines 676-702:** Temporal allergy comparison

### Key Functions
- `detectMultiPartQuestion(query)` - Identifies and splits multi-part questions
- `generateFallbackShortAnswer(part, queryIntent, data)` - Recursively processes each part

### Processing Flow
```
User Query
    ↓
Multi-part Detection
    ↓
Split into Parts → [Part 1, Part 2, Part 3, ...]
    ↓
Process Each Part Recursively
    ↓
Format & Combine Answers
    ↓
Return to User
```

---

## Performance Considerations

- **Recursive Processing:** Each part is processed independently
- **No Additional API Calls:** All data fetched once, reused for all parts
- **Efficient Filtering:** Uses in-memory filtering on pre-fetched data
- **Logging:** Logs number of parts detected for monitoring

---

## Future Enhancements

Potential improvements:
1. **Cross-referencing:** Answer part B using information from part A
2. **Smart grouping:** Group related answers (e.g., all vitals together)
3. **Conditional logic:** "If patient has diabetes, show medications for it"
4. **Natural language joins:** "also", "additionally", "furthermore"
5. **Chart formatting:** For 5+ parts, format as table or structured output
