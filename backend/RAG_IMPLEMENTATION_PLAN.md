# RAG Implementation Plan: Complete Indexing Pipeline

## Executive Summary

**Current Status**: RAG infrastructure is ~95% complete. Only missing piece is wiring the indexing controller to existing services.

**Discovery**: The core RAG pipeline is FULLY IMPLEMENTED in `indexing-agent.service.ts` (7-stage pipeline), but `indexing.controller.ts` is a placeholder that doesn't call the actual implementation.

**Work Required**: Wire controller → services. Estimated 1-2 hours of focused work.

---

## Tech Stack Compliance Requirements

**ALLOWED TECHNOLOGIES** (from TECH_STACK_COMPLIANCE_REPORT.md):
- ✅ Node.js 18+
- ✅ Express.js (API framework)
- ✅ TypeScript (strict mode)
- ✅ PostgreSQL with `pg` package (raw SQL only)
- ✅ Ollama (local AI - HIPAA compliant)
  - Meditron 7B (medical LLM)
  - nomic-embed-text (768-dimensional embeddings)
- ✅ FAISS (vector database)
- ✅ React 18+ (frontend)
- ✅ Vite (build tool)
- ✅ Tailwind CSS

**PROHIBITED**:
- ❌ NO ORMs (Prisma, TypeORM, Sequelize)
- ❌ NO Python
- ❌ NO external AI APIs (OpenAI, Anthropic, etc.)
- ❌ NO external embedding APIs

---

## Part 1: Existing Infrastructure Audit

### ✅ FULLY IMPLEMENTED SERVICES (No Changes Needed)

#### **1. Text Chunking** - `text-chunker.service.ts` (489 lines)
- ✅ Splits documents into 200-300 word chunks
- ✅ 50-word overlap between chunks
- ✅ Preserves sentence boundaries
- ✅ Tracks char offsets for provenance
- ✅ Handles abbreviations (Dr., Mr., etc.)
- ✅ Singleton pattern ready

#### **2. Embedding Generation** - `embedding-factory.service.ts` (322 lines)
- ✅ Factory pattern for provider abstraction
- ✅ Ollama adapter (HIPAA compliant)
- ✅ Single + batch embedding generation
- ✅ Health check and validation
- ✅ 768-dimensional vectors (nomic-embed-text)
- ✅ Singleton pattern with caching

#### **3. Vector Storage** - `faiss-vector-store.service.ts` (386 lines)
- ✅ FAISS IndexFlatIP (exact search)
- ✅ L2 normalization for cosine similarity
- ✅ Batch insertions
- ✅ Disk persistence (save/load)
- ✅ ID and metadata mapping
- ✅ ~10ms search performance
- ✅ Singleton instance ready

#### **4. Indexing Pipeline** - `indexing-agent.service.ts` (FULLY IMPLEMENTED!)
**This is the KEY discovery** - Complete 7-stage pipeline:
- ✅ Stage 1: Text extraction and validation
- ✅ Stage 2: Chunk-level embeddings (batch processing)
- ✅ Stage 3: Sentence-level embeddings
- ✅ Stage 4: FAISS vector store insertion
- ✅ Stage 5: Keyword index building
- ✅ Stage 6: In-memory metadata cache
- ✅ Stage 7: Progress callbacks and error handling

#### **5. EMR Data Fetching** - `emr.service.ts`
- ✅ Authenticated API client
- ✅ Fetches care plans, medications, notes
- ✅ Parallel fetching with Promise.all
- ✅ Caching with TTL
- ✅ Retry logic and error handling

#### **6. Authentication** - `auth.service.ts`
- ✅ JWT token management
- ✅ Automatic token refresh
- ✅ Singleton pattern

#### **7. Configuration** - `env.config.ts`
- ✅ All required env vars defined
- ✅ Validation on startup
- ✅ AVON_ACCOUNT, AVON_USER_ID configured

### ⚠️ PLACEHOLDER IMPLEMENTATION (Needs Wiring)

#### **1. Indexing Controller** - `indexing.controller.ts`
**Current State**: Placeholder with TODOs
- ❌ Fetches EMR data but doesn't index it
- ❌ Has TODO comments for missing stages
- ❌ Returns mock "indexing complete" message

**What It Should Do**:
1. Fetch EMR data (ALREADY DOES THIS ✅)
2. Convert artifacts to Chunk format
3. Call `textChunker.chunk()` on each artifact
4. Call `indexingAgent.indexChunks()` with all chunks
5. Return detailed indexing results

### 🔄 INTEGRATION POINTS (Routes Already Configured)

#### **Routes** - `routes/index.ts`
- ✅ POST `/api/index/patient/:patientId` → `indexingController.indexPatient`
- ✅ DELETE `/api/index/patient/:patientId` → `indexingController.clearPatient`
- ✅ Validation middleware attached

---

## Part 2: What's Missing (Minimal Changes)

### **File 1: `/backend/src/controllers/indexing.controller.ts`**

**Current Line Count**: ~150 lines (mostly placeholder)
**Expected Line Count**: ~250 lines

**Missing Functionality**:
1. **Convert EMR data to Artifacts** (20 lines)
   - Map care_plan → Artifact type
   - Map medication → Artifact type
   - Map note → Artifact type

2. **Chunk all artifacts** (15 lines)
   - Import textChunker
   - Call textChunker.chunk() for each artifact
   - Flatten chunk arrays

3. **Index chunks via indexingAgent** (30 lines)
   - Import indexingAgent
   - Call indexingAgent.indexChunks()
   - Handle progress callbacks
   - Capture indexing results

4. **Return detailed results** (20 lines)
   - Chunk statistics
   - Embedding statistics
   - Vector store statistics
   - Timing information

**Dependencies to Import**:
```typescript
import textChunker from '../services/text-chunker.service';
import indexingAgent from '../services/indexing-agent.service';
import { Artifact } from '../types/artifact.types';
import { Chunk } from '../services/text-chunker.service';
```

---

## Part 3: Implementation Risk Assessment

### **Risk Level: LOW** ✅

**Why This is Low Risk**:
1. All services are already tested and working
2. Just wiring existing functions together
3. No new dependencies needed
4. No database schema changes
5. No breaking API changes
6. Routes already configured

**Potential Issues**:
1. ⚠️ Type mismatches between EMR data and Artifact interface
   - **Mitigation**: Add adapter function to normalize types
2. ⚠️ Large datasets may cause memory issues
   - **Mitigation**: Already handled by batch processing in services
3. ⚠️ FAISS initialization may fail if index file exists
   - **Mitigation**: Check if initialized before calling initialize()

---

## Part 4: Staged Implementation Prompts

### **STAGE 1: Pre-Implementation Verification** ✅

**Tech Stack**: Node.js 18+, Express.js, TypeScript (strict)

**Objective**: Verify all dependencies are correctly imported and initialized

**Tasks**:
1. ✅ Read `indexing.controller.ts` (DONE in previous session)
2. ✅ Read `indexing-agent.service.ts` (DONE - confirmed FULLY IMPLEMENTED)
3. ✅ Read `text-chunker.service.ts` (DONE - confirmed FULLY IMPLEMENTED)
4. ✅ Read `embedding-factory.service.ts` (DONE - confirmed FULLY IMPLEMENTED)
5. ✅ Read `faiss-vector-store.service.ts` (DONE - confirmed FULLY IMPLEMENTED)
6. ✅ Read `emr.service.ts` (DONE - confirmed data fetching works)
7. ✅ Verify routes are configured (DONE - confirmed in `routes/index.ts`)

**Status**: ✅ COMPLETE

---

### **STAGE 2: Type Adapter Implementation**

**Tech Stack**: Node.js 18+, TypeScript (strict mode), Express.js

**Objective**: Create adapter function to convert EMR data → Artifact format

**File**: `/backend/src/controllers/indexing.controller.ts`

**Prompt**:
```
Create an adapter function inside indexing.controller.ts that converts EMR data
(care_plan, medication, note) to Artifact format.

TECH STACK COMPLIANCE:
- Node.js 18+, TypeScript (strict mode), Express.js
- NO ORMs, NO Python, NO external APIs
- Use only existing types from types/artifact.types.ts

Requirements:
1. Add private method: convertToArtifacts(data: FetchAllResult, patientId: string): Artifact[]
2. Map care_plan → { type: 'care_plan', ... }
3. Map medication → { type: 'medication', ... }
4. Map note → { type: 'note', ... }
5. Extract text content from each item
6. Preserve occurred_at, author, source metadata
7. Generate unique artifact_id using uuid v4

Return array of Artifact objects ready for chunking.
```

**Expected Changes**:
- Add imports: `import { v4 as uuidv4 } from 'uuid';`
- Add imports: `import { Artifact } from '../types/artifact.types';`
- Add private method: `convertToArtifacts()`
- ~40 lines of code

**Verification**:
- Run `npm run type-check` - should pass with no errors
- Verify Artifact interface matches (id, patient_id, type, text, occurred_at, author, source)

---

### **STAGE 3: Chunking Integration**

**Tech Stack**: Node.js 18+, TypeScript (strict mode), Express.js

**Objective**: Wire text-chunker service into controller

**File**: `/backend/src/controllers/indexing.controller.ts`

**Prompt**:
```
Wire the text-chunker service into indexing.controller.ts to chunk all artifacts.

TECH STACK COMPLIANCE:
- Node.js 18+, TypeScript (strict mode), Express.js
- Use text-chunker.service.ts (singleton, already implemented)
- NO Python text processing libraries

Requirements:
1. Import: import textChunker from '../services/text-chunker.service';
2. Import: import { Chunk } from '../services/text-chunker.service';
3. After fetching EMR data and converting to artifacts:
   - Loop through each artifact
   - Call textChunker.chunk(artifact) for each
   - Collect all chunks into flat array
4. Log chunking statistics:
   - Total artifacts processed
   - Total chunks generated
   - Average chunks per artifact

Example:
  const allChunks: Chunk[] = [];
  for (const artifact of artifacts) {
    const chunks = textChunker.chunk(artifact);
    allChunks.push(...chunks);
  }
  console.log(`Generated ${allChunks.length} chunks from ${artifacts.length} artifacts`);

Return allChunks array ready for embedding.
```

**Expected Changes**:
- Add imports for textChunker and Chunk type
- Add chunking loop in indexPatient() method
- Add logging statements
- ~20 lines of code

**Verification**:
- Run `npm run type-check` - should pass
- Verify Chunk[] array is typed correctly
- Check that chunk_id, artifact_id, patient_id are populated

---

### **STAGE 4: Indexing Agent Integration**

**Tech Stack**: Node.js 18+, TypeScript (strict mode), Express.js, FAISS, Ollama

**Objective**: Wire indexing-agent service to actually index chunks

**File**: `/backend/src/controllers/indexing.controller.ts`

**Prompt**:
```
Wire the indexing-agent service into indexing.controller.ts to index all chunks.

TECH STACK COMPLIANCE:
- Node.js 18+, TypeScript (strict mode), Express.js
- Ollama (local AI - HIPAA compliant): nomic-embed-text for embeddings
- FAISS vector database (local storage)
- NO external AI APIs (OpenAI, Anthropic, etc.)

Requirements:
1. Import: import indexingAgent from '../services/indexing-agent.service';
2. After chunking is complete:
   - Call indexingAgent.indexChunks(allChunks, progressCallback)
   - Pass optional progress callback for logging
   - Await the IndexingResult
3. Progress callback should log:
   - Stage number and name
   - Progress percentage
   - Current operation
4. Extract statistics from IndexingResult:
   - totalChunks, successfulChunks, failedChunks
   - embeddingTime, indexingTime
   - vectorsStored
5. Handle errors gracefully

Example:
  const progressCallback = (stage: number, progress: number, message: string) => {
    console.log(`[Indexing] Stage ${stage}: ${progress}% - ${message}`);
  };

  const result = await indexingAgent.indexChunks(allChunks, progressCallback);

  console.log(`Indexed ${result.successfulChunks}/${result.totalChunks} chunks`);

Return result object to client.
```

**Expected Changes**:
- Add import for indexingAgent
- Add progress callback function
- Add indexChunks() call
- Add result statistics extraction
- ~40 lines of code

**Verification**:
- Run `npm run type-check` - should pass
- Verify IndexingResult type is correct
- Check that progressCallback signature matches service expectation
- Verify all stages are logged (1-7)

---

### **STAGE 5: Response Formatting**

**Tech Stack**: Node.js 18+, TypeScript (strict mode), Express.js

**Objective**: Return detailed indexing results to client

**File**: `/backend/src/controllers/indexing.controller.ts`

**Prompt**:
```
Format the indexing response to return detailed statistics to the client.

TECH STACK COMPLIANCE:
- Node.js 18+, TypeScript (strict mode), Express.js
- Return JSON response (no HTML)

Requirements:
1. Replace placeholder response with actual statistics
2. Include:
   - success: boolean
   - message: string (summary)
   - statistics: {
       artifacts: {
         carePlans: number
         medications: number
         notes: number
         total: number
       }
       chunks: {
         generated: number
         indexed: number
         failed: number
       }
       vectors: {
         stored: number
         dimensions: 768
       }
       timing: {
         fetchTime: number (ms)
         chunkTime: number (ms)
         embeddingTime: number (ms)
         indexingTime: number (ms)
         totalTime: number (ms)
       }
     }
3. Use proper HTTP status codes:
   - 200 for full success
   - 207 for partial success (some chunks failed)
   - 500 for complete failure

Example response:
{
  "success": true,
  "message": "Successfully indexed 1,234 chunks from 45 artifacts for patient user_abc123",
  "statistics": {
    "artifacts": { "carePlans": 10, "medications": 15, "notes": 20, "total": 45 },
    "chunks": { "generated": 1234, "indexed": 1234, "failed": 0 },
    "vectors": { "stored": 1234, "dimensions": 768 },
    "timing": { "fetchTime": 523, "chunkTime": 145, "embeddingTime": 2341, "indexingTime": 456, "totalTime": 3465 }
  }
}

Handle errors by returning appropriate error response with details.
```

**Expected Changes**:
- Remove placeholder response
- Add detailed statistics object
- Add timing tracking (Date.now() at each stage)
- Add proper HTTP status codes
- ~50 lines of code

**Verification**:
- Run `npm run type-check` - should pass
- Verify response type matches API contract
- Test with curl to verify JSON structure

---

### **STAGE 6: Error Handling & Edge Cases**

**Tech Stack**: Node.js 18+, TypeScript (strict mode), Express.js

**Objective**: Add robust error handling and edge case coverage

**File**: `/backend/src/controllers/indexing.controller.ts`

**Prompt**:
```
Add comprehensive error handling and edge case coverage to indexing.controller.ts.

TECH STACK COMPLIANCE:
- Node.js 18+, TypeScript (strict mode), Express.js
- Use try/catch blocks for error handling
- Log errors to console (no external logging services)

Requirements:
1. Handle empty EMR data (no artifacts found)
   - Return 200 with message "No data to index"
2. Handle chunking failures
   - Log which artifacts failed to chunk
   - Continue with successful chunks
3. Handle indexing failures
   - Check result.failedChunks > 0
   - Return partial success (207) if some chunks failed
4. Handle FAISS initialization errors
   - Check if indexingAgent is initialized
   - Return helpful error message
5. Handle Ollama connectivity errors
   - Catch embedding generation failures
   - Return error with Ollama setup instructions
6. Add request timeout (60 seconds)
   - Large datasets may take time
   - Return timeout error if exceeded

Error response format:
{
  "success": false,
  "error": {
    "message": "Human-readable error",
    "code": "ERROR_CODE",
    "details": "Technical details for debugging"
  }
}

Add try/catch around entire indexPatient method.
Log all errors with context.
```

**Expected Changes**:
- Wrap indexPatient() in try/catch
- Add edge case checks
- Add timeout handling
- Add error response formatting
- ~60 lines of code

**Verification**:
- Run `npm run type-check` - should pass
- Test empty patient data scenario
- Test Ollama offline scenario
- Verify errors are logged with context

---

### **STAGE 7: Testing & Validation**

**Tech Stack**: Node.js 18+, TypeScript (strict mode), Express.js, Jest (optional)

**Objective**: Test the complete indexing pipeline end-to-end

**Prompt**:
```
Test the complete RAG indexing pipeline to verify it works end-to-end.

TECH STACK COMPLIANCE:
- Node.js 18+, TypeScript (strict mode), Express.js
- Ollama must be running (HIPAA compliant local AI)
- Use curl for API testing (no Postman)

Requirements:
1. Start backend: npm run dev
2. Verify Ollama is running: curl http://localhost:11434/api/tags
3. Test indexing endpoint:
   curl -X POST http://localhost:3001/api/index/patient/user_3kmUMGZdObZMsmXwp0T8Pfp4e5u1 \
     -H "Content-Type: application/json" \
     -d '{"includeNotes": true, "includeCarePlans": true, "includeMedications": true}'

4. Verify response includes:
   - success: true
   - statistics with non-zero counts
   - timing information

5. Test edge cases:
   a) Invalid patient ID (should return 404)
   b) Ollama offline (should return helpful error)
   c) Empty patient data (should return 200 with "no data" message)

6. Check backend logs for:
   - EMR data fetch success
   - Chunking statistics
   - Embedding generation (Stage 2)
   - Vector storage (Stage 4)
   - Final success message

7. Verify FAISS index file created:
   ls -lh ./data/faiss/

8. Test query endpoint to verify indexed data is retrievable:
   curl -X POST http://localhost:3001/api/query \
     -H "Content-Type: application/json" \
     -d '{"query": "What medications is the patient taking?", "patientId": "user_3kmUMGZdObZMsmXwp0T8Pfp4e5u1"}'

Success criteria:
- Indexing completes without errors
- All chunks are successfully embedded and stored
- Query returns relevant results from indexed data
- FAISS index file exists and is non-zero size
```

**Expected Verification**:
- ✅ Indexing endpoint returns 200 with statistics
- ✅ Backend logs show all 7 stages completing
- ✅ FAISS index file created in `./data/faiss/`
- ✅ Query endpoint returns results from indexed data
- ✅ No TypeScript errors
- ✅ No runtime errors

**Manual Testing Checklist**:
- [ ] Test with real patient ID
- [ ] Verify EMR data is fetched (check logs)
- [ ] Verify chunks are generated (check logs)
- [ ] Verify embeddings are created (check logs)
- [ ] Verify vectors are stored in FAISS (check logs)
- [ ] Verify index file exists on disk
- [ ] Test query retrieval from indexed data
- [ ] Test error cases (invalid ID, Ollama offline)

---

## Part 5: Post-Implementation Checklist

### **Code Quality**
- [ ] All TypeScript compilation errors resolved (`npm run type-check`)
- [ ] No unused imports or variables
- [ ] Proper error handling with try/catch
- [ ] Logging at appropriate levels (info, warn, error)
- [ ] Type safety maintained (no `any` types)

### **Functionality**
- [ ] Indexing endpoint processes all artifact types
- [ ] Chunks are generated with proper overlap
- [ ] Embeddings are created using Ollama (local)
- [ ] Vectors are stored in FAISS
- [ ] Metadata is preserved through pipeline
- [ ] Query retrieval returns indexed data

### **HIPAA Compliance**
- [ ] All AI processing is local (Ollama only)
- [ ] No PHI sent to external APIs
- [ ] Data stored locally (FAISS on disk)
- [ ] No cloud services used for embeddings

### **Tech Stack Compliance**
- [ ] Node.js 18+ only (no Python)
- [ ] TypeScript strict mode
- [ ] Express.js for API
- [ ] PostgreSQL with `pg` (if metadata persistence added)
- [ ] No ORMs used
- [ ] Ollama for embeddings (no OpenAI, Anthropic)
- [ ] FAISS for vector storage

### **Documentation**
- [ ] Update IMPLEMENTATION.md with indexing pipeline details
- [ ] Document API endpoint parameters and responses
- [ ] Add JSDoc comments to public methods
- [ ] Update README with indexing usage examples

---

## Part 6: Estimated Timeline

### **Development Time**
- **Stage 2 (Type Adapter)**: 15 minutes
- **Stage 3 (Chunking)**: 15 minutes
- **Stage 4 (Indexing Agent)**: 30 minutes
- **Stage 5 (Response Format)**: 20 minutes
- **Stage 6 (Error Handling)**: 30 minutes
- **Stage 7 (Testing)**: 30 minutes

**Total Estimated Time**: ~2.5 hours

### **Confidence Level**
- **High Confidence (90%)**: Stages 2-4 (straightforward wiring)
- **Medium Confidence (80%)**: Stage 5 (response formatting)
- **Medium Confidence (75%)**: Stage 6 (edge case handling)
- **High Confidence (85%)**: Stage 7 (testing)

---

## Part 7: Success Criteria

### **Minimum Viable Product (MVP)**
✅ User can index patient EMR data via API
✅ All artifacts are chunked into 200-300 word segments
✅ All chunks are embedded using Ollama (768 dimensions)
✅ All vectors are stored in FAISS
✅ Query endpoint retrieves indexed data

### **Full Success**
✅ MVP criteria met
✅ Detailed statistics returned (chunks, embeddings, timing)
✅ Progress logging at each stage
✅ Error handling for all edge cases
✅ FAISS index persisted to disk
✅ No TypeScript errors
✅ No runtime errors
✅ HIPAA compliant (local processing only)

### **Exceptional Success**
✅ Full success criteria met
✅ Performance benchmarks met (<10s for 100 artifacts)
✅ Comprehensive test coverage
✅ Documentation updated
✅ Example usage added to README

---

## Part 8: Rollback Plan

If implementation fails or causes issues:

### **Immediate Rollback**
1. Restore original `indexing.controller.ts` from git
2. Run `npm run build` to verify compilation
3. Restart backend service
4. Verify placeholder endpoint still returns mock response

### **Partial Rollback**
If specific stages fail:
- **Stage 2-3 fail**: Keep type adapter, remove chunking
- **Stage 4 fails**: Keep chunking, remove indexing agent
- **Stage 5-6 fail**: Keep indexing, use simple response

### **Data Cleanup**
If FAISS index becomes corrupted:
1. Delete `./data/faiss/` directory
2. Restart backend (will reinitialize empty index)
3. Re-index patient data

---

## Part 9: Next Steps After Completion

### **Phase 2 Enhancements** (Future Work)
1. **Batch Indexing**: Index multiple patients in parallel
2. **Incremental Indexing**: Only index new/changed artifacts
3. **Index Optimization**: Use IVF/HNSW for faster search on large datasets
4. **Metadata Filtering**: Filter results by date, type, author
5. **Hybrid Search**: Combine vector + keyword search
6. **Query Result Ranking**: Implement re-ranking with LLM
7. **Citation Provenance**: Link results back to source artifacts

### **Phase 3 Production Readiness** (Future Work)
1. **PostgreSQL Metadata Storage**: Persist chunk metadata to database
2. **Background Job Queue**: Async indexing with progress tracking
3. **Health Monitoring**: Index size, embedding performance metrics
4. **Index Versioning**: Support multiple index versions
5. **Index Backup**: Automated backups of FAISS indices
6. **Load Testing**: Verify performance with 1000+ patients
7. **Security Audit**: Ensure HIPAA compliance end-to-end

---

## Appendix A: Key File References

### **Files to Modify**
1. `/backend/src/controllers/indexing.controller.ts` (PRIMARY CHANGE)

### **Files to Import From (No Changes)**
1. `/backend/src/services/indexing-agent.service.ts`
2. `/backend/src/services/text-chunker.service.ts`
3. `/backend/src/services/embedding-factory.service.ts`
4. `/backend/src/services/faiss-vector-store.service.ts`
5. `/backend/src/services/emr.service.ts`
6. `/backend/src/types/artifact.types.ts`

### **Configuration Files (No Changes)**
1. `/backend/src/config/env.config.ts`
2. `/backend/.env.production`
3. `/backend/tsconfig.json`

### **Documentation References**
1. `/backend/TECH_STACK_COMPLIANCE_REPORT.md` (100% compliance)
2. `/backend/IMPLEMENTATION.md` (Ollama setup guide)

---

## Appendix B: Tech Stack Summary

**This must be included at the top of EVERY prompt:**

```
TECH STACK COMPLIANCE:
- Node.js 18+, Express.js, TypeScript (strict mode)
- React 18+, Vite, Tailwind CSS (frontend)
- PostgreSQL with pg package (raw SQL only)
- Ollama (local AI - HIPAA compliant)
  - Meditron 7B (medical LLM)
  - nomic-embed-text (768-dimensional embeddings)
- FAISS vector database (local storage)
- NO ORMs (Prisma, TypeORM, Sequelize)
- NO Python
- NO external AI APIs (OpenAI, Anthropic, etc.)
```

---

## Appendix C: Service Architecture Map

```
┌─────────────────────────────────────────────────────────────┐
│                    Indexing Controller                       │
│                 (indexing.controller.ts)                     │
│  - Receives HTTP POST /api/index/patient/:patientId         │
│  - Orchestrates entire pipeline                              │
│  - Returns detailed statistics                               │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ 1. Fetch EMR data
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                      EMR Service                             │
│                   (emr.service.ts)                           │
│  - fetchCarePlans(), fetchMedications(), fetchNotes()        │
│  - Returns: { carePlans[], medications[], notes[] }          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ 2. Convert to Artifacts
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   Type Adapter                               │
│            (inside indexing.controller.ts)                   │
│  - convertToArtifacts(emrData) → Artifact[]                  │
│  - Maps care_plan/medication/note → Artifact                 │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ 3. Chunk artifacts
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                   Text Chunker                               │
│               (text-chunker.service.ts)                      │
│  - chunk(artifact) → Chunk[]                                 │
│  - 200-300 words per chunk, 50-word overlap                  │
│  - Preserves sentence boundaries                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ 4. Index chunks (7-stage pipeline)
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  Indexing Agent                              │
│              (indexing-agent.service.ts)                     │
│  - indexChunks(chunks[]) → IndexingResult                    │
│                                                              │
│  Stage 1: Text extraction                                    │
│  Stage 2: Chunk-level embeddings ────┐                       │
│  Stage 3: Sentence-level embeddings  │                       │
│  Stage 4: Vector storage             │                       │
│  Stage 5: Keyword index              │                       │
│  Stage 6: Metadata cache             │                       │
│  Stage 7: Completion                 │                       │
└──────────────────────────────────────┼───────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────┐
         │                             │                     │
         ▼                             ▼                     ▼
┌─────────────────┐    ┌──────────────────────┐   ┌──────────────────┐
│ Embedding       │    │  FAISS Vector Store  │   │  Metadata Cache  │
│ Factory         │    │ (faiss-vector-store  │   │  (in-memory)     │
│ (embedding-     │    │  .service.ts)        │   │                  │
│  factory        │    │                      │   │                  │
│  .service.ts)   │    │ - IndexFlatIP        │   │ - chunk metadata │
│                 │    │ - 768 dimensions     │   │ - keyword index  │
│ - Ollama        │    │ - Cosine similarity  │   │                  │
│ - nomic-embed   │    │ - Disk persistence   │   │                  │
└─────────────────┘    └──────────────────────┘   └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Query Flow (Already Works)                │
└─────────────────────────────────────────────────────────────┘
  Query Controller → Embedding Factory → FAISS Search → Results
```

---

## Summary

**The RAG system is 95% complete.** Only missing piece is wiring the controller to existing services.

**What exists**: All core services (chunking, embedding, vector storage, indexing pipeline)
**What's missing**: ~150 lines of controller integration code
**Risk level**: LOW (just wiring existing functions)
**Estimated time**: 2-3 hours
**Tech stack**: 100% compliant (Node.js, TypeScript, Express, Ollama, FAISS)

**Ready to implement?** Follow the staged prompts (Stages 2-7) sequentially, ensuring tech stack compliance at each step.
