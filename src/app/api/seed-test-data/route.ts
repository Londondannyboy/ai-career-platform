import { NextRequest, NextResponse } from 'next/server'
import { neonClient } from '@/lib/vector/neonClient'
import { embeddingsService } from '@/lib/vector/embeddings'

export const runtime = 'nodejs'

/**
 * Seed test data for better semantic search testing
 * POST /api/seed-test-data
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Seeding test data...')
    
    // Test companies with diverse profiles
    const testCompanies = [
      {
        company_name: "TechVentures AI",
        linkedin_url: "https://linkedin.com/company/techventures-ai",
        description: "Leading AI and machine learning solutions provider specializing in enterprise automation and predictive analytics. We help Fortune 500 companies transform their operations with cutting-edge artificial intelligence.",
        industry: "Artificial Intelligence",
        employee_count: 250,
        specialties: ["Machine Learning", "Deep Learning", "NLP", "Computer Vision", "MLOps"],
        headquarters: "San Francisco, CA"
      },
      {
        company_name: "FinTech Innovations Ltd",
        linkedin_url: "https://linkedin.com/company/fintech-innovations",
        description: "Revolutionary financial technology company building next-generation payment infrastructure and blockchain solutions for global banks and financial institutions.",
        industry: "Financial Technology",
        employee_count: 500,
        specialties: ["Blockchain", "Digital Payments", "DeFi", "Banking APIs", "Cryptocurrency"],
        headquarters: "London, UK"
      },
      {
        company_name: "DataScale Analytics",
        linkedin_url: "https://linkedin.com/company/datascale",
        description: "Big data analytics and business intelligence platform helping companies make data-driven decisions. We process billions of data points daily for real-time insights.",
        industry: "Data Analytics",
        employee_count: 150,
        specialties: ["Big Data", "Business Intelligence", "Data Warehousing", "ETL", "Real-time Analytics"],
        headquarters: "New York, NY"
      },
      {
        company_name: "CloudFirst Solutions",
        linkedin_url: "https://linkedin.com/company/cloudfirst",
        description: "Cloud infrastructure and DevOps consulting firm specializing in AWS, Azure, and Google Cloud migrations. We've helped 200+ enterprises move to the cloud.",
        industry: "Cloud Computing",
        employee_count: 300,
        specialties: ["AWS", "Azure", "GCP", "Kubernetes", "DevOps", "Cloud Migration"],
        headquarters: "Seattle, WA"
      },
      {
        company_name: "CyberShield Security",
        linkedin_url: "https://linkedin.com/company/cybershield",
        description: "Cybersecurity firm providing enterprise security solutions, penetration testing, and incident response services to protect against modern threats.",
        industry: "Cybersecurity",
        employee_count: 180,
        specialties: ["Penetration Testing", "SOC", "Incident Response", "Zero Trust", "Cloud Security"],
        headquarters: "Austin, TX"
      }
    ]
    
    // Test people with diverse backgrounds
    const testPeople = [
      {
        name: "Sarah Chen",
        linkedin_url: "https://linkedin.com/in/sarahchen-ai",
        username: "sarahchen-ai",
        headline: "VP of Engineering at TechVentures AI | Former Google AI Research",
        summary: "Leading AI engineering teams to build scalable machine learning systems. 15+ years experience in deep learning, computer vision, and MLOps. Passionate about democratizing AI.",
        skills: ["Python", "TensorFlow", "PyTorch", "Machine Learning", "Deep Learning", "Computer Vision", "MLOps", "Team Leadership"],
        current_company_name: "TechVentures AI"
      },
      {
        name: "Michael Thompson",
        linkedin_url: "https://linkedin.com/in/mthompson-fintech",
        username: "mthompson-fintech",
        headline: "Chief Technology Officer at FinTech Innovations | Blockchain Pioneer",
        summary: "Building the future of finance with blockchain and distributed ledger technology. Previously led engineering at Stripe and Square. MIT Computer Science.",
        skills: ["Blockchain", "Solidity", "Distributed Systems", "Cryptography", "System Architecture", "Team Building", "Strategic Planning"],
        current_company_name: "FinTech Innovations Ltd"
      },
      {
        name: "Emily Rodriguez",
        linkedin_url: "https://linkedin.com/in/emirodriguez-data",
        username: "emirodriguez-data",
        headline: "Head of Data Science at DataScale Analytics | Ex-Amazon",
        summary: "Turning data into actionable insights for Fortune 500 companies. Specialized in predictive analytics, recommendation systems, and real-time data processing at scale.",
        skills: ["Data Science", "Machine Learning", "SQL", "Spark", "Python", "Statistics", "A/B Testing", "Product Analytics"],
        current_company_name: "DataScale Analytics"
      },
      {
        name: "James Park",
        linkedin_url: "https://linkedin.com/in/jpark-cloud",
        username: "jpark-cloud",
        headline: "Principal Cloud Architect at CloudFirst Solutions | AWS Certified",
        summary: "Designing and implementing cloud-native architectures for enterprise clients. Expert in multi-cloud strategies, serverless, and container orchestration.",
        skills: ["AWS", "Kubernetes", "Terraform", "Docker", "Serverless", "Cloud Architecture", "DevOps", "CI/CD"],
        current_company_name: "CloudFirst Solutions"
      },
      {
        name: "Lisa Wang",
        linkedin_url: "https://linkedin.com/in/lwang-security",
        username: "lwang-security",
        headline: "Director of Security Engineering at CyberShield | CISSP",
        summary: "Protecting enterprises from cyber threats with proactive security strategies. Specializing in zero-trust architecture and cloud security. Regular speaker at DEF CON.",
        skills: ["Cybersecurity", "Penetration Testing", "Zero Trust", "SIEM", "Incident Response", "Cloud Security", "Security Architecture"],
        current_company_name: "CyberShield Security"
      },
      {
        name: "David Kumar",
        linkedin_url: "https://linkedin.com/in/dkumar-product",
        username: "dkumar-product",
        headline: "Senior Product Manager at TechVentures AI | Stanford MBA",
        summary: "Bridging the gap between AI research and real-world applications. Launched 5 AI products with $50M+ revenue impact. Former consultant at McKinsey.",
        skills: ["Product Management", "AI/ML", "Strategy", "User Research", "Agile", "Data Analysis", "Go-to-Market"],
        current_company_name: "TechVentures AI"
      }
    ]
    
    const results = {
      companies: { success: 0, failed: 0 },
      people: { success: 0, failed: 0 }
    }
    
    // Store companies with embeddings
    for (const company of testCompanies) {
      try {
        const embedding = await embeddingsService.generateCompanyEmbedding(company)
        await neonClient.storeCompanyProfile(company, embedding)
        results.companies.success++
      } catch (error) {
        console.error(`Failed to store ${company.company_name}:`, error)
        results.companies.failed++
      }
    }
    
    // Store people with embeddings
    for (const person of testPeople) {
      try {
        const embedding = await embeddingsService.generatePersonEmbedding(person)
        await neonClient.storePersonProfile(person, embedding)
        results.people.success++
      } catch (error) {
        console.error(`Failed to store ${person.name}:`, error)
        results.people.failed++
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Test data seeded successfully',
      results,
      summary: {
        totalCompanies: results.companies.success,
        totalPeople: results.people.success,
        failed: results.companies.failed + results.people.failed
      }
    })
    
  } catch (error) {
    console.error('Seeding error:', error)
    return NextResponse.json({
      error: 'Failed to seed test data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}