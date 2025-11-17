/**
 * Session Manager Examples
 *
 * Demonstrates session timeout management with automatic cleanup
 */
/**
 * Example 1: Session Creation
 *
 * Create new session with 30-minute timeout
 */
declare function example1_sessionCreation(): void;
/**
 * Example 2: Session Retrieval and Renewal
 *
 * Retrieve session and automatically extend expiration
 */
declare function example2_sessionRetrieval(): void;
/**
 * Example 3: Session Expiration
 *
 * Check if session has expired
 */
declare function example3_sessionExpiration(): void;
/**
 * Example 4: Automatic Cleanup
 *
 * Cleanup runs every 5 minutes to remove expired sessions
 */
declare function example4_automaticCleanup(): void;
/**
 * Example 5: Max Session Limit and LRU Eviction
 *
 * When 100 sessions reached, evict oldest (least recently accessed)
 */
declare function example5_maxSessionLimit(): void;
/**
 * Example 6: Session Updates with Conversation Context
 *
 * Update session with new conversation turn
 */
declare function example6_sessionUpdates(): void;
/**
 * Example 7: Multi-Patient Sessions
 *
 * Get all sessions for specific patient
 */
declare function example7_multiPatientSessions(): void;
/**
 * Example 8: Session Statistics
 *
 * Get statistics about active sessions
 */
declare function example8_sessionStatistics(): void;
/**
 * Example 9: Time Until Expiration
 *
 * Get remaining time before session expires
 */
declare function example9_timeUntilExpiration(): void;
/**
 * Example 10: Session Extension
 *
 * Manually extend session expiration
 */
declare function example10_sessionExtension(): void;
/**
 * Example 11: Integration with Orchestrator
 *
 * Use session manager in query processing pipeline
 */
declare function example11_orchestratorIntegration(): Promise<void>;
/**
 * Example 12: Real-World Conversation Flow
 *
 * Multi-turn conversation with automatic session renewal
 */
declare function example12_conversationFlow(): Promise<void>;
/**
 * Example 13: Cleanup Mechanism
 *
 * Demonstrate automatic cleanup of expired sessions
 */
declare function example13_cleanupMechanism(): void;
/**
 * Example 14: Session Persistence Patterns
 *
 * Best practices for session management
 */
declare function example14_sessionPersistencePatterns(): void;
/**
 * Example 15: Explain Session Manager
 *
 * Get detailed explanation of session management
 */
declare function example15_explainSessionManager(): void;
export { example1_sessionCreation, example2_sessionRetrieval, example3_sessionExpiration, example4_automaticCleanup, example5_maxSessionLimit, example6_sessionUpdates, example7_multiPatientSessions, example8_sessionStatistics, example9_timeUntilExpiration, example10_sessionExtension, example11_orchestratorIntegration, example12_conversationFlow, example13_cleanupMechanism, example14_sessionPersistencePatterns, example15_explainSessionManager, };
//# sourceMappingURL=session-manager.example.d.ts.map