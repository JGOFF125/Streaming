// Native browser sign-in. Keep PKCE and callback validation testable without Expo.
export const GOOGLE_REDIRECT_URI = 'com.jgoff125.orbit://auth/callback';
export const GOOGLE_REDIRECT_ALLOW_PATTERN = GOOGLE_REDIRECT_URI + '?orbit_state=*';

type BrowserResult = { type: string; url?: string };
export type GoogleAuthDependencies = {
  randomBytes: (length: number) => Promise<Uint8Array>;
  sha256Base64: (value: string) => Promise<string>;
  authorize: (redirectTo: string, challenge: string) => Promise<string>;
  openBrowser: (url: string, returnUrl: string) => Promise<BrowserResult>;
  exchange: (code: string, verifier: string) => Promise<void>;
};

function randomHex(bytes: Uint8Array, length: number): string {
  if (bytes.length !== length) throw new Error('Secure sign-in could not start. Please try again.');
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function readGoogleCallback(url: string, expectedState: string): string {
  let callback: URL;
  try { callback = new URL(url); }
  catch { throw new Error('The Google sign-in return address could not be verified. Please try again.'); }
  const expected = new URL(GOOGLE_REDIRECT_URI);
  if (callback.protocol !== expected.protocol || callback.host !== expected.host
    || callback.pathname !== expected.pathname || callback.username || callback.password
    || callback.searchParams.getAll('orbit_state').length !== 1
    || callback.searchParams.get('orbit_state') !== expectedState) {
    throw new Error('The Google sign-in return address could not be verified. Please try again.');
  }
  // Never display raw OAuth errors or accept access tokens from an unsolicited link.
  if (callback.searchParams.has('error') || callback.hash) {
    throw new Error('Google sign-in was not completed. Check your account invitation and try again.');
  }
  const codes = callback.searchParams.getAll('code');
  if (codes.length !== 1 || !codes[0].trim() || codes[0].length > 2048) {
    throw new Error('Google sign-in did not return a valid code. Please try again.');
  }
  return codes[0];
}

export async function runGoogleAuth(deps: GoogleAuthDependencies): Promise<'signed-in' | 'cancelled'> {
  // 256-bit native random verifier. SHA-256 is required; never use plain PKCE.
  const verifier = randomHex(await deps.randomBytes(32), 32);
  const state = randomHex(await deps.randomBytes(16), 16);
  const challenge = (await deps.sha256Base64(verifier))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (!/^[A-Za-z0-9_-]{43}$/.test(challenge)) {
    throw new Error('Secure sign-in could not start. Please try again.');
  }
  const redirect = new URL(GOOGLE_REDIRECT_URI);
  redirect.searchParams.set('orbit_state', state);
  const loginUrl = await deps.authorize(redirect.toString(), challenge);
  const result = await deps.openBrowser(loginUrl, GOOGLE_REDIRECT_URI);
  if (result.type === 'cancel' || result.type === 'dismiss') return 'cancelled';
  if (result.type !== 'success' || !result.url) {
    throw new Error('The sign-in browser could not finish. Please try again.');
  }
  const code = readGoogleCallback(result.url, state);
  await deps.exchange(code, verifier);
  return 'signed-in';
}

export type TokenResponse = { ok: boolean; status: number; json: () => Promise<unknown> };
export async function exchangeGoogleCode(
  baseUrl: string,
  publishableKey: string,
  code: string,
  verifier: string,
  request: (url: string, options: RequestInit) => Promise<TokenResponse>,
  setSession: (tokens: { access_token: string; refresh_token: string }) => Promise<void>,
): Promise<void> {
  // Public Supabase Auth PKCE endpoint. Only Orbit tokens enter the SDK session.
  const response = await request(baseUrl.replace(/\/$/, '') + '/auth/v1/token?grant_type=pkce', {
    method: 'POST',
    headers: { apikey: publishableKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
  });
  if (!response.ok) {
    throw new Error(response.status === 429
      ? 'Too many sign-in attempts. Please wait and try again.'
      : 'Google sign-in could not finish. Check your account invitation and try again.');
  }
  let data: unknown;
  try { data = await response.json(); }
  catch { throw new Error('The sign-in server returned an unexpected response. Please try again.'); }
  if (!data || typeof data !== 'object'
    || !('access_token' in data) || typeof data.access_token !== 'string' || !data.access_token
    || !('refresh_token' in data) || typeof data.refresh_token !== 'string' || !data.refresh_token) {
    throw new Error('The sign-in server returned an unexpected response. Please try again.');
  }
  // Do not copy Google provider_token/provider_refresh_token into app state.
  await setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
}
