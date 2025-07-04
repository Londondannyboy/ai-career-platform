/**
 * Company Graph Tagging Service
 * Comprehensive service for company classification, verification, and graph management
 */

import { createClient } from '@/lib/supabase/client'
import { 
  CompanyCategory,
  CompanyRelationship, 
  UserCompanyVerification,
  CompanyUserRoleRecord,
  CompanyIntelligence,
  CompanyEmailDomain,
  CompanyGraph,
  CompanyCategoryType,
  CompanyRelationshipType,
  VerificationMethod,
  VerificationStatus,
  CompanyUserRole,
  CompanyInsightType,
  CreateCompanyCategoryRequest,
  CreateCompanyRelationshipRequest,
  VerifyUserCompanyRequest,
  UpdateCompanyUserRoleRequest,
  CompanySearchFilters,
  CompanyAnalytics,
  CompanyDiscoveryResult,
  CompanyTaggingServiceResponse,
  CompanyWithCategories,
  UserCompanyProfile
} from './types'

export class CompanyTaggingService {
  private supabase = createClient()

  // ========== Company Categories ==========

  /**
   * Add category to company
   */
  async addCompanyCategory(
    request: CreateCompanyCategoryRequest
  ): Promise<CompanyTaggingServiceResponse<CompanyCategory>> {
    try {
      const { data, error } = await this.supabase
        .from('company_categories')
        .insert({
          company_id: request.company_id,
          category_type: request.category_type,
          category_value: request.category_value,
          confidence: request.confidence || 1.0,
          source: request.source || 'manual',
          metadata: request.metadata || {}
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Failed to add company category:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get categories for company
   */
  async getCompanyCategories(
    companyId: string
  ): Promise<CompanyTaggingServiceResponse<CompanyCategory[]>> {
    try {
      const { data, error } = await this.supabase
        .from('company_categories')
        .select('*')
        .eq('company_id', companyId)
        .order('confidence', { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Failed to get company categories:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Update company category
   */
  async updateCompanyCategory(
    categoryId: string,
    updates: Partial<CompanyCategory>
  ): Promise<CompanyTaggingServiceResponse<CompanyCategory>> {
    try {
      const { data, error } = await this.supabase
        .from('company_categories')
        .update(updates)
        .eq('id', categoryId)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Failed to update company category:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Delete company category
   */
  async deleteCompanyCategory(
    categoryId: string
  ): Promise<CompanyTaggingServiceResponse<void>> {
    try {
      const { error } = await this.supabase
        .from('company_categories')
        .delete()
        .eq('id', categoryId)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Failed to delete company category:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // ========== Company Relationships ==========

  /**
   * Create company relationship
   */
  async createCompanyRelationship(
    request: CreateCompanyRelationshipRequest
  ): Promise<CompanyTaggingServiceResponse<CompanyRelationship>> {
    try {
      const { data, error } = await this.supabase
        .from('company_relationships')
        .insert({
          parent_company_id: request.parent_company_id,
          child_company_id: request.child_company_id,
          relationship_type: request.relationship_type,
          confidence: request.confidence || 1.0,
          source: request.source || 'manual',
          metadata: request.metadata || {}
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Failed to create company relationship:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get company relationships
   */
  async getCompanyRelationships(
    companyId: string
  ): Promise<CompanyTaggingServiceResponse<CompanyRelationship[]>> {
    try {
      const { data, error } = await this.supabase
        .from('company_relationships')
        .select('*')
        .or(`parent_company_id.eq.${companyId},child_company_id.eq.${companyId}`)
        .order('confidence', { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Failed to get company relationships:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // ========== User-Company Verification ==========

  /**
   * Create user-company verification
   */
  async createUserCompanyVerification(
    userId: string,
    request: VerifyUserCompanyRequest
  ): Promise<CompanyTaggingServiceResponse<UserCompanyVerification>> {
    try {
      // First, find or create the company
      const companyResult = await this.findOrCreateCompany(request.company_name)
      if (!companyResult.success || !companyResult.data) {
        return { success: false, error: 'Failed to find or create company' }
      }

      // Generate verification code if email verification
      const verificationCode = request.verification_method === 'email_domain' 
        ? this.generateVerificationCode() 
        : undefined

      const expiresAt = request.verification_method === 'email_domain'
        ? new Date(Date.now() + 60 * 60 * 1000) // 1 hour
        : undefined

      const { data, error } = await this.supabase
        .from('user_company_verifications')
        .insert({
          user_id: userId,
          company_id: companyResult.data.id,
          company_name: request.company_name,
          company_email: request.company_email,
          verification_method: request.verification_method,
          verification_status: request.verification_method === 'self_declaration' ? 'verified' : 'pending',
          verification_code: verificationCode,
          role_at_company: request.role_at_company,
          department: request.department,
          start_date: request.start_date,
          is_current: request.is_current ?? true,
          is_primary: request.is_primary ?? true,
          expires_at: expiresAt?.toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Send verification email if needed
      if (request.verification_method === 'email_domain' && request.company_email && verificationCode) {
        await this.sendVerificationEmail(
          userId,
          request.company_email,
          request.company_name,
          verificationCode
        )
      }

      return { success: true, data }
    } catch (error) {
      console.error('Failed to create user-company verification:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Verify company email with code
   */
  async verifyCompanyEmail(
    userId: string,
    verificationCode: string
  ): Promise<CompanyTaggingServiceResponse<UserCompanyVerification>> {
    try {
      // Find pending verification
      const { data: verification, error: fetchError } = await this.supabase
        .from('user_company_verifications')
        .select('*')
        .eq('user_id', userId)
        .eq('verification_code', verificationCode)
        .eq('verification_status', 'pending')
        .gte('expires_at', new Date().toISOString())
        .single()

      if (fetchError || !verification) {
        return { success: false, error: 'Invalid or expired verification code' }
      }

      // Update verification status
      const { data, error } = await this.supabase
        .from('user_company_verifications')
        .update({
          verification_status: 'verified',
          verified_at: new Date().toISOString()
        })
        .eq('id', verification.id)
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Failed to verify company email:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get user's company verifications
   */
  async getUserCompanyVerifications(
    userId: string
  ): Promise<CompanyTaggingServiceResponse<UserCompanyVerification[]>> {
    try {
      const { data, error } = await this.supabase
        .from('user_company_verifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Failed to get user company verifications:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // ========== Company User Roles ==========

  /**
   * Update user role at company
   */
  async updateCompanyUserRole(
    request: UpdateCompanyUserRoleRequest,
    grantedBy: string
  ): Promise<CompanyTaggingServiceResponse<CompanyUserRoleRecord>> {
    try {
      const { data, error } = await this.supabase
        .from('company_user_roles')
        .upsert({
          company_id: request.company_id,
          user_id: request.user_id,
          role: request.role,
          permissions: request.permissions || {},
          granted_by: grantedBy
        }, {
          onConflict: 'company_id,user_id'
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, data }
    } catch (error) {
      console.error('Failed to update company user role:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get company user roles
   */
  async getCompanyUserRoles(
    companyId: string
  ): Promise<CompanyTaggingServiceResponse<CompanyUserRoleRecord[]>> {
    try {
      const { data, error } = await this.supabase
        .from('company_user_roles')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Failed to get company user roles:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // ========== Company Search & Discovery ==========

  /**
   * Search companies with filters
   */
  async searchCompanies(
    filters: CompanySearchFilters,
    limit: number = 50
  ): Promise<CompanyTaggingServiceResponse<CompanyWithCategories[]>> {
    try {
      let query = this.supabase
        .from('company_enrichments')
        .select(`
          *,
          company_categories (*)
        `)

      // Apply filters
      if (filters.size_min !== undefined) {
        query = query.gte('employee_count', filters.size_min)
      }
      if (filters.size_max !== undefined) {
        query = query.lte('employee_count', filters.size_max)
      }

      const { data, error } = await query
        .limit(limit)
        .order('employee_count', { ascending: false })

      if (error) throw error

      return { success: true, data: data || [] }
    } catch (error) {
      console.error('Failed to search companies:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Get company analytics
   */
  async getCompanyAnalytics(): Promise<CompanyTaggingServiceResponse<CompanyAnalytics>> {
    try {
      // Get basic counts
      const { count: totalCompanies } = await this.supabase
        .from('company_enrichments')
        .select('*', { count: 'exact', head: true })

      const { count: verifiedCompanies } = await this.supabase
        .from('user_company_verifications')
        .select('company_id', { count: 'exact', head: true })
        .eq('verification_status', 'verified')

      // Get category breakdown
      const { data: categoryData } = await this.supabase
        .from('company_categories')
        .select('category_type, category_value')

      const categoriesBreakdown: Record<string, number> = {}
      categoryData?.forEach(cat => {
        categoriesBreakdown[cat.category_type] = (categoriesBreakdown[cat.category_type] || 0) + 1
      })

      const analytics: CompanyAnalytics = {
        total_companies: totalCompanies || 0,
        verified_companies: verifiedCompanies || 0,
        categories_breakdown: categoriesBreakdown as any,
        size_distribution: {},
        top_industries: [],
        relationship_stats: {} as any,
        verification_stats: {} as any,
        growth_trends: []
      }

      return { success: true, data: analytics }
    } catch (error) {
      console.error('Failed to get company analytics:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  // ========== Helper Methods ==========

  /**
   * Find or create company by name
   */
  private async findOrCreateCompany(companyName: string) {
    try {
      const normalizedName = companyName.toLowerCase().trim()

      // Try to find existing company
      const { data: existing } = await this.supabase
        .from('company_enrichments')
        .select('*')
        .eq('normalized_name', normalizedName)
        .single()

      if (existing) {
        return { success: true, data: existing }
      }

      // Create new company
      const { data: newCompany, error } = await this.supabase
        .from('company_enrichments')
        .insert({
          company_name: companyName,
          normalized_name: normalizedName,
          canonical_identifier: normalizedName
        })
        .select()
        .single()

      if (error) throw error

      return { success: true, data: newCompany }
    } catch (error) {
      console.error('Failed to find or create company:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }

  /**
   * Generate verification code
   */
  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Send verification email
   */
  private async sendVerificationEmail(
    userId: string,
    email: string,
    companyName: string,
    code: string
  ): Promise<void> {
    // This will integrate with the email service we created earlier
    try {
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_verification',
          userName: userId, // TODO: Get actual user name
          companyName,
          companyEmail: email
        })
      })

      if (!response.ok) {
        console.error('Failed to send verification email:', await response.text())
      }
    } catch (error) {
      console.error('Failed to send verification email:', error)
    }
  }

  /**
   * Auto-classify company based on available data
   */
  async autoClassifyCompany(
    companyId: string
  ): Promise<CompanyTaggingServiceResponse<CompanyCategory[]>> {
    try {
      // Get company data
      const { data: company } = await this.supabase
        .from('company_enrichments')
        .select('*')
        .eq('id', companyId)
        .single()

      if (!company) {
        return { success: false, error: 'Company not found' }
      }

      const categories: CreateCompanyCategoryRequest[] = []

      // Size classification based on employee count
      if (company.employee_count) {
        let sizeCategory = 'unknown'
        if (company.employee_count < 10) sizeCategory = 'startup'
        else if (company.employee_count < 50) sizeCategory = 'small'
        else if (company.employee_count < 250) sizeCategory = 'medium'
        else if (company.employee_count < 1000) sizeCategory = 'large'
        else sizeCategory = 'enterprise'

        categories.push({
          company_id: companyId,
          category_type: 'size',
          category_value: sizeCategory,
          confidence: 0.9,
          source: 'ai_classified'
        })
      }

      // Industry classification based on company name/domain
      const companyNameLower = company.company_name.toLowerCase()
      if (companyNameLower.includes('tech') || companyNameLower.includes('software')) {
        categories.push({
          company_id: companyId,
          category_type: 'industry',
          category_value: 'technology',
          confidence: 0.7,
          source: 'ai_classified'
        })
      }

      // Create categories
      const results = []
      for (const categoryRequest of categories) {
        const result = await this.addCompanyCategory(categoryRequest)
        if (result.success && result.data) {
          results.push(result.data)
        }
      }

      return { success: true, data: results }
    } catch (error) {
      console.error('Failed to auto-classify company:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }
    }
  }
}

// Export singleton instance
export const companyTaggingService = new CompanyTaggingService()