import { NextRequest, NextResponse } from 'next/server'
import { hybridIntelligence } from '@/lib/synthetic/hybrid-intelligence'

/**
 * Hybrid Synthetic Intelligence API
 * Combines DataMagnet (rich data) with Apify (bulk discovery)
 * 
 * POST /api/synthetic-hybrid
 * {
 *   "company": "CK Delta",
 *   "companyDomain": "ckdelta.ai",
 *   "strategy": "hybrid" | "datamagnet_only" | "apify_first",
 *   "maxEmployees": 50,
 *   "targetRoles": ["engineering", "product"],
 *   "enrichExecutives": true
 * }
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      company,
      companyDomain,
      strategy = 'hybrid',
      maxEmployees = 50,
      targetRoles = [],
      enrichExecutives = true
    } = body

    if (!company) {
      return NextResponse.json({
        error: 'Company name is required'
      }, { status: 400 })
    }

    console.log(`🧠 Hybrid Synthetic Intelligence Request for ${company}`)
    console.log(`📋 Strategy: ${strategy}`)
    console.log(`👥 Max Employees: ${maxEmployees}`)
    console.log(`🎯 Target Roles: ${targetRoles.join(', ') || 'All'}`)

    // For now, return a comprehensive mock response showing the hybrid approach
    const mockHybridData = {
      success: true,
      company,
      companyDomain,
      strategy,
      timestamp: new Date().toISOString(),
      
      // Summary statistics
      summary: {
        totalEmployees: 47,
        datamagnetEnriched: 12,
        apifyDiscovered: 35,
        verifiedRelationships: 18,
        networkClusters: 5
      },
      
      // Sample employees showing different verification levels
      employees: [
        {
          name: "Philip Aga",
          title: "CEO & Founder",
          linkedinUrl: "https://linkedin.com/in/philipaga",
          department: "Executive",
          sources: {
            apify: true,
            datamagnet: true,
            emailVerified: true // Has @ckdelta.ai email
          },
          dataQuality: 95,
          
          // DataMagnet enrichments
          recommendations: [
            {
              recommenderName: "Sarah Chen",
              recommenderTitle: "VP Engineering",
              relationship: "worked together",
              context: "Philip is a visionary leader who built CK Delta from the ground up..."
            },
            {
              recommenderName: "Michael Brown",
              recommenderTitle: "Board Advisor",
              relationship: "advised",
              context: "I've had the pleasure of advising Philip on CK Delta's strategic direction..."
            }
          ],
          
          alsoViewed: [
            {
              name: "Tom Anderson",
              title: "CEO at TechCorp",
              company: "TechCorp",
              linkedinUrl: "https://linkedin.com/in/tomanderson",
              similarity: 0.75
            }
          ],
          
          verifiedRelationships: [
            {
              targetPersonId: "https://linkedin.com/in/sarahchen",
              relationshipType: "manages",
              verificationSource: "recommendation",
              confidence: 0.95
            }
          ]
        },
        {
          name: "Sarah Chen",
          title: "VP Engineering",
          linkedinUrl: "https://linkedin.com/in/sarahchen",
          department: "Engineering",
          sources: {
            apify: true,
            datamagnet: true // Enriched because VP level
          },
          dataQuality: 85,
          
          recommendations: [
            {
              recommenderName: "Philip Aga",
              recommenderTitle: "CEO & Founder",
              relationship: "managed directly",
              context: "Sarah has been instrumental in building our engineering culture..."
            }
          ],
          
          verifiedRelationships: [
            {
              targetPersonId: "https://linkedin.com/in/philipaga",
              relationshipType: "reports_to",
              verificationSource: "recommendation",
              confidence: 0.95
            },
            {
              targetPersonId: "https://linkedin.com/in/johndoe",
              relationshipType: "manages",
              verificationSource: "recommendation",
              confidence: 0.90
            }
          ]
        },
        {
          name: "John Doe",
          title: "Senior Software Engineer",
          linkedinUrl: "https://linkedin.com/in/johndoe",
          department: "Engineering",
          sources: {
            apify: true // Not enriched with DataMagnet (not executive)
          },
          dataQuality: 40,
          inferredLevel: "IC",
          
          // Inferred relationships from "also viewed" clustering
          verifiedRelationships: [
            {
              targetPersonId: "https://linkedin.com/in/janedoe",
              relationshipType: "peer",
              verificationSource: "email_domain",
              confidence: 0.60
            }
          ]
        }
      ],
      
      // Organizational insights
      insights: {
        departments: {
          "Engineering": 20,
          "Product": 8,
          "Sales": 10,
          "Marketing": 5,
          "Executive": 4
        },
        
        hierarchyLevels: {
          "C-Suite": 4,
          "VP": 6,
          "Director": 8,
          "Manager": 12,
          "IC": 17
        },
        
        keyConnectors: [
          "Philip Aga (12 connections)",
          "Sarah Chen (8 connections)",
          "Michael Brown (6 connections)"
        ],
        
        verificationBreakdown: {
          manuallyVerified: 0, // None yet
          emailVerified: 15,   // @ckdelta.ai emails
          recommendationVerified: 12, // From DataMagnet
          syntheticOnly: 20    // Only Apify data
        },
        
        networkClusters: [
          {
            name: "Engineering Leadership",
            members: ["Sarah Chen", "John Doe", "Jane Smith"],
            confidence: 0.85
          },
          {
            name: "Product Team",
            members: ["Tom Wilson", "Lisa Park", "David Kim"],
            confidence: 0.75
          }
        ]
      },
      
      // Data quality metrics
      dataQuality: {
        overall: 72,
        breakdown: {
          coverage: 85,      // Found 47/55 estimated employees
          verification: 65,  // 65% have some verification
          enrichment: 25,    // 25% enriched with DataMagnet
          relationships: 80  // 80% have at least one relationship
        }
      },
      
      // Cost analysis
      costAnalysis: {
        apifyCredits: 5,      // Bulk discovery
        datamagnetCredits: 12, // Executive enrichment
        totalCredits: 17,
        costPerEmployee: 0.36
      }
    }

    return NextResponse.json(mockHybridData)

  } catch (error) {
    console.error('❌ Hybrid synthetic intelligence error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}

/**
 * GET endpoint for checking hybrid intelligence capabilities
 */
export async function GET() {
  return NextResponse.json({
    status: 'operational',
    capabilities: {
      dataMagnet: {
        available: true,
        features: ['recommendations', 'alsoViewed', 'richProfiles']
      },
      apify: {
        available: true,
        features: ['bulkDiscovery', 'basicProfiles', 'fastScraping']
      },
      hybrid: {
        strategies: ['hybrid', 'datamagnet_only', 'apify_first'],
        verification: ['manual', 'email_domain', 'recommendations', 'also_viewed']
      }
    },
    endpoints: {
      'POST /api/synthetic-hybrid': 'Build hybrid company intelligence',
      'GET /api/synthetic-hybrid': 'Check capabilities'
    }
  })
}