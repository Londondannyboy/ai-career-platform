'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  FileText, 
  Users, 
  MessageCircle,
  ExternalLink,
  Settings,
  Upload
} from 'lucide-react'
import { CompanyWorkspace } from '@/lib/documents/workspaceService'

interface CompanyCardProps {
  workspace: CompanyWorkspace & {
    stats?: {
      totalDocuments: number
      documentTypes: Record<string, number>
      recentActivity: number
      lastActivity: Date
    }
  }
  onEdit?: () => void
}

export default function CompanyCard({ workspace, onEdit }: CompanyCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return `${Math.floor(diffDays / 30)} months ago`
  }

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'public': return 'bg-green-100 text-green-800'
      case 'company': return 'bg-blue-100 text-blue-800'
      case 'team': return 'bg-purple-100 text-purple-800'
      case 'private': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card 
      className="transition-all duration-200 hover:shadow-lg border cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {workspace.displayName}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600">
                {workspace.companyName}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getAccessLevelColor(workspace.accessLevel)}>
              {workspace.accessLevel}
            </Badge>
            {isHovered && onEdit && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit()
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {workspace.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {workspace.description}
          </p>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <FileText className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-lg font-semibold text-gray-900">
                {workspace.stats?.totalDocuments || 0}
              </span>
            </div>
            <p className="text-xs text-gray-600">Documents</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-lg font-semibold text-gray-900">
                {workspace.collaborators.length + 1}
              </span>
            </div>
            <p className="text-xs text-gray-600">Members</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center mb-1">
              <MessageCircle className="h-4 w-4 text-gray-500 mr-1" />
              <span className="text-lg font-semibold text-gray-900">
                {workspace.stats?.recentActivity || 0}
              </span>
            </div>
            <p className="text-xs text-gray-600">Chats</p>
          </div>
        </div>

        {/* Document Types */}
        {workspace.stats?.documentTypes && Object.keys(workspace.stats.documentTypes).length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-700 mb-2">Document Types</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(workspace.stats.documentTypes).slice(0, 3).map(([type, count]) => (
                <Badge key={type} variant="outline" className="text-xs">
                  {type.replace('_', ' ')}: {count}
                </Badge>
              ))}
              {Object.keys(workspace.stats.documentTypes).length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{Object.keys(workspace.stats.documentTypes).length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Last Activity */}
        {workspace.stats?.lastActivity && (
          <p className="text-xs text-gray-500 mb-4">
            Last active: {getTimeAgo(new Date(workspace.stats.lastActivity))}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Link href={`/workspace/${workspace.id}`} className="flex-1">
            <Button size="sm" className="w-full">
              <MessageCircle className="mr-2 h-4 w-4" />
              Open Workspace
            </Button>
          </Link>
          
          <Link href={`/workspace/${workspace.id}/upload`}>
            <Button size="sm" variant="outline">
              <Upload className="h-4 w-4" />
            </Button>
          </Link>
          
          {workspace.companyName.includes('linkedin.com') && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                window.open(workspace.companyName, '_blank')
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}