/**
 * Company Graph Tagging System Types
 * Comprehensive type definitions for company classification and verification
 */

// Company Category System
export type CompanyCategoryType = 
  | 'industry'          // Technology, Healthcare, Finance, etc.
  | 'size'             // startup, small, medium, large, enterprise
  | 'stage'            // seed, series_a, growth, public
  | 'tech_stack'       // react, python, aws, etc.
  | 'market_segment'   // b2b, b2c, b2b2c
  | 'business_model'   // saas, marketplace, consultancy
  | 'geography'        // headquarters location, markets served
  | 'industry_preset'  // Predefined industry categories

export interface CompanyCategory {
  id: string
  company_id: string
  category_type: CompanyCategoryType
  category_value: string
  confidence: number // 0.0 to 1.0
  source: string // 'manual', 'ai_classified', 'apollo', 'linkedin'
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

// Company Relationships
export type CompanyRelationshipType = 
  | 'subsidiary'    // Parent owns child
  | 'acquisition'   // Parent acquired child
  | 'partnership'   // Strategic partnership
  | 'competitor'    // Direct competitor
  | 'vendor'        // Vendor relationship
  | 'client'        // Client relationship
  | 'investor'      // Investment relationship

export interface CompanyRelationship {
  id: string
  parent_company_id: string
  child_company_id: string
  relationship_type: CompanyRelationshipType
  confidence: number
  source: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

// User-Company Verification
export type VerificationMethod = 
  | 'self_declaration'  // User declares company
  | 'email_domain'      // Verified via company email
  | 'admin_approved'    // Approved by company admin
  | 'linkedin_sync'     // Synced from LinkedIn
  | 'manual_review'     // Manually reviewed by Quest team

export type VerificationStatus = 
  | 'pending'     // Awaiting verification
  | 'verified'    // Successfully verified
  | 'rejected'    // Verification failed
  | 'expired'     // Verification expired

export interface UserCompanyVerification {
  id: string
  user_id: string
  company_id: string
  company_name: string
  company_email?: string
  verification_method: VerificationMethod
  verification_status: VerificationStatus
  verification_code?: string
  role_at_company?: string
  department?: string
  start_date?: string
  end_date?: string
  is_current: boolean
  is_primary: boolean
  verified_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

// Company User Roles
export type CompanyUserRole = 
  | 'admin'        // Full company management access
  | 'hr_manager'   // Employee management access
  | 'employee'     // Basic employee access
  | 'contractor'   // Contract worker access

export interface CompanyUserRoleRecord {
  id: string
  company_id: string
  user_id: string
  role: CompanyUserRole
  permissions: Record<string, boolean>
  granted_by: string
  created_at: string
  updated_at: string
}

// Company Intelligence Insights
export type CompanyInsightType = 
  | 'growth_stage'     // seed, growth, mature
  | 'hiring_trend'     // expanding, stable, contracting
  | 'tech_adoption'    // early_adopter, mainstream, laggard
  | 'market_position'  // leader, challenger, follower
  | 'culture_score'    // work_life_balance, innovation, diversity
  | 'remote_policy'    // remote_first, hybrid, office_only

export interface CompanyIntelligence {
  id: string
  company_id: string
  insight_type: CompanyInsightType
  insight_value: string
  confidence: number
  data_points: Record<string, any>
  source: string
  generated_at: string
  expires_at?: string
}

// Email Domain Management
export type EmailDomainType = 
  | 'corporate'    // Primary company domain
  | 'subsidiary'   // Subsidiary company domain
  | 'legacy'       // Former domain still in use

export interface CompanyEmailDomain {
  id: string
  company_id: string
  domain: string
  domain_type: EmailDomainType
  verified: boolean
  verification_method?: string
  created_at: string
}

// Company Graph Data
export interface CompanyGraphNode {
  id: string
  name: string
  normalized_name: string
  categories: CompanyCategory[]
  relationships: CompanyRelationship[]
  employee_count?: number
  domains: string[]
  verified_users: number
  intelligence_score: number
}

export interface CompanyGraphEdge {
  source: string
  target: string
  relationship_type: CompanyRelationshipType
  confidence: number
  metadata: Record<string, any>
}

export interface CompanyGraph {
  nodes: CompanyGraphNode[]
  edges: CompanyGraphEdge[]
  metadata: {
    total_companies: number
    total_relationships: number
    last_updated: string
  }
}

// API Request/Response Types
export interface CreateCompanyCategoryRequest {
  company_id: string
  category_type: CompanyCategoryType
  category_value: string
  confidence?: number
  source?: string
  metadata?: Record<string, any>
}

export interface CreateCompanyRelationshipRequest {
  parent_company_id: string
  child_company_id: string
  relationship_type: CompanyRelationshipType
  confidence?: number
  source?: string
  metadata?: Record<string, any>
}

export interface VerifyUserCompanyRequest {
  company_name: string
  company_email?: string
  verification_method: VerificationMethod
  role_at_company?: string
  department?: string
  start_date?: string
  is_current?: boolean
  is_primary?: boolean
}

export interface UpdateCompanyUserRoleRequest {
  company_id: string
  user_id: string
  role: CompanyUserRole
  permissions?: Record<string, boolean>
}

export interface CompanySearchFilters {
  categories?: CompanyCategoryType[]
  category_values?: string[]
  size_min?: number
  size_max?: number
  has_verified_users?: boolean
  relationship_types?: CompanyRelationshipType[]
  location?: string
  tech_stack?: string[]
}

export interface CompanyAnalytics {
  total_companies: number
  verified_companies: number
  categories_breakdown: Record<CompanyCategoryType, number>
  size_distribution: Record<string, number>
  top_industries: Array<{ industry: string; count: number }>
  relationship_stats: Record<CompanyRelationshipType, number>
  verification_stats: Record<VerificationStatus, number>
  growth_trends: Array<{
    period: string
    new_companies: number
    new_verifications: number
  }>
}

// Company Discovery & Matching
export interface CompanyDiscoveryResult {
  company: CompanyGraphNode
  match_confidence: number
  match_reasons: string[]
  potential_connections: Array<{
    user_id: string
    user_name: string
    role: string
    connection_type: 'coach' | 'peer' | 'colleague'
  }>
}

export interface CompanyMatchingCriteria {
  user_id: string
  user_goals?: string[]
  user_skills?: string[]
  target_roles?: string[]
  company_preferences?: {
    size?: string[]
    industry?: string[]
    stage?: string[]
    culture?: string[]
  }
  location_preferences?: string[]
  remote_preferences?: string[]
}

// Service Response Types
export interface CompanyServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: Record<string, any>
}

export type CompanyTaggingServiceResponse<T> = CompanyServiceResponse<T>

// Utility Types
export type CompanyWithCategories = CompanyGraphNode & {
  enrichment_data?: Record<string, any>
  linkedin_company_url?: string
  company_domain?: string
  last_enriched?: string
}

export type UserCompanyProfile = {
  user_id: string
  verifications: UserCompanyVerification[]
  current_company?: UserCompanyVerification
  roles: CompanyUserRoleRecord[]
  connection_count: number
}

export type CompanyNetworkAnalysis = {
  company_id: string
  network_size: number
  direct_connections: number
  industry_connections: number
  technology_overlap: string[]
  potential_partnerships: CompanyDiscoveryResult[]
  competitive_landscape: CompanyGraphNode[]
}