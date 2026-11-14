// typo / typoHtml (lib/typo.ts): quotes, apostrophes and spacing per language.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { typo, typoHtml } from '../lib/typo.ts';

const NN = ' ';

describe('typo', () => {
  it('curls apostrophes, Swiss number separators included', () => {
    assert.equal(typo("l'entrée et l' existant", 'fr-CH'), 'l’entrée et l’existant');
    assert.equal(typo("It's the agents' office", 'en'), 'It’s the agents’ office');
    assert.equal(typo("CHF 1'250'000", 'de-CH'), 'CHF 1’250’000');
  });

  it('uses the language’s quotation marks', () => {
    assert.equal(typo('Le "Clos" est calme', 'fr-FR'), `Le «${NN}Clos${NN}» est calme`);
    assert.equal(typo('Das "Haus" am See', 'de-DE'), 'Das „Haus“ am See');
    assert.equal(typo('Das "Haus" am See', 'de-CH'), 'Das «Haus» am See');
    assert.equal(typo('The "Garden" flat', 'en'), 'The “Garden” flat');
    assert.equal(typo('La "Casa" grande', 'es-ES'), 'La «Casa» grande');
    assert.equal(typo('"Villa" sul lago', 'it-IT'), '«Villa» sul lago');
  });

  it('spaces French guillemets and high punctuation, never times or URLs', () => {
    assert.equal(typo('«Calme» : oui ! Vraiment ?', 'fr-CH'), `«${NN}Calme${NN}»${NN}: oui${NN}! Vraiment${NN}?`);
    assert.equal(typo('Visites 14:00 sur https://example.com', 'fr-FR'), 'Visites 14:00 sur https://example.com');
    assert.equal(typo('Note: yes!', 'en'), 'Note: yes!');
    assert.equal(typo('Et puis...', 'fr-FR'), 'Et puis…');
  });

  it('typoHtml changes text only, never tags', () => {
    assert.equal(typoHtml('<p>L\'entrée &quot;sud&quot;</p><ul><li>Vue: lac</li></ul>', 'fr-CH'), `<p>L’entrée «${NN}sud${NN}»</p><ul><li>Vue${NN}: lac</li></ul>`);
    assert.equal(typoHtml('', 'fr'), '');
  });
});
