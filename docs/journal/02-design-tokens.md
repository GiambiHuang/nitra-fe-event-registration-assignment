# Journal 02 — Design tokens: colors, typography, font

Detailed notes for reconciling the app's design-token layer with the real
Figma values. Summarized in [`PLAN.md`](../../PLAN.md).

## Goal

The starter repo ships with a semantic color/typography token system
(`src/unocss/`, `src/css/`) that was clearly scaffolded from the same design
system, but had never been checked against the actual Figma values. Given the
Figma token list (Text / Background / Border / Divider / Typography), the goal
was to verify every value, fix the ones that didn't match, fill in the gaps
(missing font-weight steps, missing body text scale, no font-family), and wire
up a real typeface.

## Method

Converted each given `hsla()` value to RGB/hex by hand and compared it against
the existing token — most matched exactly, which confirmed the current
`semantic.js`/`colors.scss` scaffold is a real (if incomplete) implementation
of this design system, not placeholder guesses.

## Findings — color tokens

**Matched exactly** (no change): all `text/*` tokens, `bg/surface/L0-L2`,
`bg/brand/emphasis/active`, `bg/danger/muted/rest`, `border/neutral/muted`,
`border/neutral/quiet`, `border/brand/emphasis`, `divider/default`,
`divider/muted`.

**Didn't match — fixed:**

- `bg/brand/muted/rest` — Figma value converts to `#EEF6F7` (teal[0]), but the
  code had `#CBE5E6` (teal[50]) at that slot. Changed
  `--bg-brand-muted-rest` in `src/css/colors.scss`.
- `bg/info/subtle/rest` and `bg/warning/subtle/rest` — Figma gives pure white
  for both; the code used the ramp's near-white tint (`blue[0]`, `yellow[50]`).
  Changed both `rest` values to `'white'` in `src/unocss/semantic.js`.
- `border/info/opacity` — Figma value is a solid `gray[100]`
  (`hsla(204, 10%, 90%, 1)`, alpha = 1), not the translucent blue
  (`rgba(26, 126, 199, 0.5)`) the code had. Changed to `gray[100]`.

Only the specific values given were changed — sibling `hover`/`active` steps
for `bg-brand-muted` etc. weren't touched since no Figma value was provided for
them.

## Findings — typography

Font sizes and line heights for h1–h4/subtitle1/subtitle2 already matched
Figma exactly. Font weights and the body text scale did not:

- The existing `fontWeight` scale (`bold: 630`, `semibold: 610`,
  `medium: 570`, `regular: 485`) doesn't correspond to any value in the Figma
  spec except `regular`. It reads as a placeholder someone estimated, not a
  real token pull. Replaced with the actual weights, named by step:
  `extrabold: 700`, `bold: 680`, `semibold: 600`, `medium: 550`,
  `regular: 485`.
- Previously every heading (h1–h4) shared one `font-bold` shortcut and both
  subtitles shared one `font-semibold` — losing the fact that Figma specifies
  **different** weights per level (h1 is 700; h2/h3/h4 are 680, one step
  lighter). Rewired `text-h1` to `font-extrabold` and kept `text-h2/h3/h4` on
  `font-bold` (now 680, not 630).
- The body text scale (`body/lg/regular`, `body/sm/regular`,
  `body/sm/medium`, `body/xs/regular`) didn't exist as shortcuts at all. Added
  `text-body-lg`, `text-body-sm`, `text-body-sm-medium`, `text-body-xs`.
  `xs` also required a new size step — `--font-size-xs: 11px` /
  `--line-height-xs: 14px` — since the existing scale only went down to `sm`
  (12px/16px).

## Font: self-hosted Inter

Nothing in the repo loaded any font before this — no `font-family` anywhere,
no `@font-face`, no Google Fonts reference.

**Chose `@fontsource-variable/inter` over other options.** The reasoning:

- The design's weight values (485, 550, 600, 680, 700) are not the standard
  100-multiple steps (400/500/600/700...) that fixed-weight font files ship
  in — they're arbitrary points on a continuous scale. Only a **variable**
  font file can render arbitrary weights like 485 or 680 accurately; a
  fixed-weight family would have to snap each one to its nearest available
  step, which defeats the point of having a precise weight scale.
- `@fontsource-variable/inter` packages the actual `.woff2` variable-font
  files and ships them as an npm dependency, so `yarn install` is enough to
  have the font locally — no CDN call at runtime, no `<link>` to
  `fonts.googleapis.com`, and no separate step to go find and license font
  files by hand. It resolves through Vite's normal asset pipeline like any
  other imported asset.
- Alternative considered: a Google Fonts `<link>`/`@import` — rejected because
  it adds a runtime dependency on an external host (every page load blocks on
  or waits for a third-party request) and doesn't solve the variable-weight
  problem unless specifically requesting the variable endpoint, which is
  effectively re-deriving what the npm package already gives for free.
- Alternative considered: hand-downloading `.woff2` files from Google Fonts
  and committing them directly — rejected because it's unversioned (no `yarn
  upgrade` path, no changelog) and someone has to manually pick the right
  subset/axis files.

Wired up via a Quasar boot file (`src/boot/fonts.js`, just
`import '@fontsource-variable/inter'`) rather than a CSS `@import`, since boot
files are proper Vite/ESM entry points and this is the pattern already used for
`unocss` — registered as `boot: ['fonts', 'unocss']`. Set as the `body`
font-family in `app.scss`, alongside the default text color
(`var(--text-neutral-default)`) per the spec ("text defaults to
text/neutral/default").

## Verification

- `yarn typecheck` / `yarn lint` / `yarn build` all pass.
- Checked the actual production build output rather than trusting the
  install: `dist/spa/assets/` contains 8 real `.woff2` files, and grepping the
  built CSS for `fonts.googleapis` / `fonts.gstatic` returns nothing —
  confirms the font is genuinely bundled, not silently falling back to a CDN.
- `yarn dev` boots cleanly with the new boot file; no console/build errors.

## Open / revisit later

- Three color-token fixes were derived from hand HSL→RGB conversion, not a
  direct Figma inspection (e.g. via Figma Dev Mode / MCP). Worth a quick
  visual cross-check against the live Figma file if time allows.
- Spacing, radius, and shadow tokens were explicitly out of scope for this
  pass — not pulled from Figma yet.
