import neo4j, { Driver, Session } from 'neo4j-driver';

// Memgraph connection (Cypher-compatible, uses neo4j-driver)
const uri = process.env.MEMGRAPH_URI || 'bolt://localhost:7687';
const user = process.env.MEMGRAPH_USER || '';
const password = process.env.MEMGRAPH_PASSWORD || '';

let driver: Driver | null = null;

export function getDriver(): Driver {
  if (!driver) {
    const authToken = user ? neo4j.auth.basic(user, password) : undefined;
    driver = neo4j.driver(uri, authToken);
  }
  return driver;
}

export function getSession(): Session {
  return getDriver().session();
}

export async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

process.on('beforeExit', closeDriver);
