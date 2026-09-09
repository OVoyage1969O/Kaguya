# Navigation font

`navigation-regular.woff` is a local subset of Adobe Source Han Serif SC Regular
(思源宋体), distributed under the accompanying SIL Open Font License.

Source: https://github.com/adobe-fonts/source-han-serif

Upstream font: https://raw.githubusercontent.com/adobe-fonts/source-han-serif/release/OTF/SimplifiedChinese/SourceHanSerifSC-Regular.otf

Only navigation labels, site branding and basic Latin glyphs are included to keep
the download small. The CSS family is limited to navigation on non-home pages.
After changing labels, download the upstream font and rebuild with:

```sh
python scripts/subset-navigation-font.py /path/to/SourceHanSerifSC-Regular.otf
```

The build helper requires Python and fonttools; ordinary site builds do not.
