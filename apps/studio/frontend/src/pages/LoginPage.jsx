import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputSt = {
    width: '100%', padding: '10px 14px',
    background: 'oklch(100% 0 0 / 0.05)',
    border: 'none', borderRadius: 9,
    boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.1)',
    color: 'oklch(92% 0 0)', fontSize: 14,
    fontFamily: 'inherit', outline: 'none',
    boxSizing: 'border-box',
    transition: 'box-shadow 180ms',
  };

  return (
    <div style={{
      width: '100vw', height: '100vh',
      background: 'oklch(11% 0.015 250)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Atmospheric glow */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 60% 50% at 30% 70%, oklch(45% 0.2 265 / 0.08) 0%, transparent 100%),
          radial-gradient(ellipse 50% 40% at 75% 20%, oklch(55% 0.18 155 / 0.06) 0%, transparent 100%)
        `,
      }} />

      <div style={{
        width: 380,
        background: 'oklch(15% 0.01 250 / 0.92)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderRadius: 18,
        boxShadow: 'inset 0 0 0 1px oklch(100% 0 0 / 0.09), inset 0 1px 0 oklch(100% 0 0 / 0.07), 0 24px 64px -8px oklch(0% 0 0 / 0.5)',
        padding: '36px 32px',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <img src="/logo.jpg" alt="Cliender" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', boxShadow: '0 0 20px oklch(55% 0.22 265 / 0.3)' }} />
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'oklch(92% 0 0)', letterSpacing: '-0.02em' }}>CLIENDER</div>
            <div style={{ fontSize: 11, color: 'oklch(38% 0 0)', marginTop: 1 }}>OS · Workspace</div>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: 'oklch(92% 0 0)', letterSpacing: '-0.02em', marginBottom: 4 }}>Iniciar sesión</div>
          <div style={{ fontSize: 12, color: 'oklch(40% 0 0)' }}>Accede con tu cuenta @cliender.com</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: 'oklch(45% 0 0)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Email</div>
            <input
              type="email"
              placeholder="nombre@cliender.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoFocus
              required
              style={inputSt}
              onFocus={e => { e.currentTarget.style.boxShadow = 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.5)'; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'inset 0 0 0 1px oklch(100% 0 0 / 0.1)'; }}
            />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'oklch(45% 0 0)', fontFamily: 'IBM Plex Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Contraseña</div>
            <input
              type="password"
              placeholder="••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={inputSt}
              onFocus={e => { e.currentTarget.style.boxShadow = 'inset 0 0 0 1px oklch(65% 0.2 265 / 0.5)'; }}
              onBlur={e => { e.currentTarget.style.boxShadow = 'inset 0 0 0 1px oklch(100% 0 0 / 0.1)'; }}
            />
          </div>

          {error && (
            <div style={{
              padding: '8px 12px', borderRadius: 7,
              background: 'oklch(62% 0.22 25 / 0.12)',
              boxShadow: 'inset 0 0 0 1px oklch(62% 0.22 25 / 0.3)',
              fontSize: 12, color: 'oklch(72% 0.18 25)',
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: '11px',
              borderRadius: 10, border: 'none',
              background: loading ? 'oklch(30% 0 0)' : 'linear-gradient(135deg, oklch(55% 0.2 265), oklch(46% 0.22 280))',
              color: 'oklch(97% 0 0)', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', letterSpacing: '-0.01em',
              boxShadow: loading ? 'none' : '0 4px 18px oklch(55% 0.2 265 / 0.3)',
              transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)',
            }}
          >{loading ? 'Entrando...' : 'Entrar →'}</button>
        </form>
      </div>
    </div>
  );
}
