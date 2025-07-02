'use client'

import { useState, useCallback } from 'react'
import { useUser } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  X
} from 'lucide-react'

export default function UploadPage() {
  const { user } = useUser()
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string

  const [uploadState, setUploadState] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadResult, setUploadResult] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    documentType: '',
    accessLevel: 'team',
    tags: '',
    description: ''
  })

  const documentTypes = [
    { value: 'product_spec', label: 'Product Specification' },
    { value: 'sales_deck', label: 'Sales Deck' },
    { value: 'case_study', label: 'Case Study' },
    { value: 'pricing', label: 'Pricing Document' },
    { value: 'competitor_analysis', label: 'Competitor Analysis' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'whitepaper', label: 'Whitepaper' }
  ]

  const accessLevels = [
    { value: 'private', label: 'Private (Only you)' },
    { value: 'team', label: 'Team (Team members)' },
    { value: 'company', label: 'Company (All company members)' },
    { value: 'public', label: 'Public (Anyone can view)' }
  ]

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadError(null)
      
      // Auto-populate title if empty
      if (!formData.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
        setFormData(prev => ({ ...prev, title: nameWithoutExt }))
      }
    }
  }, [formData.title])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      setSelectedFile(file)
      setUploadError(null)
      
      if (!formData.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
        setFormData(prev => ({ ...prev, title: nameWithoutExt }))
      }
    }
  }, [formData.title])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ]

    if (!allowedTypes.includes(file.type)) {
      return 'Unsupported file type. Please upload PDF, TXT, DOCX, or PPTX files.'
    }

    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return 'File too large. Maximum size is 50MB.'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setUploadError('Please select a file to upload')
      return
    }

    if (!formData.documentType) {
      setUploadError('Please select a document type')
      return
    }

    const fileError = validateFile(selectedFile)
    if (fileError) {
      setUploadError(fileError)
      return
    }

    setUploadState('uploading')
    setUploadError(null)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)
      uploadFormData.append('title', formData.title || selectedFile.name)
      uploadFormData.append('documentType', formData.documentType)
      uploadFormData.append('accessLevel', formData.accessLevel)
      uploadFormData.append('tags', formData.tags)

      const response = await fetch(`/api/workspace/${workspaceId}/upload`, {
        method: 'POST',
        body: uploadFormData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      setUploadResult(result)
      setUploadState('success')

      // Reset form
      setSelectedFile(null)
      setFormData({
        title: '',
        documentType: '',
        accessLevel: 'team',
        tags: '',
        description: ''
      })

    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
      setUploadState('error')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const resetUpload = () => {
    setUploadState('idle')
    setUploadError(null)
    setUploadResult(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push(`/workspace/${workspaceId}`)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Upload Document</h1>
              <p className="text-gray-600">Add documents to your workspace for AI-powered analysis</p>
            </div>
          </div>
        </div>

        {uploadState === 'success' ? (
          /* Success State */
          <Card className="border-green-200 bg-green-50">
            <CardContent className="text-center py-12">
              <CheckCircle className="mx-auto h-16 w-16 text-green-600 mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">Upload Successful!</h2>
              <p className="text-green-700 mb-6">
                Your document has been processed and is ready for AI analysis.
              </p>
              
              {uploadResult && (
                <div className="bg-white rounded-lg p-4 mb-6 text-left max-w-md mx-auto">
                  <h3 className="font-semibold text-gray-900 mb-2">Processing Results:</h3>
                  <div className="space-y-2 text-sm">
                    <div><strong>Title:</strong> {uploadResult.document?.title}</div>
                    <div><strong>Type:</strong> {uploadResult.document?.type}</div>
                    <div><strong>Processing Time:</strong> {uploadResult.document?.processingTime}ms</div>
                    {uploadResult.document?.autoTags && (
                      <div><strong>Auto Tags:</strong> {uploadResult.document.autoTags.join(', ')}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-center space-x-4">
                <Button onClick={() => router.push(`/workspace/${workspaceId}`)}>
                  View Workspace
                </Button>
                <Button variant="outline" onClick={resetUpload}>
                  Upload Another
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Upload Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* File Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Select Document</CardTitle>
                <CardDescription>
                  Upload PDF, Word documents, PowerPoint presentations, or text files (max 50MB)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    selectedFile
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      <FileText className="mx-auto h-12 w-12 text-green-600" />
                      <div className="font-medium text-green-900">{selectedFile.name}</div>
                      <div className="text-sm text-green-700">
                        {formatFileSize(selectedFile.size)} • {selectedFile.type}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                        className="mt-2"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="font-medium text-gray-900">Click to upload or drag and drop</div>
                      <div className="text-sm text-gray-600">PDF, DOCX, PPTX, TXT files up to 50MB</div>
                      <input
                        type="file"
                        accept=".pdf,.txt,.docx,.pptx"
                        onChange={handleFileSelect}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button type="button" variant="outline" asChild>
                          <span>Select File</span>
                        </Button>
                      </label>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Document Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Document Information</CardTitle>
                <CardDescription>
                  Provide details about your document for better organization and AI analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Document Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter document title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documentType">Document Type *</Label>
                    <Select 
                      value={formData.documentType} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, documentType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accessLevel">Access Level</Label>
                    <Select 
                      value={formData.accessLevel} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, accessLevel: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {accessLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      placeholder="e.g., Q4, strategy, competitive"
                      value={formData.tags}
                      onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {uploadError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-4">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-red-700">{uploadError}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/workspace/${workspaceId}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedFile || !formData.documentType || uploadState === 'uploading'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {uploadState === 'uploading' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Process
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}