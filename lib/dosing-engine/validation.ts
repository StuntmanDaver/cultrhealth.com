import { z } from 'zod';

export const UserIntakeResponseSchema = z.object({
  sex: z.enum(['Male', 'Female']),
  age: z.number().int().min(18).max(120),
  weightLb: z.number().min(80).max(600),
  heightInches: z.number().min(40).max(96),
  priorGlp1History: z.boolean(),
  priorGlp1Details: z.enum(['never_used', 'semaglutide', 'tirzepatide', 'unknown']),
  priorToleranceOrSideEffects: z.string().optional().default(''),
  goal: z.enum(['weight_loss', 'maintenance', 'transition', 'informational']),
  requestedProduct: z.string(),
});
