# Feature ideas

## 3D cyberpunk greenhouse hero scene on the homepage (Three.js + Vite)

### Summary

Replace the homepage hero (currently particles.js canvas on a dark gradient) with a live, moving 3D scene rendered in Three.js: a greenhouse with a full IBC (1000L) watering tank, tomatoes growing inside and grapevines on the outside, in a cyberpunk style under a warm sunny midday sky. Other pages (blog, over, talks, projects) keep the current particles hero.

### The scene (procedurally built from primitives, no external assets)

- **Greenhouse** – metal tube frame with glass panels, transparent cyan tint, warm sun catching the glass
- **Full IBC tote (1000L)** – classic dark-blue cube with gray grid frame, legs, wheels, top cap and bottom spigot, with a hose running to the plants; water visibly full with subtle shimmer and occasional drip
- **Tomatoes inside** – stems, leaf clusters, red fruit, gently swaying
- **Grapes outside** – vines along the exterior frame with leaf tufts and purple grape clusters
- **Cyberpunk on a warm sunny day** – warm midday sun as key light, cyan/magenta neon trim strips along the frame with a soft pulse, a flickering neon accent, light fog, glowing floating pollen/dust particles

### Motion (what makes it lively)

- Slow autonomous camera drift
- Subtle mouse parallax
- Swaying plants, drooping grapes, animated water, neon pulse, drifting particles

### Build setup (Vite)

- `package.json`: add `three` dependency;
  - `build:js`: `vite build` — bundles + minifies into `vendor/`
  - `watch:js`: `vite build --watch` (replace the current bare `vite` script) so it rebuilds next to `bundle exec jekyll serve`
- `vite.config.js` (new): single-entry library mode
  - input: `assets/js/hero3d.js`
  - output: `assets/js/hero3d.bundle.js` (IIFE, minified, global `Hero3d`)
  - target: modern browsers (es2020)

### Site wiring

- `assets/js/hero3d.bundle.js` — generated, minified bundle, committed so the site builds without `pnpm install` (`assets/js/` is where Jekyll serves static JS from; `vendor/` is excluded in `_config.yml` and gitignored)
- `_includes/hero.html` — homepage variant renders a `<canvas>` + `<script defer src="/assets/js/hero3d.bundle.js">`; all other heroes untouched
- `_scss/_intro.scss` — `.hero-3d` canvas placement, overlay, reduced-motion styles
- `index.html` — no change

### Performance & accessibility

- `Hero3d.init()` no-ops gracefully when the canvas is missing or WebGL is unavailable (brand gradient fallback)
- Render loop pauses when the hero scrolls out of view (IntersectionObserver)
- Device pixel ratio capped at 2
- `prefers-reduced-motion` — static single frame, no animation

### Files

- `package.json` — `three` dependency, build scripts
- `vite.config.js` — new
- `assets/js/hero3d.js` — new, the 3D scene
- `assets/js/hero3d.bundle.js` — new, generated bundle
- `_includes/hero.html` — homepage: 3D canvas instead of particles
- `_scss/_intro.scss` — `.hero-3d` styles + reduced-motion

### Acceptance criteria

- [ ] Homepage hero shows the animated 3D greenhouse scene; text and CTA button remain readable
- [ ] Blog / Over / Talks / project heroes are unchanged
- [ ] Bundle builds with `pnpm build:js`; no runtime CDN dependency
- [ ] Fallback gradient shown when WebGL is unavailable
- [ ] Static frame rendered for `prefers-reduced-motion`
- [ ] No noticeable main-thread jank while scrolling
