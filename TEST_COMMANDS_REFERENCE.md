# Testing Commands Reference

Quick reference for all testing commands available in the Avon Health RAG System.

---

## 📋 Basic Test Commands

All commands should be run from the `backend` directory:
```bash
cd /home/dangr/Avonhealthtest/backend
```

---

### 1. Run All Tests
```bash
npm test
```
**What it does**: Runs all test suites (unit, integration, and API tests)
**Requirements**:
- ✅ Ollama running (for integration tests)
- ⚠️  PostgreSQL (optional - some tests will skip without it)
**Duration**: ~2-5 minutes
**Use when**: You want to verify everything works

---

### 2. Run Unit Tests Only
```bash
npm run test:unit
```
**What it does**: Runs only unit tests (individual service functions)
**Requirements**:
- ✅ None (fully isolated with mocks)
**Duration**: ~5-15 seconds
**Use when**:
- Quick verification during development
- CI/CD pipelines
- PostgreSQL not available

**Example output**:
```
PASS tests/unit/test-data-generator.test.ts
PASS tests/unit/evaluation-metrics.test.ts
✓ All unit tests passed
```

---

### 3. Run Integration Tests
```bash
npm run test:integration
```
**What it does**: Tests complete workflows with real services
**Requirements**:
- ✅ Ollama running on localhost:11434
- ✅ Models installed (meditron, nomic-embed-text)
- ⚠️  PostgreSQL (for FAISS metadata storage)
**Duration**: ~1-3 minutes
**Use when**: Verifying Ollama RAG pipeline works end-to-end

**What's tested**:
- Embedding generation (nomic-embed-text)
- LLM generation (meditron)
- FAISS vector search
- Complete RAG pipeline
- Performance benchmarks

---

### 4. Run API Tests
```bash
npm run test:api
```
**What it does**: Tests REST API endpoints
**Requirements**:
- ✅ Ollama running
- ✅ PostgreSQL (optional)
**Duration**: ~30-60 seconds
**Use when**: Verifying API endpoints work correctly

**What's tested**:
- Query endpoint
- Health check endpoint
- Request/response validation
- Error handling

---

### 5. Run Tests in Watch Mode
```bash
npm run test:watch
```
**What it does**: Runs tests and re-runs on file changes
**Requirements**: Same as `npm test`
**Duration**: Continuous
**Use when**: Active development - auto-runs tests as you code

**Features**:
- Press `a` to run all tests
- Press `f` to run only failed tests
- Press `p` to filter by filename
- Press `t` to filter by test name
- Press `q` to quit

---

### 6. Run Tests with Coverage
```bash
npm run test:coverage
```
**What it does**: Runs all tests and generates coverage report
**Requirements**: Same as `npm test`
**Duration**: ~2-5 minutes
**Output**: Coverage report in `coverage/` directory

**Example output**:
```
-------------------|---------|----------|---------|---------|-------------------
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |   78.45 |    72.33 |   81.22 |   78.91 |
 services/         |   82.11 |    75.44 |   84.33 |   82.56 |
  llm.service.ts   |   95.23 |    88.88 |   100   |   95.12 | 45-47
  ...              |    ...  |     ...  |    ...  |    ...  |
-------------------|---------|----------|---------|---------|-------------------
```

**View HTML report**:
```bash
# After running test:coverage
open coverage/lcov-report/index.html  # Mac
xdg-open coverage/lcov-report/index.html  # Linux
```

---

## 🚀 Advanced Test Commands

### 7. Run Specific Test File
```bash
# Run specific test file
npm test -- ollama-rag.test.ts

# Run specific test suite
npm test -- --testNamePattern="Embedding Generation"

# Run specific test case
npm test -- -t "should generate single embedding"
```

---

### 8. Run Tests with Verbose Output
```bash
npm test -- --verbose

# Show all test details
npm test -- --verbose --no-coverage
```

---

### 9. Run Tests in Silent Mode
```bash
npm test -- --silent

# Only show failures
npm test -- --silent --onlyFailures
```

---

### 10. Run Tests with Specific Timeout
```bash
# Set timeout to 2 minutes per test
npm test -- --testTimeout=120000
```

---

## 🔬 Specialized Test Scripts

### 11. Test Meditron Model Directly
```bash
npm run test:meditron
```
**What it does**: Directly tests the meditron medical LLM
**Requirements**:
- ✅ Ollama running
- ✅ meditron model installed
**Use when**: Verifying meditron model works

---

### 12. End-to-End RAG Pipeline Test
```bash
npx tsx scripts/final-ollama-test.ts
```
**What it does**: Comprehensive 10-step RAG pipeline validation
**Requirements**:
- ✅ Ollama running
- ✅ meditron & nomic-embed-text installed
- ✅ PostgreSQL installed and running
- ✅ Avon Health API credentials
**Duration**: ~1-2 minutes

**10-Step Pipeline**:
1. Ollama health check
2. Fetch real medical data (Avon Health API)
3. Normalize artifacts
4. Generate embeddings (Ollama)
5. Index in FAISS
6. Query embedding generation
7. Retrieve relevant documents
8. Generate answer (meditron)
9. Validate citations
10. Performance check

**Example output**:
```
================================================================================
                        FINAL TEST REPORT
================================================================================
Overall Status: ✅ PASS

STEPS SUMMARY:
  Total: 14
  Passed: 14
  Failed: 0

PERFORMANCE METRICS:
  Embedding: 1.2s
  LLM Generation: 18.3s
  Total: 50.3s

HIPAA COMPLIANCE:
  Local Processing Only: ✅
  Ollama Validated: ✅
```

---

### 13. Compare Provider Performance (Historical)
```bash
npm run compare-providers
```
**Note**: This was used during development to compare OpenAI vs Ollama
**Current status**: Ollama-only system (HIPAA compliant)

---

## 📚 Example Scripts

### 14. Run LLM Examples
```bash
npx tsx src/examples/llm.example.ts
```
**What it does**: Demonstrates LLM service usage
**Shows**:
- Configuration
- Extraction (temp=0)
- Summarization (temp=0.3)
- Retry logic
- Token usage monitoring
- Error handling

---

### 15. Run Embedding Examples
```bash
npx tsx src/examples/embedding.example.ts
```
**What it does**: Demonstrates embedding generation
**Shows**:
- Single embedding generation
- Batch embedding generation
- Performance benchmarks

---

### 16. Run Answer Generation Examples
```bash
npx tsx src/examples/answer-generation-agent.example.ts
```
**What it does**: Demonstrates complete answer generation
**Shows**:
- Complete answer generation
- Validation
- Provenance checking
- Citation validation

---

### 17. Run All Examples
```bash
# Run all 54+ example files
for file in src/examples/*.example.ts; do
  echo "Running $file..."
  npx tsx "$file"
done
```

---

## 🐛 Debug Commands

### 18. Run Tests with Debug Mode
```bash
# Enable Node.js debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# Run with DEBUG environment variable
DEBUG=* npm test
```

---

### 19. Run Tests with Specific Node Options
```bash
# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm test

# Enable source maps
NODE_OPTIONS="--enable-source-maps" npm test
```

---

### 20. Check Test Files
```bash
# List all test files
find tests -name "*.test.ts"

# Count test files by type
echo "Unit tests: $(find tests/unit -name "*.test.ts" | wc -l)"
echo "Integration tests: $(find tests/integration -name "*.test.ts" | wc -l)"
echo "API tests: $(find tests/api -name "*.test.ts" | wc -l)"
```

---

## 📊 Jest CLI Options

### Useful Jest Flags

```bash
# Run tests in parallel (default)
npm test -- --maxWorkers=4

# Run tests sequentially (useful for debugging)
npm test -- --runInBand

# Update snapshots
npm test -- --updateSnapshot

# Detect open handles (memory leaks)
npm test -- --detectOpenHandles

# Force exit after tests
npm test -- --forceExit

# Clear cache before running
npm test -- --clearCache

# List all tests without running
npm test -- --listTests

# Bail after first failure
npm test -- --bail

# Run failed tests from last run
npm test -- --onlyFailures

# Show test execution time
npm test -- --verbose --testTimeout=10000
```

---

## 🎯 Testing Workflow Examples

### Development Workflow
```bash
# 1. Start with unit tests (fast feedback)
npm run test:unit

# 2. Run watch mode while coding
npm run test:watch

# 3. Run integration tests before commit
npm run test:integration

# 4. Run full test suite
npm test

# 5. Check coverage
npm run test:coverage
```

---

### CI/CD Workflow
```bash
# 1. Type check
npm run type-check

# 2. Run unit tests (no external dependencies)
npm run test:unit -- --ci --coverage

# 3. Run integration tests (if Ollama available)
npm run test:integration -- --ci
```

---

### Pre-Deployment Workflow
```bash
# 1. Full test suite with coverage
npm run test:coverage

# 2. End-to-end validation
npx tsx scripts/final-ollama-test.ts

# 3. Build check
npm run build

# 4. Type check
npm run type-check
```

---

## 🔍 Quick Reference Table

| Command | Speed | Requirements | Use Case |
|---------|-------|--------------|----------|
| `npm test` | Medium | Ollama | All tests |
| `npm run test:unit` | Fast | None | Quick validation |
| `npm run test:integration` | Slow | Ollama + PostgreSQL | Full pipeline test |
| `npm run test:api` | Medium | Ollama | API endpoint tests |
| `npm run test:watch` | Continuous | Same as test | Development |
| `npm run test:coverage` | Medium | Same as test | Coverage report |
| `npx tsx scripts/final-ollama-test.ts` | Slow | Ollama + PostgreSQL + Avon API | E2E validation |

---

## ⚡ Performance Tips

### Speed Up Tests

```bash
# Run in parallel (default, but can specify workers)
npm test -- --maxWorkers=4

# Run only changed tests
npm test -- --onlyChanged

# Skip coverage for faster runs
npm test -- --no-coverage

# Run unit tests only (fastest)
npm run test:unit
```

### Reduce Memory Usage

```bash
# Run sequentially
npm test -- --runInBand

# Limit workers
npm test -- --maxWorkers=2

# Clear cache
npm test -- --clearCache && npm test
```

---

## 📝 Common Patterns

### Run Specific Test Suites
```bash
# Ollama integration tests only
npm test -- ollama-rag.test.ts

# Query tests only
npm test -- query.test.ts

# All embedding-related tests
npm test -- -t "embedding"
```

### Debug Failing Tests
```bash
# Run with verbose output
npm test -- --verbose --no-coverage

# Run only failed tests
npm test -- --onlyFailures

# Run specific test with debug
npm test -- -t "should generate embedding" --verbose
```

### Generate Reports
```bash
# Coverage report
npm run test:coverage
open coverage/lcov-report/index.html

# JSON output for CI
npm test -- --json --outputFile=test-results.json

# JUnit XML for CI
npm test -- --reporters=default --reporters=jest-junit
```

---

## 🎓 Learning Resources

### Explore Test Examples
```bash
# See what tests exist
ls -la tests/

# Read test structure
cat tests/integration/ollama-rag.test.ts | less

# Run example to understand patterns
npx tsx src/examples/llm.example.ts
```

### Check Test Configuration
```bash
# View Jest config
cat jest.config.js

# View test environment
cat .env.test

# Check test helpers
cat tests/helpers/test-helpers.ts
```

---

## 🚨 Troubleshooting Commands

```bash
# Verify Ollama is running
curl http://localhost:11434/api/tags

# Check Ollama models
export PATH="$HOME/ollama-bin:$PATH"
ollama list

# Verify PostgreSQL
psql -U postgres -d avonhealth_test -c "SELECT 1;"

# Check environment variables
cat .env.test | grep -E "OLLAMA|EMBEDDING|LLM"

# Clear Jest cache
npm test -- --clearCache

# Reinstall dependencies
rm -rf node_modules
npm install
```

---

## 📖 Documentation Links

- **Full Testing Guide**: See `TESTING_GUIDE.md` for comprehensive documentation
- **Setup Guide**: See `TESTING_SETUP_COMPLETE.md` for environment setup
- **Implementation Details**: See `backend/IMPLEMENTATION.md` for architecture

---

**Quick Start**:
```bash
cd backend
npm run test:unit      # Start here (fastest, no dependencies)
npm run test:integration   # Then try this (requires Ollama)
npm test               # Finally run everything
```

Happy Testing! 🚀
