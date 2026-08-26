import { z } from 'zod';

import { isSafeExternalUrl } from '../security/external-url';

const shortExternalTextSchema = z.string().max(10_000);
const longExternalTextSchema = z.string().max(500_000);

export const safeExternalUrlSchema = z
  .string()
  .max(2_048)
  .refine(isSafeExternalUrl, 'Expected an absolute HTTP or HTTPS URL');

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
  title: shortExternalTextSchema,
  company: shortExternalTextSchema.nullable(),
  description: longExternalTextSchema.nullable(),
  location_text: shortExternalTextSchema.nullable(),
  work_mode: workModeSchema,
  employment_type: shortExternalTextSchema.nullable(),
  contract_type: shortExternalTextSchema.nullable(),
  salary_min: decimalStringSchema.nullable(),
  salary_max: decimalStringSchema.nullable(),
  salary_currency: z.string().max(32).nullable(),
  salary_period: z.string().max(64).nullable(),
  published_at: dateTimeSchema.nullable(),
  first_seen_at: dateTimeSchema,
  last_seen_at: dateTimeSchema,
  source_url: safeExternalUrlSchema,
});

export const matchResponseSchema = jobResponseSchema.extend({
  score: z.number().int().min(0).max(100),
  reasons: z.array(shortExternalTextSchema).max(100),
  concerns: z.array(shortExternalTextSchema).max(100),
  rules_version: shortExternalTextSchema,
});

export const jobListResponseSchema = z.object({
  items: z.array(jobResponseSchema).max(200),
  total: z.number().int().nonnegative(),
  limit: z.number().int().min(1).max(200),
  offset: z.number().int().nonnegative(),
});

export const matchListResponseSchema = z.object({
  items: z.array(matchResponseSchema).max(200),
  total: z.number().int().nonnegative(),
  minimum_score: z.number().int().min(0).max(100),
  limit: z.number().int().min(1).max(200),
  offset: z.number().int().nonnegative(),
});

export const sourceResponseSchema = z.object({
  id: z.number().int(),
  name: shortExternalTextSchema,
  display_name: shortExternalTextSchema,
  opportunity_kind: opportunityKindSchema,
  enabled: z.boolean(),
  last_run_at: dateTimeSchema.nullable(),
  last_success_at: dateTimeSchema.nullable(),
  last_error: longExternalTextSchema.nullable(),
});

export const sourceListResponseSchema = z.array(sourceResponseSchema).max(200);

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
