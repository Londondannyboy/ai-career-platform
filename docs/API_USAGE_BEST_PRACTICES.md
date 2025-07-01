# API Usage Best Practices - Quest Platform

## Core Principle: Store Once, Query Many 🔄

Never call an external API for data you already have. This document outlines best practices learned from depleting DataMagnet credits.

## 1. The Golden Rule

```typescript
// ✅ ALWAYS follow this pattern
async function getData(identifier: string) {
  // 1. Check local storage FIRST
  const cached = await checkLocalStorage(identifier)
  if (cached && !isExpired(cached)) {
    return cached  // FREE!
  }
  
  // 2. Only call API if necessary
  const fresh = await callExternalAPI(identifier)  // COSTS MONEY!
  
  // 3. Store for future use
  await storeLocally(identifier, fresh)
  
  return fresh
}
```

## 2. API-Specific Patterns

### DataMagnet (LinkedIn Data)
**Cost**: ~$1 per profile/company lookup  
**Storage**: Neo4j with unique identifiers

```typescript
// Person profiles
MERGE (p:Person {username: $username})  // philipaga, not full URL

// Company profiles  
MERGE (c:Company {identifier: $identifier})  // ckdelta, not full URL
```

### Apify (Bulk Scraping)
**Cost**: Variable based on compute units  
**Storage**: Process immediately, store results

```typescript
// Store employee lists by company
await neo4j.storeEmployeeList(companyId, employees)

// Don't re-scrape if data exists
const existing = await neo4j.getEmployeeList(companyId)
if (existing && existing.length > 0) return existing
```

### OpenAI (AI Processing)
**Cost**: ~$0.01-0.10 per request  
**Strategy**: Cache prompts and responses

```typescript
// Cache AI inferences
const cacheKey = `inference:${companyId}:${type}`
const cached = await redis.get(cacheKey)
if (cached) return JSON.parse(cached)

const result = await openai.complete(prompt)
await redis.set(cacheKey, JSON.stringify(result), 'EX', 86400) // 24h
```

## 3. Implementation Checklist

### For Every New API Integration:

- [ ] Implement local storage check BEFORE API call
- [ ] Use stable, unique identifiers (not URLs)
- [ ] Add cost tracking/logging
- [ ] Set up low-credit alerts
- [ ] Document cost per call in code
- [ ] Add "refresh" as optional action, not default
- [ ] Implement expiration logic if needed

## 4. Cost Management

### Set Quotas
```typescript
const DAILY_LIMITS = {
  datamagnet: 50,      // profiles
  apify: 10,           // scraping jobs
  openai: 1000,        // API calls
}

async function checkQuota(api: string) {
  const used = await getUsageToday(api)
  if (used >= DAILY_LIMITS[api]) {
    throw new Error(`Daily ${api} limit reached`)
  }
}
```

### Track Usage
```typescript
async function trackAPICall(api: string, cost: number) {
  await db.insert('api_usage', {
    api,
    cost,
    timestamp: new Date(),
    user_id: currentUser.id,
    endpoint: request.url
  })
}
```

## 5. Caching Strategies by Data Type

### Static Data (Changes Rarely)
- Company information
- Historical recommendations  
- Cache Duration: 30-90 days

### Dynamic Data (Changes Frequently)
- Current job titles
- Follower counts
- Cache Duration: 7-14 days

### Real-time Data (Always Fresh)
- Active job postings
- Live message data
- Cache Duration: Don't cache

## 6. Emergency Procedures

### When Credits Run Low:
1. **Immediate**: Switch to read-only mode from cache
2. **Alert**: Notify team via Slack/email
3. **Audit**: Run usage report to find heavy users
4. **Optimize**: Identify and fix any loops/repeated calls
5. **Replenish**: Add credits only after fixing root cause

## 7. Example: The Philip Graph Success

### Before (Inefficient)
- Every graph view = API call
- 50 views = 50 credits = $50

### After (Efficient)  
- First view = API call + Neo4j storage
- Next 49 views = Neo4j query only
- Total cost: $1 (98% reduction!)

## 8. Code Review Checklist

When reviewing PRs with API calls:
- [ ] Is there a cache check before the API call?
- [ ] Is the response stored for future use?
- [ ] Are errors handled gracefully?
- [ ] Is there a manual refresh option?
- [ ] Are costs documented in comments?

## 9. Testing Best Practices

### Local Development
```typescript
// Use mock data in development
if (process.env.NODE_ENV === 'development') {
  return getMockData(identifier)
}
```

### Staging Environment
- Use separate API keys with lower limits
- Monitor usage closely
- Test caching behavior

## 10. Future Improvements

1. **Implement Redis** for faster caching
2. **Add CDN** for static resources  
3. **Create data pipeline** for batch updates
4. **Build usage dashboard** for monitoring
5. **Set up cost alerts** in Vercel/AWS

---

Remember: Every API call costs money. Every cache hit saves money. Optimize accordingly! 💰