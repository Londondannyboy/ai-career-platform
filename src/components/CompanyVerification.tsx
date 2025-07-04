'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
// import { Alert, AlertDescription } from "@/components/ui/alert" // Not available
import { Loader2, Building2, Mail, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { VerificationMethod, VerificationStatus, UserCompanyVerification } from '@/lib/company/types'

interface CompanyVerificationProps {
  userId?: string
  onVerificationComplete?: (verification: UserCompanyVerification) => void
  showExistingVerifications?: boolean
  className?: string
}

interface CompanyVerificationForm {
  company_name: string
  company_email: string
  verification_method: VerificationMethod
  role_at_company: string
  department: string
  start_date: string
  is_current: boolean
  is_primary: boolean
}

export function CompanyVerification({
  userId,
  onVerificationComplete,
  showExistingVerifications = true,
  className = ""
}: CompanyVerificationProps) {
  const [form, setForm] = useState<CompanyVerificationForm>({
    company_name: '',
    company_email: '',
    verification_method: 'self_declaration',
    role_at_company: '',
    department: '',
    start_date: '',
    is_current: true,
    is_primary: true
  })

  const [verificationCode, setVerificationCode] = useState('')
  const [existingVerifications, setExistingVerifications] = useState<UserCompanyVerification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [showCodeInput, setShowCodeInput] = useState(false)
  const [pendingVerification, setPendingVerification] = useState<UserCompanyVerification | null>(null)

  // Load existing verifications
  useEffect(() => {
    if (showExistingVerifications && userId) {
      loadExistingVerifications()
    }
  }, [userId, showExistingVerifications])

  const loadExistingVerifications = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/company/tagging?action=user_verifications')
      const result = await response.json()
      
      if (result.success) {
        setExistingVerifications(result.data || [])
      }
    } catch (error) {
      console.error('Failed to load verifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/company/tagging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_company',
          ...form
        })
      })

      const result = await response.json()

      if (result.success) {
        const verification = result.data
        
        if (verification.verification_method === 'email_domain') {
          setPendingVerification(verification)
          setShowCodeInput(true)
          setMessage({
            type: 'success',
            text: `Verification email sent to ${form.company_email}. Please check your email and enter the code below.`
          })
        } else {
          setMessage({
            type: 'success',
            text: 'Company verification created successfully!'
          })
          onVerificationComplete?.(verification)
          await loadExistingVerifications()
        }

        // Reset form
        setForm({
          company_name: '',
          company_email: '',
          verification_method: 'self_declaration',
          role_at_company: '',
          department: '',
          start_date: '',
          is_current: true,
          is_primary: true
        })
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to create verification'
        })
      }
    } catch (error) {
      console.error('Failed to submit verification:', error)
      setMessage({
        type: 'error',
        text: 'Failed to submit verification. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter verification code' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/company/tagging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_email',
          verification_code: verificationCode
        })
      })

      const result = await response.json()

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Email verification successful! Your company is now verified.'
        })
        setShowCodeInput(false)
        setPendingVerification(null)
        setVerificationCode('')
        onVerificationComplete?.(result.data)
        await loadExistingVerifications()
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Invalid verification code'
        })
      }
    } catch (error) {
      console.error('Failed to verify code:', error)
      setMessage({
        type: 'error',
        text: 'Failed to verify code. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'rejected':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: VerificationStatus) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Existing Verifications */}
      {showExistingVerifications && existingVerifications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Your Company Verifications
            </CardTitle>
            <CardDescription>
              Your current and past company affiliations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {existingVerifications.map((verification) => (
                  <div key={verification.id} className="flex items-start justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{verification.company_name}</h4>
                        {verification.is_current && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                        {verification.is_primary && (
                          <Badge variant="outline" className="text-xs">Primary</Badge>
                        )}
                      </div>
                      {verification.role_at_company && (
                        <p className="text-sm text-gray-600">{verification.role_at_company}</p>
                      )}
                      {verification.department && (
                        <p className="text-sm text-gray-500">{verification.department}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Method: {verification.verification_method.replace('_', ' ')}</span>
                        {verification.start_date && (
                          <span>Since: {new Date(verification.start_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(verification.verification_status)}
                      <Badge className={getStatusColor(verification.verification_status)}>
                        {verification.verification_status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Email Verification Code Input */}
      {showCodeInput && pendingVerification && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Verification
            </CardTitle>
            <CardDescription>
              Enter the verification code sent to {pendingVerification.company_email}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength={6}
              />
            </div>
            <Button 
              onClick={handleVerifyCode} 
              disabled={isSubmitting || !verificationCode.trim()}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                'Verify Email'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* New Verification Form */}
      <Card>
        <CardHeader>
          <CardTitle>Add Company Verification</CardTitle>
          <CardDescription>
            Verify your employment at a company. This helps us connect you with colleagues and provide relevant coaching.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company-name">Company Name *</Label>
                <Input
                  id="company-name"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  placeholder="e.g., Google, Microsoft, Acme Corp"
                  required
                />
              </div>

              <div>
                <Label htmlFor="verification-method">Verification Method</Label>
                <Select
                  value={form.verification_method}
                  onValueChange={(value: VerificationMethod) => 
                    setForm({ ...form, verification_method: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self_declaration">Self Declaration</SelectItem>
                    <SelectItem value="email_domain">Company Email Verification</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.verification_method === 'email_domain' && (
              <div>
                <Label htmlFor="company-email">Company Email *</Label>
                <Input
                  id="company-email"
                  type="email"
                  value={form.company_email}
                  onChange={(e) => setForm({ ...form, company_email: e.target.value })}
                  placeholder="your.name@company.com"
                  required={form.verification_method === 'email_domain'}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Your Role</Label>
                <Input
                  id="role"
                  value={form.role_at_company}
                  onChange={(e) => setForm({ ...form, role_at_company: e.target.value })}
                  placeholder="e.g., Software Engineer, Product Manager"
                />
              </div>

              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  placeholder="e.g., Engineering, Sales, Marketing"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_current}
                  onChange={(e) => setForm({ ...form, is_current: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">I currently work here</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_primary}
                  onChange={(e) => setForm({ ...form, is_primary: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">This is my primary employer</span>
              </label>
            </div>

            {message && (
              <div className={`p-3 rounded-md border ${
                message.type === 'error' 
                  ? 'bg-red-50 border-red-200 text-red-700' 
                  : 'bg-green-50 border-green-200 text-green-700'
              }`}>
                <p className="text-sm">{message.text}</p>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={isSubmitting || !form.company_name.trim()}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Verification...
                </>
              ) : (
                'Add Company Verification'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-sm text-gray-500 space-y-2">
        <p><strong>Verification Methods:</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Self Declaration:</strong> Simply declare your company - verified immediately</li>
          <li><strong>Company Email:</strong> We'll send a verification code to your company email address</li>
        </ul>
        <p className="mt-2">
          Company verification helps us connect you with colleagues and provide relevant coaching content.
          Your information is kept private and secure.
        </p>
      </div>
    </div>
  )
}