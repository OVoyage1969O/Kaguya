# Persona framework validation

- Production Astro build: 73 pages generated successfully (outputs/persona-build.log).
- Pagefind: 67 pages, 9,902 words indexed (outputs/persona-pagefind.log).
- Astro check: 69 existing errors, 13 hints. No diagnostics reference the new Persona components/motion or modified shared layouts, HomeMobile, home-hero-controller, or study-motion. This is not a clean repository-wide typecheck.
- Biome: persona-motion.ts and study-motion.ts pass after formatting.
- Impeccable auxiliary engine remains unavailable; download failed earlier. Fail-fast availability attempt exits before detector execution; no detector result or generated seed is claimed.
- Browser: home -> tools, article -> home, and bookshelf -> tools navigation completes with the persistent curtain hidden afterward. Mobile menu opens/closes, theme switches light/dark, tools filter selects five AI assistant links. No comments were submitted or external actions taken.
- At 390px and 1440px tested widths, document scroll width does not exceed the viewport. Desktop home blue title panel moves fully offscreen during the first scroll segment (x > viewport width).
- Reading paragraphs remain unskewed; masthead typography and decorative layers carry the angular treatment. Reduced-motion guards are implemented in GSAP matchMedia and CSS; OS-level reduced-motion was not changed during this verification.
- Screenshots are real browser captures in this directory, names starting persona-. Most desktop captures are 1440x1000; article-light is a tall live desktop viewport. Phone captures are 390x844. Astro dev toolbar is not part of the production build.
- Original photography/character assets and local Archivo font are reused. User concurrently edited encyclopedia content/config and added BG1.png/Deep.png; those changes are preserved.
- Source palette contrast calculation: light body 13.54:1, light metadata 5.12:1, dark body 16.10:1, dark metadata 8.51:1, navigation labels 15.56:1, dark tool descriptions 7.14:1. These values cover the named token pairs, not every legacy widget.

## Persona finish pass (close-out)

The surfaces still carrying their pre-Persona styling were harmonised: the shared privacy/announcement dialog, the about author dialogue, and the konbini standalone scene. The music visualiser was deliberately left as shipped, at the user's direction.

- Impeccable engine: the auxiliary binary download that failed in the first pass completed, and its release checksum verified (SHA256 `477e544f…b531c71`), so `impeccable context` and the mechanical detector both ran this session.
- Detector: `impeccable detect` over the changed files exits 0 with 27 advisory notes and no primary findings (outputs/persona-detector.log). The one primary-tell finding raised against this pass — a `side-tab` thick one-sided border on the about bubble — was removed by rebuilding that accent as the masthead's detached skewed bar; the rule no longer reports. The remaining advisories are undocumented colour and size literals the incumbent Persona code already uses (the kuonji curtain's exact palette and 10px kickers, `#fff` on active controls) plus the house accent rule on slightly rounded surfaces.
- Shared dialogs: the Persona layer overrides the legacy `privacy-*` panel, so the privacy/user-agreement and guestbook announcement dialogs now use the semantic panel and divider, the card radius, no drop shadow and no backdrop blur, addressed by a blue top rule and a skewed cyan bar before the title.
- About dialogue: the hardcoded `#111` bubble, `#d3d3d3` outline and 24px radius are replaced by a navy panel at the card radius with a detached skewed cyan bar. The configuration-driven name colour is preserved.
- Konbini curtain: the corner-store scene now opens behind the same two-leaf electric-blue curtain as the mansion, signalled after its first rendered frame and failing open after seven seconds. A 1440x900 probe found the curtain present and covering through ~1.5s, opening thereafter and ~93% open by 6.5s; persona-desktop-konbini-curtain.png records the covered state.
- Verification sweep: 24 routes x desktop 1440x900 and mobile 390x844 x light and dark — 96 captures, every route HTTP 200 (the intentional 404 route included), zero horizontal overflow.
- Production build: 73 pages; Pagefind 67 pages / 9,902 words — both unchanged from the first pass.
- Reduced motion: the konbini curtain is `display:none` and its scene entrance animation is removed under `prefers-reduced-motion: reduce`.
- Not claimed: frame rate or perceived motion smoothness from stills, and no OS-level reduced-motion run.

## Nine-axis ability chart (character entries)

Trivia character entries gained a nine-axis ability chart, requested for 维塔·萨普里 and 狄普·桑姆博 and placed in the right sidebar.

- Placement: the chart renders as a section of the entry's infobox, with the same title-bar treatment as the information groups. An entry carrying `stats` without an infobox falls back to a standalone card in the article.
- Rendering: build-time inline SVG, no runtime dependency and no client JavaScript. Both built pages contain the chart with nine axis labels.
- Legibility in the 276px sidebar: the axis step was raised to 17px and the value step to 15px inside a 380-unit viewBox so labels survive the downscale; both steps are now recorded in DESIGN.md typography.
- Two layout faults were found and fixed during verification. The markdown body's `figure` margin rules outrank a bare component selector and pushed the chart into the floated sidebar's lane, dropping it below the 955px float; the component's styles are now scoped under `.custom-md`. Tailwind's `sr-only` was overridden by the markdown table rules, leaving the assistive-technology table visible at 976x465; it is now a list hidden by the component's own rules.
- Detector: `impeccable detect` over the four touched files exits 0 with no anti-patterns and no advisories.
- Verification sweep: 26 routes x desktop 1440x900 and mobile 390x844 x light and dark — 104 captures, all HTTP 200, zero horizontal overflow.
- Production build: 73 pages, unchanged; the entries without a `stats` block are unaffected.
- Not claimed: screen-reader output was not captured; the hidden list was verified by computed clip-path only.

## Route curtain and home lettering (two reported defects)

Two defects reported after the close-out were traced and fixed.

- **The white KAGUYA only flashed.** `cover()` revealed the curtain word in its final `.set`, and `mount()` hid it again on the first frame of the reveal, so the word existed only across the content swap — a few frames. The word now fades in as the curtain closes (0.42s offset into the cover), holds while the curtain is fully closed, and lifts away on the same timeline that opens it, starting at 0.15s so the curtain leads and no blank blue gap is left. A 50ms sampler across a real `swup.navigate` recorded the word at opacity 1.00 for the full hold and a gradual exit from 1.00 to 0.00 over roughly half a second, instead of an instant hide.
- **The home caption was cut by the blue plane.** The caption span was stretched to the full row width by the column flex container, so `rotate(-8deg)` sank its bottom-left corner further as the viewport grew, while the `clip-path` bottom edge stayed put. Measured clearance at the caption's lowest rotated corner was +10.7px at 1440 and +21.5px at 1280, but **-1.5px at 1680 and -8.7px at 1920** — clipped on wide screens. The span is now `align-self: flex-start` with `transform-origin: 0 100%`, so its box hugs the text (a constant 197x39) and the rotation no longer depends on viewport width. Clearance is now positive and stable at every width tested: 48px at 1024, 30.3px at 1440, 23.8px at 1920.
- Detector: `impeccable detect` over the two changed files reports no findings on the changed lines. Its three anti-patterns are the house three-and-five-pixel blue top rules at lines 84, 96 and 190, which predate this change (84 and 96 shipped in the earlier passes; 190 is the dialog panel from the close-out) and are the same accent motif the Persona navigation and dock already use.
- Verification sweep: 26 routes x desktop 1440x900 and mobile 390x844 x light and dark — 104 captures, all HTTP 200, zero horizontal overflow.
- Production build: 73 pages; the lettering rule and the reveal tween are both present in the built CSS and JS.
- Not claimed: the frame captures were taken against the dev server, where the content swap between cover and reveal is slower than a production build; the production hold will be shorter than the ~840ms measured.

## Randomised route curtain (four arrangements)

The curtain previously played one arrangement on every navigation; it now picks one of four at random.

- Material: all four move the same thing — flat Persona colour panels covering the viewport — and differ only in panel count, entry direction and exit direction. No new effect was introduced. Two skewed planes enter from the left or the right, five vertical blades drop as a wave, and two halves close towards the middle then pass through each other so the content is uncovered from the centre outward.
- Selection: a random index is drawn per navigation, never repeating the previous arrangement back to back. Sixteen consecutive `swup.navigate` calls produced planes-right 5, blinds 4, planes-left 4, shutter 3 — all four present, zero immediate repeats.
- Coverage: each arrangement was forced in turn with a seeded `Math.random` and captured frame by frame (persona-route-variants.png). Every arrangement reaches a fully covered hold before the reveal, with no gaps at the closed moment — including the blade and split arrangements, where a mis-sized panel would show through.
- State handling: panels are placed at their start transform before the curtain is unhidden, so no frame shows the previous arrangement's residue. `will-change` applies only while the curtain is visible.
- Reduced motion: with `prefers-reduced-motion: reduce` the curtain never becomes visible and no arrangement is even assigned; 55 samples across a navigation recorded `everVisible: false`, and navigation completed normally.
- Detector: `impeccable detect` over the three changed files reports nothing on the new curtain code. Its three anti-patterns remain the pre-existing blue top rules on the navigation, the dock and the dialog panel.
- Verification sweep: 26 routes x desktop 1440x900 and mobile 390x844 x light and dark — 104 captures, all HTTP 200, zero horizontal overflow.
- Production build: 73 pages; all four variant selectors, the five-panel pool and the arrangement ids are present in the built output.
- Not claimed: perceived smoothness on low-end devices was not measured, and the captured timings come from the dev server.
