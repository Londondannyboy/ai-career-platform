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
      // EMBEDDED TEST DATA - No file system dependency
      const testData = {
        "company": {
          "name": "TechFlow Solutions",
          "industry": "SaaS Platform Development",
          "size": "50-100 employees",
          "founded": "2019",
          "headquarters": "Austin, TX",
          "description": "AI-powered workflow automation platform for mid-market companies"
        },
        "employees": [
          {
            "id": "emp_001",
            "name": "Sarah Chen",
            "role": "VP of Engineering",
            "department": "Engineering",
            "level": "VP",
            "hire_date": "2019-03-15",
            "skills": ["Leadership", "System Architecture", "React", "Node.js", "Team Management"],
            "previous_companies": ["Google", "Stripe"],
            "reports": ["emp_002", "emp_003", "emp_004", "emp_005"]
          },
          {
            "id": "emp_002",
            "name": "Alex Kumar",
            "role": "Senior Frontend Engineer",
            "department": "Engineering",
            "level": "Senior",
            "hire_date": "2020-01-20",
            "skills": ["React", "TypeScript", "CSS", "GraphQL", "Testing"],
            "previous_companies": ["Airbnb", "Netflix"],
            "manager": "emp_001",
            "collaborates_with": ["emp_003", "emp_006"]
          },
          {
            "id": "emp_003",
            "name": "Maria Gonzalez",
            "role": "Senior Backend Engineer",
            "department": "Engineering",
            "level": "Senior",
            "hire_date": "2020-05-10",
            "skills": ["Python", "Django", "PostgreSQL", "Redis", "API Design"],
            "previous_companies": ["Uber", "Shopify"],
            "manager": "emp_001",
            "collaborates_with": ["emp_002", "emp_004"]
          },
          {
            "id": "emp_004",
            "name": "James Wilson",
            "role": "DevOps Engineer",
            "department": "Engineering",
            "level": "Mid",
            "hire_date": "2021-02-01",
            "skills": ["AWS", "Docker", "Kubernetes", "Terraform", "Monitoring"],
            "previous_companies": ["Microsoft", "DigitalOcean"],
            "manager": "emp_001",
            "collaborates_with": ["emp_003", "emp_005"]
          },
          {
            "id": "emp_005",
            "name": "Lisa Park",
            "role": "Frontend Engineer",
            "department": "Engineering",
            "level": "Mid",
            "hire_date": "2021-08-15",
            "skills": ["React", "JavaScript", "CSS", "HTML", "Jest"],
            "previous_companies": ["Slack"],
            "manager": "emp_001",
            "collaborates_with": ["emp_002"]
          },
          {
            "id": "emp_006",
            "name": "Michael Rodriguez",
            "role": "Head of Product",
            "department": "Product",
            "level": "Director",
            "hire_date": "2019-06-01",
            "skills": ["Product Strategy", "User Research", "Analytics", "Roadmapping", "Leadership"],
            "previous_companies": ["Facebook", "Dropbox"],
            "collaborates_with": ["emp_001", "emp_002", "emp_007"]
          },
          {
            "id": "emp_007",
            "name": "Emma Davis",
            "role": "Senior Product Manager",
            "department": "Product",
            "level": "Senior",
            "hire_date": "2020-09-12",
            "skills": ["Product Management", "User Stories", "Figma", "SQL", "A/B Testing"],
            "previous_companies": ["Atlassian"],
            "manager": "emp_006",
            "collaborates_with": ["emp_002", "emp_003"]
          },
          {
            "id": "emp_008",
            "name": "Jennifer Kim",
            "role": "VP of Sales",
            "department": "Sales",
            "level": "VP",
            "hire_date": "2019-08-20",
            "skills": ["Sales Leadership", "Enterprise Sales", "Negotiation", "CRM", "Team Management"],
            "previous_companies": ["Salesforce", "HubSpot"],
            "reports": ["emp_009", "emp_010"]
          },
          {
            "id": "emp_009",
            "name": "Robert Johnson",
            "role": "Senior Account Executive",
            "department": "Sales",
            "level": "Senior",
            "hire_date": "2020-11-05",
            "skills": ["B2B Sales", "Lead Qualification", "Demos", "Closing", "Salesforce"],
            "previous_companies": ["Zoom", "Slack"],
            "manager": "emp_008"
          },
          {
            "id": "emp_010",
            "name": "Amanda Taylor",
            "role": "Sales Development Rep",
            "department": "Sales",
            "level": "Junior",
            "hire_date": "2022-01-10",
            "skills": ["Lead Generation", "Cold Outreach", "LinkedIn", "Email Marketing", "CRM"],
            "previous_companies": ["Local Startup"],
            "manager": "emp_008"
          },
          {
            "id": "emp_011",
            "name": "David Thompson",
            "role": "Marketing Director",
            "department": "Marketing",
            "level": "Director",
            "hire_date": "2020-03-01",
            "skills": ["Digital Marketing", "Content Strategy", "SEO", "Analytics", "Brand Management"],
            "previous_companies": ["HubSpot", "Marketo"],
            "collaborates_with": ["emp_008", "emp_006"]
          },
          {
            "id": "emp_012",
            "name": "Sophie Brown",
            "role": "Content Marketing Manager",
            "department": "Marketing",
            "level": "Mid",
            "hire_date": "2021-05-20",
            "skills": ["Content Writing", "Blog Management", "Social Media", "SEO", "Email Marketing"],
            "previous_companies": ["Buffer"],
            "manager": "emp_011"
          }
        ]
      }

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