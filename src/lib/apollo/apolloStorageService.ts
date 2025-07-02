/**
 * Apollo Storage Service
 * Handles database operations for Apollo enrichment data
 */

import { createClient } from '@/lib/supabase/server';

interface CompanyEnrichment {
  id: string;
  company_name: string;
  normalized_name: string;
  apollo_organization_id?: string;
  total_employees: number;
  last_crawled_at: string;
  crawled_by: string;
  metadata: Record<string, any>;
}

interface ApolloProfile {
  id: string;
  apollo_id: string;
  company_enrichment_id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  email_status?: string;
  title?: string;
  headline?: string;
  seniority?: string;
  departments: string[];
  linkedin_url?: string;
  photo_url?: string;
  city?: string;
  state?: string;
  country?: string;
  organization_name?: string;
  organization_id?: string;
  employment_history: any[];
  raw_data: any;
}

export class ApolloStorageService {
  private supabase: any;

  constructor() {
    // Initialize supabase in methods since createClient is async
    this.supabase = null;
  }

  private async getSupabase() {
    if (!this.supabase) {
      this.supabase = await createClient();
    }
    return this.supabase;
  }

  /**
   * Check if company enrichment data exists and is fresh
   */
  async getCompanyEnrichmentStatus(companyName: string): Promise<{
    exists: boolean;
    isStale: boolean;
    lastCrawled?: Date;
    daysSinceCrawl?: number;
    profileCount?: number;
    enrichmentId?: string;
  }> {
    try {
      const supabase = await this.getSupabase();
      const normalizedName = companyName.toLowerCase().trim();
      
      const { data: enrichment, error } = await supabase
        .from('company_enrichments')
        .select(`
          id,
          company_name,
          last_crawled_at,
          total_employees,
          crawled_by
        `)
        .eq('normalized_name', normalizedName)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error checking company enrichment:', error);
        return { exists: false, isStale: true };
      }

      if (!enrichment) {
        return { exists: false, isStale: true };
      }

      // Check if data is stale (older than 30 days)
      const lastCrawled = new Date(enrichment.last_crawled_at);
      const daysSinceCrawl = Math.floor((Date.now() - lastCrawled.getTime()) / (1000 * 60 * 60 * 24));
      const isStale = daysSinceCrawl > 30;

      // Get profile count
      const { count: profileCount } = await supabase
        .from('apollo_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('company_enrichment_id', enrichment.id);

      return {
        exists: true,
        isStale,
        lastCrawled,
        daysSinceCrawl,
        profileCount: profileCount || 0,
        enrichmentId: enrichment.id
      };
    } catch (error) {
      console.error('Error in getCompanyEnrichmentStatus:', error);
      return { exists: false, isStale: true };
    }
  }

  /**
   * Store Apollo enrichment data in database
   */
  async storeEnrichmentData(
    companyName: string,
    apolloData: any,
    userId: string
  ): Promise<{ success: boolean; enrichmentId?: string; error?: string }> {
    try {
      const supabase = await this.getSupabase();
      const normalizedName = companyName.toLowerCase().trim();

      // Extract company identifiers from Apollo data
      const firstEmployee = apolloData.people?.[0];
      const linkedinCompanyUrl = firstEmployee?.organization?.linkedin_url;
      const companyDomain = firstEmployee?.organization?.primary_domain;
      
      // Generate canonical identifier
      const canonicalIdentifier = linkedinCompanyUrl || companyDomain || normalizedName;

      // Check if company already exists with this identifier
      const { data: existingCompany } = await supabase
        .from('company_enrichments')
        .select('id, company_name')
        .or(`canonical_identifier.eq.${canonicalIdentifier},normalized_name.eq.${normalizedName}`)
        .single();

      let enrichmentId: string;

      if (existingCompany) {
        // Update existing company
        const { data: updatedEnrichment, error: updateError } = await supabase
          .from('company_enrichments')
          .update({
            total_employees: apolloData.pagination?.total_entries || 0,
            last_crawled_at: new Date().toISOString(),
            crawled_by: userId,
            linkedin_company_url: linkedinCompanyUrl,
            company_domain: companyDomain,
            canonical_identifier: canonicalIdentifier,
            metadata: {
              pagination: apolloData.pagination,
              searchOptions: apolloData.searchOptions
            }
          })
          .eq('id', existingCompany.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating company enrichment:', updateError);
          return { success: false, error: updateError.message };
        }
        enrichmentId = updatedEnrichment.id;
      } else {
        // Create new company enrichment record
        const { data: enrichment, error: enrichmentError } = await supabase
          .from('company_enrichments')
          .insert({
            company_name: companyName,
            normalized_name: normalizedName,
            apollo_organization_id: apolloData.people?.[0]?.organization_id,
            linkedin_company_url: linkedinCompanyUrl,
            company_domain: companyDomain,
            canonical_identifier: canonicalIdentifier,
            total_employees: apolloData.pagination?.total_entries || 0,
            last_crawled_at: new Date().toISOString(),
            crawled_by: userId,
            metadata: {
              pagination: apolloData.pagination,
              searchOptions: apolloData.searchOptions
            }
          })
          .select()
          .single();

        if (enrichmentError) {
          console.error('Error storing company enrichment:', enrichmentError);
          return { success: false, error: enrichmentError.message };
        }
        enrichmentId = enrichment.id;
      }

      // Delete existing profiles for this company
      await supabase
        .from('apollo_profiles')
        .delete()
        .eq('company_enrichment_id', enrichmentId);

      // Store individual profiles
      if (apolloData.people && apolloData.people.length > 0) {
        const profiles = apolloData.people.map((person: any) => ({
          apollo_id: person.id,
          company_enrichment_id: enrichmentId,
          full_name: person.name,
          first_name: person.first_name,
          last_name: person.last_name,
          email: person.email === 'email_not_unlocked@domain.com' ? null : person.email,
          email_status: person.email_status,
          title: person.title,
          headline: person.headline,
          seniority: person.seniority,
          departments: person.departments || [],
          linkedin_url: person.linkedin_url,
          photo_url: person.photo_url,
          city: person.city,
          state: person.state,
          country: person.country,
          organization_name: person.organization?.name || person.organization_name,
          organization_id: person.organization_id,
          employment_history: person.employment_history || [],
          raw_data: person
        }));

        const { error: profilesError } = await supabase
          .from('apollo_profiles')
          .insert(profiles);

        if (profilesError) {
          console.error('Error storing profiles:', profilesError);
          return { success: false, error: profilesError.message };
        }
      }

      return { success: true, enrichmentId };
    } catch (error) {
      console.error('Error in storeEnrichmentData:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get enriched profiles for a company
   */
  async getCompanyProfiles(
    companyName: string,
    options: {
      seniority?: string[];
      departments?: string[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    profiles: ApolloProfile[];
    total: number;
    companyInfo?: CompanyEnrichment;
  }> {
    try {
      const supabase = await this.getSupabase();
      const normalizedName = companyName.toLowerCase().trim();

      // Get company enrichment info
      const { data: enrichment } = await supabase
        .from('company_enrichments')
        .select('*')
        .eq('normalized_name', normalizedName)
        .single();

      if (!enrichment) {
        return { profiles: [], total: 0 };
      }

      // Build query for profiles
      let query = supabase
        .from('apollo_profiles')
        .select('*', { count: 'exact' })
        .eq('company_enrichment_id', enrichment.id);

      // Apply filters
      if (options.seniority && options.seniority.length > 0) {
        query = query.in('seniority', options.seniority);
      }

      if (options.departments && options.departments.length > 0) {
        query = query.overlaps('departments', options.departments);
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 25) - 1);
      }

      const { data: profiles, error, count } = await query;

      if (error) {
        console.error('Error fetching profiles:', error);
        return { profiles: [], total: 0 };
      }

      return {
        profiles: profiles || [],
        total: count || 0,
        companyInfo: enrichment
      };
    } catch (error) {
      console.error('Error in getCompanyProfiles:', error);
      return { profiles: [], total: 0 };
    }
  }

  /**
   * Get all enriched companies with stats
   */
  async getEnrichedCompanies(userId?: string): Promise<{
    companies: Array<{
      id: string;
      company_name: string;
      total_employees: number;
      profile_count: number;
      last_crawled_at: string;
      days_since_crawl: number;
      is_stale: boolean;
      crawled_by: string;
    }>;
  }> {
    try {
      const supabase = await this.getSupabase();
      const { data, error } = await supabase
        .from('company_enrichments')
        .select(`
          id,
          company_name,
          total_employees,
          last_crawled_at,
          crawled_by,
          apollo_profiles(count)
        `)
        .order('last_crawled_at', { ascending: false });

      if (error) {
        console.error('Error fetching enriched companies:', error);
        return { companies: [] };
      }

      const companies = (data || []).map((company: any) => {
        const lastCrawled = new Date(company.last_crawled_at);
        const daysSinceCrawl = Math.floor((Date.now() - lastCrawled.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: company.id,
          company_name: company.company_name,
          total_employees: company.total_employees,
          profile_count: company.apollo_profiles?.[0]?.count || 0,
          last_crawled_at: company.last_crawled_at,
          days_since_crawl: daysSinceCrawl,
          is_stale: daysSinceCrawl > 30,
          crawled_by: company.crawled_by
        };
      });

      return { companies };
    } catch (error) {
      console.error('Error in getEnrichedCompanies:', error);
      return { companies: [] };
    }
  }

  /**
   * Delete company enrichment data
   */
  async deleteCompanyEnrichment(companyName: string): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = await this.getSupabase();
      const normalizedName = companyName.toLowerCase().trim();
      
      const { error } = await supabase
        .from('company_enrichments')
        .delete()
        .eq('normalized_name', normalizedName);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting company enrichment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
}

// Singleton instance
let apolloStorageService: ApolloStorageService | null = null;

export const getApolloStorageService = (): ApolloStorageService => {
  if (!apolloStorageService) {
    apolloStorageService = new ApolloStorageService();
  }
  return apolloStorageService;
};

export default ApolloStorageService;