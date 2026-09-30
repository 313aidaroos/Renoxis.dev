import assert from 'node:assert/strict';
import { test } from 'node:test';
import { OTHER_IXIS_COMPANIES } from '../lib/renoxis/ixis-companies.ts';

test('footer lists the 13 other Ixis companies with https URLs, no duplicates', () => {
  assert.equal(OTHER_IXIS_COMPANIES.length, 13);
  const urls = OTHER_IXIS_COMPANIES.map((c) => c.url);
  assert.equal(new Set(urls).size, urls.length);
  for (const c of OTHER_IXIS_COMPANIES) {
    assert.ok(c.name.trim().length > 0);
    assert.equal(new URL(c.url).protocol, 'https:');
  }
});

test('footer leaves out Renoxis and the excluded projects', () => {
  const text = JSON.stringify(OTHER_IXIS_COMPANIES).toLowerCase();
  for (const bad of ['renoxis', 'nexxis', 'omnixis', 'launchixis', 'personalcontentbot', 'awadbot', 'command']) {
    assert.ok(!text.includes(bad), bad);
  }
});
