-- ============================================================================
-- Migration 003: Extend chunk_metadata for Enrichment
-- ============================================================================
-- Adds columns to chunk_metadata to support enriched text and relationships
-- Safe to run incrementally (uses ADD COLUMN IF NOT EXISTS pattern)
-- ============================================================================

BEGIN;

-- Add new columns for enrichment support (safe with IF NOT EXISTS)
ALTER TABLE chunk_metadata
ADD COLUMN IF NOT EXISTS enriched_text TEXT, -- Enriched version of chunk_text
ADD COLUMN IF NOT EXISTS extracted_entities JSONB, -- Entities found in this chunk
ADD COLUMN IF NOT EXISTS relationship_ids TEXT[], -- Related relationship_ids
ADD COLUMN IF NOT EXISTS context_expansion_level INTEGER DEFAULT 0; -- 0=none, 1=direct, 2=expanded

-- Add index for enriched text search (skip if exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_chunk_enriched_search'
    ) THEN
        CREATE INDEX idx_chunk_enriched_search
        ON chunk_metadata USING GIN (to_tsvector('english', enriched_text));
    END IF;
END
$$;

-- Add GIN index for entities (skip if exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_chunk_entities'
    ) THEN
        CREATE INDEX idx_chunk_entities
        ON chunk_metadata USING GIN (extracted_entities);
    END IF;
END
$$;

-- Add index for relationship_ids array (skip if exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'idx_chunk_relationships'
    ) THEN
        CREATE INDEX idx_chunk_relationships
        ON chunk_metadata USING GIN (relationship_ids);
    END IF;
END
$$;

COMMENT ON COLUMN chunk_metadata.enriched_text IS 'Enriched version of chunk with clinical context and relationships';
COMMENT ON COLUMN chunk_metadata.extracted_entities IS 'Structured entities (medications, conditions, etc.) extracted from this chunk';
COMMENT ON COLUMN chunk_metadata.relationship_ids IS 'IDs from clinical_relationships table that relate to this chunk';
COMMENT ON COLUMN chunk_metadata.context_expansion_level IS 'Level of context expansion: 0=none, 1=direct relationships, 2=transitive relationships';

COMMIT;

-- ============================================================================
-- Rollback Instructions
-- ============================================================================
-- To rollback this migration, run:
--
-- ALTER TABLE chunk_metadata
-- DROP COLUMN IF EXISTS enriched_text,
-- DROP COLUMN IF EXISTS extracted_entities,
-- DROP COLUMN IF EXISTS relationship_ids,
-- DROP COLUMN IF EXISTS context_expansion_level;
--
-- DROP INDEX IF EXISTS idx_chunk_enriched_search;
-- DROP INDEX IF EXISTS idx_chunk_entities;
-- DROP INDEX IF EXISTS idx_chunk_relationships;
-- ============================================================================
