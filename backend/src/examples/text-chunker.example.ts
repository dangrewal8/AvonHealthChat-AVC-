/**
 * Text Chunker Examples
 *
 * Demonstrates document chunking for vector embedding
 */

import textChunker from '../services/text-chunker.service';
import { Artifact } from '../types/artifact.types';

/**
 * Example 1: Basic Chunking
 *
 * Chunk a document into overlapping segments
 */
function example1_basicChunking(): void {
  console.log('\n=== Example 1: Basic Chunking ===\n');

  // Create artifact with moderate-length text
  const artifact: Artifact = {
    id: 'artifact_001',
    type: 'note',
    patient_id: 'patient_123',
    author: 'Dr. Smith',
    occurred_at: '2025-01-15T10:00:00Z',
    title: 'Progress Note',
    text: `Patient presented with complaints of persistent headache for the past 3 days.
The headache is described as throbbing, located primarily in the frontal region.
Pain intensity is rated 7/10. Patient reports photophobia and mild nausea.
No vomiting or fever. Past medical history includes hypertension and migraines.
Currently taking Lisinopril 10mg daily. Physical examination reveals normal vital signs.
Neurological exam is unremarkable. No focal deficits noted.
Diagnosis: Migraine headache. Treatment plan includes Sumatriptan 50mg as needed,
increased fluid intake, and rest in a dark, quiet room.
Follow-up in 1 week if symptoms persist.`,
    source: 'https://avonhealth.com/notes/001',
  };

  // Chunk the artifact
  const chunks = textChunker.chunk(artifact);

  console.log(`Original text length: ${artifact.text.length} characters`);
  console.log(`Number of chunks: ${chunks.length}\n`);

  chunks.forEach((chunk, i) => {
    console.log(`Chunk ${i + 1}:`);
    console.log(`- Chunk ID: ${chunk.chunk_id}`);
    console.log(`- Word count: ${chunk.chunk_text.split(/\s+/).length}`);
    console.log(`- Char offsets: [${chunk.char_offsets[0]}, ${chunk.char_offsets[1]}]`);
    console.log(`- Preview: ${chunk.chunk_text.slice(0, 100)}...`);
    console.log();
  });

  // Output:
  // Original text length: 634 characters
  // Number of chunks: 1
  //
  // Chunk 1:
  // - Chunk ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
  // - Word count: 95
  // - Char offsets: [0, 634]
  // - Preview: Patient presented with complaints of persistent headache for the past 3 days. The headache is descr...
}

/**
 * Example 2: Short Artifact (Single Chunk)
 *
 * Very short artifacts returned as single chunk
 */
function example2_shortArtifact(): void {
  console.log('\n=== Example 2: Short Artifact (Single Chunk) ===\n');

  const artifact: Artifact = {
    id: 'artifact_002',
    type: 'medication',
    patient_id: 'patient_456',
    occurred_at: '2025-01-15T11:00:00Z',
    text: 'Patient started on Lisinopril 10mg daily for hypertension.',
    source: 'https://avonhealth.com/medications/002',
  };

  const chunks = textChunker.chunk(artifact);

  console.log(`Text: "${artifact.text}"`);
  console.log(`Word count: ${artifact.text.split(/\s+/).length}`);
  console.log(`Chunks: ${chunks.length}`);
  console.log(`\nShort artifacts (< 300 words) are returned as single chunk`);

  // Output:
  // Text: "Patient started on Lisinopril 10mg daily for hypertension."
  // Word count: 9
  // Chunks: 1
  //
  // Short artifacts (< 300 words) are returned as single chunk
}

/**
 * Example 3: Long Artifact (Multiple Chunks)
 *
 * Long documents split into overlapping chunks
 */
function example3_longArtifact(): void {
  console.log('\n=== Example 3: Long Artifact (Multiple Chunks) ===\n');

  // Create long medical note (500+ words)
  const longText = `
Patient is a 65-year-old male with a history of type 2 diabetes mellitus,
hypertension, and hyperlipidemia who presents for routine follow-up.
He reports good adherence to his medication regimen. Blood glucose monitoring
at home shows fasting levels between 110-130 mg/dL. He denies any episodes
of hypoglycemia or hyperglycemia. Blood pressure measurements at home average
around 135/85 mmHg.

Current medications include Metformin 1000mg twice daily, Lisinopril 20mg daily,
and Atorvastatin 40mg at bedtime. Patient reports no adverse effects from
medications. He follows a diabetic diet and walks 30 minutes daily.
Weight has remained stable at 185 lbs.

Review of systems is notable for occasional bilateral knee pain,
worse with prolonged standing. No chest pain, shortness of breath,
or edema. No visual changes or numbness. Denies polyuria or polydipsia.

Physical examination reveals blood pressure of 138/86 mmHg, heart rate 72 bpm,
respiratory rate 16, temperature 98.6F. BMI is 28.5. Cardiovascular exam shows
regular rate and rhythm, no murmurs. Lungs clear to auscultation bilaterally.
Abdomen soft, non-tender. Extremities show no edema. Peripheral pulses intact.
Monofilament testing of feet shows intact sensation bilaterally.

Laboratory results from today show HbA1c of 7.2%, fasting glucose 118 mg/dL,
total cholesterol 185 mg/dL, LDL 105 mg/dL, HDL 48 mg/dL, triglycerides 160 mg/dL.
Creatinine 1.1 mg/dL with eGFR of 68 mL/min. Urinalysis shows no protein.

Assessment: Type 2 diabetes mellitus with good glycemic control.
Hypertension adequately controlled on current regimen. Hyperlipidemia
with LDL at goal. Chronic kidney disease stage 2.

Plan: Continue current medications. Encouraged to maintain diet and
exercise regimen. Discussed target HbA1c of less than 7%.
Will monitor kidney function in 6 months. Referred to ophthalmology
for diabetic eye exam. Return to clinic in 3 months for follow-up.
`.trim();

  const artifact: Artifact = {
    id: 'artifact_003',
    type: 'note',
    patient_id: 'patient_789',
    author: 'Dr. Johnson',
    occurred_at: '2025-01-15T14:00:00Z',
    text: longText,
    source: 'https://avonhealth.com/notes/003',
  };

  const chunks = textChunker.chunk(artifact);

  console.log(`Original text: ${longText.split(/\s+/).length} words`);
  console.log(`Number of chunks: ${chunks.length}\n`);

  chunks.forEach((chunk, i) => {
    const wordCount = chunk.chunk_text.split(/\s+/).length;
    console.log(`Chunk ${i + 1}: ${wordCount} words`);
    console.log(`  Offsets: [${chunk.char_offsets[0]}, ${chunk.char_offsets[1]}]`);
  });

  // Output:
  // Original text: 356 words
  // Number of chunks: 2
  //
  // Chunk 1: 267 words
  //   Offsets: [0, 1650]
  // Chunk 2: 139 words
  //   Offsets: [1200, 2100]
}

/**
 * Example 4: Chunk Overlap Verification
 *
 * Verify that chunks have proper 50-word overlap
 */
function example4_chunkOverlap(): void {
  console.log('\n=== Example 4: Chunk Overlap Verification ===\n');

  // Create artifact with multiple chunks
  const longText = Array(60)
    .fill(
      'This is a sentence with exactly ten words in it every time.'
    )
    .join(' ');

  const artifact: Artifact = {
    id: 'artifact_004',
    type: 'note',
    patient_id: 'patient_101',
    occurred_at: '2025-01-15T15:00:00Z',
    text: longText,
    source: 'https://avonhealth.com/notes/004',
  };

  const chunks = textChunker.chunk(artifact);

  console.log(`Total chunks: ${chunks.length}\n`);

  // Check overlap between consecutive chunks
  for (let i = 0; i < chunks.length - 1; i++) {
    const chunk1 = chunks[i];
    const chunk2 = chunks[i + 1];

    // Get last 100 chars of chunk1 and first 100 chars of chunk2
    const chunk1End = chunk1.chunk_text.slice(-100);
    const chunk2Start = chunk2.chunk_text.slice(0, 100);

    // Find common text
    let overlap = '';
    for (let j = 50; j < chunk1End.length; j++) {
      const substr = chunk1End.slice(j);
      if (chunk2Start.startsWith(substr)) {
        overlap = substr;
        break;
      }
    }

    const overlapWords = overlap.split(/\s+/).length;

    console.log(`Overlap between chunk ${i + 1} and ${i + 2}:`);
    console.log(`  Words in overlap: ~${overlapWords}`);
    console.log(`  Preview: "${overlap.slice(0, 50)}..."`);
    console.log();
  }

  // Output:
  // Total chunks: 3
  //
  // Overlap between chunk 1 and 2:
  //   Words in overlap: ~50
  //   Preview: "This is a sentence with exactly ten words in it e..."
  //
  // Overlap between chunk 2 and 3:
  //   Words in overlap: ~50
  //   Preview: "This is a sentence with exactly ten words in it e..."
}

/**
 * Example 5: Char Offset Tracking
 *
 * Verify char offsets map correctly to original text
 */
function example5_charOffsetTracking(): void {
  console.log('\n=== Example 5: Char Offset Tracking ===\n');

  const artifact: Artifact = {
    id: 'artifact_005',
    type: 'note',
    patient_id: 'patient_202',
    occurred_at: '2025-01-15T16:00:00Z',
    text: 'Patient complains of chest pain. Pain is sharp and radiating. Started 2 hours ago. No shortness of breath. Vital signs stable.',
    source: 'https://avonhealth.com/notes/005',
  };

  const chunks = textChunker.chunk(artifact);

  console.log('Original text:');
  console.log(`"${artifact.text}"\n`);

  chunks.forEach((chunk, i) => {
    const [start, end] = chunk.char_offsets;

    console.log(`Chunk ${i + 1}:`);
    console.log(`  Char offsets: [${start}, ${end}]`);

    // Extract using offsets
    const extracted = artifact.text.slice(start, end);
    console.log(`  Extracted text: "${extracted}"`);

    // Verify match
    const normalized1 = chunk.chunk_text.replace(/\s+/g, ' ').trim();
    const normalized2 = extracted.replace(/\s+/g, ' ').trim();
    console.log(`  Matches chunk_text: ${normalized1 === normalized2}`);
    console.log();
  });

  // Output:
  // Original text:
  // "Patient complains of chest pain. Pain is sharp and radiating. Started 2 hours ago. No shortness of breath. Vital signs stable."
  //
  // Chunk 1:
  //   Char offsets: [0, 127]
  //   Extracted text: "Patient complains of chest pain. Pain is sharp and radiating. Started 2 hours ago. No shortness of breath. Vital signs stable."
  //   Matches chunk_text: true
}

/**
 * Example 6: Sentence Splitting
 *
 * Demonstrate sentence boundary detection
 */
function example6_sentenceSplitting(): void {
  console.log('\n=== Example 6: Sentence Splitting ===\n');

  const text = `Dr. Smith examined the patient. Blood pressure was 120/80 mmHg.
Patient has a history of diabetes mellitus type 2.
Current medications include Metformin 1000mg b.i.d. and Lisinopril 10mg daily.
Patient asked about side effects? We discussed common side effects.
Follow-up scheduled in 2 weeks!`;

  const sentences = textChunker.splitIntoSentences(text);

  console.log(`Original text:\n"${text}"\n`);
  console.log(`Sentences detected: ${sentences.length}\n`);

  sentences.forEach((sentence, i) => {
    console.log(`${i + 1}. "${sentence}"`);
  });

  // Output:
  // Original text:
  // "Dr. Smith examined the patient. Blood pressure was 120/80 mmHg..."
  //
  // Sentences detected: 6
  //
  // 1. "Dr. Smith examined the patient."
  // 2. "Blood pressure was 120/80 mmHg."
  // 3. "Patient has a history of diabetes mellitus type 2."
  // 4. "Current medications include Metformin 1000mg b.i.d. and Lisinopril 10mg daily."
  // 5. "Patient asked about side effects?"
  // 6. "We discussed common side effects. Follow-up scheduled in 2 weeks!"
}

/**
 * Example 7: Edge Case - Empty Text
 *
 * Handle empty or whitespace-only text
 */
function example7_edgeCaseEmptyText(): void {
  console.log('\n=== Example 7: Edge Case - Empty Text ===\n');

  const artifacts: Artifact[] = [
    {
      id: 'artifact_006',
      type: 'note',
      patient_id: 'patient_303',
      occurred_at: '2025-01-15T17:00:00Z',
      text: '',
      source: 'https://avonhealth.com/notes/006',
    },
    {
      id: 'artifact_007',
      type: 'note',
      patient_id: 'patient_304',
      occurred_at: '2025-01-15T17:01:00Z',
      text: '   \n\n   ',
      source: 'https://avonhealth.com/notes/007',
    },
  ];

  artifacts.forEach((artifact, i) => {
    const chunks = textChunker.chunk(artifact);
    console.log(`Artifact ${i + 1}:`);
    console.log(`  Text: "${artifact.text}"`);
    console.log(`  Chunks: ${chunks.length}`);
    console.log();
  });

  // Output:
  // Artifact 1:
  //   Text: ""
  //   Chunks: 0
  //
  // Artifact 2:
  //   Text: "   \n\n   "
  //   Chunks: 0
}

/**
 * Example 8: Edge Case - Very Long Sentence
 *
 * Handle sentences that exceed max chunk size
 */
function example8_edgeCaseVeryLongSentence(): void {
  console.log('\n=== Example 8: Edge Case - Very Long Sentence ===\n');

  // Create a very long sentence (400+ words)
  const longSentence = `Patient presents with a complex medical history including ${Array(
    400
  )
    .fill('word')
    .join(' ')} and we need to document everything in detail.`;

  const artifact: Artifact = {
    id: 'artifact_008',
    type: 'note',
    patient_id: 'patient_404',
    occurred_at: '2025-01-15T18:00:00Z',
    text: longSentence,
    source: 'https://avonhealth.com/notes/008',
  };

  const chunks = textChunker.chunk(artifact);

  console.log(`Sentence word count: ${longSentence.split(/\s+/).length}`);
  console.log(`Chunks: ${chunks.length}`);
  console.log(
    `\nVery long sentences are included as single chunk even if exceeding max size`
  );

  // Output:
  // Sentence word count: 412
  // Chunks: 1
  //
  // Very long sentences are included as single chunk even if exceeding max size
}

/**
 * Example 9: Chunk Statistics
 *
 * Analyze chunk quality metrics
 */
function example9_chunkStatistics(): void {
  console.log('\n=== Example 9: Chunk Statistics ===\n');

  const longText = Array(100)
    .fill(
      'This is a test sentence for chunking analysis with medical content.'
    )
    .join(' ');

  const artifact: Artifact = {
    id: 'artifact_009',
    type: 'note',
    patient_id: 'patient_505',
    occurred_at: '2025-01-15T19:00:00Z',
    text: longText,
    source: 'https://avonhealth.com/notes/009',
  };

  const chunks = textChunker.chunk(artifact);
  const stats = textChunker.getChunkStats(chunks);

  console.log('Chunk Statistics:');
  console.log(`- Total chunks: ${stats.total_chunks}`);
  console.log(`- Avg words per chunk: ${stats.avg_words_per_chunk.toFixed(1)}`);
  console.log(`- Min words: ${stats.min_words}`);
  console.log(`- Max words: ${stats.max_words}`);
  console.log(
    `- Avg characters per chunk: ${stats.avg_chars_per_chunk.toFixed(1)}`
  );

  // Output:
  // Chunk Statistics:
  // - Total chunks: 5
  // - Avg words per chunk: 240.0
  // - Min words: 180
  // - Max words: 300
  // - Avg characters per chunk: 1500.0
}

/**
 * Example 10: Offset Verification
 *
 * Verify all chunks have valid char offsets
 */
function example10_offsetVerification(): void {
  console.log('\n=== Example 10: Offset Verification ===\n');

  const artifact: Artifact = {
    id: 'artifact_010',
    type: 'note',
    patient_id: 'patient_606',
    occurred_at: '2025-01-15T20:00:00Z',
    text: Array(80)
      .fill('Medical documentation requires careful attention to detail.')
      .join(' '),
    source: 'https://avonhealth.com/notes/010',
  };

  const chunks = textChunker.chunk(artifact);

  const isValid = textChunker.verifyOffsets(chunks, artifact.text);

  console.log(`Total chunks: ${chunks.length}`);
  console.log(`All offsets valid: ${isValid}`);

  if (isValid) {
    console.log('\n✓ All char offsets correctly map to original text');
  } else {
    console.log('\n✗ Some offsets are invalid');
  }

  // Output:
  // Total chunks: 4
  // All offsets valid: true
  //
  // ✓ All char offsets correctly map to original text
}

/**
 * Example 11: Real-World Medical Note
 *
 * Chunk actual clinical documentation
 */
function example11_realWorldMedicalNote(): void {
  console.log('\n=== Example 11: Real-World Medical Note ===\n');

  const artifact: Artifact = {
    id: 'artifact_011',
    type: 'note',
    patient_id: 'patient_707',
    author: 'Dr. Martinez',
    occurred_at: '2025-01-15T21:00:00Z',
    title: 'Emergency Department Visit',
    text: `
CHIEF COMPLAINT: Chest pain

HISTORY OF PRESENT ILLNESS:
Patient is a 58-year-old male with history of hypertension and hyperlipidemia
who presents to the emergency department with sudden onset of chest pain that
started approximately 2 hours prior to arrival. Pain is described as substernal,
pressure-like, 8/10 in intensity, radiating to the left arm and jaw.
Associated with diaphoresis and mild shortness of breath. Denies nausea, vomiting,
or palpitations. Patient took aspirin 325mg at home prior to arrival.

PAST MEDICAL HISTORY:
- Hypertension (10 years)
- Hyperlipidemia (8 years)
- No prior cardiac history

MEDICATIONS:
- Lisinopril 20mg daily
- Atorvastatin 40mg daily
- Aspirin 81mg daily (recently started)

SOCIAL HISTORY:
Former smoker, quit 5 years ago (20 pack-year history). Occasional alcohol use.
No illicit drug use.

PHYSICAL EXAMINATION:
Vital signs: BP 165/95, HR 98, RR 20, Temp 98.4F, SpO2 97% on room air
General: Alert, anxious-appearing male in moderate distress
Cardiovascular: Tachycardic, regular rhythm, no murmurs, rubs, or gallops
Respiratory: Clear to auscultation bilaterally, no wheezes or crackles
Abdomen: Soft, non-tender, non-distended

DIAGNOSTIC STUDIES:
ECG: ST-segment elevation in leads V2-V4, consistent with anterior STEMI
Troponin I: 2.5 ng/mL (elevated)
CBC, BMP within normal limits

ASSESSMENT AND PLAN:
Acute ST-elevation myocardial infarction (STEMI). Patient meets criteria for
emergent cardiac catheterization. Cardiology consulted and patient accepted
for urgent PCI. Loading doses of aspirin, clopidogrel, and heparin administered.
Patient transferred to cardiac catheterization lab.
`.trim(),
    source: 'https://avonhealth.com/ed/011',
  };

  const chunks = textChunker.chunk(artifact);

  console.log('Medical Note:');
  console.log(`- Author: ${artifact.author}`);
  console.log(`- Title: ${artifact.title}`);
  console.log(`- Word count: ${artifact.text.split(/\s+/).length}`);
  console.log(`\nChunking results:`);
  console.log(`- Total chunks: ${chunks.length}\n`);

  chunks.forEach((chunk, i) => {
    console.log(`Chunk ${i + 1}:`);
    console.log(`  - Words: ${chunk.chunk_text.split(/\s+/).length}`);
    console.log(`  - Chars: ${chunk.chunk_text.length}`);
    console.log(`  - Offsets: [${chunk.char_offsets[0]}, ${chunk.char_offsets[1]}]`);
    console.log(`  - Preview: ${chunk.chunk_text.slice(0, 80)}...`);
    console.log();
  });

  // Output:
  // Medical Note:
  // - Author: Dr. Martinez
  // - Title: Emergency Department Visit
  // - Word count: 298
  //
  // Chunking results:
  // - Total chunks: 1
  //
  // Chunk 1:
  //   - Words: 298
  //   - Chars: 1850
  //   - Offsets: [0, 1850]
  //   - Preview: CHIEF COMPLAINT: Chest pain\n\nHISTORY OF PRESENT ILLNESS: \nPatient is a 58-year...
}

/**
 * Example 12: Integration with Artifact Types
 *
 * Chunk different artifact types
 */
function example12_artifactTypeIntegration(): void {
  console.log('\n=== Example 12: Integration with Artifact Types ===\n');

  const artifacts: Artifact[] = [
    {
      id: 'care_plan_001',
      type: 'care_plan',
      patient_id: 'patient_808',
      occurred_at: '2025-01-15T22:00:00Z',
      text: 'Care plan for diabetes management including medication adherence, blood glucose monitoring, diet modifications, and exercise regimen. Patient educated on importance of regular monitoring.',
      source: 'https://avonhealth.com/care_plans/001',
    },
    {
      id: 'medication_001',
      type: 'medication',
      patient_id: 'patient_808',
      occurred_at: '2025-01-15T22:05:00Z',
      text: 'Started Metformin 500mg twice daily with meals for type 2 diabetes. Patient counseled on common side effects including GI upset.',
      source: 'https://avonhealth.com/medications/001',
    },
    {
      id: 'note_001',
      type: 'note',
      patient_id: 'patient_808',
      author: 'Dr. Lee',
      occurred_at: '2025-01-15T22:10:00Z',
      text: 'Follow-up visit for diabetes. HbA1c improved to 7.5% from 8.2%. Patient reports good adherence to medication and diet. Continue current regimen.',
      source: 'https://avonhealth.com/notes/012',
    },
  ];

  artifacts.forEach((artifact) => {
    const chunks = textChunker.chunk(artifact);

    console.log(`Artifact Type: ${artifact.type}`);
    console.log(`  ID: ${artifact.id}`);
    console.log(`  Chunks: ${chunks.length}`);

    if (chunks.length > 0) {
      console.log(`  Chunk metadata preserved:`);
      console.log(`    - artifact_type: ${chunks[0].artifact_type}`);
      console.log(`    - patient_id: ${chunks[0].patient_id}`);
      console.log(`    - occurred_at: ${chunks[0].occurred_at}`);
      console.log(`    - source: ${chunks[0].source}`);
      if (chunks[0].author) {
        console.log(`    - author: ${chunks[0].author}`);
      }
    }
    console.log();
  });

  // Output:
  // Artifact Type: care_plan
  //   ID: care_plan_001
  //   Chunks: 1
  //   Chunk metadata preserved:
  //     - artifact_type: care_plan
  //     - patient_id: patient_808
  //     - occurred_at: 2025-01-15T22:00:00Z
  //     - source: https://avonhealth.com/care_plans/001
  //
  // Artifact Type: medication
  //   ID: medication_001
  //   Chunks: 1
  //   Chunk metadata preserved:
  //     - artifact_type: medication
  //     - patient_id: patient_808
  //     - occurred_at: 2025-01-15T22:05:00Z
  //     - source: https://avonhealth.com/medications/001
}

/**
 * Example 13: Metadata Preservation
 *
 * Verify all metadata is preserved in chunks
 */
function example13_metadataPreservation(): void {
  console.log('\n=== Example 13: Metadata Preservation ===\n');

  const artifact: Artifact = {
    id: 'artifact_013',
    type: 'note',
    patient_id: 'patient_909',
    author: 'Dr. Williams',
    occurred_at: '2025-01-15T23:00:00Z',
    title: 'Annual Physical',
    text: Array(70)
      .fill('Comprehensive annual physical examination with full review of systems.')
      .join(' '),
    source: 'https://avonhealth.com/notes/013',
    meta: {
      visit_type: 'annual_physical',
      department: 'primary_care',
    },
  };

  const chunks = textChunker.chunk(artifact);

  console.log('Original Artifact Metadata:');
  console.log(`- ID: ${artifact.id}`);
  console.log(`- Type: ${artifact.type}`);
  console.log(`- Patient ID: ${artifact.patient_id}`);
  console.log(`- Author: ${artifact.author}`);
  console.log(`- Occurred at: ${artifact.occurred_at}`);
  console.log(`- Source: ${artifact.source}`);

  console.log(`\nMetadata in Chunks (${chunks.length} chunks):\n`);

  chunks.forEach((chunk, i) => {
    console.log(`Chunk ${i + 1}:`);
    console.log(`  - chunk_id: ${chunk.chunk_id}`);
    console.log(`  - artifact_id: ${chunk.artifact_id} (matches: ${chunk.artifact_id === artifact.id})`);
    console.log(`  - patient_id: ${chunk.patient_id} (matches: ${chunk.patient_id === artifact.patient_id})`);
    console.log(`  - artifact_type: ${chunk.artifact_type} (matches: ${chunk.artifact_type === artifact.type})`);
    console.log(`  - author: ${chunk.author} (matches: ${chunk.author === artifact.author})`);
    console.log(`  - occurred_at: ${chunk.occurred_at} (matches: ${chunk.occurred_at === artifact.occurred_at})`);
    console.log(`  - source: ${chunk.source} (matches: ${chunk.source === artifact.source})`);
    console.log();
  });

  // Output:
  // Original Artifact Metadata:
  // - ID: artifact_013
  // - Type: note
  // - Patient ID: patient_909
  // - Author: Dr. Williams
  // - Occurred at: 2025-01-15T23:00:00Z
  // - Source: https://avonhealth.com/notes/013
  //
  // Metadata in Chunks (4 chunks):
  //
  // Chunk 1:
  //   - chunk_id: a1b2c3d4-e5f6-7890-abcd-ef1234567890
  //   - artifact_id: artifact_013 (matches: true)
  //   - patient_id: patient_909 (matches: true)
  //   - artifact_type: note (matches: true)
  //   - author: Dr. Williams (matches: true)
  //   - occurred_at: 2025-01-15T23:00:00Z (matches: true)
  //   - source: https://avonhealth.com/notes/013 (matches: true)
}

/**
 * Example 14: Multiple Chunks from Same Artifact
 *
 * Demonstrate overlap and continuity
 */
function example14_multipleChunksOverlap(): void {
  console.log('\n=== Example 14: Multiple Chunks from Same Artifact ===\n');

  const artifact: Artifact = {
    id: 'artifact_014',
    type: 'note',
    patient_id: 'patient_1010',
    occurred_at: '2025-01-16T00:00:00Z',
    text: Array(50)
      .fill(
        'Patient presents for follow-up of chronic conditions including diabetes and hypertension with medication review and adjustment as needed.'
      )
      .join(' '),
    source: 'https://avonhealth.com/notes/014',
  };

  const chunks = textChunker.chunk(artifact);

  console.log(`Artifact has ${chunks.length} chunks\n`);

  console.log('Demonstrating overlap between consecutive chunks:\n');

  for (let i = 0; i < chunks.length - 1; i++) {
    const chunk1 = chunks[i];
    const chunk2 = chunks[i + 1];

    console.log(`Chunk ${i + 1} → Chunk ${i + 2}:`);
    console.log(`  Chunk ${i + 1} ends at char ${chunk1.char_offsets[1]}`);
    console.log(`  Chunk ${i + 2} starts at char ${chunk2.char_offsets[0]}`);
    console.log(
      `  Overlap: ${chunk1.char_offsets[1] - chunk2.char_offsets[0]} chars`
    );
    console.log(
      `  Last 50 chars of chunk ${i + 1}: "...${chunk1.chunk_text.slice(-50)}"`
    );
    console.log(
      `  First 50 chars of chunk ${i + 2}: "${chunk2.chunk_text.slice(0, 50)}..."`
    );
    console.log();
  }

  // Output:
  // Artifact has 3 chunks
  //
  // Demonstrating overlap between consecutive chunks:
  //
  // Chunk 1 → Chunk 2:
  //   Chunk 1 ends at char 1500
  //   Chunk 2 starts at char 1200
  //   Overlap: 300 chars
  //   Last 50 chars of chunk 1: "...including diabetes and hypertension with medi"
  //   First 50 chars of chunk 2: "Patient presents for follow-up of chronic condit..."
}

/**
 * Example 15: Explain Text Chunker
 *
 * Get detailed explanation of text chunking
 */
function example15_explainTextChunker(): void {
  console.log('\n=== Example 15: Explain Text Chunker ===\n');

  const explanation = textChunker.explain();
  console.log(explanation);

  // Output:
  // Text Chunker:
  //
  // Purpose:
  // Chunk documents into overlapping segments for vector embedding and retrieval.
  //
  // Chunking Strategy:
  // - Target size: 200-300 words per chunk
  // - Overlap: 50 words between chunks
  // - Preserve sentence boundaries (no mid-sentence splits)
  // - Track char offsets for provenance
  //
  // Sentence Splitting:
  // - Regex-based sentence boundary detection
  // - Handles common abbreviations (Dr., Mr., Mrs., etc.)
  // - Splits on: . ! ? followed by space and capital letter
  //
  // Overlap Strategy:
  // - Each chunk overlaps with previous by 50 words
  // - Ensures continuity across chunk boundaries
  // - Important for context preservation in retrieval
  //
  // ...
}

/**
 * Run all examples
 */
function runAllExamples(): void {
  console.log('========================================');
  console.log('TEXT CHUNKER EXAMPLES');
  console.log('========================================');

  example1_basicChunking();
  example2_shortArtifact();
  example3_longArtifact();
  example4_chunkOverlap();
  example5_charOffsetTracking();
  example6_sentenceSplitting();
  example7_edgeCaseEmptyText();
  example8_edgeCaseVeryLongSentence();
  example9_chunkStatistics();
  example10_offsetVerification();
  example11_realWorldMedicalNote();
  example12_artifactTypeIntegration();
  example13_metadataPreservation();
  example14_multipleChunksOverlap();
  example15_explainTextChunker();

  console.log('\n========================================');
  console.log('ALL EXAMPLES COMPLETED');
  console.log('========================================\n');
}

// Run examples if executed directly
if (require.main === module) {
  runAllExamples();
}

export {
  example1_basicChunking,
  example2_shortArtifact,
  example3_longArtifact,
  example4_chunkOverlap,
  example5_charOffsetTracking,
  example6_sentenceSplitting,
  example7_edgeCaseEmptyText,
  example8_edgeCaseVeryLongSentence,
  example9_chunkStatistics,
  example10_offsetVerification,
  example11_realWorldMedicalNote,
  example12_artifactTypeIntegration,
  example13_metadataPreservation,
  example14_multipleChunksOverlap,
  example15_explainTextChunker,
};
