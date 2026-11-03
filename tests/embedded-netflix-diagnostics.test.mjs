import { test } from 'node:test';
import assert from 'node:assert/strict';
import { initialBrowserHistory, recordBrowserEvent, readBrowserStatus, embeddedNetflixReport } from '../src/embeddedNetflixDiagnostics.ts';

const event = code => ({ code, canGoBack: true, mediaPermissionPending: false });
const add = (history, ...codes) => codes.reduce((state, code) => recordBrowserEvent(state, event(code)), history);

test('background closure does not replace the page event or imply a Netflix failure cause', () => {
  const history = add(initialBrowserHistory(), 'loading', 'page_loaded', 'background_closed');
  const report = JSON.parse(embeddedNetflixReport('sign_in_only', history));
  assert.equal(report.browserEvent, 'page_loaded');
  assert.equal(report.lastEvent, 'background_closed');
  assert.equal(report.lifecycleEvent, 'background_closed');
  assert.equal(report.lastBlockingEvent, 'none');
  assert.equal(report.playback, 'sign_in_only');
  assert.equal(report.automaticSyncVerified, false);
});

test('a blocked navigation remains available after page and lifecycle updates', () => {
  const history = add(initialBrowserHistory(), 'loading', 'navigation_blocked', 'page_loaded', 'background_closed');
  const report = JSON.parse(embeddedNetflixReport('app_required', history));
  assert.equal(report.browserEvent, 'page_loaded');
  assert.equal(report.lastBlockingEvent, 'navigation_blocked');
  assert.equal(report.playback, 'app_required');
  assert.equal(report.evidence, 'user_reported');
  assert.equal(report.titleIdentityVerified, false);
});

test('reports are frozen strings and a fresh attempt has no previous evidence', () => {
  const history = add(initialBrowserHistory(), 'page_loaded');
  const saved = embeddedNetflixReport('movie_played', history);
  add(history, 'background_closed');
  assert.equal(JSON.parse(saved).lastEvent, 'page_loaded');
  assert.equal(JSON.parse(saved).automaticSyncVerified, false);
  assert.deepEqual(initialBrowserHistory().events, []);
  assert.equal(initialBrowserHistory().lastBlockingEvent, 'none');
});

test('event traces are bounded, deduplicated, and retain a blocking event separately', () => {
  let history = add(initialBrowserHistory(), 'navigation_blocked');
  for (let i = 0; i < 30; i++) history = add(history, 'loading', 'loading', 'page_loaded');
  assert.equal(history.events.length, 12);
  assert.equal(history.lastBlockingEvent, 'navigation_blocked');
  for (let i = 1; i < history.events.length; i++) assert.notEqual(history.events[i], history.events[i - 1]);
});

test('unknown native strings and extra fields cannot enter an exported diagnostic', () => {
  const secret = 'https://www.netflix.com/login?private_token=example';
  assert.equal(readBrowserStatus({ code: secret }), null);
  assert.equal(readBrowserStatus(null), null);
  assert.deepEqual(readBrowserStatus({ ...event('page_loaded'), canGoBack: secret, url: secret }),
    { code: 'page_loaded', canGoBack: false, mediaPermissionPending: false });
  const clean = add(initialBrowserHistory(), 'page_loaded');
  assert.equal(recordBrowserEvent(clean, { code: secret }), clean);
  const dirty = { ...clean, events: [...clean.events, secret], lastPageEvent: secret,
    lastBlockingEvent: secret, lifecycleEvent: secret, url: secret };
  assert.doesNotMatch(embeddedNetflixReport(secret, dirty), /private_token|example/);
  assert.equal(JSON.parse(embeddedNetflixReport(secret, dirty)).playback, 'not_tested');
});
