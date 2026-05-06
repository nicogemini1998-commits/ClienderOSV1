import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

export default function NavBar() {
  const { user, isAdmin, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const { pathname } = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [pathname])

  const link = (to, label) => {
    const active = to === '/' ? pathname === '/' : pathname.startsWith(to)
    return (
      <Link
        key={to}
        to={to}
        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150
          ${active
            ? 'text-accent bg-accent/10'
            : 'text-muted hover:text-primary hover:bg-surface-hover'
          }`}
      >
        {label}
      </Link>
    )
  }

  const navLinks = [
    link('/', 'Dashboard'),
    link('/pipeline', 'Pipeline'),
    ...(isAdmin ? [link('/analytics', 'Analytics'), link('/ajustes', 'Ajustes')] : []),
  ]

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <img src="/logo.jpg" alt="Cliender" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-bold text-sm text-primary">LeadUp</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {navLinks}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-primary hover:bg-surface-hover transition-colors duration-150"
            aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
          <span className="text-xs text-muted hidden lg:block px-2">{user?.name}</span>
          <button
            onClick={logout}
            className="hidden md:block btn-ghost text-sm text-muted"
          >
            Salir
          </button>
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg text-muted hover:text-primary hover:bg-surface-hover transition-colors"
            aria-label="Abrir menú"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <XIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-surface-border bg-surface px-4 pb-4 pt-3 flex flex-col gap-1 animate-fade-in">
          {navLinks}
          <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between">
            <span className="text-xs text-muted">{user?.name}</span>
            <button onClick={logout} className="btn-ghost text-sm text-muted">
              Salir
            </button>
          </div>
        </nav>
      )}
    </header>
  )
}
