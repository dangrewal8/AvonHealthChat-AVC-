/**
 * EMR Service Usage Examples
 *
 * This file demonstrates how to use the EMR data fetching service
 * to retrieve patient data from the Avon Health API.
 */
/**
 * Example 1: Fetch care plans for a patient
 */
export declare function exampleFetchCarePlans(): Promise<any[]>;
/**
 * Example 2: Fetch medications with date filters
 */
export declare function exampleFetchMedicationsWithFilters(): Promise<any[]>;
/**
 * Example 3: Fetch all EMR data for a patient
 */
export declare function exampleFetchAllData(): Promise<import("../types/emr.types").FetchAllResult>;
/**
 * Example 4: Demonstrate caching behavior
 */
export declare function exampleCachingBehavior(): Promise<void>;
/**
 * Example 5: Fetch data for multiple patients in parallel
 */
export declare function exampleMultiplePatients(): Promise<import("../types/emr.types").FetchAllResult[]>;
/**
 * Example 6: Handle errors gracefully
 */
export declare function exampleErrorHandling(): Promise<import("../types/emr.types").FetchResult<any[]>>;
/**
 * Example 7: Pagination
 */
export declare function examplePagination(): Promise<any[]>;
/**
 * Example 8: Using in an Express route with proper error handling
 */
export declare function exampleExpressRoute(): (req: any, res: any) => Promise<any>;
/**
 * Example 9: Cache management
 */
export declare function exampleCacheManagement(): Promise<void>;
/**
 * Example 10: Batch fetch with rate limiting awareness
 */
export declare function exampleBatchFetchWithRateLimit(): Promise<any[]>;
//# sourceMappingURL=emr.example.d.ts.map