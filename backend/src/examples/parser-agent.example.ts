/**
 * Parser Agent Example
 *
 * Demonstrates parser agent orchestration functionality
 *
 * Run with: npx ts-node src/examples/parser-agent.example.ts
 */

import parserAgent from '../services/parser-agent.service';
import { Artifact } from '../types/artifact.types';
import { ParsedChunk, ParserResult } from '../types/parsed-chunk.types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create example artifacts
 */
function createExampleArtifacts(): Artifact[] {
  return [
    {
      id: uuidv4(),
      type: 'care_plan',
      patient_id: 'patient-123',
      author: 'Dr. Smith',
      occurred_at: '2024-10-15T10:00:00Z',
      title: 'Diabetes Management Plan',
      text: `Patient diagnosed with Type 2 Diabetes Mellitus (T2DM). Current management includes:

Medications:
- Metformin 500mg PO BID with meals
- Glipizide 5mg PO QD before breakfast
- Lisinopril 10mg PO QD for HTN

Diet: Low carbohydrate diet, monitor blood glucose levels QID
Exercise: 30 minutes daily walking
Follow-up: Check HbA1c in 3 months, monitor kidney function

Patient reports occasional dizziness and fatigue. Blood pressure stable at 130/80.`,
      source: 'https://avon-health.com/care-plans/cp-001',
    },
    {
      id: uuidv4(),
      type: 'medication',
      patient_id: 'patient-123',
      author: 'Dr. Johnson',
      occurred_at: '2024-10-20T14:30:00Z',
      title: 'Pain Management',
      text: `New prescription for chronic back pain:

Gabapentin 300mg PO TID
Ibuprofen 600mg PO PRN for breakthrough pain (max 2400mg/day)
Physical therapy referral issued

Patient has history of CAD, currently on aspirin 81mg QD and atorvastatin 40mg at bedtime.`,
      source: 'https://avon-health.com/medications/med-002',
    },
    {
      id: uuidv4(),
      type: 'note',
      patient_id: 'patient-123',
      author: 'Nurse Williams',
      occurred_at: '2024-10-22T09:15:00Z',
      title: 'Follow-up Visit',
      text: `Patient presents for follow-up. Reports improved blood glucose control. No episodes of chest pain or shortness of breath.

Vital signs: BP 128/78, HR 72, Temp 98.6°F

Current medications reviewed and confirmed. Patient compliant with diabetes management plan. Continue current regimen.

Labs ordered: CBC, CMP, HbA1c`,
      source: 'https://avon-health.com/notes/note-003',
    },
    {
      id: uuidv4(),
      type: 'note',
      patient_id: 'patient-456',
      author: 'Dr. Martinez',
      occurred_at: '2024-10-25T11:00:00Z',
      title: 'COPD Exacerbation',
      text: `Patient admitted with COPD exacerbation and pneumonia. Presenting symptoms: severe shortness of breath, productive cough, fever (102.5°F), and wheezing.

Treatment initiated:
- Albuterol nebulizer q4h
- Ipratropium 0.5mg nebulizer q6h
- Prednisone 40mg PO QD x 5 days
- Levofloxacin 750mg IV q24h x 7 days
- Oxygen via nasal cannula 2L to maintain SpO2 >90%

History: CHF, HTN, previous MI 2 years ago. Home medications include furosemide 40mg BID and metoprolol 50mg BID.

Patient showing improvement after 24 hours. Plan to transition to oral antibiotics if fever resolves.`,
      source: 'https://avon-health.com/notes/note-004',
    },
  ];
}

/**
 * Create invalid artifacts for testing error handling
 */
function createInvalidArtifacts(): Artifact[] {
  return [
    // Missing patient_id
    {
      id: uuidv4(),
      type: 'note',
      patient_id: '',
      occurred_at: '2024-10-25T11:00:00Z',
      text: 'This artifact has no patient_id',
      source: 'https://example.com/invalid-1',
    },
    // Missing text
    {
      id: uuidv4(),
      type: 'note',
      patient_id: 'patient-999',
      occurred_at: '2024-10-25T11:00:00Z',
      text: '',
      source: 'https://example.com/invalid-2',
    },
    // Invalid date
    {
      id: uuidv4(),
      type: 'note',
      patient_id: 'patient-999',
      occurred_at: 'not-a-date',
      text: 'This artifact has invalid date',
      source: 'https://example.com/invalid-3',
    },
  ];
}

/**
 * Display parsing results
 */
function displayResults(result: ParserResult) {
  console.log('\n' + '='.repeat(80));
  console.log('Parsing Results');
  console.log('='.repeat(80));

  console.log(`\nArtifacts Processed: ${result.artifacts_processed}`);
  console.log(`Total Chunks Created: ${result.total_chunks}`);
  console.log(`Total Entities Extracted: ${result.total_entities}`);
  console.log(`Processing Time: ${result.processing_time_ms}ms`);
  console.log(`Errors: ${result.errors.length}`);

  if (result.errors.length > 0) {
    console.log('\nErrors:');
    for (const error of result.errors) {
      console.log(`  - ${error.artifact_id}: ${error.message}`);
    }
  }

  // Show entity breakdown
  const entitiesByType = {
    medication: 0,
    condition: 0,
    symptom: 0,
    procedure: 0,
    dosage: 0,
  };

  for (const chunk of result.chunks) {
    for (const entity of chunk.entities) {
      entitiesByType[entity.type]++;
    }
  }

  console.log('\nEntities by Type:');
  console.log(`  Medications: ${entitiesByType.medication}`);
  console.log(`  Dosages: ${entitiesByType.dosage}`);
  console.log(`  Conditions: ${entitiesByType.condition}`);
  console.log(`  Symptoms: ${entitiesByType.symptom}`);
  console.log(`  Procedures: ${entitiesByType.procedure}`);
}

/**
 * Display chunk details
 */
function displayChunkDetails(chunk: ParsedChunk, index: number) {
  console.log(`\n${'─'.repeat(80)}`);
  console.log(`Chunk ${index + 1}`);
  console.log(`${'─'.repeat(80)}`);
  console.log(`Chunk ID: ${chunk.chunk_id}`);
  console.log(`Artifact ID: ${chunk.artifact_id}`);
  console.log(`Artifact Type: ${chunk.artifact_type}`);
  console.log(`Occurred: ${chunk.occurred_at}`);
  console.log(`Char Offsets: [${chunk.char_offsets[0]}, ${chunk.char_offsets[1]}]`);
  console.log(`\nText Preview: ${chunk.chunk_text.substring(0, 150)}...`);
  console.log(`\nEntities (${chunk.entities.length}):`);

  if (chunk.entities.length === 0) {
    console.log('  No entities found');
  } else {
    for (const entity of chunk.entities) {
      console.log(
        `  - [${entity.type}] "${entity.text}" → "${entity.normalized}"`
      );
    }
  }
}

/**
 * Test basic parsing
 */
function testBasicParsing() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 1: Basic Parsing');
  console.log('='.repeat(80));

  const artifacts = createExampleArtifacts().slice(0, 1); // Just first artifact
  const result = parserAgent.parseWithResult(artifacts);

  displayResults(result);

  console.log(`\n${'═'.repeat(80)}`);
  console.log('Chunk Details');
  console.log(`${'═'.repeat(80)}`);

  for (let i = 0; i < result.chunks.length; i++) {
    displayChunkDetails(result.chunks[i], i);
  }
}

/**
 * Test batch parsing
 */
function testBatchParsing() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 2: Batch Parsing');
  console.log('='.repeat(80));

  const artifacts = createExampleArtifacts();
  const result = parserAgent.parseWithResult(artifacts);

  displayResults(result);

  // Show statistics
  const stats = parserAgent.getStatistics(artifacts, result);

  console.log('\nStatistics:');
  console.log(`  Total Artifacts: ${stats.total_artifacts}`);
  console.log(`  Successful: ${stats.successful}`);
  console.log(`  Failed: ${stats.failed}`);
  console.log(`  Avg Chunks per Artifact: ${stats.avg_chunks_per_artifact.toFixed(2)}`);
  console.log(`  Avg Entities per Chunk: ${stats.avg_entities_per_chunk.toFixed(2)}`);
}

/**
 * Test error handling
 */
function testErrorHandling() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 3: Error Handling');
  console.log('='.repeat(80));

  const validArtifacts = createExampleArtifacts().slice(0, 1);
  const invalidArtifacts = createInvalidArtifacts();
  const mixedArtifacts = [...validArtifacts, ...invalidArtifacts];

  console.log(`\nProcessing ${mixedArtifacts.length} artifacts (${validArtifacts.length} valid, ${invalidArtifacts.length} invalid)`);

  const result = parserAgent.parseWithResult(mixedArtifacts);

  displayResults(result);

  console.log('\nError Details:');
  for (const error of result.errors) {
    console.log(`\n  Artifact: ${error.artifact_id}`);
    console.log(`  Error Type: ${error.error}`);
    console.log(`  Message: ${error.message}`);
    console.log(`  Timestamp: ${error.timestamp}`);
  }
}

/**
 * Test entity filtering
 */
function testEntityFiltering() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 4: Entity Filtering');
  console.log('='.repeat(80));

  const artifacts = createExampleArtifacts();
  const chunks = parserAgent.parse(artifacts);

  console.log(`\nTotal chunks: ${chunks.length}`);

  // Filter by medication
  const medicationChunks = parserAgent.filterByEntityType(chunks, 'medication');
  console.log(`\nChunks with medications: ${medicationChunks.length}`);
  console.log('Medications found:');
  const medications = new Set<string>();
  for (const chunk of medicationChunks) {
    for (const entity of chunk.entities.filter((e) => e.type === 'medication')) {
      medications.add(entity.normalized);
    }
  }
  for (const med of medications) {
    console.log(`  - ${med}`);
  }

  // Filter by condition
  const conditionChunks = parserAgent.filterByEntityType(chunks, 'condition');
  console.log(`\nChunks with conditions: ${conditionChunks.length}`);
  console.log('Conditions found:');
  const conditions = new Set<string>();
  for (const chunk of conditionChunks) {
    for (const entity of chunk.entities.filter((e) => e.type === 'condition')) {
      conditions.add(entity.normalized);
    }
  }
  for (const cond of conditions) {
    console.log(`  - ${cond}`);
  }

  // Find specific entity
  console.log(`\n${'─'.repeat(80)}`);
  console.log('Finding chunks with "metformin"');
  console.log(`${'─'.repeat(80)}`);

  const metforminChunks = parserAgent.findChunksWithEntity(chunks, 'metformin');
  console.log(`\nFound ${metforminChunks.length} chunks containing metformin`);

  for (let i = 0; i < metforminChunks.length; i++) {
    const chunk = metforminChunks[i];
    console.log(`\nChunk ${i + 1}:`);
    console.log(`  Artifact Type: ${chunk.artifact_type}`);
    console.log(`  Occurred: ${chunk.occurred_at}`);
    console.log(`  Text: ${chunk.chunk_text.substring(0, 100)}...`);
  }
}

/**
 * Test unique entities extraction
 */
function testUniqueEntities() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 5: Unique Entities Extraction');
  console.log('='.repeat(80));

  const artifacts = createExampleArtifacts();
  const chunks = parserAgent.parse(artifacts);

  const uniqueEntities = parserAgent.getUniqueEntities(chunks);

  console.log(`\nTotal unique entities: ${uniqueEntities.length}`);

  // Group by type
  const byType: { [key: string]: string[] } = {};

  for (const entity of uniqueEntities) {
    if (!byType[entity.type]) {
      byType[entity.type] = [];
    }
    byType[entity.type].push(entity.normalized);
  }

  // Display by type
  for (const type of ['medication', 'dosage', 'condition', 'symptom', 'procedure']) {
    if (byType[type] && byType[type].length > 0) {
      console.log(`\n${type.toUpperCase()}S (${byType[type].length}):`);
      for (const name of byType[type].sort()) {
        console.log(`  - ${name}`);
      }
    }
  }
}

/**
 * Test batch processing with large dataset
 */
function testBatchProcessing() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 6: Batch Processing');
  console.log('='.repeat(80));

  // Create larger dataset by duplicating artifacts
  const baseArtifacts = createExampleArtifacts();
  const largeDataset: Artifact[] = [];

  for (let i = 0; i < 25; i++) {
    for (const artifact of baseArtifacts) {
      largeDataset.push({
        ...artifact,
        id: uuidv4(),
        patient_id: `patient-${i}`,
      });
    }
  }

  console.log(`\nProcessing ${largeDataset.length} artifacts in batches`);

  const startTime = Date.now();
  const chunks = parserAgent.parseInBatches(largeDataset, 10);
  const processingTime = Date.now() - startTime;

  console.log(`\n${'─'.repeat(80)}`);
  console.log('Results:');
  console.log(`  Total chunks: ${chunks.length}`);
  console.log(`  Processing time: ${processingTime}ms`);
  console.log(`  Avg time per artifact: ${(processingTime / largeDataset.length).toFixed(2)}ms`);
}

/**
 * Main execution
 */
async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                   Parser Agent Example Demonstration                       ║');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');

  // Run tests
  testBasicParsing();
  testBatchParsing();
  testErrorHandling();
  testEntityFiltering();
  testUniqueEntities();
  testBatchProcessing();

  // Display explanation
  console.log('\n' + '='.repeat(80));
  console.log('Parser Agent Explanation');
  console.log('='.repeat(80));
  console.log('\n' + parserAgent.explain());

  console.log('\n' + '='.repeat(80));
  console.log('All examples completed successfully!');
  console.log('='.repeat(80));
  console.log('\n');
}

// Run examples
if (require.main === module) {
  main().catch((error) => {
    console.error('Error running examples:', error);
    process.exit(1);
  });
}

export { main };
