/**
 * Read JSON array of entities (and optional relationships) from stdin or file;
 * output graph JSON (nodes/edges) compatible with lens references/schemas.
 */
import { readFileSync } from "fs";

interface Entity {
  id?: string;
  name?: string;
  text?: string;
  type?: string;
  [k: string]: unknown;
}

interface Rel {
  source?: string;
  target?: string;
  fromEntityId?: string;
  toEntityId?: string;
  type?: string;
  relationship?: string;
  [k: string]: unknown;
}

function main(): void {
  let input: { entities?: Entity[]; relationships?: Rel[] } | Entity[];
  try {
    const raw = process.argv[2]
      ? readFileSync(process.argv[2], "utf-8")
      : readFileSync(0, "utf-8");
    input = JSON.parse(raw) as Entity[] | { entities?: Entity[]; relationships?: Rel[] };
  } catch {
    process.stderr.write("build_graph: need JSON array on stdin or file path\n");
    process.exit(1);
  }
  const entities: Entity[] = Array.isArray(input) ? input : input.entities ?? [];
  const rels: Rel[] = Array.isArray(input) ? [] : input.relationships ?? [];
  const nodes = entities.map((e, i) => ({
    id: (e.id as string) ?? `e-${i}`,
    label: e.name ?? e.text ?? "",
    type: e.type ?? "unknown",
  }));
  const edges = rels.map((r) => ({
    source: r.source ?? r.fromEntityId,
    target: r.target ?? r.toEntityId,
    type: r.type ?? r.relationship ?? "related",
  }));
  process.stdout.write(JSON.stringify({ nodes, edges }, null, 2));
}

main();
