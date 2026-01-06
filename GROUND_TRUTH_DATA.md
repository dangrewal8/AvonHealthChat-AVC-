# Ground Truth Data - Patient user_n15wtm6xCNQGrmgfMCGOVaqEq0S2
**Source:** Avon Health API via backend logs
**Date:** 2026-01-04

## Data Inventory Summary

| Data Type | Count | Has Data | Notes |
|-----------|-------|----------|-------|
| Medications | 1 | ✅ YES | From 217 total in system |
| Conditions | 1 | ✅ YES | From 220 total in system |
| Allergies | 1 | ✅ YES | From 226 total in system |
| Vitals | 1 | ✅ YES | From 203 total in system |
| Care Plans | 4 | ✅ YES | From 85 total in system |
| Clinical Notes | 3 | ✅ YES | From 868 total in system |
| Documents | 2 | ✅ YES | From 2180 total in system |
| Patient Demographics | 1 | ✅ YES | From 9 total in system |
| Family History | 0 | ❌ NO | 0 from 7 total in system |
| Appointments | 0 | ❌ NO | 0 from 46 total in system |
| Insurance Policies | 0 | ❌ NO | 0 from 323 total in system |

**Total Data Types with Data:** 8 out of 11

## Detailed Data (from query results)

### 1. Medications (1 record)
Based on previous query results:
- **Name:** Ibuprofen Oral Capsule (200 MG)
- **Dosage:** 200 MG
- **Instructions:** Take daily
- **Status:** Active
- **Start Date:** 2025-02-12T05:00:00.000Z
- **Provider:** user_HryoL5hpFahYE3foFry69afE9gv1
- **Artifact ID:** med_4e09c19e081c439789210f32b3711a63
- **Source URL:** https://demo-api.avonhealth.com/accounts/prosper/medications/med_4e09c19e081c439789210f32b3711a63

### 2. Conditions (1 record)
Based on comprehensive summary query:
- **Name:** Type 2 diabetes mellitus with severe nonproliferative diabetic retinopathy without macular edema, bilateral
- **ICD-10 Code:** E11.3493
- **Onset Date:** 2025-02-12 (February 12, 2025)
- **Provider:** user_HryoL5hpFahYE3foFry69afE9gv1
- **Additional Notes:** Also mentioned hypertension with BP data

### 3. Allergies (1 record)
- **Count:** 1 allergy documented
- **Details:** To be extracted from test results

### 4. Vitals (1 record)
Based on comprehensive summary:
- **Blood Pressure:** Documented (specific values to be extracted)
- **Status:** Indicates hypertension
- **Details:** To be extracted from test results

### 5. Care Plans (4 records)
- **Count:** 4 care plans active
- **Types:** To be extracted from test results
- **Focus:** Likely diabetes management and related conditions

### 6. Clinical Notes (3 records)
- **Count:** 3 notes documented
- **Details:** Visit records, encounter notes
- **Authors/Dates:** To be extracted from test results

### 7. Documents (2 records)
- **Count:** 2 documents in record
- **Types:** To be determined from test results

### 8. Patient Demographics (1 record)
- **Patient ID:** user_n15wtm6xCNQGrmgfMCGOVaqEq0S2
- **Unique ID:** Confirmed present
- **Additional Details:** To be extracted from test results

## Expected Test Behavior

### Data Types WITH Data (Should provide specific information):
1. **Medications** - Should return: Ibuprofen 200 MG, daily, started 2025-02-12, active
2. **Conditions** - Should return: Type 2 diabetes mellitus with diabetic retinopathy
3. **Allergies** - Should return: Specific allergy information
4. **Vitals** - Should return: Blood pressure and other vital signs
5. **Care Plans** - Should return: Information about 4 care plans
6. **Notes** - Should return: Information about 3 clinical notes
7. **Documents** - Should return: Information about 2 documents
8. **Demographics** - Should return: Patient ID and demographic information

### Data Types WITHOUT Data (Should say "not available"):
1. **Family History** - Should indicate no data available
2. **Appointments** - Should indicate no data available
3. **Insurance** - Should indicate no data available

## Anti-Hallucination Test Criteria

### For Data Types WITH Data:
- ✅ Must provide accurate, specific information matching ground truth
- ✅ Must include source attribution ("According to...")
- ✅ Must not invent additional data not present in records
- ✅ Must include provenance (artifact IDs, URLs when available)
- ✅ Must have structured extractions with confidence scores
- ❌ Must NOT say "not available" when data exists

### For Data Types WITHOUT Data:
- ✅ Must clearly state information is not available/documented
- ✅ Must use phrases like "not available in current records"
- ✅ Must NOT invent/hallucinate data
- ✅ Must have empty or minimal structured extractions
- ❌ Must NOT provide specific details as if data exists

## Accuracy Scoring Criteria

### Perfect Score (100%):
- Provides accurate, specific information when data exists
- Clearly states "not available" when no data exists
- Includes structured extractions and provenance
- Matches ground truth exactly

### Good Score (85-99%):
- Generally accurate information
- Minor wording differences but factually correct
- Has structured extractions or provenance (not both)

### Acceptable Score (70-84%):
- Correct overall but missing some details
- Lacks structured extractions or provenance
- Still factually accurate

### Failing Score (<70%):
- Says "not available" when data exists
- Provides data when none exists (hallucination)
- Factually incorrect information
- Significant deviations from ground truth

## Test Execution Notes

- **Total Questions:** 187 (full test) or 33 (quick sample)
- **Processing Time per Question:** ~60 seconds average
- **Data Compartmentalization:** System fetches only required data types per query
- **LLM Models:** Meditron 7B (extraction) + Llama3 8B (answers)
- **Verification:** Two-stage verification process for complex queries

## Data Consistency Requirements

Responses must be consistent across:
1. **Multiple similar questions** - Same data type should yield consistent answers
2. **Short vs detailed format** - Core facts should remain the same
3. **Direct vs indirect queries** - "What medications?" vs "Is patient taking ibuprofen?"
4. **API vs frontend** - chat.missionvalley.dev should match API results exactly

---

**Generated:** 2026-01-04
**For Testing:** Comprehensive Data Type Accuracy Test Suite
