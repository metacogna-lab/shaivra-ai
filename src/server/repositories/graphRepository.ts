import { getSession } from '../db/memgraphClient';

export const graphRepository = {
  async addNode(node: { uuid: string; label: string; type: string; risk_score?: number; metadata?: any }) {
    const session = getSession();
    try {
      await session.run(
        `CREATE (n:Entity {uuid: $uuid, label: $label, type: $type, risk_score: $risk_score, metadata: $metadata})`,
        node
      );
    } finally {
      await session.close();
    }
  },

  async addLink(source: string, target: string, type: string, weight = 1.0) {
    const session = getSession();
    try {
      await session.run(
        `MATCH (a:Entity {uuid: $source}), (b:Entity {uuid: $target})
         CREATE (a)-[r:RELATED {type: $type, weight: $weight}]->(b)`,
        { source, target, type, weight }
      );
    } finally {
      await session.close();
    }
  },

  async searchNodes(query: string, limit = 20) {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (n:Entity)
         WHERE toLower(n.label) CONTAINS toLower($query)
         RETURN n
         LIMIT $limit`,
        { query, limit }
      );
      return result.records.map(r => r.get('n').properties);
    } finally {
      await session.close();
    }
  },

  async getMasterGraph() {
    const session = getSession();
    try {
      const result = await session.run(
        `MATCH (n:Entity)
         OPTIONAL MATCH (n)-[r:RELATED]->(m:Entity)
         RETURN n, collect({type: type(r), target: m.uuid, weight: r.weight}) as links`
      );

      const nodes = result.records.map(r => r.get('n').properties);
      const links = result.records.flatMap(r =>
        r.get('links').map((l: any) => ({
          source: r.get('n').properties.uuid,
          target: l.target,
          type: l.type,
          weight: l.weight
        }))
      );

      return { nodes, links, metadata: { total_entities: nodes.length, total_links: links.length } };
    } finally {
      await session.close();
    }
  },

  async updateMasterGraph(newNodes: any[], newLinks: any[]) {
    for (const node of newNodes) {
      await this.addNode(node);
    }
    for (const link of newLinks) {
      await this.addLink(link.source, link.target, link.type, link.weight);
    }
  }
};
