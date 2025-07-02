import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getWorkspaceService } from '@/lib/documents/workspaceService'

export const runtime = 'nodejs'

/**
 * GET /api/demo/sales-scenarios
 * Demo realistic sales intelligence scenarios
 */
export async function GET() {
  try {
    // Use same auth fallback pattern
    let userId = 'test-user-123'
    
    try {
      const authResult = await auth()
      if (authResult?.userId) {
        userId = authResult.userId
      }
    } catch (authError) {
      console.log('🔍 Auth failed, using test user:', authError)
    }

    const workspaceService = getWorkspaceService()
    const workspaces = await workspaceService.getUserWorkspaces(userId)

    if (workspaces.length === 0) {
      return NextResponse.json({
        error: 'No workspace found. Please create a workspace and upload documents first.',
        setupInstructions: [
          '1. Create a workspace',
          '2. Upload sales documents (proposals, case studies, competitor analysis)',
          '3. Test these demo scenarios'
        ]
      })
    }

    const workspace = workspaces[0]
    const documents = await workspaceService.getWorkspaceDocuments(workspace.id, userId)

    // Demo Scenarios for Sales Intelligence
    const scenarios = [
      {
        id: 'competitive_analysis',
        title: 'Competitive Analysis',
        description: 'Analyze how we compare to competitors for specific deals',
        examples: [
          {
            query: "How do we compare to HubSpot for enterprise clients?",
            expectedInsights: [
              "Our competitive advantages vs HubSpot",
              "Pricing comparison",
              "Feature differentiation",
              "Customer success stories"
            ]
          },
          {
            query: "What are Salesforce's weaknesses that we can exploit?", 
            expectedInsights: [
              "Implementation complexity",
              "Cost concerns",
              "Feature gaps we fill"
            ]
          }
        ]
      },
      {
        id: 'prospect_research',
        title: 'Prospect & Company Research',
        description: 'Research target companies and identify decision makers',
        examples: [
          {
            query: "I want to sell to CK Delta. What should I know about them?",
            expectedInsights: [
              "Company background and industry",
              "Potential pain points we solve",
              "Relevant case studies",
              "Suggested approach"
            ]
          },
          {
            query: "Who are the typical decision makers for our product at enterprise companies?",
            expectedInsights: [
              "C-level executives involved",
              "Department heads who influence decisions",
              "Technical evaluators",
              "Budget approval chain"
            ]
          }
        ]
      },
      {
        id: 'proposal_preparation',
        title: 'Proposal & Pitch Preparation',
        description: 'Prepare for sales meetings and proposal creation',
        examples: [
          {
            query: "I have a meeting with Microsoft next week. What talking points should I focus on?",
            expectedInsights: [
              "Microsoft-specific value props",
              "Relevant case studies",
              "Integration capabilities",
              "Enterprise features"
            ]
          },
          {
            query: "What ROI data should I include in a proposal for a mid-market company?",
            expectedInsights: [
              "ROI metrics from similar companies",
              "Time to value",
              "Cost savings examples",
              "Productivity improvements"
            ]
          }
        ]
      },
      {
        id: 'pricing_strategy',
        title: 'Pricing & Deal Strategy',
        description: 'Optimize pricing and deal structure',
        examples: [
          {
            query: "What pricing models work best for companies like Acme Corp?",
            expectedInsights: [
              "Suitable pricing tiers",
              "Volume discounts",
              "Payment terms",
              "Contract length options"
            ]
          },
          {
            query: "What objections should I expect about our pricing, and how do I handle them?",
            expectedInsights: [
              "Common price objections",
              "Value-based responses",
              "ROI justification",
              "Competitive pricing context"
            ]
          }
        ]
      },
      {
        id: 'relationship_mapping',
        title: 'Relationship & Network Mapping',
        description: 'Understand company relationships and networks (Future Neo4j integration)',
        examples: [
          {
            query: "Show me the relationship network for companies in the fintech sector",
            expectedInsights: [
              "Connected companies",
              "Shared decision makers",
              "Partner relationships",
              "Competitive landscape"
            ],
            note: "This will be enhanced with Neo4j graph visualization"
          },
          {
            query: "Who do we know at companies similar to our target prospect?",
            expectedInsights: [
              "Mutual connections",
              "Referral opportunities", 
              "Warm introduction paths",
              "Social proof from network"
            ]
          }
        ]
      }
    ]

    // Test actual queries if documents exist
    const results = []
    if (documents.length > 0) {
      // Test a few key scenarios
      const testQueries = [
        "What are our competitive advantages?",
        "Who should I contact at enterprise companies?",
        "What pricing information do we have?"
      ]

      for (const query of testQueries) {
        try {
          const result = await workspaceService.chatWithDocuments(workspace.id, userId, query)
          results.push({
            query,
            answer: result.answer,
            confidence: result.confidence,
            documentsUsed: result.documentsUsed.length,
            processingTime: result.processingTime
          })
        } catch (error) {
          results.push({
            query,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspace.id,
        name: workspace.displayName,
        documentCount: documents.length
      },
      scenarios,
      liveResults: results,
      capabilities: {
        documentTypes: [...new Set(documents.map(d => d.documentType))],
        aiChat: documents.length > 0,
        entityExtraction: true,
        vectorSearch: true,
        neo4jReady: true
      },
      nextSteps: {
        uploadDocuments: documents.length === 0 ? 'Upload sales documents to test scenarios' : null,
        testScenarios: 'Try the example queries above',
        neo4jIntegration: 'Ready to export entity relationships to Neo4j',
        productionDeployment: 'System ready for real sales use cases'
      },
      usage: {
        instructions: [
          "1. Use the chat interface in your workspace",
          "2. Try the example queries from scenarios above", 
          "3. Upload different document types (proposals, case studies, competitor analysis)",
          "4. Ask specific questions about your prospects and deals"
        ],
        tips: [
          "Be specific in your queries (mention company names, industries)",
          "Upload diverse document types for richer insights",
          "Use follow-up questions to dig deeper",
          "Combine multiple scenarios for comprehensive research"
        ]
      }
    })

  } catch (error) {
    console.error('❌ Demo scenarios failed:', error)
    
    return NextResponse.json(
      { 
        error: 'Demo scenarios failed',
        details: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}