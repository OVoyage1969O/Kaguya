---
name: "永远邸 / Kaguya"
description: "A Persona-inspired blue visual world for a personal archive."
colors:
  p3-blue: "#124cfa"
  p3-cyan: "#4de5f5"
  p3-night: "#061b49"
  page-bg-light: "#edf3fc"
  deep-text-light: "#0a2453"
  primary-light: "#174cce"
  content-meta-light: "#526885"
  line-divider-light: "#c3d1e7"
  float-panel-bg-light: "#f5f8ff"
  hover-light: "#d8e6ff"
  page-bg-dark: "#07172f"
  deep-text-dark: "#eaf4ff"
  primary-dark: "#66d8fa"
  content-meta-dark: "#9eb5d1"
  line-divider-dark: "#284261"
  float-panel-bg-dark: "#102745"
  hover-dark: "#183859"
typography:
  display:
    fontFamily: '"Archive Display", "Noto Sans SC", sans-serif'
    fontSize: "clamp(48px,8.7vw,112px)"
    fontWeight: 850
    lineHeight: 0.88
    letterSpacing: "-.035em"
  title:
    fontFamily: '"Noto Sans SC", "Microsoft YaHei", sans-serif'
    fontWeight: 750
    letterSpacing: ".015em"
  reading:
    lineHeight: 1.95
  tool-description:
    fontSize: "0.875rem"
    lineHeight: 1.7
  tool-label:
    fontSize: "0.8125rem"
    fontWeight: 500
rounded:
  command: "2px"
  card: "3px"
  mobile-dock: "5px"
spacing:
  tools-grid-gap: "1rem"
  tools-card-padding: "1.25rem"
  tools-category-gap: "2rem"
components:
  tool-tab:
    rounded: "{rounded.command}"
    padding: "0.375rem 0.875rem"
    typography: "{typography.tool-label}"
  tool-tab-active:
    backgroundColor: "{colors.p3-blue}"
    textColor: "#fff"
    rounded: "{rounded.command}"
  tool-card-light:
    backgroundColor: "{colors.float-panel-bg-light}"
    textColor: "{colors.deep-text-light}"
    rounded: "{rounded.card}"
    padding: "{spacing.tools-card-padding}"
  tool-card-dark:
    backgroundColor: "{colors.float-panel-bg-dark}"
    textColor: "{colors.deep-text-dark}"
    rounded: "{rounded.card}"
    padding: "{spacing.tools-card-padding}"
  command-navigation:
    backgroundColor: "{colors.p3-night}"
    textColor: "#f1f8ff"
    rounded: "{rounded.command}"
    padding: "7px 18px"
---

# Design System: 永远邸 / Kaguya

## Overview

**Creative North Star: "Persona-inspired personal universe"**

Electric blue planes, cyan cuts and compressed display typography give the archive a cinematic identity. Original artwork remains central; the visual language borrows energy and geometry without copying game logos. The confirmed direction lives in [PRODUCT.md](PRODUCT.md) and [the framework contract](docs/persona-framework.md).

Experience surfaces use expressive masks and spatial movement; reading surfaces keep Chinese text upright and stable; tool surfaces favor clear controls. This is an extraction of the shipped implementation, not a generated design seed. The auxiliary engine was unavailable, and no detector pass is claimed.

**Key Characteristics:**
- Electric blue, cyan and navy with paired light and dark reading papers.
- Heavy oblique display lettering alongside upright Chinese reading text.
- Flat command strips, fine dividers and nearly square controls.
- Deliberate mask reveals and translation, with reduced-motion bypass and fail-open navigation.

## Colors

The palette is vivid at the edges and quieter on reading surfaces. Normative values above preserve [persona-theme.css](src/styles/persona-theme.css); light/dark suffixes document the two values of the same runtime semantic property.

### Primary
- **Electric blue (`p3-blue`)** fills identity planes, route curtains, active tool indicators and the footer rule.
- **Reading accent (`primary-light`, `primary-dark`)** colors links, focus outlines and section lettering against the current paper.

### Secondary
- **Cyan (`p3-cyan`)** creates the contrasting plane, navigation underline and home display accent.

### Neutral
- **Midnight navy (`p3-night`)** anchors home and navigation in both themes.
- **Reading paper, deep text and metadata** use their matching theme variants; metadata remains visibly subordinate to body text.
- **Panel, divider and hover** variants support drawers, tools and interactive feedback.

**The Paired Paper Rule.** Change paper, text, metadata and dividers together through the theme properties; do not mix light-paper text with dark-paper surfaces.

## Typography

**Display Font:** locally hosted Archivo, registered as `Archive Display`, with Noto Sans SC and sans-serif fallbacks. **Chinese title family:** Noto Sans SC, Microsoft YaHei, sans-serif. The legacy variable name `--study-serif` now resolves to this sans-serif stack.

The display role above describes section mastheads, not every headline. Desktop home identity uses its own large responsive size; footer lettering uses a wider responsive scale. Chinese page titles use the title role; reading paragraphs retain the existing body family and the reading line height. Tool labels and descriptions have the compact roles recorded above. See [PersonaMasthead](src/components/layout/PersonaMasthead.astro), [HomeHero](src/components/layout/HomeHero.astro), and [study-theme.css](src/styles/study-theme.css).

**The Upright Reading Rule.** Apply oblique geometry to display lettering and decorative planes; never skew or transform the reading container as a whole.

## Layout

[MainGridLayout](src/layouts/MainGridLayout.astro) centers the shared content in a `max-w-5xl` container, with 1rem side padding and 1.5rem from the medium breakpoint. Article prose is capped at 52rem. The tool grid has three columns, two at widths up to 1024px, and one up to 640px; its rhythm is recorded above.

The home has distinct desktop and phone compositions. [HomeMobile](src/components/layout/HomeMobile.astro) uses an asymmetric blue field and left-aligned content. The decorative outer frame disappears at widths up to 1023px. At 600px and below, section lettering shrinks and its slash disappears. The footer changes from three columns to two at 767px, with its introduction spanning both columns. Do not derive a universal spacing scale from these surface-specific dimensions.

## Elevation & Depth

The Persona shell is flat: navigation removes blur and shadow, while blue planes, paper tones, fine borders and clipping establish depth. Tool cards change border and surface color on hover and rise slightly without gaining a shadow. Existing search-modal shadows are inherited drift, not a new elevation vocabulary.

**The Flat Command Rule.** Keep shared command strips and tool surfaces free of glass blur, glow and offset shadows.

## Shapes

Controls are nearly square using the named radii above. Diagonals belong to decorative blue fields, slashes, clipped home lettering and route curtains. Navigation's hover highlight is skewed independently from its readable labels. The small rounded count badge is an existing utility shape; it does not establish pill-shaped cards as a global rule.

## Components

### Buttons and tool filters

Compact, sharp controls. Tool tabs use the recorded padding and label role, with a 40px minimum height. The active blue background is implemented by a moving indicator behind white text; inactive labels use the current deep-text color and lower opacity on hover. Keyboard focus uses a visible theme-accent outline. Dock buttons use navy at rest and electric blue on hover.

### Cards and count badges

Tool cards have a one-pixel semantic divider border, a themed panel fill, and the recorded card radius/padding. Hover changes to the semantic hover fill, accents the border and translates upward by 3px; reduced motion removes that translation. Count badges use a compact rounded capsule with themed metadata colors; the active state becomes white on blue. See [collections.css](src/styles/collections.css) and its Persona overrides.

### Inputs

The global shell sets caret and focus colors. [SearchModal.svelte](src/components/controls/SearchModal.svelte) still contains its earlier pill-shaped input and ambient shadow. Preserve its functionality; this exception is documented in the sidecar preview and must not become the default style for new Persona controls.

### Navigation

Navy command segments carry pale labels, with electric blue on the identity segment and a cyan baseline under the center segment. Drawers use the current panel and divider colors. The skip link appears on keyboard focus. Existing search, theme controls and mobile menu behavior remain available.

### Shared dialogs

[privacy-modal.css](src/styles/components/privacy-modal.css) still ships its original greyscale panel, so the Persona layer overrides it in [persona-theme.css](src/styles/persona-theme.css): the panel surface and divider replace the grey pair, the 1rem radius becomes the card radius, and the drop shadow and backdrop blur are removed. A 5px electric-blue top rule addresses the panel, and a skewed cyan bar precedes the title. This covers the privacy/user-agreement dialog and the guestbook announcement dialog, which share the same `privacy-*` classes.

The author dialogue in [AboutCanvas.svelte](src/components/about/AboutCanvas.svelte) loses its hardcoded black bubble, grey outline and 24px radius. It becomes a navy panel at the card radius carrying a detached skewed cyan bar — the masthead's marker, deliberately not a side-tab border — with a cyan-edged avatar. The per-dialogue name color stays configuration-driven; its default `#00d5dd` sits inside the cyan family.

### Masthead, curtain and colophon

The decorative masthead is hidden from accessibility APIs; page content retains the semantic heading. [PersonaFrame](src/components/layout/PersonaFrame.astro) owns a persistent, pointer-transparent route curtain. [persona-motion.ts](src/utils/persona-motion.ts) covers before route replacement and reveals afterward, reverts route-local animation, bypasses reduced motion and resets after a 4.5-second fallback.

Standalone 3D scenes keep their artwork but open behind a matching curtain. [kuonji.astro](src/pages/kuonji.astro) serves the mansion and [konbini.css](src/styles/pages/konbini.css) the corner store, both built from the same two-leaf electric-blue reveal, mask-risen title and cyan subtitle. Each waits for its scene — konbini is signalled by [KonbiniDiorama.svelte](src/components/features/konbini-diorama/KonbiniDiorama.svelte) after its first frame — and fails open after seven seconds. The konbini curtain sits above its scene layer and both pages hide the development toolbar.

[StudyFooter](src/components/layout/StudyFooter.astro) combines large clipped lettering with plain navigation headings and real icon components. [study-motion.ts](src/utils/study-motion.ts) reveals its rule and sections once, clears temporary transforms and reverts before replacement. Motion uses controlled easing, not bounce; exact timings live in the sidecar. Screenshot and verification scope are recorded in [.impeccable/review/persona-validation.md](.impeccable/review/persona-validation.md).

## Do's and Don'ts

### Do:
- **Do** use the paired semantic theme colors for reading surfaces.
- **Do** keep Chinese reading text upright and use the local display face for expressive Latin lettering.
- **Do** make focus visible, preserve the skip link and bypass cinematic motion when reduced motion is requested.
- **Do** preserve original artwork, meaningful headings and existing navigation content.

### Don't:
- **Don't** introduce glass blur, glow or game-logo copies into the Persona shell.
- **Don't** add bounce to the mask and translation motion language.
- **Don't** hide reading content behind a curtain that can intercept pointers or remain indefinitely.
- **Don't** promote legacy search-modal styling, decorative numbering or glyph icons into new system rules.
