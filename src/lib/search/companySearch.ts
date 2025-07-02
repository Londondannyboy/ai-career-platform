/**
 * Company Search Service
 * Handles fuzzy search, company name normalization, and search suggestions
 */

// Common company suffixes and variations
const COMPANY_SUFFIXES = [
  'Inc', 'Inc.', 'LLC', 'Corp', 'Corp.', 'Corporation', 'Ltd', 'Ltd.', 'Limited',
  'Co', 'Co.', 'Company', 'Group', 'Holdings', 'Enterprises', 'Technologies',
  'Tech', 'Systems', 'Solutions', 'Services', 'International', 'Global',
  'Worldwide', 'Partners', 'Associates', 'Consulting', 'Consultants'
];

// Common company name variations and aliases
const COMPANY_ALIASES: Record<string, string[]> = {
  'microsoft': ['msft', 'microsoft corporation', 'microsoft corp'],
  'apple': ['apple inc', 'apple computer', 'aapl'],
  'google': ['alphabet', 'alphabet inc', 'googl', 'goog'],
  'amazon': ['amazon.com', 'amzn'],
  'meta': ['facebook', 'meta platforms', 'fb'],
  'tesla': ['tesla motors', 'tsla'],
  'salesforce': ['salesforce.com', 'crm'],
  'oracle': ['oracle corporation', 'orcl'],
  'ibm': ['international business machines', 'big blue'],
  'intel': ['intel corporation', 'intc'],
  'netflix': ['nflx'],
  'uber': ['uber technologies'],
  'airbnb': ['airbnb inc'],
  'spotify': ['spotify technology'],
  'zoom': ['zoom video', 'zoom communications'],
  'slack': ['slack technologies'],
  'dropbox': ['dropbox inc'],
  'ckdelta': ['ck delta', 'c k delta', 'ck-delta', 'ck_delta']
};

export interface CompanySearchResult {
  originalQuery: string;
  normalizedName: string;
  suggestions: string[];
  matchType: 'exact' | 'fuzzy' | 'alias' | 'suggested';
  confidence: number;
}

export class CompanySearchService {
  /**
   * Normalize company name for consistent matching
   */
  static normalizeCompanyName(name: string): string {
    let normalized = name.toLowerCase().trim();
    
    // Remove common punctuation
    normalized = normalized.replace(/[.,;:!?()[\]{}'"]/g, '');
    
    // Replace multiple spaces with single space
    normalized = normalized.replace(/\s+/g, ' ');
    
    // Remove common suffixes
    for (const suffix of COMPANY_SUFFIXES) {
      const suffixPattern = new RegExp(`\\s+${suffix.toLowerCase()}$`, 'i');
      normalized = normalized.replace(suffixPattern, '');
    }
    
    // Remove spaces for exact matching (CK Delta → ckdelta)
    const spaceless = normalized.replace(/\s+/g, '');
    
    return spaceless;
  }

  /**
   * Generate search variations for a company name
   */
  static generateSearchVariations(name: string): string[] {
    const variations = new Set<string>();
    const original = name.toLowerCase().trim();
    
    // Add original
    variations.add(original);
    
    // Add normalized version
    variations.add(this.normalizeCompanyName(name));
    
    // Add with/without spaces
    variations.add(original.replace(/\s+/g, ''));
    variations.add(original.replace(/\s+/g, ' '));
    
    // Add common variations
    const withoutSuffixes = this.normalizeCompanyName(name);
    
    // Check aliases
    for (const [canonical, aliases] of Object.entries(COMPANY_ALIASES)) {
      if (aliases.some(alias => this.normalizeCompanyName(alias) === withoutSuffixes)) {
        variations.add(canonical);
        aliases.forEach(alias => variations.add(this.normalizeCompanyName(alias)));
      }
    }
    
    return Array.from(variations).filter(v => v.length > 0);
  }

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  static calculateSimilarity(str1: string, str2: string): number {
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    if (len1 === 0) return len2;
    if (len2 === 0) return len1;

    // Initialize matrix
    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    // Fill matrix
    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    const distance = matrix[len2][len1];
    const maxLen = Math.max(len1, len2);
    return 1 - distance / maxLen;
  }

  /**
   * Search for company with fuzzy matching
   */
  static searchCompany(query: string, knownCompanies: string[] = []): CompanySearchResult {
    const originalQuery = query.trim();
    const normalizedQuery = this.normalizeCompanyName(query);
    
    // Generate variations
    const variations = this.generateSearchVariations(query);
    
    // Check for exact matches first
    for (const variation of variations) {
      if (knownCompanies.some(company => this.normalizeCompanyName(company) === variation)) {
        return {
          originalQuery,
          normalizedName: variation,
          suggestions: [variation],
          matchType: 'exact',
          confidence: 1.0
        };
      }
    }
    
    // Check aliases
    for (const [canonical, aliases] of Object.entries(COMPANY_ALIASES)) {
      if (aliases.some(alias => this.normalizeCompanyName(alias) === normalizedQuery)) {
        return {
          originalQuery,
          normalizedName: canonical,
          suggestions: [canonical, ...aliases],
          matchType: 'alias',
          confidence: 0.9
        };
      }
    }
    
    // Fuzzy matching against known companies
    const fuzzyMatches = knownCompanies
      .map(company => ({
        company,
        normalized: this.normalizeCompanyName(company),
        similarity: Math.max(
          this.calculateSimilarity(normalizedQuery, this.normalizeCompanyName(company)),
          ...variations.map(v => this.calculateSimilarity(v, this.normalizeCompanyName(company)))
        )
      }))
      .filter(match => match.similarity > 0.6)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    if (fuzzyMatches.length > 0) {
      const bestMatch = fuzzyMatches[0];
      return {
        originalQuery,
        normalizedName: bestMatch.normalized,
        suggestions: fuzzyMatches.map(m => m.company),
        matchType: 'fuzzy',
        confidence: bestMatch.similarity
      };
    }
    
    // Generate suggestions based on partial matches
    const suggestions = this.generateSuggestions(normalizedQuery);
    
    return {
      originalQuery,
      normalizedName: normalizedQuery,
      suggestions,
      matchType: 'suggested',
      confidence: 0.5
    };
  }

  /**
   * Generate company name suggestions
   */
  static generateSuggestions(query: string): string[] {
    const suggestions = [];
    
    // Check if query matches any known aliases
    for (const [canonical, aliases] of Object.entries(COMPANY_ALIASES)) {
      if (canonical.includes(query) || aliases.some(alias => alias.toLowerCase().includes(query))) {
        suggestions.push(canonical);
      }
    }
    
    // Add common tech companies if query suggests tech
    const techTerms = ['tech', 'software', 'digital', 'data', 'ai', 'cloud'];
    if (techTerms.some(term => query.includes(term))) {
      suggestions.push('microsoft', 'google', 'apple', 'amazon', 'meta');
    }
    
    return suggestions.slice(0, 5);
  }

  /**
   * Get search autocomplete suggestions
   */
  static getAutocompleteSuggestions(query: string, limit: number = 5): string[] {
    if (query.length < 2) return [];
    
    const suggestions = new Set<string>();
    const normalizedQuery = query.toLowerCase();
    
    // Check aliases for matches
    for (const [canonical, aliases] of Object.entries(COMPANY_ALIASES)) {
      if (canonical.startsWith(normalizedQuery)) {
        suggestions.add(canonical);
      }
      for (const alias of aliases) {
        if (alias.toLowerCase().startsWith(normalizedQuery)) {
          suggestions.add(alias);
        }
      }
    }
    
    return Array.from(suggestions).slice(0, limit);
  }
}

export default CompanySearchService;