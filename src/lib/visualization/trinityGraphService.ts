import neo4j from 'neo4j-driver';

// Import SQL directly
import { sql } from '@/lib/db';

// Neo4j connection
const getNeo4jSession = () => {
  const driver = neo4j.driver(
    process.env.NEO4J_URI || 'neo4j+s://20b2ddda.databases.neo4j.io',
    neo4j.auth.basic(
      process.env.NEO4J_USERNAME || 'neo4j',
      process.env.NEO4J_PASSWORD || 'MPfTn0be2NxKxrnM7EZ5bUGrzVb_ZxM4CGnXUWp1ylw'
    )
  );
  return driver.session();
};

export interface TrinityGraphNode {
  id: string;
  label: string;
  type: 'trinity-core' | 'trinity-aspect' | 'user' | 'connection';
  val?: number;
  color?: string;
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
  [key: string]: any;
}

export interface TrinityGraphLink {
  source: string;
  target: string;
  type?: string;
  color?: string;
  particles?: number;
  value?: number;
}

export interface TrinityGraphData {
  nodes: TrinityGraphNode[];
  links: TrinityGraphLink[];
}

export class TrinityGraphService {
  // Fetch Trinity data from original trinity_statements table
  static async fetchUserTrinityDataOriginal(userId: string) {
    try {
      console.log('[TrinityGraphService] Fetching Trinity for user:', userId);
      
      const result = await sql`
        SELECT 
          id,
          user_id,
          quest,
          service,
          pledge,
          quest_seal,
          created_at,
          updated_at
        FROM trinity_statements
        WHERE user_id = ${userId} 
        AND is_active = true
        LIMIT 1
      `;
      
      console.log('[TrinityGraphService] Trinity query result:', result.rows.length, 'records found');
      return result.rows[0] || null;
    } catch (error) {
      console.error('[TrinityGraphService] Error fetching Trinity data:', error);
      return null;
    }
  }


  // Fetch Trinity connections from Neo4j
  static async fetchTrinityConnections(userId: string) {
    try {
      const session = getNeo4jSession();
      
      // First ensure the user exists in Neo4j
      await session.run(
        `
        MERGE (u:User {id: $userId})
        ON CREATE SET 
          u.created = datetime(),
          u.type = 'trinity_user'
        `,
        { userId }
      );

      // Fetch connections (other Trinity users connected to this user)
      const result = await session.run(
        `
        MATCH (u:User {id: $userId})
        OPTIONAL MATCH (u)-[r:TRINITY_CONNECTION]-(other:User)
        WHERE other.id <> $userId
        RETURN 
          other.id as otherId,
          other.name as otherName,
          r.compatibility_score as compatibilityScore,
          r.shared_aspects as sharedAspects,
          r.connection_type as connectionType
        LIMIT 10
        `,
        { userId }
      );

      const connections = result.records.map(record => ({
        otherId: record.get('otherId'),
        otherName: record.get('otherName') || 'Trinity User',
        compatibilityScore: record.get('compatibilityScore') || 0.5,
        sharedAspects: record.get('sharedAspects') || [],
        connectionType: record.get('connectionType') || 'potential'
      }));
      
      await session.close();
      return connections;
    } catch (error) {
      console.error('Error fetching Trinity connections:', error);
      console.log('Neo4j connection failed, returning empty connections array');
      // Return empty array if Neo4j is not available
      return [];
    }
  }

  // Build the complete graph data structure
  static async buildTrinityGraph(userId: string): Promise<TrinityGraphData> {
    // For now, just fetch Trinity data - no connections or other features
    const trinityData = await this.fetchUserTrinityDataOriginal(userId);

    if (!trinityData) {
      return { nodes: [], links: [] };
    }

    const nodes: TrinityGraphNode[] = [];
    const links: TrinityGraphLink[] = [];

    // Trinity aspect colors
    const TRINITY_COLORS = {
      quest: '#FFD700', // Gold
      service: '#00CED1', // Dark Turquoise
      pledge: '#9370DB', // Medium Purple
      core: '#FFFFFF' // White
    };

    // Central Trinity node
    nodes.push({
      id: `trinity-core-${userId}`,
      label: 'My Trinity',
      type: 'trinity-core',
      val: 30,
      color: TRINITY_COLORS.core,
      fx: 0,
      fy: 0,
      fz: 0,
      trinityData: {...trinityData, type: trinityData?.type || 'F'}
    });

    // Trinity aspect nodes
    const aspectRadius = 100;
    const aspects = [
      { id: 'quest', label: 'Quest', value: trinityData.quest, angle: 0 },
      { id: 'service', label: 'Service', value: trinityData.service, angle: 120 },
      { id: 'pledge', label: 'Pledge', value: trinityData.pledge, angle: 240 }
    ];

    aspects.forEach((aspect) => {
      const angleRad = (aspect.angle * Math.PI) / 180;
      nodes.push({
        id: `trinity-${aspect.id}-${userId}`,
        label: aspect.label,
        type: 'trinity-aspect',
        val: 20,
        color: TRINITY_COLORS[aspect.id as 'quest' | 'service' | 'pledge'],
        x: aspectRadius * Math.cos(angleRad),
        y: aspectRadius * Math.sin(angleRad),
        z: 0,
        fullText: aspect.value
      });

      links.push({
        source: `trinity-core-${userId}`,
        target: `trinity-${aspect.id}-${userId}`,
        color: TRINITY_COLORS[aspect.id as 'quest' | 'service' | 'pledge'],
        particles: 2
      });
    });


    // Connections removed for now - pure Trinity only

    return { nodes, links };
  }
}