'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2, Loader2, ExternalLink } from 'lucide-react'
import { AccessLevel } from '@/lib/documents/workspaceService'

interface CreateCompanyModalProps {
  isOpen: boolean
  onClose: () => void
  onCompanyCreated?: () => void
}

export default function CreateCompanyModal({ 
  isOpen, 
  onClose, 
  onCompanyCreated 
}: CreateCompanyModalProps) {
  const { user } = useUser()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    companyName: '',
    displayName: '',
    description: '',
    accessLevel: 'private' as AccessLevel,
    linkedinUrl: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-populate display name if it's empty
    if (field === 'companyName' && !formData.displayName) {
      setFormData(prev => ({ ...prev, displayName: value }))
    }
    
    // Clear error when user starts typing
    if (error) setError(null)
  }

  const validateLinkedInUrl = (url: string): boolean => {
    if (!url) return true // Optional field
    const linkedinPattern = /^https:\/\/(www\.)?linkedin\.com\/company\/[a-zA-Z0-9-]+\/?$/
    return linkedinPattern.test(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('User not authenticated')
      return
    }

    console.log('🔍 Debug - User authenticated:', !!user)
    console.log('🔍 Debug - User ID:', user.id)

    // Validation
    if (!formData.companyName.trim()) {
      setError('Company name is required')
      return
    }
    
    if (!formData.displayName.trim()) {
      setError('Display name is required')
      return
    }

    if (formData.linkedinUrl && !validateLinkedInUrl(formData.linkedinUrl)) {
      setError('Please enter a valid LinkedIn company URL (e.g., https://linkedin.com/company/your-company)')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Use LinkedIn URL as company identifier if provided, otherwise use display name
      const companyIdentifier = formData.linkedinUrl || formData.companyName

      console.log('🔍 Debug - Sending request with data:', {
        companyName: companyIdentifier,
        displayName: formData.displayName,
        description: formData.description,
        accessLevel: formData.accessLevel
      })

      const response = await fetch('/api/workspace/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: companyIdentifier,
          displayName: formData.displayName,
          description: formData.description,
          accessLevel: formData.accessLevel
        }),
      })

      console.log('🔍 Debug - Response status:', response.status)
      console.log('🔍 Debug - Response ok:', response.ok)

      if (!response.ok) {
        const errorData = await response.json()
        console.log('🔍 Debug - Error response:', errorData)
        throw new Error(errorData.error || 'Failed to create workspace')
      }

      const data = await response.json()
      console.log('✅ Workspace created:', data.workspace)

      // Reset form
      setFormData({
        companyName: '',
        displayName: '',
        description: '',
        accessLevel: 'private',
        linkedinUrl: ''
      })

      // Close modal and refresh
      if (onCompanyCreated) {
        onCompanyCreated()
      }
      onClose()

    } catch (error) {
      console.error('❌ Failed to create workspace:', error)
      setError(error instanceof Error ? error.message : 'Failed to create workspace')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        companyName: '',
        displayName: '',
        description: '',
        accessLevel: 'private',
        linkedinUrl: ''
      })
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Building2 className="mr-2 h-5 w-5" />
            Create Company Workspace
          </DialogTitle>
          <DialogDescription>
            Create a new company workspace to manage documents, collaborate with team members, and leverage AI-powered insights.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* LinkedIn URL (Primary Identifier) */}
          <div className="space-y-2">
            <Label htmlFor="linkedinUrl" className="flex items-center">
              LinkedIn Company URL
              <span className="ml-1 text-xs text-gray-500">(optional but recommended)</span>
            </Label>
            <div className="relative">
              <Input
                id="linkedinUrl"
                type="url"
                placeholder="https://linkedin.com/company/your-company"
                value={formData.linkedinUrl}
                onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                disabled={isLoading}
                className="pl-10"
              />
              <ExternalLink className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
            <p className="text-xs text-gray-600">
              Using LinkedIn URL ensures unique identification and enables future integrations
            </p>
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="companyName"
              placeholder="Enter your company name"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">
              Workspace Display Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="displayName"
              placeholder="How should this workspace be displayed?"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-600">
              This is how the workspace will appear in your dashboard
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe this workspace and its purpose..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Access Level */}
          <div className="space-y-2">
            <Label htmlFor="accessLevel">Access Level</Label>
            <Select 
              value={formData.accessLevel} 
              onValueChange={(value) => handleInputChange('accessLevel', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select access level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Private</span>
                    <span className="text-xs text-gray-600">Only you can access</span>
                  </div>
                </SelectItem>
                <SelectItem value="team">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Team</span>
                    <span className="text-xs text-gray-600">Team members can access</span>
                  </div>
                </SelectItem>
                <SelectItem value="company">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Company</span>
                    <span className="text-xs text-gray-600">All company members can access</span>
                  </div>
                </SelectItem>
                <SelectItem value="public">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Public</span>
                    <span className="text-xs text-gray-600">Anyone can view</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Building2 className="mr-2 h-4 w-4" />
                  Create Workspace
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}