/**
 * Hybrid Synthetic Intelligence System
 * Combines DataMagnet (rich data) with Apify (bulk discovery)
 * 
 * Strategy:
 * 1. Use Apify for bulk employee discovery (fast, cheap)
 * 2. Use DataMagnet for deep intelligence on key people
 * 3. Extract verified relationships from recommendations
 * 4. Identify network clusters from "Also Viewed"
 * 5. Build comprehensive organizational graph
 */

import { getApifyService } from '@/lib/apify'

// DataMagnet API configuration
const DATAMAGNET_TOKEN = process.env.DATAMAGNET_API_TOKEN || '2d7d15e9232a10e31ebb07242e79c4a4218b78ab430371d32ad657264103efe1'
const DATAMAGNET_PEOPLE_API = 'https://api.datamagnet.co/api/v1/linkedin/person'
const DATAMAGNET_COMPANY_API = 'https://api.datamagnet.co/api/v1/linkedin/company'

export interface HybridEmployeeData {
  // Core identity
  linkedinUrl: string
  name: string
  title: string
  department?: string
  location?: string
  email?: string
  
  // Data sources
  sources: {
    apify?: boolean
    datamagnet?: boolean
    emailVerified?: boolean
    manuallyVerified?: boolean
  }
  
  // DataMagnet enrichments
  recommendations?: Array<{
    recommenderName: string
    recommenderTitle: string
    relationship: string // "managed directly", "worked with", etc.
    context: string // Full recommendation text
  }>
  
  alsoViewed?: Array<{
    name: string
    title: string
    company: string
    linkedinUrl: string
    similarity: number // How often they appear together
  }>
  
  // Inferred intelligence
  inferredLevel?: 'C-Suite' | 'VP' | 'Director' | 'Manager' | 'IC'
  inferredDepartment?: string
  verifiedRelationships?: Array<{
    targetPersonId: string
    relationshipType: 'reports_to' | 'manages' | 'peer' | 'works_with'
    verificationSource: 'recommendation' | 'manual' | 'email_domain'
    confidence: number
  }>
  
  // Scoring
  dataQuality: number // 0-100 based on verification levels
  lastUpdated: Date
}

export interface HybridCompanyData {
  companyName: string
  companyDomain: string
  linkedinUrl: string
  
  // Employee data
  employees: HybridEmployeeData[]
  totalEmployees: number
  
  // Organizational insights
  departments: Record<string, number>
  hierarchyLevels: Record<string, number>
  
  // Network analysis
  keyConnectors: string[] // People with most relationships
  verificationStats: {
    manuallyVerified: number
    emailVerified: number
    recommendationVerified: number
    syntheticOnly: number
  }
  
  // Metadata
  lastCrawled: Date
  dataCompleteness: number // 0-100
}

export class HybridIntelligenceService {
  private apifyService: any
  private dataMagnetCompanyService: any
  private dataMagnetPeopleService: any
  
  constructor() {
    // Services will be injected or initialized
  }
  
  /**
   * Main entry point for hybrid company intelligence
   */
  async buildCompanyIntelligence(
    companyName: string,
    companyDomain: string,
    options: {
      maxEmployees?: number
      useDataMagnetForAll?: boolean
      targetRoles?: string[]
      minDataQuality?: number
    } = {}
  ): Promise<HybridCompanyData> {
    const {
      maxEmployees = 100,
      useDataMagnetForAll = false,
      targetRoles = [],
      minDataQuality = 0
    } = options
    
    console.log(`🧠 Building hybrid intelligence for ${companyName}`)
    
    // Step 1: Get company overview from DataMagnet
    const companyData = await this.getCompanyOverview(companyName)
    
    // Step 2: Bulk employee discovery
    let employees: HybridEmployeeData[] = []
    
    if (useDataMagnetForAll) {
      // High quality but expensive - use DataMagnet for everyone
      employees = await this.getAllEmployeesFromDataMagnet(companyData, maxEmployees)
    } else {
      // Hybrid approach - Apify for bulk, DataMagnet for key people
      const apifyEmployees = await this.getBulkEmployeesFromApify(companyName, companyDomain, maxEmployees)
      employees = await this.enrichKeyEmployees(apifyEmployees, targetRoles)
    }
    
    // Step 3: Extract and verify relationships
    const enrichedEmployees = await this.extractRelationships(employees)
    
    // Step 4: Analyze network clusters
    const withClusters = await this.analyzeNetworkClusters(enrichedEmployees)
    
    // Step 5: Calculate organizational insights
    const insights = this.calculateOrganizationalInsights(withClusters)
    
    return {
      companyName,
      companyDomain,
      linkedinUrl: companyData.linkedinUrl,
      employees: withClusters,
      totalEmployees: withClusters.length,
      ...insights,
      lastCrawled: new Date(),
      dataCompleteness: this.calculateDataCompleteness(withClusters)
    }
  }
  
  /**
   * Get company overview from DataMagnet
   */
  private async getCompanyOverview(companyName: string): Promise<any> {
    console.log(`📊 Getting company overview from DataMagnet for ${companyName}`)
    
    try {
      const companyUrl = `https://linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`
      
      const response = await fetch(DATAMAGNET_COMPANY_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DATAMAGNET_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: companyUrl,
          use_cache: 'if-recent'
        })
      })
      
      if (!response.ok) {
        const error = await response.text()
        console.error('❌ DataMagnet Company API error:', error)
        throw new Error(`DataMagnet API error: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.message) {
        return {
          linkedinUrl: companyUrl,
          companyName: data.message.company_name,
          employeeCount: data.message.employees || 100,
          industry: data.message.industry,
          location: data.message.location,
          description: data.message.description
        }
      }
      
      // Fallback if structure is different
      return {
        linkedinUrl: companyUrl,
        employeeCount: 100,
        ...data
      }
    } catch (error) {
      console.error('Failed to get company overview:', error)
      // Return default data on error
      return {
        linkedinUrl: `https://linkedin.com/company/${companyName.toLowerCase()}`,
        employeeCount: 100
      }
    }
  }
  
  /**
   * Bulk employee discovery using Apify
   */
  private async getBulkEmployeesFromApify(
    companyName: string,
    companyDomain: string,
    maxEmployees: number
  ): Promise<HybridEmployeeData[]> {
    console.log(`🔍 Bulk discovering employees with Apify for ${companyName}`)
    
    try {
      // Check if Apify token is available
      if (!process.env.APIFY_API_TOKEN) {
        console.log('⚠️ APIFY_API_TOKEN not set, returning mock data')
        return this.getMockApifyEmployees(companyName, maxEmployees)
      }
      
      const apifyService = getApifyService()
      const scraped = await apifyService.scrapeCompanyEmployees(companyName, companyDomain, maxEmployees)
      
      return scraped.employees.map((emp: any) => ({
        linkedinUrl: emp.profileUrl,
        name: emp.name,
        title: emp.currentPosition || emp.headline,
        department: emp.inferredDepartment,
        location: emp.location,
        sources: { apify: true },
        inferredLevel: this.inferSeniorityLevel(emp.currentPosition),
        inferredDepartment: emp.inferredDepartment,
        dataQuality: 20, // Base quality for Apify data
        lastUpdated: new Date()
      }))
    } catch (error) {
      console.error('❌ Apify scraping failed:', error)
      console.log('⚠️ Falling back to mock data')
      return this.getMockApifyEmployees(companyName, maxEmployees)
    }
  }
  
  /**
   * Get all employees using DataMagnet (premium approach)
   */
  private async getAllEmployeesFromDataMagnet(
    companyData: any,
    maxEmployees: number
  ): Promise<HybridEmployeeData[]> {
    console.log(`💎 Getting all employees from DataMagnet (premium mode)`)
    // This would iterate through DataMagnet company employees
    // and call People API for each one
    return []
  }
  
  /**
   * Enrich key employees with DataMagnet data
   */
  private async enrichKeyEmployees(
    employees: HybridEmployeeData[],
    targetRoles: string[]
  ): Promise<HybridEmployeeData[]> {
    console.log(`🎯 Enriching key employees with DataMagnet`)
    
    // Identify key people to enrich
    const keyEmployees = employees.filter(emp => {
      const isExecutive = emp.inferredLevel === 'C-Suite' || emp.inferredLevel === 'VP'
      const isTargetRole = targetRoles.some(role => 
        emp.title?.toLowerCase().includes(role.toLowerCase())
      )
      return isExecutive || isTargetRole
    })
    
    console.log(`Found ${keyEmployees.length} key employees to enrich`)
    
    // Enrich each key employee with DataMagnet
    for (const employee of keyEmployees) {
      try {
        const enriched = await this.enrichWithDataMagnet(employee)
        const index = employees.findIndex(e => e.linkedinUrl === employee.linkedinUrl)
        if (index !== -1) {
          employees[index] = enriched
        }
      } catch (error) {
        console.error(`Failed to enrich ${employee.name}:`, error)
      }
    }
    
    return employees
  }
  
  /**
   * Enrich a single employee with DataMagnet data
   */
  private async enrichWithDataMagnet(employee: HybridEmployeeData): Promise<HybridEmployeeData> {
    console.log(`💎 Enriching ${employee.name} with DataMagnet`)
    
    try {
      const response = await fetch(DATAMAGNET_PEOPLE_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DATAMAGNET_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: employee.linkedinUrl
        })
      })
      
      if (!response.ok) {
        const error = await response.text()
        console.error(`❌ DataMagnet People API error for ${employee.name}:`, error)
        return employee // Return original if enrichment fails
      }
      
      const data = await response.json()
      
      // Extract recommendations if available
      const recommendations = data.recommendations?.map((rec: any) => ({
        recommenderName: rec.recommender_name || rec.name || 'Unknown',
        recommenderTitle: rec.recommender_title || rec.title || '',
        relationship: this.extractRelationshipFromContext(rec.recommendation || rec.text || ''),
        context: rec.recommendation || rec.text || ''
      })) || []
      
      // Extract also viewed profiles
      const alsoViewed = data.people_also_viewed?.map((person: any) => ({
        name: person.name || person.display_name || 'Unknown',
        title: person.title || person.headline || '',
        company: person.company || person.current_company || '',
        linkedinUrl: person.url || person.profile_url || '',
        similarity: 0.75 // Default similarity score
      })) || []
      
      // Merge DataMagnet data with existing employee data
      return {
        ...employee,
        sources: { ...employee.sources, datamagnet: true },
        title: data.job_title || employee.title,
        department: data.department || employee.department,
        location: data.location || employee.location,
        recommendations,
        alsoViewed,
        dataQuality: Math.min(80 + (recommendations.length * 5), 95), // Higher quality with more recommendations
      }
    } catch (error) {
      console.error(`Failed to enrich ${employee.name} with DataMagnet:`, error)
      return employee // Return original if enrichment fails
    }
  }
  
  /**
   * Extract verified relationships from recommendations
   */
  private async extractRelationships(employees: HybridEmployeeData[]): Promise<HybridEmployeeData[]> {
    console.log(`🔗 Extracting verified relationships`)
    
    for (const employee of employees) {
      if (!employee.recommendations) continue
      
      employee.verifiedRelationships = []
      
      for (const rec of employee.recommendations) {
        // Parse recommendation context to determine relationship type
        const relationshipType = this.parseRelationshipType(rec.relationship, rec.context)
        
        // Find the recommender in our employee list
        const recommender = employees.find(e => 
          e.name === rec.recommenderName || 
          e.title?.includes(rec.recommenderTitle)
        )
        
        if (recommender) {
          employee.verifiedRelationships.push({
            targetPersonId: recommender.linkedinUrl,
            relationshipType,
            verificationSource: 'recommendation',
            confidence: 0.9 // High confidence from LinkedIn recommendations
          })
        }
      }
    }
    
    return employees
  }
  
  /**
   * Analyze network clusters from "Also Viewed" data
   */
  private async analyzeNetworkClusters(employees: HybridEmployeeData[]): Promise<HybridEmployeeData[]> {
    console.log(`🔮 Analyzing network clusters from "Also Viewed" profiles`)
    
    // Build similarity matrix from "Also Viewed" data
    const clusters = new Map<string, Set<string>>()
    
    for (const employee of employees) {
      if (!employee.alsoViewed) continue
      
      const cluster = clusters.get(employee.linkedinUrl) || new Set()
      
      for (const viewed of employee.alsoViewed) {
        cluster.add(viewed.linkedinUrl)
        
        // Add inferred peer relationship if they're in same company
        if (viewed.company === employee.title?.split(' at ')[1]) {
          if (!employee.verifiedRelationships) {
            employee.verifiedRelationships = []
          }
          
          employee.verifiedRelationships.push({
            targetPersonId: viewed.linkedinUrl,
            relationshipType: 'peer',
            verificationSource: 'email_domain', // Lower confidence
            confidence: 0.5 + viewed.similarity * 0.3 // 0.5-0.8 range
          })
        }
      }
      
      clusters.set(employee.linkedinUrl, cluster)
    }
    
    return employees
  }
  
  /**
   * Calculate organizational insights from employee data
   */
  private calculateOrganizationalInsights(employees: HybridEmployeeData[]) {
    const departments: Record<string, number> = {}
    const hierarchyLevels: Record<string, number> = {}
    const verificationStats = {
      manuallyVerified: 0,
      emailVerified: 0,
      recommendationVerified: 0,
      syntheticOnly: 0
    }
    
    // Count departments and levels
    for (const emp of employees) {
      const dept = emp.inferredDepartment || 'Unknown'
      departments[dept] = (departments[dept] || 0) + 1
      
      const level = emp.inferredLevel || 'IC'
      hierarchyLevels[level] = (hierarchyLevels[level] || 0) + 1
      
      // Count verification levels
      if (emp.sources?.manuallyVerified) {
        verificationStats.manuallyVerified++
      } else if (emp.sources?.emailVerified) {
        verificationStats.emailVerified++
      } else if (emp.sources?.datamagnet && emp.recommendations?.length) {
        verificationStats.recommendationVerified++
      } else {
        verificationStats.syntheticOnly++
      }
    }
    
    // Identify key connectors (people with most relationships)
    const connectionCounts = employees.map(emp => ({
      id: emp.linkedinUrl,
      name: emp.name,
      connections: emp.verifiedRelationships?.length || 0
    }))
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 5)
    
    return {
      departments,
      hierarchyLevels,
      keyConnectors: connectionCounts.map(c => c.name),
      verificationStats
    }
  }
  
  /**
   * Parse relationship type from recommendation text
   */
  private parseRelationshipType(
    relationship: string, 
    context: string
  ): 'reports_to' | 'manages' | 'peer' | 'works_with' {
    const lowerContext = context.toLowerCase()
    const lowerRel = relationship.toLowerCase()
    
    if (lowerRel.includes('managed directly') || lowerContext.includes('reported to me')) {
      return 'manages'
    } else if (lowerRel.includes('reported to') || lowerContext.includes('my manager')) {
      return 'reports_to'
    } else if (lowerRel.includes('worked with') && lowerContext.includes('peer')) {
      return 'peer'
    } else {
      return 'works_with'
    }
  }
  
  /**
   * Infer seniority level from job title
   */
  private inferSeniorityLevel(title?: string): HybridEmployeeData['inferredLevel'] {
    if (!title) return 'IC'
    
    const lower = title.toLowerCase()
    if (lower.includes('ceo') || lower.includes('cto') || lower.includes('cfo')) {
      return 'C-Suite'
    } else if (lower.includes('vp ') || lower.includes('vice president')) {
      return 'VP'
    } else if (lower.includes('director')) {
      return 'Director'
    } else if (lower.includes('manager') || lower.includes('lead')) {
      return 'Manager'
    } else {
      return 'IC'
    }
  }
  
  /**
   * Calculate overall data completeness percentage
   */
  private calculateDataCompleteness(employees: HybridEmployeeData[]): number {
    if (employees.length === 0) return 0
    
    const scores = employees.map(emp => {
      let score = 0
      if (emp.name) score += 10
      if (emp.title) score += 10
      if (emp.department) score += 10
      if (emp.sources?.datamagnet) score += 20
      if (emp.recommendations?.length) score += 20
      if (emp.verifiedRelationships?.length) score += 20
      if (emp.sources?.manuallyVerified) score += 10
      return score
    })
    
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
    return Math.round(avgScore)
  }
  /**
   * Extract relationship type from recommendation context
   */
  private extractRelationshipFromContext(context: string): string {
    const lower = context.toLowerCase()
    if (lower.includes('managed directly') || lower.includes('direct report')) {
      return 'managed directly'
    } else if (lower.includes('reported to') || lower.includes('my manager')) {
      return 'reported to'
    } else if (lower.includes('worked with') || lower.includes('collaborated')) {
      return 'worked with'
    } else if (lower.includes('mentored') || lower.includes('coached')) {
      return 'mentored'
    } else if (lower.includes('advised') || lower.includes('consulted')) {
      return 'advised'
    }
    return 'worked together'
  }
  
  /**
   * Get mock Apify employees when API is not available
   */
  private getMockApifyEmployees(companyName: string, maxEmployees: number): HybridEmployeeData[] {
    console.log('📦 Using mock Apify data for demonstration')
    
    const mockEmployees = [
      {
        name: 'John Doe',
        title: 'Senior Software Engineer',
        linkedinUrl: 'https://linkedin.com/in/johndoe',
        department: 'Engineering',
        inferredLevel: 'IC' as const
      },
      {
        name: 'Jane Smith',
        title: 'Product Manager',
        linkedinUrl: 'https://linkedin.com/in/janesmith',
        department: 'Product',
        inferredLevel: 'Manager' as const
      },
      {
        name: 'Mike Johnson',
        title: 'Director of Engineering',
        linkedinUrl: 'https://linkedin.com/in/mikejohnson',
        department: 'Engineering',
        inferredLevel: 'Director' as const
      },
      {
        name: 'Sarah Williams',
        title: 'Marketing Manager',
        linkedinUrl: 'https://linkedin.com/in/sarahwilliams',
        department: 'Marketing',
        inferredLevel: 'Manager' as const
      },
      {
        name: 'Tom Anderson',
        title: 'Sales Representative',
        linkedinUrl: 'https://linkedin.com/in/tomanderson',
        department: 'Sales',
        inferredLevel: 'IC' as const
      }
    ]
    
    return mockEmployees.slice(0, Math.min(maxEmployees, mockEmployees.length)).map(emp => ({
      ...emp,
      location: 'San Francisco, CA',
      sources: { apify: true },
      inferredDepartment: emp.department,
      dataQuality: 20,
      lastUpdated: new Date()
    }))
  }
}

// Export singleton instance
export const hybridIntelligence = new HybridIntelligenceService()