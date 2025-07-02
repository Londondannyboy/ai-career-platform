/**
 * Neo4j Graph Service for Sales Intelligence Visualization
 * Converts document entities into graph relationships for visualization
 */

import neo4j from 'neo4j-driver'

interface GraphEntity {
  id: string
  type: 'company' | 'product' | 'person' | 'feature' | 'competitor'
  name: string
  properties: Record<string, any>
  sourceDocument?: string
}

interface GraphRelationship {
  from: string
  to: string
  type: 'COMPETES_WITH' | 'MENTIONS' | 'TARGETS' | 'WORKS_AT' | 'USES' | 'FEATURES'
  properties: Record<string, any>
  confidence: number
  sourceDocument: string
}

export interface GraphData {
  entities: GraphEntity[]
  relationships: GraphRelationship[]
  metadata: {
    workspaceId: string
    generatedAt: string
    documentCount: number
    entityCount: number
    relationshipCount: number
  }
}

class GraphService {
  private driver: any

  constructor() {
    // Initialize Neo4j driver (credentials would come from environment)
    if (process.env.NEO4J_URI && process.env.NEO4J_USERNAME && process.env.NEO4J_PASSWORD) {
      this.driver = neo4j.driver(
        process.env.NEO4J_URI,
        neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD)
      )
    }
  }

  /**
   * Convert document entities to graph format for Neo4j
   */
  async convertDocumentsToGraph(
    workspaceId: string,
    documents: any[]
  ): Promise<GraphData> {
    const entities: GraphEntity[] = []
    const relationships: GraphRelationship[] = []
    const entityMap = new Map<string, GraphEntity>()

    // Process each document
    for (const doc of documents) {
      if (!doc.extractedEntities) continue

      const docId = doc.id
      const { extractedEntities } = doc

      // Extract companies
      for (const company of extractedEntities.companies || []) {
        const entityId = `company_${this.sanitizeId(company)}`
        if (!entityMap.has(entityId)) {
          const entity: GraphEntity = {
            id: entityId,
            type: 'company',
            name: company,
            properties: {
              documentType: doc.documentType,
              firstMentioned: doc.createdAt
            },
            sourceDocument: docId
          }
          entities.push(entity)
          entityMap.set(entityId, entity)
        }

        // Create relationship: Document MENTIONS Company
        relationships.push({
          from: `document_${docId}`,
          to: entityId,
          type: 'MENTIONS',
          properties: { context: 'document_analysis' },
          confidence: 0.8,
          sourceDocument: docId
        })
      }

      // Extract competitors
      for (const competitor of extractedEntities.competitors || []) {
        const competitorId = `competitor_${this.sanitizeId(competitor)}`
        if (!entityMap.has(competitorId)) {
          const entity: GraphEntity = {
            id: competitorId,
            type: 'competitor',
            name: competitor,
            properties: {
              documentType: doc.documentType,
              firstMentioned: doc.createdAt
            },
            sourceDocument: docId
          }
          entities.push(entity)
          entityMap.set(competitorId, entity)
        }

        // Create competitive relationships
        relationships.push({
          from: 'our_company',
          to: competitorId,
          type: 'COMPETES_WITH',
          properties: { 
            market: 'identified_from_documents',
            strength: 'unknown' 
          },
          confidence: 0.7,
          sourceDocument: docId
        })
      }

      // Extract products
      for (const product of extractedEntities.products || []) {
        const productId = `product_${this.sanitizeId(product)}`
        if (!entityMap.has(productId)) {
          const entity: GraphEntity = {
            id: productId,
            type: 'product',
            name: product,
            properties: {
              documentType: doc.documentType,
              features: extractedEntities.features || []
            },
            sourceDocument: docId
          }
          entities.push(entity)
          entityMap.set(productId, entity)
        }
      }

      // Extract features and link to products
      for (const feature of extractedEntities.features || []) {
        const featureId = `feature_${this.sanitizeId(feature)}`
        if (!entityMap.has(featureId)) {
          const entity: GraphEntity = {
            id: featureId,
            type: 'feature',
            name: feature,
            properties: {
              category: 'product_capability',
              documentType: doc.documentType
            },
            sourceDocument: docId
          }
          entities.push(entity)
          entityMap.set(featureId, entity)
        }

        // Link features to our main product
        relationships.push({
          from: 'our_product',
          to: featureId,
          type: 'FEATURES',
          properties: { importance: 'high' },
          confidence: 0.9,
          sourceDocument: docId
        })
      }

      // Extract stakeholders/decision makers
      for (const stakeholder of extractedEntities.stakeholders || []) {
        const stakeholderId = `person_${this.sanitizeId(stakeholder)}`
        if (!entityMap.has(stakeholderId)) {
          const entity: GraphEntity = {
            id: stakeholderId,
            type: 'person',
            name: stakeholder,
            properties: {
              role: 'decision_maker',
              source: 'document_analysis'
            },
            sourceDocument: docId
          }
          entities.push(entity)
          entityMap.set(stakeholderId, entity)
        }
      }
    }

    return {
      entities,
      relationships,
      metadata: {
        workspaceId,
        generatedAt: new Date().toISOString(),
        documentCount: documents.length,
        entityCount: entities.length,
        relationshipCount: relationships.length
      }
    }
  }

  /**
   * Export graph data for Neo4j import
   */
  async exportForNeo4j(workspaceId: string): Promise<{
    cypherQueries: string[]
    csvData: any
    graphData: GraphData
  }> {
    // This would get documents from the workspace
    const documents = [] // Would fetch from workspaceService
    
    const graphData = await this.convertDocumentsToGraph(workspaceId, documents)
    
    // Generate Cypher queries for Neo4j import
    const cypherQueries = this.generateCypherQueries(graphData)
    
    // Generate CSV data for bulk import
    const csvData = this.generateCSVData(graphData)
    
    return {
      cypherQueries,
      csvData,
      graphData
    }
  }

  /**
   * Generate Cypher queries for Neo4j import
   */
  private generateCypherQueries(graphData: GraphData): string[] {
    const queries: string[] = []
    
    // Create entity constraints and indexes
    queries.push(`
      CREATE CONSTRAINT entity_id IF NOT EXISTS FOR (e:Entity) REQUIRE e.id IS UNIQUE;
      CREATE INDEX entity_type IF NOT EXISTS FOR (e:Entity) ON (e.type);
      CREATE INDEX entity_name IF NOT EXISTS FOR (e:Entity) ON (e.name);
    `)
    
    // Create entities
    for (const entity of graphData.entities) {
      const properties = Object.entries(entity.properties)
        .map(([key, value]) => `${key}: $${key}`)
        .join(', ')
      
      queries.push(`
        MERGE (e:Entity {id: '${entity.id}'})
        SET e.type = '${entity.type}',
            e.name = '${entity.name}',
            e.sourceDocument = '${entity.sourceDocument}',
            ${properties}
      `)
    }
    
    // Create relationships
    for (const rel of graphData.relationships) {
      queries.push(`
        MATCH (a:Entity {id: '${rel.from}'}), (b:Entity {id: '${rel.to}'})
        MERGE (a)-[r:${rel.type}]->(b)
        SET r.confidence = ${rel.confidence},
            r.sourceDocument = '${rel.sourceDocument}'
      `)
    }
    
    return queries
  }

  /**
   * Generate CSV data for bulk import
   */
  private generateCSVData(graphData: GraphData): any {
    return {
      entities: graphData.entities.map(e => ({
        id: e.id,
        type: e.type,
        name: e.name,
        sourceDocument: e.sourceDocument,
        ...e.properties
      })),
      relationships: graphData.relationships.map(r => ({
        from: r.from,
        to: r.to,
        type: r.type,
        confidence: r.confidence,
        sourceDocument: r.sourceDocument,
        ...r.properties
      }))
    }
  }

  /**
   * Visualize sales opportunities for a target company
   */
  async generateSalesGraphQuery(targetCompany: string): string {
    return `
      MATCH (target:Entity {name: '${targetCompany}', type: 'company'})
      OPTIONAL MATCH (target)-[:WORKS_AT]-(person:Entity {type: 'person'})
      OPTIONAL MATCH (target)-[:USES]-(product:Entity {type: 'product'})
      OPTIONAL MATCH (our:Entity {name: 'our_company'})-[:COMPETES_WITH]-(competitor:Entity {type: 'competitor'})
      OPTIONAL MATCH (our)-[:FEATURES]-(feature:Entity {type: 'feature'})
      
      RETURN target, person, product, competitor, feature
      ORDER BY person.role DESC, feature.importance DESC
    `
  }

  /**
   * Clean up entity IDs for Neo4j
   */
  private sanitizeId(text: string): string {
    return text.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  }

  async close() {
    if (this.driver) {
      await this.driver.close()
    }
  }
}

// Singleton instance
let graphServiceInstance: GraphService | null = null

export const getGraphService = (): GraphService => {
  if (!graphServiceInstance) {
    graphServiceInstance = new GraphService()
  }
  return graphServiceInstance
}

export default GraphService