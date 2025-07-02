# Apollo.io Integration Documentation

## Overview
The Quest platform now integrates with Apollo.io's People Search API to enrich company data with employee profiles. This allows us to search for employees at any company and retrieve their professional information.

## 🚀 Quick Start

### Test the Integration
```bash
# Test Apollo API connection
curl https://ai-career-platform.vercel.app/api/test/apollo

# Search for employees at a specific company
curl https://ai-career-platform.vercel.app/api/enrich/company?name=Microsoft
```

### API Endpoints

#### 1. Company Enrichment
**POST** `/api/enrich/company`
```json
{
  "companyName": "Microsoft",
  "searchOptions": {
    "seniorityLevels": ["c_suite", "vp", "director"],
    "departments": ["sales", "engineering"],
    "titles": ["VP Sales", "Director of Engineering"],
    "perPage": 25,
    "page": 1,
    "includeDecisionMakers": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "company": "Microsoft",
  "totalEmployees": 221482,
  "profilesReturned": 25,
  "profiles": [
    {
      "linkedinUrl": "https://linkedin.com/in/...",
      "email": "john.doe@microsoft.com",
      "name": "John Doe",
      "headline": "VP of Sales at Microsoft",
      "currentPosition": "VP Sales",
      "currentCompany": "Microsoft",
      "location": "Seattle, WA, USA",
      "seniority": "vp",
      "departments": ["sales"],
      "dataSource": "apollo"
    }
  ],
  "decisionMakers": [...],
  "insights": {
    "departmentBreakdown": {
      "sales": 45,
      "engineering": 120,
      "marketing": 30
    },
    "seniorityBreakdown": {
      "c_suite": 5,
      "vp": 15,
      "director": 40
    },
    "topTitles": [
      {"value": "Software Engineer", "count": 50},
      {"value": "Sales Manager", "count": 20}
    ],
    "locations": [
      {"value": "Seattle, WA, USA", "count": 100},
      {"value": "Redmond, WA, USA", "count": 80}
    ]
  }
}
```

#### 2. Quick Search (GET)
**GET** `/api/enrich/company?name=CompanyName`

Returns top 10 employees including decision makers.

#### 3. Test Endpoint
**GET** `/api/test/apollo`

Tests the Apollo integration with sample companies (Microsoft, Google, Salesforce).

## 🔍 Search Options

### Seniority Levels
- `c_suite` - C-level executives (CEO, CTO, CFO, etc.)
- `vp` - Vice Presidents
- `director` - Directors
- `manager` - Managers
- `senior` - Senior individual contributors
- `entry` - Entry-level employees
- `owner` - Business owners

### Common Departments
- `sales`
- `engineering`
- `marketing`
- `hr`
- `finance`
- `operations`
- `product`
- `customer_success`
- `legal`
- `it`

## 💡 Use Cases

### 1. Find Decision Makers
```javascript
const response = await fetch('/api/enrich/company', {
  method: 'POST',
  body: JSON.stringify({
    companyName: 'Salesforce',
    searchOptions: {
      includeDecisionMakers: true
    }
  })
});
```

### 2. Search by Department
```javascript
const response = await fetch('/api/enrich/company', {
  method: 'POST',
  body: JSON.stringify({
    companyName: 'Google',
    searchOptions: {
      departments: ['sales'],
      perPage: 50
    }
  })
});
```

### 3. Find Specific Titles
```javascript
const response = await fetch('/api/enrich/company', {
  method: 'POST',
  body: JSON.stringify({
    companyName: 'Microsoft',
    searchOptions: {
      titles: ['VP Sales', 'Head of Sales', 'Sales Director'],
      perPage: 25
    }
  })
});
```

## 🔒 Rate Limits & Best Practices

1. **Rate Limiting**: Apollo has API rate limits. The service includes a 1-second delay between batch searches.

2. **Caching**: Consider implementing caching to reduce API calls for frequently searched companies.

3. **Pagination**: Use pagination for large companies to avoid timeouts:
   ```json
   {
     "searchOptions": {
       "perPage": 25,
       "page": 1
     }
   }
   ```

4. **Error Handling**: The API includes comprehensive error handling for rate limits, invalid companies, and network issues.

## 🗄️ Data Storage

Enriched profiles can be stored in the `unified_profiles` table with:
- `data_source: 'apollo'`
- `apollo_id` for tracking
- `last_updated` timestamp

## 🚦 Status Codes

- `200` - Success
- `400` - Bad request (missing company name)
- `500` - Server error (API issues, rate limits)

## 📊 Next Steps

1. **UI Integration**: Create search interface in the dashboard
2. **Profile Storage**: Implement database storage for enriched profiles
3. **Webhook Updates**: Set up webhooks for profile changes
4. **Caching Layer**: Add Redis caching for frequent searches
5. **Batch Processing**: Create job queue for bulk enrichment

## 🔑 Environment Variables

```env
APOLLO_API_KEY=your_apollo_api_key_here
```

## 🧪 Testing

The integration has been tested with major companies and returns:
- Employee profiles with names, titles, and seniority
- Email availability (varies by profile)
- LinkedIn URLs (when available)
- Department and location information
- Employment history

## ⚠️ Important Notes

1. **Email Availability**: Not all profiles include email addresses
2. **LinkedIn URLs**: Not all profiles have LinkedIn URLs
3. **Data Freshness**: Apollo data may not be real-time
4. **Search Accuracy**: Company name must match Apollo's database

## 🛠️ Troubleshooting

### Invalid API Key
```json
{
  "error": "Apollo API error: 401 - Unauthorized"
}
```
**Solution**: Check your API key in `.env.local`

### Rate Limiting
```json
{
  "error": "Apollo API error: 429 - Too Many Requests"
}
```
**Solution**: Implement delays between requests

### Company Not Found
Returns empty results array.
**Solution**: Try variations of company name or check Apollo's database

---

For more information, visit [Apollo API Documentation](https://docs.apollo.io/reference/people-search).