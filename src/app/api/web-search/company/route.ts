/**
 * Quest - Company Intelligence API
 * Deep company research using web intelligence
 */

import { webIntelligenceRouter } from '@/lib/web/webIntelligenceRouter'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { company, focus = 'overview', maxResults = 12 } = await request.json()

    if (!company || company.trim().length === 0) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    const validFocus = ['overview', 'news', 'careers'].includes(focus) ? focus : 'overview'
    
    const result = await webIntelligenceRouter.researchCompany(
      company.trim(),
      validFocus
    )

    // Extract key insights from the results
    const insights = extractCompanyInsights(result.results, validFocus)

    return NextResponse.json({
      company: company.trim(),
      focus: validFocus,
      insights,
      sources: result.results.map(result => ({
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        domain: result.domain,
        score: result.score,
        provider: result.provider,
        publishDate: result.publishDate
      })),
      intelligence: {
        totalSources: result.totalResults,
        provider: result.provider,
        strategy: result.strategy,
        processingTime: result.processingTime,
        confidence: result.confidence,
        searchDepth: validFocus === 'overview' ? 'comprehensive' : 'focused'
      },
      questMetadata: {
        searchType: 'company_intelligence',
        timestamp: new Date().toISOString(),
        apiVersion: '1.0'
      }
    })

  } catch (error) {
    console.error('Company intelligence API error:', error)
    
    return NextResponse.json(
      {
        error: 'Company research failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}

function extractCompanyInsights(results: any[], focus: string) {
  const insights = {
    keyPoints: [] as string[],
    recentNews: [] as any[],
    businessModel: '',
    industry: '',
    size: '',
    locations: [] as string[],
    keyPeople: [] as string[],
    competitors: [] as string[],
    financials: {} as Record<string, any>,
    jobOpenings: 0
  }

  // Extract insights based on focus
  switch (focus) {
    case 'overview':
      return extractOverviewInsights(results)
    case 'news':
      return extractNewsInsights(results)
    case 'careers':
      return extractCareersInsights(results)
    default:
      return extractOverviewInsights(results)
  }
}

function extractOverviewInsights(results: any[]) {
  const insights = {
    keyPoints: [] as string[],
    businessModel: '',
    industry: '',
    founded: '',
    headquarters: '',
    size: '',
    revenue: '',
    description: ''
  }

  // Extract key information from snippets
  results.forEach(result => {
    const snippet = result.snippet.toLowerCase()
    
    // Look for industry mentions
    if (snippet.includes('technology') || snippet.includes('software')) {
      insights.industry = 'Technology'
    } else if (snippet.includes('financial') || snippet.includes('banking')) {
      insights.industry = 'Financial Services'
    } else if (snippet.includes('healthcare') || snippet.includes('medical')) {
      insights.industry = 'Healthcare'
    }

    // Look for company size indicators
    if (snippet.includes('employees') || snippet.includes('staff')) {
      const sizeMatch = snippet.match(/(\d+[\d,]*)\s*(?:employees|staff)/i)
      if (sizeMatch) {
        insights.size = `~${sizeMatch[1]} employees`
      }
    }

    // Extract key points from titles and snippets
    if (result.title && !insights.keyPoints.includes(result.title)) {
      insights.keyPoints.push(result.title)
    }
  })

  // Use first result snippet as description
  if (results.length > 0) {
    insights.description = results[0].snippet
  }

  return insights
}

function extractNewsInsights(results: any[]) {
  return {
    recentNews: results.slice(0, 5).map(result => ({
      headline: result.title,
      summary: result.snippet,
      date: result.publishDate || 'Recent',
      source: result.domain,
      url: result.url
    })),
    newsVolume: results.length,
    sentimentIndicators: extractSentimentFromNews(results)
  }
}

function extractCareersInsights(results: any[]) {
  const jobCount = results.filter(r => 
    r.snippet.toLowerCase().includes('hiring') || 
    r.snippet.toLowerCase().includes('job') ||
    r.snippet.toLowerCase().includes('position')
  ).length

  return {
    jobOpenings: jobCount,
    hiringIndicators: results.slice(0, 3).map(result => ({
      title: result.title,
      description: result.snippet,
      source: result.domain
    })),
    careerPages: results.filter(r => 
      r.url.includes('career') || r.url.includes('job')
    ).map(r => r.url)
  }
}

function extractSentimentFromNews(results: any[]) {
  // Simple sentiment analysis based on keywords
  const positive = ['growth', 'expansion', 'success', 'profit', 'acquisition', 'partnership']
  const negative = ['layoffs', 'decline', 'loss', 'scandal', 'investigation', 'bankruptcy']
  
  let positiveCount = 0
  let negativeCount = 0
  
  results.forEach(result => {
    const text = (result.title + ' ' + result.snippet).toLowerCase()
    positive.forEach(word => {
      if (text.includes(word)) positiveCount++
    })
    negative.forEach(word => {
      if (text.includes(word)) negativeCount++
    })
  })
  
  return {
    positive: positiveCount,
    negative: negativeCount,
    neutral: results.length - positiveCount - negativeCount,
    overall: positiveCount > negativeCount ? 'positive' : 
             negativeCount > positiveCount ? 'negative' : 'neutral'
  }
}