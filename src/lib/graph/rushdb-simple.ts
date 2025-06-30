import RushDB from '@rushdb/javascript-sdk'

// Simple RushDB implementation following their documentation exactly
class SimpleRushDBService {
  private db: RushDB

  constructor() {
    // Initialize exactly as shown in docs
    this.db = new RushDB('52af6990442d68cb2c1994af0fb1b633DjFdMF5cNkkw+NGtKDsyIJ2RRlGyqn5f98CkP1lX68qMDURf4LT7OfOAdaGWDCZ+')
  }

  async createTestData() {
    console.log('🚀 Creating simple test data in RushDB...')
    
    try {
      // Create employees one by one to avoid type issues
      const employees = [
        {
          id: "emp_001",
          name: "Sarah Chen",
          role: "VP Engineering",
          department: "Engineering",
          level: "VP"
        },
        {
          id: "emp_002",
          name: "Alex Kumar", 
          role: "Senior Frontend Engineer",
          department: "Engineering",
          level: "Senior",
          manager: "emp_001"
        },
        {
          id: "emp_003",
          name: "Maria Gonzalez",
          role: "Senior Backend Engineer", 
          department: "Engineering",
          level: "Senior",
          manager: "emp_001"
        },
        {
          id: "emp_004",
          name: "Michael Rodriguez",
          role: "Head of Product",
          department: "Product", 
          level: "Director"
        }
      ]

      for (const emp of employees) {
        await this.db.records.createMany({
          label: "EMPLOYEE",
          data: emp
        })
      }

      console.log('✅ Test data created successfully')
    } catch (error) {
      console.error('❌ Error creating test data:', error)
      throw error
    }
  }

  async getEmployees() {
    console.log('🔍 Querying employees from RushDB...')
    
    try {
      const results = await this.db.records.find({
        labels: ["EMPLOYEE"]
      })
      
      console.log('📊 RushDB results:', results)
      return results
    } catch (error) {
      console.error('❌ Error querying employees:', error)
      throw error
    }
  }

  async getVisualizationData() {
    try {
      const employeesResult = await this.getEmployees()
      
      // Convert RushDB result to regular array
      console.log('🔍 Raw employees result type:', typeof employeesResult)
      console.log('🔍 Raw employees result:', employeesResult)
      
      // RushDB returns a special DBRecordsArrayInstance, cast as any to access array methods
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const employees = employeesResult as any
      console.log('🔍 Using as any to access array methods')
      
      // Simple transformation - exactly what the results give us
      const nodes = employees.map((emp: any) => ({
        id: emp.id,
        name: emp.name,
        role: emp.role,
        department: emp.department,
        level: emp.level,
        color: emp.department === 'Engineering' ? '#3B82F6' : '#10B981',
        size: emp.level === 'VP' ? 20 : emp.level === 'Director' ? 15 : 12
      }))

      const links = employees
        .filter((emp: any) => emp.manager)
        .map((emp: any) => ({
          source: emp.id,
          target: emp.manager,
          type: 'reporting',
          color: '#DC2626'
        }))

      console.log(`✅ Generated ${nodes.length} nodes and ${links.length} links`)
      return { nodes, links }
    } catch (error) {
      console.error('❌ Error getting visualization data:', error)
      throw error
    }
  }
}

export const simpleRushDBService = new SimpleRushDBService()
export default simpleRushDBService