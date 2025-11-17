/**
 * Detail Level Analyzer Service Usage Examples
 *
 * Demonstrates:
 * - Basic detail level assignment
 * - Yes/no question detection
 * - Simple fact lookup detection
 * - Complex analysis detection
 * - Multi-element detection
 * - Response guidelines retrieval
 * - Integration with intent and entities
 * - Batch processing
 */

import detailLevelAnalyzer, { DetailLevel } from '../services/detail-level-analyzer.service';
import intentClassifier, { QueryIntent } from '../services/intent-classifier.service';
import entityExtractor from '../services/entity-extractor.service';

/**
 * Example 1: Basic detail level assignment
 */
export function exampleBasicDetailLevel() {
  console.log('Example 1: Basic Detail Level Assignment');
  console.log('-'.repeat(80));

  const queries = [
    { query: 'Is patient on aspirin?', expectedLevel: DetailLevel.MINIMAL },
    { query: 'What medications is patient taking?', expectedLevel: DetailLevel.BASIC },
    { query: 'Show me recent lab results', expectedLevel: DetailLevel.STANDARD },
    {
      query: 'Compare blood pressure trends over last 3 months',
      expectedLevel: DetailLevel.COMPREHENSIVE,
    },
  ];

  console.log('  Analyzing query detail levels:\n');

  queries.forEach(({ query, expectedLevel }, i) => {
    const intent = intentClassifier.classifyIntent(query).intent;
    const level = detailLevelAnalyzer.analyzeQuery(query, intent);
    const match = level === expectedLevel ? '✓' : '✗';

    console.log(`  Query ${i + 1}: "${query}"`);
    console.log(`    Assigned Level: ${level} (${detailLevelAnalyzer.getLevelName(level)})`);
    console.log(`    Expected Level: ${expectedLevel}`);
    console.log(`    Match: ${match}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 2: Yes/no question detection
 */
export function exampleYesNoQuestions() {
  console.log('Example 2: Yes/No Question Detection (Level 1)');
  console.log('-'.repeat(80));

  const queries = [
    'Is patient on aspirin?',
    'Did patient have surgery in 2023?',
    'Has patient been diagnosed with diabetes?',
    'Was patient admitted to hospital?',
    'Does patient have any allergies?',
    'Can patient take ibuprofen?',
    'Will patient need follow-up?',
  ];

  console.log('  Detecting yes/no questions:\n');

  queries.forEach((query, i) => {
    const intent = intentClassifier.classifyIntent(query).intent;
    const level = detailLevelAnalyzer.analyzeQuery(query, intent);
    const isMinimal = level === DetailLevel.MINIMAL;

    console.log(`  ${i + 1}. "${query}"`);
    console.log(`     Level: ${level} (${detailLevelAnalyzer.getLevelName(level)})`);
    console.log(`     Is Yes/No: ${isMinimal ? 'Yes' : 'No'}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 3: Simple fact lookup detection
 */
export function exampleSimpleFactLookup() {
  console.log('Example 3: Simple Fact Lookup Detection (Level 2)');
  console.log('-'.repeat(80));

  const queries = [
    'What medications is patient taking?',
    'When was the last visit?',
    'Who is the primary care physician?',
    'Where was patient treated?',
    'Which medications were prescribed?',
  ];

  console.log('  Detecting simple fact lookups:\n');

  queries.forEach((query, i) => {
    const intent = intentClassifier.classifyIntent(query).intent;
    const level = detailLevelAnalyzer.analyzeQuery(query, intent);
    const isBasic = level === DetailLevel.BASIC;

    console.log(`  ${i + 1}. "${query}"`);
    console.log(`     Level: ${level} (${detailLevelAnalyzer.getLevelName(level)})`);
    console.log(`     Is Simple Fact: ${isBasic ? 'Yes' : 'No'}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 4: Complex analysis detection
 */
export function exampleComplexAnalysis() {
  console.log('Example 4: Complex Analysis Detection (Level 5)');
  console.log('-'.repeat(80));

  const queries = [
    'Analyze blood pressure trends over the past year',
    'Compare medication effectiveness between metformin and insulin',
    'Explain why patient was hospitalized',
    'How does diet affect blood sugar levels?',
    'Evaluate the impact of exercise on heart rate',
    'What patterns emerge from lab results?',
  ];

  console.log('  Detecting complex analysis queries:\n');

  queries.forEach((query, i) => {
    const intent = intentClassifier.classifyIntent(query).intent;
    const level = detailLevelAnalyzer.analyzeQuery(query, intent);
    const isComprehensive = level === DetailLevel.COMPREHENSIVE;

    console.log(`  ${i + 1}. "${query}"`);
    console.log(`     Level: ${level} (${detailLevelAnalyzer.getLevelName(level)})`);
    console.log(`     Is Complex Analysis: ${isComprehensive ? 'Yes' : 'No'}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 5: Detail level with reasoning
 */
export function exampleDetailLevelWithReasoning() {
  console.log('Example 5: Detail Level with Reasoning');
  console.log('-'.repeat(80));

  const queries = [
    'Is patient diabetic?',
    'What is current blood pressure?',
    'Show recent medications',
    'Compare A1C levels from January and June',
  ];

  console.log('  Analyzing queries with detailed reasoning:\n');

  queries.forEach((query, i) => {
    const intent = intentClassifier.classifyIntent(query).intent;
    const entities = entityExtractor.extractEntities(query);
    const analysis = detailLevelAnalyzer.analyzeWithReasoning(query, intent, entities);

    console.log(`  Query ${i + 1}: "${query}"`);
    console.log(`    Level: ${analysis.level} (${detailLevelAnalyzer.getLevelName(analysis.level)})`);
    console.log(`    Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
    console.log('    Reasoning:');
    analysis.reasoning.forEach((reason) => {
      console.log(`      - ${reason}`);
    });
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 6: Response guidelines
 */
export function exampleResponseGuidelines() {
  console.log('Example 6: Response Guidelines by Detail Level');
  console.log('-'.repeat(80));

  const levels = [
    DetailLevel.MINIMAL,
    DetailLevel.BASIC,
    DetailLevel.STANDARD,
    DetailLevel.DETAILED,
    DetailLevel.COMPREHENSIVE,
  ];

  console.log('  Response guidelines for each detail level:\n');

  levels.forEach((level) => {
    const guidelines = detailLevelAnalyzer.getResponseGuidelines(level);
    const description = detailLevelAnalyzer.getDescription(level);

    console.log(`  Level ${level}: ${description}`);
    console.log(`    Max words (short answer): ${guidelines.short_answer_max_words}`);
    console.log(`    Summary bullets: ${guidelines.detailed_summary_bullets}`);
    console.log(`    Min sources: ${guidelines.min_sources}`);
    console.log(`    Include reasoning: ${guidelines.include_reasoning ? 'Yes' : 'No'}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 7: Intent-based detail level
 */
export function exampleIntentBasedDetailLevel() {
  console.log('Example 7: Intent-Based Detail Level');
  console.log('-'.repeat(80));

  const queries = [
    'List all medications',
    'Summarize patient history',
    'Compare this month to last month',
    'Show care plans',
  ];

  console.log('  Detail levels influenced by intent:\n');

  queries.forEach((query, i) => {
    const classification = intentClassifier.classifyIntent(query);
    const entities = entityExtractor.extractEntities(query);
    const level = detailLevelAnalyzer.analyzeQuery(query, classification.intent, entities);

    console.log(`  Query ${i + 1}: "${query}"`);
    console.log(`    Intent: ${classification.intent}`);
    console.log(`    Detail Level: ${level} (${detailLevelAnalyzer.getLevelName(level)})`);
    console.log(`    Reasoning: ${detailLevelAnalyzer.requiresReasoning(level) ? 'Required' : 'Optional'}`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 8: Multi-element detection
 */
export function exampleMultiElementDetection() {
  console.log('Example 8: Multi-Element Detection (Level 4)');
  console.log('-'.repeat(80));

  const queries = [
    'Show medications for diabetes, hypertension, and high cholesterol',
    'Compare blood pressure from January, March, and June',
    'Patient with diabetes on metformin and lisinopril',
  ];

  console.log('  Detecting queries with multiple complex elements:\n');

  queries.forEach((query, i) => {
    const intent = intentClassifier.classifyIntent(query).intent;
    const entities = entityExtractor.extractEntities(query);
    const analysis = detailLevelAnalyzer.analyzeWithReasoning(query, intent, entities);

    console.log(`  Query ${i + 1}: "${query}"`);
    console.log(`    Entities found: ${entities.length}`);
    console.log(`    Detail Level: ${analysis.level} (${detailLevelAnalyzer.getLevelName(analysis.level)})`);
    console.log('    Detection reasoning:');
    analysis.reasoning.forEach((reason) => {
      console.log(`      - ${reason}`);
    });
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 9: Batch processing
 */
export function exampleBatchProcessing() {
  console.log('Example 9: Batch Processing');
  console.log('-'.repeat(80));

  const queries = [
    { query: 'Is patient on aspirin?', intent: QueryIntent.RETRIEVE_MEDICATIONS },
    { query: 'What is blood pressure?', intent: QueryIntent.RETRIEVE_ALL },
    { query: 'Show recent visits', intent: QueryIntent.RETRIEVE_NOTES },
    { query: 'Analyze medication adherence trends', intent: QueryIntent.COMPARISON },
  ];

  console.log(`  Batch processing ${queries.length} queries:\n`);

  const levels = detailLevelAnalyzer.analyzeBatch(queries);

  levels.forEach((level, i) => {
    console.log(`  Query ${i + 1}: "${queries[i].query}"`);
    console.log(`    Level: ${level} (${detailLevelAnalyzer.getLevelName(level)})`);
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 10: Batch with reasoning
 */
export function exampleBatchWithReasoning() {
  console.log('Example 10: Batch Processing with Reasoning');
  console.log('-'.repeat(80));

  const queries = [
    { query: 'Has patient been hospitalized?', intent: QueryIntent.RETRIEVE_ALL },
    { query: 'Compare A1C from last two visits', intent: QueryIntent.COMPARISON },
  ];

  console.log(`  Batch analyzing ${queries.length} queries with reasoning:\n`);

  const analyses = detailLevelAnalyzer.analyzeBatchWithReasoning(queries);

  analyses.forEach((analysis, i) => {
    console.log(`  Query ${i + 1}: "${queries[i].query}"`);
    console.log(`    Level: ${analysis.level} (${detailLevelAnalyzer.getLevelName(analysis.level)})`);
    console.log(`    Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
    console.log('    Reasoning:');
    analysis.reasoning.forEach((reason) => {
      console.log(`      - ${reason}`);
    });
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 11: Helper methods
 */
export function exampleHelperMethods() {
  console.log('Example 11: Helper Methods');
  console.log('-'.repeat(80));

  const level = DetailLevel.STANDARD;

  console.log(`  Helper methods for Level ${level} (STANDARD):\n`);

  console.log(`    Level name: ${detailLevelAnalyzer.getLevelName(level)}`);
  console.log(`    Description: ${detailLevelAnalyzer.getDescription(level)}`);
  console.log(`    Requires reasoning: ${detailLevelAnalyzer.requiresReasoning(level)}`);
  console.log(`    Min sources: ${detailLevelAnalyzer.getMinSources(level)}`);
  console.log(`    Max answer words: ${detailLevelAnalyzer.getMaxAnswerWords(level)}`);
  console.log(`    Summary bullets: ${detailLevelAnalyzer.getSummaryBullets(level)}`);
  console.log('');

  console.log('  ✅ Success\n');
}

/**
 * Example 12: Integration with full pipeline
 */
export function exampleFullPipeline() {
  console.log('Example 12: Integration with Full Query Pipeline');
  console.log('-'.repeat(80));

  const query = 'Compare blood pressure trends between January and March 2024';

  console.log(`  Query: "${query}"\n`);

  // Step 1: Classify intent
  const classification = intentClassifier.classifyIntent(query);
  console.log(`  Step 1 - Intent Classification:`);
  console.log(`    Intent: ${classification.intent}`);
  console.log(`    Confidence: ${(classification.confidence * 100).toFixed(0)}%`);
  console.log('');

  // Step 2: Extract entities
  const entities = entityExtractor.extractEntities(query);
  console.log(`  Step 2 - Entity Extraction:`);
  console.log(`    Entities found: ${entities.length}`);
  entities.forEach((entity) => {
    console.log(`      - [${entity.type}] ${entity.text}`);
  });
  console.log('');

  // Step 3: Analyze detail level
  const analysis = detailLevelAnalyzer.analyzeWithReasoning(
    query,
    classification.intent,
    entities
  );
  console.log(`  Step 3 - Detail Level Analysis:`);
  console.log(`    Level: ${analysis.level} (${detailLevelAnalyzer.getLevelName(analysis.level)})`);
  console.log(`    Confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
  console.log('    Reasoning:');
  analysis.reasoning.forEach((reason) => {
    console.log(`      - ${reason}`);
  });
  console.log('');

  // Step 4: Get response guidelines
  const guidelines = analysis.guidelines;
  console.log('  Step 4 - Response Guidelines:');
  console.log(`    Max words: ${guidelines.short_answer_max_words}`);
  console.log(`    Summary bullets: ${guidelines.detailed_summary_bullets}`);
  console.log(`    Min sources: ${guidelines.min_sources}`);
  console.log(`    Include reasoning: ${guidelines.include_reasoning}`);
  console.log('');

  console.log('  Pipeline integration successful!');
  console.log('  ✅ Success\n');
}

/**
 * Example 13: Edge cases
 */
export function exampleEdgeCases() {
  console.log('Example 13: Edge Cases and Special Scenarios');
  console.log('-'.repeat(80));

  const queries = [
    { query: '', description: 'Empty query' },
    { query: 'Patient?', description: 'Very short query' },
    {
      query:
        'What are all the medications, conditions, symptoms, and procedures for this patient with diabetes, hypertension, and high cholesterol over the past 5 years including hospitalizations and surgeries?',
      description: 'Very long complex query',
    },
    { query: 'Show me everything', description: 'Vague query' },
  ];

  console.log('  Testing edge cases:\n');

  queries.forEach(({ query, description }, i) => {
    try {
      const intent = intentClassifier.classifyIntent(query || 'unknown').intent;
      const entities = entityExtractor.extractEntities(query || '');
      const level = detailLevelAnalyzer.analyzeQuery(query || '', intent, entities);

      console.log(`  Case ${i + 1}: ${description}`);
      console.log(`    Query: "${query}"`);
      console.log(`    Level: ${level} (${detailLevelAnalyzer.getLevelName(level)})`);
      console.log('    Status: ✓ Handled');
    } catch (error) {
      console.log(`  Case ${i + 1}: ${description}`);
      console.log(`    Query: "${query}"`);
      console.log(`    Status: ✗ Error - ${error}`);
    }
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Example 14: All guidelines overview
 */
export function exampleAllGuidelines() {
  console.log('Example 14: Complete Guidelines Overview');
  console.log('-'.repeat(80));

  const allGuidelines = detailLevelAnalyzer.getAllGuidelines();

  console.log('  Complete response guidelines reference:\n');

  Object.entries(allGuidelines).forEach(([level, guidelines]) => {
    console.log(`  ┌─ Level ${level}: ${detailLevelAnalyzer.getLevelName(Number(level))}`);
    console.log(`  │  Description: ${detailLevelAnalyzer.getDescription(Number(level))}`);
    console.log(`  │  Max words: ${guidelines.short_answer_max_words}`);
    console.log(`  │  Bullets: ${guidelines.detailed_summary_bullets}`);
    console.log(`  │  Sources: ${guidelines.min_sources}`);
    console.log(`  │  Reasoning: ${guidelines.include_reasoning}`);
    console.log('  └─');
    console.log('');
  });

  console.log('  ✅ Success\n');
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('='.repeat(80));
  console.log('DETAIL LEVEL ANALYZER SERVICE EXAMPLES');
  console.log('='.repeat(80));
  console.log('\n');

  try {
    exampleBasicDetailLevel();
    exampleYesNoQuestions();
    exampleSimpleFactLookup();
    exampleComplexAnalysis();
    exampleDetailLevelWithReasoning();
    exampleResponseGuidelines();
    exampleIntentBasedDetailLevel();
    exampleMultiElementDetection();
    exampleBatchProcessing();
    exampleBatchWithReasoning();
    exampleHelperMethods();
    exampleFullPipeline();
    exampleEdgeCases();
    exampleAllGuidelines();

    console.log('='.repeat(80));
    console.log('ALL EXAMPLES COMPLETE');
    console.log('='.repeat(80));
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run examples
// runAllExamples();
