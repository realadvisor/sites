#!/bin/sh
# Archivo (OFL, from @fontsource-variable/archivo) cut to what the site uses:
# width 62–100 %, weight 400–850, Latin with Italian accents. 91 KB -> 50 KB.
set -e
SRC=node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2
TMP=$(mktemp -d)
python3 -m fontTools.varLib.instancer "$SRC" wdth=62:100 wght=400:850 -o "$TMP/a.ttf"
python3 -m fontTools.subset "$TMP/a.ttf" \
  --unicodes="U+0020-007E,U+00A0-00FF,U+0152-0153,U+2013-2014,U+2018-201E,U+2022,U+2026,U+2190-2197,U+20AC,U+2122" \
  --layout-features='kern,liga,calt,tnum,lnum' --flavor=woff2 \
  --output-file=app/fonts/archivo-wdth62-100-wght400-850-latin.woff2
