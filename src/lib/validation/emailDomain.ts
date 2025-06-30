/**
 * Email Domain Validation System
 * Prevents users from falsely claiming to work at companies
 * Validates that user's email domain matches company domain
 */

// import { WebSearch } from '@/lib/search' // TODO: Fix missing search module

export interface CompanyDomainInfo {
  companyName: string
  primaryDomain: string
  alternativeDomains: string[]
  isVerified: boolean
  foundVia: 'database' | 'web_search' | 'manual'
  lastVerified: Date
}

export interface EmployeeVerification {
  userId: string
  email: string
  domain: string
  companyName: string
  isVerified: boolean
  verificationMethod: 'email_domain' | 'manual_override' | 'pending'
  verifiedAt?: Date
  confidence: number // 0-100
}

class EmailDomainValidationService {
  
  /**
   * Known company domains database
   * Start with companies we know, expand over time
   */
  private knownCompanyDomains: Record<string, CompanyDomainInfo> = {
    'ckdelta.ai': {
      companyName: 'CK Delta',
      primaryDomain: 'ckdelta.ai',
      alternativeDomains: ['ckdelta.com'],
      isVerified: true,
      foundVia: 'manual',
      lastVerified: new Date()
    },
    'anthropic.com': {
      companyName: 'Anthropic',
      primaryDomain: 'anthropic.com',
      alternativeDomains: [],
      isVerified: true,
      foundVia: 'manual',
      lastVerified: new Date()
    },
    'openai.com': {
      companyName: 'OpenAI',
      primaryDomain: 'openai.com',
      alternativeDomains: [],
      isVerified: true,
      foundVia: 'manual',
      lastVerified: new Date()
    },
    'stripe.com': {
      companyName: 'Stripe',
      primaryDomain: 'stripe.com',
      alternativeDomains: [],
      isVerified: true,
      foundVia: 'manual',
      lastVerified: new Date()
    }
  }

  /**
   * Extract domain from email address
   */
  extractDomain(email: string): string {
    const domain = email.split('@')[1]?.toLowerCase()
    if (!domain) {
      throw new Error('Invalid email address')
    }
    return domain
  }

  /**
   * Validate if user's email domain matches a legitimate company
   */
  async validateEmployeeEmail(
    userId: string, 
    email: string, 
    claimedCompany?: string
  ): Promise<EmployeeVerification> {
    const domain = this.extractDomain(email)
    
    // Check against known company domains
    const knownCompany = this.findCompanyByDomain(domain)
    
    if (knownCompany) {
      return {
        userId,
        email,
        domain,
        companyName: knownCompany.companyName,
        isVerified: true,
        verificationMethod: 'email_domain',
        verifiedAt: new Date(),
        confidence: 95
      }
    }

    // If not in known database, try web search verification
    if (claimedCompany) {
      const webVerification = await this.verifyCompanyDomainViaWeb(claimedCompany, domain)
      
      if (webVerification.isVerified) {
        // Add to known domains database for future use
        this.knownCompanyDomains[domain] = webVerification
        
        return {
          userId,
          email,
          domain,
          companyName: webVerification.companyName,
          isVerified: true,
          verificationMethod: 'email_domain',
          verifiedAt: new Date(),
          confidence: webVerification.foundVia === 'web_search' ? 80 : 95
        }
      }
    }

    // Email domain not verified
    return {
      userId,
      email,
      domain,
      companyName: claimedCompany || 'Unknown',
      isVerified: false,
      verificationMethod: 'pending',
      confidence: 0
    }
  }

  /**
   * Find company by domain in known database
   */
  private findCompanyByDomain(domain: string): CompanyDomainInfo | null {
    // Check primary domains
    if (this.knownCompanyDomains[domain]) {
      return this.knownCompanyDomains[domain]
    }

    // Check alternative domains
    for (const companyInfo of Object.values(this.knownCompanyDomains)) {
      if (companyInfo.alternativeDomains.includes(domain)) {
        return companyInfo
      }
    }

    return null
  }

  /**
   * Verify company domain via web search
   */
  async verifyCompanyDomainViaWeb(
    companyName: string, 
    domain: string
  ): Promise<CompanyDomainInfo> {
    try {
      // Search for company website
      const searchQuery = `"${companyName}" official website ${domain}`
      
      // Use Tavily or web search to find company information
      const searchResults = await this.searchCompanyInfo(searchQuery)
      
      // Check if domain appears in search results as official company domain
      const isVerified = this.analyzeDomainInSearchResults(searchResults, companyName, domain)
      
      return {
        companyName,
        primaryDomain: domain,
        alternativeDomains: [],
        isVerified,
        foundVia: 'web_search',
        lastVerified: new Date()
      }
    } catch (error) {
      console.error('Error verifying company domain via web:', error)
      return {
        companyName,
        primaryDomain: domain,
        alternativeDomains: [],
        isVerified: false,
        foundVia: 'web_search',
        lastVerified: new Date()
      }
    }
  }

  /**
   * Search for company information (placeholder for Tavily integration)
   */
  private async searchCompanyInfo(query: string): Promise<string[]> {
    // TODO: Integrate with Tavily API or web search
    // For now, return mock results
    return [
      `${query} - Official company website`,
      `About ${query.split('"')[1]} - Company information`
    ]
  }

  /**
   * Analyze search results to verify domain legitimacy
   */
  private analyzeDomainInSearchResults(
    searchResults: string[], 
    companyName: string, 
    domain: string
  ): boolean {
    const searchText = searchResults.join(' ').toLowerCase()
    const companyLower = companyName.toLowerCase()
    const domainLower = domain.toLowerCase()
    
    // Look for patterns that indicate legitimacy
    const legitimacyIndicators = [
      `${companyLower} official`,
      `${domainLower} official website`,
      `${companyLower} ${domainLower}`,
      `www.${domainLower}`,
      `https://${domainLower}`
    ]
    
    return legitimacyIndicators.some(indicator => 
      searchText.includes(indicator)
    )
  }

  /**
   * Get all verified employees for a company
   */
  async getVerifiedEmployeesForCompany(companyName: string): Promise<EmployeeVerification[]> {
    // TODO: Integrate with database to get verified employees
    // For now, return mock data
    return []
  }

  /**
   * Add manual company domain verification (for admin use)
   */
  addKnownCompanyDomain(domainInfo: CompanyDomainInfo): void {
    this.knownCompanyDomains[domainInfo.primaryDomain] = {
      ...domainInfo,
      foundVia: 'manual',
      lastVerified: new Date()
    }
  }

  /**
   * Check if company has any verified employees
   */
  async hasVerifiedEmployees(companyName: string): Promise<boolean> {
    const verifiedEmployees = await this.getVerifiedEmployeesForCompany(companyName)
    return verifiedEmployees.length > 0
  }

  /**
   * Get company domain info
   */
  getCompanyDomainInfo(domain: string): CompanyDomainInfo | null {
    return this.findCompanyByDomain(domain)
  }

  /**
   * Validate email format
   */
  isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Check if domain is a known personal email provider
   */
  isPersonalEmailDomain(domain: string): boolean {
    const personalDomains = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
      'icloud.com', 'protonmail.com', 'aol.com', 'mail.com'
    ]
    return personalDomains.includes(domain.toLowerCase())
  }

  /**
   * Get validation confidence score
   */
  getValidationConfidence(verification: EmployeeVerification): number {
    if (!verification.isVerified) return 0
    
    if (verification.verificationMethod === 'email_domain') {
      const domainInfo = this.getCompanyDomainInfo(verification.domain)
      if (domainInfo?.foundVia === 'manual') return 95
      if (domainInfo?.foundVia === 'database') return 90
      if (domainInfo?.foundVia === 'web_search') return 80
    }
    
    return verification.confidence
  }
}

// Singleton instance
let emailValidationServiceInstance: EmailDomainValidationService | null = null

export const getEmailDomainValidationService = (): EmailDomainValidationService => {
  if (!emailValidationServiceInstance) {
    emailValidationServiceInstance = new EmailDomainValidationService()
  }
  return emailValidationServiceInstance
}

export default EmailDomainValidationService