import RushDB from '@rushdb/javascript-sdk'

// Simple RushDB implementation using same pattern as working main service
class SimpleRushDBService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any = null

  constructor() {
    // Use same initialization pattern as working service
    this.connect()
  }

  private connect() {
    try {
      this.client = new RushDB('52af6990442d68cb2c1994af0fb1b633DjFdMF5cNkkw+NGtKDsyIJ2RRlGyqn5f98CkP1lX68qMDURf4LT7OfOAdaGWDCZ+', {
        url: 'https://api.rushdb.com/api/v1'
      })
      console.log('✅ Simple RushDB connection initialized')
    } catch (error) {
      console.error('❌ Simple RushDB connection failed:', error)
    }
  }

  async createTestData() {
    if (!this.client) {
      throw new Error('RushDB client not initialized')
    }

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
        await this.client.records.createMany({
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
    if (!this.client) {
      throw new Error('RushDB client not initialized')
    }

    console.log('🔍 Querying employees from RushDB...')
    
    try {
      const results = await this.client.records.find({
        labels: ["EMPLOYEE"]
      })
      
      console.log('📊 RushDB results type:', typeof results)
      console.log('📊 RushDB results constructor:', results?.constructor?.name)
      console.log('📊 RushDB results keys:', Object.keys(results || {}))
      console.log('📊 RushDB results:', JSON.stringify(results, null, 2))
      
      // Try to extract actual array data
      if (results && typeof results === 'object') {
        // Check various possible properties
        if ('data' in results && Array.isArray(results.data)) {
          console.log('✅ Found data property with array')
          return results.data
        }
        if ('records' in results && Array.isArray(results.records)) {
          console.log('✅ Found records property with array')
          return results.records
        }
        if ('items' in results && Array.isArray(results.items)) {
          console.log('✅ Found items property with array')
          return results.items
        }
        // Try to convert the object itself to array
        if (results[Symbol.iterator]) {
          console.log('✅ Found iterable, converting to array')
          return Array.from(results as any)
        }
      }
      
      console.log('⚠️ Returning results as-is')
      return results
    } catch (error) {
      console.error('❌ Error querying employees:', error)
      throw error
    }
  }

  async getVisualizationData() {
    try {
      const employeesResult = await this.getEmployees()
      
      console.log('🔍 Raw employees result type:', typeof employeesResult)
      console.log('🔍 Raw employees result is array:', Array.isArray(employeesResult))
      
      // Ensure we have an array to work with
      let employees: any[] = []
      
      if (Array.isArray(employeesResult)) {
        employees = employeesResult
        console.log('✅ Already an array')
      } else {
        console.log('❌ Not an array, returning empty data')
        return { nodes: [], links: [] }
      }
      
      console.log(`🔍 Working with ${employees.length} employees`)
      
      // Simple transformation - exactly what the results give us
      const nodes = employees.map((emp: any) => {
        console.log('🔍 Processing employee:', emp)
        return {
          id: emp.id || 'unknown',
          name: emp.name || 'Unknown',
          role: emp.role || 'Unknown Role',
          department: emp.department || 'Unknown',
          level: emp.level || 'Unknown',
          color: emp.department === 'Engineering' ? '#3B82F6' : '#10B981',
          size: emp.level === 'VP' ? 20 : emp.level === 'Director' ? 15 : 12
        }
      })

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
      // Return empty data instead of throwing
      return { nodes: [], links: [] }
    }
  }
}

export const simpleRushDBService = new SimpleRushDBService()
export default simpleRushDBService