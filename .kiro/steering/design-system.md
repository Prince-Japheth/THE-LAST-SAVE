---
inclusion: always
---
# Design System — The Last Save

## Color palette (CSS custom properties)

All colors must use these tokens. Never hardcode hex values in components.

```css
/* Surfaces */
--tls-surface-0: #0a0a0f;   /* page background */
--tls-surface-1: #111118;   /* card / panel */
--tls-surface-2: #1a1a24;   /* elevated panel */
--tls-surface-3: #242433;   /* hover / selected */

/* Accent */
--tls-accent:        #7c5cfc;  /* primary purple */
--tls-accent-glow:   #7c5cfc44;
--tls-accent-dim:    #4a3899;

/* Halloween */
--tls-orange:        #ff6b1a;
--tls-orange-glow:   #ff6b1a33;
--tls-ghost-white:   #e8e8f0;
--tls-moon-yellow:   #ffd85c;
--tls-blood-red:     #c0392b;

/* Text */
--tls-text-primary:   #e8e8f0;
--tls-text-secondary: #9090a8;
--tls-text-dim:       #5a5a70;

/* Status */
--tls-success: #2ecc71;
--tls-warning: #f39c12;
--tls-error:   #e74c3c;
--tls-info:    #3498db;
```

## Typography

```css
/* Headings: DM Mono (self-hosted) */
font-family: 'DM Mono', monospace;

/* Body: DM Sans (self-hosted) */
font-family: 'DM Sans', sans-serif;

/* Artifact titles / era labels: Instrument Serif (self-hosted) */
font-family: 'Instrument Serif', serif;
```

Never load fonts from Google Fonts or any CDN. All font files are in `public/fonts/`.

## Animation rules

- All transforms must use `transform` and `opacity` only (no layout-triggering properties).
- Keyframe animations that move elements must be wrapped:
  ```css
  @media (prefers-reduced-motion: no-preference) {
    .animated-element { animation: my-keyframe 2s ease infinite; }
  }
  ```
- Target 60 FPS. Debounce event-driven animations to ≥ 100 ms.
- `will-change: transform, opacity` allowed only on actively animating elements; remove after animation ends.

## Spacing scale

```css
--tls-space-1: 4px;
--tls-space-2: 8px;
--tls-space-3: 12px;
--tls-space-4: 16px;
--tls-space-5: 24px;
--tls-space-6: 32px;
--tls-space-7: 48px;
--tls-space-8: 64px;
```

## Breakpoints

```css
/* Mobile-first */
/* base:   < 640px  */
/* tablet: ≥ 640px  */
/* desktop: ≥ 1024px */
```

## Interactive states

Every interactive element must have visible `:focus-visible` styling using `--tls-accent` outline. Never remove focus outlines without replacing them.

```css
:focus-visible {
  outline: 2px solid var(--tls-accent);
  outline-offset: 3px;
  border-radius: 4px;
}
```

## Icon usage

Icons come from `iconsax-reactjs` only. Never import SVG icon files inline unless they are custom project artwork (pumpkin, skeleton, ghost, Kiro badge). Custom artwork lives in `app/icon.svg` or `public/halloween/`.

## Accessibility minimums

- Color contrast ratio ≥ 4.5:1 for body text against its background.
- All interactive controls have an accessible name (`aria-label` or visible label).
- Decorative images have `aria-hidden="true"`.
- Dialog components trap focus and restore it on close.
- Sound controls expose muted state via `aria-pressed`.
