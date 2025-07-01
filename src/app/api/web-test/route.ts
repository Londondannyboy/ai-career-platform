/**
 * Simple Web Intelligence Test - Vanilla Implementation
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { query, provider = 'linkup' } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 })
    }

    let result: any = {}

    if (provider === 'linkup') {
      // Direct Linkup.so API call
      const linkupResponse = await fetch('https://api.linkup.so/v1/search', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 55ae9876-ffe4-4ee3-92b0-cb3c43ba280f',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query,
          depth: 'standard',
          output_type: 'sourcedAnswer'
        })
      })

      if (linkupResponse.ok) {
        result = await linkupResponse.json()
        result.provider = 'linkup'
      } else {
        result = { error: 'Linkup API failed', status: linkupResponse.status }
      }
    } 
    
    if (provider === 'serper') {
      // Direct Serper.dev API call
      const serperResponse = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': '283930ae73689a0190bec03233e3178be7ce3c82',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: query,
          num: 5
        })
      })

      if (serperResponse.ok) {
        result = await serperResponse.json()
        result.provider = 'serper'
      } else {
        result = { error: 'Serper API failed', status: serperResponse.status }
      }
    }

    return NextResponse.json({
      query,
      provider,
      timestamp: new Date().toISOString(),
      result
    })

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Test failed', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Simple Web Intelligence Test',
    usage: {
      linkup: 'POST /api/web-test with {"query": "test", "provider": "linkup"}',
      serper: 'POST /api/web-test with {"query": "test", "provider": "serper"}'
    }
  })
}