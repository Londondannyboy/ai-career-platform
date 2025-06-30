import ApifyClient from 'apify-client'

export interface ApifyConfig {
  apiToken: string
  apiUrl?: string
}

export interface LinkedInProfileData {
  // Basic profile info
  name: string
  headline: string
  location: string
  profileUrl: string
  profileId: string
  
  // Professional info
  currentPosition?: string
  currentCompany?: string
  experience: Array<{
    title: string
    company: string
    duration: string
    location?: string
    description?: string
  }>
  
  // Education
  education: Array<{
    school: string
    degree: string
    field?: string
    duration: string
  }>
  
  // Additional data
  skills?: string[]
  connections?: number
  followers?: number
  
  // For synthetic intelligence
  inferredDepartment?: string
  inferredLevel?: string
  inferredManager?: string
}

export interface CompanyEmployeeData {
  companyName: string
  companyDomain: string
  employees: LinkedInProfileData[]
  scrapedAt: Date
  totalFound: number
  confidence: number
}

class ApifyService {
  private client: any
  private config: ApifyConfig

  constructor(config: ApifyConfig) {
    this.config = config
    this.client = new ApifyClient({
      token: config.apiToken,
      baseUrl: config.apiUrl
    })
  }

  /**
   * Test Apify connection and authentication
   */
  async testConnection(): Promise<boolean> {
    try {
      const user = await this.client.user().get()
      console.log('✅ Apify connection successful:', user?.username)
      return true
    } catch (error) {
      console.error('❌ Apify connection failed:', error)
      return false
    }
  }

  /**
   * Scrape LinkedIn employees for a specific company
   * Uses bebity/linkedin-premium-actor (company-focused bulk scraper)
   */
  async scrapeCompanyEmployees(
    companyName: string, 
    companyDomain: string,
    maxProfiles: number = 50
  ): Promise<CompanyEmployeeData> {
    try {
      console.log(`🔍 Scraping ${companyName} employees via LinkedIn (bebity bulk scraper)...`)
      
      // Step 1: Prepare company employee search input
      const searchInput = {
        // Company-focused search parameters for bebity
        searchType: 'company_employees',
        companyName: companyName,
        companyUrl: `https://www.linkedin.com/company/${companyName.toLowerCase().replace(/\s/g, '-')}`,
        maxResults: maxProfiles,
        
        // Filter options
        location: undefined, // Optional: can add location filtering
        jobTitles: undefined, // Optional: can filter by specific roles
        
        // Output preferences
        includeProfiles: true,
        includeJobTitles: true,
        includeLocation: true
      }

      // Step 2: Run bebity LinkedIn Premium Actor (company bulk scraper)
      const run = await this.client.actor('bebity/linkedin-premium-actor').call(searchInput)
      const results = await this.client.dataset(run.defaultDatasetId).listItems()
      
      // Step 3: Process and structure data
      const employees: LinkedInProfileData[] = results.items.map((item: any) => 
        this.processLinkedInProfile(item, companyName, companyDomain)
      )

      // Step 4: Apply organizational intelligence
      const processedEmployees = this.inferOrganizationalStructure(employees)

      return {
        companyName,
        companyDomain,
        employees: processedEmployees,
        scrapedAt: new Date(),
        totalFound: employees.length,
        confidence: this.calculateConfidence(employees, companyName)
      }

    } catch (error) {
      console.error(`❌ Error scraping ${companyName} employees:`, error)
      throw new Error(`Failed to scrape company employees: ${error instanceof Error ? error.message : 'Unknown error occurred'}`)
    }
  }

  /**
   * Process raw LinkedIn profile data into structured format
   */
  private processLinkedInProfile(
    rawProfile: any, 
    targetCompany: string,
    companyDomain: string
  ): LinkedInProfileData {
    // Extract current position and company
    const currentExperience = rawProfile.experience?.[0] || {}
    
    return {
      name: rawProfile.name || rawProfile.fullName || 'Unknown',
      headline: rawProfile.headline || rawProfile.title || '',
      location: rawProfile.location || rawProfile.geoLocation || '',
      profileUrl: rawProfile.url || rawProfile.profileUrl || '',
      profileId: this.extractProfileId(rawProfile.url),
      
      currentPosition: currentExperience.title || rawProfile.currentPosition,
      currentCompany: currentExperience.company || targetCompany,
      
      experience: this.processExperience(rawProfile.experience || []),
      education: this.processEducation(rawProfile.education || []),
      
      skills: rawProfile.skills || [],
      connections: rawProfile.connectionsCount || rawProfile.connections,
      followers: rawProfile.followersCount || rawProfile.followers,
      
      // Inferred organizational data (synthetic intelligence)
      inferredDepartment: this.inferDepartment(currentExperience.title, rawProfile.headline),
      inferredLevel: this.inferLevel(currentExperience.title, rawProfile.headline),
      inferredManager: undefined // Will be determined by relationship analysis
    }
  }

  /**
   * Infer organizational structure and relationships
   */
  private inferOrganizationalStructure(employees: LinkedInProfileData[]): LinkedInProfileData[] {
    // Group by inferred department
    const departments = this.groupByDepartment(employees)
    
    // Identify potential managers and hierarchy
    return employees.map(employee => ({
      ...employee,
      inferredManager: this.inferManager(employee, employees)
    }))
  }

  /**
   * Infer department from job title and headline
   */
  private inferDepartment(title: string = '', headline: string = ''): string {
    const text = `${title} ${headline}`.toLowerCase()
    
    if (text.includes('engineer') || text.includes('developer') || text.includes('technical') || text.includes('software')) {
      return 'Engineering'
    }
    if (text.includes('product') || text.includes('pm ') || text.includes('product manager')) {
      return 'Product'
    }
    if (text.includes('sales') || text.includes('business development') || text.includes('account')) {
      return 'Sales'
    }
    if (text.includes('marketing') || text.includes('growth') || text.includes('content')) {
      return 'Marketing'
    }
    if (text.includes('design') || text.includes('ux') || text.includes('ui')) {
      return 'Design'
    }
    if (text.includes('finance') || text.includes('accounting') || text.includes('financial')) {
      return 'Finance'
    }
    if (text.includes('hr') || text.includes('people') || text.includes('talent')) {
      return 'People'
    }
    if (text.includes('ceo') || text.includes('cto') || text.includes('cfo') || text.includes('founder')) {
      return 'Executive'
    }
    
    return 'Other'
  }

  /**
   * Infer seniority level from job title
   */
  private inferLevel(title: string = '', headline: string = ''): string {
    const text = `${title} ${headline}`.toLowerCase()
    
    if (text.includes('ceo') || text.includes('cto') || text.includes('cfo') || text.includes('founder')) {
      return 'Executive'
    }
    if (text.includes('director') || text.includes('head of') || text.includes('vp ') || text.includes('vice president')) {
      return 'Director'
    }
    if (text.includes('senior') || text.includes('lead') || text.includes('principal') || text.includes('staff')) {
      return 'Senior'
    }
    if (text.includes('junior') || text.includes('associate') || text.includes('intern')) {
      return 'Junior'
    }
    
    return 'Mid'
  }

  /**
   * Infer potential manager based on department and seniority
   */
  private inferManager(employee: LinkedInProfileData, allEmployees: LinkedInProfileData[]): string | undefined {
    const sameDepartment = allEmployees.filter(e => 
      e.inferredDepartment === employee.inferredDepartment && 
      e.name !== employee.name
    )
    
    // Look for someone with higher seniority in same department
    const potentialManagers = sameDepartment.filter(e => {
      const levels = ['Junior', 'Mid', 'Senior', 'Director', 'Executive']
      const employeeLevel = levels.indexOf(employee.inferredLevel || 'Mid')
      const managerLevel = levels.indexOf(e.inferredLevel || 'Mid')
      return managerLevel > employeeLevel
    })
    
    // Return the most senior person in department as likely manager
    if (potentialManagers.length > 0) {
      const mostSenior = potentialManagers.sort((a, b) => {
        const levels = ['Junior', 'Mid', 'Senior', 'Director', 'Executive']
        return levels.indexOf(b.inferredLevel || 'Mid') - levels.indexOf(a.inferredLevel || 'Mid')
      })[0]
      return mostSenior.name
    }
    
    return undefined
  }

  /**
   * Group employees by department
   */
  private groupByDepartment(employees: LinkedInProfileData[]): Record<string, LinkedInProfileData[]> {
    return employees.reduce((groups, employee) => {
      const dept = employee.inferredDepartment || 'Other'
      if (!groups[dept]) groups[dept] = []
      groups[dept].push(employee)
      return groups
    }, {} as Record<string, LinkedInProfileData[]>)
  }

  /**
   * Calculate confidence score for scraped data
   */
  private calculateConfidence(employees: LinkedInProfileData[], targetCompany: string): number {
    if (employees.length === 0) return 0
    
    const companyMatches = employees.filter(emp => 
      emp.currentCompany?.toLowerCase().includes(targetCompany.toLowerCase()) ||
      emp.experience.some(exp => exp.company.toLowerCase().includes(targetCompany.toLowerCase()))
    ).length
    
    return Math.round((companyMatches / employees.length) * 100)
  }

  /**
   * Extract LinkedIn profile ID from URL
   */
  private extractProfileId(url: string): string {
    if (!url) return ''
    const match = url.match(/\/in\/([^\/]+)/)
    return match ? match[1] : ''
  }

  /**
   * Process experience array
   */
  private processExperience(experience: any[]): LinkedInProfileData['experience'] {
    return experience.map(exp => ({
      title: exp.title || exp.position || '',
      company: exp.company || exp.companyName || '',
      duration: exp.duration || exp.period || '',
      location: exp.location || '',
      description: exp.description || ''
    }))
  }

  /**
   * Process education array
   */
  private processEducation(education: any[]): LinkedInProfileData['education'] {
    return education.map(edu => ({
      school: edu.school || edu.institution || '',
      degree: edu.degree || edu.degreeType || '',
      field: edu.field || edu.fieldOfStudy || '',
      duration: edu.duration || edu.period || ''
    }))
  }
}

// Singleton instance
let apifyServiceInstance: ApifyService | null = null

export const getApifyService = (): ApifyService => {
  if (!apifyServiceInstance) {
    const config: ApifyConfig = {
      apiToken: process.env.APIFY_API_TOKEN!,
      apiUrl: process.env.APIFY_API_URL || 'https://api.apify.com'
    }
    
    if (!config.apiToken) {
      throw new Error('APIFY_API_TOKEN environment variable is required')
    }
    
    apifyServiceInstance = new ApifyService(config)
  }
  
  return apifyServiceInstance
}

export default ApifyService