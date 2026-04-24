import React from 'react';

// ─── GlassCard ───────────────────────────────────────────────
export function GlassCard({ children, className = '' }) {
  return (
    <div
      className={className}
      style={{
        background: 'rgba(255 255 255 / 0.04)',
        border: '1px solid rgba(255 255 255 / 0.08)',
        borderRadius: 'var(--radius)',
        backdropFilter: 'var(--blur)',
        WebkitBackdropFilter: 'var(--blur)',
      }}
    >
      {children}
    </div>
  );
}

// ─── GlassButton ─────────────────────────────────────────────
const variantStyles = {
  primary: {
    background: 'var(--accent)',
    color: '#fff',
    border: '1px solid transparent',
  },
  blue: {
    background: 'var(--blue)',
    color: '#fff',
    border: '1px solid transparent',
  },
  ghost: {
    background: 'rgba(255 255 255 / 0.06)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  },
};

export function GlassButton({ children, variant = 'ghost', onClick, disabled, className = '' }) {
  const base = {
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'opacity 0.15s, filter 0.15s',
    ...variantStyles[variant],
  };

  return (
    <button style={base} onClick={!disabled ? onClick : undefined} className={className}>
      {children}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────
const badgeStyles = {
  success: { background: 'rgba(16 185 129 / 0.15)', color: '#10b981', border: '1px solid rgba(16 185 129 / 0.3)' },
  draft:   { background: 'rgba(255 255 255 / 0.06)', color: 'rgba(255 255 255 / 0.5)', border: '1px solid rgba(255 255 255 / 0.1)' },
  warning: { background: 'rgba(245 158 11 / 0.15)', color: '#f59e0b', border: '1px solid rgba(245 158 11 / 0.3)' },
  error:   { background: 'rgba(239 68 68 / 0.15)', color: '#ef4444', border: '1px solid rgba(239 68 68 / 0.3)' },
};

export function Badge({ children, variant = 'draft' }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '20px',
        fontSize: '11px',
        fontWeight: 600,
        ...badgeStyles[variant],
      }}
    >
      {children}
    </span>
  );
}

// ─── AgentNode ────────────────────────────────────────────────
const statusDot = {
  generating: { color: '#6366f1', animation: 'pulse 1s infinite' },
  completed:  { color: '#10b981' },
  idle:       { color: 'rgba(255 255 255 / 0.2)' },
};

export function AgentNode({ title, agent, status = 'idle', children }) {
  const dot = statusDot[status] || statusDot.idle;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 14px',
        background: 'rgba(255 255 255 / 0.04)',
        border: `1px solid ${status === 'generating' ? 'rgba(99 102 241 / 0.4)' : 'var(--border)'}`,
        borderRadius: '10px',
        transition: 'border-color 0.2s',
      }}
    >
      <span style={{ fontSize: 18, marginTop: 1, color: dot.color }}>◉</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
          <Badge variant={status === 'completed' ? 'success' : status === 'generating' ? 'warning' : 'draft'}>
            {agent}
          </Badge>
        </div>
        {children && (
          <p style={{ fontSize: 12, color: 'rgba(255 255 255 / 0.45)', lineHeight: 1.5 }}>{children}</p>
        )}
      </div>
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────
export function Header({ title, subtitle }) {
  return (
    <header style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>{title}</h1>
      {subtitle && (
        <p style={{ fontSize: 14, color: 'rgba(255 255 255 / 0.45)', marginTop: 4 }}>{subtitle}</p>
      )}
    </header>
  );
}

// ─── LoadingSpinner ───────────────────────────────────────────
export function LoadingSpinner({ size = 24 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `2px solid rgba(255 255 255 / 0.1)`,
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block',
      }}
    />
  );
}
