import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { sql } from '@vercel/postgres'

/**
 * Quest Profile API - Handles bite-sized profile completion
 * GET: Load user profile data and completion status
 * POST: Save profile section data
 * PUT: Update completion status
 */

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get basic user info
    const userResult = await sql`
      SELECT * FROM users WHERE id = ${userId} LIMIT 1
    `
    
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userResult.rows[0]

    // Get work experience
    const workExperienceResult = await sql`
      SELECT * FROM user_work_experience 
      WHERE user_id = ${userId} 
      ORDER BY is_current DESC, display_order ASC, created_at DESC
    `

    // Get education
    const educationResult = await sql`
      SELECT * FROM user_education 
      WHERE user_id = ${userId} 
      ORDER BY is_current DESC, display_order ASC, created_at DESC
    `

    // Get certificates
    const certificatesResult = await sql`
      SELECT * FROM user_certificates 
      WHERE user_id = ${userId} 
      ORDER BY display_order ASC, created_at DESC
    `

    // Get skills (from existing user_skills table)
    const skillsResult = await sql`
      SELECT skill_name, skill_category, proficiency_level 
      FROM user_skills 
      WHERE user_id = ${userId} 
      ORDER BY proficiency_level DESC, skill_name ASC
    `

    // Get completion status
    const completionResult = await sql`
      SELECT * FROM user_profile_completion 
      WHERE user_id = ${userId} 
      LIMIT 1
    `

    // Calculate completion automatically if no record exists
    let completionData = completionResult.rows[0]
    if (!completionData) {
      const currentWorkCount = workExperienceResult.rows.filter(w => w.is_current).length
      const pastWorkCount = workExperienceResult.rows.filter(w => !w.is_current).length
      const educationCount = educationResult.rows.length
      const certificatesCount = certificatesResult.rows.length
      const skillsCount = skillsResult.rows.length

      const currentWorkCompleted = currentWorkCount > 0
      const workHistoryCompleted = pastWorkCount > 0
      const educationCompleted = educationCount > 0
      const certificatesCompleted = true // Optional section
      const coreSkillsCompleted = skillsCount >= 3

      // Calculate percentage (certificates are optional)
      const requiredSections = [currentWorkCompleted, workHistoryCompleted, educationCompleted, coreSkillsCompleted]
      const completedRequired = requiredSections.filter(Boolean).length
      const completionPercentage = Math.round((completedRequired / requiredSections.length) * 100)

      // Create initial completion record
      await sql`
        INSERT INTO user_profile_completion (
          user_id, 
          current_work_completed, 
          work_history_completed, 
          education_completed, 
          certificates_completed, 
          core_skills_completed, 
          completion_percentage
        ) VALUES (
          ${userId}, 
          ${currentWorkCompleted}, 
          ${workHistoryCompleted}, 
          ${educationCompleted}, 
          ${certificatesCompleted}, 
          ${coreSkillsCompleted}, 
          ${completionPercentage}
        )
        ON CONFLICT (user_id) DO UPDATE SET
          current_work_completed = EXCLUDED.current_work_completed,
          work_history_completed = EXCLUDED.work_history_completed,
          education_completed = EXCLUDED.education_completed,
          certificates_completed = EXCLUDED.certificates_completed,
          core_skills_completed = EXCLUDED.core_skills_completed,
          completion_percentage = EXCLUDED.completion_percentage,
          updated_at = NOW()
      `

      completionData = {
        current_work_completed: currentWorkCompleted,
        work_history_completed: workHistoryCompleted,
        education_completed: educationCompleted,
        certificates_completed: certificatesCompleted,
        core_skills_completed: coreSkillsCompleted,
        completion_percentage: completionPercentage
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          company: user.company,
          current_role: user.current_role
        },
        workExperience: workExperienceResult.rows,
        education: educationResult.rows,
        certificates: certificatesResult.rows,
        coreSkills: skillsResult.rows.map(s => s.skill_name),
        completion: completionData
      }
    })

  } catch (error) {
    console.error('Error loading profile:', error)
    return NextResponse.json(
      { error: 'Failed to load profile data' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { section, data } = body

    console.log('Saving profile section:', section, 'for user:', userId)

    switch (section) {
      case 'work-experience':
        // Save work experience
        if (data.id) {
          // Update existing
          await sql`
            UPDATE user_work_experience SET
              company_name = ${data.company_name},
              role_title = ${data.role_title},
              period_description = ${data.period_description},
              is_current = ${data.is_current},
              description = ${data.description || ''},
              updated_at = NOW()
            WHERE id = ${data.id} AND user_id = ${userId}
          `
        } else {
          // Create new
          await sql`
            INSERT INTO user_work_experience (
              user_id, company_name, role_title, period_description, 
              is_current, description
            ) VALUES (
              ${userId}, ${data.company_name}, ${data.role_title}, 
              ${data.period_description}, ${data.is_current}, ${data.description || ''}
            )
          `
        }
        break

      case 'education':
        if (data.id) {
          await sql`
            UPDATE user_education SET
              institution_name = ${data.institution_name},
              degree_type = ${data.degree_type},
              field_of_study = ${data.field_of_study},
              period_description = ${data.period_description},
              is_current = ${data.is_current},
              updated_at = NOW()
            WHERE id = ${data.id} AND user_id = ${userId}
          `
        } else {
          await sql`
            INSERT INTO user_education (
              user_id, institution_name, degree_type, field_of_study, 
              period_description, is_current
            ) VALUES (
              ${userId}, ${data.institution_name}, ${data.degree_type}, 
              ${data.field_of_study}, ${data.period_description}, ${data.is_current}
            )
          `
        }
        break

      case 'certificate':
        if (data.id) {
          await sql`
            UPDATE user_certificates SET
              certificate_name = ${data.certificate_name},
              issuing_organization = ${data.issuing_organization},
              issue_date = ${data.issue_date},
              updated_at = NOW()
            WHERE id = ${data.id} AND user_id = ${userId}
          `
        } else {
          await sql`
            INSERT INTO user_certificates (
              user_id, certificate_name, issuing_organization, issue_date
            ) VALUES (
              ${userId}, ${data.certificate_name}, ${data.issuing_organization}, ${data.issue_date}
            )
          `
        }
        break

      case 'skills':
        // Clear existing skills and add new ones
        await sql`DELETE FROM user_skills WHERE user_id = ${userId}`
        
        for (const skill of data.skills) {
          await sql`
            INSERT INTO user_skills (user_id, skill_name, skill_category, proficiency_level)
            VALUES (${userId}, ${skill}, 'core', 4)
            ON CONFLICT (user_id, skill_name) DO NOTHING
          `
        }
        break

      default:
        return NextResponse.json({ error: 'Unknown section' }, { status: 400 })
    }

    // Recalculate completion status
    await recalculateCompletion(userId)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error saving profile:', error)
    return NextResponse.json(
      { error: 'Failed to save profile data' },
      { status: 500 }
    )
  }
}

async function recalculateCompletion(userId: string) {
  try {
    // Get current counts
    const workResult = await sql`
      SELECT 
        COUNT(*) FILTER (WHERE is_current = true) as current_count,
        COUNT(*) FILTER (WHERE is_current = false) as past_count
      FROM user_work_experience WHERE user_id = ${userId}
    `
    
    const educationResult = await sql`
      SELECT COUNT(*) as count FROM user_education WHERE user_id = ${userId}
    `
    
    const skillsResult = await sql`
      SELECT COUNT(*) as count FROM user_skills WHERE user_id = ${userId}
    `

    const work = workResult.rows[0]
    const education = educationResult.rows[0]
    const skills = skillsResult.rows[0]

    const currentWorkCompleted = parseInt(work.current_count) > 0
    const workHistoryCompleted = parseInt(work.past_count) > 0
    const educationCompleted = parseInt(education.count) > 0
    const coreSkillsCompleted = parseInt(skills.count) >= 3

    const requiredSections = [currentWorkCompleted, workHistoryCompleted, educationCompleted, coreSkillsCompleted]
    const completedRequired = requiredSections.filter(Boolean).length
    const completionPercentage = Math.round((completedRequired / requiredSections.length) * 100)

    await sql`
      INSERT INTO user_profile_completion (
        user_id, current_work_completed, work_history_completed, 
        education_completed, certificates_completed, core_skills_completed, 
        completion_percentage
      ) VALUES (
        ${userId}, ${currentWorkCompleted}, ${workHistoryCompleted}, 
        ${educationCompleted}, true, ${coreSkillsCompleted}, 
        ${completionPercentage}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        current_work_completed = EXCLUDED.current_work_completed,
        work_history_completed = EXCLUDED.work_history_completed,
        education_completed = EXCLUDED.education_completed,
        core_skills_completed = EXCLUDED.core_skills_completed,
        completion_percentage = EXCLUDED.completion_percentage,
        updated_at = NOW()
    `
  } catch (error) {
    console.error('Error recalculating completion:', error)
  }
}