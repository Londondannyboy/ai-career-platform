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
// DataMagnet types will be defined inline for now

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
    // This would call DataMagnet Company API
    console.log(`📊 Getting company overview from DataMagnet for ${companyName}`)
    // Implementation would go here
    return {
      linkedinUrl: `https://linkedin.com/company/${companyName.toLowerCase()}`,
      employeeCount: 100
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
      return []
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
    
    // This would call DataMagnet People API
    // For now, returning enhanced mock data
    return {
      ...employee,
      sources: { ...employee.sources, datamagnet: true },
      recommendations: [
        {
          recommenderName: "John Smith",
          recommenderTitle: "VP Engineering",
          relationship: "managed directly",
          context: "I had the pleasure of managing Sarah directly..."
        }
      ],
      alsoViewed: [
        {
          name: "Jane Doe",
          title: "Senior Engineer",
          company: employee.title?.includes('CK Delta') ? 'CK Delta' : 'Same Company',
          linkedinUrl: "https://linkedin.com/in/janedoe",
          similarity: 0.85
        }
      ],
      dataQuality: 80, // Much higher quality with DataMagnet
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
}

// Export singleton instance
export const hybridIntelligence = new HybridIntelligenceService()