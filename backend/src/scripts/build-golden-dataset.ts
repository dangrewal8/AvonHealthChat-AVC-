/**
 * Build Golden Dataset Script
 *
 * Generates and saves the golden dataset to JSON files.
 *
 * Usage:
 *   npx ts-node src/scripts/build-golden-dataset.ts
 *
 */

import * as path from 'path';
import { createGoldenDatasetBuilder } from '../utils/golden-dataset-builder';
import { generateSampleDataset } from '../utils/golden-dataset-generator';

async function buildGoldenDataset() {
  console.log('Building Golden Dataset...\n');

  // Create builder
  const builder = createGoldenDatasetBuilder('1.0.0');

  // Set metadata
  builder.setMetadata({
    description: 'Golden dataset for RAG pipeline evaluation',
    author: 'Avon Health Team',
    purpose: 'Testing and validation of query processing, retrieval, and extraction',
  });

  // Generate sample entries
  console.log('Generating sample entries...');
  const entries = generateSampleDataset();
  console.log(`Generated ${entries.length} entries`);

  // Add entries to builder
  console.log('\nAdding entries to builder...');
  builder.addEntries(entries);

  // Validate dataset
  console.log('\nValidating dataset...');
  const validation = builder.validate();

  if (!validation.valid) {
    console.error('❌ Validation failed:');
    validation.errors.forEach((error) => {
      console.error(`  - ${error}`);
    });
    process.exit(1);
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️  Warnings:');
    validation.warnings.forEach((warning) => {
      console.warn(`  - ${warning}`);
    });
  }

  console.log('✅ Validation passed');

  // Display statistics
  console.log('\nDataset Statistics:');
  const stats = builder.getStatistics();
  console.log(`  Total Entries: ${stats.total_entries}`);
  console.log(`  Category Distribution:`);
  Object.entries(stats.category_distribution).forEach(([category, count]) => {
    console.log(`    - ${category}: ${count}`);
  });
  console.log(`  Avg Relevant Artifacts: ${stats.avg_relevant_artifacts}`);
  console.log(`  Avg Expected Extractions: ${stats.avg_expected_extractions}`);
  console.log(`  Avg Confidence Min: ${stats.avg_confidence_min}`);
  console.log(`  Verified Entries: ${stats.verified_entries}`);

  // Save to file
  const outputPath = path.join(__dirname, '../../data/golden_dataset.json');
  console.log(`\nSaving to ${outputPath}...`);
  await builder.save(outputPath);
  console.log('✅ Dataset saved successfully');

  // Also save a compact version
  const dataset = builder.build();
  const compactPath = path.join(__dirname, '../../data/golden_dataset_compact.json');
  const fs = require('fs/promises');
  await fs.mkdir(path.dirname(compactPath), { recursive: true });
  await fs.writeFile(compactPath, JSON.stringify(dataset), 'utf-8');
  console.log(`✅ Compact version saved to ${compactPath}`);

  console.log('\n✨ Golden dataset build complete!');
}

// Run the script
if (require.main === module) {
  buildGoldenDataset().catch((error) => {
    console.error('Error building golden dataset:', error);
    process.exit(1);
  });
}

export { buildGoldenDataset };
