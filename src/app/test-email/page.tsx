'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Mail, CheckCircle, AlertCircle } from 'lucide-react'

export default function TestEmailPage() {
  const [email, setEmail] = useState('keegan.dan@gmail.com')
  const [userName, setUserName] = useState('Dan Keegan')
  const [company, setCompany] = useState('Quest AI')
  const [emailType, setEmailType] = useState('welcome')
  const [customMessage, setCustomMessage] = useState('Testing our email system with Mailtrap!')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const emailTypes = [
    { value: 'welcome', label: 'Welcome Email' },
    { value: 'coach_invite', label: 'Coach Invitation' },
    { value: 'external_invite', label: 'External Invitation' },
    { value: 'verification', label: 'Company Verification' },
    { value: 'job_opportunity', label: 'Job Opportunity' },
    { value: 'coaching_feedback', label: 'Coaching Feedback' },
    { value: 'connection_accepted', label: 'Connection Accepted' }
  ]

  const sendTestEmail = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      let requestBody: any = {}

      switch (emailType) {
        case 'welcome':
          requestBody = {
            action: 'send_welcome',
            email,
            userName,
            company
          }
          break
        
        case 'external_invite':
          requestBody = {
            action: 'send_external_invite',
            senderName: 'Quest AI Team',
            senderCompany: 'Quest AI',
            recipientEmail: email,
            recipientName: userName,
            personalizedMessage: customMessage
          }
          break

        case 'verification':
          requestBody = {
            action: 'send_verification',
            userName,
            companyName: company,
            companyEmail: email
          }
          break

        case 'job_opportunity':
          requestBody = {
            action: 'send_job_opportunity',
            userEmail: email,
            userName,
            jobTitle: 'Senior AI Engineer',
            company: 'TechCorp Inc',
            location: 'San Francisco, CA',
            salary: '$150,000 - $200,000',
            matchReasons: ['AI/ML Experience', 'React/TypeScript Skills', 'Startup Experience'],
            description: 'Join our AI team building the future of coaching technology.',
            applyLink: 'https://quest.ai/jobs/senior-ai-engineer'
          }
          break

        case 'coaching_feedback':
          requestBody = {
            action: 'send_coaching_feedback',
            userEmail: email,
            userName,
            sessionDate: new Date().toLocaleDateString(),
            insights: [
              'Strong technical leadership demonstrated',
              'Great communication skills in team meetings',
              'Opportunity to develop strategic thinking'
            ],
            actionItems: [
              'Practice presenting to executive stakeholders',
              'Read "Good Strategy Bad Strategy" by Richard Rumelt',
              'Schedule monthly 1:1s with team members'
            ],
            nextSteps: 'Focus on developing strategic communication skills over the next month'
          }
          break

        case 'connection_accepted':
          requestBody = {
            action: 'send_connection_accepted',
            senderName: userName,
            senderEmail: email,
            recipientName: 'Quest AI Coach',
            connectionType: 'coach',
            responseMessage: 'Looking forward to our coaching sessions!'
          }
          break

        default:
          throw new Error('Unknown email type')
      }

      console.log('Sending email request:', requestBody)

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()
      setResult(data)

      console.log('Email response:', data)
    } catch (error) {
      console.error('Failed to send email:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const testMailtrapConnection = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/email/test')
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Failed to test Mailtrap:', error)
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Email System Test</h1>
          <p className="text-gray-600">Test Quest AI email system with Mailtrap</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mailtrap Connection Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Mailtrap Connection Test
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Test basic Mailtrap API connection and email sending capability.
              </p>
              <Button 
                onClick={testMailtrapConnection}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Testing...
                  </>
                ) : (
                  'Test Mailtrap Connection'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Custom Email Test */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Custom Email Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Recipient Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <Label htmlFor="userName">Recipient Name</Label>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter recipient name"
                />
              </div>

              <div>
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <Label htmlFor="emailType">Email Type</Label>
                <Select value={emailType} onValueChange={setEmailType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {emailTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {emailType === 'external_invite' && (
                <div>
                  <Label htmlFor="customMessage">Personal Message</Label>
                  <Textarea
                    id="customMessage"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Enter personal message"
                    rows={3}
                  />
                </div>
              )}

              <Button 
                onClick={sendTestEmail}
                disabled={isLoading || !email.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  'Send Test Email'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {result && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                )}
                Test Result
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg ${
                result.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <pre className="text-sm overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
              
              {result.success && result.result?.messageId && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Success!</strong> Email sent with Message ID: {result.result.messageId}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Check your Mailtrap inbox to see the email, or check {email} if in production mode.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <h4 className="font-medium mb-2">Mailtrap Configuration:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>API Token: ecbb013b26ab505f43e9c5e0b2abc899</li>
                <li>From Email: notifications@quest.ai</li>
                <li>Test Environment: Sandbox/Demo mode</li>
                <li>Rate Limit: 5 emails/second (free tier)</li>
              </ul>
            </div>
            
            <div className="text-sm">
              <h4 className="font-medium mb-2">Where to Check Results:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Mailtrap Dashboard: Check your inbox for test emails</li>
                <li>Console Logs: Check browser developer tools for detailed logs</li>
                <li>Email Content: Verify templates render correctly with personalization</li>
                <li>Delivery Status: Confirm emails show as "sent" in results</li>
              </ul>
            </div>

            <div className="text-sm">
              <h4 className="font-medium mb-2">Email Types Available:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li><strong>Welcome:</strong> New user onboarding email</li>
                <li><strong>External Invite:</strong> Invite someone to join Quest</li>
                <li><strong>Verification:</strong> Company email verification</li>
                <li><strong>Job Opportunity:</strong> Job match notification</li>
                <li><strong>Coaching Feedback:</strong> Post-session insights</li>
                <li><strong>Connection Accepted:</strong> Coach/peer connection confirmation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}