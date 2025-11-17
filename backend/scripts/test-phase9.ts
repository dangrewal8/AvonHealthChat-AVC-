#!/usr/bin/env ts-node
/**
 * Test Phase 9: Hallucination Prevention & Quality Assurance
 *
 * Tests the complete Phase 9 pipeline:
 * 1. Store conversation history
 * 2. Verify answer grounding
 * 3. Check cross-query consistency
 * 4. Calibrate confidence scores
 * 5. Detect hallucination risks
 * 6. Generate quality metrics report
 *
 * Usage:
 * POSTGRES_HOST=localhost POSTGRES_PORT=5432 POSTGRES_DB=avon_health_rag POSTGRES_USER=postgres POSTGRES_PASSWORD=postgres npx ts-node scripts/test-phase9.ts
 */

import conversationHistoryService from '../src/services/conversation-history.service';
import answerGroundingVerifier from '../src/services/answer-grounding-verifier.service';
import crossQueryConsistency from '../src/services/cross-query-consistency.service';
import confidenceCalibration from '../src/services/confidence-calibration.service';
import hallucinationDetector from '../src/services/hallucination-detector.service';
import qualityMetricsAggregator from '../src/services/quality-metrics-aggregator.service';

const PATIENT_ID = 'patient-123'; // Test patient ID

// Sample test data
const TEST_QUERY_1 = {
  query: "What medications is the patient currently taking?",
  query_intent: "retrieve_medications",
  short_answer: "The patient is currently taking Atorvastatin 20mg daily for cholesterol and Lisinopril 10mg daily for blood pressure.",
  detailed_summary: "Based on the patient's current medication list, they are prescribed Atorvastatin 20mg once daily for hyperlipidemia management and Lisinopril 10mg once daily for hypertension control. Both medications were prescribed 3 months ago and remain active.",
  extractions: [
    {
      type: 'medication' as const,
      content: { medication_name: 'Atorvastatin', dosage: '20mg', frequency: 'daily', indication: 'Cholesterol' },
      provenance: {
        artifact_id: 'med-001',
        chunk_id: 'chunk-001',
        char_offsets: [0, 50] as [number, number],
        supporting_text: 'Atorvastatin 20mg once daily for hyperlipidemia',
        confidence: 0.95,
      },
    },
    {
      type: 'medication' as const,
      content: { medication_name: 'Lisinopril', dosage: '10mg', frequency: 'daily', indication: 'Blood pressure' },
      provenance: {
        artifact_id: 'med-002',
        chunk_id: 'chunk-002',
        char_offsets: [0, 45] as [number, number],
        supporting_text: 'Lisinopril 10mg once daily for hypertension',
        confidence: 0.93,
      },
    },
  ],
  sources: [
    {
      artifact_id: 'med-001',
      artifact_type: 'medication',
      chunk_id: 'chunk-001',
      text: 'Atorvastatin 20mg once daily for hyperlipidemia. Prescribed 3 months ago.',
      relevance_score: 0.95,
    },
    {
      artifact_id: 'med-002',
      artifact_type: 'medication',
      chunk_id: 'chunk-002',
      text: 'Lisinopril 10mg once daily for hypertension control. Started 3 months ago.',
      relevance_score: 0.93,
    },
  ],
  retrieval_candidates: [
    {
      chunk: {
        chunk_id: 'chunk-001',
        artifact_id: 'med-001',
        patient_id: PATIENT_ID,
        content: 'Atorvastatin 20mg once daily for hyperlipidemia. Prescribed 3 months ago.',
        metadata: {
          artifact_type: 'medication',
          date: new Date().toISOString(),
        },
      },
      score: 0.95,
      snippet: 'Atorvastatin 20mg once daily...',
      highlights: [],
      metadata: {
        artifact_type: 'medication',
        date: new Date().toISOString(),
      },
    },
    {
      chunk: {
        chunk_id: 'chunk-002',
        artifact_id: 'med-002',
        patient_id: PATIENT_ID,
        content: 'Lisinopril 10mg once daily for hypertension control. Started 3 months ago.',
        metadata: {
          artifact_type: 'medication',
          date: new Date().toISOString(),
        },
      },
      score: 0.93,
      snippet: 'Lisinopril 10mg once daily...',
      highlights: [],
      metadata: {
        artifact_type: 'medication',
        date: new Date().toISOString(),
      },
    },
  ],
};

const TEST_QUERY_2 = {
  query: "What is the patient's blood pressure diagnosis?",
  query_intent: "retrieve_conditions",
  short_answer: "The patient has been diagnosed with hypertension.",
  detailed_summary: "The patient's medical record indicates a diagnosis of essential hypertension. This condition is being actively managed with Lisinopril 10mg daily.",
  extractions: [
    {
      type: 'condition' as const,
      content: { condition_name: 'Hypertension', status: 'active', severity: 'moderate' },
      provenance: {
        artifact_id: 'cond-001',
        chunk_id: 'chunk-003',
        char_offsets: [0, 40] as [number, number],
        supporting_text: 'Diagnosed with essential hypertension',
        confidence: 0.92,
      },
    },
  ],
  sources: [
    {
      artifact_id: 'cond-001',
      artifact_type: 'condition',
      chunk_id: 'chunk-003',
      text: 'Diagnosed with essential hypertension. Currently managed with medication.',
      relevance_score: 0.92,
    },
  ],
  retrieval_candidates: [
    {
      chunk: {
        chunk_id: 'chunk-003',
        artifact_id: 'cond-001',
        patient_id: PATIENT_ID,
        content: 'Diagnosed with essential hypertension. Currently managed with medication.',
        metadata: {
          artifact_type: 'condition',
          date: new Date().toISOString(),
        },
      },
      score: 0.92,
      snippet: 'Diagnosed with essential hypertension...',
      highlights: [],
      metadata: {
        artifact_type: 'condition',
        date: new Date().toISOString(),
      },
    },
  ],
};

async function testPhase9Pipeline() {
  console.log('='.repeat(80));
  console.log('PHASE 9: HALLUCINATION PREVENTION & QUALITY ASSURANCE TEST');
  console.log('='.repeat(80));
  console.log(`\nPatient ID: ${PATIENT_ID}`);
  console.log(`Database: ${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'avon_health_rag'}\n`);

  try {
    // ========================================================================
    // STEP 1: Store Conversation History
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('STEP 1: Storing Conversation History');
    console.log('='.repeat(80) + '\n');

    const conversationId1 = await conversationHistoryService.storeConversation({
      patient_id: PATIENT_ID,
      query: TEST_QUERY_1.query,
      query_intent: TEST_QUERY_1.query_intent,
      query_timestamp: new Date(),
      short_answer: TEST_QUERY_1.short_answer,
      detailed_summary: TEST_QUERY_1.detailed_summary,
      model_used: 'llama3',
      extractions: TEST_QUERY_1.extractions,
      sources: TEST_QUERY_1.sources,
      retrieval_candidates: TEST_QUERY_1.retrieval_candidates as any,
      enrichment_enabled: true,
      multi_hop_enabled: true,
      reasoning_enabled: true,
      execution_time_ms: 1200,
      retrieval_time_ms: 400,
      generation_time_ms: 600,
    });

    console.log(`✓ Conversation 1 stored: ${conversationId1}`);
    console.log(`  Query: "${TEST_QUERY_1.query}"`);
    console.log(`  Extractions: ${TEST_QUERY_1.extractions.length}`);
    console.log(`  Sources: ${TEST_QUERY_1.sources.length}`);

    // Store second conversation for consistency checking
    const conversationId2 = await conversationHistoryService.storeConversation({
      patient_id: PATIENT_ID,
      query: TEST_QUERY_2.query,
      query_intent: TEST_QUERY_2.query_intent,
      query_timestamp: new Date(),
      short_answer: TEST_QUERY_2.short_answer,
      detailed_summary: TEST_QUERY_2.detailed_summary,
      model_used: 'llama3',
      extractions: TEST_QUERY_2.extractions,
      sources: TEST_QUERY_2.sources,
      retrieval_candidates: TEST_QUERY_2.retrieval_candidates as any,
      enrichment_enabled: true,
      multi_hop_enabled: true,
      reasoning_enabled: true,
      execution_time_ms: 1100,
      retrieval_time_ms: 380,
      generation_time_ms: 550,
    });

    console.log(`\n✓ Conversation 2 stored: ${conversationId2}`);
    console.log(`  Query: "${TEST_QUERY_2.query}"`);
    console.log(`  Extractions: ${TEST_QUERY_2.extractions.length}`);
    console.log(`  Sources: ${TEST_QUERY_2.sources.length}`);

    // ========================================================================
    // STEP 2: Answer Grounding Verification
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('STEP 2: Answer Grounding Verification');
    console.log('='.repeat(80) + '\n');

    const groundingResult = await answerGroundingVerifier.verifyAnswer(
      conversationId1,
      TEST_QUERY_1.short_answer,
      TEST_QUERY_1.retrieval_candidates as any
    );

    console.log(`✓ Grounding verification complete`);
    console.log(`  Overall grounded: ${groundingResult.overall_grounded ? 'YES' : 'NO'}`);
    console.log(`  Grounding score: ${groundingResult.grounding_score.toFixed(2)}`);
    console.log(`  Total statements: ${groundingResult.statements.length}`);
    console.log(`  Unsupported statements: ${groundingResult.unsupported_statements.length}`);
    console.log(`  Warnings: ${groundingResult.warnings.length}`);

    if (groundingResult.statements.length > 0) {
      console.log('\nStatement Breakdown:');
      groundingResult.statements.forEach((stmt, idx) => {
        console.log(`  ${idx + 1}. "${stmt.statement}"`);
        console.log(`     Grounded: ${stmt.is_grounded ? 'YES' : 'NO'}`);
        console.log(`     Confidence: ${stmt.grounding_confidence.toFixed(2)}`);
        console.log(`     Method: ${stmt.verification_method}`);
      });
    }

    // ========================================================================
    // STEP 3: Cross-Query Consistency Checking
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('STEP 3: Cross-Query Consistency Checking');
    console.log('='.repeat(80) + '\n');

    const conversation1 = await conversationHistoryService.getConversation(conversationId1);
    if (!conversation1) {
      throw new Error('Conversation 1 not found');
    }

    const consistencyResult = await crossQueryConsistency.checkConsistency(
      conversation1,
      PATIENT_ID
    );

    console.log(`✓ Consistency checking complete`);
    console.log(`  Consistent: ${consistencyResult.is_consistent ? 'YES' : 'NO'}`);
    console.log(`  Consistency score: ${consistencyResult.consistency_score.toFixed(2)}`);
    console.log(`  Contradictions found: ${consistencyResult.contradictions.length}`);
    console.log(`  Warnings: ${consistencyResult.warnings.length}`);

    if (consistencyResult.contradictions.length > 0) {
      console.log('\nContradictions:');
      consistencyResult.contradictions.forEach((cont, idx) => {
        console.log(`  ${idx + 1}. Severity: ${cont.severity}`);
        console.log(`     Entity: ${cont.entity_value || 'N/A'}`);
        console.log(`     Current: "${cont.current_statement}"`);
        console.log(`     Previous: "${cont.previous_statement}"`);
        console.log(`     Explanation: ${cont.explanation}`);
      });
    }

    // ========================================================================
    // STEP 4: Confidence Calibration
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('STEP 4: Confidence Calibration');
    console.log('='.repeat(80) + '\n');

    const confidenceResult = await confidenceCalibration.aggregateConfidence(
      TEST_QUERY_1.extractions as any,
      TEST_QUERY_1.retrieval_candidates as any,
      consistencyResult.consistency_score
    );

    console.log(`✓ Confidence calibration complete`);
    console.log(`  Overall confidence: ${confidenceResult.overall_confidence.toFixed(2)}`);
    console.log(`  Uncertainty level: ${confidenceResult.uncertainty_level}`);
    console.log(`  Low confidence reasons: ${confidenceResult.low_confidence_reasons.length}`);
    console.log('\n  Confidence breakdown:');
    confidenceResult.confidence_breakdown.forEach((cb, idx) => {
      console.log(`    Extraction ${idx + 1}:`);
      console.log(`      Retrieval: ${cb.retrieval_confidence.toFixed(2)}`);
      console.log(`      Source: ${cb.source_confidence.toFixed(2)}`);
      console.log(`      Extraction: ${cb.extraction_confidence.toFixed(2)}`);
      console.log(`      Consistency: ${cb.consistency_confidence.toFixed(2)}`);
      console.log(`      Aggregate: ${cb.aggregate_confidence.toFixed(2)}`);
    });

    if (confidenceResult.low_confidence_reasons.length > 0) {
      console.log('\n  Low confidence reasons:');
      confidenceResult.low_confidence_reasons.forEach((reason) => {
        console.log(`    - ${reason}`);
      });
    }

    // Store confidence metrics
    await confidenceCalibration.storeConfidenceMetrics(conversationId1, confidenceResult);

    // ========================================================================
    // STEP 5: Hallucination Risk Assessment
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('STEP 5: Hallucination Risk Assessment');
    console.log('='.repeat(80) + '\n');

    const hallucinationRisk = await hallucinationDetector.assessHallucinationRisk(
      conversationId1,
      groundingResult.grounding_score,
      consistencyResult.consistency_score,
      confidenceResult.overall_confidence
    );

    console.log(`✓ Hallucination risk assessment complete`);
    console.log(`  Risk level: ${hallucinationRisk.risk_level}`);
    console.log(`  Risk score: ${hallucinationRisk.risk_score.toFixed(2)}`);
    console.log(`  Hallucination detected: ${hallucinationRisk.hallucination_detected ? 'YES' : 'NO'}`);
    console.log(`  Contributing factors: ${hallucinationRisk.contributing_factors.length}`);

    if (hallucinationRisk.contributing_factors.length > 0) {
      console.log('\n  Contributing factors:');
      hallucinationRisk.contributing_factors.forEach((factor) => {
        console.log(`    - ${factor}`);
      });
    }

    console.log(`\n  Recommendation: ${hallucinationRisk.recommendation}`);

    // ========================================================================
    // STEP 6: Quality Metrics Aggregation
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('STEP 6: Quality Metrics Aggregation');
    console.log('='.repeat(80) + '\n');

    // Update conversation with all quality metrics
    await conversationHistoryService.updateQualityMetrics(conversationId1, {
      grounding_score: groundingResult.grounding_score,
      consistency_score: consistencyResult.consistency_score,
      confidence_score: confidenceResult.overall_confidence,
      hallucination_risk: hallucinationRisk.risk_score,
    });

    const qualityMetrics = await qualityMetricsAggregator.aggregateMetrics(conversationId1);

    console.log(`✓ Quality metrics aggregation complete`);
    console.log(`  Overall quality score: ${qualityMetrics.overall_quality_score.toFixed(2)}`);
    console.log(`  Quality grade: ${qualityMetrics.quality_grade.toUpperCase()}`);
    console.log('\n  Detailed scores:');
    console.log(`    Grounding: ${typeof qualityMetrics.grounding_score === 'number' ? qualityMetrics.grounding_score.toFixed(2) : 'N/A'}`);
    console.log(`    Consistency: ${typeof qualityMetrics.consistency_score === 'number' ? qualityMetrics.consistency_score.toFixed(2) : 'N/A'}`);
    console.log(`    Confidence: ${typeof qualityMetrics.confidence_score === 'number' ? qualityMetrics.confidence_score.toFixed(2) : 'N/A'}`);
    console.log(`    Hallucination risk: ${typeof qualityMetrics.hallucination_risk === 'number' ? qualityMetrics.hallucination_risk.toFixed(2) : 'N/A'}`);

    // ========================================================================
    // STEP 7: Generate Quality Report
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('STEP 7: Generate Quality Report');
    console.log('='.repeat(80) + '\n');

    const qualityReport = await qualityMetricsAggregator.generateQualityReport(conversationId1);

    console.log(`✓ Quality report generated`);
    console.log(`  Passed quality checks: ${qualityReport.passed_quality_checks ? 'YES' : 'NO'}`);
    console.log(`  Warnings: ${qualityReport.warnings.length}`);
    console.log(`  Recommendations: ${qualityReport.recommendations.length}`);

    if (qualityReport.warnings.length > 0) {
      console.log('\n  Warnings:');
      qualityReport.warnings.forEach((warning) => {
        console.log(`    ⚠ ${warning}`);
      });
    }

    if (qualityReport.recommendations.length > 0) {
      console.log('\n  Recommendations:');
      qualityReport.recommendations.forEach((rec) => {
        console.log(`    💡 ${rec}`);
      });
    }

    // ========================================================================
    // STEP 8: Verify Database Storage
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('STEP 8: Verify Database Storage');
    console.log('='.repeat(80) + '\n');

    const conversations = await conversationHistoryService.getConversationsByPatient(PATIENT_ID, 10);
    console.log(`✓ Retrieved ${conversations.length} conversations for patient ${PATIENT_ID}`);

    const groundingResults = await answerGroundingVerifier.getGroundingResults(conversationId1);
    console.log(`✓ Retrieved ${groundingResults.length} grounding results`);

    const confidenceMetrics = await confidenceCalibration.getConfidenceMetrics(conversationId1);
    console.log(`✓ Retrieved ${confidenceMetrics.length} confidence metrics`);

    const hallucinationDetections = await hallucinationDetector.getHallucinationDetections(conversationId1);
    console.log(`✓ Retrieved ${hallucinationDetections.length} hallucination detections`);

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log('\n' + '='.repeat(80));
    console.log('TEST SUMMARY');
    console.log('='.repeat(80) + '\n');

    console.log('✅ Phase 9 Pipeline Test Complete!\n');
    console.log('All components tested successfully:');
    console.log('  ✓ Conversation History Storage');
    console.log('  ✓ Answer Grounding Verification');
    console.log('  ✓ Cross-Query Consistency Checking');
    console.log('  ✓ Confidence Calibration');
    console.log('  ✓ Hallucination Risk Assessment');
    console.log('  ✓ Quality Metrics Aggregation');
    console.log('  ✓ Quality Report Generation');
    console.log('  ✓ Database Storage Verification\n');

    console.log('Final Quality Assessment:');
    console.log(`  Overall Quality: ${qualityMetrics.quality_grade.toUpperCase()} (${(qualityMetrics.overall_quality_score * 100).toFixed(1)}%)`);
    console.log(`  Passed Checks: ${qualityReport.passed_quality_checks ? 'YES' : 'NO'}`);
    console.log(`  Ready for Production: ${qualityReport.passed_quality_checks && qualityMetrics.quality_grade !== 'unacceptable' ? 'YES' : 'NO'}`);

    console.log('\n' + '='.repeat(80));

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED\n');
    console.error('Error:', error instanceof Error ? error.message : String(error));
    if (error instanceof Error && error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    console.log('\n' + '='.repeat(80));
    process.exit(1);
  }
}

// Run the test
testPhase9Pipeline();
