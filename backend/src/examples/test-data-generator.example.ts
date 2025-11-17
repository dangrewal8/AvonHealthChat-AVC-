/**
 * Test Data Generator Example
 *
 * Demonstrates usage of the TestDataGenerator for creating synthetic medical records.
 *
 */

import { TestDataGenerator, createTestDataGenerator } from '../utils/test-data-generator';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Example 1: Generate basic test data
 */
function example1_BasicGeneration() {
  console.log('\n=== Example 1: Basic Generation ===\n');

  const generator = createTestDataGenerator({ seed: 12345 });
  const artifacts = generator.generateArtifacts(10, 'patient-123', false);

  console.log(`Generated ${artifacts.length} artifacts`);
  console.log('\nSample artifacts:');
  artifacts.slice(0, 3).forEach((artifact, i) => {
    console.log(`\n${i + 1}. ${artifact.type.toUpperCase()} - ${artifact.title || 'Untitled'}`);
    console.log(`   Author: ${artifact.author || 'N/A'}`);
    console.log(`   Date: ${artifact.occurred_at}`);
    console.log(`   Text preview: ${artifact.text.substring(0, 100)}...`);
  });
}

/**
 * Example 2: Generate specific artifact types
 */
function example2_SpecificTypes() {
  console.log('\n=== Example 2: Specific Artifact Types ===\n');

  const generator = createTestDataGenerator({ seed: 67890 });

  // Generate care plan
  const carePlan = generator.generateCarePlan('patient-456');
  console.log('Care Plan:');
  console.log(`  Title: ${carePlan.title}`);
  console.log(`  Author: ${carePlan.author}`);
  console.log(`  Condition: ${carePlan.meta?.condition}`);
  console.log(`  Medications: ${carePlan.meta?.medications?.join(', ')}`);

  // Generate medication
  const medication = generator.generateMedication('patient-456');
  console.log('\nMedication:');
  console.log(`  Title: ${medication.title}`);
  console.log(`  Name: ${medication.meta?.medication_name}`);
  console.log(`  Dosage: ${medication.meta?.dosage}`);
  console.log(`  Frequency: ${medication.meta?.frequency}`);

  // Generate note
  const note = generator.generateNote('patient-456');
  console.log('\nNote:');
  console.log(`  Title: ${note.title}`);
  console.log(`  Type: ${note.meta?.note_type}`);
  console.log(`  Condition: ${note.meta?.condition}`);
  console.log(`  Vitals: BP ${note.meta?.vitals?.bp}, HR ${note.meta?.vitals?.hr}`);
}

/**
 * Example 3: Generate with edge cases
 */
function example3_EdgeCases() {
  console.log('\n=== Example 3: Edge Cases ===\n');

  const generator = createTestDataGenerator({ seed: 11111 });
  const artifacts = generator.generateArtifacts(5, 'patient-789', true);

  console.log(`Generated ${artifacts.length} artifacts (including edge cases)`);

  // Find edge cases
  const edgeCases = artifacts.filter((a) => a.meta?.edge_case);
  console.log(`\nEdge cases found: ${edgeCases.length}`);
  edgeCases.forEach((artifact) => {
    console.log(`\n- ${artifact.meta?.edge_case}:`);
    console.log(`  Title: ${artifact.title || 'N/A'}`);
    console.log(`  Text length: ${artifact.text.length} chars`);
    console.log(`  Has metadata: ${!!artifact.meta}`);
  });
}

/**
 * Example 4: Reproducible generation with seed
 */
function example4_ReproducibleGeneration() {
  console.log('\n=== Example 4: Reproducible Generation ===\n');

  const seed = 99999;

  // First generation
  const generator1 = createTestDataGenerator({ seed });
  const artifacts1 = generator1.generateArtifacts(5, 'patient-001', false);

  // Second generation with same seed
  const generator2 = createTestDataGenerator({ seed });
  const artifacts2 = generator2.generateArtifacts(5, 'patient-001', false);

  console.log('Testing reproducibility with same seed...');
  console.log(`First generation: ${artifacts1.length} artifacts`);
  console.log(`Second generation: ${artifacts2.length} artifacts`);

  // Compare
  let identical = true;
  for (let i = 0; i < artifacts1.length; i++) {
    if (
      artifacts1[i].type !== artifacts2[i].type ||
      artifacts1[i].title !== artifacts2[i].title ||
      artifacts1[i].text !== artifacts2[i].text
    ) {
      identical = false;
      break;
    }
  }

  console.log(`Artifacts identical: ${identical ? 'YES ✓' : 'NO ✗'}`);

  if (identical) {
    console.log('\nFirst 3 titles from both generations:');
    for (let i = 0; i < 3; i++) {
      console.log(`  ${i + 1}. ${artifacts1[i].title}`);
    }
  }
}

/**
 * Example 5: Generate golden dataset
 */
function example5_GoldenDataset() {
  console.log('\n=== Example 5: Golden Dataset ===\n');

  const generator = createTestDataGenerator();
  const artifacts = generator.generateGoldenDataset('patient-test-001');

  console.log('Golden Dataset Generated:');
  console.log(`  Total artifacts: ${artifacts.length}`);

  const stats = generator.getStatistics(artifacts);
  console.log('\nStatistics:');
  console.log(`  By Type:`);
  console.log(`    - Care Plans: ${stats.by_type.care_plan}`);
  console.log(`    - Medications: ${stats.by_type.medication}`);
  console.log(`    - Notes: ${stats.by_type.note}`);
  console.log(`  Date Range:`);
  console.log(`    - Earliest: ${stats.date_range.earliest}`);
  console.log(`    - Latest: ${stats.date_range.latest}`);
  console.log(`  Authors: ${stats.authors} unique`);
  console.log(`  Average text length: ${stats.avg_text_length} chars`);
  console.log(`  With metadata: ${stats.with_metadata}/${stats.total}`);
}

/**
 * Example 6: Export to JSON
 */
function example6_ExportToJSON() {
  console.log('\n=== Example 6: Export to JSON ===\n');

  const generator = createTestDataGenerator({ seed: 54321 });
  const artifacts = generator.generateArtifacts(10, 'patient-export', true);

  // Export to JSON
  const json = generator.exportToJSON(artifacts, true);

  // Save to file
  const outputDir = path.join(__dirname, '../../test-data');
  const outputPath = path.join(outputDir, 'test-artifacts.json');

  // Create directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, json, 'utf-8');

  console.log(`Exported ${artifacts.length} artifacts to JSON`);
  console.log(`File: ${outputPath}`);
  console.log(`Size: ${(json.length / 1024).toFixed(2)} KB`);

  // Parse and verify
  const parsed = JSON.parse(json);
  console.log(`\nVerification:`);
  console.log(`  Generated at: ${parsed.generated_at}`);
  console.log(`  Count: ${parsed.count}`);
  console.log(`  Artifacts loaded: ${parsed.artifacts.length}`);
}

/**
 * Example 7: Large dataset generation
 */
function example7_LargeDataset() {
  console.log('\n=== Example 7: Large Dataset Generation ===\n');

  const generator = createTestDataGenerator({ seed: 99999 });

  console.log('Generating large dataset...');
  const startTime = Date.now();

  const artifacts = generator.generateArtifacts(1000, 'patient-large', false);

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`Generated ${artifacts.length} artifacts in ${duration}ms`);
  console.log(`Average: ${(duration / artifacts.length).toFixed(2)}ms per artifact`);

  const stats = generator.getStatistics(artifacts);
  console.log('\nLarge Dataset Statistics:');
  console.log(`  Total: ${stats.total}`);
  console.log(`  Care Plans: ${stats.by_type.care_plan}`);
  console.log(`  Medications: ${stats.by_type.medication}`);
  console.log(`  Notes: ${stats.by_type.note}`);
  console.log(`  Unique authors: ${stats.authors}`);
}

/**
 * Example 8: Multiple patients
 */
function example8_MultiplePatients() {
  console.log('\n=== Example 8: Multiple Patients ===\n');

  const generator = createTestDataGenerator({ seed: 77777 });

  const patients = [
    'patient-001',
    'patient-002',
    'patient-003',
  ];

  console.log(`Generating data for ${patients.length} patients...\n`);

  const allArtifacts: any[] = [];

  patients.forEach((patientId) => {
    const artifacts = generator.generateArtifacts(20, patientId, false);
    allArtifacts.push(...artifacts);

    const patientArtifacts = allArtifacts.filter((a) => a.patient_id === patientId);
    console.log(`${patientId}:`);
    console.log(`  Artifacts: ${patientArtifacts.length}`);
    console.log(`  Types: ${[...new Set(patientArtifacts.map((a) => a.type))].join(', ')}`);
  });

  console.log(`\nTotal artifacts across all patients: ${allArtifacts.length}`);
}

/**
 * Main function - Run all examples
 */
function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║          Test Data Generator - Usage Examples               ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  try {
    example1_BasicGeneration();
    example2_SpecificTypes();
    example3_EdgeCases();
    example4_ReproducibleGeneration();
    example5_GoldenDataset();
    example6_ExportToJSON();
    example7_LargeDataset();
    example8_MultiplePatients();

    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║                  All Examples Completed ✓                    ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

export {
  example1_BasicGeneration,
  example2_SpecificTypes,
  example3_EdgeCases,
  example4_ReproducibleGeneration,
  example5_GoldenDataset,
  example6_ExportToJSON,
  example7_LargeDataset,
  example8_MultiplePatients,
};
