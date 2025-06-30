import { NextRequest, NextResponse } from 'next/server'

/**
 * Raw test endpoint to see exact DataMagnet responses
 * GET /api/raw-test
 */
export async function GET() {
  const token = '2d7d15e9232a10e31ebb07242e79c4a4218b78ab430371d32ad657264103efe1'
  
  try {
    // Test Company API
    const companyResponse = await fetch('https://api.datamagnet.co/api/v1/linkedin/company', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://linkedin.com/company/ckdelta',
        use_cache: 'if-recent'
      })
    })
    
    const companyText = await companyResponse.text()
    let companyData = null
    try {
      companyData = JSON.parse(companyText)
    } catch (e) {
      companyData = { error: 'Failed to parse', text: companyText }
    }
    
    // Test People API
    const peopleResponse = await fetch('https://api.datamagnet.co/api/v1/linkedin/person', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://linkedin.com/in/philipaga'
      })
    })
    
    const peopleText = await peopleResponse.text()
    let peopleData = null
    try {
      peopleData = JSON.parse(peopleText)
    } catch (e) {
      peopleData = { error: 'Failed to parse', text: peopleText }
    }
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      company: {
        status: companyResponse.status,
        statusText: companyResponse.statusText,
        headers: Object.fromEntries(companyResponse.headers.entries()),
        data: companyData
      },
      people: {
        status: peopleResponse.status,
        statusText: peopleResponse.statusText,
        headers: Object.fromEntries(peopleResponse.headers.entries()),
        data: peopleData
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    })
  }
}