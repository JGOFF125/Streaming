import { test } from 'node:test';
import assert from 'node:assert/strict';
import { orbitRouteForSystemPath } from '../src/nativeRoutes.ts';

test('only the fixed Orbit Netflix route can be opened by a native path', () => {
  for (const path of ['/netflix', 'com.jgoff125.orbit:///netflix', 'com.jgoff125.orbit://netflix']) {
    assert.equal(orbitRouteForSystemPath(path), '/netflix');
  }
  assert.equal(orbitRouteForSystemPath('/netflix?source=https://evil.test#private'), '/netflix');
});

test('OAuth callbacks return home without adding their credentials to router state', () => {
  for (const path of ['com.jgoff125.orbit://auth/callback?code=private&orbit_state=private',
    '/auth/callback?code=private', 'com.jgoff125.orbit://auth/callback#access_token=private']) {
    assert.equal(orbitRouteForSystemPath(path), '/');
  }
});

test('malformed links, external origins and unknown routes fail closed without echoing input', () => {
  for (const path of [null, {}, '', 'not a url', 'https://netflix.com/netflix',
    'https://evil.test/netflix', '//evil.test/netflix', 'com.jgoff125.orbit://user:password@netflix',
    '/netflix/extra', 'javascript:alert(1)', '/netflix\\evil', '/netflix' + 'a'.repeat(16384)]) {
    assert.equal(orbitRouteForSystemPath(path), '/');
  }
});
