# Complete Testing Guide - All Avon Health Data Types

## Available Data Types (12 Total)

Based on the data compartment service, here are all 12 data types available from Avon Health:

### 1. **Patient Demographics** (patient)
Core patient information including name, DOB, contact info, etc.

**Test Queries:**
- "What is the patient's name?"
- "How old is the patient?"
- "What is the patient's date of birth?"
- "What is the patient's contact information?"
- "Show me the patient's demographic information"

---

### 2. **Conditions** (conditions)
Medical diagnoses and health conditions

**Test Queries:**
- "What medical conditions does the patient have?"
- "What is the patient diagnosed with?"
- "Does the patient have diabetes?"
- "What diseases has the patient been diagnosed with?"
- "Show me all health conditions"
- "When was the diabetes diagnosed?"

**Expected Data:** Type 2 diabetes mellitus with severe nonproliferative diabetic retinopathy without macular edema, bilateral (E11.3493)

---

### 3. **Medications** (medications)
Current and past prescriptions

**Test Queries:**
- "What medications is the patient taking?"
- "What is the patient currently prescribed?"
- "Show me all current medications"
- "What medications was the patient on in the past?"
- "Has the patient discontinued any medications?"
- "What is the dosage of metformin?"
- "When did the patient start taking insulin?"

**Expected Data:** Medications for diabetes management

---

### 4. **Allergies** (allergies)
Known allergies and reactions

**Test Queries:**
- "Does the patient have any allergies?"
- "What is the patient allergic to?"
- "Show me all documented allergies"
- "What kind of reaction does the patient have?"
- "Are there any food allergies?"
- "Is the patient allergic to any medications?"

---

### 5. **Vitals** (vitals)
Vital signs measurements (BP, temperature, heart rate, weight, height, etc.)

**Test Queries:**
- "What is the patient's blood pressure?"
- "Show me the patient's vital signs"
- "What is the patient's most recent temperature?"
- "What does the patient weigh?"
- "What is the patient's heart rate?"
- "Show me vital signs from the last visit"
- "Has the patient's blood pressure improved?"

---

### 6. **Care Plans** (care_plans)
Treatment plans and care coordination

**Test Queries:**
- "What is the patient's care plan?"
- "Show me the treatment plan"
- "What are the care recommendations?"
- "What is being done to manage the diabetes?"
- "What is the current care plan?"

**Expected Data:** Care plans for diabetes management

---

### 7. **Clinical Notes** (notes)
Provider notes from visits and encounters

**Test Queries:**
- "What did the doctor note at the last visit?"
- "Show me clinical notes"
- "What was documented in recent encounters?"
- "What did the provider say about the patient's condition?"
- "Show me visit notes"
- "What was discussed at the last appointment?"

---

### 8. **Family History** (family_history)
Genetic/hereditary conditions and family medical history

**Test Queries:**
- "What is the patient's family history?"
- "Does anyone in the family have diabetes?"
- "What hereditary conditions run in the family?"
- "Show me genetic risk factors"
- "What medical conditions are in the patient's family?"

---

### 9. **Appointments** (appointments)
Scheduled and past appointments

**Test Queries:**
- "When is the patient's next appointment?"
- "Show me upcoming appointments"
- "What appointments has the patient had?"
- "When was the last visit?"
- "Is there a follow-up scheduled?"

---

### 10. **Documents** (documents)
Forms, consent documents, patient paperwork

**Test Queries:**
- "What documents are on file?"
- "Show me patient documents"
- "Are there any consent forms?"
- "What paperwork has been completed?"

---

### 11. **Form Responses** (form_responses)
Patient-completed questionnaires and forms

**Test Queries:**
- "What forms has the patient filled out?"
- "Show me questionnaire responses"
- "What did the patient report on the intake form?"

---

### 12. **Insurance Policies** (insurance_policies)
Coverage information and policies

**Test Queries:**
- "What is the patient's insurance?"
- "Show me insurance coverage"
- "What insurance policies are active?"
- "Is the patient covered for this treatment?"

---

## Multi-Type Queries

Test queries that span multiple data types:

**Summary Queries:**
- "Give me a complete patient summary"
- "What is the patient's medical history?"
- "Show me everything about the patient"

**Cross-Referenced Queries:**
- "What medications is the patient taking for diabetes?" (conditions + medications)
- "Are there any allergy concerns with current medications?" (allergies + medications)
- "How have the vitals changed since starting medication?" (vitals + medications + timeline)

---

## Primary Test Patient

**Patient ID:** patient123 (maps to user_n15wtm6xCNQGrmgfMCGOVaqEq0S2)

**Known Data Available:**
- ✅ Complete demographics
- ✅ 1 condition (Type 2 diabetes)
- ✅ Medications
- ✅ Allergies
- ✅ Vitals
- ✅ Care plans

**Potentially Available:**
- ❓ Clinical notes
- ❓ Family history
- ❓ Appointments
- ❓ Documents
- ❓ Form responses
- ❓ Insurance policies

---

## Testing Strategy

### Phase 1: Individual Data Types
Test each of the 12 data types independently with queries focused on that specific type.

### Phase 2: Cross-Type Queries
Test queries that require data from multiple types.

### Phase 3: Edge Cases
- Missing data: "What lab results does the patient have?" (not a data type)
- Negative queries: "Does the patient have any past medications?"
- Temporal queries: "When did the patient's diabetes start?"

### Phase 4: Conversational Format Validation
For each query, verify:
- ✅ No "Direct Answer:" label
- ✅ No "Key Details:" label
- ✅ No "Clinical Context:" label
- ✅ Natural, conversational tone
- ✅ Only relevant information (no medication details in condition queries)
- ✅ Professional but approachable writing

---

## Expected Response Format

**Good Response Example:**
```
The patient has Type 2 diabetes mellitus with severe nonproliferative diabetic
retinopathy without macular edema, bilateral. This condition was diagnosed on
February 12th, 2025, and is documented with ICD-10 code E11.3493.
```

**Bad Response Example (What We Fixed):**
```
Direct Answer:

The patient has Type 2 diabetes mellitus with severe nonproliferative diabetic
retinopathy without macular edema, bilateral.

Key Details:

The patient is currently taking metformin 1,000mg twice daily...
```
