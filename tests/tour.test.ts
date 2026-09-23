import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dashboardDestination, orderedTour, tourStops } from '../lib/renoxis/tour.ts';
test('each personalized path covers every box once and prioritizes the chosen focus', () => {
  for (const [focus, first] of [['Leads','leads'],['Properties','properties'],['Calendar','day']]) {
    const path = orderedTour(focus);
    assert.equal(path[0].id, 'overview');
    assert.equal(path[1].id, first);
    assert.equal(new Set(path.map(s => s.id)).size, tourStops.length);
    assert.deepEqual(new Set(path.map(s => s.id)), new Set(tourStops.map(s => s.id)));
  }
});
test('all dashboard boards and utility boxes have interactive explanations', () => {
  for (const board of ['Overview','Email','Calendar','Leads','Clients','Properties','Transactions','Renovation Studio','Social Studio','Documents','Analytics','Cixy Studio','Connections','Team','FAQs']) assert.ok(tourStops.some(s => s.board === board), board);
  for (const id of ['pipeline','forecast','tasks','search','add','refresh','navigation','wallet']) assert.ok(tourStops.some(s => s.id === id), id);
  for (const stop of tourStops) { assert.equal(stop.choices.length, stop.replies.length); assert.ok(stop.explanation && stop.question); }
});
test('welcome redirect preserves billing, invite, and connection returns on the local dashboard', () => {
  const url = dashboardDestination({board:'Cixy Studio',billing:'renew',invite:'test-token',connection:'connected',next:'https://example.com'});
  assert.equal(url, '/dashboard?board=Cixy+Studio&billing=renew&invite=test-token&connection=connected');
  assert.equal(dashboardDestination({board:['bad','input']}), '/dashboard');
});
