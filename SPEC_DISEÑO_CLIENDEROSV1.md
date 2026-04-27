# SPEC & DISEÑO — CLIENDER OS v1
> Documento de referencia de identidad visual y sistema de diseño.
> Usar este archivo para replicar la estética en cualquier herramienta, app o pantalla nueva.

---

## 1. IDENTIDAD DE MARCA

### Nombre y submarcas
| App | Nombre completo | Subtítulo |
|-----|----------------|-----------|
| Sistema operativo | **CLIENDER OS** | Workspace interno |
| CRM de prospección | **LeadUp** | by Cliender |
| Canvas de contenido | **Design Studio** | Cliender |
| Orquestador de IA | **BOB** | Orchestrator |

### Personalidad visual
- **Dark mode exclusivo** — nunca light mode
- **Tech profesional** — no startup colorida, no corporativo aburrido
- **Neon sobre negro** — profundidad con detalles de luz
- **Minimalista con carácter** — sin ruido, pero no vacío
- **Glassmorphism sutil** — capas translúcidas, no exageradas

### Logo
- **Forma:** Cuadrado redondeado estilo icono de app (iOS/macOS)
- **Fondo:** Negro muy oscuro con tono azul/violeta (`#05050f` aprox.)
- **Símbolo:** Forma estilizada tipo "C" o infinito con efecto neón
- **Color del símbolo:** Violeta/púrpura neón — de `#7c3aed` a `#a855f7`
- **Glow exterior:** Halo púrpura atmosférico alrededor del icono
- **Efecto:** Glassmorphism 3D — el icono tiene profundidad y brillo propio
- **Uso en UI:** Siempre con `border-radius: 7-12px` y `object-fit: cover`
- **Tamaños estándar:**
  - Favicon: 32×32px
  - Navbar/header: 28×28px
  - Login screen: 48-56px
  - Splash/hero: libre

---

## 2. PALETA DE COLORES

### Sistema principal (LeadUp / Tailwind)
```css
/* Fondos — de más oscuro a más claro */
--surface:        #0f1117   /* fondo de pantalla */
--surface-raised: #161b27   /* fondo elevado, sidebars */
--surface-card:   #1c2232   /* tarjetas, paneles */
--surface-hover:  #222840   /* hover state */
--surface-border: #2a3347   /* bordes, separadores */

/* Acento principal — azul eléctrico */
--accent:         #4f8ef7
--accent-light:   #7aaeff
--accent-dark:    #2d6dd4

/* Texto */
--text:           #e2e8f0   /* texto principal */
--text-muted:     #64748b   /* texto secundario */
```

### Sistema Studio (oklch — más preciso)
```css
/* Oklch = Lightness / Chroma / Hue */
/* Fondos */
background-deep:  oklch(10% 0.010 265)   /* más oscuro */
background-base:  oklch(11% 0.015 250)   /* pantalla base */
background-panel: oklch(15% 0.012 265)   /* paneles */
background-card:  oklch(18% 0.015 265)   /* tarjetas */

/* Bordes (blancos con opacidad) */
border-subtle:    oklch(100% 0 0 / 0.06)
border-normal:    oklch(100% 0 0 / 0.09)
border-strong:    oklch(100% 0 0 / 0.15)

/* Acento azul/índigo */
accent-blue:      oklch(55% 0.22 265)
accent-blue-dark: oklch(42% 0.24 280)

/* Acento verde (éxito, activo, llamadas) */
accent-green:     oklch(55% 0.18 155)
accent-green-dim: oklch(55% 0.18 155 / 0.15)

/* Texto */
text-primary:     oklch(92% 0 0)
text-secondary:   oklch(65% 0 0)
text-muted:       oklch(38-45% 0 0)
```

### Colores semánticos (estados y señales)
```
✅ Éxito / Activo / Cerrado:   #10b981  (emerald-500)
⚠️  Advertencia / Pendiente:   #f59e0b  (amber-500)
❌  Error / Rechazado / Baja:  #ef4444  (red-500)
⬜ Neutro / Sin respuesta:     #6b7280  (gray-500)
```

### Oportunidad de lead (colores específicos)
```
Alta oportunidad:  emerald  — #10b981 con fondo #10b981/10
Media oportunidad: amber    — #f59e0b con fondo #f59e0b/10
Baja oportunidad:  red      — #ef4444 con fondo #ef4444/10
```

### Estado de lead
```
pending   (Pendiente):     amber   #f59e0b
no_answer (Sin respuesta): gray    #6b7280
closed    (Cerrado):       emerald #10b981
rejected  (Rechazado):     red     #ef4444
```

---

## 3. TIPOGRAFÍA

### Fuentes
| Uso | Fuente | Pesos |
|-----|--------|-------|
| Texto general (LeadUp) | **Inter** | 400, 500, 600, 700 |
| Texto general (Studio) | **Plus Jakarta Sans** | 300, 400, 500, 600, 700, 800 |
| Código, monoespaciado (LeadUp) | **JetBrains Mono** | 400, 500 |
| Código, etiquetas (Studio) | **IBM Plex Mono** | 400, 500 |

### Escala tipográfica
```
Etiquetas de sección:   10px  / font-weight: 900 / UPPERCASE / letter-spacing: 0.15em / color: muted
Texto pequeño:          11px  / font-weight: 400-500
Cuerpo secundario:      12px  / font-weight: 400
Cuerpo principal:       13-14px / font-weight: 400-500
Subtítulos:             16px  / font-weight: 700
Títulos de card:        18-20px / font-weight: 700-800
Títulos de pantalla:    24-28px / font-weight: 800-900
Números grandes (score): 28-36px / font-weight: 900
```

### Reglas tipográficas
- Títulos siempre con `letter-spacing: -0.02em` (ligeramente comprimidos)
- Etiquetas de sección siempre en `UPPERCASE` + `letter-spacing: 0.10-0.15em`
- Números y teléfonos siempre en fuente **mono**
- Nunca usar fuente genérica sin fallback: siempre `Inter, system-ui, sans-serif`

---

## 4. ESPACIADO Y BORDES

### Radios de borde (border-radius)
```
Chip / badge / tag:    4-6px
Botón pequeño:         6-8px
Input / botón normal:  8-10px
Tarjeta pequeña:       10-12px
Tarjeta / panel:       14-16px
Modal:                 18-20px
Icono de logo en nav:  7-8px
Icono de logo login:   12px
```

### Padding estándar
```
Tarjeta pequeña:   12px
Tarjeta normal:    16px (p-4)
Tarjeta grande:    24px (p-6)
Modal body:        24px
Header/nav:        0 16-20px (horizontal), altura 52px
Section spacing:   32px entre secciones
```

### Bordes
- Siempre `1px solid` — nunca más grueso
- Color: `--surface-border` (#2a3347) o `oklch(100%/0.06-0.09)` para glassmorphism
- Usar `inset box-shadow` en lugar de `border` cuando hay glassmorphism:
  ```css
  box-shadow: inset 0 0 0 1px oklch(100% 0 0 / 0.09);
  ```

---

## 5. SOMBRAS Y PROFUNDIDAD

### Sistema de capas (z-depth)
```
Fondo base:       z-0   — background de pantalla
Contenido:        z-10  — tarjetas, grids
Headers fijos:    z-20  — navbars, toolbars
Paneles slide:    z-30  — sidepanels
Modales:          z-50  — overlays modales
Tooltips:         z-60  — tooltips encima de todo
```

### Sombras de tarjeta
```css
/* Tarjeta estándar */
box-shadow: 0 2px 12px -2px oklch(0% 0 0 / 0.25);

/* Tarjeta hover */
box-shadow: inset 0 0 0 1px oklch(65% 0.2 265 / 0.35),
            0 8px 32px -4px oklch(0% 0 0 / 0.4);

/* Modal */
box-shadow: inset 0 0 0 1px oklch(100% 0 0 / 0.09),
            inset 0 1px 0 oklch(100% 0 0 / 0.07),
            0 24px 64px -8px oklch(0% 0 0 / 0.5);

/* Glow de acento (botones CTA, logo activo) */
box-shadow: 0 0 16px oklch(55% 0.22 265 / 0.35);

/* Glow verde (teléfono verificado, éxito) */
box-shadow: 0 0 12px oklch(55% 0.18 155 / 0.3);
```

---

## 6. GLASSMORPHISM

Patrón usado en headers, modales, paneles flotantes:

```css
/* Fórmula glassmorphism */
background: oklch(11-15% 0.01 250 / 0.85-0.92);
backdrop-filter: blur(20px) saturate(180%);
-webkit-backdrop-filter: blur(20px) saturate(180%);
box-shadow: inset 0 0 0 1px oklch(100% 0 0 / 0.09),
            inset 0 1px 0 oklch(100% 0 0 / 0.07);
```

### Cuándo usarlo
- ✅ Headers fijos (navbar, toolbar)
- ✅ Modales sobre fondo con contenido
- ✅ Paneles que flotan sobre el canvas
- ✅ Overlays de login
- ❌ NO en tarjetas normales de grid (pesado visualmente)
- ❌ NO en elementos pequeños como chips o badges

---

## 7. ANIMACIONES Y TRANSICIONES

### Tokens de tiempo
```css
--duration-fast:   150ms   /* hover states, micro-interacciones */
--duration-normal: 250ms   /* aparición de elementos */
--duration-slow:   400ms   /* modales, transiciones de página */
```

### Easing
```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)   /* entrada de elementos — rápido al inicio, suave al final */
ease-in-out:     para loops y pulsos continuos
```

### Animaciones definidas
```css
/* Aparecer con fade */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
/* Uso: 200ms ease-out */

/* Entrar desde abajo */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
/* Uso: 250ms cubic-bezier(0.16, 1, 0.3, 1) */

/* Pulso suave (spinners, loading) */
@keyframes pulseSoft {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.6; }
}
/* Uso: 2s ease-in-out infinite */

/* Flow de líneas en canvas (Studio) */
@keyframes flow-dash {
  to { stroke-dashoffset: -20; }
}
/* Uso: 1.5s linear infinite */

/* Float de nodos en canvas */
@keyframes nodeFloat {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-4px); }
}
/* Uso: 6s ease-in-out infinite */
```

### Reglas de animación
- Siempre animar solo `opacity`, `transform`, `filter` — nunca `width`, `height`, `top`, `left`
- Hover states siempre `transition: all 150ms` o `transition: color/background 150ms`
- Modales y paneles: `slideUp` al aparecer
- Elementos de lista: `fadeIn` con `animation-delay` escalonado (i × 60ms)

---

## 8. COMPONENTES ESTÁNDAR

### Navbar / Header (52px de altura)
```
- Fondo: glassmorphism sobre el contenido
- Logo: 28px × 28px, border-radius 7px
- Separadores verticales: 1px × 18px, oklch(100%/0.08)
- Botones de nav: 10-11px, ghost style
- Altura fija: 52px
- Borde inferior: inset 0 -1px 0 oklch(100%/0.07)
```

### Tarjeta de lead / card
```
- Fondo: --surface-card (#1c2232)
- Borde: 1px solid --surface-border (#2a3347)
- Border-radius: 12-16px
- Padding: 16px
- Stripe de color arriba (2px): según oportunidad
- Hover: border-color cambia a accent/30
```

### Modal
```
- Overlay: bg-black/70 + backdrop-blur-sm
- Panel: max-w-2xl, max-h-92vh, border-radius 16-20px
- Header: padding 24px, border-bottom
- Body: overflow-y-auto, padding 24px, space-y-32px
- Footer: padding 16-24px, border-top, fondo card/60
- Animación entrada: slideUp 250ms expo
```

### Botón primario
```css
background: --accent (#4f8ef7) o gradient(accent → accent-dark)
color: white
font-weight: 700
padding: 10-11px vertical, 16px horizontal
border-radius: 8-10px
transition: all 180ms
box-shadow (hover): 0 4px 18px accent/0.3
disabled: opacity 0.5
```

### Botón ghost
```css
background: transparent (o oklch(100%/0.04) en hover)
border: none (o inset shadow en hover)
color: text-muted → text-white en hover
padding: 5-8px vertical, 10-16px horizontal
border-radius: 6-8px
transition: all 150ms
```

### Input / campo de texto
```css
background: --surface-raised (#161b27)
border: 1px solid --surface-border
border-radius: 8-10px
padding: 10px 14px
color: text-primary
placeholder: text-muted
focus: border-color → accent, outline: none
transition: border-color 150ms
```

### Badge / chip de estado
```css
display: inline-flex; align-items: center; gap: 4-6px
padding: 2px 8-12px
border-radius: 9999px (pill)
font-size: 11-12px; font-weight: 600-700
border: 1px solid [color/30]
background: [color/10]
color: [color tonal]
```

### Etiqueta de sección
```css
font-size: 10px
font-weight: 900
text-transform: uppercase
letter-spacing: 0.15em
color: text-muted (oklch 38-45%)
+ línea horizontal flex-1 h-px background: border
```

---

## 9. FONDO ATMOSFÉRICO

Efecto de gradiente de ambiente usado en pantallas de login y fondos de canvas:

```css
/* Patrón estándar — dos focos de luz ambiental */
background:
  radial-gradient(ellipse 60% 50% at 20% 70%,
    oklch(45% 0.2 265 / 0.06) 0%, transparent 100%),
  radial-gradient(ellipse 50% 40% at 80% 20%,
    oklch(55% 0.18 155 / 0.05) 0%, transparent 100%);

/* Alternativa login — foco izquierda + verde arriba derecha */
background:
  radial-gradient(ellipse 60% 50% at 30% 70%, oklch(45% 0.2 265 / 0.08) 0%, transparent 100%),
  radial-gradient(ellipse 50% 40% at 75% 20%, oklch(55% 0.18 155 / 0.06) 0%, transparent 100%);
```

### Grid pattern (LeadUp login)
```css
background-image:
  linear-gradient(rgba(79,142,247,0.3) 1px, transparent 1px),
  linear-gradient(90deg, rgba(79,142,247,0.3) 1px, transparent 1px);
background-size: 40px 40px;
opacity: 0.05;
```

---

## 10. REGLAS DE DISEÑO (DO / DON'T)

### ✅ HACER
- Siempre dark mode
- Usar color con intención semántica (verde = éxito, ámbar = atención, rojo = error)
- Glassmorphism en elementos que flotan sobre contenido
- Tipografía en UPPERCASE para etiquetas de sección
- Monospace para números, teléfonos, scores, IDs
- Animaciones en `transform` y `opacity` únicamente
- Bordear con `inset box-shadow` en vez de `border` cuando hay glassmorphism
- Separadores de sección: línea horizontal `h-px` con color `surface-border`
- Hover states siempre visibles y rápidos (150ms)
- Logo siempre con `object-fit: cover` y border-radius apropiado

### ❌ NO HACER
- Light mode (nunca)
- Colores planos sin transparencia sobre fondos oscuros
- Animaciones en `width`, `height`, `margin`, `padding`
- Texto en blanco puro (#ffffff) — usar `oklch(92% 0 0)` o `#e2e8f0`
- Fondo negro puro (#000000) — usar `#0f1117` o `oklch(11% 0.015 250)`
- Bordes gruesos (más de 1px)
- Radios de esquina inconsistentes (definir por jerarquía del elemento)
- Sombras de color random — solo negro o el color del acento
- Emojis decorativos en producción (solo en Studio donde es parte del producto)
- Más de 2 fuentes en una misma app

---

## 11. TOKENS CSS LISTOS PARA COPIAR

### Para cualquier app nueva (CSS variables)
```css
:root {
  /* Fondos */
  --bg-base:    #0f1117;
  --bg-raised:  #161b27;
  --bg-card:    #1c2232;
  --bg-hover:   #222840;
  --bg-border:  #2a3347;

  /* Acento */
  --accent:       #4f8ef7;
  --accent-light: #7aaeff;
  --accent-dark:  #2d6dd4;
  --accent-green: #10b981;
  --accent-amber: #f59e0b;
  --accent-red:   #ef4444;
  --accent-violet:#a855f7;  /* color del logo */

  /* Texto */
  --text-primary: #e2e8f0;
  --text-muted:   #64748b;
  --text-faint:   #374151;

  /* Timing */
  --t-fast:   150ms;
  --t-normal: 250ms;
  --ease-expo: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### Para Tailwind (extend en tailwind.config.js)
```js
colors: {
  surface: {
    DEFAULT: '#0f1117',
    raised:  '#161b27',
    card:    '#1c2232',
    hover:   '#222840',
    border:  '#2a3347',
  },
  accent: {
    DEFAULT: '#4f8ef7',
    light:   '#7aaeff',
    dark:    '#2d6dd4',
  },
}
```

---

## 12. APLICACIONES Y SU IDENTIDAD

| App | Color acento secundario | Fuente | Estilo |
|-----|------------------------|--------|--------|
| **LeadUp** | Emerald (teléfono/éxito) + Amber (pendiente) | Inter + JetBrains Mono | Cards grid, badges, status pills |
| **Design Studio** | Verde `oklch(55% 0.18 155)` (imágenes), Azul (canvas) | Plus Jakarta Sans + IBM Plex Mono | Canvas node-based, glassmorphism |
| **BOB Orchestrator** | Azul eléctrico único | Plus Jakarta Sans + IBM Plex Mono | Canvas reactflow, dark industrial |

---

## 13. CHECKLIST ANTES DE LANZAR CUALQUIER PANTALLA

- [ ] ¿Está en dark mode?
- [ ] ¿El fondo usa `--bg-base` (#0f1117) o equivalente?
- [ ] ¿Los bordes son `1px solid --bg-border`?
- [ ] ¿Los hover states tienen `transition: 150ms`?
- [ ] ¿Los elementos flotantes tienen glassmorphism?
- [ ] ¿Las etiquetas de sección están en UPPERCASE?
- [ ] ¿Los números y teléfonos están en fuente mono?
- [ ] ¿El logo tiene border-radius correcto y `object-fit: cover`?
- [ ] ¿Los colores semánticos son consistentes (verde/ámbar/rojo)?
- [ ] ¿Las animaciones usan solo `opacity` y `transform`?
- [ ] ¿El texto no es blanco puro sino `#e2e8f0`?
- [ ] ¿Los modales tienen `slideUp` al aparecer?
