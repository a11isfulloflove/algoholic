import { useEffect, useMemo, useState } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import type { Language } from '@algoholic/shared'
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

export function EditorPanel({ slug, starterCodeJs, starterCodeTs }: EditorPanelProps) {
  const [language, setLanguage] = useState<Language>('javascript')
  const [code, setCode] = useState<string>(
    () => loadDraft(slug, 'javascript') ?? starterCodeJs,
  )

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

  const extensions = useMemo(
    () => [javascript({ typescript: language === 'typescript' })],
    [language],
  )

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
    </div>
  )
}
