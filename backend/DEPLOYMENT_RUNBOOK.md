# Production Deployment Runbook - Enrichment Features

**Version:** 1.0
**Date:** 2025-11-15
**Owner:** Engineering Team
**Status:** Ready for Production

---

## 📋 Overview

This runbook provides step-by-step procedures for deploying enrichment features (Phases 4-7) to production using a gradual rollout strategy with monitoring and rollback capabilities.

---

## 🎯 Deployment Objectives

1. **Zero downtime** - Gradual rollout with no service interruption
2. **Safe rollout** - Start at 0%, increase to 10%, 50%, then 100%
3. **Continuous monitoring** - Track metrics at each stage
4. **Fast rollback** - Ability to disable features immediately if needed
5. **Quality validation** - Ensure enrichment improves response quality

---

## ✅ Pre-Deployment Checklist

### Infrastructure

- [ ] PostgreSQL running with enrichment tables (migrations 002, 003 applied)
- [ ] Enriched artifacts populated (run `scripts/test-enrichment.ts`)
- [ ] Enriched chunks populated (run `scripts/test-enhanced-chunking.ts`)
- [ ] FAISS index rebuilt with enriched chunks
- [ ] Ollama running with required models (`nomic-embed-text`, `llama3`)
- [ ] Sufficient disk space for FAISS index and PostgreSQL
- [ ] Backup of current FAISS index and PostgreSQL database

### Configuration

- [ ] `.env.production` file created with production credentials
- [ ] Feature flags set to safe defaults (all disabled, 0% rollout)
- [ ] Alert thresholds configured appropriately
- [ ] Monitoring endpoints accessible

### Testing

- [ ] All unit tests passing (`npm test`)
- [ ] Phase 4 test passed (enhanced chunking)
- [ ] Phase 5 test passed (multi-hop retrieval) - or documented as skipped
- [ ] Phase 7 integration test passed
- [ ] Load test completed in staging (100+ concurrent requests)
- [ ] A/B test validated in staging

---

## 🚀 Deployment Procedure

### Stage 1: Initial Production Deploy (Enrichment Disabled)

**Goal:** Deploy code to production with features disabled

**Environment Variables:**
```bash
ENABLE_MULTI_HOP=false
ENABLE_REASONING=false
MAX_HOPS=0
ENRICHMENT_ROLLOUT_PERCENTAGE=0
```

**Steps:**
1. Deploy backend code to production
2. Restart backend service
3. Verify health check passes: `GET /health`
4. Verify enrichment config: `GET /api/query/enrichment/config`
   - Should show: `multi_hop_enabled: false`, `rollout_percentage: 0`
5. Run smoke tests with standard queries
6. Monitor error rates and latency for 30 minutes

**Success Criteria:**
- [ ] Health check returns 200 OK
- [ ] Error rate < 1%
- [ ] P95 latency < 3000ms
- [ ] No degradation vs. pre-deployment baseline

**If issues:** Rollback to previous version

---

### Stage 2: Canary Deployment (10% Traffic)

**Goal:** Enable enrichment for 10% of users to validate in production

**Wait Time After Stage 1:** 1-2 hours (monitor baseline)

**Environment Variables:**
```bash
ENABLE_MULTI_HOP=true
ENABLE_REASONING=true
MAX_HOPS=1
ENRICHMENT_ROLLOUT_PERCENTAGE=10
```

**Steps:**
1. Update environment variables
2. Restart backend service (or use hot reload if supported)
3. Verify config: `GET /api/query/enrichment/config`
   - Should show: `multi_hop_enabled: true`, `rollout_percentage: 10`
4. Send test queries to `/api/query/enhanced`
5. Verify A/B test shows ~10% enrichment usage: `POST /api/query/enrichment/test`
6. Monitor metrics dashboard for 2-4 hours

**Monitoring Focus:**
- Error rate (should remain < 2%)
- Latency P95 (should remain < 3500ms)
- Latency P99 (should remain < 5000ms)
- Enrichment usage rate (~10%)
- User feedback/complaints

**Success Criteria:**
- [ ] Error rate < 2%
- [ ] P95 latency increase < 30%
- [ ] P99 latency increase < 40%
- [ ] No critical bugs reported
- [ ] Enrichment stats showing positive quality improvements

**If issues:** Decrease to 5% or rollback to 0%

---

### Stage 3: Partial Rollout (50% Traffic)

**Goal:** Expand to half of production traffic

**Wait Time After Stage 2:** 24-48 hours (validate canary stability)

**Environment Variables:**
```bash
ENABLE_MULTI_HOP=true
ENABLE_REASONING=true
MAX_HOPS=1
ENRICHMENT_ROLLOUT_PERCENTAGE=50
```

**Steps:**
1. Update `ENRICHMENT_ROLLOUT_PERCENTAGE=50`
2. Restart backend service
3. Verify config shows 50% rollout
4. Monitor metrics for 4-8 hours

**Monitoring Focus:**
- Compare enriched vs standard metrics
- Check for performance degradation at scale
- Validate quality improvements persist
- Monitor resource usage (CPU, memory, disk I/O)

**Success Criteria:**
- [ ] Error rate < 2%
- [ ] P95 latency < 3500ms
- [ ] P99 latency < 5000ms
- [ ] Enrichment quality score > 0.6
- [ ] No resource exhaustion

**If issues:** Decrease to 25% or rollback to 10%

---

### Stage 4: Full Rollout (100% Traffic)

**Goal:** Enable enrichment for all users

**Wait Time After Stage 3:** 48-72 hours (validate 50% stability)

**Environment Variables:**
```bash
ENABLE_MULTI_HOP=true
ENABLE_REASONING=true
MAX_HOPS=1
ENRICHMENT_ROLLOUT_PERCENTAGE=100
```

**Steps:**
1. Update `ENRICHMENT_ROLLOUT_PERCENTAGE=100`
2. Restart backend service
3. Verify config shows 100% rollout
4. Monitor metrics for 24 hours
5. Collect user feedback for 1 week

**Monitoring Focus:**
- Sustained performance at 100% traffic
- User satisfaction ratings
- Long-term stability
- Resource utilization trends

**Success Criteria:**
- [ ] Error rate < 2%
- [ ] P95 latency < 3500ms
- [ ] All users receiving enriched responses
- [ ] Positive user feedback
- [ ] Stable for 7 days

**If issues:** Decrease to 50% or rollback to previous stable percentage

---

### Stage 5: Optimization (Optional)

**Goal:** Enable advanced features for further quality improvements

**Wait Time After Stage 4:** 1-2 weeks (validate 100% stability)

**Environment Variables:**
```bash
ENABLE_MULTI_HOP=true
ENABLE_REASONING=true
MAX_HOPS=2  # Enable 2-hop expansion
ENRICHMENT_ROLLOUT_PERCENTAGE=100
```

**Steps:**
1. Gradually increase `MAX_HOPS` from 1 to 2
2. Start at 10% rollout with `MAX_HOPS=2`
3. Monitor latency impact carefully
4. Increase to 100% if performance acceptable

**Monitoring Focus:**
- Latency impact of 2-hop expansion
- Quality improvement from additional hops
- Resource usage with deeper relationships

---

## 🔙 Rollback Procedures

### Emergency Rollback (Critical Issues)

**When to use:** Critical bugs, severe performance degradation, security issues

**Steps:**
1. Immediately set environment variables:
   ```bash
   ENRICHMENT_ROLLOUT_PERCENTAGE=0
   ENABLE_MULTI_HOP=false
   ENABLE_REASONING=false
   ```
2. Restart backend service
3. Verify config shows rollout at 0%
4. Monitor error rates return to baseline
5. Investigate root cause
6. Document incident

**Recovery Time Objective (RTO):** < 5 minutes

---

### Partial Rollback (Performance Issues)

**When to use:** Elevated latency, warnings but no critical errors

**Steps:**
1. Reduce rollout percentage by 50%:
   ```bash
   # If at 100%, reduce to 50%
   # If at 50%, reduce to 25%
   # If at 25%, reduce to 10%
   ENRICHMENT_ROLLOUT_PERCENTAGE=<new_percentage>
   ```
2. Restart backend service
3. Monitor metrics for 2 hours
4. If improved, maintain; if not, reduce further

---

## 📊 Monitoring & Metrics

### Key Metrics to Track

**Performance Metrics:**
- `total_time_ms` (target: < 3000ms P95)
- `retrieval_time_ms` (target: < 500ms P95)
- `generation_time_ms` (target: < 2000ms P95)
- Error rate (target: < 2%)

**Enrichment Metrics:**
- `enrichment_usage_rate` (should match rollout percentage)
- `avg_enrichment_score` (target: > 0.6)
- `avg_relationships_per_query` (higher = better context)

**Quality Metrics:**
- User satisfaction ratings (via evaluation endpoints)
- Answer completeness (via structured extractions)
- Clinical accuracy (via manual review)

### Monitoring Endpoints

```bash
# Check current configuration
GET /api/query/enrichment/config

# Get aggregated metrics
GET /api/metrics

# Health check
GET /health

# A/B test comparison
POST /api/query/enrichment/test
```

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Error Rate | > 2% | > 5% |
| P95 Latency | > 3000ms | > 4000ms |
| P99 Latency | > 5000ms | > 7000ms |
| Enrichment Score | < 0.5 | < 0.3 |

---

## 🧪 Validation & Testing

### Pre-Rollout Validation

**Run in staging before each stage:**

1. **Load Test:**
   ```bash
   # Generate 100 concurrent queries
   ab -n 1000 -c 100 -p query.json \
     -T application/json \
     http://staging:3002/api/query/enhanced
   ```

2. **A/B Test:**
   ```bash
   # Compare standard vs enhanced
   curl -X POST http://staging:3002/api/query/enrichment/test \
     -H "Content-Type: application/json" \
     -d @test-query.json
   ```

3. **Smoke Tests:**
   ```bash
   # Test common query patterns
   npm run test:smoke
   ```

### Post-Rollout Validation

**After each stage increase:**

1. Verify metrics are within thresholds
2. Check error logs for new errors
3. Review sample enriched responses manually
4. Compare before/after quality metrics
5. Collect user feedback

---

## 📞 Escalation & Support

### Issue Severity Levels

**P0 - Critical (Rollback immediately):**
- Error rate > 5%
- Service completely down
- Data loss or corruption
- Security breach

**P1 - High (Investigate urgently, consider rollback):**
- Error rate > 2%
- P99 latency > 7000ms
- Significant user complaints

**P2 - Medium (Monitor closely, fix in next deploy):**
- P95 latency > 3500ms
- Quality degradation
- Minor bugs

**P3 - Low (Fix in regular development cycle):**
- Feature requests
- Non-critical improvements

### Contact Information

- **On-Call Engineer:** [Your oncall rotation]
- **Engineering Manager:** [Manager contact]
- **Database Admin:** [DBA contact]
- **DevOps/SRE:** [DevOps contact]

---

## 📝 Post-Deployment Review

### After Full Rollout (100%)

**Schedule:** 1 week after reaching 100%

**Review Topics:**
1. Deployment timeline vs. plan
2. Issues encountered and resolutions
3. Metrics comparison (before/after)
4. User feedback summary
5. Lessons learned
6. Recommendations for future deployments

**Document:**
- Actual rollout timeline
- Incidents and resolutions
- Performance impact analysis
- Quality improvement metrics
- Next steps for optimization

---

## ✅ Deployment Sign-Off

### Stage 1 (0% - Disabled)
- [ ] Deployed by: _______________ Date: _______________
- [ ] Verified by: _______________ Date: _______________

### Stage 2 (10% - Canary)
- [ ] Deployed by: _______________ Date: _______________
- [ ] Metrics reviewed by: _______________ Date: _______________
- [ ] Approved for Stage 3: _______________ Date: _______________

### Stage 3 (50% - Partial)
- [ ] Deployed by: _______________ Date: _______________
- [ ] Metrics reviewed by: _______________ Date: _______________
- [ ] Approved for Stage 4: _______________ Date: _______________

### Stage 4 (100% - Full)
- [ ] Deployed by: _______________ Date: _______________
- [ ] Final review by: _______________ Date: _______________
- [ ] Production deployment complete: _______________ Date: _______________

---

## 📚 References

- [Phase 4-6 Completion Summary](/backend/PHASE_4_5_6_COMPLETION_SUMMARY.md)
- [Phase 7 Integration Complete](/backend/PHASE_7_INTEGRATION_COMPLETE.md)
- [Enrichment Implementation Status](/ENRICHMENT_IMPLEMENTATION_STATUS.md)
- [Enhanced Query Controller](/backend/src/controllers/enhanced-query.controller.ts)
- [Enrichment Metrics Service](/backend/src/services/enrichment-metrics.service.ts)
- [Enrichment Rollout Service](/backend/src/services/enrichment-rollout.service.ts)

---

**DEPLOYMENT RUNBOOK VERSION:** 1.0
**LAST UPDATED:** 2025-11-15
**STATUS:** APPROVED FOR PRODUCTION USE ✅
