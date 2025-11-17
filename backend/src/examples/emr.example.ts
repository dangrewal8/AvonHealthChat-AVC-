/**
 * EMR Service Usage Examples
 *
 * This file demonstrates how to use the EMR data fetching service
 * to retrieve patient data from the Avon Health API.
 */

import emrService from '../services/emr.service';
import { FilterOptions } from '../types/emr.types';

/**
 * Example 1: Fetch care plans for a patient
 */
export async function exampleFetchCarePlans() {
  const patientId = 'patient_123';

  try {
    const result = await emrService.fetchCarePlans(patientId);

    console.log(`Fetched ${result.count} care plans`);
    console.log(`Cached: ${result.cached}`);
    console.log(`Fetch time: ${result.fetchTime}ms`);
    console.log('Data:', result.data);

    return result.data;
  } catch (error) {
    console.error('Failed to fetch care plans:', error);
    throw error;
  }
}

/**
 * Example 2: Fetch medications with date filters
 */
export async function exampleFetchMedicationsWithFilters() {
  const patientId = 'patient_123';

  const options: FilterOptions = {
    dateFrom: '2024-01-01',
    dateTo: '2024-12-31',
    limit: 50,
  };

  try {
    const result = await emrService.fetchMedications(patientId, options);

    console.log(`Fetched ${result.count} medications from 2024`);
    console.log(`Cached: ${result.cached}`);

    return result.data;
  } catch (error) {
    console.error('Failed to fetch medications:', error);
    throw error;
  }
}

/**
 * Example 3: Fetch all EMR data for a patient
 */
export async function exampleFetchAllData() {
  const patientId = 'patient_123';

  try {
    const result = await emrService.fetchAll(patientId);

    console.log(`Total items: ${result.totalCount}`);
    console.log(`Care plans: ${result.carePlans.length}`);
    console.log(`Medications: ${result.medications.length}`);
    console.log(`Notes: ${result.notes.length}`);
    console.log(`Cached: ${result.cached}`);
    console.log(`Fetch time: ${result.fetchTime}ms`);

    return result;
  } catch (error) {
    console.error('Failed to fetch all data:', error);
    throw error;
  }
}

/**
 * Example 4: Demonstrate caching behavior
 */
export async function exampleCachingBehavior() {
  const patientId = 'patient_123';

  console.log('First fetch (will hit API):');
  const result1 = await emrService.fetchCarePlans(patientId);
  console.log(`Cached: ${result1.cached}, Time: ${result1.fetchTime}ms`);

  console.log('\nSecond fetch (should hit cache):');
  const result2 = await emrService.fetchCarePlans(patientId);
  console.log(`Cached: ${result2.cached}, Time: ${result2.fetchTime}ms`);

  // Clear cache
  console.log('\nClearing cache...');
  emrService.clearCache();

  console.log('\nThird fetch (will hit API again):');
  const result3 = await emrService.fetchCarePlans(patientId);
  console.log(`Cached: ${result3.cached}, Time: ${result3.fetchTime}ms`);
}

/**
 * Example 5: Fetch data for multiple patients in parallel
 */
export async function exampleMultiplePatients() {
  const patientIds = ['patient_123', 'patient_456', 'patient_789'];

  try {
    const results = await Promise.all(
      patientIds.map((patientId) => emrService.fetchAll(patientId))
    );

    results.forEach((result, index) => {
      console.log(`\nPatient ${patientIds[index]}:`);
      console.log(`  Total items: ${result.totalCount}`);
      console.log(`  Cached: ${result.cached}`);
    });

    return results;
  } catch (error) {
    console.error('Failed to fetch data for multiple patients:', error);
    throw error;
  }
}

/**
 * Example 6: Handle errors gracefully
 */
export async function exampleErrorHandling() {
  const invalidPatientId = 'invalid_patient_999';

  try {
    const result = await emrService.fetchCarePlans(invalidPatientId);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        console.log('Patient not found - this is expected');
        // Handle not found case
      } else if (error.message.includes('Rate limit')) {
        console.log('Rate limit hit - implement backoff');
        // Implement exponential backoff
      } else if (error.message.includes('timeout')) {
        console.log('Request timed out - retry later');
        // Implement retry logic
      } else {
        console.error('Unknown error:', error.message);
      }
    }
    throw error;
  }
}

/**
 * Example 7: Pagination
 */
export async function examplePagination() {
  const patientId = 'patient_123';
  const pageSize = 10;
  let offset = 0;
  const allData: any[] = [];

  try {
    while (true) {
      const options: FilterOptions = {
        limit: pageSize,
        offset,
      };

      const result = await emrService.fetchCarePlans(patientId, options);

      if (result.count === 0) {
        break; // No more data
      }

      allData.push(...result.data);
      offset += pageSize;

      console.log(`Fetched page ${offset / pageSize}, total items: ${allData.length}`);

      if (result.count < pageSize) {
        break; // Last page
      }
    }

    console.log(`Total care plans fetched: ${allData.length}`);
    return allData;
  } catch (error) {
    console.error('Pagination failed:', error);
    throw error;
  }
}

/**
 * Example 8: Using in an Express route with proper error handling
 */
export function exampleExpressRoute() {
  return async (req: any, res: any) => {
    const { patient_id } = req.query;

    if (!patient_id) {
      return res.status(400).json({
        error: 'patient_id is required',
      });
    }

    try {
      const result = await emrService.fetchAll(patient_id);

      res.json({
        success: true,
        data: {
          carePlans: result.carePlans,
          medications: result.medications,
          notes: result.notes,
        },
        meta: {
          totalCount: result.totalCount,
          cached: result.cached,
          fetchTime: result.fetchTime,
        },
      });
    } catch (error) {
      console.error('Route error:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Patient not found',
          message: error.message,
        });
      }

      res.status(500).json({
        error: 'Failed to fetch EMR data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

/**
 * Example 9: Cache management
 */
export async function exampleCacheManagement() {
  const patientId = 'patient_123';

  // Fetch data (will cache it)
  await emrService.fetchCarePlans(patientId);
  await emrService.fetchMedications(patientId);
  await emrService.fetchNotes(patientId);

  // Check cache stats
  const stats = emrService.getCacheStats();
  console.log('Cache stats:', stats);
  console.log(`Total cached entries: ${stats.size}`);

  // Clear cache for specific patient
  console.log(`\nClearing cache for patient ${patientId}...`);
  emrService.clearPatientCache(patientId);

  // Check stats again
  const statsAfter = emrService.getCacheStats();
  console.log(`Cached entries after clear: ${statsAfter.size}`);
}

/**
 * Example 10: Batch fetch with rate limiting awareness
 */
export async function exampleBatchFetchWithRateLimit() {
  const patientIds = Array.from({ length: 100 }, (_, i) => `patient_${i}`);
  const batchSize = 5; // Fetch 5 at a time to respect rate limits
  const results: any[] = [];

  for (let i = 0; i < patientIds.length; i += batchSize) {
    const batch = patientIds.slice(i, i + batchSize);

    console.log(`Fetching batch ${i / batchSize + 1} (${batch.length} patients)...`);

    try {
      const batchResults = await Promise.allSettled(
        batch.map((patientId) => emrService.fetchAll(patientId))
      );

      const successful = batchResults
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as any).value);

      const failed = batchResults.filter((r) => r.status === 'rejected');

      results.push(...successful);

      console.log(`  Successful: ${successful.length}, Failed: ${failed.length}`);

      // Add delay between batches to respect rate limits
      if (i + batchSize < patientIds.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1 second delay
      }
    } catch (error) {
      console.error(`Batch ${i / batchSize + 1} failed:`, error);
    }
  }

  console.log(`\nTotal successful fetches: ${results.length}`);
  return results;
}
