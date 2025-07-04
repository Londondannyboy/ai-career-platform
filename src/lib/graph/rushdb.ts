import RushDB from '@rushdb/javascript-sdk'

export interface RushDBConfig {
  apiToken: string
  apiUrl?: string
}

class RushDBService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null
  private config: RushDBConfig | null = null

  async connect(config: RushDBConfig) {
    try {
      this.config = config
      this.client = new RushDB(config.apiToken, {
        url: config.apiUrl || 'https://api.rushdb.com/api/v1'
      })

      console.log('✅ RushDB connection initialized')
      return true
    } catch (error) {
      console.error('❌ RushDB connection failed:', error)
      throw error
    }
  }

  async insertTechFlowData() {
    if (!this.client) {
      throw new Error('RushDB client not initialized. Call connect() first.')
    }

    try {
      console.log('🏢 Inserting TechFlow Solutions data into RushDB...')

      // Insert company data
      const companyData = {
        type: 'company',
        id: 'techflow',
        name: 'TechFlow Solutions',
        industry: 'SaaS Platform Development',
        size: '50-100 employees',
        founded: '2019',
        headquarters: 'Austin, TX',
        description: 'AI-powered workflow automation platform for mid-market companies'
      }

      await this.client.records.createMany({
        label: 'COMPANY',
        data: companyData
      })

      // Insert department data
      const departments = [
        { 
          type: 'department',
          id: 'dept_engineering',
          name: 'Engineering', 
          head: 'Sarah Chen', 
          team_size: 25,
          company_id: 'techflow',
          technologies: ['React', 'Node.js', 'Python', 'PostgreSQL', 'AWS', 'Docker']
        },
        { 
          type: 'department',
          id: 'dept_product',
          name: 'Product', 
          head: 'Michael Rodriguez', 
          team_size: 8,
          company_id: 'techflow',
          technologies: ['Figma', 'Analytics', 'A/B Testing', 'User Research']
        },
        { 
          type: 'department',
          id: 'dept_sales',
          name: 'Sales', 
          head: 'Jennifer Kim', 
          team_size: 12,
          company_id: 'techflow',
          technologies: ['Salesforce', 'HubSpot', 'Outreach', 'LinkedIn Sales Navigator']
        },
        { 
          type: 'department',
          id: 'dept_marketing',
          name: 'Marketing', 
          head: 'David Thompson', 
          team_size: 6,
          company_id: 'techflow',
          technologies: ['Google Analytics', 'Marketo', 'Content Management', 'SEO']
        }
      ]

      for (const dept of departments) {
        await this.client.records.createMany({
          label: 'DEPARTMENT',
          data: dept
        })
      }

      console.log('✅ TechFlow Solutions data inserted into RushDB')
    } catch (error) {
      console.error('❌ Error inserting TechFlow data into RushDB:', error)
      throw error
    }
  }

  async insertEmployees(employees: Array<Record<string, unknown>>) {
    if (!this.client) {
      throw new Error('RushDB client not initialized. Call connect() first.')
    }

    try {
      console.log('👥 Inserting employee data into RushDB...')

      for (const emp of employees) {
        const employeeData = {
          ...emp,
          type: 'employee',
          company_id: 'techflow'
        }

        await this.client.records.createMany({
          label: 'EMPLOYEE',
          data: employeeData
        })

        // Create relationship records
        if (emp.manager) {
          await this.client.records.createMany({
            label: 'RELATIONSHIP',
            data: {
              type: 'reports_to',
              from_employee: emp.id,
              to_employee: emp.manager,
              relationship_type: 'reporting'
            }
          })
        }

        if (emp.collaborates_with && Array.isArray(emp.collaborates_with)) {
          for (const collabId of emp.collaborates_with) {
            await this.client.records.createMany({
              label: 'RELATIONSHIP',
              data: {
                type: 'collaborates_with',
                from_employee: emp.id,
                to_employee: collabId,
                relationship_type: 'collaboration'
              }
            })
          }
        }

        // Create skill relationships
        if (emp.skills && Array.isArray(emp.skills)) {
          for (const skill of emp.skills) {
            await this.client.records.createMany({
              label: 'SKILL',
              data: {
                employee_id: emp.id,
                skill_name: skill,
                proficiency: 'intermediate' // Default value
              }
            })
          }
        }
      }

      console.log('✅ Employee data inserted into RushDB')
    } catch (error) {
      console.error('❌ Error inserting employees into RushDB:', error)
      throw error
    }
  }

  async getOrgChartData() {
    if (!this.client) {
      throw new Error('RushDB client not initialized. Call connect() first.')
    }

    try {
      console.log('🔍 Querying RushDB for employees and relationships...')
      
      // Query employees with their relationships
      const employees = await this.client.records.find({
        labels: ['EMPLOYEE']
      })
      console.log('👥 RushDB employees result:', JSON.stringify(employees, null, 2))
      
      const relationships = await this.client.records.find({
        labels: ['RELATIONSHIP']
      })
      console.log('🔗 RushDB relationships result:', JSON.stringify(relationships, null, 2))
      
      return {
        employees,
        relationships
      }
    } catch (error) {
      console.error('❌ Error querying org chart data from RushDB:', error)
      throw error
    }
  }

  async getVisualizationData() {
    if (!this.client) {
      throw new Error('RushDB client not initialized. Call connect() first.')
    }

    try {
      const orgData = await this.getOrgChartData()
      
      console.log('🔍 RushDB orgData structure:', JSON.stringify(orgData, null, 2))
      console.log('🔍 RushDB orgData type:', typeof orgData)
      console.log('🔍 RushDB orgData keys:', orgData ? Object.keys(orgData) : 'null')
      
      // Handle different possible response structures
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let employees: any[] = []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let relationships: any[] = []
      
      if (orgData && typeof orgData === 'object') {
        // Check if orgData.employees exists and is an array
        if (Array.isArray(orgData.employees)) {
          employees = orgData.employees
        } else if (orgData.employees && typeof orgData.employees === 'object') {
          // Maybe it's wrapped in another structure
          console.log('🔍 Employees structure:', JSON.stringify(orgData.employees, null, 2))
          if (Array.isArray(orgData.employees.data)) {
            employees = orgData.employees.data
          } else if (Array.isArray(orgData.employees.records)) {
            employees = orgData.employees.records
          }
        }
        
        // Check if orgData.relationships exists and is an array
        if (Array.isArray(orgData.relationships)) {
          relationships = orgData.relationships
        } else if (orgData.relationships && typeof orgData.relationships === 'object') {
          console.log('🔍 Relationships structure:', JSON.stringify(orgData.relationships, null, 2))
          if (Array.isArray(orgData.relationships.data)) {
            relationships = orgData.relationships.data
          } else if (Array.isArray(orgData.relationships.records)) {
            relationships = orgData.relationships.records
          }
        }
      }
      
      console.log(`📊 Found ${employees.length} employees, ${relationships.length} relationships`)
      
      // Transform data for 3D visualization (RushDB returns records with data property)
      console.log(`🔧 About to transform employees (${employees.length} items)`)
      console.log(`🔧 About to transform relationships (${relationships.length} items)`)
      
      // Double-check arrays before mapping
      if (!Array.isArray(employees)) {
        console.error('❌ Employees is not an array:', typeof employees, employees)
        return { nodes: [], links: [] }
      }
      
      if (!Array.isArray(relationships)) {
        console.error('❌ Relationships is not an array:', typeof relationships, relationships)
        return { nodes: [], links: [] }
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nodes = employees.map((record: any) => {
        const emp = record.data || record
        return {
          id: emp.id,
          name: emp.name,
          role: emp.role,
          department: emp.department,
          level: emp.level,
          // Position and styling for 3D graph
          color: this.getDepartmentColor(emp.department as string),
          size: this.getLevelSize(emp.level as string)
        }
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const links = relationships.map((record: any) => {
        const rel = record.data || record
        return {
          source: rel.from_employee,
          target: rel.to_employee,
          type: rel.relationship_type,
          color: this.getRelationshipColor(rel.relationship_type as string)
        }
      })

      console.log(`✅ Generated ${nodes.length} nodes and ${links.length} links`)
      return { nodes, links }
    } catch (error) {
      console.error('❌ Error getting visualization data from RushDB:', error)
      throw error
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

  private getRelationshipColor(type: string): string {
    const colors: { [key: string]: string } = {
      'reporting': '#DC2626',      // Red for hierarchy
      'collaboration': '#059669'   // Green for collaboration
    }
    return colors[type] || '#6B7280'
  }
}

// Singleton instance
export const rushDBService = new RushDBService()
export default rushDBService