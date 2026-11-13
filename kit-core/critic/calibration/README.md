# Critic calibration

Is the taste critic (`../CRITIC.md`) strong enough? Each case here is a
fault a user once had to point out, put back into a fictional kit example
by a small CSS file. The critic judges every case blind (it does not know
the fault) against the same example without the fault. A case passes when
the critic scores the fault's rubric line low enough, and the clean case
passes when the critic leaves the example alone.

Run it whenever `CRITIC.md`, `TASTE.md` or `sites-kit critic` changes:

```bash
pnpm --dir examples/react/studio-vey dev            # the cases' example, e.g. on :4511
pnpm --dir examples/react/studio-vey kit critic calibrate prepare --url http://localhost:4511
# the run harness: give each critic-calibration/<case>/INDEX.md to the critic
# (a separate model, nothing else) and save its answer as <case>/answer.md
pnpm --dir examples/react/studio-vey kit critic calibrate score
```

`cases.json` lists the cases: the example, the CSS file, the fault in one
line, and `expect` (rubric line number to `{ "max": n }` or `{ "min": n }`;
`all` for every line, `total` for the sum).

## Adding a case

When a user makes a taste remark the critic missed:

1. Write the smallest CSS file that puts the fault back into a kit example
   (use `!important`: the example's CSS may sit in a cascade layer).
2. Add the case to `cases.json` with the rubric line it breaks.
3. Run the calibration. The new case fails until `CRITIC.md` or
   `TASTE.md` is sharpened so the critic catches it; the other cases must
   keep passing.

Only fictional examples go here: this repository is public, so never a
real agency's site, logo or photos.
