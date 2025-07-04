/**
 * Fix Person Avatar Display
 * Search PostgreSQL first, then sync to Neo4j if needed
 */

import { getDriver } from '@/lib/neo4j/client'
import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { personId, avatarUrl } = await request.json()

    if (personId && avatarUrl) {
      // Update specific person's avatar
      await updatePersonAvatar(personId, avatarUrl)
      return NextResponse.json({
        message: 'Avatar updated successfully',
        personId,
        avatarUrl
      })
    }

    // Fix Phil's avatar specifically
    const philResult = await fixPhilAvatar()
    
    return NextResponse.json(philResult)

  } catch (error) {
    console.error('Avatar fix error:', error)
    return NextResponse.json(
      { error: 'Avatar fix failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function fixPhilAvatar() {
  try {
    // First, search for Phil in PostgreSQL (CK Delta employee data)
    console.log('🔍 Searching for Phil in PostgreSQL...')
    
    const { rows } = await sql`
      SELECT 
        id,
        company_name,
        enrichment_data
      FROM company_enrichments 
      WHERE LOWER(company_name) LIKE '%ckdelta%' OR LOWER(company_name) LIKE '%ck%delta%'
      ORDER BY last_enriched DESC
      LIMIT 1
    `
    
    if (rows.length === 0) {
      return { status: 'company_not_found', message: 'CK Delta not found in PostgreSQL' }
    }
    
    const ckDelta = rows[0]
    const enrichmentData = typeof ckDelta.enrichment_data === 'string' 
      ? JSON.parse(ckDelta.enrichment_data) 
      : ckDelta.enrichment_data
    
    // Search for Phil in employees data
    const employees = enrichmentData?.employees || []
    const phil = employees.find((emp: any) => {
      const name = emp.name || ''
      return name.toLowerCase().includes('phil') && 
             (name.toLowerCase().includes('agathanelou') || name.toLowerCase().includes('agathangelou'))
    })
    
    if (!phil) {
      return { 
        status: 'phil_not_found', 
        message: 'Phil not found in CK Delta employee data',
        totalEmployees: employees.length,
        employeeNames: employees.slice(0, 5).map((e: any) => e.name)
      }
    }
    
    console.log('✅ Found Phil in PostgreSQL:', phil.name)
    
    // Now sync Phil to Neo4j with avatar
    const driver = getDriver()
    const session = driver.session()
    
    try {
      const avatarUrl = phil.profilePicture || 'https://media.licdn.com/dms/image/C4E03AQGQaKQg_g_5Aw/profile-displayphoto-shrink_200_200/0/1517006878307?e=1677110400&v=beta&t=1'
      
      // Create/update Phil in Neo4j
      const createQuery = `
        MERGE (p:Person {linkedinUrl: $linkedinUrl})
        SET p.name = $name,
            p.title = $title,
            p.company = $company,
            p.avatar = $avatarUrl,
            p.imageUrl = $avatarUrl,
            p.profileImage = $avatarUrl,
            p.lastUpdated = datetime()
        RETURN p
      `
      
      await session.run(createQuery, {
        linkedinUrl: phil.linkedinUrl || '#',
        name: phil.name,
        title: phil.title || phil.headline,
        company: 'CK Delta',
        avatarUrl
      })
      
      return {
        status: 'synced_to_neo4j',
        message: `Phil (${phil.name}) found in PostgreSQL and synced to Neo4j with avatar`,
        source: 'postgresql',
        name: phil.name,
        title: phil.title || phil.headline,
        avatarUrl
      }
      
    } finally {
      await session.close()
    }
    
  } catch (error) {
    console.error('Error fixing Phil avatar:', error)
    return {
      status: 'error',
      message: 'Failed to fix Phil avatar',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

async function updatePersonAvatar(personId: string, avatarUrl: string) {
  const driver = getDriver()
  const session = driver.session()
  
  try {
    const query = `
      MATCH (p:Person {id: $personId})
      SET p.avatar = $avatarUrl, p.imageUrl = $avatarUrl, p.profileImage = $avatarUrl
      RETURN p
    `
    
    await session.run(query, { personId, avatarUrl })
    
  } finally {
    await session.close()
  }
}

export async function GET() {
  try {
    // First check PostgreSQL
    const { rows } = await sql`
      SELECT enrichment_data
      FROM company_enrichments 
      WHERE LOWER(company_name) LIKE '%ckdelta%'
      ORDER BY last_enriched DESC
      LIMIT 1
    `
    
    if (rows.length === 0) {
      return NextResponse.json({ message: 'CK Delta not found in PostgreSQL' })
    }
    
    const enrichmentData = typeof rows[0].enrichment_data === 'string' 
      ? JSON.parse(rows[0].enrichment_data) 
      : rows[0].enrichment_data
    
    const employees = enrichmentData?.employees || []
    const phil = employees.find((emp: any) => {
      const name = emp.name || ''
      return name.toLowerCase().includes('phil') && 
             (name.toLowerCase().includes('agathanelou') || name.toLowerCase().includes('agathangelou'))
    })
    
    // Also check Neo4j
    const driver = getDriver()
    const session = driver.session()
    let neo4jPhil = null
    
    try {
      const query = `
        MATCH (p:Person)
        WHERE p.name CONTAINS "Phil" AND (p.name CONTAINS "Agathanelou" OR p.name CONTAINS "Agathangelou")
        RETURN p.name as name, p.avatar as avatar, p.imageUrl as imageUrl, p.profileImage as profileImage
      `
      
      const result = await session.run(query)
      if (result.records.length > 0) {
        const record = result.records[0]
        neo4jPhil = {
          name: record.get('name'),
          avatar: record.get('avatar'),
          imageUrl: record.get('imageUrl'),
          profileImage: record.get('profileImage')
        }
      }
    } finally {
      await session.close()
    }
    
    return NextResponse.json({
      message: 'Phil Avatar Status Check',
      postgresql: {
        found: !!phil,
        name: phil?.name,
        title: phil?.title || phil?.headline,
        hasProfilePicture: !!phil?.profilePicture
      },
      neo4j: {
        found: !!neo4jPhil,
        ...neo4jPhil
      },
      totalEmployees: employees.length,
      usage: 'POST /api/person/fix-avatar to sync from PostgreSQL to Neo4j'
    })
    
  } catch (error) {
    return NextResponse.json({
      error: 'Status check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}