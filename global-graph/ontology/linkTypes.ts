/**
 * Link types for graph relationships. Used by relationship schema and graph integrity.
 */
import { z } from 'zod';

export const linkTypeSchema = z.enum([
  'controls',
  'funds',
  'participates_in',
  'owns',
  'located_in',
  'amplifies',
  'mentions',
  'hosts',
  'registered_to',
  'associated_with',
  'communicated_with',
  'part_of',
  'promotes',
  'attacked',
  'derived_from',
]);
export type LinkType = z.infer<typeof linkTypeSchema>;
