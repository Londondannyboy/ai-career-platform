/**
 * Quest - Job Search API
 * Specialized job search using web intelligence
 */

import { webIntelligenceRouter } from '@/lib/web/webIntelligenceRouter'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { query, location, urgency = 'balanced', maxResults = 15 } = await request.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Job query is required' },
        { status: 400 }
      )
    }

    const result = await webIntelligenceRouter.searchJobs(
      query.trim(),
      location,
      urgency
    )

    // Transform results for job-specific format
    const jobResults = result.results.map(result => ({
      title: result.title,
      company: extractCompanyFromTitle(result.title),
      url: result.url,
      description: result.snippet,
      location: extractLocationFromSnippet(result.snippet) || location || 'Not specified',
      source: result.domain,
      provider: result.provider,
      score: result.score,
      postedDate: result.publishDate || 'Recently'
    }))

    return NextResponse.json({
      jobs: jobResults,
      totalJobs: result.totalResults,
      searchMetadata: {
        query,
        location,
        urgency,
        provider: result.provider,
        strategy: result.strategy,
        processingTime: result.processingTime,
        confidence: result.confidence
      },
      questMetadata: {
        searchType: 'job_search',
        timestamp: new Date().toISOString(),
        apiVersion: '1.0'
      }
    })

  } catch (error) {
    console.error('Job search API error:', error)
    
    return NextResponse.json(
      {
        error: 'Job search failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

function extractCompanyFromTitle(title: string): string {
  // Try to extract company name from job title
  // Common patterns: "Job Title at Company", "Company - Job Title", "Job Title | Company"
  const patterns = [
    /at\s+([^-|\n]+)/i,
    /([^-|\n]+)\s*-\s*/,
    /\|\s*([^|\n]+)/,
    /·\s*([^·\n]+)/
  ]

  for (const pattern of patterns) {
    const match = title.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return 'Company not specified'
}

function extractLocationFromSnippet(snippet: string): string | null {
  // Try to extract location from job snippet
  const locationPatterns = [
    /(?:in|at|located in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z]{2})?)/,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2})\s/,
    /(Remote|Hybrid|On-site)/i
  ]

  for (const pattern of locationPatterns) {
    const match = snippet.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }

  return null
}