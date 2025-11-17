/**
 * Ollama Health Check Script
 *
 * Verifies Ollama installation and configuration for Avon Health RAG system.
 *
 * Usage: npx tsx scripts/check-ollama.ts
 *
 * Exit codes:
 * - 0: All checks passed
 * - 1: Ollama not running or critical issues
 */

import axios from 'axios';

// Configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const REQUIRED_EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';
const REQUIRED_LLM_MODEL = process.env.OLLAMA_LLM_MODEL || 'meditron';
const EXPECTED_EMBEDDING_DIMENSIONS = parseInt(process.env.OLLAMA_EMBEDDING_DIMENSIONS || '768', 10);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Test results
interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  details?: string;
  duration?: number;
}

const results: TestResult[] = [];

/**
 * Print colored output
 */
function print(text: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${text}${colors.reset}`);
}

/**
 * Print section header
 */
function printHeader(title: string): void {
  console.log('');
  print('═'.repeat(80), 'cyan');
  print(title, 'bright');
  print('═'.repeat(80), 'cyan');
  console.log('');
}

/**
 * Print test result
 */
function printResult(result: TestResult): void {
  const icon = result.passed ? '✅' : '❌';
  const color = result.passed ? 'green' : 'red';

  print(`${icon} ${result.name}`, color);

  if (result.message) {
    print(`   ${result.message}`, 'reset');
  }

  if (result.details) {
    print(`   ${result.details}`, 'reset');
  }

  if (result.duration !== undefined) {
    print(`   Duration: ${result.duration}ms`, 'reset');
  }

  console.log('');
}

/**
 * Check 1: Verify Ollama service is running
 */
async function checkOllamaService(): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5000,
    });

    const duration = Date.now() - startTime;

    if (response.status === 200) {
      return {
        name: 'Ollama Service Running',
        passed: true,
        message: `Service is healthy and responding`,
        details: `API endpoint: ${OLLAMA_BASE_URL}`,
        duration,
      };
    } else {
      return {
        name: 'Ollama Service Running',
        passed: false,
        message: `Unexpected response status: ${response.status}`,
        duration,
      };
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;

    if (error.code === 'ECONNREFUSED') {
      return {
        name: 'Ollama Service Running',
        passed: false,
        message: 'Connection refused - Ollama is not running',
        details: `Please start Ollama: ollama serve`,
        duration,
      };
    } else if (error.code === 'ETIMEDOUT') {
      return {
        name: 'Ollama Service Running',
        passed: false,
        message: 'Connection timeout - Ollama may be unresponsive',
        duration,
      };
    } else {
      return {
        name: 'Ollama Service Running',
        passed: false,
        message: `Error: ${error.message}`,
        duration,
      };
    }
  }
}

/**
 * Check 2: Get Ollama version
 */
async function checkOllamaVersion(): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/version`, {
      timeout: 5000,
    });

    const duration = Date.now() - startTime;
    const version = response.data.version || 'unknown';

    return {
      name: 'Ollama Version',
      passed: true,
      message: `Version: ${version}`,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    return {
      name: 'Ollama Version',
      passed: false,
      message: `Could not retrieve version: ${error.message}`,
      duration,
    };
  }
}

/**
 * Check 3: List installed models
 */
async function checkInstalledModels(): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5000,
    });

    const duration = Date.now() - startTime;
    const models = response.data.models || [];

    if (models.length === 0) {
      return {
        name: 'Installed Models',
        passed: false,
        message: 'No models installed',
        details: `Install models: ollama pull ${REQUIRED_EMBEDDING_MODEL} && ollama pull ${REQUIRED_LLM_MODEL}`,
        duration,
      };
    }

    const modelList = models.map((m: any) => {
      const sizeInGB = (m.size / (1024 * 1024 * 1024)).toFixed(2);
      return `   - ${m.name} (${sizeInGB} GB)`;
    }).join('\n');

    return {
      name: 'Installed Models',
      passed: true,
      message: `Found ${models.length} model(s):`,
      details: modelList,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    return {
      name: 'Installed Models',
      passed: false,
      message: `Could not list models: ${error.message}`,
      duration,
    };
  }
}

/**
 * Check 4: Verify required embedding model is installed
 */
async function checkEmbeddingModel(): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5000,
    });

    const duration = Date.now() - startTime;
    const models = response.data.models || [];

    const embeddingModel = models.find((m: any) =>
      m.name === REQUIRED_EMBEDDING_MODEL ||
      m.name === `${REQUIRED_EMBEDDING_MODEL}:latest`
    );

    if (embeddingModel) {
      const sizeInMB = (embeddingModel.size / (1024 * 1024)).toFixed(0);

      return {
        name: 'Required Embedding Model',
        passed: true,
        message: `${REQUIRED_EMBEDDING_MODEL} is installed`,
        details: `Size: ${sizeInMB} MB`,
        duration,
      };
    } else {
      return {
        name: 'Required Embedding Model',
        passed: false,
        message: `${REQUIRED_EMBEDDING_MODEL} not found`,
        details: `Install: ollama pull ${REQUIRED_EMBEDDING_MODEL}`,
        duration,
      };
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;

    return {
      name: 'Required Embedding Model',
      passed: false,
      message: `Error checking models: ${error.message}`,
      duration,
    };
  }
}

/**
 * Check 5: Verify required LLM model is installed
 */
async function checkLLMModel(): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 5000,
    });

    const duration = Date.now() - startTime;
    const models = response.data.models || [];

    const llmModel = models.find((m: any) =>
      m.name === REQUIRED_LLM_MODEL ||
      m.name === `${REQUIRED_LLM_MODEL}:latest`
    );

    if (llmModel) {
      const sizeInGB = (llmModel.size / (1024 * 1024 * 1024)).toFixed(2);

      return {
        name: 'Required LLM Model',
        passed: true,
        message: `${REQUIRED_LLM_MODEL} is installed`,
        details: `Size: ${sizeInGB} GB`,
        duration,
      };
    } else {
      // Check if llama3 is available as fallback
      const llama3Model = models.find((m: any) =>
        m.name.startsWith('llama3')
      );

      if (llama3Model) {
        return {
          name: 'Required LLM Model',
          passed: true,
          message: `${REQUIRED_LLM_MODEL} not found, but ${llama3Model.name} is available`,
          details: `Using fallback model. Install preferred: ollama pull ${REQUIRED_LLM_MODEL}`,
          duration,
        };
      } else {
        return {
          name: 'Required LLM Model',
          passed: false,
          message: `${REQUIRED_LLM_MODEL} not found`,
          details: `Install: ollama pull ${REQUIRED_LLM_MODEL}`,
          duration,
        };
      }
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;

    return {
      name: 'Required LLM Model',
      passed: false,
      message: `Error checking models: ${error.message}`,
      duration,
    };
  }
}

/**
 * Check 6: Test embedding generation
 */
async function testEmbeddingGeneration(): Promise<TestResult> {
  const startTime = Date.now();
  const testText = 'Patient presents with hypertension and type 2 diabetes';

  try {
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/embeddings`,
      {
        model: REQUIRED_EMBEDDING_MODEL,
        prompt: testText,
      },
      {
        timeout: 30000, // 30 seconds for first embedding (model loading)
      }
    );

    const duration = Date.now() - startTime;
    const embedding = response.data.embedding;

    if (!embedding || !Array.isArray(embedding)) {
      return {
        name: 'Embedding Generation',
        passed: false,
        message: 'Invalid embedding response format',
        duration,
      };
    }

    const dimensions = embedding.length;
    const dimensionsMatch = dimensions === EXPECTED_EMBEDDING_DIMENSIONS;

    if (!dimensionsMatch) {
      return {
        name: 'Embedding Generation',
        passed: false,
        message: `Embedding dimension mismatch`,
        details: `Expected: ${EXPECTED_EMBEDDING_DIMENSIONS}, Got: ${dimensions}`,
        duration,
      };
    }

    // Check if embedding values are reasonable
    const hasValidValues = embedding.some((v: number) => v !== 0);

    if (!hasValidValues) {
      return {
        name: 'Embedding Generation',
        passed: false,
        message: 'Embedding contains all zeros',
        duration,
      };
    }

    return {
      name: 'Embedding Generation',
      passed: true,
      message: `Successfully generated ${dimensions}-dimensional embedding`,
      details: `Response time: ${duration}ms (includes model loading)`,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    if (error.response?.status === 404) {
      return {
        name: 'Embedding Generation',
        passed: false,
        message: `Model not found: ${REQUIRED_EMBEDDING_MODEL}`,
        details: `Install: ollama pull ${REQUIRED_EMBEDDING_MODEL}`,
        duration,
      };
    } else if (error.code === 'ETIMEDOUT') {
      return {
        name: 'Embedding Generation',
        passed: false,
        message: 'Request timeout (model may be loading)',
        details: 'Try running the test again',
        duration,
      };
    } else {
      return {
        name: 'Embedding Generation',
        passed: false,
        message: `Error: ${error.message}`,
        duration,
      };
    }
  }
}

/**
 * Check 7: Test LLM generation
 */
async function testLLMGeneration(): Promise<TestResult> {
  const startTime = Date.now();
  const testPrompt = 'What is hypertension? Answer in one sentence.';

  try {
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: REQUIRED_LLM_MODEL,
        prompt: testPrompt,
        stream: false,
        options: {
          num_predict: 50, // Limit to 50 tokens for fast test
          temperature: 0.7,
        },
      },
      {
        timeout: 60000, // 60 seconds for LLM generation
      }
    );

    const duration = Date.now() - startTime;
    const generatedText = response.data.response;

    if (!generatedText || typeof generatedText !== 'string') {
      return {
        name: 'LLM Generation',
        passed: false,
        message: 'Invalid LLM response format',
        duration,
      };
    }

    if (generatedText.trim().length === 0) {
      return {
        name: 'LLM Generation',
        passed: false,
        message: 'LLM returned empty response',
        duration,
      };
    }

    // Check if response is reasonable (contains medical terms)
    const responsePreview = generatedText.substring(0, 100) + (generatedText.length > 100 ? '...' : '');

    return {
      name: 'LLM Generation',
      passed: true,
      message: `Successfully generated response`,
      details: `Preview: "${responsePreview}"\nResponse time: ${duration}ms`,
      duration,
    };
  } catch (error: any) {
    const duration = Date.now() - startTime;

    if (error.response?.status === 404) {
      return {
        name: 'LLM Generation',
        passed: false,
        message: `Model not found: ${REQUIRED_LLM_MODEL}`,
        details: `Install: ollama pull ${REQUIRED_LLM_MODEL}`,
        duration,
      };
    } else if (error.code === 'ETIMEDOUT') {
      return {
        name: 'LLM Generation',
        passed: false,
        message: 'Request timeout (model may be loading or slow)',
        details: 'Consider using GPU acceleration for better performance',
        duration,
      };
    } else {
      return {
        name: 'LLM Generation',
        passed: false,
        message: `Error: ${error.message}`,
        duration,
      };
    }
  }
}

/**
 * Print summary of all tests
 */
function printSummary(results: TestResult[]): void {
  printHeader('TEST SUMMARY');

  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  const allPassed = passedCount === totalCount;

  if (allPassed) {
    print(`✅ All ${totalCount} checks passed!`, 'green');
    print('', 'reset');
    print('Ollama is ready for use with Avon Health RAG system.', 'green');
  } else {
    print(`❌ ${totalCount - passedCount} of ${totalCount} checks failed`, 'red');
    print('', 'reset');
    print('Please fix the issues above before proceeding.', 'yellow');
  }

  console.log('');

  // Print next steps
  if (!allPassed) {
    printHeader('NEXT STEPS');

    const failedTests = results.filter(r => !r.passed);

    if (failedTests.some(t => t.name === 'Ollama Service Running')) {
      print('1. Start Ollama service:', 'yellow');
      print('   ollama serve', 'reset');
      print('', 'reset');
    }

    if (failedTests.some(t => t.name.includes('Model'))) {
      print('2. Install required models:', 'yellow');
      print(`   ollama pull ${REQUIRED_EMBEDDING_MODEL}`, 'reset');
      print(`   ollama pull ${REQUIRED_LLM_MODEL}`, 'reset');
      print('', 'reset');
    }

    print('3. Re-run this health check:', 'yellow');
    print('   npx tsx scripts/check-ollama.ts', 'reset');
    print('', 'reset');

    print('For detailed setup instructions, see:', 'yellow');
    print('   backend/OLLAMA_SETUP.md', 'reset');
    console.log('');
  } else {
    printHeader('NEXT STEPS');

    print('✅ Ollama is fully configured and ready!', 'green');
    print('', 'reset');
    print('Continue with Phase 2 of Ollama implementation:', 'cyan');
    print('   Prompt 2.1: Ollama Embedding Service', 'reset');
    print('   Prompt 2.2: Embedding Factory', 'reset');
    console.log('');
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  // Print header
  printHeader('Ollama Health Check - Avon Health RAG System');

  print('Configuration:', 'cyan');
  print(`  Ollama URL: ${OLLAMA_BASE_URL}`, 'reset');
  print(`  Required Embedding Model: ${REQUIRED_EMBEDDING_MODEL}`, 'reset');
  print(`  Required LLM Model: ${REQUIRED_LLM_MODEL}`, 'reset');
  print(`  Expected Embedding Dimensions: ${EXPECTED_EMBEDDING_DIMENSIONS}`, 'reset');
  console.log('');

  // Run all checks
  printHeader('RUNNING HEALTH CHECKS');

  // Check 1: Ollama service
  const serviceResult = await checkOllamaService();
  results.push(serviceResult);
  printResult(serviceResult);

  if (!serviceResult.passed) {
    // If Ollama is not running, skip remaining tests
    print('⚠️  Skipping remaining tests (Ollama not running)', 'yellow');
    console.log('');
    printSummary(results);
    process.exit(1);
  }

  // Check 2: Version
  const versionResult = await checkOllamaVersion();
  results.push(versionResult);
  printResult(versionResult);

  // Check 3: Installed models
  const modelsResult = await checkInstalledModels();
  results.push(modelsResult);
  printResult(modelsResult);

  // Check 4: Embedding model
  const embeddingModelResult = await checkEmbeddingModel();
  results.push(embeddingModelResult);
  printResult(embeddingModelResult);

  // Check 5: LLM model
  const llmModelResult = await checkLLMModel();
  results.push(llmModelResult);
  printResult(llmModelResult);

  // Check 6: Test embedding generation (only if model is installed)
  if (embeddingModelResult.passed) {
    print('⏳ Testing embedding generation (may take 10-30s for first run)...', 'yellow');
    const embeddingTestResult = await testEmbeddingGeneration();
    results.push(embeddingTestResult);
    printResult(embeddingTestResult);
  } else {
    print('⚠️  Skipping embedding generation test (model not installed)', 'yellow');
    console.log('');
  }

  // Check 7: Test LLM generation (only if model is installed)
  if (llmModelResult.passed) {
    print('⏳ Testing LLM generation (may take 30-60s for first run)...', 'yellow');
    const llmTestResult = await testLLMGeneration();
    results.push(llmTestResult);
    printResult(llmTestResult);
  } else {
    print('⚠️  Skipping LLM generation test (model not installed)', 'yellow');
    console.log('');
  }

  // Print summary
  printSummary(results);

  // Exit with appropriate code
  const allPassed = results.every(r => r.passed);
  process.exit(allPassed ? 0 : 1);
}

// Run main function
main().catch((error) => {
  console.error('');
  print('═'.repeat(80), 'red');
  print('FATAL ERROR', 'red');
  print('═'.repeat(80), 'red');
  console.error('');
  console.error(error);
  console.error('');
  process.exit(1);
});
