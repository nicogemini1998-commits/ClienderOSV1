/**
 * 🎨 COMPONENTES REACT — CLIENDER Design System
 * 
 * Componentes elegantes, minimalistas, Dark Glass style
 * Aplica a: FullStackAI, ContentStudio, LeadUp
 * 
 * USO:
 * import { GlassButton, GlassCard, AgentNode, Badge } from './components'
 */

import React from 'react';

// ============================================================
// 1. GLASS BUTTON (Liquid Glass)
// ============================================================

export const GlassButton = ({ 
  children, 
  variant = 'neutral', // 'violet', 'blue', 'neutral', 'primary'
  size = 'normal', // 'normal', 'small'
  loading = false,
  disabled = false,
  onClick,
  className = ''
}) => {
  const variants = {
    violet: 'bg-gradient-to-b from-purple-500 to-purple-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.18),0_4px_24px_rgba(124,58,237,0.28)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.18),0_8px_36px_rgba(124,58,237,0.28)]',
    blue: 'bg-gradient-to-b from-blue-500 to-blue-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.22),inset_0_-1px_0_rgba(0,0,0,0.18),0_4px_24px_rgba(59,130,246,0.28)]',
    neutral: 'bg-glass backdrop-blur-[24px] border border-white/8 shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]',
    primary: 'bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
  };

  const sizes = {
    normal: 'px-5 py-2 text-sm',
    small: 'px-3 py-1 text-xs'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        rounded-full font-medium transition-all duration-200 ease-spring
        relative overflow-hidden group
        ${variants[variant]} ${sizes[size]}
        ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}
        ${className}
      `}
    >
      {/* Shimmer effect (glass buttons) */}
      {(variant === 'violet' || variant === 'blue') && !disabled && (
        <div className="absolute inset-0 h-1/2 top-0 bg-gradient-to-b from-white/18 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
      
      {/* Loading spinner */}
      {loading && (
        <span className="inline-block mr-2 w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      
      {children}
    </button>
  );
};

// ============================================================
// 2. GLASS CARD
// ============================================================

export const GlassCard = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl bg-glass backdrop-blur-[20px] 
        border border-white/8 hover:border-white/12
        shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_32px_rgba(0,0,0,0.40)]
        transition-all duration-200 ease-spring
        ${onClick ? 'cursor-pointer hover:scale-105' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

// ============================================================
// 3. AGENT NODE (Canvas)
// ============================================================

export const AgentNode = ({ 
  title, 
  agent, 
  status = 'idle', // 'idle', 'generating', 'success', 'error'
  children,
  onExecute
}) => {
  const statusColors = {
    idle: 'text-white/40',
    generating: 'text-blue-400',
    success: 'text-emerald-400',
    error: 'text-red-400'
  };

  const statusIcons = {
    idle: '◎',
    generating: '◉',
    success: '✓',
    error: '✕'
  };

  return (
    <GlassCard className="w-full max-w-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-lg ${statusColors[status]} font-semibold`}>
            {statusIcons[status]}
          </span>
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
        <span className="text-xs uppercase tracking-wider text-white/20">{agent}</span>
      </div>

      {/* Content */}
      <div className="text-sm text-white/80 mb-4">
        {children}
      </div>

      {/* Footer */}
      <GlassButton 
        variant="blue" 
        size="small"
        onClick={onExecute}
        disabled={status === 'generating'}
        className="w-full"
      >
        {status === 'generating' ? 'Processing...' : 'Execute'}
      </GlassButton>
    </GlassCard>
  );
};

// ============================================================
// 4. BADGE / PILL
// ============================================================

export const Badge = ({ 
  children, 
  variant = 'default', // 'draft', 'generating', 'preview', 'published', 'success', 'warning', 'danger'
  className = ''
}) => {
  const variants = {
    draft: 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20',
    generating: 'bg-blue-400/10 text-blue-400 border border-blue-400/20 animate-pulse',
    preview: 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
    published: 'bg-purple-400/10 text-purple-400 border border-purple-400/20',
    success: 'bg-emerald-400/10 text-emerald-400 border border-emerald-400/20',
    warning: 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20',
    danger: 'bg-red-400/10 text-red-400 border border-red-400/20'
  };

  return (
    <span className={`
      inline-flex items-center px-3 py-1 rounded-full
      text-xs font-medium uppercase tracking-wider
      ${variants[variant]} ${className}
    `}>
      {children}
    </span>
  );
};

// ============================================================
// 5. INPUT FIELD
// ============================================================

export const GlassInput = ({ 
  type = 'text',
  placeholder = '',
  value,
  onChange,
  label,
  hint,
  error,
  disabled = false,
  className = ''
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs uppercase tracking-widest text-white/28 mb-2 font-medium">
          {label}
        </label>
      )}
      
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-lg
          bg-glass backdrop-blur-sm border border-white/8
          text-white placeholder-white/18
          focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50
          transition-colors duration-200
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${error ? 'border-red-500/50' : ''}
          ${className}
        `}
      />
      
      {hint && <p className="text-xs text-white/22 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
};

// ============================================================
// 6. TEXTAREA
// ============================================================

export const GlassTextarea = ({ 
  placeholder = '',
  value,
  onChange,
  label,
  rows = 4,
  maxLength,
  className = ''
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs uppercase tracking-widest text-white/28 mb-2 font-medium">
          {label}
        </label>
      )}
      
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rows={rows}
        maxLength={maxLength}
        className={`
          w-full px-4 py-3 rounded-lg
          bg-glass backdrop-blur-sm border border-white/8
          text-white placeholder-white/18
          focus:outline-none focus:border-indigo-500/50
          transition-colors duration-200 resize-none
          font-mono text-sm
          ${className}
        `}
      />
      
      {maxLength && (
        <p className="text-xs text-white/22 mt-1 text-right">
          {value?.length || 0} / {maxLength}
        </p>
      )}
    </div>
  );
};

// ============================================================
// 7. STAT CARD
// ============================================================

export const StatCard = ({ 
  label, 
  value, 
  unit = '',
  trend,
  icon = null
}) => {
  return (
    <GlassCard className="p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-white/28 mb-2">
            {label}
          </p>
          <p className="text-2xl font-bold text-white">
            {value}
            <span className="text-sm text-white/40 ml-1">{unit}</span>
          </p>
          {trend && (
            <p className={`text-xs mt-2 ${trend.positive ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value}% vs last period
            </p>
          )}
        </div>
        {icon && (
          <div className="text-3xl opacity-20">{icon}</div>
        )}
      </div>
    </GlassCard>
  );
};

// ============================================================
// 8. SKELETON LOADER
// ============================================================

export const Skeleton = ({ width = 'w-full', height = 'h-4', count = 1, className = '' }) => {
  return (
    <>
      {Array(count).fill(0).map((_, i) => (
        <div
          key={i}
          className={`
            ${width} ${height} rounded
            bg-gradient-to-r from-white/4 via-white/8 to-white/4
            animate-shimmer
            ${className}
          `}
        />
      ))}
    </>
  );
};

// ============================================================
// 9. HEADER
// ============================================================

export const Header = ({ title, subtitle, children }) => {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-bold text-white mb-1">{title}</h1>
      {subtitle && (
        <p className="text-sm text-white/40">{subtitle}</p>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
};

// ============================================================
// 10. LOADING SPINNER
// ============================================================

export const LoadingSpinner = ({ size = 'md' }) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3'
  };

  return (
    <div className={`${sizes[size]} border-white/20 border-t-indigo-500 rounded-full animate-spin`} />
  );
};

// ============================================================
// Tailwind CSS Classes to add to globals.css:
// ============================================================

/*
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes spring {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.glass {
  @apply bg-white/[0.04] backdrop-blur-[20px];
}

.ease-spring {
  @apply transition-all duration-200;
  animation-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
}

.animate-shimmer {
  background-size: 200% 100%;
  animation: shimmer 1.8s ease infinite;
  background-image: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.04),
    rgba(255, 255, 255, 0.08),
    rgba(255, 255, 255, 0.04)
  );
}
*/

export default {
  GlassButton,
  GlassCard,
  AgentNode,
  Badge,
  GlassInput,
  GlassTextarea,
  StatCard,
  Skeleton,
  Header,
  LoadingSpinner
};
