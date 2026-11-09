export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const SUBMISSION_STATUSES = [
  'accepted',
  'wrong_answer',
  'time_limit',
  'runtime_error',
  'compile_error',
] as const
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number]

export interface HealthResponse {
  status: 'ok'
}
