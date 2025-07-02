/**
 * Unified Company Intelligence Service
 * Combines Apollo, web search, DataMagnet, and other data sources with smart caching
 */

import { getApolloService } from '@/lib/apollo/apolloService';
import { getApolloStorageService } from '@/lib/apollo/apolloStorageService';
import { CompanySearchService } from '@/lib/search/companySearch';

interface IntelligenceSource {
  name: string;
  type: 'apollo' | 'web_search' | 'datamagnet' | 'rushdb' | 'news_api' | 'social';
  lastUpdated?: string;
  isStale: boolean;
  cost: number; // API credits or cost
  dataCount: number;
}

interface CompanyIntelligence {
  company: string;
  normalizedName: string;
  lastUpdated: string;
  sources: IntelligenceSource[];
  
  // Apollo data
  employees?: {
    total: number;
    profiles: any[];
    decisionMakers: any[];
    departments: Record<string, number>;
    seniority: Record<string, number>;
  };
  
  // Web search data
  webIntelligence?: {
    news: any[];
    articles: any[];
    pressReleases: any[];
    financialData: any[];
  };
  
  // Social data
  socialIntelligence?: {
    linkedinPosts: any[];
    sentiment: 'positive' | 'neutral' | 'negative';
    buyingSignals: any[];
  };
  
  // Company profile
  profile?: {
    description: string;
    industry: string;
    size: string;
    location: string;
    website: string;
    founded: string;
    revenue: string;
  };
  
  // Enrichment metadata
  enrichmentScore: number; // 0-100, how complete the data is
  insights: string[];
  recommendations: string[];
}

export class UnifiedIntelligenceService {
  private apolloService = getApolloService();
  private apolloStorage = getApolloStorageService();

  /**
   * Get comprehensive company intelligence from all sources
   */
  async getCompanyIntelligence(
    companyName: string,
    options: {
      forceRefresh?: boolean;
      sources?: string[];
      maxAge?: number; // days
    } = {}
  ): Promise<CompanyIntelligence> {
    
    // Step 1: Normalize company name and handle search variations
    const searchResult = CompanySearchService.searchCompany(companyName);
    const normalizedName = searchResult.normalizedName;
    
    console.log(`🔍 Getting intelligence for: ${companyName} → ${normalizedName}`);
    
    // Step 2: Check cache status for all sources
    const cacheStatus = await this.checkAllSourcesCache(normalizedName);
    
    // Step 3: Gather data from all sources
    const intelligence: CompanyIntelligence = {
      company: companyName,
      normalizedName,
      lastUpdated: new Date().toISOString(),
      sources: [],
      enrichmentScore: 0,
      insights: [],
      recommendations: []
    };
    
    // Get Apollo employee data
    if (!options.sources || options.sources.includes('apollo')) {
      intelligence.employees = await this.getApolloIntelligence(
        normalizedName, 
        options.forceRefresh,
        cacheStatus.apollo
      );
      intelligence.sources.push({
        name: 'Apollo API',
        type: 'apollo',
        lastUpdated: cacheStatus.apollo.lastUpdated,
        isStale: cacheStatus.apollo.isStale,
        cost: cacheStatus.apollo.wasCached ? 0 : (intelligence.employees?.profiles.length || 0),
        dataCount: intelligence.employees?.profiles.length || 0
      });
    }
    
    // Get web search intelligence
    if (!options.sources || options.sources.includes('web_search')) {
      intelligence.webIntelligence = await this.getWebIntelligence(
        normalizedName,
        options.forceRefresh,
        cacheStatus.webSearch
      );
      intelligence.sources.push({
        name: 'Web Search',
        type: 'web_search',
        lastUpdated: cacheStatus.webSearch.lastUpdated,
        isStale: cacheStatus.webSearch.isStale,
        cost: cacheStatus.webSearch.wasCached ? 0 : 5, // Estimated web search cost
        dataCount: (intelligence.webIntelligence?.news.length || 0) + 
                  (intelligence.webIntelligence?.articles.length || 0)
      });
    }
    
    // Get company profile data
    if (!options.sources || options.sources.includes('datamagnet')) {
      intelligence.profile = await this.getCompanyProfile(
        normalizedName,
        options.forceRefresh,
        cacheStatus.datamagnet
      );
      intelligence.sources.push({
        name: 'DataMagnet',
        type: 'datamagnet',
        lastUpdated: cacheStatus.datamagnet.lastUpdated,
        isStale: cacheStatus.datamagnet.isStale,
        cost: cacheStatus.datamagnet.wasCached ? 0 : 2,
        dataCount: intelligence.profile ? 1 : 0
      });
    }
    
    // Calculate enrichment score and generate insights
    intelligence.enrichmentScore = this.calculateEnrichmentScore(intelligence);
    intelligence.insights = this.generateInsights(intelligence);
    intelligence.recommendations = this.generateRecommendations(intelligence);
    
    return intelligence;
  }

  /**
   * Get Apollo employee intelligence with caching
   */
  private async getApolloIntelligence(
    companyName: string, 
    forceRefresh: boolean = false,
    cacheInfo: any
  ) {
    try {
      // Check if we should use cache
      if (!forceRefresh && !cacheInfo.isStale && cacheInfo.exists) {
        console.log(`💾 Using cached Apollo data for ${companyName}`);
        const cachedData = await this.apolloStorage.getCompanyProfiles(companyName);
        
        if (cachedData.profiles.length > 0) {
          return {
            total: cachedData.companyInfo?.total_employees || cachedData.total,
            profiles: cachedData.profiles,
            decisionMakers: cachedData.profiles.filter(p => 
              ['c_suite', 'vp', 'director'].includes(p.seniority || '')
            ),
            departments: this.aggregateDepartments(cachedData.profiles),
            seniority: this.aggregateSeniority(cachedData.profiles)
          };
        }
      }
      
      // Fetch fresh Apollo data
      console.log(`📡 Fetching fresh Apollo data for ${companyName}`);
      const apolloResponse = await this.apolloService.searchPeopleByCompany(companyName, {
        perPage: 50
      });
      
      // Store in cache
      await this.apolloStorage.storeEnrichmentData(companyName, apolloResponse, 'system');
      
      return {
        total: apolloResponse.pagination.total_entries,
        profiles: apolloResponse.people,
        decisionMakers: apolloResponse.people.filter(p => 
          ['c_suite', 'vp', 'director'].includes(p.seniority)
        ),
        departments: this.aggregateDepartments(apolloResponse.people),
        seniority: this.aggregateSeniority(apolloResponse.people)
      };
    } catch (error) {
      console.error('Apollo intelligence error:', error);
      return undefined;
    }
  }

  /**
   * Get web search intelligence with caching
   */
  private async getWebIntelligence(
    companyName: string,
    forceRefresh: boolean = false,
    cacheInfo: any
  ) {
    try {
      // This would integrate with web search APIs
      // For now, return mock data structure
      return {
        news: [],
        articles: [],
        pressReleases: [],
        financialData: []
      };
    } catch (error) {
      console.error('Web intelligence error:', error);
      return undefined;
    }
  }

  /**
   * Get company profile from DataMagnet/RushDB with caching
   */
  private async getCompanyProfile(
    companyName: string,
    forceRefresh: boolean = false,
    cacheInfo: any
  ) {
    try {
      // This would integrate with DataMagnet/RushDB
      // For now, return mock data structure
      return {
        description: '',
        industry: '',
        size: '',
        location: '',
        website: '',
        founded: '',
        revenue: ''
      };
    } catch (error) {
      console.error('Company profile error:', error);
      return undefined;
    }
  }

  /**
   * Check cache status for all data sources
   */
  private async checkAllSourcesCache(companyName: string) {
    const [apollo] = await Promise.all([
      this.apolloStorage.getCompanyEnrichmentStatus(companyName)
    ]);
    
    return {
      apollo: {
        exists: apollo.exists,
        isStale: apollo.isStale,
        lastUpdated: apollo.lastCrawled?.toISOString(),
        wasCached: apollo.exists && !apollo.isStale
      },
      webSearch: {
        exists: false,
        isStale: true,
        lastUpdated: undefined,
        wasCached: false
      },
      datamagnet: {
        exists: false,
        isStale: true,
        lastUpdated: undefined,
        wasCached: false
      }
    };
  }

  /**
   * Calculate enrichment score based on available data
   */
  private calculateEnrichmentScore(intelligence: CompanyIntelligence): number {
    let score = 0;
    let maxScore = 0;
    
    // Apollo data (40 points)
    maxScore += 40;
    if (intelligence.employees) {
      score += 20; // Base for having employee data
      if (intelligence.employees.total > 100) score += 5;
      if (intelligence.employees.decisionMakers.length > 0) score += 5;
      if (Object.keys(intelligence.employees.departments).length > 3) score += 5;
      if (intelligence.employees.profiles.some(p => p.linkedin_url)) score += 5;
    }
    
    // Web intelligence (30 points)
    maxScore += 30;
    if (intelligence.webIntelligence) {
      score += 10; // Base for having web data
      score += Math.min(10, intelligence.webIntelligence.news.length);
      score += Math.min(10, intelligence.webIntelligence.articles.length);
    }
    
    // Company profile (30 points)
    maxScore += 30;
    if (intelligence.profile) {
      score += 10; // Base for having profile
      if (intelligence.profile.description) score += 5;
      if (intelligence.profile.industry) score += 5;
      if (intelligence.profile.revenue) score += 5;
      if (intelligence.profile.website) score += 5;
    }
    
    return Math.round((score / maxScore) * 100);
  }

  /**
   * Generate insights from combined intelligence
   */
  private generateInsights(intelligence: CompanyIntelligence): string[] {
    const insights = [];
    
    if (intelligence.employees) {
      const { employees } = intelligence;
      
      if (employees.total > 10000) {
        insights.push(`Large enterprise with ${employees.total.toLocaleString()} employees`);
      }
      
      if (employees.decisionMakers.length > 0) {
        insights.push(`${employees.decisionMakers.length} decision makers identified`);
      }
      
      const topDept = Object.entries(employees.departments)
        .sort(([,a], [,b]) => b - a)[0];
      if (topDept) {
        insights.push(`Largest department: ${topDept[0]} (${topDept[1]} employees)`);
      }
      
      const linkedinProfiles = employees.profiles.filter(p => p.linkedin_url).length;
      if (linkedinProfiles > 0) {
        insights.push(`${linkedinProfiles} LinkedIn profiles available for outreach`);
      }
    }
    
    return insights;
  }

  /**
   * Generate recommendations for sales/outreach
   */
  private generateRecommendations(intelligence: CompanyIntelligence): string[] {
    const recommendations = [];
    
    if (intelligence.employees?.decisionMakers && intelligence.employees.decisionMakers.length > 0) {
      recommendations.push('Focus on identified decision makers for outreach');
    }
    
    if (intelligence.enrichmentScore < 60) {
      recommendations.push('Consider refreshing data for more complete intelligence');
    }
    
    if (intelligence.employees?.profiles && intelligence.employees.profiles.some(p => p.linkedin_url)) {
      recommendations.push('Use LinkedIn URLs for social selling and network mapping');
    }
    
    return recommendations;
  }

  /**
   * Helper methods for data aggregation
   */
  private aggregateDepartments(profiles: any[]): Record<string, number> {
    return profiles.reduce((acc, profile) => {
      const depts = profile.departments || [];
      depts.forEach((dept: string) => {
        acc[dept] = (acc[dept] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
  }

  private aggregateSeniority(profiles: any[]): Record<string, number> {
    return profiles.reduce((acc, profile) => {
      const seniority = profile.seniority || 'unknown';
      acc[seniority] = (acc[seniority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  /**
   * Get search suggestions with all known companies
   */
  async getSearchSuggestions(query: string): Promise<string[]> {
    // Get known companies from Apollo cache (actual enriched data)
    const { companies } = await this.apolloStorage.getEnrichedCompanies();
    const knownCompanies = companies.map(c => c.company_name);
    
    console.log(`🔍 Known companies in database: ${knownCompanies.length}`);
    console.log('Known companies:', knownCompanies);
    
    // If we have actual companies, use only those
    if (knownCompanies.length > 0) {
      const searchResult = CompanySearchService.searchCompany(query, knownCompanies);
      return searchResult.suggestions.slice(0, 8);
    }
    
    // Fallback: Only show CK Delta specific suggestions if no companies in DB
    const fallbackSuggestions = [];
    if (query.toLowerCase().includes('ck') || query.toLowerCase().includes('delta')) {
      fallbackSuggestions.push('ckdelta', 'ck delta', 'ck-delta');
    }
    
    return fallbackSuggestions.slice(0, 8);
  }
}

// Singleton instance
let unifiedIntelligenceService: UnifiedIntelligenceService | null = null;

export const getUnifiedIntelligenceService = (): UnifiedIntelligenceService => {
  if (!unifiedIntelligenceService) {
    unifiedIntelligenceService = new UnifiedIntelligenceService();
  }
  return unifiedIntelligenceService;
};

export default UnifiedIntelligenceService;