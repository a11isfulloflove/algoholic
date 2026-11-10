import { useEffect, useMemo, useRef, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import type { Language, RunSamplesResponse, SubmitResponse } from '@algoholic/shared'
import { api, ApiError } from '../api'
import { useAuth } from '../use-auth'
import { RunResultsView, SubmitResultsView } from './ResultsPanel'
import styles from './EditorPanel.module.css'

interface EditorPanelProps {
  slug: string
  starterCodeJs: string
  starterCodeTs: string
}

function draftKey(slug: string, language: Language): string {
  return `algoholic:draft:${slug}:${language}`
}

function loadDraft(slug: string, language: Language): string | null {
  try {
    return localStorage.getItem(draftKey(slug, language))
  } catch {
    return null
  }
}

function friendlyError(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.status === 429) {
    return 'easy there — the judge needs a breather (15 requests per minute)'
  }
  return err instanceof Error ? err.message : fallback
}

export function EditorPanel({ slug, starterCodeJs, starterCodeTs }: EditorPanelProps) {
  const { user } = useAuth()
  const [language, setLanguage] = useState<Language>('javascript')
  const [code, setCode] = useState<string>(
    () => loadDraft(slug, 'javascript') ?? starterCodeJs,
  )
  const [runResult, setRunResult] = useState<RunSamplesResponse | null>(null)
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null)
  const [busy, setBusy] = useState<'run' | 'submit' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const submitRef = useRef<() => void>(() => {})

  const starter = language === 'javascript' ? starterCodeJs : starterCodeTs

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(slug, language), code)
      } catch {
        // storage unavailable — drafts just won't persist
      }
    }, 400)
    return () => clearTimeout(t)
  }, [slug, language, code])

  const languageExtension = useMemo(
    () => javascript({ typescript: language === 'typescript' }),
    [language],
  )
  const extensions = useMemo(() => [languageExtension], [languageExtension])

  function switchLanguage(next: Language) {
    if (next === language) return
    setCode(loadDraft(slug, next) ?? (next === 'javascript' ? starterCodeJs : starterCodeTs))
    setLanguage(next)
  }

  function resetToStarter() {
    try {
      localStorage.removeItem(draftKey(slug, language))
    } catch {
      // ignore
    }
    setCode(starter)
  }

  async function handleRun() {
    setBusy('run')
    setError(null)
    setSubmitResult(null)
    try {
      setRunResult(await api.run(slug, { language, code }))
    } catch (err) {
      setError(friendlyError(err, 'run failed'))
      setRunResult(null)
    } finally {
      setBusy(null)
    }
  }

  async function handleSubmit() {
    if (!user) return
    setBusy('submit')
    setError(null)
    setRunResult(null)
    try {
      setSubmitResult(await api.submit(slug, { language, code }))
    } catch (err) {
      setError(friendlyError(err, 'submit failed'))
      setSubmitResult(null)
    } finally {
      setBusy(null)
    }
  }

  useEffect(() => {
    submitRef.current = () => {
      if (busy === null && user) {
        void handleSubmit()
      }
    }
  })

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault()
        submitRef.current()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <div className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.segmented}>
          <button
            type="button"
            className={`${styles.segment} ${language === 'javascript' ? styles.segmentActive : ''}`}
            onClick={() => switchLanguage('javascript')}
          >
            javascript
          </button>
          <button
            type="button"
            className={`${styles.segment} ${language === 'typescript' ? styles.segmentActive : ''}`}
            onClick={() => switchLanguage('typescript')}
          >
            typescript
          </button>
        </div>
        <div className={styles.spacer} />
        <button type="button" className={styles.actionButton} onClick={resetToStarter}>
          reset
        </button>
        <button
          type="button"
          className={styles.actionButton}
          onClick={handleRun}
          disabled={busy !== null || !user}
        >
          {busy === 'run' ? 'running…' : '▶ run'}
        </button>
        <button
          type="button"
          className={styles.runButton}
          onClick={handleSubmit}
          disabled={busy !== null || !user}
          title="Ctrl/Cmd + Enter"
        >
          {busy === 'submit' ? 'submitting…' : 'submit'}
        </button>
        <span className={styles.kbdHint} title="Ctrl/Cmd + Enter">
          ⌘↵
        </span>
      </div>
      <div className={styles.editor}>
        <CodeMirror
          value={code}
          height="460px"
          theme="light"
          extensions={extensions}
          onChange={setCode}
        />
      </div>
      {!user && (
        <div className={styles.authNote}>
          <a href="/login">log in</a> to run your code against the samples and submit for judging
        </div>
      )}
      {busy !== null && (
        <div className={styles.judgingNote}>
          {busy === 'run' ? 'running against samples…' : 'the judge is thinking…'}
        </div>
      )}
      {error && <div className={styles.errorNote}>{error}</div>}
      {runResult && <RunResultsView result={runResult} />}
      {submitResult && <SubmitResultsView result={submitResult} />}
    </div>
  )
}
