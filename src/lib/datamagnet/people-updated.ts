/**
 * DataMagnet People API Service - Updated for Actual API Response Format
 * 
 * Purpose: Extract detailed LinkedIn profile data using DataMagnet's specialized API
 * Key Advantage: Recommendations with relationship context - crucial for synthetic intelligence!
 * 
 * Based on actual API response from Philip Agathangelou @ CK Delta
 */

export interface DataMagnetConfig {
  apiToken: string
  apiUrl?: string
}

// Updated interface based on actual DataMagnet response
export interface DataMagnetProfileData {
  // Basic Profile Information
  display_name: string
  first_name?: string
  last_name?: string
  full_name: string
  unformatted_full_name: string
  profile_headline: string
  description?: string // LinkedIn summary
  location: string
  profile_link: string
  username: string
  linkedin_id: string
  public_identifier?: string

  // Professional Information
  current_company_name?: string
  current_company_linkedin_url?: string
  company_website?: string
  company_industry?: string
  job_title?: string
  raw_job_title?: string
  job_description?: string[]
  job_location?: string
  job_started_on?: string
  job_ended_on?: string
  job_still_working?: boolean
  
  // Experience History (Rich DataMagnet data)
  experience: Array<{
    job_title: string
    raw_job_title: string
    company_name: string
    company_url?: string
    company_website?: string
    company_industry?: string
    company_headcount_range?: string
    job_location?: string
    job_location_city?: string
    job_location_country?: string
    job_location_state?: string
    job_started_on?: string
    job_ended_on?: string
    job_still_working: boolean
    job_description?: string[]
    company_id?: string
    company_image?: string
  }>
  
  // Education
  education: Array<{
    university_name: string
    university_id?: string
    social_url?: string
    fields_of_study?: string[]
    description?: string
    started_on?: { year: number }
    ended_on?: { year: number }
  }>
  
  // Skills (Simple array format)
  skills?: string[]
  
  // Network Data (DataMagnet advantage)
  connections?: number
  followers?: number
  
  // Contact Information
  email?: string
  phone_number?: string
  twitter_link?: string
  websites?: string[]
  
  // Visual Assets
  avatar_url?: string
  profile_pic_url?: string
  company_image?: string
  
  // Rich Profile Data
  country?: string
  industry?: string
  is_premium?: boolean
  is_influencer?: boolean
  is_creator?: boolean
  is_job_seeker?: boolean
  is_retired?: boolean
  is_openlink?: boolean
  
  // Birthday (usually private)
  birthday?: {
    day: string
    month: string
    year: string
  }
  
  // 🌟 RECOMMENDATIONS - Key DataMagnet Advantage for Synthetic Intelligence!
  recommendations?: Array<{
    name: string
    subtitle: string
    url: string
    urn: string
    context: string // "Jim managed Philip directly" - CRUCIAL for org chart validation!
    date: string
    description: string // Actual recommendation text
  }>
  
  // Recommendations Given (also valuable for relationship mapping)
  recommendationsReceived?: Array<{
    name: string
    subtitle: string  
    url: string
    urn: string
    context: string // Relationship context
    date: string
    description: string
  }>
  
  // Also Viewed Profiles (Network insights)
  also_viewed?: Array<{
    entity_urn: string
    first_name: string
    last_name: string
    headline: string
    follower_count: number
    premium: boolean
    profile_picture?: string
    public_identifier: string
    url: string
  }>
  
  // Profile Features
  featured?: Array<{
    title: string
    subtitle?: string
    text?: string
    type: string // "Document", etc.
    url?: string
    image?: string
  }>
  
  // Professional Arrays
  certification?: any[]
  patents?: any[]
  publication?: any[]
  project?: any[]
  volunteering?: any[]
  language?: any[]
  associated_hashtag?: any[]
  
  // For synthetic intelligence (enhanced with recommendation insights)
  inferredDepartment?: string
  inferredLevel?: string
  inferredManager?: string
  verifiedRelationships?: Array<{
    name: string
    relationship: string // "manager", "direct_report", "peer", "client"
    confidence: number
    source: string // "recommendation", "also_viewed", "experience"
  }>
  
  // Metadata
  lastUpdated?: string
  dataQuality?: {
    completeness: number
    freshness: number
    accuracy: number
    recommendationCount: number // New: tracks relationship validation data
  }
}

export interface DataMagnetPersonResult {
  success: boolean
  profile?: DataMagnetProfileData
  error?: string
  creditsUsed?: number
  rateLimit?: {
    remaining: number
    resetTime: string
  }
  requestId?: string
}

class DataMagnetPeopleService {
  private config: DataMagnetConfig
  private baseUrl: string

  constructor(config: DataMagnetConfig) {
    this.config = config
    this.baseUrl = config.apiUrl || 'https://api.datamagnet.co/api/v1'
  }

  /**
   * Test DataMagnet API connection and get account info
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/credits`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ DataMagnet connection successful. Credits:', data)
        return true
      } else {
        console.error('❌ DataMagnet connection failed:', response.status, response.statusText)
        return false
      }
    } catch (error) {
      console.error('❌ DataMagnet connection error:', error)
      return false
    }
  }

  /**
   * Extract profile data from LinkedIn URL using DataMagnet
   */
  async extractProfile(linkedinUrl: string): Promise<DataMagnetPersonResult> {
    try {
      console.log(`🔍 DataMagnet: Extracting profile from ${linkedinUrl}`)
      
      const response = await fetch(`${this.baseUrl}/linkedin/person`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: linkedinUrl
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(`DataMagnet API error: ${response.status} - ${data.message || response.statusText}`)
      }

      // Process the raw DataMagnet response
      const profile = this.processDataMagnetProfile(data, linkedinUrl)

      return {
        success: true,
        profile,
        creditsUsed: 1,
        rateLimit: this.extractRateLimit(response),
        requestId: data.requestId || response.headers.get('x-request-id')
      }

    } catch (error) {
      console.error(`❌ DataMagnet profile extraction failed for ${linkedinUrl}:`, error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Bulk extract multiple profiles with intelligent delay
   */
  async extractMultipleProfiles(
    linkedinUrls: string[],
    delayMs: number = 2000 // Increased delay for DataMagnet rate limits
  ): Promise<DataMagnetPersonResult[]> {
    const results: DataMagnetPersonResult[] = []
    
    console.log(`🚀 DataMagnet: Bulk extracting ${linkedinUrls.length} profiles with ${delayMs}ms delay`)

    for (let i = 0; i < linkedinUrls.length; i++) {
      const url = linkedinUrls[i]
      console.log(`📊 Processing profile ${i + 1}/${linkedinUrls.length}: ${url}`)
      
      const result = await this.extractProfile(url)
      results.push(result)
      
      // Add delay between requests
      if (i < linkedinUrls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs))
      }
    }

    const successful = results.filter(r => r.success).length
    console.log(`✅ DataMagnet bulk extraction complete: ${successful}/${linkedinUrls.length} successful`)

    return results
  }

  /**
   * Get account credits and usage information
   */
  async getAccountInfo(): Promise<{
    credits: number
    usage: number
    plan: string
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/credits`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get account info: ${response.status}`)
      }

      const data = await response.json()
      return {
        credits: data.credits || 0,
        usage: data.usage || 0,
        plan: data.plan || 'unknown'
      }
    } catch (error) {
      console.error('❌ Failed to get DataMagnet account info:', error)
      throw error
    }
  }

  /**
   * Process raw DataMagnet API response into our enhanced format
   * Key enhancement: Extract relationship data from recommendations
   */
  private processDataMagnetProfile(rawData: any, originalUrl: string): DataMagnetProfileData {
    // Process verified relationships from recommendations
    const verifiedRelationships = this.extractVerifiedRelationships(rawData)
    
    return {
      // Basic Information (using actual DataMagnet field names)
      display_name: rawData.display_name || rawData.full_name,
      first_name: rawData.first_name,
      last_name: rawData.last_name,
      full_name: rawData.full_name || rawData.unformatted_full_name,
      unformatted_full_name: rawData.unformatted_full_name,
      profile_headline: rawData.profile_headline || rawData.headline,
      description: rawData.description,
      location: rawData.location,
      profile_link: rawData.profile_link || originalUrl,
      username: rawData.username,
      linkedin_id: rawData.linkedin_id,
      public_identifier: rawData.username,

      // Current Position
      current_company_name: rawData.current_company_name,
      current_company_linkedin_url: rawData.current_company_linkedin_url,
      company_website: rawData.company_website,
      company_industry: rawData.company_industry,
      job_title: rawData.job_title,
      raw_job_title: rawData.raw_job_title,
      job_description: rawData.job_description,
      job_location: rawData.job_location,
      job_started_on: rawData.job_started_on,
      job_ended_on: rawData.job_ended_on,
      job_still_working: rawData.job_still_working,

      // Experience (directly use DataMagnet format)
      experience: rawData.experience || [],
      
      // Education (directly use DataMagnet format)
      education: rawData.education || [],
      
      // Skills (simple array)
      skills: rawData.skills || [],
      
      // Network Data
      connections: rawData.connections,
      followers: rawData.followers,
      
      // Contact Info
      email: rawData.email,
      phone_number: rawData.phone_number,
      twitter_link: rawData.twitter_link,
      websites: rawData.websites,
      
      // Visual Assets
      avatar_url: rawData.avatar_url,
      profile_pic_url: rawData.profile_pic_url,
      company_image: rawData.company_image,
      
      // Profile Metadata
      country: rawData.country,
      industry: rawData.industry,
      is_premium: rawData.is_premium,
      is_influencer: rawData.is_influencer,
      is_creator: rawData.is_creator,
      is_job_seeker: rawData.is_job_seeker,
      is_retired: rawData.is_retired,
      is_openlink: rawData.is_openlink,
      
      // Birthday
      birthday: rawData.birthday,
      
      // 🌟 RICH RELATIONSHIP DATA - Key for Synthetic Intelligence!
      recommendations: rawData.recommendations || [],
      recommendationsReceived: rawData.recommendationsReceived || [],
      also_viewed: rawData.also_viewed || [],
      
      // Featured content
      featured: rawData.featured || [],
      
      // Professional arrays
      certification: rawData.certification || [],
      patents: rawData.patents || [],
      publication: rawData.publication || [],
      project: rawData.project || [],
      volunteering: rawData.volunteering || [],
      language: rawData.language || [],
      associated_hashtag: rawData.associated_hashtag || [],
      
      // Enhanced synthetic intelligence with relationship insights
      inferredDepartment: this.inferDepartment(rawData.job_title, rawData.profile_headline),
      inferredLevel: this.inferLevel(rawData.job_title, rawData.profile_headline),
      inferredManager: this.inferManager(verifiedRelationships),
      verifiedRelationships,
      
      // Enhanced metadata
      lastUpdated: new Date().toISOString(),
      dataQuality: this.calculateEnhancedDataQuality(rawData)
    }
  }

  /**
   * 🌟 Extract verified relationships from recommendations - Key Innovation!
   * This provides authentic organizational structure validation
   */
  private extractVerifiedRelationships(rawData: any): Array<{
    name: string
    relationship: string
    confidence: number
    source: string
  }> {
    const relationships: Array<{
      name: string
      relationship: string
      confidence: number
      source: string
    }> = []

    // Process recommendations received (people who recommended this person)
    if (rawData.recommendations) {
      rawData.recommendations.forEach((rec: any) => {
        const relationship = this.parseRelationshipContext(rec.context)
        if (relationship) {
          relationships.push({
            name: rec.name,
            relationship: relationship.type,
            confidence: relationship.confidence,
            source: 'recommendation'
          })
        }
      })
    }

    // Also check recommendations given (this person recommended others)
    if (rawData.recommendationsReceived) {
      rawData.recommendationsReceived.forEach((rec: any) => {
        const relationship = this.parseRelationshipContext(rec.context)
        if (relationship) {
          // Invert the relationship since this is someone they recommended
          const invertedType = this.invertRelationship(relationship.type)
          relationships.push({
            name: rec.name,
            relationship: invertedType,
            confidence: relationship.confidence,
            source: 'recommendation_given'
          })
        }
      })
    }

    return relationships
  }

  /**
   * Parse relationship context from recommendation text
   * Examples: "Jim managed Philip directly" -> manager
   */
  private parseRelationshipContext(context: string): { type: string, confidence: number } | null {
    if (!context) return null

    const text = context.toLowerCase()
    
    if (text.includes('managed') && text.includes('directly')) {
      return { type: 'manager', confidence: 95 }
    }
    if (text.includes('managed')) {
      return { type: 'manager', confidence: 85 }
    }
    if (text.includes('reported to') || text.includes('senior to')) {
      return { type: 'manager', confidence: 90 }
    }
    if (text.includes('worked with') && text.includes('same team')) {
      return { type: 'peer', confidence: 80 }
    }
    if (text.includes('client') || text.includes('customer')) {
      return { type: 'client', confidence: 85 }
    }
    if (text.includes('different companies')) {
      return { type: 'external', confidence: 70 }
    }
    if (text.includes('worked with')) {
      return { type: 'colleague', confidence: 75 }
    }
    
    return { type: 'unknown', confidence: 50 }
  }

  /**
   * Invert relationship type for recommendations given
   */
  private invertRelationship(type: string): string {
    switch (type) {
      case 'manager': return 'direct_report'
      case 'direct_report': return 'manager'
      case 'peer': return 'peer'
      case 'client': return 'service_provider'
      case 'service_provider': return 'client'
      default: return type
    }
  }

  /**
   * Infer manager from verified relationships
   */
  private inferManager(relationships: any[]): string | null {
    const manager = relationships.find(rel => rel.relationship === 'manager')
    return manager ? manager.name : null
  }

  /**
   * Calculate enhanced data quality with relationship insights
   */
  private calculateEnhancedDataQuality(rawData: any): DataMagnetProfileData['dataQuality'] {
    let completeness = 0
    const fields = [
      'display_name', 'profile_headline', 'description', 'location', 'experience',
      'education', 'skills', 'connections', 'avatar_url', 'current_company_name'
    ]
    
    fields.forEach(field => {
      if (rawData[field] && rawData[field] !== '' && 
          (!Array.isArray(rawData[field]) || rawData[field].length > 0)) {
        completeness++
      }
    })
    
    const completenessPercentage = Math.round((completeness / fields.length) * 100)
    const recommendationCount = (rawData.recommendations?.length || 0) + (rawData.recommendationsReceived?.length || 0)
    
    return {
      completeness: completenessPercentage,
      freshness: 95, // DataMagnet provides real-time data
      accuracy: 90 + Math.min(recommendationCount * 2, 10), // Boost accuracy with recommendations
      recommendationCount
    }
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
   * Infer department from job title and headline
   */
  private inferDepartment(title: string = '', headline: string = ''): string {
    const text = `${title} ${headline}`.toLowerCase()
    
    if (text.includes('engineer') || text.includes('developer') || text.includes('technical')) {
      return 'Engineering'
    }
    if (text.includes('product') || text.includes(' pm ')) {
      return 'Product'
    }
    if (text.includes('sales') || text.includes('business development')) {
      return 'Sales'
    }
    if (text.includes('marketing') || text.includes('growth')) {
      return 'Marketing'
    }
    if (text.includes('design') || text.includes('ux') || text.includes('ui')) {
      return 'Design'
    }
    if (text.includes('ceo') || text.includes('cto') || text.includes('founder')) {
      return 'Executive'
    }
    if (text.includes('data') || text.includes('analytics') || text.includes('science')) {
      return 'Data Science'
    }
    
    return 'Other'
  }

  /**
   * Infer seniority level from job title
   */
  private inferLevel(title: string = '', headline: string = ''): string {
    const text = `${title} ${headline}`.toLowerCase()
    
    if (text.includes('ceo') || text.includes('cto') || text.includes('founder')) {
      return 'Executive'
    }
    if (text.includes('director') || text.includes('head of') || text.includes('vp ')) {
      return 'Director'
    }
    if (text.includes('senior') || text.includes('lead') || text.includes('principal')) {
      return 'Senior'
    }
    if (text.includes('junior') || text.includes('associate')) {
      return 'Junior'
    }
    
    return 'Mid'
  }
}

// Singleton instance
let dataMagnetPeopleUpdatedInstance: DataMagnetPeopleService | null = null

export const getDataMagnetPeopleServiceUpdated = (): DataMagnetPeopleService => {
  if (!dataMagnetPeopleUpdatedInstance) {
    const config: DataMagnetConfig = {
      apiToken: process.env.DATAMAGNET_API_TOKEN!,
      apiUrl: process.env.DATAMAGNET_API_URL || 'https://api.datamagnet.co/api/v1'
    }
    
    if (!config.apiToken) {
      throw new Error('DATAMAGNET_API_TOKEN environment variable is required')
    }
    
    dataMagnetPeopleUpdatedInstance = new DataMagnetPeopleService(config)
  }
  
  return dataMagnetPeopleUpdatedInstance
}

export default DataMagnetPeopleService