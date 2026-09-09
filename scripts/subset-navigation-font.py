"""Build the local navigation subset from an upstream Source Han Serif Regular OTF.

Usage: python scripts/subset-navigation-font.py /path/to/SourceHanSerifSC-Regular.otf
Requires fonttools. Run again after changing navigation labels or translations.
"""
from pathlib import Path
import re
import sys
from fontTools import subset

root = Path(__file__).resolve().parent.parent
presets = (root / "src/constants/link-presets.ts").read_text(encoding="utf-8")
keys = set(re.findall(r"I18nKey\.(\w+)", presets)) | {"menu"}
text = "".join(chr(code) for code in range(32, 127))
for locale in (root / "src/i18n/languages").glob("*.ts"):
    for key, value in re.findall(r'\[I18nKey\.(\w+)\]:\s*"([^"]*)"', locale.read_text(encoding="utf-8")):
        if key in keys:
            text += value
for file in ["src/constants/link-presets.ts", "src/config/navBarConfig.ts", "src/config/siteConfig.ts"]:
    # Include custom labels and site branding, as well as preset translations.
    text += "".join(re.findall(r'"([^"\n]*)"', (root / file).read_text(encoding="utf-8")))

options = subset.Options()
options.flavor = "woff"
options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]
font = subset.load_font(sys.argv[1], options)
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=text)
subsetter.subset(font)
output = root / "src/assets/fonts/source-han-serif/navigation-regular.woff"
output.parent.mkdir(parents=True, exist_ok=True)
subset.save_font(font, output, options)
print(f"Wrote {output}: {output.stat().st_size:,} bytes")
