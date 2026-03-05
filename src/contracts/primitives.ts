import { z } from 'zod';

export const isoDateTimeSchema = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Must be a valid ISO 8601 timestamp');
