import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Validation middleware factory
 * Creates middleware that validates request body, query, or params against a Zod schema
 */
export function validate(
  schema: z.ZodSchema,
  location: 'body' | 'query' | 'params' = 'body'
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req[location];
      const validated = schema.parse(data);

      // Replace the original data with validated/sanitized data
      req[location] = validated;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }

      return res.status(500).json({
        error: 'Validation error',
        message: 'An unexpected error occurred during validation',
      });
    }
  };
}

/**
 * Validate request body
 */
export const validateBody = (schema: z.ZodSchema) => validate(schema, 'body');

/**
 * Validate query parameters
 */
export const validateQuery = (schema: z.ZodSchema) => validate(schema, 'query');

/**
 * Validate URL parameters
 */
export const validateParams = (schema: z.ZodSchema) => validate(schema, 'params');
