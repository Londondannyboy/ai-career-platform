import neo4jService, { Neo4jConfig } from './neo4j'
import rushDBService, { RushDBConfig } from './rushdb'

interface Neo4jRecord {
  get(key: string): unknown
}

export interface GraphConfig {
  neo4j?: Neo4jConfig
  rushdb?: RushDBConfig
}

class GraphService {
  private isNeo4jConnected = false
  private isRushDBConnected = false

  async initializeAll(config: GraphConfig) {
    console.log('🚀 Initializing Graph Database Services...')

    try {
      // Initialize Neo4j if config provided
      if (config.neo4j) {
        await neo4jService.connect(config.neo4j)
        this.isNeo4jConnected = true
        console.log('✅ Neo4j initialized')
      }

      // Initialize RushDB if config provided
      if (config.rushdb) {
        await rushDBService.connect(config.rushdb)
        this.isRushDBConnected = true
        console.log('✅ RushDB initialized')
      }

      console.log('🎉 All graph services initialized successfully!')
      return true
    } catch (error) {
      console.error('❌ Graph service initialization failed:', error)
      throw error
    }
  }

  async setupTechFlowTestData() {
    console.log('🏢 Setting up TechFlow Solutions test data across all graph databases...')

    try {
      // Load test data
      const fs = await import('fs')
      const path = await import('path')
      const testDataPath = path.join(process.cwd(), 'test-data', 'techflow-company.json')
      const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf8'))

      // Setup in Neo4j
      if (this.isNeo4jConnected) {
        console.log('📊 Setting up Neo4j test data...')
        await neo4jService.createTechFlowData()
        await neo4jService.createEmployees(testData.employees)
      }

      // Setup in RushDB
      if (this.isRushDBConnected) {
        console.log('🔄 Setting up RushDB test data...')
        await rushDBService.insertTechFlowData()
        await rushDBService.insertEmployees(testData.employees)
      }

      console.log('✅ TechFlow test data setup complete!')
      return true
    } catch (error) {
      console.error('❌ Error setting up test data:', error)
      throw error
    }
  }

  async getVisualizationData(source: 'neo4j' | 'rushdb' | 'hybrid' = 'hybrid') {
    try {
      switch (source) {
        case 'neo4j':
          if (!this.isNeo4jConnected) throw new Error('Neo4j not connected')
          return await this.getNeo4jVisualizationData()
          
        case 'rushdb':
          if (!this.isRushDBConnected) throw new Error('RushDB not connected')
          return await rushDBService.getVisualizationData()
          
        case 'hybrid':
          // Combine data from both sources
          return await this.getHybridVisualizationData()
          
        default:
          throw new Error(`Unknown visualization source: ${source}`)
      }
    } catch (error) {
      console.error('❌ Error getting visualization data:', error)
      throw error
    }
  }

  private async getNeo4jVisualizationData() {
    const orgData = await neo4jService.getOrgChartData()
    
    const nodes = orgData.map((record: Neo4jRecord) => ({
      id: record.get('id') as string,
      name: record.get('name') as string,
      role: record.get('role') as string,
      department: record.get('department') as string,
      level: record.get('level') as string,
      color: this.getDepartmentColor(record.get('department') as string),
      size: this.getLevelSize(record.get('level') as string)
    }))

    const links: Array<Record<string, unknown>> = []
    
    // Add reporting relationships
    orgData.forEach((record: Neo4jRecord) => {
      const managerId = record.get('manager_id') as string
      if (managerId) {
        links.push({
          source: record.get('id') as string,
          target: managerId,
          type: 'reporting',
          color: '#DC2626'
        })
      }

      // Add collaboration relationships
      const collaborators = record.get('collaborators') as string[]
      if (collaborators && collaborators.length > 0) {
        collaborators.forEach((collabId: string) => {
          if (collabId !== record.get('id')) {
            links.push({
              source: record.get('id') as string,
              target: collabId,
              type: 'collaboration',
              color: '#059669'
            })
          }
        })
      }
    })

    return { nodes, links }
  }

  private async getHybridVisualizationData() {
    // For now, prefer RushDB if available, fallback to Neo4j
    if (this.isRushDBConnected) {
      return await rushDBService.getVisualizationData()
    } else if (this.isNeo4jConnected) {
      return await this.getNeo4jVisualizationData()
    } else {
      throw new Error('No graph database connected')
    }
  }

  private getDepartmentColor(department: string): string {
    const colors: { [key: string]: string } = {
      'Engineering': '#3B82F6', // Blue
      'Product': '#10B981',      // Green  
      'Sales': '#F59E0B',        // Yellow
      'Marketing': '#EF4444'     // Red
    }
    return colors[department] || '#6B7280'
  }

  private getLevelSize(level: string): number {
    const sizes: { [key: string]: number } = {
      'VP': 20,
      'Director': 15,
      'Senior': 12,
      'Mid': 10,
      'Junior': 8
    }
    return sizes[level] || 10
  }

  // Health check methods
  getConnectionStatus() {
    return {
      neo4j: this.isNeo4jConnected,
      rushdb: this.isRushDBConnected,
      anyConnected: this.isNeo4jConnected || this.isRushDBConnected
    }
  }

  async disconnect() {
    console.log('🔌 Disconnecting all graph services...')
    
    if (this.isNeo4jConnected) {
      await neo4jService.disconnect()
      this.isNeo4jConnected = false
    }
    
    // RushDB doesn't require explicit disconnection
    this.isRushDBConnected = false
    
    console.log('✅ All graph services disconnected')
  }
}

// Singleton instance
export const graphService = new GraphService()

// Export individual services for direct access
export { neo4jService, rushDBService }
export default graphService