import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { api } from '../api'
import { useAuth } from '../use-auth'
import styles from './Layout.module.css'

function navClass({ isActive }: { isActive: boolean }): string {
  return `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
}

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [rolling, setRolling] = useState(false)
  const [randomSlug, setRandomSlug] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const isRandomProblem =
    randomSlug !== null && location.pathname === `/problems/${randomSlug}`
  const onProblemsSection =
    location.pathname === '/problems' ||
    location.pathname === '/' ||
    (location.pathname.startsWith('/problems/') && !isRandomProblem)

  useEffect(() => {
    if (!menuOpen) return
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const displayName = user ? (user.name ?? user.username) : ''

  async function goRandom() {
    if (rolling) return
    setRolling(true)
    try {
      const params: Record<string, string> = { pageSize: '50' }
      if (user) params.status = 'unsolved'
      let res = await api.problems(params)
      if (res.items.length === 0 && user) {
        res = await api.problems({ pageSize: '50' })
      }
      if (res.items.length > 0) {
        const pick = res.items[Math.floor(Math.random() * res.items.length)]
        setRandomSlug(pick.slug)
        navigate(`/problems/${pick.slug}`)
      } else {
        navigate('/problems')
      }
    } catch {
      navigate('/problems')
    } finally {
      setRolling(false)
    }
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/problems" className={styles.brand}>
            algo<span className={styles.brandAccent}>holic</span>
          </Link>
          <nav className={styles.nav}>
            <NavLink
              to="/problems"
              className={`${styles.navLink} ${onProblemsSection ? styles.navLinkActive : ''}`}
            >
              🧩 problems
            </NavLink>
            <button
              type="button"
              className={`${styles.navLink} ${isRandomProblem || rolling ? styles.navLinkActive : ''}`}
              onClick={goRandom}
              disabled={rolling}
            >
              {rolling ? '🎲 …' : '🎲 random'}
            </button>
            {user && (
              <NavLink to="/daily" className={navClass}>
                📅 daily
              </NavLink>
            )}
            <NavLink to="/about" className={navClass}>
              💬 about
            </NavLink>
            {user ? (
              <div className={styles.menuWrap} ref={menuRef}>
                <button
                  type="button"
                  className={styles.avatarButton}
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  title={displayName}
                >
                  {user.avatar ?? '🙂'}
                </button>
                {menuOpen && (
                  <div className={styles.menu} role="menu">
                    <div className={styles.menuIdentity}>
                      <div className={styles.menuName}>{displayName}</div>
                      <div className={styles.menuEmail}>@{user.username}</div>
                    </div>
                    <div className={styles.menuDivider} />
                    <Link
                      to="/profile"
                      className={styles.menuItem}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      👤 profile
                    </Link>
                    <Link
                      to="/stats"
                      className={styles.menuItem}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      📊 stats
                    </Link>
                    <Link
                      to="/submissions"
                      className={styles.menuItem}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                    >
                      📜 submissions
                    </Link>
                    <div className={styles.menuDivider} />
                    <button
                      type="button"
                      className={`${styles.menuItem} ${styles.menuItemDanger}`}
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false)
                        void logout()
                      }}
                    >
                      log out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className={styles.navLink}>
                  log in
                </Link>
                <Link to="/register" className={styles.navLink}>
                  register
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
