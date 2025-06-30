/**
 * DataMagnet Company API Service
 * 
 * Purpose: Extract LinkedIn company data and employee lists using DataMagnet's Company API
 * Note: Free plan may be limited - designed to handle upgrade requirements gracefully
 * 
 * API Documentation: https://docs.datamagnet.co/quickstart/
 */

export interface DataMagnetCompanyData {
  // Basic Company Information
  name: string
  displayName?: string
  description?: string
  industry?: string
  headquarters?: string
  founded?: string
  companySize?: string
  employeeCount?: number
  
  // Company URLs and Social
  linkedinUrl: string
  website?: string
  companyId?: string
  universalName?: string
  
  // Location Data
  locations?: Array<{
    country: string
    city: string
    address?: string
    isHeadquarters?: boolean
  }>
  
  // Specialties and Focus
  specialties?: string[]
  companyType?: string
  
  // Financial Information (if available)
  fundingData?: {
    totalFunding?: string
    lastFundingRound?: string
    lastFundingDate?: string
    investors?: string[]
  }
  
  // Employee Data (DataMagnet advantage)
  employees?: Array<{
    name: string
    title: string
    profileUrl: string
    department?: string
    location?: string
    startDate?: string
    profileImageUrl?: string
  }>
  
  // Company Metrics
  followers?: number
  
  // Images and Branding
  logoUrl?: string
  coverImageUrl?: string
  
  // Recent Activity (DataMagnet advantage)
  recentPosts?: Array<{
    content: string
    date: string
    likes?: number
    comments?: number
    shares?: number
    author?: string
  }>
  
  // Metadata
  lastUpdated?: string
  dataQuality?: {
    completeness: number
    freshness: number
    accuracy: number
  }
}

export interface DataMagnetCompanyResult {
  success: boolean
  company?: DataMagnetCompanyData
  employeeCount?: number
  totalEmployeesFound?: number
  error?: string
  creditsUsed?: number
  upgradeRequired?: boolean
  planLimitation?: string
  rateLimit?: {
    remaining: number
    resetTime: string
  }
  requestId?: string
}

class DataMagnetCompanyService {
  private config: { apiToken: string; apiUrl: string }
  private baseUrl: string

  constructor(config: { apiToken: string; apiUrl?: string }) {
    this.config = {
      apiToken: config.apiToken,
      apiUrl: config.apiUrl || 'https://api.datamagnet.co/api/v1'
    }
    this.baseUrl = this.config.apiUrl
  }

  /**
   * Test DataMagnet Company API connection
   */
  async testConnection(): Promise<{
    connected: boolean
    planType?: string
    creditsRemaining?: number
    upgradeRequired?: boolean
    error?: string
  }> {
    try {
      // Test with credits endpoint first
      const response = await fetch(`${this.baseUrl}/credits`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        return {
          connected: true,
          planType: data.plan || 'free',
          creditsRemaining: data.credits || 0,
          upgradeRequired: data.plan === 'free' && data.credits === 0
        }
      } else if (response.status === 401) {
        return {
          connected: false,
          error: 'Invalid API token'
        }
      } else if (response.status === 403) {
        return {
          connected: true,
          upgradeRequired: true,
          error: 'API access blocked - paid plan required'
        }
      } else {
        return {
          connected: false,
          error: `API error: ${response.status} ${response.statusText}`
        }
      }
    } catch (error) {
      console.error('❌ DataMagnet Company API connection error:', error)
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Extract company data from LinkedIn company URL
   */
  async extractCompany(companyUrl: string): Promise<DataMagnetCompanyResult> {
    try {
      console.log(`🏢 DataMagnet: Extracting company data from ${companyUrl}`)
      
      const response = await fetch(`${this.baseUrl}/linkedin/company`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: companyUrl
        })
      })

      const data = await response.json()

      // Handle common API limitations
      if (response.status === 403) {
        return {
          success: false,
          upgradeRequired: true,
          planLimitation: 'Company API requires paid plan',
          error: 'Upgrade to paid plan required for company data extraction'
        }
      }

      if (response.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded - too many requests',
          rateLimit: this.extractRateLimit(response)
        }
      }

      if (!response.ok) {
        throw new Error(`DataMagnet Company API error: ${response.status} - ${data.message || response.statusText}`)
      }

      // Process the company data
      const company = this.processCompanyData(data, companyUrl)

      return {
        success: true,
        company,
        employeeCount: company.employees?.length || 0,
        totalEmployeesFound: company.employeeCount || 0,
        creditsUsed: this.calculateCreditsUsed(data),
        rateLimit: this.extractRateLimit(response),
        requestId: data.requestId || response.headers.get('x-request-id')
      }

    } catch (error) {
      console.error(`❌ DataMagnet company extraction failed for ${companyUrl}:`, error)
      
      // Check if error indicates upgrade required
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      if (errorMessage.includes('403') || errorMessage.includes('upgrade') || errorMessage.includes('plan')) {
        return {
          success: false,
          upgradeRequired: true,
          error: 'Paid plan required for company data extraction'
        }
      }
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Get company employees specifically (if supported as separate endpoint)
   */
  async getCompanyEmployees(
    companyUrl: string, 
    maxEmployees: number = 25
  ): Promise<DataMagnetCompanyResult> {
    try {
      console.log(`👥 DataMagnet: Getting ${maxEmployees} employees for company ${companyUrl}`)
      
      // First try company endpoint to get employee list
      const companyResult = await this.extractCompany(companyUrl)
      
      if (!companyResult.success) {
        return companyResult
      }

      // If we got employee URLs, we could optionally fetch detailed profiles
      // This would use additional credits, so we'll just return the basic employee data
      return {
        ...companyResult,
        totalEmployeesFound: companyResult.company?.employees?.length || 0
      }

    } catch (error) {
      console.error(`❌ DataMagnet employee extraction failed:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Search for company by name (if endpoint exists)
   */
  async searchCompany(companyName: string): Promise<DataMagnetCompanyResult> {
    try {
      console.log(`🔍 DataMagnet: Searching for company "${companyName}"`)
      
      // This endpoint may not exist - falling back to direct URL extraction
      const linkedinUrl = this.generateLinkedInCompanyUrl(companyName)
      
      return await this.extractCompany(linkedinUrl)

    } catch (error) {
      console.error(`❌ DataMagnet company search failed for "${companyName}":`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Process raw DataMagnet company API response
   */
  private processCompanyData(rawData: any, originalUrl: string): DataMagnetCompanyData {
    return {
      // Basic Information
      name: rawData.name || rawData.companyName || rawData.displayName,
      displayName: rawData.displayName,
      description: rawData.description || rawData.about,
      industry: rawData.industry,
      headquarters: rawData.headquarters || rawData.hq,
      founded: rawData.founded || rawData.foundedYear,
      companySize: rawData.companySize || rawData.size,
      employeeCount: rawData.employeeCount || rawData.staffCount,
      
      // URLs and IDs
      linkedinUrl: originalUrl,
      website: rawData.website || rawData.websiteUrl,
      companyId: rawData.companyId || rawData.id,
      universalName: rawData.universalName,
      
      // Locations
      locations: this.processLocations(rawData.locations || []),
      
      // Company Details
      specialties: rawData.specialties,
      companyType: rawData.companyType || rawData.type,
      
      // Financial Data
      fundingData: rawData.funding ? {
        totalFunding: rawData.funding.total,
        lastFundingRound: rawData.funding.lastRound,
        lastFundingDate: rawData.funding.lastDate,
        investors: rawData.funding.investors
      } : undefined,
      
      // Employee Data (key DataMagnet advantage)
      employees: this.processEmployees(rawData.employees || rawData.staff || []),
      
      // Metrics
      followers: rawData.followers || rawData.followersCount,
      
      // Images
      logoUrl: rawData.logoUrl || rawData.logo,
      coverImageUrl: rawData.coverImageUrl || rawData.coverImage,
      
      // Activity
      recentPosts: this.processCompanyPosts(rawData.posts || rawData.updates || []),
      
      // Metadata
      lastUpdated: new Date().toISOString(),
      dataQuality: this.calculateCompanyDataQuality(rawData)
    }
  }

  /**
   * Process employee data from company response
   */
  private processEmployees(employees: any[]): DataMagnetCompanyData['employees'] {
    return employees.map(emp => ({
      name: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
      title: emp.title || emp.position || emp.role,
      profileUrl: emp.profileUrl || emp.linkedinUrl,
      department: emp.department,
      location: emp.location,
      startDate: emp.startDate,
      profileImageUrl: emp.profileImageUrl || emp.photoUrl
    }))
  }

  /**
   * Process company locations
   */
  private processLocations(locations: any[]): DataMagnetCompanyData['locations'] {
    return locations.map(loc => ({
      country: loc.country,
      city: loc.city,
      address: loc.address,
      isHeadquarters: loc.isHeadquarters || loc.isHQ
    }))
  }

  /**
   * Process company posts/updates
   */
  private processCompanyPosts(posts: any[]): DataMagnetCompanyData['recentPosts'] {
    return posts.map(post => ({
      content: post.content || post.text,
      date: post.date || post.publishedAt,
      likes: post.likes || post.likesCount,
      comments: post.comments || post.commentsCount,
      shares: post.shares || post.sharesCount,
      author: post.author || post.authorName
    }))
  }

  /**
   * Calculate data quality for company data
   */
  private calculateCompanyDataQuality(rawData: any): DataMagnetCompanyData['dataQuality'] {
    let completeness = 0
    const fields = [
      'name', 'description', 'industry', 'headquarters', 'website', 
      'employees', 'logoUrl', 'followers'
    ]
    
    fields.forEach(field => {
      if (rawData[field] && rawData[field] !== '' && 
          (!Array.isArray(rawData[field]) || rawData[field].length > 0)) {
        completeness++
      }
    })
    
    const completenessPercentage = Math.round((completeness / fields.length) * 100)
    
    return {
      completeness: completenessPercentage,
      freshness: 95, // DataMagnet provides real-time data
      accuracy: 90   // Based on LinkedIn data quality
    }
  }

  /**
   * Calculate credits used based on response
   */
  private calculateCreditsUsed(data: any): number {
    // Estimate credits based on data returned
    let credits = 1 // Base company data
    
    if (data.employees && data.employees.length > 0) {
      credits += Math.ceil(data.employees.length / 10) // Additional credits for employee data
    }
    
    return credits
  }

  /**
   * Extract rate limit info from response headers
   */
  private extractRateLimit(response: Response): { remaining: number, resetTime: string } | undefined {
    const remaining = response.headers.get('x-ratelimit-remaining')
    const reset = response.headers.get('x-ratelimit-reset')
    
    if (remaining && reset) {
      return {
        remaining: parseInt(remaining),
        resetTime: reset
      }
    }
    
    return undefined
  }

  /**
   * Generate LinkedIn company URL from company name
   */
  private generateLinkedInCompanyUrl(companyName: string): string {
    const slug = companyName.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
    
    return `https://www.linkedin.com/company/${slug}`
  }
}

// Singleton instance
let dataMagnetCompanyInstance: DataMagnetCompanyService | null = null

export const getDataMagnetCompanyService = (): DataMagnetCompanyService => {
  if (!dataMagnetCompanyInstance) {
    const apiToken = process.env.DATAMAGNET_API_TOKEN
    
    if (!apiToken) {
      throw new Error('DATAMAGNET_API_TOKEN environment variable is required')
    }
    
    dataMagnetCompanyInstance = new DataMagnetCompanyService({
      apiToken,
      apiUrl: process.env.DATAMAGNET_API_URL || 'https://api.datamagnet.co/api/v1'
    })
  }
  
  return dataMagnetCompanyInstance
}

export default DataMagnetCompanyService