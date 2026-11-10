import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AVATARS, type Difficulty, type StatsResponse, type SubmissionListResponse } from '@algoholic/shared'
import { api } from '../api'
import { useAuth } from '../use-auth'
import { SubmissionsTable } from '../components/SubmissionsTable'
import styles from './ProfilePage.module.css'

const DIFFICULTY_FILL: Record<Difficulty, string> = {
  easy: styles.fillEasy,
  medium: styles.fillMedium,
  hard: styles.fillHard,
}

export function ProfilePage() {
  const { user, loading, updateUser } = useAuth()
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [recent, setRecent] = useState<SubmissionListResponse | null>(null)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let active = true
    Promise.all([api.stats(), api.submissions({ page: '1', pageSize: '5' })])
      .then(([s, r]) => {
        if (active) {
          setStats(s)
          setRecent(r)
        }
      })
      .catch(() => {
        if (active) setStats(null)
      })
    return () => {
      active = false
    }
  }, [user])

  if (!loading && !user) {
    return (
      <div className={styles.message}>
        <a href="/login">log in</a> to see your profile 💗
      </div>
    )
  }

  function startEditing() {
    setName(user?.name ?? '')
    setAvatar(user?.avatar ?? null)
    setError(null)
    setEditing(true)
  }

  async function saveProfile() {
    setSaving(true)
    setError(null)
    try {
      const r = await api.updateProfile({
        name: name.trim() || undefined,
        avatar: avatar ?? undefined,
      })
      updateUser(r.user)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'could not save')
    } finally {
      setSaving(false)
    }
  }

  const displayName = user?.name ?? user?.email.split('@')[0] ?? ''

  return (
    <div>
      <div className={styles.profileCard}>
        <div className={styles.profileHead}>
          <div className={styles.bigAvatar}>{user?.avatar ?? '🙂'}</div>
          <div>
            <div className={styles.name}>{displayName}</div>
            {user && (
              <div className={styles.subline}>
                {user.email} · solving since{' '}
                {new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            )}
          </div>
          {!editing && (
            <button type="button" className={styles.editButton} onClick={startEditing}>
              ✏️ edit profile
            </button>
          )}
        </div>

        {editing && (
          <div className={styles.editForm}>
            {error && <div className={styles.subline}>{error}</div>}
            <div className={styles.field}>
              <label htmlFor="profileName" className={styles.label}>
                name
              </label>
              <input
                id="profileName"
                type="text"
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                placeholder="how should we call you?"
              />
            </div>
            <div className={styles.field}>
              <span className={styles.label}>avatar</span>
              <div className={styles.avatarGrid}>
                {AVATARS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    className={`${styles.avatarButton} ${avatar === a ? styles.avatarActive : ''}`}
                    onClick={() => setAvatar(avatar === a ? null : a)}
                    aria-pressed={avatar === a}
                    aria-label={`avatar ${a}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.actions}>
              <button type="button" className={styles.saveButton} onClick={saveProfile} disabled={saving}>
                {saving ? 'saving…' : 'save'}
              </button>
              <button type="button" className={styles.cancelButton} onClick={() => setEditing(false)}>
                cancel
              </button>
            </div>
          </div>
        )}
      </div>

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
                    <div className={`${styles.progressFill} ${DIFFICULTY_FILL[d]}`} style={{ width: `${pct}%` }} />
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
                    <div className={`${styles.progressFill} ${styles.fillAccent}`} style={{ width: `${pct}%` }} />
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

      {recent && recent.items.length > 0 && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>recent submissions</div>
          <SubmissionsTable items={recent.items} />
          <Link to="/submissions" className={styles.recentLink}>
            view all submissions →
          </Link>
        </div>
      )}
    </div>
  )
}
