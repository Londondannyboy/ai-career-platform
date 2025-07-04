import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { companyTaggingService } from '@/lib/company/tagging-service'
import { 
  CreateCompanyCategoryRequest,
  CreateCompanyRelationshipRequest,
  VerifyUserCompanyRequest,
  UpdateCompanyUserRoleRequest,
  CompanySearchFilters
} from '@/lib/company/types'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'add_category': {
        const result = await companyTaggingService.addCompanyCategory(
          params as CreateCompanyCategoryRequest
        )
        return NextResponse.json(result)
      }

      case 'create_relationship': {
        const result = await companyTaggingService.createCompanyRelationship(
          params as CreateCompanyRelationshipRequest
        )
        return NextResponse.json(result)
      }

      case 'verify_company': {
        const result = await companyTaggingService.createUserCompanyVerification(
          userId,
          params as VerifyUserCompanyRequest
        )
        return NextResponse.json(result)
      }

      case 'verify_email': {
        const result = await companyTaggingService.verifyCompanyEmail(
          userId,
          params.verification_code
        )
        return NextResponse.json(result)
      }

      case 'update_role': {
        const result = await companyTaggingService.updateCompanyUserRole(
          params as UpdateCompanyUserRoleRequest,
          userId
        )
        return NextResponse.json(result)
      }

      case 'auto_classify': {
        const result = await companyTaggingService.autoClassifyCompany(
          params.company_id
        )
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Company tagging API error:', error)
    return NextResponse.json(
      { error: 'Failed to process company tagging request' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'categories': {
        const companyId = searchParams.get('company_id')
        if (!companyId) {
          return NextResponse.json({ error: 'company_id required' }, { status: 400 })
        }
        
        const result = await companyTaggingService.getCompanyCategories(companyId)
        return NextResponse.json(result)
      }

      case 'relationships': {
        const companyId = searchParams.get('company_id')
        if (!companyId) {
          return NextResponse.json({ error: 'company_id required' }, { status: 400 })
        }
        
        const result = await companyTaggingService.getCompanyRelationships(companyId)
        return NextResponse.json(result)
      }

      case 'user_verifications': {
        const result = await companyTaggingService.getUserCompanyVerifications(userId)
        return NextResponse.json(result)
      }

      case 'company_roles': {
        const companyId = searchParams.get('company_id')
        if (!companyId) {
          return NextResponse.json({ error: 'company_id required' }, { status: 400 })
        }
        
        const result = await companyTaggingService.getCompanyUserRoles(companyId)
        return NextResponse.json(result)
      }

      case 'search': {
        const filters: CompanySearchFilters = {}
        
        // Parse search filters from query params
        const categories = searchParams.get('categories')
        if (categories) filters.categories = categories.split(',') as any
        
        const sizeMin = searchParams.get('size_min')
        if (sizeMin) filters.size_min = parseInt(sizeMin)
        
        const sizeMax = searchParams.get('size_max')
        if (sizeMax) filters.size_max = parseInt(sizeMax)
        
        const hasVerifiedUsers = searchParams.get('has_verified_users')
        if (hasVerifiedUsers) filters.has_verified_users = hasVerifiedUsers === 'true'
        
        const limit = parseInt(searchParams.get('limit') || '50')
        
        const result = await companyTaggingService.searchCompanies(filters, limit)
        return NextResponse.json(result)
      }

      case 'analytics': {
        const result = await companyTaggingService.getCompanyAnalytics()
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Company tagging API error:', error)
    return NextResponse.json(
      { error: 'Failed to process company tagging request' },
      { status: 500 }
    )
  }
}