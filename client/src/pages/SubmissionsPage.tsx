import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { api } from '../api'
import type { SubmissionListResponse } from '@algoholic/shared'
import { SubmissionsTable } from '../components/SubmissionsTable'
import styles from './SubmissionsPage.module.css'

const PAGE_SIZE = 20

export function SubmissionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const problemFilter = searchParams.get('problem') ?? ''
  const page = Number(searchParams.get('page') ?? '1') || 1

  const [data, setData] = useState<SubmissionListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const paramsKey = `${problemFilter}|${page}`
  const [lastParamsKey, setLastParamsKey] = useState(paramsKey)
  if (paramsKey !== lastParamsKey) {
    setLastParamsKey(paramsKey)
    setLoading(true)
  }

  useEffect(() => {
    let active = true
    const params: Record<string, string> = {
      page: String(page),
      pageSize: String(PAGE_SIZE),
    }
    if (problemFilter) params.problem = problemFilter
    api
      .submissions(params)
      .then((r) => {
        if (active) {
          setData(r)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'failed to load submissions')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [problemFilter, page])

  function updateParams(next: { problem?: string; page?: number }) {
    const p = new URLSearchParams()
    const problem = next.problem !== undefined ? next.problem : problemFilter
    const nextPage = next.page !== undefined ? next.page : page
    if (problem) p.set('problem', problem)
    if (nextPage > 1) p.set('page', String(nextPage))
    setSearchParams(p, { replace: true })
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>your submissions</h1>
        {data && <span className={styles.count}>{data.total} total</span>}
      </div>

      <div className={styles.filters}>
        <input
          type="search"
          className={styles.search}
          placeholder="filter by problem slug…"
          defaultValue={problemFilter}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              updateParams({ problem: e.currentTarget.value.trim(), page: 1 })
            }
          }}
        />
        {problemFilter && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={() => updateParams({ problem: '', page: 1 })}
          >
            clear filter
          </button>
        )}
      </div>

      {error && <div className={styles.message}>{error}</div>}
      {loading && !data && <div className={styles.message}>loading submissions…</div>}
      {!loading && data && data.items.length === 0 && (
        <div className={styles.message}>
          no submissions yet — go <a href="/problems">solve something</a>! 💪
        </div>
      )}

      {data && data.items.length > 0 && <SubmissionsTable items={data.items} />}

      {data && data.total > data.pageSize && (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.pageButton}
            disabled={page <= 1}
            onClick={() => updateParams({ page: page - 1 })}
          >
            ← prev
          </button>
          <span>
            page {page} of {totalPages}
          </span>
          <button
            type="button"
            className={styles.pageButton}
            disabled={page >= totalPages}
            onClick={() => updateParams({ page: page + 1 })}
          >
            next →
          </button>
        </div>
      )}
    </div>
  )
}
