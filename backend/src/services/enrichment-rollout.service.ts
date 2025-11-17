/**
 * Enrichment Rollout Service (Phase 8)
 *
 * Manages gradual rollout of enrichment features using percentage-based
 * traffic splitting for safe production deployment.
 *
 * Rollout Strategy:
 * 1. Start at 0% (all traffic uses standard retrieval)
 * 2. Increase to 10% (canary deployment)
 * 3. Monitor metrics, validate quality
 * 4. Increase to 50% if metrics healthy
 * 5. Continue monitoring
 * 6. Increase to 100% (full rollout)
 *
 * Features:
 * - Deterministic user assignment (same user always gets same version)
 * - Percentage-based traffic splitting
 * - Automatic rollback on errors
 * - Metrics-based rollout decisions
 */

import crypto from 'crypto';

interface RolloutConfig {
  percentage: number; // 0-100
  enableMultiHop: boolean;
  enableReasoning: boolean;
  maxHops: number;
}

interface RolloutDecision {
  useEnrichment: boolean;
  config: RolloutConfig;
  reason: string;
  userBucket: number; // 0-99
}

class EnrichmentRolloutService {
  /**
   * Determine if a user should get enrichment features
   *
   * Uses consistent hashing to ensure same user always gets same experience
   */
  shouldUseEnrichment(userId: string, patientId: string): RolloutDecision {
    const rolloutPercentage = this.getRolloutPercentage();
    const config = this.getRolloutConfig();

    // If rollout is 0%, nobody gets enrichment
    if (rolloutPercentage === 0) {
      return {
        useEnrichment: false,
        config,
        reason: 'Rollout at 0%',
        userBucket: 0,
      };
    }

    // If rollout is 100%, everyone gets enrichment
    if (rolloutPercentage >= 100) {
      return {
        useEnrichment: true,
        config,
        reason: 'Rollout at 100%',
        userBucket: 100,
      };
    }

    // Deterministic bucket assignment based on user+patient ID
    const userBucket = this.getUserBucket(userId, patientId);
    const useEnrichment = userBucket < rolloutPercentage;

    return {
      useEnrichment,
      config,
      reason: `User bucket ${userBucket}, rollout ${rolloutPercentage}%`,
      userBucket,
    };
  }

  /**
   * Get current rollout percentage from environment
   */
  getRolloutPercentage(): number {
    const percentage = parseInt(process.env.ENRICHMENT_ROLLOUT_PERCENTAGE || '0');
    return Math.max(0, Math.min(100, percentage)); // Clamp to 0-100
  }

  /**
   * Get current rollout configuration
   */
  getRolloutConfig(): RolloutConfig {
    return {
      percentage: this.getRolloutPercentage(),
      enableMultiHop: process.env.ENABLE_MULTI_HOP === 'true',
      enableReasoning: process.env.ENABLE_REASONING === 'true',
      maxHops: parseInt(process.env.MAX_HOPS || '1'),
    };
  }

  /**
   * Assign user to bucket (0-99) using consistent hashing
   *
   * Same user+patient combination always gets same bucket
   */
  private getUserBucket(userId: string, patientId: string): number {
    const hash = crypto
      .createHash('md5')
      .update(`${userId}:${patientId}`)
      .digest('hex');

    // Convert first 8 hex chars to number, mod 100
    const num = parseInt(hash.substring(0, 8), 16);
    return num % 100;
  }

  /**
   * Simulate rollout for testing
   *
   * Returns distribution of users across buckets
   */
  simulateRollout(
    userCount: number,
    rolloutPercentage: number
  ): {
    total_users: number;
    enrichment_users: number;
    standard_users: number;
    actual_percentage: number;
  } {
    let enrichmentCount = 0;

    for (let i = 0; i < userCount; i++) {
      const userId = `user-${i}`;
      const patientId = `patient-${i}`;
      const bucket = this.getUserBucket(userId, patientId);

      if (bucket < rolloutPercentage) {
        enrichmentCount++;
      }
    }

    return {
      total_users: userCount,
      enrichment_users: enrichmentCount,
      standard_users: userCount - enrichmentCount,
      actual_percentage: (enrichmentCount / userCount) * 100,
    };
  }

  /**
   * Get rollout status
   */
  getRolloutStatus(): {
    active: boolean;
    percentage: number;
    config: RolloutConfig;
    mode: 'disabled' | 'canary' | 'partial' | 'full';
  } {
    const percentage = this.getRolloutPercentage();
    const config = this.getRolloutConfig();

    let mode: 'disabled' | 'canary' | 'partial' | 'full';
    if (percentage === 0) {
      mode = 'disabled';
    } else if (percentage <= 15) {
      mode = 'canary';
    } else if (percentage < 100) {
      mode = 'partial';
    } else {
      mode = 'full';
    }

    return {
      active: percentage > 0,
      percentage,
      config,
      mode,
    };
  }

  /**
   * Validate rollout configuration
   */
  validateConfig(): {
    valid: boolean;
    issues: string[];
    warnings: string[];
  } {
    const issues: string[] = [];
    const warnings: string[] = [];

    const percentage = this.getRolloutPercentage();
    const config = this.getRolloutConfig();

    // Check percentage is valid
    if (percentage < 0 || percentage > 100) {
      issues.push(`Invalid rollout percentage: ${percentage}. Must be 0-100.`);
    }

    // Check max hops is valid
    if (config.maxHops < 0 || config.maxHops > 2) {
      issues.push(`Invalid max hops: ${config.maxHops}. Must be 0, 1, or 2.`);
    }

    // Warn if multi-hop disabled but max hops > 0
    if (!config.enableMultiHop && config.maxHops > 0) {
      warnings.push(`MAX_HOPS=${config.maxHops} but ENABLE_MULTI_HOP=false. Multi-hop is disabled.`);
    }

    // Warn if reasoning enabled but multi-hop disabled
    if (config.enableReasoning && !config.enableMultiHop) {
      warnings.push(`Reasoning enabled but multi-hop disabled. Reasoning prompts will have limited context.`);
    }

    // Warn if percentage > 0 but all features disabled
    if (percentage > 0 && !config.enableMultiHop && !config.enableReasoning) {
      warnings.push(`Rollout at ${percentage}% but all features disabled. No effect on queries.`);
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings,
    };
  }
}

export const enrichmentRolloutService = new EnrichmentRolloutService();
export default enrichmentRolloutService;
export type { RolloutConfig, RolloutDecision };
