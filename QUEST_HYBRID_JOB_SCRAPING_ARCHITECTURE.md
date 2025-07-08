# Hybrid Job Scraping Architecture

## Overview

Quest's job discovery system combines structured scraping of standardized Applicant Tracking Systems (ATS) with real-time search capabilities. This hybrid approach provides comprehensive coverage of the startup job market while maintaining efficiency and compliance.

## The Problem with Traditional Job Aggregation

### Current Market Issues
- **Generic Aggregators**: Indeed, LinkedIn show stale or low-quality postings
- **Inefficient Scraping**: Scraping random company sites is resource-intensive
- **Maintenance Burden**: Custom parsers break when sites change
- **Legal Risks**: Many sites prohibit scraping in their terms of service
- **Poor Quality**: Inconsistent data formats and missing information

### Quest's Competitive Advantage
- **Direct Application URLs**: Bypass aggregators, apply directly to companies
- **Fresh Data**: Weekly updates from authoritative sources
- **Startup Focus**: Target high-growth companies using modern ATS
- **Standardized Data**: Consistent schema from structured sources
- **Quest-Aligned Matching**: Jobs matched to member quests and goals

## Hybrid Architecture

### Tier 1: Structured ATS Scraping (Primary)
**Target Platforms**: Greenhouse, Lever, Workable, BambooHR, Ashby, Personio
**Update Frequency**: Weekly batch processing
**Coverage**: 80% of startup jobs use these platforms

### Tier 2: Real-Time Search (Supplementary)
**Platforms**: Tavily API, Serper API for live searches
**Use Case**: Fill gaps, find newly posted jobs, company-specific searches
**Coverage**: Everything else, on-demand

### Tier 3: Network Intelligence (Future)
**Source**: Quest member companies and referrals
**Quality**: Highest - insider knowledge and direct connections
**Coverage**: Premium opportunities not publicly posted

## Tier 1: Structured ATS Scraping

### Target Platforms

#### Primary Targets (High Volume)
```typescript
interface ATSPlatforms {
  greenhouse: {
    company_count: 6000+
    jobs_per_week: 15000+
    api_availability: 'public_feeds'
    schema_consistency: 'excellent'
    startup_penetration: 'high'
  }
  
  lever: {
    company_count: 4000+
    jobs_per_week: 8000+
    api_availability: 'public_feeds'
    schema_consistency: 'excellent'
    startup_penetration: 'very_high'
  }
  
  workable: {
    company_count: 20000+
    jobs_per_week: 25000+
    api_availability: 'widget_feeds'
    schema_consistency: 'good'
    startup_penetration: 'medium'
  }
}
```

#### Secondary Targets (Specialized)
```typescript
interface SpecializedATS {
  ashby: {
    focus: 'engineering_heavy_startups'
    schema: 'excellent'
    volume: 'medium'
  }
  
  bamboohr: {
    focus: 'hr_centric_companies'
    schema: 'good'
    volume: 'medium'
  }
  
  personio: {
    focus: 'european_startups'
    schema: 'good'
    volume: 'growing'
  }
}
```

### Scraping Strategy

#### Discovery Process
```typescript
interface CompanyDiscovery {
  // Find companies using target ATS platforms
  greenhouse_discovery: {
    endpoint: 'https://boards.greenhouse.io/embed/job_board?for={company}'
    discovery_method: 'company_enumeration'
    rate_limit: '100_requests_per_minute'
  }
  
  lever_discovery: {
    endpoint: 'https://jobs.lever.co/{company}'
    discovery_method: 'known_company_list'
    rate_limit: '50_requests_per_minute'
  }
  
  workable_discovery: {
    endpoint: 'https://{company}.workable.com/jobs'
    discovery_method: 'subdomain_enumeration'
    rate_limit: '200_requests_per_minute'
  }
}
```

#### Data Extraction
```typescript
interface JobDataSchema {
  // Standardized fields across all ATS platforms
  id: string                    // Unique job identifier
  title: string                 // Job title
  company: {
    name: string
    logo_url?: string
    size?: string
    industry?: string
  }
  location: {
    city?: string
    country: string
    remote_ok: boolean
    timezone_requirements?: string[]
  }
  employment: {
    type: 'full_time' | 'part_time' | 'contract' | 'internship'
    experience_level: 'entry' | 'mid' | 'senior' | 'executive'
    salary_range?: {
      min: number
      max: number
      currency: string
      equity_mention: boolean
    }
  }
  requirements: {
    skills: string[]
    experience_years?: number
    education?: string
    visa_sponsorship: boolean
  }
  application: {
    direct_url: string          // The key advantage - direct application
    external_id: string         // ATS-specific ID
    posted_date: Date
    closing_date?: Date
  }
  meta: {
    source_platform: 'greenhouse' | 'lever' | 'workable' | etc
    last_updated: Date
    quest_relevance_score?: number
  }
}
```

### Implementation Architecture

#### Scraping Service
```typescript
class ATSScrapingService {
  private platforms: ATSPlatform[]
  private rateLimiter: RateLimiter
  private dataValidator: JobDataValidator
  
  async scrapeAllPlatforms(): Promise<JobData[]> {
    const jobs = []
    
    for (const platform of this.platforms) {
      try {
        const platformJobs = await this.scrapePlatform(platform)
        jobs.push(...platformJobs)
      } catch (error) {
        this.logger.error(`Failed to scrape ${platform.name}`, error)
        // Continue with other platforms
      }
    }
    
    return this.deduplicateJobs(jobs)
  }
  
  private async scrapePlatform(platform: ATSPlatform): Promise<JobData[]> {
    const companies = await this.discoverCompanies(platform)
    const jobs = []
    
    for (const company of companies) {
      await this.rateLimiter.waitForSlot(platform.name)
      
      try {
        const companyJobs = await this.scrapeCompanyJobs(platform, company)
        jobs.push(...companyJobs)
      } catch (error) {
        this.logger.warn(`Failed to scrape ${company} on ${platform.name}`, error)
      }
    }
    
    return jobs
  }
}
```

#### Data Processing Pipeline
```typescript
class JobProcessingPipeline {
  async processJobs(rawJobs: RawJobData[]): Promise<ProcessedJob[]> {
    return rawJobs
      .map(job => this.normalizeData(job))
      .filter(job => this.isValidJob(job))
      .map(job => this.enrichJob(job))
      .filter(job => this.isStartupJob(job))
      .map(job => this.calculateQuestRelevance(job))
  }
  
  private normalizeData(job: RawJobData): JobData {
    // Convert different ATS formats to standard schema
    return {
      id: this.generateUniqueId(job),
      title: this.cleanTitle(job.title),
      company: this.normalizeCompany(job.company),
      location: this.normalizeLocation(job.location),
      employment: this.normalizeEmployment(job),
      requirements: this.extractRequirements(job.description),
      application: {
        direct_url: job.apply_url,
        external_id: job.ats_id,
        posted_date: new Date(job.posted),
        closing_date: job.deadline ? new Date(job.deadline) : undefined
      },
      meta: {
        source_platform: job.platform,
        last_updated: new Date(),
        quest_relevance_score: 0  // Calculated later
      }
    }
  }
  
  private calculateQuestRelevance(job: JobData): JobData {
    // Match job to common quest patterns
    const questKeywords = {
      'ai_ml_engineer': ['ai', 'machine learning', 'ml', 'data science'],
      'startup_cto': ['cto', 'technical lead', 'engineering manager'],
      'product_manager': ['product manager', 'pm', 'product owner'],
      'climate_tech': ['climate', 'sustainability', 'clean energy', 'carbon']
    }
    
    // Calculate relevance score
    job.meta.quest_relevance_score = this.scoreQuestAlignment(job, questKeywords)
    return job
  }
}
```

## Tier 2: Real-Time Search Integration

### Search API Integration
```typescript
interface SearchAPIs {
  tavily: {
    strength: 'comprehensive_web_search'
    use_case: 'find_newly_posted_jobs'
    rate_limit: '1000_requests_per_day'
    cost: '$0.001_per_request'
  }
  
  serper: {
    strength: 'google_search_api'
    use_case: 'company_specific_searches'
    rate_limit: '2500_requests_per_day'
    cost: '$0.002_per_request'
  }
}
```

### Real-Time Search Triggers
```typescript
class RealTimeJobSearch {
  async searchForUser(userQuest: string, location?: string): Promise<JobData[]> {
    const searchQueries = this.generateSearchQueries(userQuest, location)
    const results = []
    
    for (const query of searchQueries) {
      try {
        const searchResults = await this.tavilyAPI.search({
          query: query,
          include_domains: this.getJobBoardDomains(),
          search_depth: 'advanced'
        })
        
        const parsedJobs = await this.parseSearchResults(searchResults)
        results.push(...parsedJobs)
      } catch (error) {
        this.logger.error('Search API error', error)
      }
    }
    
    return this.deduplicateWithDatabase(results)
  }
  
  private generateSearchQueries(quest: string, location?: string): string[] {
    const questKeywords = this.extractKeywords(quest)
    const locationClause = location ? `in ${location}` : ''
    
    return [
      `${questKeywords.join(' ')} jobs ${locationClause} site:greenhouse.io`,
      `${questKeywords.join(' ')} careers ${locationClause} site:lever.co`,
      `${questKeywords.join(' ')} hiring ${locationClause} startup`,
      `"${questKeywords[0]}" opportunities ${locationClause} 2024`
    ]
  }
}
```

## Database Design

### Job Storage Schema
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id VARCHAR(255) NOT NULL,
  source_platform VARCHAR(50) NOT NULL,
  
  -- Core job data
  title VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  company_logo_url TEXT,
  location_city VARCHAR(100),
  location_country VARCHAR(100) NOT NULL,
  remote_ok BOOLEAN DEFAULT FALSE,
  
  -- Employment details
  employment_type VARCHAR(50) NOT NULL,
  experience_level VARCHAR(50),
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency VARCHAR(3) DEFAULT 'USD',
  
  -- Application
  direct_apply_url TEXT NOT NULL,
  posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  quest_relevance_scores JSONB DEFAULT '{}'::jsonb,
  skills_required TEXT[],
  description_text TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_external_job UNIQUE (external_id, source_platform)
);

-- Indexes for performance
CREATE INDEX idx_jobs_company ON jobs(company_name);
CREATE INDEX idx_jobs_location ON jobs(location_country, location_city);
CREATE INDEX idx_jobs_posted ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_active ON jobs(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_jobs_quest_scores ON jobs USING gin(quest_relevance_scores);
```

### Company Tracking
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  domain VARCHAR(255),
  logo_url TEXT,
  
  -- ATS Platform info
  greenhouse_handle VARCHAR(100),
  lever_handle VARCHAR(100),
  workable_handle VARCHAR(100),
  
  -- Company metadata
  size_category VARCHAR(50),
  industry VARCHAR(100),
  funding_stage VARCHAR(50),
  
  -- Scraping metadata
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  job_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Compliance and Ethics

### Legal Considerations
```typescript
interface ComplianceFramework {
  rate_limiting: {
    greenhouse: '100_requests_per_minute'
    lever: '50_requests_per_minute'
    workable: '200_requests_per_minute'
    respect_robots_txt: true
  }
  
  data_usage: {
    no_redistribution: true
    no_resale: true
    attribution_required: false  // Public job data
    direct_application_only: true
  }
  
  robots_txt_compliance: {
    check_before_scraping: true
    respect_crawl_delay: true
    avoid_blocked_paths: true
  }
  
  terms_of_service: {
    greenhouse: 'public_data_scraping_allowed'
    lever: 'public_data_scraping_allowed'
    workable: 'check_individual_company_policies'
  }
}
```

### Ethical Guidelines
- **No Personal Data**: Only public job postings, no candidate information
- **Attribution**: Maintain original source links and company attribution
- **Fair Use**: Don't overwhelm servers, respect rate limits
- **No Manipulation**: Present job data as-is, no artificial promotion
- **User Benefit**: Focus on helping job seekers, not exploiting platforms

## Performance and Scalability

### Scraping Schedule
```typescript
interface ScrapingSchedule {
  full_refresh: {
    frequency: 'weekly'
    duration: '6_hours'
    optimal_time: 'sunday_2am_utc'
  }
  
  incremental_updates: {
    frequency: 'daily'
    duration: '30_minutes'
    focus: 'recently_active_companies'
  }
  
  real_time_search: {
    trigger: 'user_request'
    cache_duration: '4_hours'
    max_concurrent: 10
  }
}
```

### Infrastructure Requirements
```typescript
interface InfrastructureNeeds {
  compute: {
    scraping_workers: '4_cpu_16gb_ram'
    database: 'postgresql_with_50gb_storage'
    caching: 'redis_for_rate_limiting'
  }
  
  networking: {
    bandwidth: '100mbps_sustained'
    ip_rotation: 'optional_for_scale'
    cdn: 'for_company_logos'
  }
  
  monitoring: {
    error_tracking: 'sentry_or_similar'
    performance_monitoring: 'datadog_or_similar'
    uptime_monitoring: 'pingdom_or_similar'
  }
}
```

## Quest-Specific Features

### Quest-Aligned Job Matching
```typescript
class QuestJobMatcher {
  async findJobsForQuest(userQuest: string, userService: string): Promise<JobMatch[]> {
    const questEmbedding = await this.generateEmbedding(userQuest)
    const serviceEmbedding = await this.generateEmbedding(userService)
    
    // Semantic search in job database
    const semanticMatches = await this.vectorSearch(questEmbedding)
    
    // Add service alignment scoring
    const scoredMatches = semanticMatches.map(job => ({
      ...job,
      quest_alignment: this.calculateQuestAlignment(job, questEmbedding),
      service_alignment: this.calculateServiceAlignment(job, serviceEmbedding),
      overall_score: this.calculateOverallScore(job, userQuest, userService)
    }))
    
    return scoredMatches.sort((a, b) => b.overall_score - a.overall_score)
  }
}
```

### Network-Augmented Discovery
```typescript
interface NetworkJobs {
  // Jobs from Quest member companies
  insider_opportunities: {
    source: 'quest_member_companies'
    quality: 'highest'
    application_boost: 'referral_potential'
  }
  
  // Jobs mentioned in member conversations
  community_discovered: {
    source: 'member_discussions'
    quality: 'high'
    context: 'peer_recommended'
  }
  
  // Jobs aligned with member quests
  quest_targeted: {
    source: 'ai_analysis'
    quality: 'personalized'
    matching: 'quest_service_pledge_alignment'
  }
}
```

## Success Metrics

### Data Quality Metrics
- **Coverage**: % of startup jobs captured vs. manual benchmark
- **Freshness**: Average time from job posting to Quest database
- **Accuracy**: % of job links that work and lead to correct applications
- **Completeness**: % of jobs with all required fields populated

### User Engagement Metrics
- **Application Rate**: % of viewed jobs that result in applications
- **Success Rate**: % of applications that lead to interviews
- **Quest Alignment**: User rating of job relevance to their quest
- **Time to Apply**: Average time from job discovery to application

### System Performance Metrics
- **Scraping Success Rate**: % of scheduled scrapes that complete successfully
- **API Response Time**: Average response time for job search queries
- **Database Performance**: Query performance for job searches
- **Error Rate**: % of scraping attempts that fail

## Future Enhancements

### AI-Powered Features
- **Job Description Analysis**: Extract skills, culture, growth potential
- **Company Intelligence**: Funding stage, growth trajectory, culture fit
- **Application Optimization**: Suggest timing and approach for applications
- **Interview Preparation**: Company-specific interview guidance

### Advanced Integrations
- **Salary Intelligence**: Real-time compensation data integration
- **Company Reviews**: Glassdoor, Blind integration for culture insights
- **Network Effects**: "John from your network works here" insights
- **Application Tracking**: Monitor application status across platforms

### Global Expansion
- **Regional ATS Platforms**: European, Asian job platforms
- **Localization**: Currency, visa requirements, work permits
- **Cultural Adaptation**: Regional hiring practices and norms
- **Language Support**: Multi-language job descriptions and interfaces

## Conclusion

The Hybrid Job Scraping Architecture positions Quest as the premier destination for startup job discovery. By focusing on structured, high-quality data from standardized ATS platforms while supplementing with real-time search capabilities, Quest provides comprehensive coverage without the maintenance burden of traditional scraping approaches.

The key differentiator is Quest-aligned matching: jobs aren't just aggregated, they're matched to member quests, services, and professional pledges. This transforms job discovery from browsing to guided exploration of opportunities that align with professional purpose.

Combined with Quest's network effects and insider intelligence, this creates a job discovery experience that's both comprehensive and deeply personalized—exactly what purpose-driven professionals need to find their next meaningful opportunity.