# 永远百科首页重设计

Scope: `/bookshelf/` only. Existing configuration remains the source of truth for five categories, seventeen entries, featured articles, category routes, and random reading. Visitor mode: Read with an expressive exhibition entrance. Audience: readers exploring the site's fictional worlds, characters, magic and places.

## Direction contract

THESIS: A visual archive of imagined worlds, with the contents immediately browsable after a cinematic opening.

OWN-WORLD: Cold paper and carbon, cobalt as a solid field, Archivo display lettering, Chinese sans typography, square image crops, broad whitespace and compact category links. Existing artwork carries the subject.

STORY: Enter the archive, choose a world, read an entry or follow a curated selection. Existing product facts and routes remain authoritative.

FIRST VIEWPORT: Large stacked ETERNAL / ARCHIVE lettering anchors the left; an offset image of the mansion and a narrow character plate anchor the right; the Chinese page title and browse action establish purpose. No decorative metrics. Opening compresses typography, retracts the two curtains, and settles the image plates. Scroll produces local cover reveals and small image parallax without scroll hijacking.

FORM: Art-direction portfolio meets an accessible archive index. Code-led implementation follows the user's explicit creative-agency motion brief. The installed Impeccable engine could not download its binary; context and concept-seed were attempted but unavailable. Repository inspection supplies context; no random seed or comp approval is claimed.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Assets

All illustrations are existing site assets in `public/assets/images`, referenced without modifying their originals. LW.jpg: mansion interior; ALI.jpg: Alice portrait; category covers: bookshelfConfig. No generated images. Archivo variable font: Google Fonts' google/fonts repository, OFL license alongside the font.

## Motion and resilience

Opening lasts approximately 3.5 seconds, can be skipped, and has a fail-open timeout. No synthetic loading percentages. Reduced-motion users receive the full static layout. Native scrolling and anchor links remain available. GSAP matchMedia and context cleanup cover page replacement, re-entry and changes to reduced motion. Without JavaScript all category content and links remain available.
