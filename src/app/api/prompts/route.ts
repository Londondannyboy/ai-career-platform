import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { rows: prompts } = await sql`
      SELECT 
        id,
        prompt_type,
        context_tags,
        name,
        content,
        variables,
        effectiveness_score,
        usage_count,
        created_at
      FROM coaching_prompts
      WHERE active = true
      ORDER BY effectiveness_score DESC, usage_count DESC
    `
    
    return NextResponse.json({
      success: true,
      prompts: prompts || []
    })
    
  } catch (error) {
    console.error('Failed to fetch prompts:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch prompts',
      prompts: []
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()
    
    if (!prompt || !prompt.name || !prompt.content) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 })
    }
    
    // Generate embedding for the new prompt
    const { promptRouter } = await import('@/lib/prompts/promptRouter')
    const promptId = await promptRouter.addPrompt(prompt)
    
    return NextResponse.json({
      success: true,
      promptId
    })
    
  } catch (error) {
    console.error('Failed to create prompt:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create prompt'
    }, { status: 500 })
  }
}