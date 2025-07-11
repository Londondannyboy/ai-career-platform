'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

export default function RepoAgentTestPage() {
  const { user } = useUser();
  const [conversation, setConversation] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const sampleConversations = [
    {
      title: 'Career Goal',
      text: `AI: How can I help you with your career today?
User: I want to become a VP of Engineering within the next 2 years.
AI: That's an ambitious goal! What steps are you taking?
User: I'm working on improving my leadership skills and learning system design.`
    },
    {
      title: 'Achievement',
      text: `AI: Tell me about your recent work.
User: I just completed a major project that reduced our infrastructure costs by 47% - saved about $2M annually.
AI: That's impressive! How did you achieve that?
User: By migrating to serverless and optimizing our database queries.`
    },
    {
      title: 'OKR Setting',
      text: `AI: What are your objectives for this quarter?
User: My main objective is to improve team velocity. I want to increase our deployment frequency by 30% and reduce bug count by 25%.
AI: Those are specific, measurable goals. How will you track progress?
User: We're implementing better CI/CD practices and code review standards.`
    },
    {
      title: 'Future Aspiration',
      text: `AI: Where do you see yourself in the future?
User: I'd love to work at a top AI company like OpenAI or Anthropic as a Principal Engineer, focusing on LLM applications.
AI: What attracts you to those companies?
User: Their cutting-edge work in AI and the opportunity to work on products that impact millions.`
    }
  ];

  const analyzeConversation = async (testMode = true) => {
    if (!conversation.trim()) {
      setError('Please enter a conversation');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Parse conversation into messages
      const lines = conversation.trim().split('\n');
      const messages = lines.map(line => {
        const [role, ...content] = line.split(':');
        return {
          role: role.toLowerCase().includes('user') ? 'user' : 'assistant',
          content: content.join(':').trim()
        };
      }).filter(m => m.content);

      const response = await fetch('/api/ai/repo-update-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': user?.id || ''
        },
        body: JSON.stringify({
          messages,
          testMode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadSample = (sample: typeof sampleConversations[0]) => {
    setConversation(sample.text);
    setResult(null);
    setError(null);
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Repository Update Agent Test</CardTitle>
          <CardDescription>
            Test how AI coaching conversations can automatically update your professional repository
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sample Conversations */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Sample Conversations</h3>
            <div className="grid grid-cols-2 gap-2">
              {sampleConversations.map((sample, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => loadSample(sample)}
                >
                  {sample.title}
                </Button>
              ))}
            </div>
          </div>

          {/* Conversation Input */}
          <div>
            <label className="text-sm font-semibold mb-2 block">
              Conversation (format: Role: Message)
            </label>
            <Textarea
              value={conversation}
              onChange={(e) => setConversation(e.target.value)}
              placeholder="AI: How can I help you today?
User: I want to set a new career goal..."
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={() => analyzeConversation(true)}
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Test Analysis
            </Button>
            <Button
              onClick={() => analyzeConversation(false)}
              disabled={loading}
              variant="destructive"
            >
              Apply Updates
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              <Alert variant={result.analysis?.shouldUpdate ? "default" : "secondary"}>
                <MessageSquare className="h-4 w-4" />
                <AlertTitle>Analysis Result</AlertTitle>
                <AlertDescription>
                  {result.analysis?.shouldUpdate ? (
                    <>
                      <Badge className="mr-2">{result.analysis.layer}</Badge>
                      {result.analysis.reason}
                    </>
                  ) : (
                    'No repository updates needed from this conversation'
                  )}
                </AlertDescription>
              </Alert>

              {result.analysis?.shouldUpdate && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Proposed Updates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto">
                      {JSON.stringify(result.analysis.updates, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}

              {result.updateResult && (
                <Alert variant={result.updateResult.success ? "default" : "destructive"}>
                  {result.updateResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>Update Result</AlertTitle>
                  <AlertDescription>{result.message}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}