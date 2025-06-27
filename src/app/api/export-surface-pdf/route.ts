import { NextRequest, NextResponse } from 'next/server'
import { SurfaceRepo, ExportFormat } from '@/types/tiered-repo'

export async function POST(request: NextRequest) {
  try {
    const { surfaceRepo, format, user } = await request.json()
    
    // For now, return HTML that can be converted to PDF
    // In production, you'd use a library like Puppeteer or jsPDF
    const html = generateHTMLForPDF(surfaceRepo, format, user)
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${surfaceRepo.professional_headline.replace(/\s+/g, '_')}_Resume.html"`
      }
    })

  } catch (error) {
    console.error('PDF export error:', error)
    return NextResponse.json(
      { error: 'Failed to export PDF' },
      { status: 500 }
    )
  }
}

function generatePDFContent(_surfaceRepo: SurfaceRepo, format: ExportFormat, _user: Record<string, unknown>) {
  // Different formats emphasize different aspects
  switch (format) {
    case 'PDF_TECH':
      return {
        emphasize: ['core_skills', 'work_experience', 'portfolio_items'],
        layout: 'technical',
        colors: ['#2563eb', '#1e40af']
      }
    case 'PDF_CREATIVE':
      return {
        emphasize: ['portfolio_items', 'work_experience', 'summary'],
        layout: 'creative',
        colors: ['#7c3aed', '#5b21b6']
      }
    case 'PDF_EXECUTIVE':
      return {
        emphasize: ['work_experience', 'education', 'summary'],
        layout: 'executive',
        colors: ['#1f2937', '#374151']
      }
    case 'PDF_STARTUP':
      return {
        emphasize: ['summary', 'core_skills', 'work_experience'],
        layout: 'startup',
        colors: ['#059669', '#047857']
      }
    default: // PDF_STANDARD
      return {
        emphasize: ['work_experience', 'education', 'core_skills'],
        layout: 'standard',
        colors: ['#374151', '#4b5563']
      }
  }
}

function generateHTMLForPDF(surfaceRepo: SurfaceRepo, format: ExportFormat, user: Record<string, unknown>) {
  const config = generatePDFContent(surfaceRepo, format, user)
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${surfaceRepo.professional_headline} - Resume</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: ${config.colors[0]};
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.5in;
            background: white;
        }
        
        .header {
            text-align: center;
            margin-bottom: 2em;
            border-bottom: 2px solid ${config.colors[1]};
            padding-bottom: 1em;
        }
        
        .name {
            font-size: 2.5em;
            font-weight: bold;
            color: ${config.colors[1]};
            margin-bottom: 0.2em;
        }
        
        .headline {
            font-size: 1.2em;
            color: ${config.colors[0]};
            margin-bottom: 0.5em;
        }
        
        .contact-info {
            font-size: 0.9em;
            color: #666;
        }
        
        .section {
            margin-bottom: 1.5em;
        }
        
        .section-title {
            font-size: 1.3em;
            font-weight: bold;
            color: ${config.colors[1]};
            margin-bottom: 0.5em;
            border-bottom: 1px solid #eee;
            padding-bottom: 0.2em;
        }
        
        .experience-item, .education-item {
            margin-bottom: 1em;
        }
        
        .job-title, .degree {
            font-weight: bold;
            font-size: 1.1em;
            color: ${config.colors[0]};
        }
        
        .company, .institution {
            color: ${config.colors[1]};
            font-weight: 500;
        }
        
        .duration {
            color: #666;
            font-size: 0.9em;
            font-style: italic;
        }
        
        .description {
            margin-top: 0.3em;
            color: #444;
        }
        
        .skills {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5em;
        }
        
        .skill {
            background: ${config.colors[1]};
            color: white;
            padding: 0.2em 0.5em;
            border-radius: 3px;
            font-size: 0.9em;
        }
        
        .summary {
            font-size: 1em;
            line-height: 1.7;
            color: #444;
            text-align: justify;
        }
        
        ${format === 'PDF_TECH' ? `
        .section-title {
            background: linear-gradient(90deg, ${config.colors[1]}, ${config.colors[0]});
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        
        .skill {
            background: linear-gradient(45deg, ${config.colors[1]}, ${config.colors[0]});
        }
        ` : ''}
        
        ${format === 'PDF_CREATIVE' ? `
        .header {
            background: linear-gradient(135deg, ${config.colors[1]}20, ${config.colors[0]}20);
            border-radius: 10px;
            padding: 1.5em;
        }
        
        .section-title {
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        ` : ''}
        
        ${format === 'PDF_EXECUTIVE' ? `
        body {
            font-family: 'Times New Roman', serif;
        }
        
        .name {
            font-family: 'Times New Roman', serif;
            letter-spacing: 2px;
        }
        
        .section-title {
            text-transform: uppercase;
            font-size: 1.1em;
            letter-spacing: 1px;
        }
        ` : ''}
        
        @media print {
            body { margin: 0; padding: 0.5in; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="name">${user?.name || surfaceRepo.professional_headline}</div>
        <div class="headline">${surfaceRepo.professional_headline}</div>
        <div class="contact-info">
            ${user?.email ? `${user.email} • ` : ''}
            ${surfaceRepo.location || ''}
            ${surfaceRepo.current_company ? ` • ${surfaceRepo.current_company}` : ''}
        </div>
    </div>

    ${surfaceRepo.summary ? `
    <div class="section">
        <div class="section-title">Professional Summary</div>
        <div class="summary">${surfaceRepo.summary}</div>
    </div>
    ` : ''}

    ${surfaceRepo.work_experience.length > 0 ? `
    <div class="section">
        <div class="section-title">Professional Experience</div>
        ${surfaceRepo.work_experience.map(exp => `
            <div class="experience-item">
                <div class="job-title">${exp.title}</div>
                <div class="company">${exp.company}</div>
                <div class="duration">${exp.duration}</div>
                ${exp.description ? `<div class="description">${exp.description}</div>` : ''}
                ${exp.achievements && exp.achievements.length > 0 ? `
                    <ul>
                        ${exp.achievements.map(achievement => `<li>${achievement}</li>`).join('')}
                    </ul>
                ` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${surfaceRepo.core_skills.length > 0 ? `
    <div class="section">
        <div class="section-title">Core Skills</div>
        <div class="skills">
            ${surfaceRepo.core_skills.map(skill => `<span class="skill">${skill}</span>`).join('')}
        </div>
    </div>
    ` : ''}

    ${surfaceRepo.education.length > 0 ? `
    <div class="section">
        <div class="section-title">Education</div>
        ${surfaceRepo.education.map(edu => `
            <div class="education-item">
                <div class="degree">${edu.degree}</div>
                <div class="institution">${edu.institution}</div>
                <div class="duration">${edu.field} • ${edu.year}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}

    ${surfaceRepo.certifications.length > 0 ? `
    <div class="section">
        <div class="section-title">Certifications</div>
        ${surfaceRepo.certifications.map(cert => `
            <div class="education-item">
                <div class="degree">${cert.name}</div>
                <div class="institution">${cert.issuer}</div>
                <div class="duration">${cert.date}</div>
            </div>
        `).join('')}
    </div>
    ` : ''}

    <div style="margin-top: 2em; text-align: center; font-size: 0.8em; color: #888;">
        Generated by Quest AI Career Platform
    </div>
</body>
</html>
  `
}