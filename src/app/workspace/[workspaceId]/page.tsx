'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Building2,
  FileText,
  MessageCircle,
  Upload,
  Search,
  Users,
  Settings,
  ArrowLeft,
  Send,
  Loader2,
  Download,
  ExternalLink,
  Trash2,
  X
} from 'lucide-react'
import { CompanyWorkspace, WorkspaceDocument, WorkspaceChat } from '@/lib/documents/workspaceService'

export default function WorkspacePage() {
  const { user } = useUser()
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string

  const [workspace, setWorkspace] = useState<CompanyWorkspace | null>(null)
  const [documents, setDocuments] = useState<WorkspaceDocument[]>([])
  const [chatHistory, setChatHistory] = useState<WorkspaceChat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isChatting, setIsChatting] = useState(false)
  const [chatQuery, setChatQuery] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDocumentViewer, setShowDocumentViewer] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<any>(null)

  // Load workspace data
  useEffect(() => {
    const loadWorkspace = async () => {
      if (!user || !workspaceId) return

      try {
        const response = await fetch(`/api/workspace/${workspaceId}`)
        if (response.ok) {
          const data = await response.json()
          setWorkspace(data.workspace)
          setDocuments(data.documents || [])
          setChatHistory(data.chatHistory || [])
        } else if (response.status === 404) {
          router.push('/')
        }
      } catch (error) {
        console.error('Error loading workspace:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadWorkspace()
  }, [user, workspaceId, router])

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatQuery.trim() || isChatting) return

    setIsChatting(true)
    const query = chatQuery.trim()
    setChatQuery('')

    try {
      const response = await fetch(`/api/workspace/${workspaceId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Add to chat history
        const newChat: WorkspaceChat = {
          id: Date.now().toString(),
          userId: user!.id,
          userName: user!.firstName || 'You',
          query,
          response: data.answer,
          documentsUsed: data.documentsUsed.map((d: any) => d.documentId),
          confidence: data.confidence,
          processingTimeMs: data.processingTime,
          timestamp: new Date()
        }
        
        setChatHistory(prev => [newChat, ...prev])
      } else {
        console.error('Chat failed:', response.status)
      }
    } catch (error) {
      console.error('Error in chat:', error)
    } finally {
      setIsChatting(false)
    }
  }

  const handleDeleteWorkspace = async () => {
    if (!workspace || isDeleting) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/workspace/${workspaceId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        router.push('/')
      } else {
        console.error('Failed to delete workspace:', response.status)
      }
    } catch (error) {
      console.error('Error deleting workspace:', error)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }


  const handleViewDocument = async (documentId: string) => {
    try {
      console.log('👀 Loading document:', documentId, 'from workspace:', workspaceId)
      const url = `/api/workspace/${workspaceId}/document/${documentId}`
      console.log('👀 Fetching URL:', url)
      
      const response = await fetch(url)
      console.log('👀 Document response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('👀 Document data received:', data)
        setSelectedDocument(data.document)
        setShowDocumentViewer(true)
      } else {
        const errorText = await response.text()
        console.error('Failed to load document:', response.status, errorText)
        alert(`Failed to load document: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Error loading document:', error)
      alert(`Error loading document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDownloadDocument = async (documentId: string, title: string) => {
    try {
      console.log('💾 Downloading document:', documentId, 'from workspace:', workspaceId)
      const url = `/api/workspace/${workspaceId}/document/${documentId}`
      console.log('💾 Fetching URL:', url)
      
      const response = await fetch(url)
      console.log('💾 Download response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('💾 Download data received:', data)
        const document = data.document
        
        // Create a downloadable file with the document content
        const content = document.content || document.contentPreview || 'No content available'
        const blob = new Blob([content], { type: 'text/plain' })
        const downloadUrl = window.URL.createObjectURL(blob)
        
        // Create download link
        const a = window.document.createElement('a')
        a.href = downloadUrl
        a.download = `${title || 'document'}.txt`
        window.document.body.appendChild(a)
        a.click()
        
        // Cleanup
        window.URL.revokeObjectURL(downloadUrl)
        window.document.body.removeChild(a)
        
        console.log('💾 Download completed successfully')
      } else {
        const errorText = await response.text()
        console.error('Failed to download document:', response.status, errorText)
        alert(`Failed to download document: ${response.status} - ${errorText}`)
      }
    } catch (error) {
      console.error('Error downloading document:', error)
      alert(`Error downloading document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleDeleteDocument = async (documentId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return
    }

    try {
      console.log('🗑️ Deleting document:', documentId)
      const response = await fetch(`/api/workspace/${workspaceId}/document/${documentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        console.log('✅ Document deleted successfully')
        // Refresh documents list
        setDocuments(prev => prev.filter(doc => doc.id !== documentId))
      } else {
        const errorText = await response.text()
        console.error('Failed to delete document:', response.status, errorText)
        alert(`Failed to delete document: ${response.status}`)
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      alert(`Error deleting document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const getDocumentTypeColor = (type: string) => {
    const colors = {
      'product_spec': 'bg-blue-100 text-blue-800',
      'sales_deck': 'bg-green-100 text-green-800',
      'case_study': 'bg-purple-100 text-purple-800',
      'pricing': 'bg-yellow-100 text-yellow-800',
      'competitor_analysis': 'bg-red-100 text-red-800',
      'proposal': 'bg-indigo-100 text-indigo-800',
      'whitepaper': 'bg-gray-100 text-gray-800'
    }
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatTimeAgo = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      const now = new Date()
      const diffMs = now.getTime() - dateObj.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      
      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
      return `${Math.floor(diffMins / 1440)}d ago`
    } catch (error) {
      console.error('Error formatting date:', error)
      return 'Unknown time'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-2 text-gray-600">Loading workspace...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h1 className="mt-4 text-xl font-semibold text-gray-900">Workspace not found</h1>
            <p className="mt-2 text-gray-600">The workspace you're looking for doesn't exist or you don't have access.</p>
            <Button className="mt-4" onClick={() => router.push('/')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center space-x-3">
              <div className="rounded-lg bg-blue-100 p-2">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{workspace.displayName}</h1>
                <p className="text-gray-600">{workspace.companyName}</p>
              </div>
            </div>
            <div className="ml-auto flex items-center space-x-2">
              <Badge className={`${workspace.accessLevel === 'public' ? 'bg-green-100 text-green-800' : 
                workspace.accessLevel === 'company' ? 'bg-blue-100 text-blue-800' : 
                workspace.accessLevel === 'team' ? 'bg-purple-100 text-purple-800' : 
                'bg-gray-100 text-gray-800'}`}>
                {workspace.accessLevel}
              </Badge>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {workspace.description && (
            <p className="text-gray-600 max-w-3xl">{workspace.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Documents Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Document Management</span>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push(`/workspace/${workspaceId}/upload`)}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </Button>
                </CardTitle>
                <CardDescription>
                  Upload and manage documents for AI-powered analysis and search
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Documents List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Documents ({documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map((doc, index) => {
                      try {
                        return (
                          <div key={doc.id || `doc-${index}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-gray-500" />
                              <div>
                                <h4 className="font-medium text-gray-900">{doc.title || 'Untitled Document'}</h4>
                                <div className="flex items-center space-x-2 text-sm text-gray-600">
                                  <Badge className={getDocumentTypeColor(doc.documentType || 'unknown')}>
                                    {(doc.documentType || 'unknown').replace('_', ' ')}
                                  </Badge>
                                  <span>•</span>
                                  <span>{formatTimeAgo(doc.createdAt)}</span>
                                  <span>•</span>
                                  <span>by {doc.uploaderName || 'Unknown'}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDownloadDocument(doc.id, doc.title)}
                                title="Download document"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleViewDocument(doc.id)}
                                title="View document"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteDocument(doc.id, doc.title)}
                                title="Delete document"
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      } catch (renderError) {
                        console.error('Error rendering document:', renderError, doc)
                        return (
                          <div key={`error-${index}`} className="p-3 border rounded-lg bg-red-50">
                            <p className="text-red-600 text-sm">Error loading document {index + 1}</p>
                          </div>
                        )
                      }
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="mx-auto h-12 w-12 text-gray-300" />
                    <p className="mt-2">No documents uploaded yet</p>
                    <p className="text-sm">Upload your first document to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Chat Section */}
          <div className="space-y-6">
            {/* Chat Interface */}
            <Card className="h-96 flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <MessageCircle className="mr-2 h-5 w-5" />
                  AI Chat
                </CardTitle>
                <CardDescription>
                  Ask questions about your documents
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col">
                {/* Chat History */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-48">
                  {chatHistory.length > 0 ? (
                    chatHistory.slice(0, 5).map((chat) => (
                      <div key={chat.id} className="space-y-2">
                        <div className="bg-blue-50 p-2 rounded text-sm">
                          <strong>You:</strong> {chat.query}
                        </div>
                        <div className="bg-gray-50 p-2 rounded text-sm">
                          <strong>AI:</strong> {chat.response}
                          <div className="text-xs text-gray-500 mt-1">
                            Confidence: {chat.confidence}% • {formatTimeAgo(chat.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 text-sm">
                      <MessageCircle className="mx-auto h-8 w-8 text-gray-300 mb-2" />
                      No conversations yet. Ask a question about your documents!
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <form onSubmit={handleChatSubmit} className="flex space-x-2">
                  <Input
                    placeholder="Ask about your documents..."
                    value={chatQuery}
                    onChange={(e) => setChatQuery(e.target.value)}
                    disabled={isChatting || documents.length === 0}
                    className="flex-1"
                  />
                  <Button 
                    type="submit" 
                    size="sm"
                    disabled={isChatting || !chatQuery.trim() || documents.length === 0}
                  >
                    {isChatting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
                
                {documents.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Upload documents first to enable AI chat
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Workspace Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Workspace Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Documents</span>
                    <span className="font-medium">{documents.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">AI Conversations</span>
                    <span className="font-medium">{chatHistory.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Collaborators</span>
                    <span className="font-medium">{workspace.collaborators.length + 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Access Level</span>
                    <Badge className="text-xs">
                      {workspace.accessLevel}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="rounded-full bg-red-100 p-2">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Workspace</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete <strong>"{workspace.displayName}"</strong>?
              </p>
              <p className="text-sm text-gray-600">
                This will permanently delete:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside mt-2 space-y-1">
                <li>{documents.length} document{documents.length !== 1 ? 's' : ''}</li>
                <li>{chatHistory.length} chat conversation{chatHistory.length !== 1 ? 's' : ''}</li>
                <li>All workspace settings and collaborator access</li>
              </ul>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteWorkspace}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Workspace
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}


      {/* Document Viewer Dialog */}
      {showDocumentViewer && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] mx-4 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{selectedDocument.title}</h3>
                  <p className="text-sm text-gray-600">
                    {selectedDocument.documentType?.replace('_', ' ')} • {selectedDocument.fileType}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDocumentViewer(false)
                  setSelectedDocument(null)
                }}
              >
                ✕ Close
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Document Content:</h4>
                <div className="text-sm text-gray-700 whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {selectedDocument.content || selectedDocument.contentPreview || 'No content available'}
                </div>
              </div>

              {selectedDocument.tags && selectedDocument.tags.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDocument.tags.map((tag: string, index: number) => (
                      <Badge key={index} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedDocument.autoTags && selectedDocument.autoTags.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Auto Tags:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDocument.autoTags.map((tag: string, index: number) => (
                      <Badge key={index} className="bg-blue-100 text-blue-800">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 text-xs text-gray-500">
                <p>Uploaded: {formatTimeAgo(selectedDocument.createdAt)}</p>
                <p>Type: {selectedDocument.fileType}</p>
              </div>
            </div>

            <div className="flex space-x-3 mt-4">
              <Button
                onClick={() => handleDownloadDocument(selectedDocument.id, selectedDocument.title)}
                className="flex-1"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowDocumentViewer(false)
                  setSelectedDocument(null)
                }}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}