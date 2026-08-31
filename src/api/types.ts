import type { z } from 'zod';

import type {
  fastApiValidationErrorSchema,
  fastApiValidationIssueSchema,
  healthResponseSchema,
  jobListResponseSchema,
  jobResponseSchema,
  matchListResponseSchema,
  matchResponseSchema,
  opportunityKindSchema,
  opportunityStatusSchema,
  sourceResponseSchema,
  workModeSchema,
} from './schemas';

export type OpportunityKind = z.infer<typeof opportunityKindSchema>;
export type OpportunityStatus = z.infer<typeof opportunityStatusSchema>;
export type WorkMode = z.infer<typeof workModeSchema>;

export type JobResponse = z.infer<typeof jobResponseSchema>;
export type MatchResponse = z.infer<typeof matchResponseSchema>;
export type JobListResponse = z.infer<typeof jobListResponseSchema>;
export type MatchListResponse = z.infer<typeof matchListResponseSchema>;
export type SourceResponse = z.infer<typeof sourceResponseSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;
export type FastApiValidationIssue = z.infer<
  typeof fastApiValidationIssueSchema
>;
export type FastApiValidationError = z.infer<
  typeof fastApiValidationErrorSchema
>;

export interface JobsFilters {
  q?: string;
  work_mode?: WorkMode;
  employment_type?: string;
  min_salary?: number;
  limit?: number;
  offset?: number;
}

export interface MatchFilters {
  min_score?: number;
  source?: string;
  limit?: number;
  offset?: number;
}
