/**
 * Debug Tavily API - Simple test to see exact response
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { query = 'test query' } = await request.json()

    console.log('Making Tavily request with query:', query)

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY || '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',
        query: query,
        search_depth: 'basic',
        include_answer: true,
        include_raw_content: false,
        max_results: 5
      })
    })

    console.log('Tavily response status:', response.status)
    console.log('Tavily response headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('Tavily response text:', responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = { rawText: responseText }
    }

    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      requestSent: {
        api_key: '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',
        query: query,
        search_depth: 'basic',
        include_answer: true,
        max_results: 5
      }
    })

  } catch (error) {
    console.error('Tavily debug error:', error)
    
    return NextResponse.json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Tavily Debug Endpoint',
    usage: 'POST with {"query": "test"} to debug Tavily API'
  })
}