/**
 * Clinical NER Example
 *
 * Demonstrates clinical entity recognition functionality
 *
 * Run with: npx ts-node src/examples/clinical-ner.example.ts
 */

import clinicalNER from '../services/clinical-ner.service';
import { ClinicalEntity } from '../types/clinical-entity.types';

/**
 * Example medical texts
 */
const exampleTexts = [
  {
    name: 'Medication List',
    text: 'Patient is taking lisinopril 10mg QD, metformin 500mg BID, and atorvastatin 20mg at bedtime. Aspirin 81mg PRN for pain.',
  },
  {
    name: 'Clinical Note with Abbreviations',
    text: 'Patient presents with HTN and DM. Currently managed on metoprolol 50mg q12h. EKG shows normal sinus rhythm. CBC and CMP ordered.',
  },
  {
    name: 'Chief Complaint',
    text: 'Patient reports severe chest pain, shortness of breath, and dizziness. History of CAD and previous MI. Started on morphine 2mg IV.',
  },
  {
    name: 'Procedure Note',
    text: 'Patient underwent colonoscopy with biopsy. Anesthesia managed with propofol 200mg IV. Post-procedure vital signs stable. Follow up in 2 weeks.',
  },
  {
    name: 'Complex Medical History',
    text: 'Patient has history of COPD, CHF, and CKD. Current medications include furosemide 40mg PO BID, albuterol inhaler PRN, and prednisone 5mg QD. Recent hospitalization for pneumonia treated with levofloxacin 750mg IV q24h.',
  },
];

/**
 * Display entity extraction results
 */
function displayResults(name: string, text: string, entities: ClinicalEntity[]) {
  console.log('\n' + '='.repeat(80));
  console.log(`Example: ${name}`);
  console.log('='.repeat(80));
  console.log(`\nText:\n${text}`);
  console.log(`\nEntities Found: ${entities.length}`);

  if (entities.length === 0) {
    console.log('No entities extracted.');
    return;
  }

  // Group by type
  const byType: { [key: string]: ClinicalEntity[] } = {};
  for (const entity of entities) {
    if (!byType[entity.type]) {
      byType[entity.type] = [];
    }
    byType[entity.type].push(entity);
  }

  // Display by type
  for (const type of ['medication', 'dosage', 'condition', 'symptom', 'procedure']) {
    if (byType[type] && byType[type].length > 0) {
      console.log(`\n${type.toUpperCase()}S (${byType[type].length}):`);
      for (const entity of byType[type]) {
        console.log(`  - "${entity.text}" → "${entity.normalized}"`);
        console.log(`    Position: [${entity.char_offsets[0]}, ${entity.char_offsets[1]}]`);
      }
    }
  }

  // Get statistics
  const stats = clinicalNER.getExtractionStats(entities, 'example-chunk');
  console.log(`\nStatistics:`);
  console.log(`  Total Entities: ${stats.entity_count}`);
  console.log(`  By Type:`);
  console.log(`    Medications: ${stats.by_type.medication}`);
  console.log(`    Dosages: ${stats.by_type.dosage}`);
  console.log(`    Conditions: ${stats.by_type.condition}`);
  console.log(`    Symptoms: ${stats.by_type.symptom}`);
  console.log(`    Procedures: ${stats.by_type.procedure}`);
}

/**
 * Test abbreviation normalization
 */
function testAbbreviations() {
  console.log('\n' + '='.repeat(80));
  console.log('Abbreviation Normalization Tests');
  console.log('='.repeat(80));

  const testCases = [
    { text: 'HTN', type: 'condition' as const },
    { text: 'DM', type: 'condition' as const },
    { text: 'PRN', type: 'dosage' as const },
    { text: 'q6h', type: 'dosage' as const },
    { text: 'BID', type: 'dosage' as const },
    { text: 'CAD', type: 'condition' as const },
    { text: 'EKG', type: 'procedure' as const },
    { text: 'CBC', type: 'procedure' as const },
  ];

  for (const testCase of testCases) {
    const entity: ClinicalEntity = {
      text: testCase.text,
      type: testCase.type,
      char_offsets: [0, testCase.text.length],
      normalized: '',
    };
    entity.normalized = clinicalNER.normalizeEntity(entity);
    console.log(`  ${testCase.text} (${testCase.type}) → ${entity.normalized}`);
  }
}

/**
 * Test entity extraction with context
 */
function testContextExtraction() {
  console.log('\n' + '='.repeat(80));
  console.log('Context Extraction Test');
  console.log('='.repeat(80));

  const text =
    'Patient presents with fever (102.3°F) and severe headache. History of HTN managed with lisinopril 20mg QD. Gave acetaminophen 650mg PO for symptom relief.';

  console.log(`\nText:\n${text}\n`);

  const entities = clinicalNER.extractEntities(text);

  console.log('Extracted Entities with Context:');
  for (const entity of entities) {
    const [start, end] = entity.char_offsets;

    // Get context (20 chars before and after)
    const contextStart = Math.max(0, start - 20);
    const contextEnd = Math.min(text.length, end + 20);

    const before = text.slice(contextStart, start);
    const highlight = text.slice(start, end);
    const after = text.slice(end, contextEnd);

    console.log(`\n  ${entity.type.toUpperCase()}: "${entity.text}" → "${entity.normalized}"`);
    console.log(`  Context: ...${before}[${highlight}]${after}...`);
  }
}

/**
 * Test dosage normalization
 */
function testDosageNormalization() {
  console.log('\n' + '='.repeat(80));
  console.log('Dosage Normalization Tests');
  console.log('='.repeat(80));

  const dosageTexts = [
    '10 milligrams',
    '500mg',
    '2.5 micrograms',
    '100 units',
    '5 ml',
    '1 tablet',
    '2 capsules',
    '10% cream',
  ];

  for (const dosageText of dosageTexts) {
    const entity: ClinicalEntity = {
      text: dosageText,
      type: 'dosage',
      char_offsets: [0, dosageText.length],
      normalized: '',
    };
    entity.normalized = clinicalNER.normalizeEntity(entity);
    console.log(`  "${dosageText}" → "${entity.normalized}"`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                     Clinical NER Example Demonstration                     ║');
  console.log('╔════════════════════════════════════════════════════════════════════════════╗');

  // Run examples
  for (const example of exampleTexts) {
    const entities = clinicalNER.extractEntities(example.text);
    displayResults(example.name, example.text, entities);
  }

  // Test abbreviations
  testAbbreviations();

  // Test dosage normalization
  testDosageNormalization();

  // Test context extraction
  testContextExtraction();

  // Display explanation
  console.log('\n' + '='.repeat(80));
  console.log('Clinical NER Explanation');
  console.log('='.repeat(80));
  console.log('\n' + clinicalNER.explain());

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
