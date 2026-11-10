import type {
  CategorySummary,
  ProblemDetail,
  ProblemListResponse,
  RunSamplesResponse,
  SubmitResponse,
} from '@algoholic/shared'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    let message = `request failed (${res.status})`
    try {
      const body = (await res.json()) as { error?: string }
      if (body && typeof body.error === 'string') message = body.error
    } catch {
      // keep default message
    }
    throw new ApiError(res.status, message)
  }
  return (await res.json()) as T
}

export interface AuthUser {
  id: number
  email: string
}

export const api = {
  me: () => request<{ user: AuthUser }>('/api/auth/me'),
  login: (email: string, password: string) =>
    request<{ user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string) =>
    request<{ user: AuthUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  categories: () => request<CategorySummary[]>('/api/categories'),
  problems: (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString()
    return request<ProblemListResponse>(`/api/problems${qs ? `?${qs}` : ''}`)
  },
  problem: (slug: string) => request<ProblemDetail>(`/api/problems/${slug}`),
  run: (slug: string, body: { language: string; code: string }) =>
    request<RunSamplesResponse>(`/api/problems/${slug}/run`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  submit: (slug: string, body: { language: string; code: string }) =>
    request<SubmitResponse>(`/api/problems/${slug}/submit`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}
