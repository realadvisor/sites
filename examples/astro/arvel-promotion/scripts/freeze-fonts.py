"""Cormorant Garamond with lining figures by default (its default figures are
old-style, so "T1" reads "Tı"; CSS lnum is reset by every `font:` shorthand).
Remaps the digits of the @fontsource latin 500 files to their .lf glyphs.
Run: python3 scripts/freeze-fonts.py (needs fontTools + brotli)."""
from fontTools.ttLib import TTFont
SRC = 'node_modules/@fontsource/cormorant-garamond/files/cormorant-garamond-latin-500-{}.woff2'
DIGITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
for style in ('normal', 'italic'):
    f = TTFont(SRC.format(style))
    order = set(f.getGlyphOrder())
    for table in f['cmap'].tables:
        for cp, name in list(table.cmap.items()):
            if name in DIGITS and f'{name}.lf' in order:
                table.cmap[cp] = f'{name}.lf'
    f.flavor = 'woff2'
    f.save(f'src/fonts/cormorant-garamond-500-{style}-lf.woff2')
    print('src/fonts/cormorant-garamond-500-%s-lf.woff2' % style)
