/**
 * Fix Person Avatar Display
 * Ensure avatar images are properly set in Neo4j person nodes
 */

import { neo4jClient } from '@/lib/neo4j/client'
import { NextRequest, NextResponse } from 'next/server'

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
    
    return NextResponse.json({
      message: 'Avatar fix completed',
      ...philResult
    })

  } catch (error) {
    console.error('Avatar fix error:', error)
    return NextResponse.json(
      { error: 'Avatar fix failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function fixPhilAvatar() {
  const session = neo4jClient.session()
  
  try {
    // Find Phil in Neo4j
    const philQuery = `
      MATCH (p:Person)
      WHERE p.name CONTAINS "Phil" AND p.name CONTAINS "Agathanelou"
      RETURN p
    `
    
    const result = await session.run(philQuery)
    
    if (result.records.length === 0) {
      return { status: 'not_found', message: 'Phil Agathanelou not found in Neo4j' }
    }

    const phil = result.records[0].get('p')
    const philId = phil.properties.id || phil.identity.toNumber()
    
    // Update Phil's avatar URL
    const avatarUrl = 'https://media.licdn.com/dms/image/C4E03AQGQaKQg_g_5Aw/profile-displayphoto-shrink_200_200/0/1517006878307?e=1677110400&v=beta&t=1'
    
    const updateQuery = `
      MATCH (p:Person)
      WHERE p.name CONTAINS "Phil" AND p.name CONTAINS "Agathanelou"
      SET p.avatar = $avatarUrl, p.imageUrl = $avatarUrl, p.profileImage = $avatarUrl
      RETURN p
    `
    
    await session.run(updateQuery, { avatarUrl })
    
    return {
      status: 'updated',
      message: 'Phil Agathanelou avatar updated successfully',
      personId: philId,
      avatarUrl
    }
    
  } finally {
    await session.close()
  }
}

async function updatePersonAvatar(personId: string, avatarUrl: string) {
  const session = neo4jClient.session()
  
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
  const session = neo4jClient.session()
  
  try {
    // Check current avatar status
    const query = `
      MATCH (p:Person)
      WHERE p.name CONTAINS "Phil" AND p.name CONTAINS "Agathanelou"
      RETURN p.name as name, p.avatar as avatar, p.imageUrl as imageUrl, p.profileImage as profileImage
    `
    
    const result = await session.run(query)
    
    if (result.records.length === 0) {
      return NextResponse.json({ message: 'Phil Agathanelou not found' })
    }
    
    const record = result.records[0]
    return NextResponse.json({
      message: 'Current avatar status for Phil Agathanelou',
      name: record.get('name'),
      avatar: record.get('avatar'),
      imageUrl: record.get('imageUrl'), 
      profileImage: record.get('profileImage'),
      usage: 'POST /api/person/fix-avatar to update avatars'
    })
    
  } finally {
    await session.close()
  }
}