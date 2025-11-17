/**
 * Chunk Store Example
 *
 * Demonstrates chunk storage and retrieval functionality
 *
 * Run with: npx ts-node src/examples/chunk-store.example.ts
 */

import chunkStore from '../services/chunk-store.service';
import parserAgent from '../services/parser-agent.service';
import { Artifact } from '../types/artifact.types';
import { ParsedChunk, ChunkFilter } from '../types/parsed-chunk.types';

/**
 * Create example artifacts for testing
 */
function createTestArtifacts(): Artifact[] {
  return [
    {
      id: 'artifact-001',
      type: 'care_plan',
      patient_id: 'patient-alice',
      author: 'Dr. Smith',
      occurred_at: '2024-10-15T10:00:00Z',
      title: 'Diabetes Management',
      text: `Patient diagnosed with T2DM. Medications: Metformin 500mg BID, Lisinopril 10mg QD for HTN. Blood glucose monitoring QID. Follow-up in 3 months.`,
      source: 'https://avon-health.com/care-plans/cp-001',
    },
    {
      id: 'artifact-002',
      type: 'medication',
      patient_id: 'patient-alice',
      author: 'Dr. Johnson',
      occurred_at: '2024-10-20T14:30:00Z',
      title: 'Pain Management',
      text: `New prescription for chronic back pain: Gabapentin 300mg TID, Ibuprofen 600mg PRN. Patient has CAD, continues aspirin 81mg QD.`,
      source: 'https://avon-health.com/medications/med-002',
    },
    {
      id: 'artifact-003',
      type: 'note',
      patient_id: 'patient-bob',
      author: 'Nurse Williams',
      occurred_at: '2024-10-22T09:15:00Z',
      title: 'Follow-up Visit',
      text: `Patient presents for follow-up. Reports improved glucose control. No chest pain or shortness of breath. BP 128/78. Labs ordered: CBC, CMP.`,
      source: 'https://avon-health.com/notes/note-003',
    },
    {
      id: 'artifact-004',
      type: 'note',
      patient_id: 'patient-bob',
      author: 'Dr. Martinez',
      occurred_at: '2024-09-25T11:00:00Z',
      title: 'COPD Exacerbation',
      text: `Patient admitted with COPD exacerbation. Severe shortness of breath, wheezing, fever. Treatment: Albuterol nebulizer q4h, Prednisone 40mg QD, Levofloxacin 750mg IV.`,
      source: 'https://avon-health.com/notes/note-004',
    },
    {
      id: 'artifact-005',
      type: 'care_plan',
      patient_id: 'patient-charlie',
      author: 'Dr. Lee',
      occurred_at: '2024-10-01T08:00:00Z',
      title: 'Hypertension Management',
      text: `Patient with HTN. Started on Metoprolol 50mg BID. DASH diet recommended. Monitor BP twice daily. Target <130/80.`,
      source: 'https://avon-health.com/care-plans/cp-005',
    },
  ];
}

/**
 * Display storage statistics
 */
async function displayStatistics() {
  const stats = await chunkStore.getStatistics();

  console.log('\n' + '='.repeat(80));
  console.log('Storage Statistics');
  console.log('='.repeat(80));
  console.log(`Total Chunks: ${stats.total_chunks}`);
  console.log(`Total Patients: ${stats.total_patients}`);
  console.log(`Total Artifacts: ${stats.total_artifacts}`);
  console.log('\nChunks by Type:');
  console.log(`  Care Plans: ${stats.chunks_by_type.care_plan}`);
  console.log(`  Medications: ${stats.chunks_by_type.medication}`);
  console.log(`  Notes: ${stats.chunks_by_type.note}`);
  console.log('\nDate Range:');
  console.log(`  Oldest: ${stats.oldest_chunk_date || 'N/A'}`);
  console.log(`  Newest: ${stats.newest_chunk_date || 'N/A'}`);
  console.log(`\nMemory Usage: ${Math.round((stats.memory_usage_bytes || 0) / 1024)} KB`);
}

/**
 * Display query results
 */
function displayQueryResults(title: string, chunks: ParsedChunk[]) {
  console.log(`\n${title}`);
  console.log('─'.repeat(80));
  console.log(`Found ${chunks.length} chunks\n`);

  for (let i = 0; i < Math.min(chunks.length, 3); i++) {
    const chunk = chunks[i];
    console.log(`Chunk ${i + 1}:`);
    console.log(`  ID: ${chunk.chunk_id}`);
    console.log(`  Patient: ${chunk.patient_id}`);
    console.log(`  Artifact: ${chunk.artifact_type}`);
    console.log(`  Date: ${chunk.occurred_at}`);
    console.log(`  Entities: ${chunk.entities.length}`);
    console.log(`  Text: ${chunk.chunk_text.substring(0, 80)}...`);
    console.log();
  }

  if (chunks.length > 3) {
    console.log(`... and ${chunks.length - 3} more chunks`);
  }
}

/**
 * Test 1: Basic storage and retrieval
 */
async function testBasicStorageRetrieval() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 1: Basic Storage and Retrieval');
  console.log('='.repeat(80));

  // Clear any existing data
  await chunkStore.clear();

  // Parse artifacts
  const artifacts = createTestArtifacts();
  console.log(`\nParsing ${artifacts.length} artifacts...`);
  const chunks = parserAgent.parse(artifacts);
  console.log(`Created ${chunks.length} chunks`);

  // Store chunks
  console.log('\nStoring chunks...');
  const result = await chunkStore.store(chunks);

  console.log('\nStore Result:');
  console.log(`  Success: ${result.success}`);
  console.log(`  Stored: ${result.stored_count}`);
  console.log(`  Skipped: ${result.skipped_count}`);
  console.log(`  Errors: ${result.errors.length}`);
  console.log(`  Processing Time: ${result.processing_time_ms}ms`);

  // Retrieve single chunk
  if (chunks.length > 0) {
    const testChunkId = chunks[0].chunk_id;
    console.log(`\nRetrieving chunk: ${testChunkId}`);
    const retrieved = await chunkStore.retrieve(testChunkId);

    if (retrieved) {
      console.log('✓ Chunk retrieved successfully');
      console.log(`  Patient: ${retrieved.patient_id}`);
      console.log(`  Artifact Type: ${retrieved.artifact_type}`);
      console.log(`  Text Length: ${retrieved.chunk_text.length} chars`);
      console.log(`  Entities: ${retrieved.entities.length}`);
    } else {
      console.log('✗ Chunk not found');
    }
  }

  await displayStatistics();
}

/**
 * Test 2: Query by patient
 */
async function testQueryByPatient() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 2: Query by Patient');
  console.log('='.repeat(80));

  const patientId = 'patient-alice';
  console.log(`\nQuerying chunks for patient: ${patientId}`);

  const chunks = await chunkStore.query({ patient_id: patientId });
  displayQueryResults(`Chunks for ${patientId}`, chunks);

  // Also test getByPatient shorthand
  const chunks2 = await chunkStore.getByPatient('patient-bob');
  displayQueryResults('Chunks for patient-bob', chunks2);
}

/**
 * Test 3: Query by artifact type
 */
async function testQueryByType() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 3: Query by Artifact Type');
  console.log('='.repeat(80));

  // Care plans
  const carePlans = await chunkStore.query({ artifact_type: 'care_plan' });
  displayQueryResults('Care Plan Chunks', carePlans);

  // Medications
  const medications = await chunkStore.query({ artifact_type: 'medication' });
  displayQueryResults('Medication Chunks', medications);

  // Notes
  const notes = await chunkStore.query({ artifact_type: 'note' });
  displayQueryResults('Note Chunks', notes);
}

/**
 * Test 4: Query by date range
 */
async function testQueryByDateRange() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 4: Query by Date Range');
  console.log('='.repeat(80));

  // October 2024
  const octoberChunks = await chunkStore.query({
    date_from: '2024-10-01T00:00:00Z',
    date_to: '2024-10-31T23:59:59Z',
  });
  displayQueryResults('Chunks from October 2024', octoberChunks);

  // September 2024
  const septemberChunks = await chunkStore.query({
    date_from: '2024-09-01T00:00:00Z',
    date_to: '2024-09-30T23:59:59Z',
  });
  displayQueryResults('Chunks from September 2024', septemberChunks);

  // After Oct 15
  const recentChunks = await chunkStore.query({
    date_from: '2024-10-15T00:00:00Z',
  });
  displayQueryResults('Chunks after Oct 15, 2024', recentChunks);
}

/**
 * Test 5: Query by entity
 */
async function testQueryByEntity() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 5: Query by Entity');
  console.log('='.repeat(80));

  // Filter by entity type
  const medicationChunks = await chunkStore.query({ entity_type: 'medication' });
  displayQueryResults('Chunks with Medications', medicationChunks);

  console.log('\nUnique medications found:');
  const meds = new Set<string>();
  for (const chunk of medicationChunks) {
    for (const entity of chunk.entities.filter((e) => e.type === 'medication')) {
      meds.add(entity.normalized);
    }
  }
  for (const med of Array.from(meds).sort()) {
    console.log(`  - ${med}`);
  }

  // Filter by entity text
  const metforminChunks = await chunkStore.query({ entity_text: 'metformin' });
  displayQueryResults('Chunks mentioning "metformin"', metforminChunks);

  const htnChunks = await chunkStore.query({ entity_text: 'HTN' });
  displayQueryResults('Chunks mentioning "HTN"', htnChunks);
}

/**
 * Test 6: Complex queries with multiple filters
 */
async function testComplexQueries() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 6: Complex Queries');
  console.log('='.repeat(80));

  // Patient + artifact type
  const filter1: ChunkFilter = {
    patient_id: 'patient-alice',
    artifact_type: 'medication',
  };
  const results1 = await chunkStore.query(filter1);
  displayQueryResults(
    'patient-alice + medication type',
    results1
  );

  // Patient + date range
  const filter2: ChunkFilter = {
    patient_id: 'patient-bob',
    date_from: '2024-10-01T00:00:00Z',
  };
  const results2 = await chunkStore.query(filter2);
  displayQueryResults(
    'patient-bob + October onwards',
    results2
  );

  // Entity type + date range
  const filter3: ChunkFilter = {
    entity_type: 'condition',
    date_from: '2024-10-01T00:00:00Z',
  };
  const results3 = await chunkStore.query(filter3);
  displayQueryResults(
    'Conditions mentioned in October',
    results3
  );
}

/**
 * Test 7: Pagination
 */
async function testPagination() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 7: Pagination');
  console.log('='.repeat(80));

  // Get all chunks with pagination
  const pageSize = 2;
  let offset = 0;
  let pageNum = 1;

  console.log(`\nFetching chunks with page size: ${pageSize}\n`);

  while (true) {
    const chunks = await chunkStore.query({ limit: pageSize, offset });

    if (chunks.length === 0) {
      break;
    }

    console.log(`Page ${pageNum}:`);
    for (const chunk of chunks) {
      console.log(`  - ${chunk.chunk_id.substring(0, 8)}... (${chunk.artifact_type}, ${chunk.patient_id})`);
    }
    console.log();

    offset += pageSize;
    pageNum++;

    // Safety limit
    if (pageNum > 10) {
      break;
    }
  }
}

/**
 * Test 8: Deletion operations
 */
async function testDeletion() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 8: Deletion Operations');
  console.log('='.repeat(80));

  // Get initial count
  const initialCount = chunkStore.count();
  console.log(`\nInitial chunk count: ${initialCount}`);

  // Delete single chunk
  const chunks = await chunkStore.query({ limit: 1 });
  if (chunks.length > 0) {
    const chunkId = chunks[0].chunk_id;
    console.log(`\nDeleting chunk: ${chunkId}`);
    const deleted = await chunkStore.delete(chunkId);
    console.log(`  Result: ${deleted ? '✓ Deleted' : '✗ Not found'}`);
    console.log(`  New count: ${chunkStore.count()}`);
  }

  // Delete by artifact
  const artifactChunks = await chunkStore.query({ artifact_id: 'artifact-002' });
  console.log(`\nChunks for artifact-002: ${artifactChunks.length}`);
  const deletedByArtifact = await chunkStore.deleteByArtifact('artifact-002');
  console.log(`Deleted ${deletedByArtifact} chunks by artifact`);
  console.log(`New count: ${chunkStore.count()}`);

  // Verify deletion
  const verifyChunks = await chunkStore.query({ artifact_id: 'artifact-002' });
  console.log(`Remaining chunks for artifact-002: ${verifyChunks.length}`);
}

/**
 * Test 9: Garbage collection
 */
async function testGarbageCollection() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 9: Garbage Collection');
  console.log('='.repeat(80));

  // Re-populate with test data
  await chunkStore.clear();
  const artifacts = createTestArtifacts();
  const chunks = parserAgent.parse(artifacts);
  await chunkStore.store(chunks);

  const beforeCount = chunkStore.count();
  console.log(`\nChunks before garbage collection: ${beforeCount}`);

  // Show date distribution
  const stats = await chunkStore.getStatistics();
  console.log(`\nDate range: ${stats.oldest_chunk_date} to ${stats.newest_chunk_date}`);

  // Garbage collect chunks before Oct 1, 2024
  const cutoffDate = '2024-10-01T00:00:00Z';
  console.log(`\nRemoving chunks before: ${cutoffDate}`);
  const removedCount = await chunkStore.garbageCollect(cutoffDate);

  console.log(`\nGarbage collection results:`);
  console.log(`  Removed: ${removedCount} chunks`);
  console.log(`  Remaining: ${chunkStore.count()} chunks`);

  // Show new date range
  const afterStats = await chunkStore.getStatistics();
  console.log(`\nNew date range: ${afterStats.oldest_chunk_date} to ${afterStats.newest_chunk_date}`);
}

/**
 * Test 10: Store duplicate handling
 */
async function testDuplicateHandling() {
  console.log('\n' + '='.repeat(80));
  console.log('Test 10: Duplicate Handling');
  console.log('='.repeat(80));

  // Clear and add test data
  await chunkStore.clear();
  const artifacts = createTestArtifacts().slice(0, 1);
  const chunks = parserAgent.parse(artifacts);

  console.log(`\nStoring ${chunks.length} chunks for the first time...`);
  const result1 = await chunkStore.store(chunks);
  console.log(`  Stored: ${result1.stored_count}`);
  console.log(`  Skipped: ${result1.skipped_count}`);

  console.log(`\nAttempting to store same chunks again...`);
  const result2 = await chunkStore.store(chunks);
  console.log(`  Stored: ${result2.stored_count}`);
  console.log(`  Skipped: ${result2.skipped_count}`);

  console.log(`\nTotal chunks in store: ${chunkStore.count()}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                   Chunk Store Example Demonstration                        ║');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');

  // Run tests
  await testBasicStorageRetrieval();
  await testQueryByPatient();
  await testQueryByType();
  await testQueryByDateRange();
  await testQueryByEntity();
  await testComplexQueries();
  await testPagination();
  await testDeletion();
  await testGarbageCollection();
  await testDuplicateHandling();

  // Final statistics
  await displayStatistics();

  // Display explanation
  console.log('\n' + '='.repeat(80));
  console.log('Chunk Store Explanation');
  console.log('='.repeat(80));
  console.log('\n' + chunkStore.explain());

  console.log('\n' + '='.repeat(80));
  console.log('All examples completed successfully!');
  console.log('='.repeat(80));
  console.log('\n');

  // Clean up
  await chunkStore.clear();
}

// Run examples
if (require.main === module) {
  main().catch((error) => {
    console.error('Error running examples:', error);
    process.exit(1);
  });
}

export { main };
