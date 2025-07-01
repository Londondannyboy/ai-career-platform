/**
 * Graphiti-inspired Temporal Knowledge Graph
 * Implements core temporal tracking concepts from Graphiti in TypeScript
 */

import { getDriver } from '../neo4j/client'
import { Driver } from 'neo4j-driver'

export interface TemporalFact {
  id: string
  subject: string
  predicate: string
  object: string
  confidence: number
  validFrom: Date
  validTo?: Date
  source: string
  episodeId?: string
}

export interface Episode {
  id: string
  userId: string
  query: string
  timestamp: Date
  context: Record<string, any>
  facts: string[] // Fact IDs
  outcome?: 'success' | 'failure' | 'partial'
}

export interface EntityResolution {
  canonicalId: string
  aliases: string[]
  mergedFrom: string[]
  lastUpdated: Date
}

export class GraphitiService {
  private driver: Driver

  constructor() {
    this.driver = getDriver()
  }

  /**
   * Initialize temporal schema in Neo4j
   */
  async initialize() {
    const session = this.driver.session()
    try {
      // Create constraints for temporal entities
      await session.run(`
        CREATE CONSTRAINT IF NOT EXISTS FOR (f:Fact) REQUIRE f.id IS UNIQUE
      `)
      
      await session.run(`
        CREATE CONSTRAINT IF NOT EXISTS FOR (e:Episode) REQUIRE e.id IS UNIQUE
      `)
      
      await session.run(`
        CREATE CONSTRAINT IF NOT EXISTS FOR (er:EntityResolution) REQUIRE er.canonicalId IS UNIQUE
      `)
      
      // Create indexes for temporal queries
      await session.run(`
        CREATE INDEX IF NOT EXISTS FOR (f:Fact) ON (f.validFrom)
      `)
      
      await session.run(`
        CREATE INDEX IF NOT EXISTS FOR (f:Fact) ON (f.confidence)
      `)
      
      console.log('✅ Graphiti temporal schema initialized')
    } finally {
      await session.close()
    }
  }

  /**
   * Store a temporal fact
   */
  async storeFact(fact: Omit<TemporalFact, 'id'>): Promise<string> {
    const session = this.driver.session()
    try {
      const factId = `fact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const result = await session.run(`
        MERGE (s:Entity {id: $subject})
        MERGE (o:Entity {id: $object})
        CREATE (f:Fact {
          id: $factId,
          predicate: $predicate,
          confidence: $confidence,
          validFrom: datetime($validFrom),
          validTo: $validTo,
          source: $source,
          episodeId: $episodeId
        })
        CREATE (s)-[:SUBJECT_OF]->(f)
        CREATE (f)-[:OBJECT_IS]->(o)
        RETURN f.id as factId
      `, {
        factId,
        subject: fact.subject,
        object: fact.object,
        predicate: fact.predicate,
        confidence: fact.confidence,
        validFrom: fact.validFrom.toISOString(),
        validTo: fact.validTo?.toISOString() || null,
        source: fact.source,
        episodeId: fact.episodeId || null
      })
      
      return result.records[0].get('factId')
    } finally {
      await session.close()
    }
  }

  /**
   * Get current facts about an entity (time-aware)
   */
  async getCurrentFacts(entityId: string, asOf?: Date): Promise<TemporalFact[]> {
    const session = this.driver.session()
    try {
      const timestamp = (asOf || new Date()).toISOString()
      
      const result = await session.run(`
        MATCH (e:Entity {id: $entityId})-[:SUBJECT_OF|OBJECT_IS]-(f:Fact)
        WHERE f.validFrom <= datetime($timestamp)
          AND (f.validTo IS NULL OR f.validTo > datetime($timestamp))
        OPTIONAL MATCH (f)-[:SUBJECT_OF]-(subject:Entity)
        OPTIONAL MATCH (f)-[:OBJECT_IS]-(object:Entity)
        RETURN f, subject, object
        ORDER BY f.confidence DESC, f.validFrom DESC
      `, { entityId, timestamp })
      
      return result.records.map(record => {
        const fact = record.get('f').properties
        const subject = record.get('subject')?.properties
        const object = record.get('object')?.properties
        
        return {
          id: fact.id,
          subject: subject?.id || entityId,
          predicate: fact.predicate,
          object: object?.id || entityId,
          confidence: fact.confidence,
          validFrom: new Date(fact.validFrom),
          validTo: fact.validTo ? new Date(fact.validTo) : undefined,
          source: fact.source,
          episodeId: fact.episodeId
        }
      })
    } finally {
      await session.close()
    }
  }

  /**
   * Track a search episode
   */
  async createEpisode(episode: Omit<Episode, 'id'>): Promise<string> {
    const session = this.driver.session()
    try {
      const episodeId = `episode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      await session.run(`
        CREATE (e:Episode {
          id: $episodeId,
          userId: $userId,
          query: $query,
          timestamp: datetime($timestamp),
          context: $context,
          outcome: $outcome
        })
      `, {
        episodeId,
        userId: episode.userId,
        query: episode.query,
        timestamp: episode.timestamp.toISOString(),
        context: JSON.stringify(episode.context),
        outcome: episode.outcome || null
      })
      
      // Link facts to episode
      if (episode.facts.length > 0) {
        await session.run(`
          MATCH (e:Episode {id: $episodeId})
          MATCH (f:Fact) WHERE f.id IN $factIds
          CREATE (e)-[:DISCOVERED]->(f)
        `, {
          episodeId,
          factIds: episode.facts
        })
      }
      
      return episodeId
    } finally {
      await session.close()
    }
  }

  /**
   * Resolve entity duplicates
   */
  async resolveEntities(entityIds: string[], canonicalId: string): Promise<void> {
    const session = this.driver.session()
    try {
      // Create entity resolution record
      await session.run(`
        MERGE (er:EntityResolution {canonicalId: $canonicalId})
        SET er.aliases = $aliases,
            er.mergedFrom = $mergedFrom,
            er.lastUpdated = datetime()
      `, {
        canonicalId,
        aliases: entityIds,
        mergedFrom: entityIds.filter(id => id !== canonicalId)
      })
      
      // Update all facts to point to canonical entity
      await session.run(`
        MATCH (e:Entity) WHERE e.id IN $entityIds AND e.id <> $canonicalId
        MATCH (e)-[r:SUBJECT_OF|OBJECT_IS]-(f:Fact)
        MATCH (canonical:Entity {id: $canonicalId})
        MERGE (canonical)-[:SUBJECT_OF|OBJECT_IS]-(f)
        DELETE r
      `, {
        entityIds,
        canonicalId
      })
      
      // Mark non-canonical entities as aliases
      await session.run(`
        MATCH (e:Entity) WHERE e.id IN $entityIds AND e.id <> $canonicalId
        SET e.isAlias = true, e.canonicalId = $canonicalId
      `, {
        entityIds,
        canonicalId
      })
    } finally {
      await session.close()
    }
  }

  /**
   * Decay fact confidence over time
   */
  async decayFactConfidence(factId: string, decayRate: number = 0.95): Promise<void> {
    const session = this.driver.session()
    try {
      await session.run(`
        MATCH (f:Fact {id: $factId})
        SET f.confidence = f.confidence * $decayRate
      `, {
        factId,
        decayRate
      })
    } finally {
      await session.close()
    }
  }

  /**
   * Get entity history (temporal view)
   */
  async getEntityHistory(entityId: string): Promise<any> {
    const session = this.driver.session()
    try {
      const result = await session.run(`
        MATCH (e:Entity {id: $entityId})-[:SUBJECT_OF]-(f:Fact)
        OPTIONAL MATCH (f)-[:OBJECT_IS]-(o:Entity)
        RETURN f, o
        ORDER BY f.validFrom DESC
      `, { entityId })
      
      const timeline = result.records.map(record => {
        const fact = record.get('f').properties
        const object = record.get('o')?.properties
        
        return {
          timestamp: fact.validFrom,
          predicate: fact.predicate,
          object: object?.id || 'unknown',
          confidence: fact.confidence,
          source: fact.source,
          validUntil: fact.validTo
        }
      })
      
      return {
        entityId,
        timeline,
        totalFacts: timeline.length
      }
    } finally {
      await session.close()
    }
  }

  /**
   * Find related entities through temporal facts
   */
  async findRelatedEntities(entityId: string, minConfidence: number = 0.7): Promise<any[]> {
    const session = this.driver.session()
    try {
      const result = await session.run(`
        MATCH (e:Entity {id: $entityId})-[:SUBJECT_OF|OBJECT_IS]-(f:Fact)-[:SUBJECT_OF|OBJECT_IS]-(related:Entity)
        WHERE related.id <> $entityId 
          AND f.confidence >= $minConfidence
          AND (f.validTo IS NULL OR f.validTo > datetime())
        RETURN DISTINCT related, COUNT(f) as connectionCount, AVG(f.confidence) as avgConfidence
        ORDER BY connectionCount DESC, avgConfidence DESC
        LIMIT 20
      `, {
        entityId,
        minConfidence
      })
      
      return result.records.map(record => ({
        entity: record.get('related').properties,
        connections: record.get('connectionCount').toNumber(),
        avgConfidence: record.get('avgConfidence')
      }))
    } finally {
      await session.close()
    }
  }
}

export const graphitiService = new GraphitiService()