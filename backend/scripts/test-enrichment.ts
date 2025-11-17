#!/usr/bin/env ts-node
/**
 * Test Enrichment Pipeline
 *
 * Tests the complete enrichment pipeline:
 * 1. Fetch enriched data from Avon Health API
 * 2. Extract clinical relationships
 * 3. Enrich artifacts with context
 * 4. Store enriched data to PostgreSQL
 * 5. Validate enrichment quality
 *
 * Usage:
 * POSTGRES_HOST=localhost POSTGRES_PORT=5432 POSTGRES_DB=avon_health_rag POSTGRES_USER=postgres POSTGRES_PASSWORD=postgres npx ts-node scripts/test-enrichment.ts
 */

import enrichmentOrchestratorService from '../src/services/enrichment-orchestrator.service';
import enrichmentStorageService from '../src/services/enrichment-storage.service';

const PATIENT_ID = 'patient-123'; // Test patient ID

async function testEnrichmentPipeline() {
  console.log('='.repeat(80));
  console.log('ENRICHMENT PIPELINE TEST');
  console.log('='.repeat(80));
  console.log(`\nPatient ID: ${PATIENT_ID}`);
  console.log(`Database: ${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || '5432'}/${process.env.POSTGRES_DB || 'avon_health_rag'}\n`);

  try {
    // Step 1: Run enrichment pipeline
    console.log('\n' + '='.repeat(80));
    console.log('STEP 1: Running Enrichment Pipeline');
    console.log('='.repeat(80) + '\n');

    const result = await enrichmentOrchestratorService.enrichPatient(PATIENT_ID, {
      clearExisting: true, // Clear existing data for clean test
      dryRun: false, // Actually store to database
    });

    console.log('\n✓ Enrichment pipeline completed!\n');
    console.log('Results:');
    console.log(`  - Success: ${result.success ? 'YES' : 'NO'}`);
    console.log(`  - Artifacts enriched: ${result.artifacts_enriched}`);
    console.log(`  - Relationships created: ${result.relationships_created}`);
    console.log(`  - Entities extracted: ${result.entities_extracted}`);
    console.log(`  - Errors: ${result.errors.length}`);
    console.log(`  - Duration: ${result.duration_ms}ms`);

    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach((err) => {
        console.log(`  - ${err.artifact_id}: ${err.error}`);
      });
    }

    // Step 2: Validate stored data
    console.log('\n' + '='.repeat(80));
    console.log('STEP 2: Validating Stored Data');
    console.log('='.repeat(80) + '\n');

    const stats = await enrichmentOrchestratorService.getPatientEnrichmentStats(PATIENT_ID);

    console.log('Enrichment Statistics:');
    console.log(`  - Total artifacts: ${stats.total_artifacts}`);
    console.log(`  - Total relationships: ${stats.total_relationships}`);
    console.log(`  - Average completeness: ${(stats.avg_completeness * 100).toFixed(1)}%`);
    console.log(`  - Average context depth: ${(stats.avg_context_depth * 100).toFixed(1)}%`);
    console.log('\nArtifacts by type:');
    Object.entries(stats.by_type).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });

    // Step 3: Sample enriched artifacts
    console.log('\n' + '='.repeat(80));
    console.log('STEP 3: Sample Enriched Artifacts');
    console.log('='.repeat(80) + '\n');

    const enrichedArtifacts = await enrichmentOrchestratorService.getEnrichedArtifacts(PATIENT_ID);

    // Show first medication
    const firstMedication = enrichedArtifacts.find((a) => a.artifact_type === 'medication');
    if (firstMedication) {
      console.log('Sample Medication (enriched):');
      console.log('-'.repeat(80));
      console.log(`Original: ${firstMedication.original_text}`);
      console.log(`\nEnriched: ${firstMedication.enriched_text}`);
      console.log(`\nCompleteness: ${(firstMedication.completeness_score * 100).toFixed(1)}%`);
      console.log(`Context Depth: ${(firstMedication.context_depth_score * 100).toFixed(1)}%`);
      console.log(`Related Artifacts: ${firstMedication.related_artifact_ids.length}`);
      console.log('-'.repeat(80));
    }

    // Show first condition
    const firstCondition = enrichedArtifacts.find((a) => a.artifact_type === 'condition');
    if (firstCondition) {
      console.log('\nSample Condition (enriched):');
      console.log('-'.repeat(80));
      console.log(`Original: ${firstCondition.original_text}`);
      console.log(`\nEnriched: ${firstCondition.enriched_text}`);
      console.log(`\nCompleteness: ${(firstCondition.completeness_score * 100).toFixed(1)}%`);
      console.log(`Context Depth: ${(firstCondition.context_depth_score * 100).toFixed(1)}%`);
      console.log(`Related Artifacts: ${firstCondition.related_artifact_ids.length}`);
      console.log('-'.repeat(80));
    }

    // Step 4: Sample relationships
    console.log('\n' + '='.repeat(80));
    console.log('STEP 4: Sample Clinical Relationships');
    console.log('='.repeat(80) + '\n');

    const relationships = await enrichmentOrchestratorService.getRelationships(PATIENT_ID);

    // Group by type
    const byType: Record<string, number> = {};
    relationships.forEach((r) => {
      byType[r.relationship_type] = (byType[r.relationship_type] || 0) + 1;
    });

    console.log('Relationships by type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  - ${type}: ${count}`);
    });

    // Show first few relationships
    console.log('\nSample Relationships:');
    relationships.slice(0, 5).forEach((rel, i) => {
      console.log(`\n${i + 1}. ${rel.relationship_type} (confidence: ${(rel.confidence_score * 100).toFixed(0)}%)`);
      console.log(`   Source: ${rel.source_entity_text}`);
      console.log(`   Target: ${rel.target_entity_text}`);
      console.log(`   Method: ${rel.extraction_method}`);
    });

    // Step 5: Quality Assessment
    console.log('\n' + '='.repeat(80));
    console.log('STEP 5: Quality Assessment');
    console.log('='.repeat(80) + '\n');

    // Calculate quality metrics
    const highCompleteness = enrichedArtifacts.filter((a) => a.completeness_score >= 0.7).length;
    const highContext = enrichedArtifacts.filter((a) => a.context_depth_score >= 0.7).length;
    const hasRelationships = enrichedArtifacts.filter((a) => a.related_artifact_ids.length > 0).length;

    const completenessPercent = (highCompleteness / enrichedArtifacts.length) * 100;
    const contextPercent = (highContext / enrichedArtifacts.length) * 100;
    const relationshipPercent = (hasRelationships / enrichedArtifacts.length) * 100;

    console.log('Quality Metrics:');
    console.log(`  - High completeness (≥70%): ${highCompleteness}/${enrichedArtifacts.length} (${completenessPercent.toFixed(1)}%)`);
    console.log(`  - High context depth (≥70%): ${highContext}/${enrichedArtifacts.length} (${contextPercent.toFixed(1)}%)`);
    console.log(`  - Has relationships: ${hasRelationships}/${enrichedArtifacts.length} (${relationshipPercent.toFixed(1)}%)`);

    // Success criteria
    console.log('\n' + '='.repeat(80));
    console.log('FINAL ASSESSMENT');
    console.log('='.repeat(80) + '\n');

    const passedTests: string[] = [];
    const failedTests: string[] = [];

    if (result.success) {
      passedTests.push('✓ Enrichment pipeline completed without errors');
    } else {
      failedTests.push('✗ Enrichment pipeline had errors');
    }

    if (stats.total_artifacts > 0) {
      passedTests.push('✓ Enriched artifacts stored to database');
    } else {
      failedTests.push('✗ No enriched artifacts stored');
    }

    if (stats.total_relationships > 0) {
      passedTests.push('✓ Clinical relationships extracted and stored');
    } else {
      failedTests.push('✗ No clinical relationships extracted');
    }

    if (stats.avg_completeness >= 0.5) {
      passedTests.push(`✓ Average completeness ≥50% (${(stats.avg_completeness * 100).toFixed(1)}%)`);
    } else {
      failedTests.push(`✗ Average completeness <50% (${(stats.avg_completeness * 100).toFixed(1)}%)`);
    }

    if (relationshipPercent >= 50) {
      passedTests.push(`✓ At least 50% of artifacts have relationships (${relationshipPercent.toFixed(1)}%)`);
    } else {
      failedTests.push(`✗ Less than 50% of artifacts have relationships (${relationshipPercent.toFixed(1)}%)`);
    }

    // Print results
    if (passedTests.length > 0) {
      console.log('Passed Tests:');
      passedTests.forEach((test) => console.log(`  ${test}`));
    }

    if (failedTests.length > 0) {
      console.log('\nFailed Tests:');
      failedTests.forEach((test) => console.log(`  ${test}`));
    }

    const overallSuccess = failedTests.length === 0;
    console.log('\n' + '='.repeat(80));
    if (overallSuccess) {
      console.log('✓ ALL TESTS PASSED!');
    } else {
      console.log(`⚠ ${failedTests.length} TEST(S) FAILED`);
    }
    console.log('='.repeat(80) + '\n');

    // Close database connection
    await enrichmentStorageService.close();

    process.exit(overallSuccess ? 0 : 1);
  } catch (error) {
    console.error('\n✗ Test failed with error:', error);

    await enrichmentStorageService.close();
    process.exit(1);
  }
}

// Run test
testEnrichmentPipeline();
