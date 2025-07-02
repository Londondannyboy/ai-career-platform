/**
 * Apollo Storage Service
 * Handles database operations for Apollo enrichment data using Neon.tech PostgreSQL
 */

import { query, getClient, withTransaction } from '@/lib/database/neon';

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
  constructor() {
    // Using Neon.tech PostgreSQL connection
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
      const normalizedName = companyName.toLowerCase().trim();
      
      // Get company enrichment info
      const enrichmentResult = await query(
        `SELECT id, company_name, last_crawled_at, total_employees, crawled_by
         FROM company_enrichments 
         WHERE normalized_name = $1`,
        [normalizedName]
      );

      if (enrichmentResult.rows.length === 0) {
        return { exists: false, isStale: true };
      }

      const enrichment = enrichmentResult.rows[0];

      // Check if data is stale (older than 30 days)
      const lastCrawled = new Date(enrichment.last_crawled_at);
      const daysSinceCrawl = Math.floor((Date.now() - lastCrawled.getTime()) / (1000 * 60 * 60 * 24));
      const isStale = daysSinceCrawl > 30;

      // Get profile count
      const profileCountResult = await query(
        `SELECT COUNT(*) as count FROM apollo_profiles WHERE company_enrichment_id = $1`,
        [enrichment.id]
      );
      const profileCount = parseInt(profileCountResult.rows[0].count);

      return {
        exists: true,
        isStale,
        lastCrawled,
        daysSinceCrawl,
        profileCount,
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
      return await withTransaction(async (client) => {
        const normalizedName = companyName.toLowerCase().trim();

        // Extract company identifiers from Apollo data
        const firstEmployee = apolloData.people?.[0];
        const linkedinCompanyUrl = firstEmployee?.organization?.linkedin_url;
        const companyDomain = firstEmployee?.organization?.primary_domain;
        
        // Generate canonical identifier
        const canonicalIdentifier = linkedinCompanyUrl || companyDomain || normalizedName;

        // Check if company already exists with this identifier
        const existingResult = await client.query(
          `SELECT id, company_name FROM company_enrichments 
           WHERE canonical_identifier = $1 OR normalized_name = $2`,
          [canonicalIdentifier, normalizedName]
        );

        let enrichmentId: string;

        if (existingResult.rows.length > 0) {
          // Update existing company
          const updateResult = await client.query(
            `UPDATE company_enrichments 
             SET total_employees = $1, last_crawled_at = $2, crawled_by = $3,
                 linkedin_company_url = $4, company_domain = $5, canonical_identifier = $6,
                 metadata = $7
             WHERE id = $8
             RETURNING id`,
            [
              apolloData.pagination?.total_entries || 0,
              new Date().toISOString(),
              userId,
              linkedinCompanyUrl,
              companyDomain,
              canonicalIdentifier,
              JSON.stringify({
                pagination: apolloData.pagination,
                searchOptions: apolloData.searchOptions
              }),
              existingResult.rows[0].id
            ]
          );
          enrichmentId = updateResult.rows[0].id;
        } else {
          // Create new company enrichment record
          const insertResult = await client.query(
            `INSERT INTO company_enrichments 
             (company_name, normalized_name, apollo_organization_id, linkedin_company_url, 
              company_domain, canonical_identifier, total_employees, last_crawled_at, 
              crawled_by, metadata)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING id`,
            [
              companyName,
              normalizedName,
              apolloData.people?.[0]?.organization_id,
              linkedinCompanyUrl,
              companyDomain,
              canonicalIdentifier,
              apolloData.pagination?.total_entries || 0,
              new Date().toISOString(),
              userId,
              JSON.stringify({
                pagination: apolloData.pagination,
                searchOptions: apolloData.searchOptions
              })
            ]
          );
          enrichmentId = insertResult.rows[0].id;
        }

        // Delete existing profiles for this company
        await client.query(
          `DELETE FROM apollo_profiles WHERE company_enrichment_id = $1`,
          [enrichmentId]
        );

        // Store individual profiles
        if (apolloData.people && apolloData.people.length > 0) {
          const profileValues = apolloData.people.map((person: any, index: number) => {
            const paramIndex = index * 18;
            return `($${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, 
                     $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8}, 
                     $${paramIndex + 9}, $${paramIndex + 10}, $${paramIndex + 11}, $${paramIndex + 12}, 
                     $${paramIndex + 13}, $${paramIndex + 14}, $${paramIndex + 15}, $${paramIndex + 16}, 
                     $${paramIndex + 17}, $${paramIndex + 18})`;
          }).join(', ');

          const profileParams = apolloData.people.flatMap((person: any) => [
            person.id,
            enrichmentId,
            person.name,
            person.first_name,
            person.last_name,
            person.email === 'email_not_unlocked@domain.com' ? null : person.email,
            person.email_status,
            person.title,
            person.headline,
            person.seniority,
            JSON.stringify(person.departments || []),
            person.linkedin_url,
            person.photo_url,
            person.city,
            person.state,
            person.country,
            person.organization?.name || person.organization_name,
            JSON.stringify(person)
          ]);

          await client.query(
            `INSERT INTO apollo_profiles 
             (apollo_id, company_enrichment_id, full_name, first_name, last_name, email, 
              email_status, title, headline, seniority, departments, linkedin_url, photo_url, 
              city, state, country, organization_name, raw_data)
             VALUES ${profileValues}`,
            profileParams
          );
        }

        return { success: true, enrichmentId };
      });
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
      const normalizedName = companyName.toLowerCase().trim();

      // Get company enrichment info
      const enrichmentResult = await query(
        `SELECT * FROM company_enrichments WHERE normalized_name = $1`,
        [normalizedName]
      );

      if (enrichmentResult.rows.length === 0) {
        return { profiles: [], total: 0 };
      }

      const enrichment = enrichmentResult.rows[0];

      // Build query for profiles
      let profileQuery = `
        SELECT * FROM apollo_profiles 
        WHERE company_enrichment_id = $1
      `;
      const queryParams: any[] = [enrichment.id];
      let paramIndex = 2;

      // Apply filters
      if (options.seniority && options.seniority.length > 0) {
        profileQuery += ` AND seniority = ANY($${paramIndex})`;
        queryParams.push(options.seniority);
        paramIndex++;
      }

      if (options.departments && options.departments.length > 0) {
        profileQuery += ` AND departments && $${paramIndex}`;
        queryParams.push(JSON.stringify(options.departments));
        paramIndex++;
      }

      // Apply pagination
      if (options.limit) {
        profileQuery += ` LIMIT $${paramIndex}`;
        queryParams.push(options.limit);
        paramIndex++;
      }
      if (options.offset) {
        profileQuery += ` OFFSET $${paramIndex}`;
        queryParams.push(options.offset);
        paramIndex++;
      }

      const profilesResult = await query(profileQuery, queryParams);

      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) as count FROM apollo_profiles WHERE company_enrichment_id = $1`,
        [enrichment.id]
      );

      return {
        profiles: profilesResult.rows || [],
        total: parseInt(countResult.rows[0].count),
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
      const result = await query(`
        SELECT 
          ce.id,
          ce.company_name,
          ce.total_employees,
          ce.last_crawled_at,
          ce.crawled_by,
          COUNT(ap.id) as profile_count
        FROM company_enrichments ce
        LEFT JOIN apollo_profiles ap ON ce.id = ap.company_enrichment_id
        GROUP BY ce.id, ce.company_name, ce.total_employees, ce.last_crawled_at, ce.crawled_by
        ORDER BY ce.last_crawled_at DESC
      `);

      const companies = result.rows.map((company: any) => {
        const lastCrawled = new Date(company.last_crawled_at);
        const daysSinceCrawl = Math.floor((Date.now() - lastCrawled.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          id: company.id,
          company_name: company.company_name,
          total_employees: company.total_employees,
          profile_count: parseInt(company.profile_count),
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
      const normalizedName = companyName.toLowerCase().trim();
      
      await query(
        `DELETE FROM company_enrichments WHERE normalized_name = $1`,
        [normalizedName]
      );

      return { success: true };
    } catch (error) {
      console.error('Error deleting company enrichment:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Expose connection for cleanup API
  async getConnection() {
    return { query };
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