/**
 * Corporate Hierarchy Management
 * Create and manage parent/subsidiary company relationships
 */

import { getDriver } from '@/lib/neo4j/client'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { action, parentCompany, subsidiaryCompany, relationshipType } = await request.json()

    switch (action) {
      case 'create':
        const result = await createHierarchyRelationship(parentCompany, subsidiaryCompany, relationshipType)
        return NextResponse.json(result)
      
      case 'setup_ck_delta':
        const ckResult = await setupCKDeltaHierarchy()
        return NextResponse.json(ckResult)
      
      case 'analyze':
        const analysis = await analyzeCurrentHierarchy()
        return NextResponse.json(analysis)
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Corporate hierarchy error:', error)
    return NextResponse.json(
      { error: 'Hierarchy operation failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function createHierarchyRelationship(parentName: string, subsidiaryName: string, relationshipType: string = 'PARENT_OF') {
  const driver = getDriver()
  const session = driver.session()
  
  try {
    // Create the hierarchy relationship
    const query = `
      MATCH (parent:Company {name: $parentName})
      MATCH (subsidiary:Company {name: $subsidiaryName})
      CREATE (parent)-[r:${relationshipType} {
        created: datetime(),
        type: $relationshipType
      }]->(subsidiary)
      CREATE (subsidiary)-[:SUBSIDIARY_OF {
        created: datetime(),
        parent: parent.name
      }]->(parent)
      RETURN parent.name as parentName, subsidiary.name as subsidiaryName, type(r) as relationship
    `
    
    const result = await session.run(query, { 
      parentName, 
      subsidiaryName, 
      relationshipType 
    })
    
    if (result.records.length === 0) {
      throw new Error('Companies not found - check company names exist')
    }
    
    return {
      message: 'Hierarchy relationship created successfully',
      parent: result.records[0].get('parentName'),
      subsidiary: result.records[0].get('subsidiaryName'),
      relationship: result.records[0].get('relationship')
    }
    
  } finally {
    await session.close()
  }
}

async function setupCKDeltaHierarchy() {
  const driver = getDriver()
  const session = driver.session()
  
  try {
    // Create CK Delta corporate hierarchy as example
    const setupQueries = [
      // Create companies if they don't exist
      `
        MERGE (ckDelta:Company {name: 'CK Delta'})
        SET ckDelta.industry = 'Data Science', 
            ckDelta.type = 'Subsidiary'
      `,
      `
        MERGE (ckHutchinson:Company {name: 'CK Hutchinson Group'})
        SET ckHutchinson.industry = 'Conglomerate', 
            ckHutchinson.type = 'Parent Company'
      `,
      `
        MERGE (hutchinson:Company {name: 'Hutchinson Whampoa'})
        SET hutchinson.industry = 'Investment Holding', 
            hutchinson.type = 'Ultimate Parent'
      `,
      `
        MERGE (ckAsset:Company {name: 'CK Asset Holdings'})
        SET ckAsset.industry = 'Asset Management', 
            ckAsset.type = 'Sister Company'
      `,
      // Create hierarchy relationships
      `
        MATCH (parent:Company {name: 'CK Hutchinson Group'})
        MATCH (subsidiary:Company {name: 'CK Delta'})
        MERGE (parent)-[:PARENT_OF {created: datetime()}]->(subsidiary)
        MERGE (subsidiary)-[:SUBSIDIARY_OF {created: datetime()}]->(parent)
      `,
      `
        MATCH (ultimate:Company {name: 'Hutchinson Whampoa'})
        MATCH (holding:Company {name: 'CK Hutchinson Group'})
        MERGE (ultimate)-[:PARENT_OF {created: datetime()}]->(holding)
        MERGE (holding)-[:SUBSIDIARY_OF {created: datetime()}]->(ultimate)
      `,
      `
        MATCH (parent:Company {name: 'CK Hutchinson Group'})
        MATCH (sister:Company {name: 'CK Asset Holdings'})
        MERGE (parent)-[:PARENT_OF {created: datetime()}]->(sister)
        MERGE (sister)-[:SUBSIDIARY_OF {created: datetime()}]->(parent)
      `,
      // Create sister company relationship
      `
        MATCH (ck1:Company {name: 'CK Delta'})
        MATCH (ck2:Company {name: 'CK Asset Holdings'})
        MERGE (ck1)-[:SISTER_COMPANY {created: datetime()}]->(ck2)
        MERGE (ck2)-[:SISTER_COMPANY {created: datetime()}]->(ck1)
      `
    ]
    
    for (const query of setupQueries) {
      await session.run(query)
    }
    
    return {
      message: 'CK Delta corporate hierarchy created successfully',
      hierarchy: {
        ultimateParent: 'Hutchinson Whampoa',
        parentCompany: 'CK Hutchinson Group',
        subsidiaries: ['CK Delta', 'CK Asset Holdings'],
        sisterCompanies: ['CK Delta ↔ CK Asset Holdings']
      }
    }
    
  } finally {
    await session.close()
  }
}

async function analyzeCurrentHierarchy() {
  const driver = getDriver()
  const session = driver.session()
  
  try {
    // Analyze existing hierarchy relationships
    const hierarchyQuery = `
      MATCH (parent:Company)-[r:PARENT_OF]->(subsidiary:Company)
      RETURN parent.name as parent, subsidiary.name as subsidiary, 
             parent.type as parentType, subsidiary.type as subsidiaryType
    `
    
    const sisterQuery = `
      MATCH (c1:Company)-[r:SISTER_COMPANY]->(c2:Company)
      RETURN c1.name as company1, c2.name as company2
    `
    
    const [hierarchyResult, sisterResult] = await Promise.all([
      session.run(hierarchyQuery),
      session.run(sisterQuery)
    ])
    
    const hierarchy = hierarchyResult.records.map(record => ({
      parent: record.get('parent'),
      subsidiary: record.get('subsidiary'),
      parentType: record.get('parentType'),
      subsidiaryType: record.get('subsidiaryType')
    }))
    
    const sisterCompanies = sisterResult.records.map(record => ({
      company1: record.get('company1'),
      company2: record.get('company2')
    }))
    
    return {
      message: 'Corporate hierarchy analysis',
      totalHierarchyRelationships: hierarchy.length,
      totalSisterRelationships: sisterCompanies.length / 2, // Divide by 2 as relationships are bidirectional
      hierarchy,
      sisterCompanies: sisterCompanies.filter((_, index) => index % 2 === 0), // Remove duplicates
      benefits: [
        'Enterprise sales can map complete corporate structure',
        'Understand decision-making hierarchy',
        'Identify sister divisions for cross-selling',
        'Map ultimate ownership for compliance'
      ]
    }
    
  } finally {
    await session.close()
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Corporate Hierarchy Management API',
    actions: {
      create: 'Create parent/subsidiary relationship',
      setup_ck_delta: 'Setup CK Delta hierarchy as example',
      analyze: 'Analyze current corporate relationships'
    },
    relationshipTypes: [
      'PARENT_OF - Parent company owns subsidiary',
      'SUBSIDIARY_OF - Subsidiary owned by parent', 
      'SISTER_COMPANY - Companies under same parent',
      'ULTIMATE_PARENT - Top-level ownership'
    ],
    example: {
      action: 'create',
      parentCompany: 'CK Hutchinson Group',
      subsidiaryCompany: 'CK Delta',
      relationshipType: 'PARENT_OF'
    }
  })
}