import { Driver } from 'neo4j-driver'
import { getDriver } from './client'

export class DataMagnetGraphService {
  private driver: Driver

  constructor() {
    this.driver = getDriver()
  }

  /**
   * Store a person profile from DataMagnet in Neo4j
   */
  async storePersonProfile(profileData: any) {
    const session = this.driver.session()
    
    try {
      // Create or update the main person node
      await session.run(
        `
        MERGE (p:Person {linkedinUrl: $linkedinUrl})
        SET p.name = $name,
            p.displayName = $displayName,
            p.jobTitle = $jobTitle,
            p.profileHeadline = $profileHeadline,
            p.currentCompany = $currentCompany,
            p.location = $location,
            p.followers = $followers,
            p.lastUpdated = datetime()
        `,
        {
          linkedinUrl: profileData.linkedin_url || profileData.url,
          name: profileData.display_name,
          displayName: profileData.display_name,
          jobTitle: profileData.job_title,
          profileHeadline: profileData.profile_headline,
          currentCompany: profileData.current_company_name,
          location: profileData.location,
          followers: profileData.followers || 0
        }
      )

      // Store recommendations as relationships
      if (profileData.recommendations && profileData.recommendations.length > 0) {
        for (const rec of profileData.recommendations) {
          await session.run(
            `
            MERGE (recommender:Person {name: $recommenderName})
            SET recommender.title = $recommenderTitle
            MERGE (p:Person {linkedinUrl: $profileUrl})
            MERGE (recommender)-[r:RECOMMENDS]->(p)
            SET r.text = $text,
                r.relationshipType = $relationshipType,
                r.timestamp = datetime()
            `,
            {
              recommenderName: rec.recommender_name || 'Anonymous',
              recommenderTitle: rec.recommender_title || '',
              profileUrl: profileData.linkedin_url || profileData.url,
              text: rec.text || rec.recommendation || '',
              relationshipType: this.extractRelationshipType(rec.text || rec.recommendation || '')
            }
          )
        }
      }

      // Store "Also Viewed" as network relationships
      if (profileData.also_viewed && profileData.also_viewed.length > 0) {
        for (const person of profileData.also_viewed) {
          await session.run(
            `
            MERGE (viewed:Person {linkedinUrl: $viewedUrl})
            SET viewed.name = $name,
                viewed.firstName = $firstName,
                viewed.lastName = $lastName,
                viewed.headline = $headline,
                viewed.followers = $followers
            MERGE (p:Person {linkedinUrl: $profileUrl})
            MERGE (p)-[r:NETWORK_CLUSTER]->(viewed)
            SET r.source = 'also_viewed',
                r.timestamp = datetime()
            `,
            {
              viewedUrl: person.url || person.public_identifier,
              name: `${person.first_name} ${person.last_name}`,
              firstName: person.first_name,
              lastName: person.last_name,
              headline: person.headline,
              followers: person.follower_count || 0,
              profileUrl: profileData.linkedin_url || profileData.url
            }
          )
        }
      }

      return { success: true, message: 'Profile stored successfully' }
    } catch (error) {
      console.error('Error storing profile in Neo4j:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  /**
   * Store a company from DataMagnet in Neo4j
   */
  async storeCompany(companyData: any) {
    const session = this.driver.session()
    
    try {
      // Create or update the company node
      await session.run(
        `
        MERGE (c:Company {linkedinUrl: $linkedinUrl})
        SET c.name = $name,
            c.industry = $industry,
            c.companyType = $companyType,
            c.employees = $employees,
            c.followers = $followers,
            c.description = $description,
            c.headcount = $headcount,
            c.lastUpdated = datetime()
        `,
        {
          linkedinUrl: companyData.formatted_url || companyData.url,
          name: companyData.company_name,
          industry: companyData.industry,
          companyType: companyData.company_type,
          employees: companyData.employees || 0,
          followers: companyData.followers || 0,
          description: companyData.description || '',
          headcount: companyData.headcount || ''
        }
      )

      // Store company locations
      if (companyData.all_locations && companyData.all_locations.length > 0) {
        for (const location of companyData.all_locations) {
          await session.run(
            `
            MERGE (l:Location {name: $location})
            MERGE (c:Company {linkedinUrl: $companyUrl})
            MERGE (c)-[:LOCATED_IN]->(l)
            `,
            {
              location: location,
              companyUrl: companyData.formatted_url || companyData.url
            }
          )
        }
      }

      // Store key employees
      if (companyData.employees_data && companyData.employees_data.length > 0) {
        for (const employee of companyData.employees_data) {
          await session.run(
            `
            MERGE (e:Person {linkedinUrl: $employeeUrl})
            SET e.name = $name,
                e.title = $title,
                e.profileImage = $image
            MERGE (c:Company {linkedinUrl: $companyUrl})
            MERGE (e)-[:WORKS_AT]->(c)
            `,
            {
              employeeUrl: employee.link,
              name: employee.title,
              title: employee.subtitle,
              image: employee.img || null,
              companyUrl: companyData.formatted_url || companyData.url
            }
          )
        }
      }

      return { success: true, message: 'Company stored successfully' }
    } catch (error) {
      console.error('Error storing company in Neo4j:', error)
      throw error
    } finally {
      await session.close()
    }
  }

  /**
   * Get relationship graph for a person
   */
  async getPersonGraph(linkedinUrl: string) {
    const session = this.driver.session()
    
    try {
      const result = await session.run(
        `
        MATCH (p:Person {linkedinUrl: $linkedinUrl})
        OPTIONAL MATCH (p)<-[r1:RECOMMENDS]-(recommender:Person)
        OPTIONAL MATCH (p)-[r2:NETWORK_CLUSTER]->(networked:Person)
        OPTIONAL MATCH (p)-[r3:WORKS_AT]->(company:Company)
        RETURN p,
               collect(DISTINCT {
                 node: recommender,
                 relationship: r1,
                 type: 'recommendation'
               }) as recommendations,
               collect(DISTINCT {
                 node: networked,
                 relationship: r2,
                 type: 'network'
               }) as networkClusters,
               company
        `,
        { linkedinUrl }
      )

      if (result.records.length === 0) {
        return null
      }

      const record = result.records[0]
      const person = record.get('p').properties
      const company = record.get('company')?.properties
      const recommendations = record.get('recommendations')
      const networkClusters = record.get('networkClusters')

      return {
        person,
        company,
        relationships: {
          recommendations: recommendations.filter((r: any) => r.node),
          networkClusters: networkClusters.filter((n: any) => n.node)
        }
      }
    } finally {
      await session.close()
    }
  }

  /**
   * Get company graph with employees
   */
  async getCompanyGraph(companyUrl: string) {
    const session = this.driver.session()
    
    try {
      const result = await session.run(
        `
        MATCH (c:Company {linkedinUrl: $companyUrl})
        OPTIONAL MATCH (c)<-[:WORKS_AT]-(employee:Person)
        OPTIONAL MATCH (c)-[:LOCATED_IN]->(location:Location)
        RETURN c,
               collect(DISTINCT employee) as employees,
               collect(DISTINCT location) as locations
        `,
        { companyUrl }
      )

      if (result.records.length === 0) {
        return null
      }

      const record = result.records[0]
      const company = record.get('c').properties
      const employees = record.get('employees').map((e: any) => e.properties)
      const locations = record.get('locations').map((l: any) => l.properties)

      return {
        company,
        employees,
        locations
      }
    } finally {
      await session.close()
    }
  }

  /**
   * Extract relationship type from recommendation text
   */
  private extractRelationshipType(text: string): string {
    const lower = text?.toLowerCase() || ''
    if (lower.includes('managed directly') || lower.includes('direct report')) return 'Manager'
    if (lower.includes('reported to') || lower.includes('my manager')) return 'Subordinate'
    if (lower.includes('worked with') || lower.includes('collaborated')) return 'Peer'
    if (lower.includes('mentored') || lower.includes('coached')) return 'Mentor'
    if (lower.includes('client') || lower.includes('customer')) return 'Client'
    return 'Colleague'
  }
}

export const datamagnetGraph = new DataMagnetGraphService()