import { useEffect, useState } from 'react'
import type { ProblemListItem } from '@algoholic/shared'
import { api } from '../api'
import { ProblemPage } from './ProblemPage'
import styles from './DailyPage.module.css'

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0)
  return Math.floor((date.getTime() - start.getTime()) / 86400000)
}

export function DailyPage() {
  const [today] = useState(() => new Date())
  const [problem, setProblem] = useState<ProblemListItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    api
      .problems({ pageSize: '50' })
      .then((res) => {
        if (!active) return
        if (res.items.length === 0) {
          setError('no problems available yet')
          return
        }
        const pick = res.items[dayOfYear(today) % res.items.length]
        setProblem(pick)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'failed to load daily problem')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [today])

  return (
    <div>
      <div className={styles.banner}>
        <span className={styles.bannerEmoji}>📅</span>
        <div>
          <div className={styles.bannerTitle}>problem of the day</div>
          <div className={styles.bannerDate}>
            {today.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>

      {loading && <div className={styles.message}>picking today's problem…</div>}
      {error && <div className={styles.message}>{error}</div>}
      {!loading && !error && problem && <ProblemPage slug={problem.slug} />}
    </div>
  )
}
