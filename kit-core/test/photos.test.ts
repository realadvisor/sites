// pickPhoto / lotPhotos / photoKey (lib/photos.ts). Made-up URLs.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isLabelledPhoto, lotPhotos, photoKey, pickPhoto } from '../lib/photos.ts';

const P = (url: string, alt = '') => ({ url: `https://cdn.example.com/${url}`, alt });
const proxied = (url: string) => `https://img.example.net/_/rs:fill:800:600:1:0/q:75/${btoa(url).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')}.webp`;

describe('isLabelledPhoto', () => {
  it('flags plans and burned-in labels, in several languages, through a proxy URL too', () => {
    for (const p of [P('a/floor-plan.jpg'), P('a/Plan_RDC.png'), P('a/grundriss-og.jpg'), P('a/x.jpg', 'Plano de la vivienda'), P('a/home-staging-1.jpg'), P('a/reserve.jpg', 'Réservé'), P('a/off-market.jpg'), P('a/x.jpg', 'Vendu'), P('a/sold_banner.jpg'), { url: proxied('https://cdn.example.com/a/RESERVED-lot3.jpg'), alt: '' }]) assert.ok(isLabelledPhoto(p), p.url + ' ' + p.alt);
  });
  it('leaves ordinary photos alone', () => {
    for (const p of [P('a/living-room.jpg', 'Salon'), P('a/planche-bois.jpg'), P('a/explanade.jpg'), P('a/vue-lac.jpg', 'Vue sur le lac'), P('a/IMG_0042.jpg', 'Appartement 3 pièces, photo 2')]) assert.ok(!isLabelledPhoto(p), p.url);
  });
});

describe('pickPhoto', () => {
  const l = { id: 'a', photos: [P('a/plan.jpg'), P('a/staging-salon.jpg'), P('a/salon.jpg'), P('a/facade.jpg', 'Façade')] };
  it('card: the first clean photo', () => assert.equal(pickPhoto(l, 'card')?.url, P('a/salon.jpg').url));
  it('hero: a clean exterior first', () => assert.equal(pickPhoto(l, 'hero')?.url, P('a/facade.jpg').url));
  it('an override by index or URL piece wins', () => {
    assert.equal(pickPhoto(l, 'card', { overrides: { a: 1 } })?.url, P('a/staging-salon.jpg').url);
    assert.equal(pickPhoto(l, 'hero', { overrides: { a: 'salon.jpg' } })?.url, P('a/staging-salon.jpg').url);
  });
  it('only labelled photos: a card takes one that is not a plan, a hero none', () => {
    const bad = { id: 'b', photos: [P('b/plan.jpg'), P('b/vendu.jpg')] };
    assert.equal(pickPhoto(bad, 'card')?.url, P('b/vendu.jpg').url);
    assert.equal(pickPhoto(bad, 'hero'), undefined);
    assert.equal(pickPhoto({ id: 'c', photos: [] }, 'card'), undefined);
  });
});

describe('photoKey', () => {
  it('ignores size parameters and proxies', () => {
    const k = photoKey('https://cdn.example.com/a/render.jpg');
    for (const u of ['https://cdn.example.com/a/render.jpg?w=800', 'https://cdn.example.com/a/render-1200x800.jpg', 'https://cdn.example.com/a/render@2x.jpg', proxied('https://cdn.example.com/a/render.jpg')]) assert.equal(photoKey(u), k, u);
    assert.notEqual(photoKey('https://cdn.example.com/a/render-2.jpg'), k);
  });
});

describe('lotPhotos', () => {
  it('gives lots that share renders different photos, never the same image side by side', () => {
    const set = (n: number) => ({ id: `lot${n}`, address: { city: 'Exempleville' }, photos: [P(`dev/lot${n}/reserve.jpg`, 'Réservé'), P(`dev/lot${n}/render-a.jpg`), P(`dev/lot${n}/render-b.jpg`), P(`dev/lot${n}/render-c.jpg`), P(`dev/lot${n}/plan.jpg`)] });
    const lots = [1, 2, 3, 4, 5].map(set);
    const out = lotPhotos(lots);
    const names = lots.map((l) => out[l.id]!.url.split('/').pop());
    assert.deepEqual(names, ['render-a.jpg', 'render-b.jpg', 'render-c.jpg', 'render-a.jpg', 'render-b.jpg']);
    for (let i = 1; i < names.length; i++) assert.notEqual(names[i], names[i - 1]);
  });
  it('keeps each listing’s own card photo when nothing repeats, and honours overrides', () => {
    const a = { id: 'a', photos: [P('a/1.jpg'), P('a/2.jpg')] };
    const b = { id: 'b', photos: [P('b/1.jpg'), P('b/2.jpg')] };
    assert.deepEqual(lotPhotos([a, b]), { a: a.photos[0], b: b.photos[0] });
    assert.equal(lotPhotos([a, b], { overrides: { b: 1 } }).b, b.photos[1]);
    assert.deepEqual(lotPhotos([{ id: 'x', photos: [] }]), {});
  });
  it('same file name in another city is another image', () => {
    const a = { id: 'a', address: { city: 'Exempleville' }, photos: [P('a/IMG_1.jpg'), P('a/IMG_2.jpg')] };
    const b = { id: 'b', address: { city: 'Autreville' }, photos: [P('b/IMG_1.jpg'), P('b/IMG_2.jpg')] };
    const out = lotPhotos([a, b]);
    assert.equal(out.b, b.photos[0]);
  });
});
