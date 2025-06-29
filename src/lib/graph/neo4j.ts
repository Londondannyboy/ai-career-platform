import neo4j, { Driver, Session } from 'neo4j-driver'

export interface Neo4jConfig {
  uri: string
  username: string
  password: string
  database?: string
}

class Neo4jService {
  private driver: Driver | null = null
  private config: Neo4jConfig | null = null

  async connect(config: Neo4jConfig) {
    try {
      this.config = config
      this.driver = neo4j.driver(
        config.uri,
        neo4j.auth.basic(config.username, config.password)
      )

      // Test connection
      const session = this.driver.session({ database: config.database || 'neo4j' })
      await session.run('RETURN 1 as test')
      await session.close()

      console.log('✅ Neo4j connection successful')
      return true
    } catch (error) {
      console.error('❌ Neo4j connection failed:', error)
      throw error
    }
  }

  async disconnect() {
    if (this.driver) {
      await this.driver.close()
      this.driver = null
      console.log('🔌 Neo4j disconnected')
    }
  }

  getSession(): Session {
    if (!this.driver) {
      throw new Error('Neo4j driver not initialized. Call connect() first.')
    }
    return this.driver.session({ 
      database: this.config?.database || 'neo4j' 
    })
  }

  async runQuery(query: string, parameters: Record<string, unknown> = {}) {
    const session = this.getSession()
    try {
      const result = await session.run(query, parameters)
      return result.records
    } finally {
      await session.close()
    }
  }

  // Helper method to create TechFlow Solutions test data
  async createTechFlowData() {
    const session = this.getSession()
    try {
      console.log('🏢 Creating TechFlow Solutions test data in Neo4j...')

      // Clear existing data
      await session.run('MATCH (n) DETACH DELETE n')

      // Create Company
      await session.run(`
        CREATE (c:Company {
          id: 'techflow',
          name: 'TechFlow Solutions',
          industry: 'SaaS Platform Development',
          size: '50-100 employees',
          founded: '2019',
          headquarters: 'Austin, TX',
          description: 'AI-powered workflow automation platform for mid-market companies'
        })
      `)

      // Create Departments
      const departments = [
        { name: 'Engineering', head: 'Sarah Chen', team_size: 25 },
        { name: 'Product', head: 'Michael Rodriguez', team_size: 8 },
        { name: 'Sales', head: 'Jennifer Kim', team_size: 12 },
        { name: 'Marketing', head: 'David Thompson', team_size: 6 }
      ]

      for (const dept of departments) {
        await session.run(`
          MATCH (c:Company {id: 'techflow'})
          CREATE (d:Department {
            name: $name,
            head: $head,
            team_size: $team_size
          })
          CREATE (c)-[:HAS_DEPARTMENT]->(d)
        `, dept)
      }

      console.log('✅ TechFlow Solutions data created successfully')
    } catch (error) {
      console.error('❌ Error creating TechFlow data:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  // Method to create employee nodes and relationships
  async createEmployees(employees: Array<Record<string, unknown>>) {
    const session = this.getSession()
    try {
      console.log('👥 Creating employee nodes and relationships...')

      for (const emp of employees) {
        // Create employee node
        await session.run(`
          CREATE (e:Employee {
            id: $id,
            name: $name,
            role: $role,
            department: $department,
            level: $level,
            hire_date: $hire_date,
            skills: $skills,
            previous_companies: $previous_companies
          })
        `, {
          ...emp,
          skills: emp.skills || [],
          previous_companies: emp.previous_companies || []
        })

        // Connect to department
        await session.run(`
          MATCH (e:Employee {id: $empId})
          MATCH (d:Department {name: $department})
          CREATE (e)-[:WORKS_IN]->(d)
        `, { empId: emp.id, department: emp.department })

        // Create reporting relationships
        if (emp.manager) {
          await session.run(`
            MATCH (e:Employee {id: $empId})
            MATCH (m:Employee {id: $managerId})
            CREATE (e)-[:REPORTS_TO]->(m)
          `, { empId: emp.id, managerId: emp.manager })
        }

        // Create collaboration relationships
        if (emp.collaborates_with && Array.isArray(emp.collaborates_with)) {
          for (const collabId of emp.collaborates_with) {
            await session.run(`
              MATCH (e1:Employee {id: $empId})
              MATCH (e2:Employee {id: $collabId})
              CREATE (e1)-[:COLLABORATES_WITH]->(e2)
              CREATE (e2)-[:COLLABORATES_WITH]->(e1)
            `, { empId: emp.id, collabId })
          }
        }
      }

      console.log('✅ Employee relationships created successfully')
    } catch (error) {
      console.error('❌ Error creating employees:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  // Query for organizational visualization
  async getOrgChartData() {
    const query = `
      MATCH (e:Employee)-[:WORKS_IN]->(d:Department)
      OPTIONAL MATCH (e)-[r:REPORTS_TO]->(m:Employee)
      OPTIONAL MATCH (e)-[c:COLLABORATES_WITH]->(colleague:Employee)
      RETURN 
        e.id as id,
        e.name as name,
        e.role as role,
        e.level as level,
        d.name as department,
        m.id as manager_id,
        m.name as manager_name,
        collect(DISTINCT colleague.id) as collaborators
      ORDER BY d.name, e.level DESC
    `
    
    return await this.runQuery(query)
  }

  // Query for skill networks
  async getSkillNetworkData() {
    const query = `
      MATCH (e:Employee)
      UNWIND e.skills as skill
      WITH skill, collect(e) as employees
      WHERE size(employees) > 1
      RETURN skill, employees
    `
    
    return await this.runQuery(query)
  }
}

// Singleton instance
export const neo4jService = new Neo4jService()
export default neo4jService