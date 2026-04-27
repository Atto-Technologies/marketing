# atto.tech

Marketing site for **Atto** — structured documents for high-stakes work.

- **Framework:** Astro 5 (static output)
- **Theme:** Light default, dark mode toggle with `localStorage` persistence
- **Typography:** Cabinet Grotesk (display) + Satoshi (body) from Fontshare
- **Design system:** sharp corners everywhere (`border-radius: 0` globally), teal accent (`#01696F`), editorial off-white surface

## Develop

```bash
pnpm install
pnpm dev         # http://localhost:4321
pnpm build       # outputs to dist/
pnpm preview     # preview the build
```

## Project structure

```
src/
  pages/
    index.astro        # homepage — 7 sections
    product.astro      # product deep-dive
    docs.astro         # Atto Format spec, sticky sidebar
    pricing.astro      # 3 tiers + FAQ
  layouts/
    Base.astro         # <head>, nav, footer, theme init
  components/
    Nav.astro          # sticky nav + mobile hamburger
    Footer.astro       # 4-column footer
    ThemeToggle.astro  # icon button, driven by Base.astro script
  styles/
    base.css           # tokens, reset, shared utilities
public/
  favicon.svg
```

## Design tokens

All tokens live in `src/styles/base.css` and are re-exported per theme via
`:root`, `[data-theme="dark"]`, and `prefers-color-scheme: dark`.

- Colors: `--color-bg`, `--color-surface`, `--color-border`, `--color-text*`, `--color-primary*`, `--color-on-primary`, `--color-code-bg`
- Type: `--font-display`, `--font-body`, `--font-mono`, `--text-xs` → `--text-hero`
- Space: `--space-1` → `--space-32`
- Widths: `--content-narrow`, `--content-default`, `--content-wide`

## Theme persistence

The inline script in `<head>` reads `atto-theme` from `localStorage` (falling
back to `prefers-color-scheme`) and sets `data-theme` before first paint — no
FOUC. Toggling persists to storage and updates the icon.

## Conventions

- No rounded corners anywhere — `* { border-radius: 0 !important; }`
- Every `<pre>` uses `.code-block` which provides the 3px teal left border
- Directive names in code samples are tagged with `<span class="tok-directive">` for the teal accent color
- Inline code blocks use `em`-relative font sizing so they scale with their context
- `{` and `}` in code samples are escaped as `&#123;` / `&#125;` so Astro's JSX-like parser doesn't interpret them as expressions
