# API Usage Best Practices - Quest Platform

## Overview

This document outlines critical best practices for external API usage learned from production deployments, particularly the Philip graph visualization milestone that revealed inefficient DataMagnet API usage patterns.

## Core Principle: Store Once, Query Many

### The Problem We Solved
- **Issue**: Calling DataMagnet API repeatedly for the same LinkedIn profiles
- **Impact**: Depleted API credits worth hundreds of dollars
- **Root Cause**: No caching layer between API and application

### The Solution Pattern
```typescript
// Universal pattern for ALL external APIs
async function getExternalData(uniqueId: string, apiFunction: Function) {
  // 1. Always check local storage first
  const cached = await checkLocalStorage(uniqueId);
  if (cached && !isStale(cached)) {
    return cached;
  }
  
  // 2. Only call API if necessary
  const freshData = await apiFunction(uniqueId);
  
  // 3. Always store for future use
  await storeLocally(uniqueId, freshData);
  
  return freshData;
}
```

## API-Specific Guidelines

### DataMagnet API
**Purpose**: LinkedIn profile and company data extraction  
**Cost**: $0.02-0.04 per profile  
**Storage**: Neo4j graph database

```typescript
// Unique identifiers
Person: LinkedIn username (e.g., "john-doe-123abc")
Company: LinkedIn company ID (e.g., "microsoft")

// Implementation
const getPersonFromDataMagnet = async (username: string) => {
  // Check Neo4j first
  const existing = await neo4j.query(
    'MATCH (p:Person {username: $username}) RETURN p',
    { username }
  );
  
  if (existing.records.length > 0) {
    return existing.records[0].get('p').properties;
  }
  
  // Call API only if not cached
  const data = await datamagnet.getPerson(username);
  await neo4j.query(
    'CREATE (p:Person {username: $username, name: $name})',
    { username, name: data.name }
  );
  
  return data;
};
```

### Apify API (LinkedIn Scraping)
**Purpose**: Company employee listings  
**Cost**: Variable based on compute units  
**Storage**: Neo4j + temporary cache

```typescript
// Cache scraped employee lists for 24 hours
const EMPLOYEE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

const getCompanyEmployees = async (companyName: string) => {
  const cacheKey = `employees_${companyName}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < EMPLOYEE_CACHE_DURATION) {
      return data;
    }
  }
  
  // Run Apify actor only if cache expired
  const employees = await apify.getLinkedInEmployees(companyName);
  await redis.set(cacheKey, JSON.stringify({
    data: employees,
    timestamp: Date.now()
  }));
  
  return employees;
};
```

### OpenAI API
**Purpose**: AI coaching and analysis  
**Cost**: ~$0.03 per 1K tokens  
**Storage**: Conversation history in Supabase

```typescript
// Don't cache AI responses, but DO cache embeddings
const getEmbedding = async (text: string) => {
  const hash = createHash(text);
  
  // Check vector database
  const existing = await neon.query(
    'SELECT embedding FROM embeddings WHERE text_hash = $1',
    [hash]
  );
  
  if (existing.rows.length > 0) {
    return existing.rows[0].embedding;
  }
  
  // Generate only if not cached
  const embedding = await openai.createEmbedding(text);
  await neon.query(
    'INSERT INTO embeddings (text_hash, embedding) VALUES ($1, $2)',
    [hash, embedding]
  );
  
  return embedding;
};
```

## Cost Management Strategies

### 1. Implement Usage Quotas
```typescript
const API_QUOTAS = {
  datamagnet: {
    daily: 100,
    monthly: 2000,
    warningThreshold: 0.8
  },
  apify: {
    daily: 50,
    monthly: 1000,
    warningThreshold: 0.7
  }
};

const checkQuota = async (api: string) => {
  const usage = await getApiUsage(api);
  const quota = API_QUOTAS[api];
  
  if (usage.daily >= quota.daily) {
    throw new Error(`Daily quota exceeded for ${api}`);
  }
  
  if (usage.monthly >= quota.monthly * quota.warningThreshold) {
    await notifyAdmin(`${api} usage at ${usage.monthly / quota.monthly * 100}%`);
  }
};
```

### 2. Implement Request Queuing
```typescript
// Prevent bursts that trigger rate limits
const requestQueue = new Queue('api-requests', {
  concurrency: 5,
  interval: 1000, // 5 requests per second max
});

const queueApiRequest = async (apiCall: Function) => {
  return requestQueue.add(async () => {
    await checkQuota(apiCall.name);
    return apiCall();
  });
};
```

### 3. Monitor and Alert
```typescript
// Real-time monitoring
const monitorApiUsage = () => {
  setInterval(async () => {
    const usage = await getAllApiUsage();
    
    for (const [api, data] of Object.entries(usage)) {
      // Log to monitoring service
      metrics.gauge(`api.${api}.daily_usage`, data.daily);
      metrics.gauge(`api.${api}.credits_remaining`, data.creditsRemaining);
      
      // Alert if critical
      if (data.creditsRemaining < 100) {
        await pagerDuty.alert({
          severity: 'critical',
          message: `${api} credits below 100: ${data.creditsRemaining}`
        });
      }
    }
  }, 60000); // Check every minute
};
```

## Caching Strategy by Data Type

### 1. Static Data (Rarely Changes)
- **Examples**: Company info, historical data
- **Cache Duration**: 30 days
- **Storage**: Neo4j for relationships, PostgreSQL for attributes

### 2. Semi-Dynamic Data (Changes Weekly)
- **Examples**: LinkedIn profiles, employee lists
- **Cache Duration**: 7 days
- **Storage**: Neo4j with timestamp metadata

### 3. Dynamic Data (Changes Daily)
- **Examples**: Job postings, news
- **Cache Duration**: 24 hours
- **Storage**: Redis for speed, PostgreSQL for persistence

### 4. Real-time Data (Never Cache)
- **Examples**: AI conversations, live coaching
- **Cache Duration**: Don't cache responses
- **Storage**: Stream to user, store transcript only

## Implementation Checklist

### For Every New API Integration

- [ ] Identify unique identifiers for deduplication
- [ ] Choose appropriate storage backend
- [ ] Implement caching layer with TTL
- [ ] Add usage monitoring and quotas
- [ ] Create fallback for API failures
- [ ] Document rate limits and costs
- [ ] Add to central API dashboard
- [ ] Set up alerting thresholds
- [ ] Test cache hit rates
- [ ] Measure cost reduction

## Common Pitfalls to Avoid

### 1. Assuming Data Freshness Requirements
**Wrong**: "User profiles change, so never cache"  
**Right**: "Check if 24-hour old data is acceptable for use case"

### 2. Not Handling API Failures
**Wrong**: Throw error and block user  
**Right**: Use cached data with freshness indicator

### 3. Over-caching
**Wrong**: Cache AI responses that should be unique  
**Right**: Cache underlying data, not computed results

### 4. Under-monitoring
**Wrong**: Check credits manually when they run out  
**Right**: Automated monitoring with predictive alerts

## Cost Optimization Results

### Before Optimization
- DataMagnet: $200/day (5,000 profiles)
- Apify: $100/day (unnecessary re-scraping)
- Total: $9,000/month

### After Optimization
- DataMagnet: $20/day (500 new profiles)
- Apify: $10/day (daily updates only)
- Total: $900/month (90% reduction!)

## Emergency Procedures

### When API Credits Are Depleted

1. **Immediate**: Switch to cache-only mode
2. **Alert**: Notify on-call engineer
3. **Communicate**: Update status page
4. **Mitigate**: Enable read-only features
5. **Resolve**: Purchase credits or wait for renewal
6. **Post-mortem**: Analyze usage spike

### Cache Corruption Recovery

1. **Detect**: Monitor cache hit rates
2. **Isolate**: Identify corrupted keys
3. **Purge**: Clear affected cache entries
4. **Rebuild**: Gradually repopulate from API
5. **Verify**: Check data consistency

## Future Improvements

### 1. Predictive Caching
- Analyze user patterns
- Pre-cache likely requests during off-peak
- Use ML to predict next queries

### 2. Federated Caching
- Share anonymized cache between users
- Company data benefits all users
- Respect privacy boundaries

### 3. API Aggregation Layer
- Single interface for all external APIs
- Unified caching strategy
- Centralized cost management

## Conclusion

Efficient API usage is critical for Quest's scalability and profitability. By following these patterns, we can provide fast, reliable service while managing costs effectively. The "Store Once, Query Many" principle should be applied to every external data source.

Remember: **API credits are money. Treat them accordingly.**

---

*Last Updated: January 2025*  
*Version: 1.0*  
*Status: Production Guidelines*