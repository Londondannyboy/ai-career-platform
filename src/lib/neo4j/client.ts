import neo4j, { Driver } from 'neo4j-driver'

let driver: Driver | null = null

export function getDriver(): Driver {
  if (!driver) {
    const uri = process.env.NEO4J_URI || 'neo4j+s://20b2ddda.databases.neo4j.io'
    const username = process.env.NEO4J_USERNAME || 'neo4j'
    const password = process.env.NEO4J_PASSWORD || 'MPfTn0be2NxKxrnM7EZ5bUGrzVb_ZxM4CGnXUWp1ylw'
    
    driver = neo4j.driver(uri, neo4j.auth.basic(username, password))
    
    console.log('🔗 Neo4j connection initialized to:', uri)
  }
  
  return driver
}

export async function closeDriver() {
  if (driver) {
    await driver.close()
    driver = null
  }
}