import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { AVATARS, type StatsResponse, type SubmissionListResponse } from '@algoholic/shared'
import { api } from '../api'
import { useAuth } from '../use-auth'
import { PasswordInput } from '../components/PasswordInput'
import { SubmissionsTable } from '../components/SubmissionsTable'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const { user, loading, updateUser } = useAuth()
  const [stats, setStats] = useState<StatsResponse | null>(null)
  const [recent, setRecent] = useState<SubmissionListResponse | null>(null)

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState(false)

  const [newUsername, setNewUsername] = useState('')
  const [usernamePassword, setUsernamePassword] = useState('')
  const [unBusy, setUnBusy] = useState(false)
  const [unError, setUnError] = useState<string | null>(null)
  const [unSuccess, setUnSuccess] = useState(false)

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
        if (active) {
          setStats(null)
          setRecent(null)
        }
      })
    return () => {
      active = false
    }
  }, [user])

  if (!loading && !user) {
    return (
      <div className={styles.message}>
        <Link to="/login">log in</Link> to see your profile 💗
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

  async function changeUsername() {
    setUnBusy(true)
    setUnError(null)
    setUnSuccess(false)
    try {
      const r = await api.changeUsername(usernamePassword, newUsername.trim().toLowerCase())
      updateUser(r.user)
      setNewUsername('')
      setUsernamePassword('')
      setUnSuccess(true)
    } catch (err) {
      setUnError(err instanceof Error ? err.message : 'could not update username')
    } finally {
      setUnBusy(false)
    }
  }

  async function changePassword() {
    setPwBusy(true)
    setPwError(null)
    setPwSuccess(false)
    try {
      await api.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPwSuccess(true)
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'could not update password')
    } finally {
      setPwBusy(false)
    }
  }

  const displayName = user?.name ?? user?.username ?? ''

  return (
    <div>
      <div className={styles.profileCard}>
        <div className={styles.profileHead}>
          <div className={styles.bigAvatar}>{user?.avatar ?? '🙂'}</div>
          <div>
            <div className={styles.name}>{displayName}</div>
            {user && (
              <div className={styles.subline}>
                @{user.username} · solving since{' '}
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
            <div className={styles.editColumns}>
              <div className={styles.identityColumn}>
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
               </div>
              <div className={styles.securityColumn}>
              <div className={styles.pwSection}>
                <div className={styles.pwSectionTitle}>✏️ change username</div>
              {unSuccess && (
                <div className={styles.pwSuccess}>username updated ✓ log in with it next time</div>
              )}
              {unError && <div className={styles.pwError}>{unError}</div>}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!newUsername.trim()) {
                    setUnError('enter a new username')
                    setUnSuccess(false)
                    return
                  }
                  void changeUsername()
                }}
              >
                <div className={styles.field}>
                  <label htmlFor="newUsername" className={styles.label}>
                    new username
                  </label>
                  <input
                    id="newUsername"
                    type="text"
                    className={styles.input}
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="lowercase letters, numbers, _"
                    minLength={3}
                    maxLength={24}
                    pattern="[a-zA-Z0-9_]+"
                    title="only letters, numbers and underscores"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="usernamePassword" className={styles.label}>
                    current password
                  </label>
                  <PasswordInput
                    id="usernamePassword"
                    value={usernamePassword}
                    onChange={setUsernamePassword}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <button type="submit" className={styles.updateButton} disabled={unBusy}>
                  {unBusy ? 'updating…' : 'update username'}
                </button>
              </form>
            </div>

            <div className={styles.pwSection}>
              <div className={styles.pwSectionTitle}>🔐 change password</div>
              {pwSuccess && (
                <div className={styles.pwSuccess}>password updated ✓ use it next time you log in</div>
              )}
              {pwError && <div className={styles.pwError}>{pwError}</div>}
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (newPassword !== confirmPassword) {
                    setPwError('new passwords do not match')
                    setPwSuccess(false)
                    return
                  }
                  void changePassword()
                }}
              >
                <div className={styles.field}>
                  <label htmlFor="currentPassword" className={styles.label}>
                    current password
                  </label>
                  <PasswordInput
                    id="currentPassword"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    autoComplete="current-password"
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="newPassword" className={styles.label}>
                    new password
                  </label>
                  <PasswordInput
                    id="newPassword"
                    value={newPassword}
                    onChange={setNewPassword}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="confirmPassword" className={styles.label}>
                    confirm new password
                  </label>
                  <PasswordInput
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </div>
                <button type="submit" className={styles.updateButton} disabled={pwBusy}>
                  {pwBusy ? 'updating…' : 'update password'}
                </button>
              </form>
              </div>
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
        <div className={styles.sectionCard}>
          <div className={styles.sectionTitle}>your stats</div>
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
          <Link to="/stats" className={styles.recentLink}>
            view all stats →
          </Link>
        </div>
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
