import { useEffect, useMemo, useState } from 'react'
import { api } from '../api'
import type { CategorySummary, ProblemListResponse } from '@algoholic/shared'
import { Dropdown } from '../components/Dropdown'
import { ProblemTable } from '../components/ProblemTable'
import { useAuth } from '../use-auth'
import styles from './ProblemsPage.module.css'

const PAGE_SIZE = 20

export function ProblemsPage() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<CategorySummary[]>([])
  const [data, setData] = useState<ProblemListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    api
      .categories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const filterKey = `${category}|${difficulty}|${status}|${debouncedSearch}`
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey)
    setPage(1)
  }

  const params = useMemo(() => {
    const p: Record<string, string> = { page: String(page), pageSize: String(PAGE_SIZE) }
    if (category) p.category = category
    if (difficulty) p.difficulty = difficulty
    if (status) p.status = status
    if (debouncedSearch) p.q = debouncedSearch
    return p
  }, [page, category, difficulty, status, debouncedSearch])

  const paramsKey = JSON.stringify(params)
  const [lastParamsKey, setLastParamsKey] = useState(paramsKey)
  if (paramsKey !== lastParamsKey) {
    setLastParamsKey(paramsKey)
    setLoading(true)
  }

  useEffect(() => {
    let active = true
    api
      .problems(params)
      .then((r) => {
        if (active) {
          setData(r)
          setError(null)
        }
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'failed to load problems')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [params])

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>problems</h1>
        {data && <span className={styles.count}>{data.total} total</span>}
      </div>

      <div className={styles.filters}>
        <input
          type="search"
          className={styles.search}
          placeholder="search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Dropdown
          value={category}
          onChange={setCategory}
          placeholder="all categories"
          options={categories.map((c) => ({
            value: c.slug,
            label: `${c.name} (${c.problemCount})`,
          }))}
        />
        <Dropdown
          value={difficulty}
          onChange={setDifficulty}
          placeholder="all difficulties"
          options={[
            { value: 'easy', label: 'easy' },
            { value: 'medium', label: 'medium' },
            { value: 'hard', label: 'hard' },
          ]}
        />
        {user && (
          <Dropdown
            value={status}
            onChange={setStatus}
            placeholder="all"
            options={[
              { value: 'solved', label: 'solved' },
              { value: 'unsolved', label: 'unsolved' },
            ]}
          />
        )}
      </div>

      {error && <div className={styles.message}>{error}</div>}
      {loading && !data && <div className={styles.message}>loading problems…</div>}
      {!loading && data && data.items.length === 0 && (
        <div className={styles.message}>no problems match your filters</div>
      )}

      {data && data.items.length > 0 && <ProblemTable items={data.items} />}

      {data && data.total > data.pageSize && (
        <div className={styles.footer}>
          <button
            type="button"
            className={styles.pageButton}
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
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
            onClick={() => setPage((p) => p + 1)}
          >
            next →
          </button>
        </div>
      )}
    </div>
  )
}
