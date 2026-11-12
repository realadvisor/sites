"""Draw a favicon SVG from letters of the site's own brand font.

Favicons cannot load web fonts, so the letters are converted to SVG paths.

  python3 favicon-svg.py <font.woff2> <out.svg> --text A --fg '#fff' --bg '#123' \
      [--radius 0] [--size 0.62] [--wght 500] [--accent '&=#dcc193']

--size is the cap height as a fraction of the square. --accent colours one
character differently (e.g. an ampersand).
"""
import argparse

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

p = argparse.ArgumentParser()
p.add_argument('font')
p.add_argument('out')
p.add_argument('--text', required=True)
p.add_argument('--fg', required=True)
p.add_argument('--bg', required=True)
p.add_argument('--radius', type=float, default=0)
p.add_argument('--size', type=float, default=0.62)
p.add_argument('--wght', type=float)
p.add_argument('--accent', action='append', default=[])
p.add_argument('--tracking', type=float, default=0)
a = p.parse_args()

font = TTFont(a.font)
if a.wght and 'fvar' in font:
    from fontTools.varLib.instancer import instantiateVariableFont
    font = instantiateVariableFont(font, {'wght': a.wght})
gs = font.getGlyphSet()
cmap = font.getBestCmap()
upm = font['head'].unitsPerEm
accents = dict(x.split('=', 1) for x in a.accent)

# Lay out the glyphs on one baseline, then scale and centre the ink box.
x = 0
parts = []
for ch in a.text:
    name = cmap[ord(ch)]
    parts.append((ch, name, x))
    x += gs[name].width + a.tracking * upm
bp = BoundsPen(gs)
for _, name, dx in parts:
    gs[name].draw(TransformPen(bp, (1, 0, 0, 1, dx, 0)))
x0, y0, x1, y1 = bp.bounds
cap = (font['OS/2'].sCapHeight or (y1 - y0)) if hasattr(font['OS/2'], 'sCapHeight') else (y1 - y0)
S = 64
scale = S * a.size / cap
w, h = (x1 - x0) * scale, (y1 - y0) * scale
if w > S * 0.84:  # wide words: fit the width instead
    scale *= S * 0.84 / w
    w, h = (x1 - x0) * scale, (y1 - y0) * scale
ox = (S - w) / 2 - x0 * scale
oy = (S + h) / 2 + y0 * scale  # SVG y grows down: flip around the baseline

paths = []
for ch, name, dx in parts:
    pen = SVGPathPen(gs, ntos=lambda v: f'{v:.2f}'.rstrip('0').rstrip('.'))
    gs[name].draw(TransformPen(pen, (scale, 0, 0, -scale, ox + dx * scale, oy)))
    d = pen.getCommands()
    if d:
        paths.append(f'<path d="{d}" fill="{accents.get(ch, a.fg)}"/>')
rect = f'<rect width="{S}" height="{S}" rx="{a.radius}" fill="{a.bg}"/>'
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}">{rect}{"".join(paths)}</svg>\n'
open(a.out, 'w').write(svg)
print(a.out, len(svg), 'bytes')
