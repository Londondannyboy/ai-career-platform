/**
 * DataMagnet People API Service
 * 
 * Purpose: Extract detailed LinkedIn profile data using DataMagnet's specialized API
 * Advantage: Real-time data, rich profile details, developer-friendly JSON responses
 * 
 * API Documentation: https://docs.datamagnet.co/quickstart/
 */

export interface DataMagnetConfig {
  apiToken: string
  apiUrl?: string
}

export interface DataMagnetProfileData {
  // Basic Profile Information
  name: string
  firstName?: string
  lastName?: string
  headline: string
  summary?: string
  location: string
  profileUrl: string
  profileId: string
  publicIdentifier?: string

  // Professional Information
  currentPosition?: {
    title: string
    company: string
    companyUrl?: string
    startDate?: string
    endDate?: string
    description?: string
  }
  
  // Experience History
  experience: Array<{
    title: string
    company: string
    companyUrl?: string
    location?: string
    startDate?: string
    endDate?: string
    duration?: string
    description?: string
    skills?: string[]
  }>
  
  // Education
  education: Array<{
    school: string
    schoolUrl?: string
    degree: string
    field?: string
    startDate?: string
    endDate?: string
    description?: string
    activities?: string[]
  }>
  
  // Skills & Endorsements
  skills?: Array<{
    name: string
    endorsements?: number
    endorsers?: string[]
  }>
  
  // Network Data (DataMagnet advantage)
  connections?: number
  followers?: number
  following?: number
  
  // Activity Data (DataMagnet advantage) 
  recentPosts?: Array<{
    content: string
    date: string
    likes?: number
    comments?: number
    shares?: number
    url?: string
  }>
  
  // Contact Information
  contactInfo?: {
    email?: string
    phone?: string
    twitter?: string
    website?: string
  }
  
  // Additional DataMagnet-specific fields
  profileImageUrl?: string
  backgroundImageUrl?: string
  industry?: string
  languages?: string[]
  certifications?: Array<{
    name: string
    issuer: string
    date?: string
    url?: string
  }>
  
  // Metadata
  lastUpdated?: string
  dataQuality?: {
    completeness: number
    freshness: number
    accuracy: number
  }
  
  // For synthetic intelligence
  inferredDepartment?: string
  inferredLevel?: string
  inferredManager?: string
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
      // Try to get credits info to test connection
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

      // Process the raw DataMagnet response into our structured format
      const profile = this.processDataMagnetProfile(data, linkedinUrl)

      return {
        success: true,
        profile,
        creditsUsed: 1, // DataMagnet typically uses 1 credit per profile
        rateLimit: this.extractRateLimit(response),
        requestId: data.requestId || response.headers.get('x-request-id')
      }

    } catch (error) {
      console.error(`❌ DataMagnet profile extraction failed for ${linkedinUrl}:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  }

  /**
   * Bulk extract multiple profiles (sequential to respect rate limits)
   */
  async extractMultipleProfiles(
    linkedinUrls: string[],
    delayMs: number = 1000
  ): Promise<DataMagnetPersonResult[]> {
    const results: DataMagnetPersonResult[] = []
    
    console.log(`🚀 DataMagnet: Bulk extracting ${linkedinUrls.length} profiles with ${delayMs}ms delay`)

    for (let i = 0; i < linkedinUrls.length; i++) {
      const url = linkedinUrls[i]
      console.log(`📊 Processing profile ${i + 1}/${linkedinUrls.length}: ${url}`)
      
      const result = await this.extractProfile(url)
      results.push(result)
      
      // Add delay between requests to respect rate limits
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
   * Process raw DataMagnet API response into our structured format
   */
  private processDataMagnetProfile(rawData: any, originalUrl: string): DataMagnetProfileData {
    // Extract current position
    const currentPosition = rawData.positions?.[0] || rawData.experience?.[0]
    
    return {
      // Basic Information
      name: rawData.name || `${rawData.firstName || ''} ${rawData.lastName || ''}`.trim(),
      firstName: rawData.firstName,
      lastName: rawData.lastName,
      headline: rawData.headline || rawData.title || '',
      summary: rawData.summary || rawData.about,
      location: rawData.location || rawData.geoLocation,
      profileUrl: originalUrl,
      profileId: this.extractProfileId(originalUrl),
      publicIdentifier: rawData.publicIdentifier || rawData.vanityName,

      // Current Position
      currentPosition: currentPosition ? {
        title: currentPosition.title || currentPosition.position,
        company: currentPosition.company || currentPosition.companyName,
        companyUrl: currentPosition.companyUrl,
        startDate: currentPosition.startDate,
        endDate: currentPosition.endDate,
        description: currentPosition.description
      } : undefined,

      // Experience
      experience: this.processExperience(rawData.positions || rawData.experience || []),
      
      // Education
      education: this.processEducation(rawData.education || []),
      
      // Skills
      skills: this.processSkills(rawData.skills || []),
      
      // Network Data (DataMagnet advantage)
      connections: rawData.connections || rawData.connectionsCount,
      followers: rawData.followers || rawData.followersCount,
      following: rawData.following || rawData.followingCount,
      
      // Activity Data (DataMagnet advantage)
      recentPosts: this.processRecentPosts(rawData.posts || rawData.activity || []),
      
      // Contact Info
      contactInfo: {
        email: rawData.email,
        phone: rawData.phone,
        twitter: rawData.twitter,
        website: rawData.website || rawData.contactInfo?.website
      },
      
      // Additional Fields
      profileImageUrl: rawData.profileImageUrl || rawData.photoUrl,
      backgroundImageUrl: rawData.backgroundImageUrl,
      industry: rawData.industry,
      languages: rawData.languages,
      certifications: this.processCertifications(rawData.certifications || []),
      
      // Metadata
      lastUpdated: new Date().toISOString(),
      dataQuality: this.calculateDataQuality(rawData),
      
      // Inferred data for synthetic intelligence
      inferredDepartment: this.inferDepartment(currentPosition?.title, rawData.headline),
      inferredLevel: this.inferLevel(currentPosition?.title, rawData.headline),
      inferredManager: undefined // Will be determined by relationship analysis
    }
  }

  /**
   * Process experience array from DataMagnet response
   */
  private processExperience(experience: any[]): DataMagnetProfileData['experience'] {
    return experience.map(exp => ({
      title: exp.title || exp.position,
      company: exp.company || exp.companyName,
      companyUrl: exp.companyUrl,
      location: exp.location,
      startDate: exp.startDate,
      endDate: exp.endDate,
      duration: exp.duration,
      description: exp.description,
      skills: exp.skills
    }))
  }

  /**
   * Process education array from DataMagnet response
   */
  private processEducation(education: any[]): DataMagnetProfileData['education'] {
    return education.map(edu => ({
      school: edu.school || edu.institution,
      schoolUrl: edu.schoolUrl,
      degree: edu.degree || edu.degreeType,
      field: edu.field || edu.fieldOfStudy,
      startDate: edu.startDate,
      endDate: edu.endDate,
      description: edu.description,
      activities: edu.activities
    }))
  }

  /**
   * Process skills array from DataMagnet response
   */
  private processSkills(skills: any[]): DataMagnetProfileData['skills'] {
    return skills.map(skill => ({
      name: typeof skill === 'string' ? skill : skill.name,
      endorsements: skill.endorsements || skill.endorsementCount,
      endorsers: skill.endorsers
    }))
  }

  /**
   * Process recent posts from DataMagnet response
   */
  private processRecentPosts(posts: any[]): DataMagnetProfileData['recentPosts'] {
    return posts.map(post => ({
      content: post.content || post.text,
      date: post.date || post.publishedAt,
      likes: post.likes || post.likesCount,
      comments: post.comments || post.commentsCount,
      shares: post.shares || post.sharesCount,
      url: post.url || post.postUrl
    }))
  }

  /**
   * Process certifications from DataMagnet response
   */
  private processCertifications(certifications: any[]): DataMagnetProfileData['certifications'] {
    return certifications.map(cert => ({
      name: cert.name || cert.title,
      issuer: cert.issuer || cert.organization,
      date: cert.date || cert.issueDate,
      url: cert.url
    }))
  }

  /**
   * Calculate data quality score based on completeness
   */
  private calculateDataQuality(rawData: any): DataMagnetProfileData['dataQuality'] {
    let completeness = 0
    const fields = [
      'name', 'headline', 'location', 'summary', 'experience', 
      'education', 'skills', 'connections', 'profileImageUrl'
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
   * Extract LinkedIn profile ID from URL
   */
  private extractProfileId(url: string): string {
    const match = url.match(/\/in\/([^\/\?]+)/)
    return match ? match[1] : ''
  }

  /**
   * Infer department from job title and headline
   */
  private inferDepartment(title: string = '', headline: string = ''): string {
    const text = `${title} ${headline}`.toLowerCase()
    
    if (text.includes('engineer') || text.includes('developer') || text.includes('technical')) {
      return 'Engineering'
    }
    if (text.includes('product') || text.includes('pm ')) {
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
let dataMagnetPeopleInstance: DataMagnetPeopleService | null = null

export const getDataMagnetPeopleService = (): DataMagnetPeopleService => {
  if (!dataMagnetPeopleInstance) {
    const config: DataMagnetConfig = {
      apiToken: process.env.DATAMAGNET_API_TOKEN!,
      apiUrl: process.env.DATAMAGNET_API_URL || 'https://api.datamagnet.co/api/v1'
    }
    
    if (!config.apiToken) {
      throw new Error('DATAMAGNET_API_TOKEN environment variable is required')
    }
    
    dataMagnetPeopleInstance = new DataMagnetPeopleService(config)
  }
  
  return dataMagnetPeopleInstance
}

export default DataMagnetPeopleService