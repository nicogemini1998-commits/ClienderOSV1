# 🎨 ClienderOS Design System v1

Guía completa de estilos, colores, formas y animaciones para todas las apps de ClienderOS.

---

## 📋 Índice

1. [Colores](#colores)
2. [Tipografía](#tipografía)
3. [Espaciado y Layout](#espaciado-y-layout)
4. [Formas y Bordes](#formas-y-bordes)
5. [Animaciones](#animaciones)
6. [Componentes Base](#componentes-base)
7. [Estados Interactivos](#estados-interactivos)
8. [Tema por App](#tema-por-app)
9. [Accesibilidad](#accesibilidad)

---

## 🎨 Colores

### Paleta Principal — Dark Luxury + Neon

#### Fondos
```
Darkest (UI base):    #0a0a0a  (oklch(8% 0 0))
Dark (panels):        #1a1a1a  (oklch(12% 0 0))
Surface (cards):      #242424  (oklch(15% 0 0))
Elevated:             #2d2d2d  (oklch(18% 0 0))
Hover:                #333333  (oklch(20% 0 0))
```

#### Acentos — Neon Purple Glow
```
Primary Neon:         #8b5cf6  (oklch(60% 0.21 250))  ← Logo, hover, highlights
Bright Neon:          #a78bfa  (oklch(70% 0.18 250))  ← Glow, emphasis
Deep Purple:          #6d28d9  (oklch(45% 0.24 250))  ← Darker accent
```

#### Textos
```
Text Primary:         #f5f5f5  (oklch(96% 0 0))       ← Cuerpo principal
Text Secondary:       #a0a0a0  (oklch(65% 0 0))       ← Labels, helper
Text Tertiary:        #707070  (oklch(45% 0 0))       ← Disabled, subtle
```

#### Semántica
```
Success:              #10b981  (oklch(70% 0.19 160))
Warning:              #f59e0b  (oklch(70% 0.21 40))
Error:                #ef4444  (oklch(60% 0.25 25))
Info:                 #3b82f6  (oklch(60% 0.23 250))
```

#### Uso por App

**Studio (Dark Luxury Glassmorphism):**
- Fondos: `#0a0a0a` a `#2d2d2d`
- Primario: `#8b5cf6` (neon purple)
- Efectos: Glow + shadow neon

**LeadUp (Clean Dark):**
- Fondos: `#1a1a1a` a `#242424`
- Primario: Tailwind `blue-600` / `#2563eb`
- Efectos: Smooth, no glow extremo

---

## 🔤 Tipografía

### Familias

```css
/* Variable (preferred) */
--font-sans: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, sans-serif;

/* Mono (code) */
--font-mono: "JetBrains Mono", "Courier New", monospace;
```

### Escalas

#### Web (Vite dev server)

```css
--text-xs:     0.75rem;   /* 12px  */ font-weight: 500;
--text-sm:     0.875rem;  /* 14px  */ font-weight: 500;
--text-base:   1rem;      /* 16px  */ font-weight: 400;
--text-lg:     1.125rem;  /* 18px  */ font-weight: 500;
--text-xl:     1.25rem;   /* 20px  */ font-weight: 600;
--text-2xl:    1.5rem;    /* 24px  */ font-weight: 700;
--text-3xl:    1.875rem;  /* 30px  */ font-weight: 700;
```

#### Fluida (para hero/display)

```css
--text-hero: clamp(1.5rem, 5vw, 3.5rem);
--text-display: clamp(2rem, 6vw, 4rem);
```

### Alturas de línea

```css
--leading-tight:  1.2;    /* Headings */
--leading-normal: 1.5;    /* Body text */
--leading-loose:  1.75;   /* Comfortable reading */
```

### Font-weights

```
100 (Thin)    - No usar
400 (Regular) - Body, labels
500 (Medium)  - Labels, small headlines
600 (Semibold)- Subheadings
700 (Bold)    - Headings, emphasis
900 (Black)   - Raro
```

---

## 📐 Espaciado y Layout

### Escala de espaciado (8px base)

```css
--space-xs:   0.25rem;  /* 4px  */
--space-sm:   0.5rem;   /* 8px  */
--space-md:   1rem;     /* 16px */
--space-lg:   1.5rem;   /* 24px */
--space-xl:   2rem;     /* 32px */
--space-2xl:  3rem;     /* 48px */
--space-3xl:  4rem;     /* 64px */
--space-4xl:  6rem;     /* 96px */
```

### Padding estándar

**Componentes pequeños (button, badge):**
```
px: space-sm (8px)
py: space-xs (4px)
```

**Cards/panels:**
```
all: space-lg (24px)
```

**Secciones:**
```
horizontal: clamp(1.5rem, 5vw, 3rem)
vertical: clamp(2rem, 8vw, 4rem)
```

### Gaps (flexbox/grid)

```
Tight:    space-sm   (8px)   - Items muy relacionados
Normal:   space-md   (16px)  - Layout base
Loose:    space-lg   (24px)  - Secciones
```

---

## 🔲 Formas y Bordes

### Radios

```css
--radius-sm:   0.25rem;  /* 4px   - Subtle */
--radius-md:   0.5rem;   /* 8px   - Default */
--radius-lg:   1rem;     /* 16px  - Cards, panels */
--radius-xl:   1.5rem;   /* 24px  - Hero elements */
--radius-full: 9999px;   /* Circles */
```

### Bordes

#### Grosor

```css
--border-thin:   1px;     /* Default */
--border-normal: 2px;     /* Emphasis */
```

#### Estilos

**Studio (glassmorphism):**
```css
border: 1px solid rgba(139, 92, 246, 0.2);  /* Neon purple subtle */
```

**LeadUp (clean):**
```css
border: 1px solid rgba(255, 255, 255, 0.1);  /* Subtle white */
```

### Sombras

#### Studio — Neon Glow

```css
--shadow-sm:      0 2px 4px rgba(0, 0, 0, 0.1);
--shadow-md:      0 4px 12px rgba(0, 0, 0, 0.15);
--shadow-lg:      0 8px 24px rgba(0, 0, 0, 0.2);

/* Glow neon (noche) */
--glow-sm:        0 0 8px rgba(139, 92, 246, 0.3);
--glow-md:        0 0 16px rgba(139, 92, 246, 0.4);
--glow-lg:        0 0 32px rgba(139, 92, 246, 0.5);
```

#### LeadUp — Subtle Elevation

```css
--shadow-sm:      0 2px 4px rgba(0, 0, 0, 0.08);
--shadow-md:      0 4px 12px rgba(0, 0, 0, 0.1);
--shadow-lg:      0 8px 24px rgba(0, 0, 0, 0.12);
```

---

## ✨ Animaciones

### Duraciones

```css
--duration-fast:     150ms;
--duration-normal:   300ms;
--duration-slow:     500ms;
--duration-slower:   700ms;
```

### Easing Functions

```css
--ease-linear:       linear;
--ease-in-out:       cubic-bezier(0.4, 0, 0.2, 1);
--ease-out-expo:     cubic-bezier(0.16, 1, 0.3, 1);     /* Bouncy */
--ease-in-cubic:     cubic-bezier(0.32, 0, 0.67, 0);    /* Slow start */
--ease-out-cubic:    cubic-bezier(0.33, 1, 0.68, 1);    /* Smooth end */
```

### Animaciones Estándar

#### Fade In

```css
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
animation: fadeIn 300ms ease-out;
```

#### Slide In (arriba)

```css
@keyframes slideInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
animation: slideInUp 300ms ease-out-cubic;
```

#### Scale In (zoom)

```css
@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
animation: scaleIn 250ms ease-out;
```

#### Pulse (subtil - enfoque)

```css
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}
animation: pulse 2000ms ease-in-out infinite;
```

#### Glow Neon (Studio only)

```css
@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 8px rgba(139, 92, 246, 0.3);
  }
  50% {
    box-shadow: 0 0 16px rgba(139, 92, 246, 0.6);
  }
}
animation: glowPulse 2000ms ease-in-out infinite;
```

### Transiciones

#### Hover general

```css
transition: all 150ms ease-in-out;
```

#### Color-only (menos disruptivo)

```css
transition: color 150ms ease-in-out,
            border-color 150ms ease-in-out,
            background-color 150ms ease-in-out;
```

#### Transform + opacity

```css
transition: transform 300ms ease-out-cubic,
            opacity 300ms ease-out;
```

---

## 🧩 Componentes Base

### Botón

```css
/* Base */
padding: 0.5rem 1rem;
border-radius: 0.5rem;
font-weight: 500;
font-size: 0.875rem;
transition: all 150ms ease-in-out;
border: 1px solid transparent;
cursor: pointer;

/* Primary (neon) */
background: #8b5cf6;
color: white;

/* Primary hover */
background: #a78bfa;
box-shadow: 0 0 16px rgba(139, 92, 246, 0.3);
```

### Card

```css
/* Base */
background: #242424;
border: 1px solid rgba(139, 92, 246, 0.2);
border-radius: 1rem;
padding: 1.5rem;
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
transition: all 300ms ease-in-out;

/* Hover (Studio) */
border-color: rgba(139, 92, 246, 0.5);
box-shadow: 0 0 16px rgba(139, 92, 246, 0.2);
```

### Input

```css
/* Base */
background: rgba(255, 255, 255, 0.05);
border: 1px solid rgba(255, 255, 255, 0.1);
border-radius: 0.5rem;
padding: 0.5rem 0.75rem;
color: #f5f5f5;
font-size: 0.875rem;

/* Focus */
border-color: #8b5cf6;
box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.1);
outline: none;
```

### Badge

```css
/* Base */
display: inline-block;
padding: 0.25rem 0.75rem;
border-radius: 9999px;
font-size: 0.75rem;
font-weight: 600;
background: rgba(139, 92, 246, 0.1);
color: #a78bfa;
```

---

## 🎯 Estados Interactivos

### Default

```
color: --text-primary
background: base color
border: subtle
shadow: --shadow-sm
```

### Hover

```
color: same or lighter
background: darken 5-10%
border: highlight
shadow: --shadow-md + glow (si aplica)
cursor: pointer
```

### Active / Pressed

```
background: darken 15%
transform: scale(0.98) (subtle press)
box-shadow: inset or darker
```

### Focus (Accessibility)

```
outline: 2px solid #8b5cf6
outline-offset: 2px
```

### Disabled

```
opacity: 0.5
cursor: not-allowed
pointer-events: none
color: --text-tertiary
```

---

## 🎨 Tema por App

### Studio — Dark Luxury Glassmorphism

| Elemento | Color | Efecto |
|----------|-------|--------|
| Fondo | `#0a0a0a` | Base |
| Panel | `#1a1a1a` | Card |
| Primario | `#8b5cf6` | Neon glow |
| Borde | `rgba(139,92,246,0.2)` | Subtle accent |
| Sombra | `+ glow neon` | Luminoso |
| Animación | `ease-out-expo` | Bouncy, smooth |

**Características:**
- Bordes con tinte neon purple
- Glows en hover
- 3D depth efectos
- Animaciones energéticas

### LeadUp — Clean Dark

| Elemento | Color | Efecto |
|----------|-------|--------|
| Fondo | `#1a1a1a` | Base |
| Panel | `#242424` | Card |
| Primario | `#2563eb` | Blue clean |
| Borde | `rgba(255,255,255,0.1)` | Minimal |
| Sombra | Sin glow | Flat elevation |
| Animación | `ease-in-out` | Smooth, linear |

**Características:**
- Bordes white subtle
- Sin glow extremo
- Minimalista, limpio
- Animaciones suaves

---

## ♿ Accesibilidad

### Contraste

✅ **Requerido (WCAG AA):** Ratio mínimo 4.5:1 para texto normal
✅ **AAA (enhanced):** 7:1 para texto pequeño

**Ejemplos:**
```
#f5f5f5 (text) on #0a0a0a (bg): ratio 19.5:1 ✅
#a78bfa (accent) on #1a1a1a (bg): ratio 6.2:1 ✅
```

### Focus States

```css
/* Siempre visible */
outline: 2px solid #8b5cf6;
outline-offset: 2px;
```

### Color como única indicación

❌ **Nunca:** Comunique estado SOLO con color
✅ **Siempre:** Acompaña con icono, texto o forma

```
Ejemplo: Botón desactivado = gris + opacity + disabled text label
```

### Animaciones

❌ **Evitar:** `prefers-reduced-motion`
✅ **Respetar:**

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
  }
}
```

---

## 📱 Responsive Breakpoints

```css
--bp-xs: 320px;   /* Mobile */
--bp-sm: 640px;   /* Tablet small */
--bp-md: 768px;   /* Tablet */
--bp-lg: 1024px;  /* Desktop */
--bp-xl: 1280px;  /* Desktop large */
--bp-2xl: 1536px; /* Ultra wide */
```

### Adaptación por breakpoint

**Espaciado:**
```
xs/sm:  --space-md (16px)
md:     --space-lg (24px)
lg+:    --space-xl (32px)
```

**Tipografía:**
```
xs/sm:  --text-sm (14px)
md:     --text-base (16px)
lg+:    --text-lg (18px)
```

---

## 📚 Jerarquía Visual

### Por orden de importancia

1. **H1 (Hero):** 30-48px, bold, color primary o white
2. **H2 (Section):** 24-30px, semibold, white
3. **H3 (Subsection):** 18-20px, semibold, white
4. **Body (Párrafo):** 16px, regular, secondary text
5. **Label (Formulario):** 14px, medium, tertiary text
6. **Caption (Helper):** 12px, regular, tertiary text

---

## 🎬 Microinteracciones

### Button hover

```
Duration: 150ms
Effect: Color brighten + glow (if neon)
Easing: ease-in-out
```

### Input focus

```
Duration: 300ms
Effect: Border color change + glow outline
Easing: ease-out
```

### Modal appear

```
Duration: 300ms
Effect: Fade in + scale from 95%
Easing: ease-out-cubic
Backdrop: Fade in same duration
```

### Notification slide

```
Duration: 250ms
Effect: Slide from right + fade in
Easing: ease-out-cubic
Exit: Slide out + fade out (200ms)
```

---

## 🔄 Modo Oscuro (siempre activo)

Todas las apps usan dark mode por defecto. No hay toggle light/dark.

**Razón:** Brand identity, energía neon, diferenciación.

---

## 📝 Notas de implementación

### CSS Variables (Tailwind)

```css
/* En tailwind.config.js */
theme: {
  colors: {
    primary: '#8b5cf6',
    dark: '#0a0a0a',
    surface: '#1a1a1a',
  },
  duration: {
    fast: '150ms',
    normal: '300ms',
  },
  /* etc */
}
```

### Consistencia

- Usar variables siempre, nunca valores hardcodeados
- Revisar contraste con WCAG AA minimum
- Testear animaciones en `prefers-reduced-motion`
- Verificar responsive en 320px, 768px, 1024px

---

**Última actualización:** 2026-04-29  
**Versión:** 1.0  
**Mantenedor:** ClienderOS Design Team
