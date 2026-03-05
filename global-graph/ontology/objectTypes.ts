/**
 * Object types for graph entities. Used by entity schema and graph integrity.
 */
import { z } from 'zod';

export const objectTypeSchema = z.enum([
  'Actor',
  'Organization',
  'Infrastructure',
  'Event',
  'Narrative',
  'Document',
  'Source',
  'Decision',
]);
export type ObjectType = z.infer<typeof objectTypeSchema>;
