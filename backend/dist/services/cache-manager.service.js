"use strict";
/**
 * Cache Manager Service
 *
 * In-memory caching strategy with LRU eviction and TTL support:
 * - Embedding cache: 1000 entries, 5 min TTL
 * - Query results cache: 100 entries, 5 min TTL
 * - Patient index cache: 5 patients, 30 min TTL
 *
 * NO Redis or external caching services
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LRUCache = void 0;
const crypto = __importStar(require("crypto"));
const metadata_db_service_1 = __importDefault(require("./metadata-db.service"));
/**
 * LRU Cache with TTL support
 *
 * Features:
 * - Least Recently Used eviction
 * - Time-to-Live expiration
 * - Access tracking
 * - Max size enforcement
 */
class LRUCache {
    cache;
    maxSize;
    defaultTTL;
    constructor(maxSize, defaultTTL) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.defaultTTL = defaultTTL;
    }
    /**
     * Set a value in the cache
     *
     * @param key - Cache key
     * @param value - Value to cache
     * @param ttl - Optional TTL in milliseconds (uses default if not provided)
     */
    set(key, value, ttl) {
        const now = Date.now();
        // If cache is full and key doesn't exist, evict LRU
        if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
            this.evictLRU();
        }
        // Store entry
        this.cache.set(key, {
            value,
            timestamp: now,
            ttl: ttl || this.defaultTTL,
            accessCount: 0,
        });
    }
    /**
     * Get a value from the cache
     *
     * Returns undefined if:
     * - Key doesn't exist
     * - Entry has expired (TTL exceeded)
     *
     * @param key - Cache key
     * @returns Cached value or undefined
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return undefined;
        }
        const now = Date.now();
        const age = now - entry.timestamp;
        // Check if expired
        if (age > entry.ttl) {
            this.cache.delete(key);
            return undefined;
        }
        // Update access tracking
        entry.accessCount++;
        entry.timestamp = now; // Update timestamp for LRU
        return entry.value;
    }
    /**
     * Check if key exists and is not expired
     *
     * @param key - Cache key
     * @returns true if key exists and is valid
     */
    has(key) {
        return this.get(key) !== undefined;
    }
    /**
     * Delete a key from the cache
     *
     * @param key - Cache key
     */
    delete(key) {
        this.cache.delete(key);
    }
    /**
     * Clear the entire cache
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Get cache size
     *
     * @returns Number of entries in cache
     */
    size() {
        return this.cache.size;
    }
    /**
     * Get cache statistics
     *
     * @returns Cache stats
     */
    stats() {
        const now = Date.now();
        const entries = [];
        for (const [key, entry] of this.cache.entries()) {
            entries.push({
                key,
                age: now - entry.timestamp,
                accessCount: entry.accessCount,
            });
        }
        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            entries,
        };
    }
    /**
     * Evict least recently used entry
     *
     * LRU strategy: evict entry with oldest timestamp
     */
    evictLRU() {
        if (this.cache.size === 0) {
            return;
        }
        let oldestKey = null;
        let oldestTimestamp = Infinity;
        // Find oldest entry
        for (const [key, entry] of this.cache.entries()) {
            if (entry.timestamp < oldestTimestamp) {
                oldestTimestamp = entry.timestamp;
                oldestKey = key;
            }
        }
        if (oldestKey !== null) {
            this.cache.delete(oldestKey);
        }
    }
    /**
     * Clean up expired entries
     *
     * Removes all entries that have exceeded their TTL
     */
    cleanup() {
        const now = Date.now();
        const keysToDelete = [];
        for (const [key, entry] of this.cache.entries()) {
            const age = now - entry.timestamp;
            if (age > entry.ttl) {
                keysToDelete.push(key);
            }
        }
        for (const key of keysToDelete) {
            this.cache.delete(key);
        }
    }
}
exports.LRUCache = LRUCache;
/**
 * Cache Manager
 *
 * Manages three cache layers:
 * 1. Embedding cache: text → embedding vector (1000 entries, 5 min TTL)
 * 2. Query results cache: query hash → retrieval results (100 entries, 5 min TTL)
 * 3. Patient index cache: patient ID → chunk indices (5 patients, 30 min TTL)
 */
class CacheManager {
    // Embedding cache: Last 1000 text→embedding pairs (5 min TTL)
    embeddingsCache;
    // Query results cache: Last 100 query→results (5 min TTL)
    queryResultsCache;
    // Patient index cache: Last 5 patients' indices (30 min TTL)
    patientIndexCache;
    // Cache configuration (as per spec)
    EMBEDDING_CACHE_SIZE = 1000;
    EMBEDDING_TTL = 5 * 60 * 1000; // 5 minutes
    QUERY_CACHE_SIZE = 100;
    QUERY_TTL = 5 * 60 * 1000; // 5 minutes
    PATIENT_CACHE_SIZE = 5;
    PATIENT_TTL = 30 * 60 * 1000; // 30 minutes
    // Cleanup interval
    cleanupInterval = null;
    constructor() {
        this.embeddingsCache = new LRUCache(this.EMBEDDING_CACHE_SIZE, this.EMBEDDING_TTL);
        this.queryResultsCache = new LRUCache(this.QUERY_CACHE_SIZE, this.QUERY_TTL);
        this.patientIndexCache = new Map();
        // Start periodic cleanup (every minute)
        this.startCleanup();
    }
    // ========================================================================
    // EMBEDDING CACHE
    // ========================================================================
    /**
     * Cache an embedding
     *
     * @param text - Original text
     * @param embedding - Embedding vector
     */
    cacheEmbedding(text, embedding) {
        const key = this.generateEmbeddingKey(text);
        this.embeddingsCache.set(key, embedding);
    }
    /**
     * Get cached embedding
     *
     * @param text - Original text
     * @returns Cached embedding or undefined
     */
    getEmbedding(text) {
        const key = this.generateEmbeddingKey(text);
        return this.embeddingsCache.get(key);
    }
    /**
     * Check if embedding is cached
     *
     * @param text - Original text
     * @returns true if cached and valid
     */
    hasEmbedding(text) {
        const key = this.generateEmbeddingKey(text);
        return this.embeddingsCache.has(key);
    }
    /**
     * Generate cache key for embedding
     *
     * Key = SHA256(normalized_text)
     * Normalization: lowercase, trim whitespace
     *
     * @param text - Original text
     * @returns SHA256 hash
     */
    generateEmbeddingKey(text) {
        const normalized = text.toLowerCase().trim();
        return crypto.createHash('sha256').update(normalized).digest('hex');
    }
    // ========================================================================
    // QUERY RESULTS CACHE
    // ========================================================================
    /**
     * Cache query results
     *
     * @param query - Query text
     * @param patientId - Patient ID
     * @param filters - Query filters
     * @param result - Retrieval results
     * @param ttl - Optional TTL (uses default if not provided)
     */
    cacheQueryResult(query, patientId, filters, result, ttl) {
        const key = this.generateQueryKey(query, patientId, filters);
        this.queryResultsCache.set(key, result, ttl);
    }
    /**
     * Get cached query results
     *
     * @param query - Query text
     * @param patientId - Patient ID
     * @param filters - Query filters
     * @returns Cached results or undefined
     */
    getQueryResult(query, patientId, filters) {
        const key = this.generateQueryKey(query, patientId, filters);
        return this.queryResultsCache.get(key);
    }
    /**
     * Check if query result is cached
     *
     * @param query - Query text
     * @param patientId - Patient ID
     * @param filters - Query filters
     * @returns true if cached and valid
     */
    hasQueryResult(query, patientId, filters) {
        const key = this.generateQueryKey(query, patientId, filters);
        return this.queryResultsCache.has(key);
    }
    /**
     * Generate cache key for query
     *
     * Key = SHA256(normalized_query + patient_id + JSON(filters))
     * Normalization: lowercase, trim whitespace
     *
     * @param query - Query text
     * @param patientId - Patient ID
     * @param filters - Query filters
     * @returns SHA256 hash
     */
    generateQueryKey(query, patientId, filters) {
        const normalized = query.toLowerCase().trim();
        const filtersJson = JSON.stringify(filters || {});
        const combined = `${normalized}|${patientId}|${filtersJson}`;
        return crypto.createHash('sha256').update(combined).digest('hex');
    }
    // ========================================================================
    // PATIENT INDEX CACHE
    // ========================================================================
    /**
     * Load patient index into cache
     *
     * Retrieves all chunks for a patient and caches the index
     *
     * @param patientId - Patient ID
     * @returns Patient index
     */
    async loadPatientIndex(patientId) {
        // Check if already cached
        const cached = this.patientIndexCache.get(patientId);
        if (cached) {
            // Update last accessed time
            cached.lastAccessed = new Date();
            return cached;
        }
        // Evict LRU if cache is full
        if (this.patientIndexCache.size >= this.PATIENT_CACHE_SIZE) {
            this.evictLeastRecentPatient();
        }
        // Load from database
        const chunks = await metadata_db_service_1.default.filterChunks({
            patientId,
        });
        // Get chunk metadata for statistics
        const chunkMetadata = await metadata_db_service_1.default.getChunksByIds(chunks);
        // Build date range
        let earliest = '';
        let latest = '';
        const artifactTypesSet = new Set();
        for (const chunk of chunkMetadata) {
            const occurredAt = typeof chunk.occurred_at === 'string' ? chunk.occurred_at : chunk.occurred_at.toISOString();
            if (!earliest || occurredAt < earliest) {
                earliest = occurredAt;
            }
            if (!latest || occurredAt > latest) {
                latest = occurredAt;
            }
            artifactTypesSet.add(chunk.artifact_type);
        }
        // Create patient index
        const patientIndex = {
            patientId,
            chunkIds: chunks,
            lastAccessed: new Date(),
            metadata: {
                totalChunks: chunks.length,
                dateRange: {
                    earliest,
                    latest,
                },
                artifactTypes: Array.from(artifactTypesSet),
            },
        };
        // Cache it
        this.patientIndexCache.set(patientId, patientIndex);
        return patientIndex;
    }
    /**
     * Get patient index from cache
     *
     * @param patientId - Patient ID
     * @returns Cached patient index or undefined
     */
    getPatientIndex(patientId) {
        const cached = this.patientIndexCache.get(patientId);
        if (!cached) {
            return undefined;
        }
        // Check TTL
        const now = Date.now();
        const age = now - cached.lastAccessed.getTime();
        if (age > this.PATIENT_TTL) {
            // Expired - remove from cache
            this.patientIndexCache.delete(patientId);
            return undefined;
        }
        // Update last accessed
        cached.lastAccessed = new Date();
        return cached;
    }
    /**
     * Evict least recently accessed patient from cache
     */
    evictLeastRecentPatient() {
        if (this.patientIndexCache.size === 0) {
            return;
        }
        let lruPatientId = null;
        let oldestAccess = Infinity;
        for (const [patientId, index] of this.patientIndexCache.entries()) {
            const accessTime = index.lastAccessed.getTime();
            if (accessTime < oldestAccess) {
                oldestAccess = accessTime;
                lruPatientId = patientId;
            }
        }
        if (lruPatientId) {
            this.patientIndexCache.delete(lruPatientId);
        }
    }
    /**
     * Invalidate patient index (force reload on next access)
     *
     * @param patientId - Patient ID
     */
    invalidatePatientIndex(patientId) {
        this.patientIndexCache.delete(patientId);
    }
    // ========================================================================
    // CACHE MANAGEMENT
    // ========================================================================
    /**
     * Clear all caches
     */
    clearAll() {
        this.embeddingsCache.clear();
        this.queryResultsCache.clear();
        this.patientIndexCache.clear();
    }
    /**
     * Get comprehensive cache statistics
     *
     * @returns Cache stats for all layers
     */
    getStats() {
        const embeddingStats = this.embeddingsCache.stats();
        const queryStats = this.queryResultsCache.stats();
        // Calculate total memory estimate
        const embeddingMemory = embeddingStats.size * 1536 * 4; // 1536-dim * 4 bytes per float
        const queryMemory = queryStats.size * 1000; // Rough estimate: 1KB per result
        const patientMemory = this.patientIndexCache.size * 10000; // Rough estimate: 10KB per patient
        const totalMemory = embeddingMemory + queryMemory + patientMemory;
        return {
            embeddings: {
                size: embeddingStats.size,
                maxSize: embeddingStats.maxSize,
                ttl: this.EMBEDDING_TTL,
            },
            queryResults: {
                size: queryStats.size,
                maxSize: queryStats.maxSize,
                ttl: this.QUERY_TTL,
            },
            patientIndices: {
                size: this.patientIndexCache.size,
                maxSize: this.PATIENT_CACHE_SIZE,
                ttl: this.PATIENT_TTL,
                patients: Array.from(this.patientIndexCache.keys()),
            },
            totalMemoryEstimate: this.formatBytes(totalMemory),
        };
    }
    /**
     * Start periodic cleanup of expired entries
     *
     * Runs every minute
     */
    startCleanup() {
        if (this.cleanupInterval) {
            return;
        }
        this.cleanupInterval = setInterval(() => {
            // Clean up embedding cache
            this.embeddingsCache.cleanup();
            // Clean up query results cache
            this.queryResultsCache.cleanup();
            // Clean up patient index cache
            const now = Date.now();
            const patientsToEvict = [];
            for (const [patientId, index] of this.patientIndexCache.entries()) {
                const age = now - index.lastAccessed.getTime();
                if (age > this.PATIENT_TTL) {
                    patientsToEvict.push(patientId);
                }
            }
            for (const patientId of patientsToEvict) {
                this.patientIndexCache.delete(patientId);
            }
        }, 60 * 1000); // 1 minute
    }
    /**
     * Stop periodic cleanup
     */
    stopCleanup() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }
    /**
     * Format bytes to human-readable string
     *
     * @param bytes - Number of bytes
     * @returns Formatted string
     */
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
// Export singleton instance
const cacheManager = new CacheManager();
exports.default = cacheManager;
//# sourceMappingURL=cache-manager.service.js.map