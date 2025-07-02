/**
 * Intelligent Query API for Company Repository
 * Uses AI to analyze company data and provide smart recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

interface QueryContext {
  companies: any[];
  totalEmployees: number;
  queryIntent: string;
  searchTerms: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || query.trim().length < 5) {
      return NextResponse.json({
        success: false,
        error: 'Query must be at least 5 characters long'
      }, { status: 400 });
    }

    console.log(`🧠 Processing intelligent query: "${query}"`);

    // Step 1: Fetch all company data with enrichment details
    const { rows: companies } = await sql`
      SELECT 
        id,
        company_name,
        employee_count,
        last_enriched,
        enrichment_data,
        canonical_identifier
      FROM company_enrichments 
      WHERE enrichment_data IS NOT NULL
      ORDER BY last_enriched DESC
    `;

    if (companies.length === 0) {
      return NextResponse.json({
        success: true,
        result: {
          analysis: "I don't have any company data to analyze yet. Try enriching some companies first using the main enrichment feature.",
          recommendations: [],
          totalCompaniesAnalyzed: 0
        }
      });
    }

    console.log(`📊 Analyzing data from ${companies.length} companies`);

    // Step 2: Extract and flatten all employee data
    const allEmployees: any[] = [];
    companies.forEach(company => {
      try {
        const enrichmentData = typeof company.enrichment_data === 'string' 
          ? JSON.parse(company.enrichment_data) 
          : company.enrichment_data;
        
        if (enrichmentData.employees && Array.isArray(enrichmentData.employees)) {
          enrichmentData.employees.forEach((emp: any) => {
            allEmployees.push({
              ...emp,
              companyName: company.company_name,
              companyId: company.id,
              companyUrl: company.canonical_identifier
            });
          });
        }
      } catch (parseError) {
        console.warn(`Failed to parse enrichment data for ${company.company_name}:`, parseError);
      }
    });

    console.log(`👥 Total employees across all companies: ${allEmployees.length}`);

    // Step 3: Analyze query intent and extract search terms
    const queryLower = query.toLowerCase();
    const intent = analyzeQueryIntent(queryLower);
    const searchTerms = extractSearchTerms(queryLower);

    console.log(`🎯 Query intent: ${intent}, Search terms: ${searchTerms.join(', ')}`);

    // Step 4: Find matching employees based on query
    const matchingEmployees = findMatchingEmployees(allEmployees, queryLower, searchTerms, intent);
    
    console.log(`✅ Found ${matchingEmployees.length} matching employees`);

    // Step 5: Generate AI analysis and recommendations
    const analysis = generateAnalysis(query, matchingEmployees, companies.length, allEmployees.length, intent);
    const recommendations = generateRecommendations(matchingEmployees, intent, query);

    return NextResponse.json({
      success: true,
      result: {
        analysis,
        recommendations: recommendations.slice(0, 10), // Limit to top 10
        totalCompaniesAnalyzed: companies.length,
        totalEmployeesAnalyzed: allEmployees.length,
        matchingEmployees: matchingEmployees.length,
        queryIntent: intent
      }
    });

  } catch (error) {
    console.error('Intelligent query failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Query processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function analyzeQueryIntent(query: string): string {
  if (query.includes('sales') || query.includes('business development') || query.includes('bd')) {
    return 'sales_focused';
  } else if (query.includes('engineer') || query.includes('technical') || query.includes('developer') || query.includes('cto')) {
    return 'technical_focused';
  } else if (query.includes('marketing') || query.includes('growth') || query.includes('cmo')) {
    return 'marketing_focused';
  } else if (query.includes('ceo') || query.includes('founder') || query.includes('executive') || query.includes('director')) {
    return 'executive_focused';
  } else if (query.includes('introduce') || query.includes('connect') || query.includes('know')) {
    return 'networking_focused';
  } else if (query.includes('experience') || query.includes('background') || query.includes('worked')) {
    return 'experience_focused';
  } else {
    return 'general_search';
  }
}

function extractSearchTerms(query: string): string[] {
  const terms = [];
  
  // Technology terms
  const techTerms = ['saas', 'fintech', 'ai', 'machine learning', 'blockchain', 'crypto', 'react', 'python', 'javascript', 'aws', 'azure', 'kubernetes'];
  techTerms.forEach(term => {
    if (query.includes(term)) terms.push(term);
  });
  
  // Industry terms
  const industryTerms = ['healthcare', 'finance', 'insurance', 'retail', 'ecommerce', 'education', 'enterprise', 'startup'];
  industryTerms.forEach(term => {
    if (query.includes(term)) terms.push(term);
  });
  
  // Role terms
  const roleTerms = ['sales', 'engineer', 'marketing', 'product', 'design', 'data', 'security', 'devops'];
  roleTerms.forEach(term => {
    if (query.includes(term)) terms.push(term);
  });
  
  return terms;
}

function findMatchingEmployees(employees: any[], query: string, searchTerms: string[], intent: string): any[] {
  return employees.filter(emp => {
    let score = 0;
    
    // Basic text matching in title, summary, skills
    const searchableText = `${emp.title} ${emp.summary} ${emp.skills?.join(' ')} ${emp.experience?.map((e: any) => e.title + ' ' + e.company).join(' ')}`.toLowerCase();
    
    // Direct query match
    if (searchableText.includes(query)) score += 10;
    
    // Search terms matching
    searchTerms.forEach(term => {
      if (searchableText.includes(term)) score += 5;
    });
    
    // Intent-based scoring
    switch (intent) {
      case 'sales_focused':
        if (emp.title?.toLowerCase().includes('sales') || 
            emp.title?.toLowerCase().includes('business development') ||
            emp.title?.toLowerCase().includes('account manager')) score += 8;
        break;
      case 'technical_focused':
        if (emp.title?.toLowerCase().includes('engineer') || 
            emp.title?.toLowerCase().includes('developer') ||
            emp.title?.toLowerCase().includes('technical') ||
            emp.title?.toLowerCase().includes('cto')) score += 8;
        break;
      case 'executive_focused':
        if (emp.title?.toLowerCase().includes('ceo') || 
            emp.title?.toLowerCase().includes('founder') ||
            emp.title?.toLowerCase().includes('director') ||
            emp.title?.toLowerCase().includes('head of')) score += 8;
        break;
      case 'networking_focused':
        if (emp.recommendations && emp.recommendations.length > 0) score += 6;
        if (emp.connections && emp.connections.length > 0) score += 4;
        break;
    }
    
    // Boost for people with recommendations (they're more connected)
    if (emp.recommendations && emp.recommendations.length > 0) score += 3;
    
    return score > 0;
  }).sort((a, b) => {
    // Sort by relevance score (recalculate for sorting)
    const scoreA = calculateRelevanceScore(a, query, searchTerms, intent);
    const scoreB = calculateRelevanceScore(b, query, searchTerms, intent);
    return scoreB - scoreA;
  });
}

function calculateRelevanceScore(emp: any, query: string, searchTerms: string[], intent: string): number {
  let score = 0;
  const searchableText = `${emp.title} ${emp.summary} ${emp.skills?.join(' ')} ${emp.experience?.map((e: any) => e.title + ' ' + e.company).join(' ')}`.toLowerCase();
  
  if (searchableText.includes(query)) score += 10;
  searchTerms.forEach(term => {
    if (searchableText.includes(term)) score += 5;
  });
  
  // Intent bonuses
  switch (intent) {
    case 'sales_focused':
      if (emp.title?.toLowerCase().includes('sales')) score += 8;
      break;
    case 'technical_focused':
      if (emp.title?.toLowerCase().includes('engineer')) score += 8;
      break;
  }
  
  if (emp.recommendations?.length > 0) score += 3;
  return score;
}

function generateAnalysis(query: string, matches: any[], totalCompanies: number, totalEmployees: number, intent: string): string {
  if (matches.length === 0) {
    return `I analyzed ${totalEmployees} employees across ${totalCompanies} companies but couldn't find anyone matching "${query}". Try rephrasing your query or enriching more companies in your target market.`;
  }
  
  const companiesWithMatches = [...new Set(matches.map(m => m.companyName))];
  const topCompany = companiesWithMatches[0];
  const matchesInTopCompany = matches.filter(m => m.companyName === topCompany).length;
  
  let analysis = `Great question! I analyzed ${totalEmployees} employees across ${totalCompanies} companies and found ${matches.length} relevant matches for "${query}". `;
  
  if (companiesWithMatches.length === 1) {
    analysis += `All matches are at ${topCompany}, which suggests they might be a key player in this space.`;
  } else {
    analysis += `These matches span ${companiesWithMatches.length} companies, with ${topCompany} having the most relevant people (${matchesInTopCompany} matches).`;
  }
  
  // Add intent-specific insights
  switch (intent) {
    case 'sales_focused':
      analysis += ` For sales outreach, I'd recommend starting with the senior sales leaders who likely have the biggest networks and decision-making authority.`;
      break;
    case 'technical_focused':
      analysis += ` For technical discussions, focus on the engineering leaders and architects who can influence technical decisions.`;
      break;
    case 'networking_focused':
      const withRecommendations = matches.filter(m => m.recommendations?.length > 0).length;
      analysis += ` I found ${withRecommendations} people with LinkedIn recommendations, indicating they're well-connected and could provide valuable introductions.`;
      break;
  }
  
  return analysis;
}

function generateRecommendations(matches: any[], intent: string, originalQuery: string): any[] {
  return matches.slice(0, 10).map((emp, index) => {
    let reasoning = '';
    
    // Generate reasoning based on why this person is recommended
    const reasons = [];
    
    if (emp.title?.toLowerCase().includes('director') || emp.title?.toLowerCase().includes('head')) {
      reasons.push('senior leadership role');
    }
    
    if (emp.recommendations && emp.recommendations.length > 0) {
      reasons.push(`${emp.recommendations.length} LinkedIn recommendations`);
    }
    
    if (emp.experience && emp.experience.length > 3) {
      reasons.push('extensive experience');
    }
    
    // Intent-specific reasoning
    switch (intent) {
      case 'sales_focused':
        if (emp.title?.toLowerCase().includes('sales')) {
          reasons.push('direct sales experience');
        }
        break;
      case 'technical_focused':
        if (emp.skills && emp.skills.length > 5) {
          reasons.push(`technical expertise in ${emp.skills.slice(0, 3).join(', ')}`);
        }
        break;
    }
    
    if (reasons.length === 0) {
      reasoning = 'Matches your search criteria and could provide valuable insights.';
    } else {
      reasoning = `Recommended because of their ${reasons.join(', ')}.`;
    }
    
    return {
      name: emp.name,
      title: emp.title,
      company: emp.companyName,
      linkedinUrl: emp.linkedinUrl || emp.linkedin_url,
      reasoning,
      relevanceScore: calculateRelevanceScore(emp, originalQuery.toLowerCase(), [], intent)
    };
  });
}