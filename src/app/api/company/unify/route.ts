/**
 * Simple Company Unifier
 * Basic duplicate detection and merging for company records
 */

import { Pool } from 'pg'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { dryRun = true } = await request.json()

    // Find potential duplicates using simple name matching
    const duplicates = await findDuplicateCompanies()
    
    if (dryRun) {
      return NextResponse.json({
        message: 'Company unification analysis (dry run)',
        duplicatesFound: duplicates.length,
        duplicates: duplicates.map(group => ({
          canonicalName: group[0].name,
          variants: group.map((c: any) => ({ id: c.id, name: c.name, similarity: c.similarity })),
          recommended: group.length > 1 ? 'merge' : 'keep'
        }))
      })
    }

    // Actually merge duplicates
    let mergedCount = 0
    for (const group of duplicates) {
      if (group.length > 1) {
        await mergeCompanyGroup(group)
        mergedCount++
      }
    }

    return NextResponse.json({
      message: 'Company unification completed',
      groupsMerged: mergedCount,
      totalDuplicatesResolved: duplicates.reduce((sum, group) => sum + group.length - 1, 0)
    })

  } catch (error) {
    console.error('Company unification error:', error)
    return NextResponse.json(
      { error: 'Unification failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function findDuplicateCompanies() {
  const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  const client = await pool.connect()
  
  // Get all companies
  const result = await client.query(`
    SELECT id, name, metadata
    FROM company_profiles
    ORDER BY name
  `)
  
  const companies = result.rows
  const duplicateGroups: any[] = []
  const processed = new Set()

  for (let i = 0; i < companies.length; i++) {
    if (processed.has(companies[i].id)) continue
    
    const group = [companies[i]]
    const baseName = cleanCompanyName(companies[i].name)
    
    // Find similar companies
    for (let j = i + 1; j < companies.length; j++) {
      if (processed.has(companies[j].id)) continue
      
      const similarity = calculateNameSimilarity(baseName, cleanCompanyName(companies[j].name))
      
      if (similarity > 0.8) { // 80% similarity threshold
        group.push({ ...companies[j], similarity })
        processed.add(companies[j].id)
      }
    }
    
    if (group.length > 1) {
      duplicateGroups.push(group)
    }
    processed.add(companies[i].id)
  }
  
  client.release()
  await pool.end()
  return duplicateGroups
}

function cleanCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(inc|ltd|llc|corp|corporation|company|co|limited)\b\.?/g, '')
    .replace(/[^\w\s]/g, '')
    .trim()
}

function calculateNameSimilarity(name1: string, name2: string): number {
  // Simple Levenshtein distance similarity
  const longer = name1.length > name2.length ? name1 : name2
  const shorter = name1.length > name2.length ? name2 : name1
  
  if (longer.length === 0) return 1.0
  
  const distance = levenshteinDistance(longer, shorter)
  return (longer.length - distance) / longer.length
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = []
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i]
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  
  return matrix[str2.length][str1.length]
}

async function mergeCompanyGroup(group: any[]) {
  const pool = new Pool({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })
  const client = await pool.connect()
  
  // Use first company as canonical
  const canonical = group[0]
  const duplicateIds = group.slice(1).map(c => c.id)
  
  // Update references to point to canonical company
  await client.query(`
    UPDATE person_profiles 
    SET metadata = jsonb_set(
      metadata, 
      '{company_id}', 
      to_jsonb($1::text)
    )
    WHERE metadata->>'company_id' = ANY($2)
  `, [canonical.id, duplicateIds])
  
  // Delete duplicate company records
  await client.query(`
    DELETE FROM company_profiles 
    WHERE id = ANY($1)
  `, [duplicateIds])
  
  console.log(`Merged ${duplicateIds.length} companies into ${canonical.name}`)
  
  client.release()
  await pool.end()
}

export async function GET() {
  return NextResponse.json({
    message: 'Company Unification API',
    usage: 'POST /api/company/unify with {"dryRun": true} to analyze duplicates',
    description: 'Finds and merges duplicate company records using name similarity'
  })
}