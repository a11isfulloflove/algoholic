import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AVATARS } from '@algoholic/shared'
import { useAuth } from '../use-auth'
import { PasswordInput } from './PasswordInput'
import styles from './AuthForm.module.css'

interface AuthFormProps {
  mode: 'login' | 'register'
}

export function AuthForm({ mode }: AuthFormProps) {
  const { login, register } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isLogin = mode === 'login'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (isLogin) {
        await login(username, password)
      } else {
        await register(username, password, name.trim() || undefined, avatar ?? undefined)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'something went wrong')
      setBusy(false)
    }
  }

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>{isLogin ? 'welcome back' : 'join algoholic'}</h1>
      <p className={styles.subtitle}>
        {isLogin ? 'log in to submit solutions' : 'an account keeps your solved progress'}
      </p>
      {error && <div className={styles.error}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="username" className={styles.label}>
            username
          </label>
          <input
            id="username"
            type="text"
            className={styles.input}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="lowercase letters, numbers, _"
            autoComplete="username"
            minLength={3}
            maxLength={24}
            pattern="[a-zA-Z0-9_]+"
            title="only letters, numbers and underscores"
            required
          />
        </div>
        {!isLogin && (
          <div className={styles.field}>
            <label htmlFor="name" className={styles.label}>
              name <span className={styles.optional}>(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="how should we call you?"
              autoComplete="nickname"
              maxLength={30}
            />
          </div>
        )}
        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>
            password
          </label>
          <PasswordInput
            id="password"
            value={password}
            onChange={setPassword}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            required
            minLength={8}
          />
        </div>
        {!isLogin && (
          <div className={styles.field}>
            <span className={styles.label}>
              pick your avatar <span className={styles.optional}>(optional)</span>
            </span>
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
        )}
        <button type="submit" className={styles.submit} disabled={busy}>
          {busy ? 'one moment…' : isLogin ? 'log in' : 'create account'}
        </button>
      </form>
      <p className={styles.switchLine}>
        {isLogin ? (
          <>
            no account yet? <Link to="/register">register</Link>
          </>
        ) : (
          <>
            already registered? <Link to="/login">log in</Link>
          </>
        )}
      </p>
    </div>
  )
}
