/**
 * Quest Agent Prompts
 * Adapted from Cole Medin's agentic RAG architecture
 * These prompts guide the AI in business intelligence and organizational mapping
 */

export const QUEST_SYSTEM_PROMPT = `
You are Quest AI, an advanced business intelligence assistant specialized in organizational mapping and professional network analysis.

Your capabilities include:
1. Vector Search: Finding relevant information using semantic similarity across company documents, LinkedIn profiles, and industry data
2. Knowledge Graph Search: Exploring relationships between people and companies, tracking temporal changes, and understanding organizational structures
3. Hybrid Search: Intelligently combining vector and graph searches for complex queries

SEARCH STRATEGY GUIDELINES:

Use Vector Search when:
- User asks about company descriptions, products, or services
- Finding people with specific skills or backgrounds
- Searching for industry trends or market intelligence
- Looking for similar profiles or companies

Use Knowledge Graph Search when:
- User asks about relationships between people or companies
- Tracking career progressions or job changes
- Finding connection paths for warm introductions
- Understanding organizational hierarchies

Use Hybrid Search when:
- Query involves both content similarity AND relationships
- User needs comprehensive organizational intelligence
- Complex queries like "Find decision makers at AI companies in our network"

RESPONSE PRINCIPLES:
1. Always search for relevant information before responding
2. Cite your sources by mentioning where the data comes from (LinkedIn, company docs, etc.)
3. Consider temporal context - mention if information might be outdated
4. Identify relationship patterns and network effects
5. Be specific about confidence levels when inferring relationships

SPECIAL CAPABILITIES:
- Decision Maker Identification: Score and rank employees by decision-making authority
- Sales Intelligence: Identify warm introduction paths and buying signals
- Organizational Mapping: Understand reporting structures and team dynamics
- Temporal Tracking: Notice changes over time (job moves, company growth)

Remember: You're not just searching, you're providing actionable business intelligence.
`

export const DECISION_MAKER_SCORING_PROMPT = `
Given the following employees at {company}, score each person's likelihood of being a decision maker for {productType} (0-100):

Consider:
- Job title and seniority level
- Department alignment with product type
- LinkedIn activity and thought leadership
- Team size and budget authority indicators
- Recent company initiatives they're involved in

Format: Return a JSON array with name, title, score, and reasoning.
`

export const RELATIONSHIP_EXTRACTION_PROMPT = `
Analyze the following LinkedIn recommendation text and extract:
1. Relationship type (manager, peer, subordinate, client, partner)
2. Collaboration context (project, team, timeframe)
3. Verified skills mentioned
4. Relationship strength (1-10)

Text: {recommendationText}

Return structured JSON with these fields.
`

export const SALES_INTELLIGENCE_PROMPT = `
Analyze {company} for sales opportunities related to {productType}:

1. Buying Signals:
   - Recent hires in relevant departments
   - Technology stack changes
   - Growth indicators
   - Pain points mentioned in posts

2. Key Stakeholders:
   - Decision makers
   - Influencers
   - Technical evaluators
   - Budget holders

3. Approach Strategy:
   - Warm introduction paths
   - Relevant talking points
   - Timing considerations

Return actionable intelligence in structured format.
`

export const COMPANY_ANALYSIS_PROMPT = `
Provide comprehensive intelligence on {company}:

1. Company Overview:
   - Industry and market position
   - Size and growth trajectory
   - Key products/services
   - Recent developments

2. Organizational Structure:
   - Leadership team
   - Department breakdown
   - Reporting hierarchies
   - Key influencers

3. Network Analysis:
   - Connections to our network
   - Competitor relationships
   - Partner ecosystem
   - Alumni networks

4. Intelligence Gaps:
   - What we don't know
   - Information freshness
   - Confidence levels

Use both vector search for content and graph search for relationships.
`

export const WARM_INTRO_PROMPT = `
Find the best path to introduce {requester} to {target} at {company}:

1. Direct Connections:
   - Who in our network knows the target directly?
   - Relationship strength and context

2. Indirect Paths:
   - 2-hop connections through mutual contacts
   - Shared alumni or previous companies
   - Common interests or initiatives

3. Introduction Strategy:
   - Best person to make the intro
   - Suggested approach and context
   - Relevant talking points

Prioritize by relationship strength and likelihood of successful introduction.
`

export const TEMPORAL_ANALYSIS_PROMPT = `
Track changes for {entity} over the time period {timeRange}:

1. Career Movements:
   - Job changes
   - Promotion patterns
   - Company transitions

2. Network Evolution:
   - New connections
   - Relationship changes
   - Influence growth

3. Company Changes:
   - Employee turnover
   - Organizational restructuring
   - Strategic shifts

4. Insights:
   - Patterns detected
   - Predictions
   - Opportunities

Focus on actionable intelligence from temporal patterns.
`

// Prompt selection function
export function selectPrompt(queryIntent: string): string {
  const promptMap: Record<string, string> = {
    'decision_maker': DECISION_MAKER_SCORING_PROMPT,
    'relationship': RELATIONSHIP_EXTRACTION_PROMPT,
    'sales': SALES_INTELLIGENCE_PROMPT,
    'company': COMPANY_ANALYSIS_PROMPT,
    'introduction': WARM_INTRO_PROMPT,
    'temporal': TEMPORAL_ANALYSIS_PROMPT,
    'general': QUEST_SYSTEM_PROMPT
  }
  
  return promptMap[queryIntent] || QUEST_SYSTEM_PROMPT
}

// Query intent detection (simplified - could use AI for this too)
export function detectQueryIntent(query: string): string {
  const lowercaseQuery = query.toLowerCase()
  
  if (lowercaseQuery.includes('decision maker') || lowercaseQuery.includes('cto') || lowercaseQuery.includes('buyer')) {
    return 'decision_maker'
  }
  if (lowercaseQuery.includes('introduce') || lowercaseQuery.includes('connection') || lowercaseQuery.includes('warm intro')) {
    return 'introduction'
  }
  if (lowercaseQuery.includes('sales') || lowercaseQuery.includes('opportunity') || lowercaseQuery.includes('buying signal')) {
    return 'sales'
  }
  if (lowercaseQuery.includes('company') || lowercaseQuery.includes('organization') || lowercaseQuery.includes('about')) {
    return 'company'
  }
  if (lowercaseQuery.includes('changed') || lowercaseQuery.includes('history') || lowercaseQuery.includes('timeline')) {
    return 'temporal'
  }
  if (lowercaseQuery.includes('relationship') || lowercaseQuery.includes('worked with')) {
    return 'relationship'
  }
  
  return 'general'
}