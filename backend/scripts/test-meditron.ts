#!/usr/bin/env ts-node

/**
 * Meditron Integration Tests
 *
 * Validates Meditron's medical reasoning capabilities and compares with general models.
 *
 * Usage:
 *   npm run test:meditron
 *   or
 *   ts-node scripts/test-meditron.ts
 *
 * Prerequisites:
 *   - Ollama running (ollama serve)
 *   - Meditron model installed (ollama pull meditron)
 *   - Llama3 model installed for comparison (ollama pull llama3)
 */

import medicalPromptTemplates, { ClinicalEntityType } from '../src/services/medical-prompt-templates.service';

/**
 * Test result interface
 */
interface TestResult {
  testName: string;
  model: string;
  passed: boolean;
  score: number;
  responseTime: number;
  tokensUsed: number;
  details: string;
  response?: string;
}

/**
 * Performance metrics
 */
interface PerformanceMetrics {
  avgResponseTime: number;
  avgTokens: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
}

/**
 * Test suite results
 */
interface TestSuiteResults {
  model: string;
  results: TestResult[];
  metrics: PerformanceMetrics;
  timestamp: string;
}

/**
 * Ollama API client
 */
class OllamaClient {
  private baseUrl = 'http://localhost:11434';

  async generate(
    model: string,
    prompt: string,
    options: { temperature?: number; format?: string } = {}
  ): Promise<{ response: string; tokensUsed: number; responseTime: number }> {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: options.temperature ?? 0.1,
          },
          format: options.format,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      return {
        response: data.response,
        tokensUsed: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        responseTime,
      };
    } catch (error) {
      throw new Error(`Failed to generate response: ${error}`);
    }
  }

  async checkModelAvailability(model: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models?.some((m: any) => m.name.includes(model)) || false;
    } catch {
      return false;
    }
  }
}

const ollamaClient = new OllamaClient();

/**
 * Test 1: Medical Q&A Accuracy
 */
async function testMedicalQA(model: string): Promise<TestResult[]> {
  console.log(`\n[${model}] Testing Medical Q&A...`);

  const testCases = [
    {
      name: 'Diabetes First-Line Treatment',
      question: 'What is the first-line medication for newly diagnosed type 2 diabetes?',
      context: [
        'Artifact ID: guideline_001\nContent: For newly diagnosed type 2 diabetes, metformin is recommended as first-line therapy per ADA guidelines. Starting dose is typically 500mg twice daily with meals.',
      ],
      expectedKeywords: ['metformin', 'first-line', '500mg', 'twice daily'],
      expectedCitation: 'guideline_001',
    },
    {
      name: 'Hypertension Management',
      question: 'What blood pressure medication is the patient taking?',
      context: [
        'Artifact ID: med_001\nContent: Patient prescribed lisinopril 10mg daily for hypertension management. Blood pressure readings show good control at 128/82 mmHg.',
      ],
      expectedKeywords: ['lisinopril', '10mg', 'daily', 'hypertension'],
      expectedCitation: 'med_001',
    },
    {
      name: 'Lab Result Interpretation',
      question: 'What does the HbA1c result indicate?',
      context: [
        'Artifact ID: lab_001\nContent: HbA1c result: 8.2% (reference range: 4.0-5.6%). This indicates poor glycemic control in the patient with type 2 diabetes.',
      ],
      expectedKeywords: ['8.2', 'poor glycemic control', 'diabetes'],
      expectedCitation: 'lab_001',
    },
  ];

  const results: TestResult[] = [];

  for (const testCase of testCases) {
    const prompt = medicalPromptTemplates.medicalQA(testCase.question, testCase.context, {
      requireCitations: true,
      requireConfidenceLevel: true,
    });

    const { response, tokensUsed, responseTime } = await ollamaClient.generate(model, prompt);

    // Score the response
    let score = 0;
    const maxScore = testCase.expectedKeywords.length + 1; // +1 for citation

    // Check for expected keywords
    for (const keyword of testCase.expectedKeywords) {
      if (response.toLowerCase().includes(keyword.toLowerCase())) {
        score++;
      }
    }

    // Check for citation
    if (response.includes(testCase.expectedCitation)) {
      score++;
    }

    const passed = score >= maxScore * 0.7; // 70% threshold

    results.push({
      testName: `Medical Q&A: ${testCase.name}`,
      model,
      passed,
      score: (score / maxScore) * 100,
      responseTime,
      tokensUsed,
      details: `Keywords found: ${score - (response.includes(testCase.expectedCitation) ? 1 : 0)}/${testCase.expectedKeywords.length}, Citation: ${response.includes(testCase.expectedCitation) ? 'Yes' : 'No'}`,
      response,
    });

    console.log(`  ✓ ${testCase.name}: ${passed ? 'PASS' : 'FAIL'} (${score}/${maxScore}) - ${responseTime}ms`);
  }

  return results;
}

/**
 * Test 2: Clinical Entity Extraction
 */
async function testEntityExtraction(model: string): Promise<TestResult[]> {
  console.log(`\n[${model}] Testing Clinical Entity Extraction...`);

  const testCases = [
    {
      name: 'Medication Extraction',
      text: 'Patient prescribed lisinopril 10mg PO daily for hypertension and metformin 500mg PO BID for type 2 diabetes.',
      entityTypes: [ClinicalEntityType.MEDICATION],
      expectedEntities: {
        medications: [
          { name: 'lisinopril', dose: '10mg', frequency: 'daily' },
          { name: 'metformin', dose: '500mg', frequency: 'BID' },
        ],
      },
    },
    {
      name: 'Diagnosis Extraction',
      text: 'Patient diagnosed with hypertension (ICD-10: I10) and type 2 diabetes mellitus (ICD-10: E11.9). Both conditions are currently active.',
      entityTypes: [ClinicalEntityType.DIAGNOSIS],
      expectedEntities: {
        diagnoses: [
          { name: 'hypertension', icd10: 'I10' },
          { name: 'type 2 diabetes mellitus', icd10: 'E11.9' },
        ],
      },
    },
    {
      name: 'Lab Result Extraction',
      text: 'Lab results: HbA1c 8.2% (ref: 4.0-5.6%), Creatinine 1.1 mg/dL (ref: 0.6-1.2 mg/dL), Glucose 185 mg/dL (ref: 70-100 mg/dL).',
      entityTypes: [ClinicalEntityType.LAB_RESULT],
      expectedEntities: {
        lab_results: [
          { test: 'HbA1c', value: '8.2', unit: '%' },
          { test: 'Creatinine', value: '1.1', unit: 'mg/dL' },
          { test: 'Glucose', value: '185', unit: 'mg/dL' },
        ],
      },
    },
  ];

  const results: TestResult[] = [];

  for (const testCase of testCases) {
    const prompt = medicalPromptTemplates.extractClinicalEntities(testCase.text, testCase.entityTypes);

    const { response, tokensUsed, responseTime } = await ollamaClient.generate(model, prompt, {
      format: 'json',
    });

    // Score the response
    let score = 0;
    let maxScore = 0;
    let parsedResponse: any = null;

    try {
      parsedResponse = JSON.parse(response);

      // Count expected entities
      if (testCase.expectedEntities.medications) {
        maxScore += testCase.expectedEntities.medications.length;
        const extractedMeds = parsedResponse.medications || [];
        for (const expectedMed of testCase.expectedEntities.medications) {
          const found = extractedMeds.some(
            (m: any) =>
              m.name?.toLowerCase().includes(expectedMed.name.toLowerCase()) &&
              m.dose?.includes(expectedMed.dose)
          );
          if (found) score++;
        }
      }

      if (testCase.expectedEntities.diagnoses) {
        maxScore += testCase.expectedEntities.diagnoses.length;
        const extractedDiags = parsedResponse.diagnoses || [];
        for (const expectedDiag of testCase.expectedEntities.diagnoses) {
          const found = extractedDiags.some((d: any) =>
            d.name?.toLowerCase().includes(expectedDiag.name.toLowerCase())
          );
          if (found) score++;
        }
      }

      if (testCase.expectedEntities.lab_results) {
        maxScore += testCase.expectedEntities.lab_results.length;
        const extractedLabs = parsedResponse.lab_results || [];
        for (const expectedLab of testCase.expectedEntities.lab_results) {
          const found = extractedLabs.some((l: any) =>
            l.test_name?.toLowerCase().includes(expectedLab.test.toLowerCase())
          );
          if (found) score++;
        }
      }
    } catch (error) {
      console.error(`  ✗ JSON parsing failed for ${testCase.name}`);
    }

    const passed = maxScore > 0 && score >= maxScore * 0.7; // 70% threshold

    results.push({
      testName: `Entity Extraction: ${testCase.name}`,
      model,
      passed,
      score: maxScore > 0 ? (score / maxScore) * 100 : 0,
      responseTime,
      tokensUsed,
      details: `Entities found: ${score}/${maxScore}, JSON valid: ${parsedResponse ? 'Yes' : 'No'}`,
      response,
    });

    console.log(`  ✓ ${testCase.name}: ${passed ? 'PASS' : 'FAIL'} (${score}/${maxScore}) - ${responseTime}ms`);
  }

  return results;
}

/**
 * Test 3: Treatment Plan Analysis
 */
async function testTreatmentPlanAnalysis(model: string): Promise<TestResult[]> {
  console.log(`\n[${model}] Testing Treatment Plan Analysis...`);

  const testCases = [
    {
      name: 'Complete Treatment Plan',
      plan: `
Diagnosis: Type 2 Diabetes Mellitus, newly diagnosed

Treatment Plan:
1. Medications:
   - Metformin 500mg PO BID with meals
   - Titrate to 1000mg BID after 2 weeks if tolerated

2. Lifestyle modifications:
   - Diet: Reduce carbohydrate intake, follow diabetic diet
   - Exercise: 30 minutes moderate activity 5x/week
   - Weight loss goal: 5-10% body weight

3. Monitoring:
   - Self-monitor blood glucose: fasting and 2h post-prandial
   - Baseline labs: Cr, eGFR, lipid panel
   - Follow-up HbA1c in 3 months

4. Patient education:
   - Hypoglycemia symptoms and management
   - Foot care and daily inspection
   - Annual eye exam referral
      `,
      expectedFindings: ['complete', 'comprehensive', 'no major concerns', 'appropriate'],
      shouldIdentifyIssues: false,
    },
    {
      name: 'Incomplete Treatment Plan',
      plan: `
Diagnosis: Type 2 Diabetes Mellitus

Treatment Plan:
- Start metformin 500mg twice daily
- Check HbA1c in 3 months
      `,
      expectedFindings: ['incomplete', 'missing', 'baseline', 'patient education', 'renal function'],
      shouldIdentifyIssues: true,
    },
  ];

  const results: TestResult[] = [];

  for (const testCase of testCases) {
    const prompt = medicalPromptTemplates.analyzeTreatmentPlan(testCase.plan, {
      medications: true,
      followUp: true,
      patientEducation: true,
      labOrders: true,
    });

    const { response, tokensUsed, responseTime } = await ollamaClient.generate(model, prompt);

    // Score the response
    let score = 0;
    const maxScore = testCase.expectedFindings.length;

    for (const finding of testCase.expectedFindings) {
      if (response.toLowerCase().includes(finding.toLowerCase())) {
        score++;
      }
    }

    // Check if it correctly identifies issues (or lack thereof)
    const identifiesIssues = response.toLowerCase().includes('missing') || response.toLowerCase().includes('incomplete');
    const correctIdentification = identifiesIssues === testCase.shouldIdentifyIssues;

    const passed = score >= maxScore * 0.6 && correctIdentification; // 60% threshold + correct identification

    results.push({
      testName: `Treatment Analysis: ${testCase.name}`,
      model,
      passed,
      score: (score / maxScore) * 100,
      responseTime,
      tokensUsed,
      details: `Findings: ${score}/${maxScore}, Issue identification: ${correctIdentification ? 'Correct' : 'Incorrect'}`,
      response,
    });

    console.log(`  ✓ ${testCase.name}: ${passed ? 'PASS' : 'FAIL'} (${score}/${maxScore}) - ${responseTime}ms`);
  }

  return results;
}

/**
 * Test 4: Medical Terminology Accuracy
 */
async function testMedicalTerminology(model: string): Promise<TestResult[]> {
  console.log(`\n[${model}] Testing Medical Terminology Accuracy...`);

  const testCases = [
    {
      name: 'Medical Abbreviations',
      question: 'What does the abbreviation "HTN" stand for in a clinical context?',
      expectedTerms: ['hypertension', 'high blood pressure'],
    },
    {
      name: 'Drug Classes',
      question: 'What drug class does lisinopril belong to?',
      expectedTerms: ['ACE inhibitor', 'angiotensin converting enzyme'],
    },
    {
      name: 'Lab Values',
      question: 'What does an elevated HbA1c indicate?',
      expectedTerms: ['diabetes', 'glycemic control', 'blood sugar', 'glucose'],
    },
  ];

  const results: TestResult[] = [];

  for (const testCase of testCases) {
    const { response, tokensUsed, responseTime } = await ollamaClient.generate(
      model,
      testCase.question
    );

    // Score the response
    let score = 0;
    for (const term of testCase.expectedTerms) {
      if (response.toLowerCase().includes(term.toLowerCase())) {
        score++;
        break; // Only count once if any expected term is found
      }
    }

    const passed = score > 0;

    results.push({
      testName: `Medical Terminology: ${testCase.name}`,
      model,
      passed,
      score: passed ? 100 : 0,
      responseTime,
      tokensUsed,
      details: `Found expected terminology: ${passed ? 'Yes' : 'No'}`,
      response,
    });

    console.log(`  ✓ ${testCase.name}: ${passed ? 'PASS' : 'FAIL'} - ${responseTime}ms`);
  }

  return results;
}

/**
 * Calculate performance metrics
 */
function calculateMetrics(results: TestResult[]): PerformanceMetrics {
  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = totalTests - passedTests;

  const avgResponseTime =
    results.reduce((sum, r) => sum + r.responseTime, 0) / totalTests;
  const avgTokens = results.reduce((sum, r) => sum + r.tokensUsed, 0) / totalTests;

  return {
    avgResponseTime: Math.round(avgResponseTime),
    avgTokens: Math.round(avgTokens),
    totalTests,
    passedTests,
    failedTests,
  };
}

/**
 * Run all tests for a model
 */
async function runTestSuite(model: string): Promise<TestSuiteResults> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`  TESTING MODEL: ${model.toUpperCase()}`);
  console.log(`${'='.repeat(80)}`);

  const allResults: TestResult[] = [];

  // Run all test categories
  const qaResults = await testMedicalQA(model);
  const entityResults = await testEntityExtraction(model);
  const planResults = await testTreatmentPlanAnalysis(model);
  const termResults = await testMedicalTerminology(model);

  allResults.push(...qaResults, ...entityResults, ...planResults, ...termResults);

  const metrics = calculateMetrics(allResults);

  return {
    model,
    results: allResults,
    metrics,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Compare two model results
 */
function compareModels(meditronResults: TestSuiteResults, llamaResults: TestSuiteResults) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`  MODEL COMPARISON: MEDITRON vs LLAMA3`);
  console.log(`${'='.repeat(80)}\n`);

  console.log('Performance Metrics:');
  console.log('-'.repeat(80));
  console.log(`Metric                  | Meditron      | Llama3        | Winner`);
  console.log('-'.repeat(80));

  const comparisons = [
    {
      metric: 'Pass Rate',
      meditron: `${((meditronResults.metrics.passedTests / meditronResults.metrics.totalTests) * 100).toFixed(1)}%`,
      llama: `${((llamaResults.metrics.passedTests / llamaResults.metrics.totalTests) * 100).toFixed(1)}%`,
      winner:
        meditronResults.metrics.passedTests > llamaResults.metrics.passedTests
          ? 'Meditron'
          : 'Llama3',
    },
    {
      metric: 'Avg Response Time',
      meditron: `${meditronResults.metrics.avgResponseTime}ms`,
      llama: `${llamaResults.metrics.avgResponseTime}ms`,
      winner:
        meditronResults.metrics.avgResponseTime < llamaResults.metrics.avgResponseTime
          ? 'Meditron'
          : 'Llama3',
    },
    {
      metric: 'Avg Tokens',
      meditron: `${meditronResults.metrics.avgTokens}`,
      llama: `${llamaResults.metrics.avgTokens}`,
      winner:
        meditronResults.metrics.avgTokens < llamaResults.metrics.avgTokens
          ? 'Meditron'
          : 'Llama3',
    },
    {
      metric: 'Tests Passed',
      meditron: `${meditronResults.metrics.passedTests}/${meditronResults.metrics.totalTests}`,
      llama: `${llamaResults.metrics.passedTests}/${llamaResults.metrics.totalTests}`,
      winner:
        meditronResults.metrics.passedTests > llamaResults.metrics.passedTests
          ? 'Meditron'
          : 'Llama3',
    },
  ];

  for (const comp of comparisons) {
    console.log(
      `${comp.metric.padEnd(23)} | ${comp.meditron.padEnd(13)} | ${comp.llama.padEnd(13)} | ${comp.winner}`
    );
  }

  console.log('-'.repeat(80));

  // Calculate overall winner
  const meditronWins = comparisons.filter((c) => c.winner === 'Meditron').length;
  const llamaWins = comparisons.filter((c) => c.winner === 'Llama3').length;

  console.log(`\nOverall Winner: ${meditronWins > llamaWins ? 'Meditron' : 'Llama3'} (${Math.max(meditronWins, llamaWins)}/${comparisons.length} categories)\n`);

  // Category breakdown
  console.log('Category Breakdown:');
  console.log('-'.repeat(80));

  const categories = ['Medical Q&A', 'Entity Extraction', 'Treatment Analysis', 'Medical Terminology'];

  for (const category of categories) {
    const meditronCategoryResults = meditronResults.results.filter((r) =>
      r.testName.includes(category)
    );
    const llamaCategoryResults = llamaResults.results.filter((r) =>
      r.testName.includes(category)
    );

    const meditronPassRate =
      (meditronCategoryResults.filter((r) => r.passed).length /
        meditronCategoryResults.length) *
      100;
    const llamaPassRate =
      (llamaCategoryResults.filter((r) => r.passed).length / llamaCategoryResults.length) * 100;

    console.log(
      `${category.padEnd(25)} | Meditron: ${meditronPassRate.toFixed(0)}% | Llama3: ${llamaPassRate.toFixed(0)}% | Winner: ${meditronPassRate > llamaPassRate ? 'Meditron' : 'Llama3'}`
    );
  }

  console.log('-'.repeat(80));
}

/**
 * Generate test report
 */
function generateReport(results: TestSuiteResults) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`  DETAILED TEST REPORT: ${results.model.toUpperCase()}`);
  console.log(`${'='.repeat(80)}\n`);

  console.log(`Timestamp: ${results.timestamp}`);
  console.log(`Total Tests: ${results.metrics.totalTests}`);
  console.log(`Passed: ${results.metrics.passedTests} (${((results.metrics.passedTests / results.metrics.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${results.metrics.failedTests} (${((results.metrics.failedTests / results.metrics.totalTests) * 100).toFixed(1)}%)`);
  console.log(`Avg Response Time: ${results.metrics.avgResponseTime}ms`);
  console.log(`Avg Tokens Used: ${results.metrics.avgTokens}`);

  console.log(`\n${'─'.repeat(80)}\n`);

  // Group by pass/fail
  const passed = results.results.filter((r) => r.passed);
  const failed = results.results.filter((r) => !r.passed);

  if (passed.length > 0) {
    console.log(`✓ PASSED TESTS (${passed.length}):\n`);
    for (const test of passed) {
      console.log(`  ✓ ${test.testName}`);
      console.log(`    Score: ${test.score.toFixed(1)}% | Time: ${test.responseTime}ms | Tokens: ${test.tokensUsed}`);
      console.log(`    ${test.details}\n`);
    }
  }

  if (failed.length > 0) {
    console.log(`✗ FAILED TESTS (${failed.length}):\n`);
    for (const test of failed) {
      console.log(`  ✗ ${test.testName}`);
      console.log(`    Score: ${test.score.toFixed(1)}% | Time: ${test.responseTime}ms | Tokens: ${test.tokensUsed}`);
      console.log(`    ${test.details}`);
      console.log(`    Response preview: ${test.response?.substring(0, 200)}...\n`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                     MEDITRON INTEGRATION TESTS                                ║');
  console.log('║                Medical Reasoning Capability Validation                        ║');
  console.log('╚═══════════════════════════════════════════════════════════════════════════════╝\n');

  // Check model availability
  console.log('Checking model availability...');
  const meditronAvailable = await ollamaClient.checkModelAvailability('meditron');
  const llama3Available = await ollamaClient.checkModelAvailability('llama3');

  console.log(`  Meditron: ${meditronAvailable ? '✓ Available' : '✗ Not found'}`);
  console.log(`  Llama3:   ${llama3Available ? '✓ Available' : '✗ Not found'}\n`);

  if (!meditronAvailable) {
    console.error('ERROR: Meditron model not found. Please install it first:');
    console.error('  ollama pull meditron\n');
    process.exit(1);
  }

  // Run Meditron tests
  const meditronResults = await runTestSuite('meditron');
  generateReport(meditronResults);

  // Run Llama3 tests if available
  if (llama3Available) {
    const llamaResults = await runTestSuite('llama3');
    generateReport(llamaResults);

    // Compare results
    compareModels(meditronResults, llamaResults);
  } else {
    console.log('\n⚠️  Llama3 not available for comparison. Install with: ollama pull llama3\n');
  }

  // Final summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('  SUMMARY');
  console.log(`${'='.repeat(80)}\n`);

  const overallPassRate =
    (meditronResults.metrics.passedTests / meditronResults.metrics.totalTests) * 100;

  if (overallPassRate >= 80) {
    console.log('✅ EXCELLENT: Meditron shows strong medical reasoning capabilities (≥80% pass rate)');
  } else if (overallPassRate >= 60) {
    console.log('⚠️  ACCEPTABLE: Meditron shows adequate medical reasoning (≥60% pass rate)');
  } else {
    console.log('❌ NEEDS IMPROVEMENT: Meditron performance below acceptable threshold (<60% pass rate)');
  }

  console.log(`\nOverall Pass Rate: ${overallPassRate.toFixed(1)}%`);
  console.log(`Total Tests: ${meditronResults.metrics.totalTests}`);
  console.log(`Passed: ${meditronResults.metrics.passedTests}`);
  console.log(`Failed: ${meditronResults.metrics.failedTests}`);
  console.log(`Average Response Time: ${meditronResults.metrics.avgResponseTime}ms`);
  console.log(`Average Tokens: ${meditronResults.metrics.avgTokens}\n`);

  console.log('Test completed successfully!\n');
}

// Run tests
main().catch((error) => {
  console.error('\n❌ Test execution failed:', error.message);
  process.exit(1);
});
