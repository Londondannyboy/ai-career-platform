/**
 * Apollo.io API Service for Company Enrichment
 * Searches for people by company name and retrieves employee profile data
 */

interface ApolloSearchParams {
  organizationNames?: string[];
  titles?: string[];
  seniorityLevels?: string[];
  departments?: string[];
  perPage?: number;
  page?: number;
}

interface ApolloPerson {
  id: string;
  name: string;
  first_name: string;
  last_name: string;
  title: string;
  headline: string;
  organization_name: string;
  organization_id: string;
  departments: string[];
  seniority: string;
  email: string | null;
  linkedin_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone_numbers: string[];
  employment_history: Array<{
    organization_name: string;
    title: string;
    start_date: string | null;
    end_date: string | null;
  }>;
}

interface ApolloResponse {
  people: ApolloPerson[];
  total_entries: number;
  page: number;
  per_page: number;
}

export class ApolloService {
  private apiKey: string;
  private baseUrl: string = 'https://api.apollo.io/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Search for people by company name
   * Returns employee profiles with their details
   */
  async searchPeopleByCompany(
    companyName: string,
    options: {
      titles?: string[];
      seniorityLevels?: string[];
      departments?: string[];
      perPage?: number;
      page?: number;
    } = {}
  ): Promise<ApolloResponse> {
    try {
      const params: ApolloSearchParams = {
        organizationNames: [companyName],
        titles: options.titles,
        seniorityLevels: options.seniorityLevels,
        departments: options.departments,
        perPage: options.perPage || 25,
        page: options.page || 1
      };

      const response = await fetch(`${this.baseUrl}/people/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Api-Key': this.apiKey
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Apollo API error:', response.status, errorData);
        throw new Error(`Apollo API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching people by company:', error);
      throw error;
    }
  }

  /**
   * Get key decision makers for a company
   * Focuses on C-level, VP, and Director positions
   */
  async getKeyDecisionMakers(companyName: string): Promise<ApolloPerson[]> {
    const seniorityLevels = ['c_suite', 'vp', 'director', 'owner'];
    
    try {
      const response = await this.searchPeopleByCompany(companyName, {
        seniorityLevels,
        perPage: 50
      });

      return response.people;
    } catch (error) {
      console.error('Error getting decision makers:', error);
      throw error;
    }
  }

  /**
   * Get people by department
   */
  async getPeopleByDepartment(
    companyName: string,
    department: string
  ): Promise<ApolloPerson[]> {
    try {
      const response = await this.searchPeopleByCompany(companyName, {
        departments: [department],
        perPage: 50
      });

      return response.people;
    } catch (error) {
      console.error('Error getting people by department:', error);
      throw error;
    }
  }

  /**
   * Transform Apollo data to our unified profile format
   */
  transformToUnifiedProfile(person: ApolloPerson) {
    return {
      linkedinUrl: person.linkedin_url || `apollo_${person.id}`,
      email: person.email,
      name: person.name,
      headline: person.headline || person.title,
      currentPosition: person.title,
      currentCompany: person.organization_name,
      location: [person.city, person.state, person.country].filter(Boolean).join(', '),
      phoneNumbers: person.phone_numbers,
      seniority: person.seniority,
      departments: person.departments,
      employmentHistory: person.employment_history,
      dataSource: 'apollo' as const,
      apolloId: person.id,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Batch search multiple companies
   */
  async searchMultipleCompanies(
    companyNames: string[],
    options: {
      seniorityLevels?: string[];
      departments?: string[];
      perPage?: number;
    } = {}
  ): Promise<Map<string, ApolloPerson[]>> {
    const results = new Map<string, ApolloPerson[]>();

    // Process companies in batches to avoid rate limiting
    for (const companyName of companyNames) {
      try {
        const response = await this.searchPeopleByCompany(companyName, options);
        results.set(companyName, response.people);
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error searching for ${companyName}:`, error);
        results.set(companyName, []);
      }
    }

    return results;
  }
}

// Singleton instance
let apolloService: ApolloService | null = null;

export const getApolloService = (): ApolloService => {
  if (!apolloService) {
    const apiKey = process.env.APOLLO_API_KEY;
    if (!apiKey) {
      throw new Error('APOLLO_API_KEY environment variable is not set');
    }
    apolloService = new ApolloService(apiKey);
  }
  return apolloService;
};

export default ApolloService;