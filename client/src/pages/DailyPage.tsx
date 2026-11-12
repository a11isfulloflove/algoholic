import { useEffect, useState } from 'react'
import type { DailyProblemResponse } from '@algoholic/shared'
import { api } from '../api'
import { ProblemPage } from './ProblemPage'
import styles from './DailyPage.module.css'

export function DailyPage() {
  const [daily, setDaily] = useState<DailyProblemResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    api
      .daily()
      .then((d) => {
        if (active) setDaily(d)
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
  }, [])

  return (
    <div>
      <div className={styles.banner}>
        <span className={styles.bannerEmoji}>📅</span>
        <div>
          <div className={styles.bannerTitle}>problem of the day</div>
          {daily && (
            <div className={styles.bannerDate}>
              {new Date(`${daily.date}T00:00:00Z`).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: 'UTC',
              })}
            </div>
          )}
        </div>
      </div>

      {loading && <div className={styles.message}>picking today's problem…</div>}
      {error && <div className={styles.message}>{error}</div>}
      {!loading && !error && daily && <ProblemPage slug={daily.slug} />}
    </div>
  )
}
