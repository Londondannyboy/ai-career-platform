'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building2, Info } from 'lucide-react'

interface CompanyDeclarationProps {
  onCompanySet: (company: string) => void
  initialCompany?: string
  isOptional?: boolean
}

export function CompanyDeclaration({ 
  onCompanySet, 
  initialCompany = '',
  isOptional = false 
}: CompanyDeclarationProps) {
  const [company, setCompany] = useState(initialCompany)
  const [showInfo, setShowInfo] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (company.trim() || isOptional) {
      onCompanySet(company.trim())
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="company" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Where do you work?
          {isOptional && <span className="text-sm text-gray-500">(optional)</span>}
        </Label>
        <button
          type="button"
          onClick={() => setShowInfo(!showInfo)}
          className="text-gray-500 hover:text-gray-700"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {showInfo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
          <p className="text-blue-800">
            Declaring your company helps you:
          </p>
          <ul className="mt-2 space-y-1 text-blue-700">
            <li>• Discover colleagues using Quest</li>
            <li>• Connect with coaches and peers</li>
            <li>• Access company-specific programs</li>
          </ul>
          <p className="mt-2 text-blue-600">
            You can verify your company email later for enhanced features.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            id="company"
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g., CK Delta, Acme Corp"
            className="pr-24"
          />
          {company && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Badge variant="outline" className="text-xs">
                Unverified
              </Badge>
            </div>
          )}
        </div>

        {!isOptional && (
          <Button 
            type="submit" 
            disabled={!company.trim()}
            className="w-full"
          >
            Continue
          </Button>
        )}
      </form>

      <p className="text-xs text-gray-500 text-center">
        No verification required to start using Quest
      </p>
    </div>
  )
}

/**
 * Inline company verification component for conversation
 */
export function InlineCompanyVerification({
  company,
  onVerify
}: {
  company: string
  onVerify: () => void
}) {
  return (
    <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1">
      <span className="text-sm text-yellow-800">
        {company}
      </span>
      <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700">
        Unverified
      </Badge>
      <Button
        size="sm"
        variant="ghost"
        onClick={onVerify}
        className="h-6 px-2 text-xs text-yellow-700 hover:text-yellow-900"
      >
        Verify
      </Button>
    </div>
  )
}