import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildValuationEmbedUrl,
  buildValuationFallbackHref,
  isAllowedValuationEmbedUrl,
  parseValuationResizeMessage,
} from '../lib/valuation.ts';

describe('valuation widget helpers', () => {
  it('allows only HTTPS RealAdvisor valuation origins', () => {
    assert.equal(isAllowedValuationEmbedUrl('https://realadvisor.ch/de-ch/embed/valuation'), true);
    assert.equal(isAllowedValuationEmbedUrl('https://agence.valuation.realadvisor.fr/appraise'), true);
    assert.equal(isAllowedValuationEmbedUrl('http://realadvisor.ch/embed'), false);
    assert.equal(isAllowedValuationEmbedUrl('https://evil.example/valuation'), false);
    assert.equal(isAllowedValuationEmbedUrl('javascript:alert(1)'), false);
    assert.equal(isAllowedValuationEmbedUrl(''), false);
  });

  it('builds a prefilled embed URL carrying Step 1 and site CSS tokens', () => {
    const url = buildValuationEmbedUrl({
      embedUrl: 'https://realadvisor.ch/fr-ch/embed/valuation?token=abc',
      propertyType: 'house',
      address: 'Rue du Lac 12, 1800 Vevey',
      locale: 'fr-CH',
      tokens: {
        bg: '#F6F4EF',
        fg: '#162226',
        accent: '#004554',
        radius: '8px',
        fontDisplay: 'Fraunces',
      },
    });
    assert.ok(url);
    const parsed = new URL(url);
    assert.equal(parsed.origin, 'https://realadvisor.ch');
    assert.equal(parsed.searchParams.get('token'), 'abc');
    assert.equal(parsed.searchParams.get('embed'), '1');
    assert.equal(parsed.searchParams.get('propertyType'), 'house');
    assert.equal(parsed.searchParams.get('address'), 'Rue du Lac 12, 1800 Vevey');
    assert.equal(parsed.searchParams.get('locale'), 'fr-CH');
    assert.equal(parsed.searchParams.get('accent'), '#004554');
    assert.equal(parsed.searchParams.get('fontDisplay'), 'Fraunces');

    assert.equal(
      buildValuationEmbedUrl({
        embedUrl: 'https://evil.example/x',
        propertyType: 'apartment',
        address: 'Zurich',
      }),
      null,
    );
  });

  it('builds safe relative fallback hrefs and guards against open redirects', () => {
    assert.equal(
      buildValuationFallbackHref('/estimation#enquiry', 'apartment', 'Rue du Lac 12'),
      '/estimation?type=apartment&address=Rue+du+Lac+12#enquiry',
    );
    assert.equal(
      buildValuationFallbackHref('//evil.example/steal', 'house', 'Bern'),
      '/valuation?type=house&address=Bern',
    );
  });

  it('accepts only origin-checked bounded postMessage resize payloads', () => {
    assert.equal(
      parseValuationResizeMessage('https://realadvisor.ch', {
        type: 'ra:valuation:resize',
        height: 680.4,
      }),
      680,
    );
    assert.equal(
      parseValuationResizeMessage('https://evil.example', {
        type: 'ra:valuation:resize',
        height: 680,
      }),
      null,
    );
    assert.equal(
      parseValuationResizeMessage('https://realadvisor.ch', {
        type: 'ra:valuation:resize',
        height: 50,
      }),
      null,
    );
    assert.equal(
      parseValuationResizeMessage('https://realadvisor.ch', {
        type: 'other',
        height: 680,
      }),
      null,
    );
  });
});
