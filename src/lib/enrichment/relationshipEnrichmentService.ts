/**
 * Relationship Enrichment Service
 * Bridges Apollo's flat employee data with Apify's rich relationship data
 * Addresses the architectural gap identified between discovery and relationship mapping
 */

import { createApifyService, CompanyNetworkData, LinkedInProfile } from '@/lib/apify/apifyService';
import { getApolloStorageService } from '@/lib/apollo/apolloStorageService';

export interface EnrichedEmployee {
  // Apollo base data
  name: string;
  title: string;
  company: string;
  linkedin_url?: string;
  seniority?: string;
  departments?: string[];
  
  // Apify enrichment data
  linkedInProfile?: LinkedInProfile;
  relationships: Array<{
    targetName: string;
    targetProfileUrl: string;
    relationshipType: 'recommendation' | 'colleague' | 'mutual_connection' | 'external_influence';
    strength: number;
    context: string;
  }>;
  socialIntelligence: {
    recentActivity: number;
    buyingSignals: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    influenceScore: number;
  };
}

export interface EnrichedCompanyNetwork {
  companyName: string;
  apolloBaseData: {
    employeeCount: number;
    lastCrawled: string;
    departments: Record<string, number>;
  };
  enrichedEmployees: EnrichedEmployee[];
  networkAnalysis: {
    totalRelationships: number;
    internalConnections: number;
    externalInfluencers: number;
    averageInfluenceScore: number;
    networkDensity: number;
    keyConnectors: Array<{
      name: string;
      connectionCount: number;
      influenceScore: number;
    }>;
  };
  socialIntelligence: {
    sentiment: 'positive' | 'neutral' | 'negative';
    buyingSignals: Array<{
      signal: string;
      source: string;
      confidence: number;
      date: string;
    }>;
    decisionMakerActivity: Array<{
      name: string;
      title: string;
      recentActivity: string;
      buyingSignals: string[];
    }>;
  };
  lastEnriched: string;
}

export class RelationshipEnrichmentService {
  private apifyService = createApifyService();
  private apolloStorage = getApolloStorageService();

  /**
   * Enrich company network with relationship data
   */
  async enrichCompanyNetwork(
    companyName: string, 
    options: {
      forceRefresh?: boolean;
      maxEmployeesToEnrich?: number;
      prioritizeDecisionMakers?: boolean;
    } = {}
  ): Promise<EnrichedCompanyNetwork> {
    
    console.log(`🔗 Enriching company network for: ${companyName}`);

    // Step 1: Get Apollo base data
    const apolloData = await this.apolloStorage.getCompanyProfiles(companyName);
    
    if (!apolloData.profiles || apolloData.profiles.length === 0) {
      throw new Error(`No Apollo data found for ${companyName}. Run Apollo enrichment first.`);
    }

    console.log(`📊 Found ${apolloData.profiles.length} employees from Apollo`);

    // Step 2: Check existing enrichment cache
    if (!options.forceRefresh) {
      const cached = await this.getCachedEnrichment(companyName);
      if (cached && this.isEnrichmentFresh(cached)) {
        console.log(`💾 Using cached enrichment for ${companyName}`);
        return cached;
      }
    }

    // Step 3: Select employees to enrich (prioritize decision makers)
    const employeesToEnrich = this.selectEmployeesForEnrichment(
      apolloData.profiles,
      options
    );

    console.log(`🎯 Selected ${employeesToEnrich.length} employees for relationship enrichment`);

    // Step 4: Get relationship data from Apify
    let networkData: CompanyNetworkData | null = null;
    
    if (this.apifyService) {
      try {
        networkData = await this.apifyService.enrichEmployeeRelationships(employeesToEnrich);
        console.log(`🕷️ Apify enrichment completed for ${networkData.employees.length} profiles`);
      } catch (error) {
        console.error('Apify enrichment failed:', error);
        // Continue with partial enrichment using Apollo data only
      }
    } else {
      console.warn('⚠️ Apify service not available, using Apollo data only');
    }

    // Step 5: Merge Apollo and Apify data
    const enrichedNetwork = await this.mergeApolloAndApifyData(
      companyName,
      apolloData,
      networkData
    );

    // Step 6: Cache the enriched data
    await this.cacheEnrichedNetwork(enrichedNetwork);

    return enrichedNetwork;
  }

  /**
   * Select which employees to enrich based on priority
   */
  private selectEmployeesForEnrichment(
    apolloProfiles: any[],
    options: {
      maxEmployeesToEnrich?: number;
      prioritizeDecisionMakers?: boolean;
    }
  ): any[] {
    const maxToEnrich = options.maxEmployeesToEnrich || 25;
    
    // Filter profiles with LinkedIn URLs
    const profilesWithLinkedIn = apolloProfiles.filter(profile => profile.linkedin_url);
    
    if (profilesWithLinkedIn.length === 0) {
      console.warn('⚠️ No LinkedIn URLs found in Apollo data');
      return [];
    }

    // Sort by priority
    let sortedProfiles = [...profilesWithLinkedIn];
    
    if (options.prioritizeDecisionMakers !== false) {
      sortedProfiles.sort((a, b) => {
        // Decision makers first
        const aIsDecisionMaker = ['c_suite', 'vp', 'director'].includes(a.seniority);
        const bIsDecisionMaker = ['c_suite', 'vp', 'director'].includes(b.seniority);
        
        if (aIsDecisionMaker && !bIsDecisionMaker) return -1;
        if (!aIsDecisionMaker && bIsDecisionMaker) return 1;
        
        // Then by seniority level
        const seniorityOrder = ['c_suite', 'vp', 'director', 'manager', 'senior', 'entry'];
        const aIndex = seniorityOrder.indexOf(a.seniority) || 999;
        const bIndex = seniorityOrder.indexOf(b.seniority) || 999;
        
        return aIndex - bIndex;
      });
    }

    return sortedProfiles.slice(0, maxToEnrich);
  }

  /**
   * Merge Apollo base data with Apify relationship data
   */
  private async mergeApolloAndApifyData(
    companyName: string,
    apolloData: any,
    apifyData: CompanyNetworkData | null
  ): Promise<EnrichedCompanyNetwork> {
    
    const enrichedEmployees: EnrichedEmployee[] = [];

    // Process each Apollo employee
    for (const apolloEmployee of apolloData.profiles) {
      const apifyProfile = apifyData?.employees.find(emp => 
        emp.profileUrl === apolloEmployee.linkedin_url ||
        emp.name.toLowerCase() === apolloEmployee.name.toLowerCase()
      );

      const relationships = this.buildEmployeeRelationships(
        apolloEmployee,
        apifyProfile,
        apifyData
      );

      const socialIntelligence = this.analyzeSocialIntelligence(apifyProfile);

      enrichedEmployees.push({
        // Apollo base data
        name: apolloEmployee.name,
        title: apolloEmployee.title,
        company: apolloEmployee.company || companyName,
        linkedin_url: apolloEmployee.linkedin_url,
        seniority: apolloEmployee.seniority,
        departments: apolloEmployee.departments,
        
        // Apify enrichment
        linkedInProfile: apifyProfile,
        relationships,
        socialIntelligence
      });
    }

    // Analyze network structure
    const networkAnalysis = this.analyzeNetworkStructure(enrichedEmployees, apifyData);
    
    // Aggregate social intelligence
    const aggregatedSocialIntelligence = this.aggregateSocialIntelligence(enrichedEmployees, apifyData);

    return {
      companyName,
      apolloBaseData: {
        employeeCount: apolloData.profiles.length,
        lastCrawled: apolloData.lastCrawled?.toISOString() || new Date().toISOString(),
        departments: apolloData.profiles.reduce((acc: Record<string, number>, emp: any) => {
          (emp.departments || []).forEach((dept: string) => {
            acc[dept] = (acc[dept] || 0) + 1;
          });
          return acc;
        }, {})
      },
      enrichedEmployees,
      networkAnalysis,
      socialIntelligence: aggregatedSocialIntelligence,
      lastEnriched: new Date().toISOString()
    };
  }

  /**
   * Build relationship map for individual employee
   */
  private buildEmployeeRelationships(
    apolloEmployee: any,
    apifyProfile: LinkedInProfile | undefined,
    networkData: CompanyNetworkData | null
  ): Array<{
    targetName: string;
    targetProfileUrl: string;
    relationshipType: 'recommendation' | 'colleague' | 'mutual_connection' | 'external_influence';
    strength: number;
    context: string;
  }> {
    const relationships: any[] = [];

    if (!apifyProfile || !networkData) {
      return relationships;
    }

    // Internal connections (like Phil Agathangelou's recommendations)
    const internalConnections = networkData.internalConnections.filter(conn => 
      conn.from === apifyProfile.profileUrl || conn.to === apifyProfile.profileUrl
    );

    internalConnections.forEach(conn => {
      const isSource = conn.from === apifyProfile.profileUrl;
      const targetProfile = networkData.employees.find(emp => 
        emp.profileUrl === (isSource ? conn.to : conn.from)
      );

      if (targetProfile) {
        relationships.push({
          targetName: targetProfile.name,
          targetProfileUrl: targetProfile.profileUrl,
          relationshipType: conn.relationshipType,
          strength: conn.strength,
          context: `Internal ${conn.relationshipType} within ${networkData.companyName}`
        });
      }
    });

    // Direct recommendations from profile
    apifyProfile.recommendations.forEach(rec => {
      relationships.push({
        targetName: rec.recommenderName,
        targetProfileUrl: rec.recommenderProfile,
        relationshipType: 'recommendation',
        strength: 0.9,
        context: rec.recommendationText
      });
    });

    // High-value mutual connections
    apifyProfile.connections
      .filter(conn => conn.mutualConnections > 10)
      .slice(0, 5) // Top 5 high-value connections
      .forEach(conn => {
        relationships.push({
          targetName: conn.name,
          targetProfileUrl: conn.profileUrl,
          relationshipType: 'mutual_connection',
          strength: Math.min(conn.mutualConnections / 50, 0.8),
          context: `${conn.mutualConnections} mutual connections at ${conn.currentCompany || 'Various companies'}`
        });
      });

    return relationships;
  }

  /**
   * Analyze individual employee social intelligence
   */
  private analyzeSocialIntelligence(profile: LinkedInProfile | undefined) {
    if (!profile) {
      return {
        recentActivity: 0,
        buyingSignals: [],
        sentiment: 'neutral' as const,
        influenceScore: 0
      };
    }

    const buyingSignals = profile.recentActivity.flatMap(activity => activity.buyingSignals || []);
    
    // Calculate influence score based on activity engagement
    const totalEngagement = profile.recentActivity.reduce((sum, activity) => 
      sum + activity.engagement.likes + activity.engagement.comments + activity.engagement.shares, 0
    );
    
    const influenceScore = Math.min(
      (totalEngagement / Math.max(profile.recentActivity.length, 1)) / 100, 
      1.0
    );

    // Simple sentiment from activity
    const positiveWords = ['excited', 'great', 'excellent', 'love', 'amazing'];
    const negativeWords = ['disappointed', 'concerned', 'challenging', 'difficult'];
    
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    const allContent = profile.recentActivity.map(a => a.content).join(' ').toLowerCase();
    
    const positiveCount = positiveWords.filter(word => allContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => allContent.includes(word)).length;
    
    if (positiveCount > negativeCount) sentiment = 'positive';
    else if (negativeCount > positiveCount) sentiment = 'negative';

    return {
      recentActivity: profile.recentActivity.length,
      buyingSignals,
      sentiment,
      influenceScore
    };
  }

  /**
   * Analyze overall network structure
   */
  private analyzeNetworkStructure(
    enrichedEmployees: EnrichedEmployee[],
    apifyData: CompanyNetworkData | null
  ) {
    const totalRelationships = enrichedEmployees.reduce((sum, emp) => 
      sum + emp.relationships.length, 0
    );

    const internalConnections = apifyData?.internalConnections.length || 0;
    const externalInfluencers = apifyData?.externalInfluencers.length || 0;

    const averageInfluenceScore = enrichedEmployees.reduce((sum, emp) => 
      sum + emp.socialIntelligence.influenceScore, 0
    ) / Math.max(enrichedEmployees.length, 1);

    // Network density = actual connections / possible connections
    const possibleConnections = enrichedEmployees.length * (enrichedEmployees.length - 1) / 2;
    const networkDensity = possibleConnections > 0 ? internalConnections / possibleConnections : 0;

    // Key connectors = employees with most relationships
    const keyConnectors = enrichedEmployees
      .map(emp => ({
        name: emp.name,
        connectionCount: emp.relationships.length,
        influenceScore: emp.socialIntelligence.influenceScore
      }))
      .sort((a, b) => b.connectionCount - a.connectionCount)
      .slice(0, 5);

    return {
      totalRelationships,
      internalConnections,
      externalInfluencers,
      averageInfluenceScore,
      networkDensity,
      keyConnectors
    };
  }

  /**
   * Aggregate social intelligence across company
   */
  private aggregateSocialIntelligence(
    enrichedEmployees: EnrichedEmployee[],
    apifyData: CompanyNetworkData | null
  ) {
    const allBuyingSignals = enrichedEmployees.flatMap(emp => 
      emp.socialIntelligence.buyingSignals.map(signal => ({
        signal,
        source: emp.name,
        confidence: 0.7,
        date: new Date().toISOString()
      }))
    );

    // Overall sentiment
    const sentiments = enrichedEmployees.map(emp => emp.socialIntelligence.sentiment);
    const positiveCount = sentiments.filter(s => s === 'positive').length;
    const negativeCount = sentiments.filter(s => s === 'negative').length;
    
    const overallSentiment = positiveCount > negativeCount ? 'positive' :
                           negativeCount > positiveCount ? 'negative' : 'neutral';

    // Decision maker activity
    const decisionMakerActivity = enrichedEmployees
      .filter(emp => ['c_suite', 'vp', 'director'].includes(emp.seniority || ''))
      .map(emp => ({
        name: emp.name,
        title: emp.title,
        recentActivity: emp.linkedInProfile?.recentActivity[0]?.content || 'No recent activity',
        buyingSignals: emp.socialIntelligence.buyingSignals
      }));

    return {
      sentiment: overallSentiment as 'positive' | 'neutral' | 'negative',
      buyingSignals: allBuyingSignals,
      decisionMakerActivity
    };
  }

  /**
   * Cache enriched network data
   */
  private async cacheEnrichedNetwork(enrichedNetwork: EnrichedCompanyNetwork): Promise<void> {
    // TODO: Implement caching in Neon.tech database
    // For now, store in memory or log for debugging
    console.log(`💾 Caching enriched network for ${enrichedNetwork.companyName}`);
  }

  /**
   * Get cached enrichment if available
   */
  private async getCachedEnrichment(companyName: string): Promise<EnrichedCompanyNetwork | null> {
    // TODO: Implement cache retrieval from database
    return null;
  }

  /**
   * Check if enrichment is still fresh (within 7 days)
   */
  private isEnrichmentFresh(enrichedNetwork: EnrichedCompanyNetwork): boolean {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const lastEnriched = new Date(enrichedNetwork.lastEnriched);
    return lastEnriched > oneWeekAgo;
  }
}

// Singleton instance
let relationshipEnrichmentService: RelationshipEnrichmentService | null = null;

export const getRelationshipEnrichmentService = (): RelationshipEnrichmentService => {
  if (!relationshipEnrichmentService) {
    relationshipEnrichmentService = new RelationshipEnrichmentService();
  }
  return relationshipEnrichmentService;
};

export default RelationshipEnrichmentService;