import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth'
import styles from './AuthForm.module.css'

interface AuthFormProps {
  mode: 'login' | 'register'
}

export function AuthForm({ mode }: AuthFormProps) {
  const { login, register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isLogin = mode === 'login'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, password)
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
        <div className={styles.field}>
          <label htmlFor="password" className={styles.label}>
            password
          </label>
          <input
            id="password"
            type="password"
            className={styles.input}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            required
            minLength={8}
          />
        </div>
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
