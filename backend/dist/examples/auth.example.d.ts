/**
 * Authentication Service Usage Examples
 *
 * This file demonstrates how to use the OAuth2 authentication service
 * to make authenticated requests to the Avon Health API.
 */
/**
 * Example 1: Making authenticated API requests
 */
export declare function exampleAuthenticatedRequest(): Promise<any>;
/**
 * Example 2: Checking authentication status before making requests
 */
export declare function exampleCheckAuthStatus(): Promise<void>;
/**
 * Example 3: Making multiple parallel authenticated requests
 */
export declare function exampleParallelRequests(patientId: string): Promise<{
    carePlans: any;
    medications: any;
    notes: any;
}>;
/**
 * Example 4: Manual token management
 */
export declare function exampleManualTokenManagement(): Promise<void>;
/**
 * Example 5: Error handling with retries
 */
export declare function exampleErrorHandling(patientId: string): Promise<any>;
/**
 * Example 6: Using in an Express route
 */
export declare function exampleExpressRoute(): (req: any, res: any) => Promise<any>;
/**
 * Example 7: Batch requests with authentication
 */
export declare function exampleBatchRequests(patientIds: string[]): Promise<{
    successful: any[];
    failed: any[];
    total: number;
    successCount: number;
    failureCount: number;
}>;
//# sourceMappingURL=auth.example.d.ts.map