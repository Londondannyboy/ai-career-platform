'use client'

// Force this page to be dynamically rendered
export const dynamic = 'force-dynamic'
export const revalidate = 0

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Mic, Square, Play, Pause, Upload, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type RecordingState = 'idle' | 'recording' | 'paused' | 'processing'

export default function RepoPage() {
  const [user, setUser] = useState<any>(null)
  const [recordingState, setRecordingState] = useState<RecordingState>('idle')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [transcript, setTranscript] = useState('')
  const [aiAnalysis, setAiAnalysis] = useState('')
  const [repoSessions, setRepoSessions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkUser()
    loadRepoSessions()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    setUser(user)
  }

  const loadRepoSessions = async () => {
    const { data: sessions } = await supabase
      .from('repo_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
    
    if (sessions) setRepoSessions(sessions)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      
      streamRef.current = stream
      audioChunksRef.current = []
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' })
        setAudioBlob(audioBlob)
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop())
        }
      }
      
      mediaRecorder.start(1000) // Collect data every second
      setRecordingState('recording')
      
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop()
      setRecordingState('idle')
    }
  }

  const processRecording = async () => {
    if (!audioBlob || !user) return
    
    setIsLoading(true)
    setRecordingState('processing')
    
    try {
      // Convert audio blob to base64 for API
      const arrayBuffer = await audioBlob.arrayBuffer()
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      
      // Call your API route to process with Whisper
      const response = await fetch('/api/process-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          audio: base64Audio,
          mimeType: audioBlob.type
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to process audio')
      }
      
      const result = await response.json()
      setTranscript(result.transcript)
      setAiAnalysis(result.analysis)
      
      // Save to database
      const { error } = await supabase
        .from('repo_sessions')
        .insert({
          user_id: user.id,
          title: `Career Session ${new Date().toLocaleDateString()}`,
          transcript: result.transcript,
          ai_analysis: result.analysis,
          audio_url: null, // We'll implement audio storage later
          session_type: 'voice_recording',
          privacy_level: 'private'
        })
      
      if (error) throw error
      
      // Reload sessions
      await loadRepoSessions()
      
    } catch (error) {
      console.error('Error processing recording:', error)
      alert('Failed to process recording. Please try again.')
    } finally {
      setIsLoading(false)
      setRecordingState('idle')
      setAudioBlob(null)
    }
  }

  const getRecordingButtonContent = () => {
    switch (recordingState) {
      case 'recording':
        return (
          <>
            <Square className="h-4 w-4 mr-2" />
            Stop Recording
          </>
        )
      case 'processing':
        return (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        )
      default:
        return (
          <>
            <Mic className="h-4 w-4 mr-2" />
            Start Recording
          </>
        )
    }
  }

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Career Repository</h1>
        <p className="text-muted-foreground">
          Record your career thoughts, experiences, and goals. Our AI will analyze and help you build insights.
        </p>
      </div>

      {/* Recording Interface */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Record a Career Session</CardTitle>
          <CardDescription>
            Share your thoughts about your career journey, challenges, goals, or experiences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={recordingState === 'recording' ? stopRecording : startRecording}
              disabled={recordingState === 'processing' || isLoading}
              variant={recordingState === 'recording' ? 'destructive' : 'default'}
              size="lg"
            >
              {getRecordingButtonContent()}
            </Button>
            
            {audioBlob && recordingState === 'idle' && (
              <Button 
                onClick={processRecording}
                disabled={isLoading}
                variant="secondary"
              >
                <Upload className="h-4 w-4 mr-2" />
                Process Recording
              </Button>
            )}
          </div>
          
          {recordingState === 'recording' && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">Recording in progress...</span>
            </div>
          )}
          
          {audioBlob && recordingState === 'idle' && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Recording completed</p>
              <p className="text-sm text-muted-foreground">
                Click "Process Recording" to transcribe and analyze with AI
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {transcript && (
        <div className="grid gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                value={transcript}
                readOnly
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>
          
          {aiAnalysis && (
            <Card>
              <CardHeader>
                <CardTitle>AI Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{aiAnalysis}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Sessions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Career Sessions</CardTitle>
          <CardDescription>Your private career conversations and insights</CardDescription>
        </CardHeader>
        <CardContent>
          {repoSessions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No sessions yet. Record your first career conversation above!
            </p>
          ) : (
            <div className="space-y-4">
              {repoSessions.map((session) => (
                <div key={session.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{session.title}</h3>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{session.session_type}</Badge>
                      <Badge variant="outline">{session.privacy_level}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {new Date(session.created_at).toLocaleDateString()} at{' '}
                    {new Date(session.created_at).toLocaleTimeString()}
                  </p>
                  {session.transcript && (
                    <p className="text-sm line-clamp-2">{session.transcript.substring(0, 150)}...</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}