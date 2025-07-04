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
      // Extract username from various possible sources
      let username = profileData.public_identifier || profileData.username
      if (!username && profileData.profile_link) {
        // Extract from URL like https://linkedin.com/in/philipaga
        const match = profileData.profile_link.match(/\/in\/([^\/\?]+)/i)
        if (match) username = match[1]
      }
      
      // Use standardized URL format
      const linkedinUrl = `https://linkedin.com/in/${username}`
      
      console.log('Storing person profile:', {
        username,
        linkedinUrl,
        name: profileData.display_name,
        recommendations: profileData.recommendations?.length || 0,
        alsoViewed: profileData.also_viewed?.length || 0
      })
      
      await session.run(
        `
        MERGE (p:Person {username: $username})
        SET p.linkedinUrl = $linkedinUrl,
            p.name = $name,
            p.displayName = $displayName,
            p.jobTitle = $jobTitle,
            p.profileHeadline = $profileHeadline,
            p.currentCompany = $currentCompany,
            p.location = $location,
            p.followers = $followers,
            p.lastUpdated = datetime()
        `,
        {
          username,
          linkedinUrl,
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
        console.log(`Storing ${profileData.recommendations.length} recommendations`)
        for (const rec of profileData.recommendations) {
          const recText = rec.description || rec.text || rec.recommendation || ''
          await session.run(
            `
            MERGE (recommender:Person {name: $recommenderName})
            SET recommender.title = $recommenderTitle,
                recommender.linkedinUrl = $recommenderUrl
            MERGE (p:Person {username: $username})
            MERGE (recommender)-[r:RECOMMENDS]->(p)
            SET r.text = $text,
                r.relationshipType = $relationshipType,
                r.context = $context,
                r.date = $date,
                r.timestamp = datetime()
            `,
            {
              recommenderName: rec.name || 'Anonymous',
              recommenderTitle: rec.subtitle || '',
              recommenderUrl: rec.url || '',
              username,
              text: recText,
              relationshipType: this.extractRelationshipType(recText),
              context: rec.context || '',
              date: rec.date || ''
            }
          )
        }
      }

      // Store "Also Viewed" as network relationships
      if (profileData.also_viewed && profileData.also_viewed.length > 0) {
        console.log(`Storing ${profileData.also_viewed.length} also viewed profiles`)
        for (const person of profileData.also_viewed) {
          await session.run(
            `
            MERGE (viewed:Person {linkedinUrl: $viewedUrl})
            SET viewed.name = $name,
                viewed.firstName = $firstName,
                viewed.lastName = $lastName,
                viewed.headline = $headline,
                viewed.followers = $followers,
                viewed.profilePicture = $profilePicture,
                viewed.premium = $premium
            MERGE (p:Person {username: $username})
            MERGE (p)-[r:NETWORK_CLUSTER]->(viewed)
            SET r.source = 'also_viewed',
                r.timestamp = datetime()
            `,
            {
              viewedUrl: person.url || `https://linkedin.com/in/${person.public_identifier}`,
              name: `${person.first_name} ${person.last_name}`,
              firstName: person.first_name,
              lastName: person.last_name,
              headline: person.headline,
              followers: person.follower_count || 0,
              profilePicture: person.profile_picture || '',
              premium: person.premium || false,
              username
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
  async getPersonGraph(identifier: string) {
    const session = this.driver.session()
    
    try {
      // Extract username from URL if full URL provided
      let username = identifier
      if (identifier.includes('linkedin.com')) {
        const match = identifier.match(/\/in\/([^\/\?]+)/i)
        if (match) username = match[1]
      }
      
      console.log('Querying person graph for:', { identifier, username })
      
      // First check if person exists by username or URL
      const checkResult = await session.run(
        'MATCH (p:Person) WHERE p.username = $username OR p.linkedinUrl = $linkedinUrl OR p.linkedinUrl CONTAINS $username RETURN p ORDER BY p.lastUpdated DESC LIMIT 1',
        { 
          username,
          linkedinUrl: identifier
        }
      )
      
      if (checkResult.records.length === 0) {
        console.log('Person not found in Neo4j')
        return null
      }
      
      const actualUrl = checkResult.records[0].get('p').properties.linkedinUrl
      console.log('Found person with URL:', actualUrl)
      
      const result = await session.run(
        `
        MATCH (p:Person {linkedinUrl: $actualUrl})
        OPTIONAL MATCH (p)<-[r1:RECOMMENDS]-(recommender:Person)
        WITH p, collect(DISTINCT CASE WHEN recommender IS NOT NULL THEN {
          node: recommender,
          relationship: r1,
          type: 'recommendation'
        } END) as recommendations
        OPTIONAL MATCH (p)-[r2:NETWORK_CLUSTER]->(networked:Person)
        WITH p, recommendations, collect(DISTINCT CASE WHEN networked IS NOT NULL THEN {
          node: networked,
          relationship: r2,
          type: 'network'
        } END) as networkClusters
        OPTIONAL MATCH (p)-[r3:WORKS_AT]->(company:Company)
        RETURN p, 
               [x IN recommendations WHERE x IS NOT NULL] as recommendations,
               [x IN networkClusters WHERE x IS NOT NULL] as networkClusters,
               company
        `,
        { actualUrl }
      )

      if (result.records.length === 0) {
        return null
      }

      const record = result.records[0]
      const person = record.get('p').properties
      const company = record.get('company')?.properties
      const recommendations = record.get('recommendations')
      const networkClusters = record.get('networkClusters')
      
      console.log('Query results:', {
        person: person.name,
        recommendationsRaw: recommendations.length,
        recommendationsCount: recommendations.filter((r: any) => r.node).length,
        networkClustersRaw: networkClusters.length,
        networkClustersCount: networkClusters.filter((n: any) => n.node).length,
        hasCompany: !!company,
        firstRec: recommendations[0],
        firstNet: networkClusters[0]
      })

      return {
        person,
        company,
        relationships: {
          recommendations: recommendations,
          networkClusters: networkClusters
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
   * Get all companies for migration
   */
  async getCompanies(limit: number = 100): Promise<any[]> {
    const session = this.driver.session()
    try {
      const result = await session.run(
        `MATCH (c:Company) 
         RETURN c 
         LIMIT $limit`,
        { limit }
      )
      return result.records.map(record => record.get('c').properties)
    } finally {
      await session.close()
    }
  }

  /**
   * Get all people for migration
   */
  async getPeople(limit: number = 100): Promise<any[]> {
    const session = this.driver.session()
    try {
      const result = await session.run(
        `MATCH (p:Person) 
         RETURN p 
         LIMIT $limit`,
        { limit }
      )
      return result.records.map(record => record.get('p').properties)
    } finally {
      await session.close()
    }
  }

  /**
   * Extract relationship type from recommendation text
   */
  private extractRelationshipType(text: string): string {
    const lower = text?.toLowerCase() || ''
    if (lower.includes('managed') && lower.includes('directly')) return 'Manager'
    if (lower.includes('senior to') && lower.includes("didn't manage")) return 'Senior Colleague'
    if (lower.includes('reported to') || lower.includes('my manager')) return 'Subordinate'
    if (lower.includes('worked with') && lower.includes('same team')) return 'Team Member'
    if (lower.includes('worked with') && lower.includes('different teams')) return 'Cross-Team Colleague'
    if (lower.includes('worked with') && lower.includes('different companies')) return 'External Partner'
    if (lower.includes('was') && lower.includes('client')) return 'Client'
    if (lower.includes('mentored') || lower.includes('coached')) return 'Mentor'
    return 'Colleague'
  }
}

export const datamagnetGraph = new DataMagnetGraphService()