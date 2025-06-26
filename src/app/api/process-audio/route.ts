import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    // Check for API key first
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' }, 
        { status: 500 }
      )
    }

    // Create OpenAI client at runtime, not build time
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    const { audio, mimeType } = await request.json()
    
    if (!audio) {
      return NextResponse.json({ error: 'No audio data provided' }, { status: 400 })
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audio, 'base64')
    
    // Create a File object for OpenAI API
    const audioFile = new File([audioBuffer], 'recording.webm', { type: mimeType })
    
    // Transcribe with Whisper
    console.log('Transcribing audio with Whisper...')
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      response_format: 'text'
    })
    
    console.log('Transcription completed:', transcription.substring(0, 100) + '...')
    
    // Generate AI analysis
    console.log('Generating AI analysis...')
    const analysisPrompt = `
    Analyze this career-related conversation transcript and provide insights:
    
    "${transcription}"
    
    Please provide:
    1. Key themes and topics discussed
    2. Career strengths and skills mentioned
    3. Challenges or concerns identified  
    4. Goals and aspirations
    5. Actionable insights and recommendations
    6. Questions for further reflection
    
    Format your response in a clear, supportive, and professional manner that helps with career development.
    `
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert career coach and counselor. Provide thoughtful, actionable insights based on career conversations.'
        },
        {
          role: 'user', 
          content: analysisPrompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7
    })
    
    const analysis = completion.choices[0]?.message?.content || 'Analysis could not be generated.'
    
    console.log('Analysis completed')
    
    return NextResponse.json({
      transcript: transcription,
      analysis: analysis
    })
    
  } catch (error) {
    console.error('Error processing audio:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API key not configured' }, 
          { status: 500 }
        )
      }
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded' }, 
          { status: 429 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to process audio recording' }, 
      { status: 500 }
    )
  }
}