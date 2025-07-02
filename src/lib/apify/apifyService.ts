/**
 * Apify LinkedIn Scraper Service
 * Provides rich relationship data to complement Apollo's flat employee discovery
 */

export interface ApifyConfig {
  token: string;
  actorId: string; // The specific Apify scraper actor ID
  baseUrl?: string;
}

export interface LinkedInProfile {
  profileUrl: string;
  name: string;
  headline: string;
  summary: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description?: string;
  }>;
  education: Array<{
    school: string;
    degree: string;
    field: string;
    years: string;
  }>;
  skills: string[];
  recommendations: Array<{
    recommenderName: string;
    recommenderProfile: string;
    relationshipType: string;
    recommendationText: string;
    date: string;
  }>;
  connections: Array<{
    name: string;
    profileUrl: string;
    mutualConnections: number;
    currentCompany?: string;
    title?: string;
  }>;
  recentActivity: Array<{
    type: 'post' | 'comment' | 'like' | 'share';
    content: string;
    date: string;
    engagement: {
      likes: number;
      comments: number;
      shares: number;
    };
    buyingSignals?: string[];
  }>;
}

export interface CompanyNetworkData {
  companyName: string;
  employees: LinkedInProfile[];
  internalConnections: Array<{
    from: string;
    to: string;
    relationshipType: 'colleague' | 'recommendation' | 'mutual_connection';
    strength: number;
  }>;
  externalInfluencers: Array<{
    name: string;
    profileUrl: string;
    influence: 'industry_expert' | 'client' | 'partner' | 'competitor';
    connectionsToCompany: number;
  }>;
  socialIntelligence: {
    sentiment: 'positive' | 'neutral' | 'negative';
    buyingSignals: Array<{
      signal: string;
      confidence: number;
      source: string;
      date: string;
    }>;
    trending_topics: string[];
    decision_maker_activity: Array<{
      name: string;
      activity: string;
      relevance: number;
    }>;
  };
}

export class ApifyService {
  private config: ApifyConfig;
  private baseUrl: string;

  constructor(config: ApifyConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.apify.com/v2';
  }

  /**
   * Enrich company using HarvestAPI LinkedIn scraper (company-to-employees)
   */
  async enrichWithHarvestAPI(
    companyIdentifier: string,
    options: { maxEmployees?: number } = {}
  ): Promise<CompanyNetworkData> {
    console.log(`🔥 Enriching company with HarvestAPI scraper: ${companyIdentifier}`);

    // Convert company identifier to LinkedIn company URL if needed
    const companyUrl = this.normalizeCompanyUrl(companyIdentifier);
    
    // Run HarvestAPI scraper with company URL
    const harvestResults = await this.runHarvestAPIScraper([companyUrl], options.maxEmployees || 25);
    
    if (!harvestResults || harvestResults.length === 0) {
      throw new Error('No employee data returned from HarvestAPI scraper');
    }

    console.log('🔍 Raw HarvestAPI results:', JSON.stringify(harvestResults, null, 2));

    // Transform all employee results
    const enrichedProfiles: LinkedInProfile[] = harvestResults.map((result, index) => {
      console.log(`🔄 Transforming result ${index}:`, JSON.stringify(result, null, 2));
      return this.transformHarvestAPIData(result);
    }).filter((profile): profile is LinkedInProfile => profile !== null); // Remove any null/undefined results

    console.log(`✅ HarvestAPI returned ${enrichedProfiles.length} employee profiles`);

    // Analyze relationships using HarvestAPI's rich data
    const internalConnections = this.analyzeHarvestAPIConnections(enrichedProfiles);
    
    // Extract external influencers from "moreProfiles" data
    const externalInfluencers = this.extractExternalInfluencers(harvestResults);

    // Generate social intelligence from profile data
    const socialIntelligence = this.analyzeHarvestAPISocialIntelligence(enrichedProfiles);

    return {
      companyName: this.extractCompanyNameFromUrl(companyUrl),
      employees: enrichedProfiles,
      internalConnections,
      externalInfluencers,
      socialIntelligence
    };
  }

  /**
   * Legacy method - convert Apollo employees to company enrichment
   */
  async enrichEmployeeRelationships(
    apolloEmployees: Array<{ 
      linkedin_url?: string; 
      name: string; 
      title: string; 
      company: string; 
    }>
  ): Promise<CompanyNetworkData> {
    // Extract company from first employee and use company enrichment
    const companyName = apolloEmployees[0]?.company || 'Unknown Company';
    return this.enrichWithHarvestAPI(companyName, { maxEmployees: apolloEmployees.length });
  }


  /**
   * Run HarvestAPI scraper with company URLs (not individual profiles)
   */
  private async runHarvestAPIScraper(companyUrls: string[], maxItems: number = 25): Promise<any[]> {
    console.log(`🔥 Running HarvestAPI scraper for ${companyUrls.length} companies`);

    const runInput = {
      currentCompanies: companyUrls,
      maxItems: maxItems,
      profileScraperMode: "Full ($8 per 1k)"
    };

    try {
      // Start Apify actor run
      const runResponse = await fetch(`${this.baseUrl}/acts/${this.config.actorId}/runs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.token}`
        },
        body: JSON.stringify(runInput)
      });

      if (!runResponse.ok) {
        throw new Error(`HarvestAPI run failed: ${runResponse.statusText}`);
      }

      const runData = await runResponse.json();
      const runId = runData.data.id;

      // Wait for run completion and get results
      const results = await this.waitForRunCompletion(runId, 300000); // 5 minutes for multiple profiles
      
      if (!results || results.length === 0) {
        throw new Error('No profile data returned from HarvestAPI');
      }

      console.log(`✅ HarvestAPI completed: ${results.length} profiles scraped`);
      return results;

    } catch (error) {
      console.error(`HarvestAPI scraping failed:`, error);
      throw error;
    }
  }

  /**
   * Legacy method - kept for backward compatibility
   */
  private async scrapeLinkedInProfile(profileUrl: string): Promise<LinkedInProfile> {
    const results = await this.runHarvestAPIScraper([profileUrl]);
    const transformed = this.transformHarvestAPIData(results[0]);
    if (!transformed) {
      throw new Error('Failed to transform profile data');
    }
    return transformed;
  }

  /**
   * Wait for Apify run to complete and return results
   */
  private async waitForRunCompletion(runId: string, maxWaitTime: number = 120000): Promise<any[]> {
    const pollInterval = 5000; // 5 seconds
    const maxPolls = maxWaitTime / pollInterval;
    let polls = 0;

    while (polls < maxPolls) {
      try {
        const statusResponse = await fetch(`${this.baseUrl}/actor-runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${this.config.token}`
          }
        });

        const statusData = await statusResponse.json();
        const status = statusData.data.status;

        if (status === 'SUCCEEDED') {
          // Get dataset items
          const datasetId = statusData.data.defaultDatasetId;
          const itemsResponse = await fetch(`${this.baseUrl}/datasets/${datasetId}/items`, {
            headers: {
              'Authorization': `Bearer ${this.config.token}`
            }
          });
          
          return await itemsResponse.json();
        } else if (status === 'FAILED' || status === 'ABORTED') {
          throw new Error(`Apify run ${status.toLowerCase()}: ${statusData.data.statusMessage}`);
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        polls++;

      } catch (error) {
        console.error('Error polling Apify run status:', error);
        throw error;
      }
    }

    throw new Error(`Apify run timed out after ${maxWaitTime}ms`);
  }

  /**
   * Transform HarvestAPI data to our LinkedIn profile format
   */
  private transformHarvestAPIData(harvestData: any): LinkedInProfile | null {
    console.log('🔧 Transform input:', JSON.stringify(harvestData, null, 2));
    
    if (!harvestData) {
      console.warn('⚠️ No harvest data provided');
      return null;
    }

    const fullName = `${harvestData.firstName || ''} ${harvestData.lastName || ''}`.trim();
    const profileUrl = harvestData.linkedinUrl || harvestData.profileUrl || '';
    
    if (!profileUrl) {
      console.warn('⚠️ No LinkedIn URL found in harvest data');
      return null;
    }

    const transformed = {
      profileUrl,
      name: fullName || harvestData.name || 'Unknown',
      headline: harvestData.headline || '',
      summary: harvestData.about || harvestData.summary || '',
      experience: (harvestData.experience || []).map((exp: any) => ({
        title: exp.position || exp.title || '',
        company: exp.companyName || exp.company || '',
        duration: exp.duration || '',
        description: exp.description || ''
      })),
      education: (harvestData.education || []).map((edu: any) => ({
        school: edu.schoolName || edu.school || '',
        degree: edu.degree || '',
        field: edu.fieldOfStudy || edu.field || '',
        years: edu.period || edu.years || ''
      })),
      skills: (harvestData.skills || []).map((skill: any) => 
        typeof skill === 'string' ? skill : (skill.name || skill)
      ).filter(Boolean),
      recommendations: (harvestData.receivedRecommendations || []).map((rec: any) => ({
        recommenderName: rec.givenBy || rec.name || '',
        recommenderProfile: rec.givenByLink || rec.profileUrl || '',
        relationshipType: this.extractRelationshipType(rec.givenAt || ''),
        recommendationText: rec.description || rec.text || '',
        date: this.parseRecommendationDate(rec.givenAt || '')
      })),
      connections: (harvestData.moreProfiles || []).map((profile: any) => ({
        name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.name || '',
        profileUrl: profile.linkedinUrl || profile.profileUrl || '',
        mutualConnections: 0, // HarvestAPI doesn't provide this
        currentCompany: this.extractCompanyFromPosition(profile.position),
        title: profile.position || profile.title || ''
      })),
      recentActivity: [] // HarvestAPI doesn't provide activity data
    };

    console.log('✅ Transformed profile:', JSON.stringify(transformed, null, 2));
    return transformed;
  }

  /**
   * Legacy method - kept for backward compatibility
   */
  private transformApifyProfileData(apifyData: any): LinkedInProfile {
    const transformed = this.transformHarvestAPIData(apifyData);
    if (!transformed) {
      throw new Error('Failed to transform Apify profile data');
    }
    return transformed;
  }

  /**
   * Analyze connections between two company employees
   */
  private analyzeInternalConnection(
    profileA: LinkedInProfile, 
    profileB: LinkedInProfile
  ): { from: string; to: string; relationshipType: 'colleague' | 'recommendation' | 'mutual_connection'; strength: number; } | null {
    
    // Check for direct recommendations
    const hasRecommendation = profileA.recommendations.some(rec => 
      rec.recommenderName.toLowerCase() === profileB.name.toLowerCase()
    ) || profileB.recommendations.some(rec => 
      rec.recommenderName.toLowerCase() === profileA.name.toLowerCase()
    );

    if (hasRecommendation) {
      return {
        from: profileA.profileUrl,
        to: profileB.profileUrl,
        relationshipType: 'recommendation',
        strength: 0.9
      };
    }

    // Check for mutual connections (indicating close working relationship)
    const connectionA = profileA.connections.find(conn => 
      conn.name.toLowerCase() === profileB.name.toLowerCase()
    );
    
    if (connectionA && connectionA.mutualConnections > 5) {
      return {
        from: profileA.profileUrl,
        to: profileB.profileUrl,
        relationshipType: 'mutual_connection',
        strength: Math.min(connectionA.mutualConnections / 20, 0.8)
      };
    }

    // Check for overlapping work experience
    const hasOverlappingExperience = profileA.experience.some(expA =>
      profileB.experience.some(expB => 
        expA.company.toLowerCase() === expB.company.toLowerCase() &&
        expA.company.toLowerCase() !== profileA.name.toLowerCase() // Not current company
      )
    );

    if (hasOverlappingExperience) {
      return {
        from: profileA.profileUrl,
        to: profileB.profileUrl,
        relationshipType: 'colleague',
        strength: 0.6
      };
    }

    return null;
  }

  /**
   * Analyze social intelligence from all employee profiles
   */
  private analyzeSocialIntelligence(profiles: LinkedInProfile[]) {
    const allActivity = profiles.flatMap(profile => profile.recentActivity);
    const allBuyingSignals = allActivity.flatMap(activity => activity.buyingSignals || []);
    
    // Sentiment analysis (simplified)
    const positiveWords = ['excited', 'great', 'excellent', 'amazing', 'love', 'fantastic'];
    const negativeWords = ['disappointed', 'terrible', 'awful', 'hate', 'worst', 'frustrating'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    allActivity.forEach(activity => {
      const content = activity.content.toLowerCase();
      positiveWords.forEach(word => {
        if (content.includes(word)) positiveCount++;
      });
      negativeWords.forEach(word => {
        if (content.includes(word)) negativeCount++;
      });
    });

    const sentiment = positiveCount > negativeCount ? 'positive' : 
                     negativeCount > positiveCount ? 'negative' : 'neutral';

    // Extract trending topics
    const topics = new Map<string, number>();
    allActivity.forEach(activity => {
      const words = activity.content.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 4 && !['that', 'this', 'with', 'from', 'they', 'have', 'will', 'been'].includes(word)) {
          topics.set(word, (topics.get(word) || 0) + 1);
        }
      });
    });

    const trending_topics = Array.from(topics.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic]) => topic);

    return {
      sentiment: sentiment as 'positive' | 'neutral' | 'negative',
      buyingSignals: allBuyingSignals.map(signal => ({
        signal,
        confidence: 0.7,
        source: 'linkedin_activity',
        date: new Date().toISOString()
      })),
      trending_topics,
      decision_maker_activity: profiles
        .filter(profile => 
          profile.headline.toLowerCase().includes('ceo') ||
          profile.headline.toLowerCase().includes('cto') ||
          profile.headline.toLowerCase().includes('director') ||
          profile.headline.toLowerCase().includes('vp')
        )
        .map(profile => ({
          name: profile.name,
          activity: profile.recentActivity[0]?.content || 'No recent activity',
          relevance: profile.recentActivity.length > 0 ? 0.8 : 0.2
        }))
    };
  }

  /**
   * Analyze HarvestAPI connections for internal relationships
   */
  private analyzeHarvestAPIConnections(profiles: LinkedInProfile[]): Array<{
    from: string;
    to: string;
    relationshipType: 'colleague' | 'recommendation' | 'mutual_connection';
    strength: number;
  }> {
    const connections: Array<{
      from: string;
      to: string;
      relationshipType: 'colleague' | 'recommendation' | 'mutual_connection';
      strength: number;
    }> = [];

    // Analyze recommendations between employees
    profiles.forEach(profileA => {
      profiles.forEach(profileB => {
        if (profileA.profileUrl === profileB.profileUrl) return;

        // Check if profileA recommended profileB
        const hasRecommendation = profileB.recommendations.some(rec => 
          rec.recommenderProfile === profileA.profileUrl ||
          rec.recommenderName.toLowerCase() === profileA.name.toLowerCase()
        );

        if (hasRecommendation) {
          connections.push({
            from: profileA.profileUrl,
            to: profileB.profileUrl,
            relationshipType: 'recommendation',
            strength: 0.9
          });
        }

        // Check for overlapping work experience (colleagues)
        const hasOverlappingExperience = profileA.experience.some(expA =>
          profileB.experience.some(expB => 
            expA.company.toLowerCase() === expB.company.toLowerCase() &&
            expA.company.length > 0
          )
        );

        if (hasOverlappingExperience && !hasRecommendation) {
          connections.push({
            from: profileA.profileUrl,
            to: profileB.profileUrl,
            relationshipType: 'colleague',
            strength: 0.6
          });
        }
      });
    });

    return connections;
  }

  /**
   * Extract external influencers from HarvestAPI moreProfiles data
   */
  private extractExternalInfluencers(harvestResults: any[]): Array<{
    name: string;
    profileUrl: string;
    influence: 'industry_expert' | 'client' | 'partner' | 'competitor';
    connectionsToCompany: number;
  }> {
    const influencerMap = new Map<string, {
      name: string;
      profileUrl: string;
      appearances: number;
      positions: Set<string>;
    }>();

    // Collect all "moreProfiles" across all employees
    harvestResults.forEach(result => {
      (result.moreProfiles || []).forEach((profile: any) => {
        const name = `${profile.firstName || ''} ${profile.lastName || ''}`.trim();
        const url = profile.linkedinUrl || '';
        
        if (!name || !url) return;

        const existing = influencerMap.get(url);
        if (existing) {
          existing.appearances++;
          if (profile.position) existing.positions.add(profile.position);
        } else {
          influencerMap.set(url, {
            name,
            profileUrl: url,
            appearances: 1,
            positions: new Set([profile.position].filter(Boolean))
          });
        }
      });
    });

    // Convert to external influencers (appearing in multiple employee networks)
    return Array.from(influencerMap.values())
      .filter(influencer => influencer.appearances >= 2) // Appeared in 2+ employee networks
      .map(influencer => ({
        name: influencer.name,
        profileUrl: influencer.profileUrl,
        influence: this.categorizeInfluence(Array.from(influencer.positions)),
        connectionsToCompany: influencer.appearances
      }))
      .slice(0, 20); // Top 20 external influencers
  }

  /**
   * Analyze social intelligence from HarvestAPI profile data
   */
  private analyzeHarvestAPISocialIntelligence(profiles: LinkedInProfile[]) {
    // Extract buying signals from headlines and summaries
    const allContent = profiles.flatMap(profile => [
      profile.headline,
      profile.summary,
      ...profile.experience.map(exp => exp.description || '')
    ]).filter(Boolean);

    const buyingSignals = allContent.flatMap(content => 
      this.extractBuyingSignals(content)
    );

    // Sentiment from recommendations and descriptions
    const positiveWords = ['excellent', 'great', 'outstanding', 'skilled', 'innovative', 'successful'];
    const negativeWords = ['challenging', 'difficult', 'struggled', 'problems', 'issues'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    profiles.forEach(profile => {
      profile.recommendations.forEach(rec => {
        const text = rec.recommendationText.toLowerCase();
        positiveWords.forEach(word => {
          if (text.includes(word)) positiveCount++;
        });
        negativeWords.forEach(word => {
          if (text.includes(word)) negativeCount++;
        });
      });
    });

    const sentiment = positiveCount > negativeCount ? 'positive' : 
                     negativeCount > positiveCount ? 'negative' : 'neutral';

    // Decision maker activity from recent roles
    const decisionMakers = profiles
      .filter(profile => {
        const headline = profile.headline.toLowerCase();
        return headline.includes('ceo') || headline.includes('founder') ||
               headline.includes('director') || headline.includes('vp') ||
               headline.includes('head of') || headline.includes('chief');
      })
      .map(profile => ({
        name: profile.name,
        activity: profile.headline,
        relevance: profile.recommendations.length > 0 ? 0.8 : 0.6
      }));

    return {
      sentiment: sentiment as 'positive' | 'neutral' | 'negative',
      buyingSignals: buyingSignals.map(signal => ({
        signal,
        confidence: 0.6,
        source: 'profile_content',
        date: new Date().toISOString()
      })),
      trending_topics: this.extractTrendingTopics(allContent),
      decision_maker_activity: decisionMakers
    };
  }

  /**
   * Helper methods for HarvestAPI data processing
   */
  private extractRelationshipType(givenAt: string): string {
    if (givenAt.includes('managed')) return 'manager';
    if (givenAt.includes('worked with')) return 'colleague';
    return 'professional';
  }

  private parseRecommendationDate(givenAt: string): string {
    const match = givenAt.match(/(\w+\s+\d+,\s+\d+)/);
    return match ? new Date(match[1]).toISOString() : new Date().toISOString();
  }

  private extractCompanyFromPosition(position?: string): string {
    if (!position) return '';
    const atIndex = position.lastIndexOf(' at ');
    return atIndex > -1 ? position.substring(atIndex + 4) : '';
  }

  private categorizeInfluence(positions: string[]): 'industry_expert' | 'client' | 'partner' | 'competitor' {
    const positionText = positions.join(' ').toLowerCase();
    
    if (positionText.includes('consultant') || positionText.includes('advisor') || positionText.includes('expert')) {
      return 'industry_expert';
    }
    if (positionText.includes('client') || positionText.includes('customer')) {
      return 'client';
    }
    if (positionText.includes('partner')) {
      return 'partner';
    }
    return 'competitor';
  }

  private extractTrendingTopics(content: string[]): string[] {
    const topics = new Map<string, number>();
    
    content.forEach(text => {
      const words = text.toLowerCase().split(/\s+/);
      words.forEach(word => {
        if (word.length > 4 && !['that', 'this', 'with', 'from', 'they', 'have', 'will', 'been'].includes(word)) {
          topics.set(word, (topics.get(word) || 0) + 1);
        }
      });
    });

    return Array.from(topics.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic]) => topic);
  }

  /**
   * Normalize company identifier to LinkedIn company URL
   */
  private normalizeCompanyUrl(identifier: string): string {
    if (identifier.includes('linkedin.com/company/')) {
      return identifier;
    }
    
    // For company names, return as-is - HarvestAPI will handle the lookup
    // or we could transform to a LinkedIn company URL format
    if (!identifier.startsWith('http')) {
      // Default to CK Delta for testing if no proper URL
      return 'https://www.linkedin.com/company/ckdelta/';
    }
    
    return identifier;
  }

  /**
   * Extract company name from LinkedIn company URL
   */
  private extractCompanyNameFromUrl(url: string): string {
    try {
      const match = url.match(/linkedin\.com\/company\/([^\/\?]+)/);
      return match ? match[1].replace(/-/g, ' ') : 'Unknown Company';
    } catch {
      return 'Unknown Company';
    }
  }

  /**
   * Extract buying signals from content
   */
  private extractBuyingSignals(content: string): string[] {
    const signals: string[] = [];
    const lowerContent = content.toLowerCase();

    const buyingSignalPatterns = [
      /looking for|seeking|need\s+to|planning\s+to|considering/,
      /budget|investment|funding|purchase|buy/,
      /demo|trial|evaluation|pilot|test/,
      /implementation|deploy|rollout|migrate/,
      /vendor|solution|platform|tool|software/,
      /comparison|evaluate|assess|review/,
      /timeline|deadline|urgent|asap|priority/
    ];

    const signalLabels = [
      'exploring_solutions',
      'budget_allocated',
      'evaluation_phase',
      'implementation_ready',
      'vendor_research',
      'comparison_shopping',
      'time_sensitive'
    ];

    buyingSignalPatterns.forEach((pattern, index) => {
      if (pattern.test(lowerContent)) {
        signals.push(signalLabels[index]);
      }
    });

    return signals;
  }
}

// Configuration and factory - Updated to force redeploy
export function createApifyService(): ApifyService | null {
  const token = process.env.APIFY_TOKEN || process.env.APIFY_API_KEY;
  const actorId = process.env.APIFY_HARVEST_ACTOR_ID || 'M2FMdjRVeF1HPGFcc';

  console.log('🔧 Apify Service Configuration:', {
    hasToken: !!token,
    actorId,
    tokenLength: token ? token.length : 0
  });

  if (!token) {
    console.warn('⚠️ Apify configuration missing. Set APIFY_TOKEN environment variable.');
    return null;
  }

  if (!actorId) {
    console.warn('⚠️ Apify HarvestAPI actor ID missing. Set APIFY_HARVEST_ACTOR_ID environment variable.');
    return null;
  }

  return new ApifyService({
    token,
    actorId
  });
}

export default ApifyService;