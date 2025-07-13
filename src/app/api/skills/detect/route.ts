import { NextRequest, NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

// Schema for AI skill detection
const skillDetectionSchema = z.object({
  skills: z.array(z.object({
    name: z.string(),
    category: z.enum(['technical', 'leadership', 'marketing', 'design', 'data', 'business', 'communication', 'other']),
    confidence: z.number().min(0).max(1),
    reason: z.string(),
    normalized: z.string()
  })),
  context: z.string(),
  shouldDetect: z.boolean()
});

export async function POST(request: NextRequest) {
  try {
    const { message, userId, existingSkills = [], pendingSkills = [] } = await request.json();

    if (!message || !userId) {
      return NextResponse.json({ error: 'Missing message or userId' }, { status: 400 });
    }

    // Use GPT-4 to intelligently detect skills from natural conversation
    const result = await analyzeMessageForSkills(message, existingSkills, pendingSkills);

    if (result && result.shouldDetect && result.skills.length > 0) {
      // Filter out skills that already exist or are pending
      const newSkills = result.skills.filter(skill => {
        const skillName = skill.name.toLowerCase();
        const hasExisting = existingSkills.some((existing: string) => 
          existing.toLowerCase() === skillName
        );
        const hasPending = pendingSkills.some((pending: string) => 
          pending.toLowerCase() === skillName
        );
        return !hasExisting && !hasPending && skill.confidence > 0.7;
      });

      return NextResponse.json({ 
        skills: newSkills,
        context: result.context
      });
    }

    return NextResponse.json({ skills: [] });

  } catch (error) {
    console.error('Error in AI skill detection:', error);
    return NextResponse.json({ error: 'Failed to detect skills' }, { status: 500 });
  }
}

async function analyzeMessageForSkills(
  message: string, 
  existingSkills: string[], 
  pendingSkills: string[]
) {
  try {
    const systemPrompt = `You are an AI expert at detecting professional skills mentioned in natural conversation.

TASK: Analyze the user's message and detect any professional skills they mention, even if expressed casually or indirectly.

DETECTION RULES:
1. Look for direct mentions: "I know JavaScript", "I do marketing"
2. Look for indirect mentions: "I'm a developer", "I work in sales", "I design websites"
3. Look for experience-based mentions: "I've been coding", "I manage teams", "I analyze data"
4. Consider broader terms: "development" = "Software Development", "analytics" = "Data Analytics"

SKILL CATEGORIES:
- technical: programming, software, web development, databases, cloud, etc.
- leadership: management, team leadership, mentoring, strategy
- marketing: digital marketing, SEO, social media, growth, advertising
- design: UI/UX, graphic design, product design, visual design
- data: analytics, data science, statistics, machine learning, AI
- business: project management, operations, finance, consulting
- communication: writing, presentation, public speaking, negotiation
- other: skills that don't fit above categories

CONFIDENCE SCORING:
- 0.9-1.0: Direct explicit mention ("I know Python")
- 0.8-0.9: Clear professional context ("I'm a developer")
- 0.7-0.8: Indirect but clear ("I've been coding for years")
- 0.6-0.7: Implied skill ("I build websites")
- <0.6: Too vague to detect

NORMALIZATION:
- "development" → "Software Development"
- "coding" → "Programming"  
- "web" → "Web Development"
- "marketing" → "Marketing"
- "analytics" → "Data Analytics"

Only detect skills with confidence > 0.7 and real professional value.

Current skills: ${existingSkills.join(', ')}
Pending skills: ${pendingSkills.join(', ')}`;

    const result = await generateObject({
      model: openai('gpt-4'),
      schema: skillDetectionSchema,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this message for professional skills: "${message}"` }
      ]
    });

    return result.object;
  } catch (error) {
    console.error('AI skill detection error:', error);
    return null;
  }
}