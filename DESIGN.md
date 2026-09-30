---
name: "永远邸 / Kaguya"
description: "A warm editorial archive inspired by Claude's public brand language."
colors:
  ivory-light: "#faf9f5"
  ivory-medium: "#f0eee6"
  ivory-dark: "#e8e6dc"
  slate-dark: "#141413"
  slate-medium: "#3d3d3a"
  slate-light: "#5e5d59"
  cloud-light: "#d1cfc5"
  cloud-medium: "#b0aea5"
  clay: "#d97757"
  accent: "#c6613f"
  pencil: "#f0ac54"
  dark-paper: "#262624"
  dark-panel: "#30302e"
  dark-divider: "#4a4945"
  dark-control-border: "#55524c"
  dark-control-accent: "#8e6658"
typography:
  ui:
    fontFamily: '"Anthropic Sans", "Noto Sans SC", "Microsoft YaHei", sans-serif'
    fontSize: "clamp(14px,1.2vw,16px)"
    fontWeight: 400
  display:
    fontFamily: '"Anthropic Serif", "Noto Serif SC", "Songti SC", Georgia, serif'
    fontWeight: 500
    letterSpacing: "-.035em"
  reading:
    fontFamily: '"Anthropic Serif", "Noto Serif SC", "Songti SC", Georgia, serif'
    fontSize: "1.0625rem"
    lineHeight: 1.88
  mono:
    fontFamily: '"Anthropic Mono", "JetBrains Mono", ui-monospace, monospace'
rounded:
  compact: "8px"
  control: "10px"
  button: "12px"
  menu: "14px"
  card: "16px"
  panel: "18px"
  feature: "22px"
spacing:
  readingMeasure: "48rem"
  shellWidth: "1180px"
  navigationHeight: "62px"
---

# Design System: 永远邸 / Kaguya

## Overview

**Creative North Star: "A warm room for long-form thinking."**

The site is a personal archive for mathematics, technology, fiction and daily writing. Its visual language borrows the calm editorial character of Claude's public brand system: warm ivory paper, near-black slate, restrained clay accents, humanist sans-serif interface text and literary serif reading text. It does not copy Claude product layouts or logos.

The system keeps the site's original artwork and interactive scenes, but places them inside the same warm material world. Reading surfaces remain quiet. Tools and navigation use the sans family. Titles, essays and reflective copy use the serif family. Motion communicates state changes and route transitions, then gets out of the way.

## Color

Light mode uses ivory medium as the page paper, ivory light for raised panels, slate dark for text and clay for the small number of active states. Dark mode uses warm charcoal paper instead of blue-black, with ivory text and a lighter clay accent.

Clay is an accent, not a background system. It marks the active navigation item, links, focus, small indicators and key actions. Large surfaces stay ivory, slate or warm charcoal.

## Typography

Anthropic Sans is the interface voice for navigation, controls, metadata, filters and labels. Anthropic Serif is the display and reading voice for mastheads, article titles, prose, dialogue and the footer statement. Anthropic Mono is limited to code, shortcuts and machine-readable values.

The official web fonts are loaded from Anthropic's public website assets with `font-display: swap`. Chinese text falls back to Noto Sans SC or Noto Serif SC so the sans-versus-serif hierarchy remains intact.

## Layout

The shared shell is centered and restrained. The navigation is one warm paper bar with a maximum width of 1180px. Reading content remains capped at 48rem. Large route mastheads use serif type, a hairline divider and one small clay dot. Decorative diagonal rails and edge lettering are removed.

The home keeps its original character and scene artwork. A warm charcoal wash unifies the imagery, while the large blue Persona plane becomes a floating ivory editorial card. Mobile collapses to a single column and uses the same paper, slate and clay hierarchy.

## Components

### Navigation

Navigation sits in an ivory panel with an 18px radius, a one-pixel divider and a soft downward shadow. Labels use Anthropic Sans. Hover uses ivory dark; active state uses clay. Search remains a compact control inside the same bar.

### Cards and controls

Cards use ivory light or warm charcoal panels, one-pixel dividers and 16px corners. They lift by two pixels on hover. Controls use 10-12px corners. Pills are reserved for small filters and status controls.

### Reading

Article prose uses Anthropic Serif at 1.0625rem with a 1.88 line height. Headings stay in the same family with increased weight. Metadata, categories and tags use Anthropic Sans. Inline and block code use Anthropic Mono.

### Route transition

The existing route-transition engine remains, but its panels now use ivory, clay and slate. Reduced-motion mode bypasses the curtain.

### Dialogs and floating tools

Dialogs use ivory panels, 18px corners and a soft offset shadow. Floating tools use compact 48px paper controls. Labels appear on hover or keyboard focus. The visual weight stays below the reading content.

### Footer

The footer is a compact two-row colophon beneath one hairline. An italic Kaguya signature, horizontal reading links and accessible social icons form the first row; copyright, legal links and technology credits form the second. Descriptive copy, slogans, section labels and last-writing dates are omitted. Mobile keeps signature and social icons together, then wraps the reading links and administrative information naturally. Extra bottom space only clears the fixed mobile dock.

### Cursor

Desktop pointers now use the user's supplied Windows ANI/CUR character pack. Lossless transparent sprite sheets retain every frame, source sequence, 60Hz jiffy timing and per-frame hotspot. The supplied animated states are 32px, eight frames and 100ms per frame. A small pointer-transparent canvas draws only on frame changes; movement positions it using the original hotspot. The former clay mark and ribbon are no longer mounted. The component remains outside the replaced route container and hides on blur, page exit, pointer leave and tab hiding. Coarse pointers retain the ordinary touch experience; reduced-motion mode uses the first frame.

The package's normal, link, text, unavailable, working, busy, move and directional-resize cursors follow the corresponding interaction states. Explicit help, precision, handwriting, alternate, person and pin states can be selected using data-cursor-role. Disabled takes priority over busy. State attributes are observed for stationary pointers. A static native CUR fallback stays available while sprites load or if rendering fails. scripts/convert-cursor-pack.py converts only ANI/CUR files and preserves the source archive.

## Motion

Motion follows onetake's rhythm and carry principles. Mastheads settle on a critically damped wordRise curve sampled from the onetake library; compact introductory groups follow after 140ms. Cards arrive once as they enter the viewport with a short bounded stagger. Long-form article prose remains stable. Hover lifts cards by two to three pixels; presses compress controls briefly. The home scene and route transitions keep their authored choreography. Route replacement cleans up observers and animations, and reduced-motion preferences bypass entrances.

## Do

- Use serif type for reading and display moments.
- Use sans type for navigation, controls and metadata.
- Keep clay accents sparse and meaningful.
- Preserve warm contrast in both light and dark themes.
- Keep original artwork and route behavior intact.

## Do not

- Reintroduce electric blue, cyan planes or skewed Persona command strips.
- Add gradients, glows or glass panels.
- Use clay as a full-page background.
- Mix cool gray surfaces with the warm ivory and slate system.
- Turn every container into a card.
