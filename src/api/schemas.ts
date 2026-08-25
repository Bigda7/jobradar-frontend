import { z } from 'zod';

export const opportunityKindSchema = z.enum([
  'employment',
  'freelance_project',
]);

export const opportunityStatusSchema = z.enum([
  'active',
  'stale',
  'closed',
  'unknown',
]);

export const workModeSchema = z.enum([
  'remote',
  'hybrid',
  'onsite',
  'flexible',
  'unknown',
]);

const decimalStringSchema = z
  .string()
  .regex(/^\d+(?:\.\d+)?$/, 'Expected a decimal string');

const dateTimeSchema = z.iso.datetime({ offset: true });

export const jobResponseSchema = z.object({
  id: z.number().int(),
  kind: opportunityKindSchema,
  status: opportunityStatusSchema,
  title: z.string(),
  company: z.string().nullable(),
  description: z.string().nullable(),
  location_text: z.string().nullable(),
  work_mode: workModeSchema,
  employment_type: z.string().nullable(),
  contract_type: z.string().nullable(),
  salary_min: decimalStringSchema.nullable(),
  salary_max: decimalStringSchema.nullable(),
  salary_currency: z.string().nullable(),
  salary_period: z.string().nullable(),
  published_at: dateTimeSchema.nullable(),
  first_seen_at: dateTimeSchema,
  last_seen_at: dateTimeSchema,
});

export const matchResponseSchema = jobResponseSchema.extend({
  source_url: z.url(),
  score: z.number().int().min(0).max(100),
  reasons: z.array(z.string()),
  concerns: z.array(z.string()),
  rules_version: z.string(),
});

export const jobListResponseSchema = z.object({
  items: z.array(jobResponseSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().min(1).max(200),
  offset: z.number().int().nonnegative(),
});

export const matchListResponseSchema = z.object({
  items: z.array(matchResponseSchema),
  total: z.number().int().nonnegative(),
  minimum_score: z.number().int().min(0).max(100),
  limit: z.number().int().min(1).max(200),
  offset: z.number().int().nonnegative(),
});

export const sourceResponseSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  display_name: z.string(),
  opportunity_kind: opportunityKindSchema,
  enabled: z.boolean(),
  last_run_at: dateTimeSchema.nullable(),
  last_success_at: dateTimeSchema.nullable(),
  last_error: z.string().nullable(),
});

export const sourceListResponseSchema = z.array(sourceResponseSchema);

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
});

export const readinessResponseSchema = z.object({
  status: z.literal('ready'),
});

export const fastApiValidationIssueSchema = z.object({
  type: z.string(),
  loc: z.array(z.union([z.string(), z.number()])),
  msg: z.string(),
  input: z.unknown().optional(),
  ctx: z.record(z.string(), z.unknown()).optional(),
});

export const fastApiValidationErrorSchema = z.object({
  detail: z.array(fastApiValidationIssueSchema),
});
