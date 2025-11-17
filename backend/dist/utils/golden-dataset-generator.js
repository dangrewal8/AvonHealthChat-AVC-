"use strict";
/**
 * Golden Dataset Generator
 *
 * Generates sample golden dataset entries for testing and evaluation.
 *
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSampleDataset = generateSampleDataset;
const golden_dataset_types_1 = require("../types/golden-dataset.types");
const query_types_1 = require("../types/query.types");
/**
 * Generate sample golden dataset entries
 */
function generateSampleDataset() {
    const entries = [];
    // Generate medication queries (20)
    entries.push(...generateMedicationEntries(20));
    // Generate care plan queries (15)
    entries.push(...generateCarePlanEntries(15));
    // Generate temporal queries (20)
    entries.push(...generateTemporalEntries(20));
    // Generate entity queries (15)
    entries.push(...generateEntityEntries(15));
    // Generate negative queries (10)
    entries.push(...generateNegativeEntries(10));
    // Generate ambiguous queries (10)
    entries.push(...generateAmbiguousEntries(10));
    return entries;
}
/**
 * Generate medication query entries
 */
function generateMedicationEntries(count) {
    const medications = [
        { name: 'Metformin', dose: '500mg', frequency: 'twice daily' },
        { name: 'Lisinopril', dose: '10mg', frequency: 'once daily' },
        { name: 'Ibuprofen', dose: '400mg', frequency: 'q6h PRN' },
        { name: 'Atorvastatin', dose: '20mg', frequency: 'once daily at bedtime' },
        { name: 'Levothyroxine', dose: '75mcg', frequency: 'once daily in AM' },
    ];
    const entries = [];
    for (let i = 0; i < count; i++) {
        const med = medications[i % medications.length];
        const entryNum = i + 1;
        entries.push({
            id: `golden_med_${String(entryNum).padStart(3, '0')}`,
            category: 'medication',
            query: generateMedicationQuery(med, i),
            patient_id: 'user_3kmUMGZdobZMsMwxp8TFp4eSu1',
            expected_intent: query_types_1.QueryIntent.RETRIEVE_MEDICATIONS,
            expected_entities: [
                {
                    text: med.name.toLowerCase(),
                    type: 'medication',
                    normalized: med.name,
                    confidence: 0.95,
                },
            ],
            expected_temporal: i % 3 === 0 ? {
                dateFrom: '2024-10-01',
                dateTo: '2025-01-01',
                timeReference: 'last 3 months',
                relativeType: 'months',
                amount: 3,
            } : null,
            ground_truth: {
                relevant_artifact_ids: [`cp_${100 + i}`, `note_${200 + i}`],
                expected_extractions: [
                    {
                        type: 'medication_recommendation',
                        medication: med.name,
                        dose: med.dose,
                        frequency: med.frequency,
                        intent: 'recommended',
                        recommended_by: 'Dr. Smith',
                        recommendation_date: '2024-11-15',
                        provenance: [
                            {
                                artifact_id: `cp_${100 + i}`,
                                char_offsets: [0, 50],
                                supporting_text: `Plan: Start ${med.name} ${med.dose} ${med.frequency}`,
                                source: `https://demo-api.avonhealth.com/careplans/cp_${100 + i}`,
                                score: 0.92,
                            },
                        ],
                    },
                ],
                expected_confidence_min: 0.85,
                expected_sources_min: 2,
            },
            acceptance_criteria: golden_dataset_types_1.CATEGORY_ACCEPTANCE_CRITERIA.medication,
            created_at: new Date().toISOString(),
            verified_by: 'clinical_reviewer_1',
            metadata: {
                difficulty: i < 7 ? 'easy' : i < 14 ? 'medium' : 'hard',
                tags: ['medication', 'prescription'],
            },
        });
    }
    return entries;
}
function generateMedicationQuery(med, index) {
    const queries = [
        `What medications did I recommend for the patient?`,
        `Show me all ${med.name} prescriptions`,
        `When was ${med.name} last prescribed?`,
        `What dosage of ${med.name} is the patient taking?`,
        `Has the patient been prescribed ${med.name}?`,
    ];
    return queries[index % queries.length];
}
/**
 * Generate care plan query entries
 */
function generateCarePlanEntries(count) {
    const conditions = ['Diabetes', 'Hypertension', 'Asthma', 'COPD', 'Heart Failure'];
    const entries = [];
    for (let i = 0; i < count; i++) {
        const condition = conditions[i % conditions.length];
        const entryNum = i + 1;
        entries.push({
            id: `golden_cp_${String(entryNum).padStart(3, '0')}`,
            category: 'care_plan',
            query: generateCarePlanQuery(condition, i),
            patient_id: 'user_3kmUMGZdobZMsMwxp8TFp4eSu1',
            expected_intent: query_types_1.QueryIntent.RETRIEVE_CARE_PLANS,
            expected_entities: [
                {
                    text: condition.toLowerCase(),
                    type: 'condition',
                    normalized: condition,
                    confidence: 0.9,
                },
            ],
            expected_temporal: i % 2 === 0 ? {
                dateFrom: '2024-11-01',
                dateTo: '2025-01-01',
                timeReference: 'last 2 months',
                relativeType: 'months',
                amount: 2,
            } : null,
            ground_truth: {
                relevant_artifact_ids: [`cp_${300 + i}`, `cp_${400 + i}`],
                expected_extractions: [
                    {
                        type: 'care_plan',
                        condition: condition,
                        goals: ['Maintain blood sugar control', 'Prevent complications'],
                        interventions: ['Medication management', 'Lifestyle modifications'],
                        created_by: 'Dr. Johnson',
                        created_date: '2024-11-01',
                    },
                ],
                expected_confidence_min: 0.8,
                expected_sources_min: 2,
            },
            acceptance_criteria: golden_dataset_types_1.CATEGORY_ACCEPTANCE_CRITERIA.care_plan,
            created_at: new Date().toISOString(),
            verified_by: 'clinical_reviewer_2',
            metadata: {
                difficulty: i < 5 ? 'easy' : i < 10 ? 'medium' : 'hard',
                tags: ['care_plan', condition.toLowerCase()],
            },
        });
    }
    return entries;
}
function generateCarePlanQuery(condition, index) {
    const queries = [
        `Show me the care plan for ${condition}`,
        `What is the treatment plan for ${condition}?`,
        `Find all care plans related to ${condition}`,
        `What are the goals for managing ${condition}?`,
        `Show me recent care plans`,
    ];
    return queries[index % queries.length];
}
/**
 * Generate temporal query entries
 */
function generateTemporalEntries(count) {
    const entries = [];
    for (let i = 0; i < count; i++) {
        const entryNum = i + 1;
        const timeRef = i % 4 === 0 ? 'last week' : i % 4 === 1 ? 'last month' : i % 4 === 2 ? 'last 3 months' : 'last year';
        const relType = i % 4 === 0 ? 'weeks' : i % 4 === 1 ? 'months' : i % 4 === 2 ? 'months' : 'years';
        const amount = i % 4 === 0 ? 1 : i % 4 === 1 ? 1 : i % 4 === 2 ? 3 : 1;
        entries.push({
            id: `golden_temp_${String(entryNum).padStart(3, '0')}`,
            category: 'temporal',
            query: generateTemporalQuery(timeRef, i),
            patient_id: 'user_3kmUMGZdobZMsMwxp8TFp4eSu1',
            expected_intent: query_types_1.QueryIntent.RETRIEVE_RECENT,
            expected_entities: [],
            expected_temporal: {
                dateFrom: calculateDateFrom(relType, amount),
                dateTo: new Date().toISOString().split('T')[0],
                timeReference: timeRef,
                relativeType: relType,
                amount: amount,
            },
            ground_truth: {
                relevant_artifact_ids: [`note_${500 + i}`, `note_${600 + i}`, `cp_${700 + i}`],
                expected_extractions: [],
                expected_confidence_min: 0.75,
                expected_sources_min: 3,
            },
            acceptance_criteria: golden_dataset_types_1.CATEGORY_ACCEPTANCE_CRITERIA.temporal,
            created_at: new Date().toISOString(),
            verified_by: 'clinical_reviewer_1',
            metadata: {
                difficulty: i < 7 ? 'easy' : i < 14 ? 'medium' : 'hard',
                tags: ['temporal', timeRef.replace(' ', '_')],
            },
        });
    }
    return entries;
}
function generateTemporalQuery(timeRef, index) {
    const queries = [
        `What changed in the ${timeRef}?`,
        `Show me all updates from ${timeRef}`,
        `What new information was added ${timeRef}?`,
        `Find notes created ${timeRef}`,
        `What medications were prescribed ${timeRef}?`,
    ];
    return queries[index % queries.length];
}
function calculateDateFrom(relType, amount) {
    const date = new Date();
    if (relType === 'weeks') {
        date.setDate(date.getDate() - amount * 7);
    }
    else if (relType === 'months') {
        date.setMonth(date.getMonth() - amount);
    }
    else if (relType === 'years') {
        date.setFullYear(date.getFullYear() - amount);
    }
    return date.toISOString().split('T')[0];
}
/**
 * Generate entity query entries
 */
function generateEntityEntries(count) {
    const entities = ['ibuprofen', 'diabetes', 'blood pressure', 'glucose', 'insulin'];
    const entries = [];
    for (let i = 0; i < count; i++) {
        const entity = entities[i % entities.length];
        const entryNum = i + 1;
        entries.push({
            id: `golden_ent_${String(entryNum).padStart(3, '0')}`,
            category: 'entity',
            query: `Find all records mentioning ${entity}`,
            patient_id: 'user_3kmUMGZdobZMsMwxp8TFp4eSu1',
            expected_intent: query_types_1.QueryIntent.SEARCH,
            expected_entities: [
                {
                    text: entity,
                    type: i % 2 === 0 ? 'medication' : 'condition',
                    normalized: entity,
                    confidence: 0.9,
                },
            ],
            expected_temporal: null,
            ground_truth: {
                relevant_artifact_ids: [`note_${800 + i}`, `cp_${900 + i}`, `med_${1000 + i}`],
                expected_extractions: [],
                expected_confidence_min: 0.8,
                expected_sources_min: 3,
            },
            acceptance_criteria: golden_dataset_types_1.CATEGORY_ACCEPTANCE_CRITERIA.entity,
            created_at: new Date().toISOString(),
            verified_by: 'clinical_reviewer_2',
            metadata: {
                difficulty: i < 5 ? 'easy' : i < 10 ? 'medium' : 'hard',
                tags: ['entity', entity.replace(' ', '_')],
            },
        });
    }
    return entries;
}
/**
 * Generate negative query entries (should return no results)
 */
function generateNegativeEntries(count) {
    const entries = [];
    const negativeQueries = [
        'Show me prescriptions for penicillin',
        'Find records about surgery',
        'What about chemotherapy treatments?',
        'Show me dental procedures',
        'Find information about broken bones',
        'What about radiation therapy?',
        'Show me psychiatric evaluations',
        'Find records about allergies to shellfish',
        'What about vaccinations for travel?',
        'Show me ophthalmology visits',
    ];
    for (let i = 0; i < count; i++) {
        const entryNum = i + 1;
        entries.push({
            id: `golden_neg_${String(entryNum).padStart(3, '0')}`,
            category: 'negative',
            query: negativeQueries[i % negativeQueries.length],
            patient_id: 'user_3kmUMGZdobZMsMwxp8TFp4eSu1',
            expected_intent: query_types_1.QueryIntent.SEARCH,
            expected_entities: [],
            expected_temporal: null,
            ground_truth: {
                relevant_artifact_ids: [], // Should find nothing
                expected_extractions: [],
                expected_confidence_min: 0.0,
                expected_sources_min: 0,
            },
            acceptance_criteria: golden_dataset_types_1.CATEGORY_ACCEPTANCE_CRITERIA.negative,
            created_at: new Date().toISOString(),
            verified_by: 'clinical_reviewer_1',
            metadata: {
                difficulty: 'medium',
                tags: ['negative', 'no_results_expected'],
                notes: 'This query should return no results for this patient',
            },
        });
    }
    return entries;
}
/**
 * Generate ambiguous query entries (unclear queries)
 */
function generateAmbiguousEntries(count) {
    const entries = [];
    const ambiguousQueries = [
        'What did we discuss?',
        'Show me the thing from before',
        'What was that medication again?',
        'Find the recent stuff',
        'What about the problem?',
        'Show me what we talked about',
        'What was the plan?',
        'Find that thing',
        'What about it?',
        'Show me something',
    ];
    for (let i = 0; i < count; i++) {
        const entryNum = i + 1;
        entries.push({
            id: `golden_amb_${String(entryNum).padStart(3, '0')}`,
            category: 'ambiguous',
            query: ambiguousQueries[i % ambiguousQueries.length],
            patient_id: 'user_3kmUMGZdobZMsMwxp8TFp4eSu1',
            expected_intent: query_types_1.QueryIntent.SEARCH,
            expected_entities: [],
            expected_temporal: null,
            ground_truth: {
                relevant_artifact_ids: [`note_${1100 + i}`, `cp_${1200 + i}`],
                expected_extractions: [],
                expected_confidence_min: 0.5,
                expected_sources_min: 1,
            },
            acceptance_criteria: golden_dataset_types_1.CATEGORY_ACCEPTANCE_CRITERIA.ambiguous,
            created_at: new Date().toISOString(),
            verified_by: 'clinical_reviewer_2',
            metadata: {
                difficulty: 'hard',
                tags: ['ambiguous', 'unclear_intent'],
                notes: 'Query lacks specificity - system should handle gracefully',
            },
        });
    }
    return entries;
}
//# sourceMappingURL=golden-dataset-generator.js.map