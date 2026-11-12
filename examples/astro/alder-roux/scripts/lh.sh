#!/bin/sh
# Lighthouse mobile (performance, accessibility, best practices, SEO) per path against the preview on :4413.
#   sh scripts/lh.sh /path /other ...
OUT=${LH_OUT:-.lighthouse}
mkdir -p "$OUT"
for p in "$@"; do
  f="$OUT/$(echo "$p" | sed 's#^/##; s#[/?=&]#_#g; s#^$#home#').json"
  npx lighthouse "http://localhost:4413$p" --form-factor=mobile --only-categories=performance,accessibility,best-practices,seo \
    --quiet --chrome-flags="--headless=new" --output=json --output-path="$f" >/dev/null 2>&1
  node -e "const r=require(require('path').resolve('$f'));const c=r.categories;const a=r.audits;console.log([process.argv[1],...['performance','accessibility','best-practices','seo'].map(k=>Math.round(c[k].score*100)),'LCP '+a['largest-contentful-paint'].displayValue,'TBT '+a['total-blocking-time'].displayValue,'CLS '+a['cumulative-layout-shift'].displayValue].join('  '))" "$p"
done
