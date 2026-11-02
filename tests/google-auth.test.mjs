import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { exchangeGoogleCode, GOOGLE_REDIRECT_URI, GOOGLE_REDIRECT_ALLOW_PATTERN, readGoogleCallback, runGoogleAuth } from '../src/googleAuthFlow.ts';

function harness(browserOverride) {
  const events = [];
  let requestedRedirect;
  const deps = {
    randomBytes: async length => new Uint8Array(length).fill(length),
    sha256Base64: async value => createHash('sha256').update(value).digest('base64'),
    authorize: async (redirectTo, challenge) => {
      requestedRedirect = redirectTo;
      events.push({ kind: 'authorize', redirectTo, challenge });
      return 'https://test.supabase.co/auth/v1/authorize?provider=google';
    },
    openBrowser: async (_url, returnUrl) => {
      events.push({ kind: 'browser', returnUrl });
      if (browserOverride) return browserOverride(requestedRedirect);
      const result = new URL(requestedRedirect);
      result.searchParams.set('code', 'one-time-code');
      return { type: 'success', url: result.toString() };
    },
    exchange: async (code, verifier) => { events.push({ kind: 'exchange', code, verifier }); },
  };
  return { deps, events };
}

test('native sign-in uses S256 PKCE, a per-attempt state, and the validated one-time code', async () => {
  const { deps, events } = harness();
  assert.equal(await runGoogleAuth(deps), 'signed-in');
  const start = events[0];
  const exchange = events.at(-1);
  assert.equal(new URL(start.redirectTo).searchParams.get('orbit_state').length, 32);
  assert.equal(new URL(start.redirectTo).origin, new URL(GOOGLE_REDIRECT_URI).origin);
  assert.match(exchange.verifier, /^[a-f0-9]{64}$/);
  assert.equal(start.challenge, createHash('sha256').update(exchange.verifier).digest('base64url'));
  assert.equal(exchange.code, 'one-time-code');
  assert.equal(events[1].returnUrl, GOOGLE_REDIRECT_URI);
  assert.equal(GOOGLE_REDIRECT_ALLOW_PATTERN, GOOGLE_REDIRECT_URI + '?orbit_state=*');
});

for (const type of ['cancel', 'dismiss']) {
  test(type + ' never exchanges a code', async () => {
    const { deps, events } = harness(() => ({ type }));
    assert.equal(await runGoogleAuth(deps), 'cancelled');
    assert.equal(events.some(event => event.kind === 'exchange'), false);
  });
}
test('a forged callback cannot trigger a token exchange', async () => {
  for (const malicious of [
    'com.other.app://auth/callback?code=attacker&orbit_state=wrong',
    GOOGLE_REDIRECT_URI + '?code=attacker&orbit_state=wrong',
  ]) {
    const { deps, events } = harness(() => ({ type: 'success', url: malicious }));
    await assert.rejects(runGoogleAuth(deps), /could not be verified/);
    assert.equal(events.some(event => event.kind === 'exchange'), false);
  }
});
test('callback handling rejects unexpected hosts, paths, credentials, tokens and duplicate parameters', () => {
  const good = GOOGLE_REDIRECT_URI + '?orbit_state=expected&code=good';
  assert.equal(readGoogleCallback(good, 'expected'), 'good');
  for (const bad of [
    good.replace('://auth/', '://attacker/'),
    good.replace('/callback', '/different'),
    good.replace('://auth/', '://user:password@auth/'),
    good.replace('://auth/', '://auth:123/'),
    good + '&orbit_state=expected',
    good + '&code=other',
    good.replace('code=good', 'code='),
    good.replace('code=good', 'code=%20'),
    good + '#access_token=secret',
  ]) assert.throws(() => readGoogleCallback(bad, 'expected'));
});
test('provider errors do not expose returned secrets or descriptions', () => {
  assert.throws(() => readGoogleCallback(GOOGLE_REDIRECT_URI + '?orbit_state=expected&error=access_denied&error_description=private-value', 'expected'),
    error => !error.message.includes('private-value') && /not completed/.test(error.message));
});
test('weak or missing crypto fails before the browser is opened', async () => {
  for (const override of [
    { randomBytes: async () => new Uint8Array(1) },
    { sha256Base64: async () => 'plain-verifier' },
    { randomBytes: async () => { throw new Error('Native crypto unavailable'); } },
  ]) {
    const { deps, events } = harness();
    Object.assign(deps, override);
    await assert.rejects(runGoogleAuth(deps));
    assert.equal(events.length, 0);
  }
});
test('the installed Supabase SDK sends native S256 parameters without a plain challenge', async () => {
  const client = createClient('https://example.supabase.co', 'sb_publishable_test', {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data, error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: GOOGLE_REDIRECT_URI + '?orbit_state=expected',
      skipBrowserRedirect: true,
      scopes: 'openid email profile',
      queryParams: { prompt: 'select_account', code_challenge: 'secure-challenge', code_challenge_method: 's256' },
    },
  });
  assert.equal(error, null);
  const url = new URL(data.url);
  assert.deepEqual(url.searchParams.getAll('code_challenge'), ['secure-challenge']);
  assert.deepEqual(url.searchParams.getAll('code_challenge_method'), ['s256']);
  assert.equal(url.searchParams.get('redirect_to'), GOOGLE_REDIRECT_URI + '?orbit_state=expected');
  assert.equal(url.searchParams.get('scopes'), 'openid email profile');
});
test('PKCE exchange sends only the code/verifier and retains only Orbit session tokens', async () => {
  let request;
  let tokens;
  await exchangeGoogleCode('https://example.supabase.co/', 'sb_publishable_test', 'code', 'verifier',
    async (url, options) => {
      request = { url, options };
      return { ok: true, status: 200, json: async () => ({
        access_token: 'orbit-access', refresh_token: 'orbit-refresh',
        provider_token: 'google-access', provider_refresh_token: 'google-refresh',
      }) };
    },
    async value => { tokens = value; });
  assert.equal(request.url, 'https://example.supabase.co/auth/v1/token?grant_type=pkce');
  assert.deepEqual(JSON.parse(request.options.body), { auth_code: 'code', code_verifier: 'verifier' });
  assert.equal(request.options.headers.apikey, 'sb_publishable_test');
  assert.deepEqual(tokens, { access_token: 'orbit-access', refresh_token: 'orbit-refresh' });
});
test('failed or malformed token responses never establish a session', async () => {
  for (const response of [
    { ok: false, status: 400, json: async () => ({ msg: 'secret' }) },
    { ok: false, status: 429, json: async () => ({ msg: 'secret' }) },
    { ok: true, status: 200, json: async () => ({ access_token: 'access-only' }) },
    { ok: true, status: 200, json: async () => { throw new Error('secret invalid json'); } },
  ]) {
    let set = false;
    await assert.rejects(exchangeGoogleCode('https://example.supabase.co', 'sb_publishable_test', 'code', 'verifier',
      async () => response, async () => { set = true; }), error => !error.message.includes('secret'));
    assert.equal(set, false);
  }
});
test('Android app and build configuration match the registered callback scheme', async () => {
  const app = JSON.parse(await readFile(new URL('../app.json', import.meta.url), 'utf8'));
  const eas = JSON.parse(await readFile(new URL('../eas.json', import.meta.url), 'utf8'));
  assert.equal(app.expo.scheme + ':', new URL(GOOGLE_REDIRECT_URI).protocol);
  assert.equal(app.expo.android.package, 'com.jgoff125.orbit');
  assert.equal(eas.build.development.developmentClient, true);
  assert.equal(eas.build.development.android.buildType, 'apk');
});
