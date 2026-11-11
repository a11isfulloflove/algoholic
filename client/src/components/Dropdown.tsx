import { useEffect, useRef, useState } from 'react'
import styles from './Dropdown.module.css'

export interface DropdownOption {
  value: string
  label: string
}

interface DropdownProps {
  value: string
  options: DropdownOption[]
  onChange: (value: string) => void
  placeholder: string
}

export function Dropdown({ value, options, onChange, placeholder }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const selected = options.find((o) => o.value === value)

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={styles.labelStack}>
          <span className={styles.stackGhost} aria-hidden="true">
            {placeholder}
          </span>
          {options.map((o) => (
            <span key={o.value} className={styles.stackGhost} aria-hidden="true">
              {o.label}
            </span>
          ))}
          <span className={selected ? styles.stackVisible : styles.stackPlaceholder}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <svg
          className={`${styles.chevron} ${open ? styles.chevronUp : ''}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className={styles.menu} role="listbox">
          <button
            type="button"
            className={`${styles.option} ${value === '' ? styles.optionSelected : ''}`}
            role="option"
            aria-selected={value === ''}
            onClick={() => {
              onChange('')
              setOpen(false)
            }}
          >
            <span>{placeholder}</span>
            {value === '' && <span className={styles.check}>✓</span>}
          </button>
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`${styles.option} ${value === o.value ? styles.optionSelected : ''}`}
              role="option"
              aria-selected={value === o.value}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
            >
              <span>{o.label}</span>
              {value === o.value && <span className={styles.check}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
