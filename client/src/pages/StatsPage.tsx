import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import type { Difficulty, StatsResponse } from '@algoholic/shared'
import { api } from '../api'
import { useAuth } from '../use-auth'
import styles from './StatsPage.module.css'

const DIFFICULTY_FILL: Record<Difficulty, string> = {
  easy: styles.fillEasy,
  medium: styles.fillMedium,
  hard: styles.fillHard,
}

export function StatsPage() {
  const { user, loading } = useAuth()
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    api
      .stats()
      .then((s) => {
        if (active) setStats(s)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'failed to load stats')
      })
    return () => {
      active = false
    }
  }, [user])

  if (!loading && !user) {
    return (
      <div className={styles.message}>
        <Link to="/login">log in</Link> to see your stats 📊
      </div>
    )
  }

  return (
    <div>
      <h1 className={styles.pageTitle}>your stats</h1>

      {error && <div className={styles.message}>{error}</div>}
      {!error && !stats && <div className={styles.message}>counting things…</div>}

      {stats && (
        <>
          <div className={styles.statCards}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {stats.solvedTotal}/{stats.problemsTotal}
              </div>
              <div className={styles.statLabel}>problems solved</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.submissions}</div>
              <div className={styles.statLabel}>submissions</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.accepted}</div>
              <div className={styles.statLabel}>accepted</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {stats.submissions > 0
                  ? `${Math.round((stats.accepted / stats.submissions) * 100)}%`
                  : '—'}
              </div>
              <div className={styles.statLabel}>acceptance rate</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>
                {stats.favoriteLanguage ? stats.favoriteLanguage.language : '—'}
              </div>
              <div className={styles.statLabel}>
                {stats.favoriteLanguage
                  ? `${stats.favoriteLanguage.share}% of submissions`
                  : 'favorite language'}
              </div>
            </div>
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>progress by difficulty</div>
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
              const p = stats.byDifficulty[d]
              const pct = p.total > 0 ? Math.round((p.solved / p.total) * 100) : 0
              return (
                <div className={styles.progressRow} key={d}>
                  <span className={styles.progressLabel}>{d}</span>
                  <div className={styles.progressTrack}>
                    <div
                      className={`${styles.progressFill} ${DIFFICULTY_FILL[d]}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={styles.progressCount}>
                    {p.solved}/{p.total}
                  </span>
                </div>
              )
            })}
          </div>

          <div className={styles.sectionCard}>
            <div className={styles.sectionTitle}>progress by category</div>
            {stats.byCategory.map((c) => {
              const pct = c.total > 0 ? Math.round((c.solved / c.total) * 100) : 0
              return (
                <div className={styles.progressRow} key={c.slug}>
                  <span className={styles.progressLabel}>{c.name}</span>
                  <div className={styles.progressTrack}>
                    <div
                      className={`${styles.progressFill} ${styles.fillAccent}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={styles.progressCount}>
                    {c.solved}/{c.total}
                  </span>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
