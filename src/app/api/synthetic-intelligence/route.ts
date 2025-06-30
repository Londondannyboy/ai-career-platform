import { NextResponse } from 'next/server'
import { getCKDeltaService } from '@/lib/synthetic/ckdelta'
import { getApifyService } from '@/lib/apify'
import { getEmailDomainValidationService } from '@/lib/validation/emailDomain'

export const runtime = 'nodejs'

/**
 * POST /api/synthetic-intelligence
 * Create synthetic organizational intelligence for companies
 */
export async function POST(request: Request) {
  try {
    const { company, action, maxEmployees = 25 } = await request.json()
    
    console.log(`🚀 Synthetic Intelligence API called: ${action} for ${company}`)
    
    // Validate inputs
    if (!company || !action) {
      return NextResponse.json(
        { error: 'Company and action are required' },
        { status: 400 }
      )
    }

    switch (action) {
      case 'create_synthetic_view':
        return await handleCreateSyntheticView(company, maxEmployees)
      
      case 'test_connection':
        return await handleTestConnection()
      
      case 'validate_domain':
        return await handleValidateDomain(company)
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('❌ Synthetic Intelligence API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * Handle synthetic view creation
 */
async function handleCreateSyntheticView(company: string, maxEmployees: number) {
  try {
    // For now, only support CK Delta as test case
    if (company.toLowerCase() !== 'ck delta' && company.toLowerCase() !== 'ckdelta') {
      return NextResponse.json({
        success: false,
        message: `Synthetic intelligence for ${company} is not yet available. Currently testing with CK Delta only.`,
        supportedCompanies: ['CK Delta'],
        requestedCompany: company
      })
    }

    console.log(`🔍 Creating synthetic view for ${company}...`)
    
    // Get CK Delta service and create synthetic view
    const ckDeltaService = getCKDeltaService()
    const result = await ckDeltaService.createSyntheticView(maxEmployees)
    
    // Get summary for response
    const summary = ckDeltaService.getSummary(result)
    
    return NextResponse.json({
      success: true,
      company: result.companyName,
      domain: result.companyDomain,
      totalEmployees: result.totalEmployees,
      dataQuality: result.dataQuality,
      status: result.status,
      summary,
      departments: getDepartmentBreakdown(result.syntheticNodes),
      verificationRate: Math.round((result.verifiedEmployees.length / result.totalEmployees) * 100),
      createdAt: result.createdAt,
      // Graph data for visualization
      graphData: {
        nodes: result.syntheticNodes.map(node => ({
          id: node.id,
          name: node.name,
          role: node.role,
          department: node.department,
          level: node.level,
          color: node.color,
          size: node.size,
          nodeType: node.nodeType
        })),
        links: result.syntheticRelationships.map(rel => ({
          source: rel.source,
          target: rel.target,
          type: rel.type,
          color: rel.color,
          style: rel.style,
          width: rel.width,
          status: rel.relationshipStatus
        }))
      }
    })

  } catch (error) {
    console.error(`❌ Error creating synthetic view for ${company}:`, error)
    return NextResponse.json({
      success: false,
      error: 'Failed to create synthetic view',
      details: error.message,
      company
    }, { status: 500 })
  }
}

/**
 * Test Apify connection
 */
async function handleTestConnection() {
  try {
    const apifyService = getApifyService()
    const isConnected = await apifyService.testConnection()
    
    return NextResponse.json({
      success: true,
      apifyConnected: isConnected,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      apifyConnected: false,
      error: error.message
    }, { status: 500 })
  }
}

/**
 * Validate company domain
 */
async function handleValidateDomain(company: string) {
  try {
    const emailValidation = getEmailDomainValidationService()
    
    // Mock validation for demonstration
    const mockEmail = `test@${company.toLowerCase().replace(/\s/g, '')}.com`
    const validation = await emailValidation.validateEmployeeEmail(
      'test_user',
      mockEmail,
      company
    )
    
    return NextResponse.json({
      success: true,
      company,
      domain: validation.domain,
      isVerified: validation.isVerified,
      confidence: validation.confidence,
      verificationMethod: validation.verificationMethod
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

/**
 * Get department breakdown
 */
function getDepartmentBreakdown(nodes: any[]) {
  const departments: Record<string, number> = {}
  
  nodes.forEach(node => {
    const dept = node.department || 'Other'
    departments[dept] = (departments[dept] || 0) + 1
  })
  
  return departments
}

/**
 * GET /api/synthetic-intelligence
 * Get supported companies and system status
 */
export async function GET() {
  try {
    return NextResponse.json({
      status: 'operational',
      supportedCompanies: [
        {
          name: 'CK Delta',
          domain: 'ckdelta.ai',
          status: 'available',
          description: 'AI/Technology Consulting Company'
        }
      ],
      capabilities: [
        'LinkedIn employee scraping',
        'Organizational structure inference',
        'Email domain validation',
        '3D graph visualization',
        'Real-time verification system'
      ],
      version: '1.0.0',
      lastUpdated: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error.message
    }, { status: 500 })
  }
}