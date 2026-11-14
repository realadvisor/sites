// cleanTitle (lib/title.ts): display-only cleanup of CRM listing titles. Neutral, made-up titles.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanTitle } from '../lib/title.ts';

const NB = ' ', NN = ' ';
const words = (s: string) => new Set(s.replace(/²/g, '2').replace(/³/g, '3').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').match(/[a-z0-9]+/g) ?? []);

describe('cleanTitle', () => {
  it('strips an exclusivity marker and returns it as a flag', () => {
    const r = cleanTitle('EN EXCLUSIVITE: Un bijoux de 230 m2 au calme', 'fr-CH');
    assert.deepEqual(r, { title: `Un bijoux de 230${NB}m² au calme`, exclusive: true, marker: 'EN EXCLUSIVITE' });
    assert.equal(cleanTitle('Exklusiv - Helle Wohnung mit Garten', 'de-CH').exclusive, true);
    assert.equal(cleanTitle('IN ESCLUSIVA: Villa con giardino', 'it-IT').title, 'Villa con giardino');
    assert.equal(cleanTitle('EXCLUSIVE Bright flat with a garden', 'en').exclusive, true);
  });

  it('drops other markers without a flag, and keeps a first word that is not a marker', () => {
    assert.deepEqual(cleanTitle('NOUVEAU ! Maison familiale avec jardin', 'fr-FR'), { title: 'Maison familiale avec jardin', exclusive: false, marker: 'NOUVEAU' });
    assert.equal(cleanTitle('Nouveau quartier près de la gare', 'fr-FR').title, 'Nouveau quartier près de la gare');
    assert.equal(cleanTitle('Rare', 'fr-FR').title, 'Rare');
  });

  it('turns shouting caps into sentence case, keeping acronyms, numbers and places', () => {
    assert.equal(
      cleanTitle('MAGNIFIQUE APPARTEMENT PPE DE 4.5 PIECES A EXEMPLEVILLE AVEC VUE', 'fr-CH', { places: ['Exempleville'] }).title,
      'Magnifique appartement PPE de 4.5 pièces a Exempleville avec vue',
    );
    assert.equal(cleanTitle('Superbe VILLA avec piscine', 'fr-FR').title, 'Superbe villa avec piscine');
    assert.equal(cleanTitle('Appartement T3 DPE B', 'fr-FR').title, 'Appartement T3 DPE B');
  });

  it('turns Title Case into sentence case, keeping place names', () => {
    assert.equal(cleanTitle('Bright Flat In The Heart Of Exampletown With Garden View', 'en', { places: ['Exampletown'] }).title, 'Bright flat in the heart of Exampletown with garden view');
    assert.equal(cleanTitle('Belle Maison Familiale À Saint-Exemple Avec Jardin', 'fr-FR').title, 'Belle maison familiale à Saint-Exemple avec jardin');
  });

  it('leaves German case alone (nouns are capitalised)', () => {
    assert.equal(cleanTitle('Helle Wohnung Mit Seesicht - Ruhige Lage', 'de-CH').title, 'Helle Wohnung Mit Seesicht – Ruhige Lage');
  });

  it('sets units, dashes and punctuation', () => {
    assert.equal(cleanTitle('Loft de 120m2 - centre-ville !!', 'fr-FR').title, `Loft de 120${NB}m² – centre-ville`);
    assert.equal(cleanTitle('Attico di 90 mq con terrazza', 'it-IT').title, `Attico di 90${NB}m² con terrazza`);
    assert.equal(cleanTitle('Cave de 30 m3.', 'fr-FR').title, `Cave de 30${NB}m³`);
  });

  it('adds French spacing before : ; ! ? and curly apostrophes', () => {
    assert.equal(cleanTitle("Maison d'architecte: vue sur le lac", 'fr-CH').title, `Maison d’architecte${NN}: vue sur le lac`);
    assert.equal(cleanTitle("Maison d'architecte: vue sur le lac", 'en').title, 'Maison d’architecte: vue sur le lac');
  });

  it('shortens a long title at its first strong separator', () => {
    const long = 'Magnifique villa mitoyenne - vue panoramique sur le lac et les montagnes, proche des écoles';
    assert.equal(cleanTitle(long, 'fr-CH').title, 'Magnifique villa mitoyenne');
    assert.equal(cleanTitle(long, 'fr-CH', { max: 120 }).title.length > 60, true);
    // No separator after 20 characters: kept whole (the card clamps it).
    const plain = 'Appartement lumineux avec balcon et vue dégagée sur les vignes et la campagne environnante';
    assert.equal(cleanTitle(plain, 'fr-CH').title, plain);
  });

  it('never adds a word and never corrects spelling', () => {
    for (const t of ['EN EXCLUSIVITE: Un bijoux de 230 m2', 'Magnifique Villa Mitoyenne - Vue Sur Le Lac !', 'Apartamento Con Vistas Al Mar - Zona Tranquila', 'A deux pas de la gare']) {
      for (const loc of ['fr-CH', 'en', 'es-ES']) {
        const out = words(cleanTitle(t, loc).title);
        const src = words(t);
        for (const w of out) assert.ok(src.has(w), `${loc}: "${w}" not in "${t}"`);
      }
    }
    assert.match(cleanTitle('Un bijoux de maison', 'fr-FR').title, /bijoux/);
  });
});
