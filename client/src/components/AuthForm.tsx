import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { AVATARS } from '@algoholic/shared'
import { useAuth } from '../use-auth'
import styles from './AuthForm.module.css'

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

interface AuthFormProps {
  mode: 'login' | 'register'
}

export function AuthForm({ mode }: AuthFormProps) {
  const { login, register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const isLogin = mode === 'login'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, password, name.trim() || undefined, avatar ?? undefined)
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
          <label htmlFor="email" className={styles.label}>
            email
          </label>
          <input
            id="email"
            type="email"
            className={styles.input}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
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
          <div className={styles.passwordWrap}>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              className={`${styles.input} ${styles.passwordInput}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              minLength={8}
            />
            <button
              type="button"
              className={styles.toggle}
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'hide password' : 'show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          </div>
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
