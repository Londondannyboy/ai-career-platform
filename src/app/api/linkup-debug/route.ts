/**
 * Debug Linkup.so API - Simple test to see exact error
 */

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { query = 'test query' } = await request.json()

    console.log('Making Linkup request with query:', query)

    const response = await fetch('https://api.linkup.so/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 55ae9876-ffe4-4ee3-92b0-cb3c43ba280f',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: query,
        depth: 'standard',
        outputType: 'sourcedAnswer'
      })
    })

    console.log('Linkup response status:', response.status)
    console.log('Linkup response headers:', Object.fromEntries(response.headers.entries()))

    const responseText = await response.text()
    console.log('Linkup response text:', responseText)

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
        q: query,
        depth: 'standard',
        outputType: 'sourcedAnswer'
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    
    return NextResponse.json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Linkup Debug Endpoint',
    usage: 'POST with {"query": "test"} to debug Linkup API'
  })
}