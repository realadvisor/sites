# TASTE.md: the taste judge

How a RealAdvisor site is judged for taste, by the coding agent on its own
screenshots and by a separate critic before the user sees a page. DESIGN.md
says how to design; this file says how to judge the result. A page can pass
every check in AGENTS.md and still look amateur: this file is for that gap.

The judge compares, it does not admire. Every verdict names what it saw on
the screenshot and the rule it breaks. "Looks great" is not a verdict.

## 1. The anchor

Judge against the chosen style (the example or reference in BRIEF.md and
DESIGN-NOTES.md), not against an abstract ideal. Put its screenshot next to
the page's at the same width and ask: does the page keep the anchor's calm,
proportions and restraint? What did the adaptation break? Brand colours,
logos and real photos are where adaptations usually break it.

## 2. The rubric

Score each line 0 (broken), 1 (acceptable), 2 (studio quality), always
against the anchor at the same width: "the anchor does X, the page does Y".
A page ships to the user at 2 on every line, or at 1 with the reason written
in DESIGN-NOTES.md. Desktop 1440 and phone 390 both count.

| # | Line | 2 looks like | Typical failure |
| --- | --- | --- | --- |
| 1 | First impression | In 5 seconds you know whose site it is, what they do and where to click. | A generic welcome headline, three things competing for attention, the agency's name only inside an illegible logo |
| 2 | Hierarchy | One clear focal point per screen. Emphasis by weight, size and spacing, then colour. | Everything bold, headings the size of body text, colour doing all the work |
| 3 | Proportion | Header slim (at most 12% of the screen), logo sized to its shape, hero proportionate to its content. | A logo or header that dominates, oversized empty heroes |
| 4 | Colour restraint | Mostly neutrals; one accent used in small doses (about 10% of the page); a vivid brand colour only for small marks. | A saturated colour as a full-width band, several competing accents, colours that fight the photos |
| 5 | Typography | Two families at most; body 16–20px, lines 45–90 characters, line height 1.4–1.6; a clear type scale; one style per role (every lede, every eyebrow, every price alike). | Small grey body text, lines across the whole screen, five sizes that are almost the same, ledes in three styles |
| 6 | Type and logo | The type echoes the logo's character (weight, width, geometry, serif or not) or contrasts with it on purpose, and DESIGN-NOTES.md names which. Numbers, prices and labels usually take the voice closest to the logo. | The example's fonts kept unchanged next to a logo of another kind: a heavy condensed technical mark beside a warm editorial serif and a soft humanist sans |
| 7 | Section rhythm | Sections follow one spacing scale and one pattern of grounds (paper, tint, ink), so the page reads as a sequence with a beat; no two dark bands in a row, no band that is twice as tall as its content. | Uneven section padding, bands of the same ground running into each other, one cramped section among airy ones |
| 8 | Consistency | Repeated elements look like one system: cards, buttons, bands and links match across the page. | Each section designed on its own, three button styles |
| 9 | Hero image | The best photo the data has for the first screen: the agency's strongest listing or place, a calm composition, light and well cropped for both the desktop and the phone box, never repeated as the first card below. | The first listing's first photo by default, a dark or cluttered room, the same photo twice on the first two screens |
| 10 | Photo sharpness and tone | Every photo's file has at least as many pixels as its box x devicePixelRatio (1.5x is enough on a 2x phone); crops keep the subject; tones match from card to card. | A 864px file stretched over a 1080px hero, faces cut by a crop, one cold photo among warm ones |
| 11 | Phone | The phone view is designed, not shrunk: readable type, thumb-sized targets, no cramped rows. | Desktop layout squeezed, tiny captions, sticky bars that cover content |
| 12 | Brand fit | Swap the logo and the name for another agency's: the page must stop making sense. It carries this agency's claims, region, people and tone (BRIEF.md), and their logo's character in its type and marks. | "Could be any agency": the example's character left unchanged, only the colours swapped |

How to judge the hard lines:

- **Type and logo (6).** Put the logo next to each family in use
  (`type-vs-logo.png` from `sites-kit critic`). Name the logo's character in
  four words: weight (light / regular / heavy), width (condensed / normal /
  wide), construction (geometric, grotesk, humanist, slab, serif, script),
  mood (technical, warm, classic, playful). Then the same for each family.
  Echo: at least two of the four match for the family that sets labels,
  numbers and prices. Contrast on purpose: the families differ, the
  difference is named in DESIGN-NOTES.md and the logo's voice still appears
  somewhere (the big numbers, the eyebrows). A fix names a concrete open
  font (@fontsource), its role and its size: "eyebrows, prices and the 96 in
  Barlow Semi Condensed 600, tracking 0.04em; keep Newsreader for h1/h2".
- **Hero image (9).** Look at every photo the page has (summary.json
  `images`) and ask which one an agency owner would put on a brochure
  cover. Prefer exterior or a light, wide room; avoid photos with people,
  watermarks, a car in front or a lens tilt.
- **Photo sharpness (10).** summary.json gives each image's `density`
  (file pixels per CSS pixel). Under the width's devicePixelRatio (capped at
  1.5) is upscaled; `pnpm screenshot` prints it as `taste: soft photo`. The
  fix is a larger source, a smaller box, or another photo.
- **Section rhythm (7).** summary.json `sections` lists each band's top,
  height, ground and padding: compare the paddings, and read the grounds in
  order (paper, tint, ink...). The anchor's sequence is the reference.
- **Brand fit (12), the "could be any agency" test.** Cover the logo and
  the name on the first screen. If it could be the example or any other
  agency, score 1 at most and name what would make it theirs (their claim
  set large, their region in the eyebrow, their logo's typographic voice).

## 3. Measured checks

`pnpm screenshot` measures what can be measured and prints it as
`taste:` problems: header taller than 12% of the screen, a tall or square
logo outside 40–72px (a wide wordmark: 100px wide minimum, 72px tall
maximum), a full-width field in a saturated colour, more than two saturated
accent hues, paragraphs over 90 characters a line, body paragraphs under
15px, a soft photo (the loaded file has fewer pixels than its box x
devicePixelRatio up to 1.5, by more than 15%), section ledes in more than
one style (family, size, weight, full or muted colour), more than two font
families in use, a font declared by `@font-face` that never loaded. A
measured problem is fixed, or kept on purpose (a bold-colour direction may
keep a vivid band) and named in DESIGN-NOTES.md.

Type against the logo is not measured: a logo is usually drawn paths, so
its style cannot be read reliably from the file. The critic judges it from
`type-vs-logo.png` (rubric line 6).

## 4. The critic

After the home page (and after any new page or layout change), a separate
critic reviews before the user sees it. Its instructions are
`critic/CRITIC.md` (next to this file); the run harness gives them to a
separate model with the folder `sites-kit critic` writes, and nothing else.

1. Inputs: `pnpm kit critic -- <path> --anchor <the example running>` (or
   `--anchor-shots` with the anchor's screenshots) writes `critic-input/`:
   BRIEF.md, DESIGN-NOTES.md, the page at 1440 and 390 (full and first
   screen), the anchor at the same widths, the logo file and
   `type-vs-logo.png`, and `summary.json` (the `taste:` lines, fonts by
   role, colours, logo size, image pixels vs boxes, sections).
2. Output: the twelve scores, each with what it saw against the anchor, and
   for every line under 2 one concrete fix ("logo 136px tall: 60px, header
   88px"). At most five fixes, the biggest first.
3. The builder applies the fixes and re-shoots; at most two critic rounds,
   then the user sees the page with anything left open named in the final
   message.

The critic never adds content, never invents facts, and never changes the
brief. Taste fixes only.

## 5. Learning

Every taste remark a user makes ("the logo is too big", "the electric blue
does not fit", "the fonts do not match the logo") is written down with the
before and after screenshots. A remark that comes back becomes a measured
check (section 3) or a rubric example (section 2).

## Sources

- Nielsen Norman Group, [5 principles of visual design](https://www.nngroup.com/articles/principles-visual-design/): scale, hierarchy, balance, contrast, Gestalt.
- Butterick, [Practical Typography, summary of key rules](https://practicaltypography.com/summary-of-key-rules.html): body 15–25px on screen, line spacing 120–145%, 45–90 characters a line.
- Wathan and Schoger, [Refactoring UI](https://refactoringui.com/): hierarchy by weight and spacing before colour, start with more space, then remove.
- The 60-30-10 colour proportion and one-accent restraint ([freeCodeCamp](https://www.freecodecamp.org/news/the-60-30-10-rule-in-design/), [Inkbot Design](https://inkbotdesign.com/?p=332700)).
- Bringhurst, The Elements of Typographic Style, and Lupton, Thinking with Type: choose type whose character fits the subject; pair by contrast or by shared structure, not by accident.
- Practitioner notes on premium feel: restraint, a 2–3 colour palette, one system across sections ([WisdmLabs](https://wisdmlabs.com/blog/premium-website-design-7-decisions-that-set-brands-apart/), [Vandelay Design review checklist](https://www.vandelaydesign.com/?p=241)).
