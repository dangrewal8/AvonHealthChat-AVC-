-- ============================================================================
-- Chunk Metadata Table
-- ============================================================================
-- Stores metadata for document chunks to enable temporal filtering and
-- efficient metadata-based search before vector similarity lookup
-- ============================================================================

-- Drop existing table and indexes if they exist
DROP TABLE IF EXISTS chunk_metadata CASCADE;

-- Create chunk_metadata table
CREATE TABLE chunk_metadata (
  -- Primary key: Unique identifier for each chunk
  chunk_id VARCHAR(255) PRIMARY KEY,

  -- Foreign key references
  artifact_id VARCHAR(255) NOT NULL,
  patient_id VARCHAR(255) NOT NULL,

  -- Artifact classification
  artifact_type VARCHAR(50) NOT NULL,

  -- Temporal information (critical for date range filtering)
  occurred_at TIMESTAMP NOT NULL,

  -- Authorship information
  author VARCHAR(255),

  -- Full chunk text content
  chunk_text TEXT NOT NULL,

  -- Character offsets within original document [start, end]
  char_offsets INTEGER[],

  -- Source reference
  source_url TEXT,

  -- Audit timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- Indexes for Efficient Querying
-- ============================================================================

-- Composite index for patient + date range queries (most common query pattern)
-- DESC on occurred_at for efficient "recent first" queries
CREATE INDEX idx_patient_date ON chunk_metadata(patient_id, occurred_at DESC);

-- Index for artifact type filtering
CREATE INDEX idx_artifact_type ON chunk_metadata(artifact_type);

-- Index for global date range queries
CREATE INDEX idx_occurred_at ON chunk_metadata(occurred_at);

-- Composite index for artifact type + date filtering
CREATE INDEX idx_type_date ON chunk_metadata(artifact_type, occurred_at DESC);

-- Index for artifact_id lookups (get all chunks for an artifact)
CREATE INDEX idx_artifact_id ON chunk_metadata(artifact_id);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE chunk_metadata IS 'Stores metadata for document chunks to enable efficient temporal and type-based filtering';
COMMENT ON COLUMN chunk_metadata.chunk_id IS 'Unique identifier for the chunk (UUID)';
COMMENT ON COLUMN chunk_metadata.artifact_id IS 'Reference to the parent artifact/document';
COMMENT ON COLUMN chunk_metadata.patient_id IS 'Reference to the patient this chunk belongs to';
COMMENT ON COLUMN chunk_metadata.artifact_type IS 'Type of artifact (e.g., progress_note, lab_result, medication_order)';
COMMENT ON COLUMN chunk_metadata.occurred_at IS 'Timestamp when the clinical event occurred (NOT when the record was created)';
COMMENT ON COLUMN chunk_metadata.author IS 'Author of the clinical note or document';
COMMENT ON COLUMN chunk_metadata.chunk_text IS 'Full text content of the chunk';
COMMENT ON COLUMN chunk_metadata.char_offsets IS 'Character offsets [start, end] within the original document';
COMMENT ON COLUMN chunk_metadata.source_url IS 'URL or reference to the source document';
COMMENT ON COLUMN chunk_metadata.created_at IS 'Timestamp when this record was inserted into the database';

-- ============================================================================
-- Sample Queries (for reference)
-- ============================================================================

-- Query 1: Get chunk IDs for a patient within date range
-- SELECT chunk_id FROM chunk_metadata
-- WHERE patient_id = 'patient_123'
--   AND occurred_at BETWEEN '2024-01-01' AND '2024-12-31'
-- ORDER BY occurred_at DESC;

-- Query 2: Get chunk IDs by artifact type
-- SELECT chunk_id FROM chunk_metadata
-- WHERE patient_id = 'patient_123'
--   AND artifact_type IN ('progress_note', 'lab_result');

-- Query 3: Combined filtering (type + date range)
-- SELECT chunk_id FROM chunk_metadata
-- WHERE patient_id = 'patient_123'
--   AND artifact_type = 'progress_note'
--   AND occurred_at >= '2024-01-01'
-- ORDER BY occurred_at DESC;

-- Query 4: Get full chunk by ID
-- SELECT * FROM chunk_metadata WHERE chunk_id = 'chunk_uuid_here';
