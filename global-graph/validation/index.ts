/**
 * Graph structural integrity validation. Use before writing to the graph.
 */
export {
  validateGraphStructure,
  validateGraphStructureOrThrow,
  linkTypeSchema,
  objectTypeSchema,
  type GraphIntegrityResult,
  type GraphIntegrityCheck,
  type LinkType,
  type ObjectType,
} from './graphIntegrity';
