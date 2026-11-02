import 'react-native-url-polyfill/auto';
import { isRunningInExpoGo } from 'expo';
import { makeRedirectUri } from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { supabase } from './backend';
import { exchangeGoogleCode, GOOGLE_REDIRECT_URI, runGoogleAuth } from './googleAuthFlow';

export const googleSignInSetupMessage = Platform.OS !== 'android'
  ? 'Google sign-in is currently available in the Android app.'
  : isRunningInExpoGo()
    ? 'Google sign-in needs the Orbit development build. Email sign-in is available here.'
    : null;

export async function signInWithGoogle(): Promise<'signed-in' | 'cancelled'> {
  const client = supabase;
  const baseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!client || !baseUrl || !key) throw new Error('Configure the Orbit backend first.');
  if (googleSignInSetupMessage) throw new Error(googleSignInSetupMessage);

  // Custom schemes are registered by app.json in the installed Android build.
  const redirect = makeRedirectUri({ scheme: 'com.jgoff125.orbit', path: 'auth/callback', native: GOOGLE_REDIRECT_URI });
  if (redirect !== GOOGLE_REDIRECT_URI) throw new Error('The app sign-in address needs configuration.');

  return runGoogleAuth({
    // Use native async crypto. The SDK may otherwise fall back to Math.random/plain
    // PKCE in React Native environments lacking a full WebCrypto implementation.
    randomBytes: Crypto.getRandomBytesAsync,
    sha256Base64: value => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value, { encoding: Crypto.CryptoEncoding.BASE64 }),
    authorize: async (redirectTo, challenge) => {
      // The existing SDK uses its default flow. Supply native S256 parameters to
      // the public authorize endpoint and exchange with the matching verifier.
      const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          scopes: 'openid email profile',
          queryParams: { prompt: 'select_account', code_challenge: challenge, code_challenge_method: 's256' },
        },
      });
      if (error || !data.url) throw new Error('Google sign-in could not start. Check the Google provider setup.');
      return data.url;
    },
    openBrowser: (url, returnUrl) => WebBrowser.openAuthSessionAsync(url, returnUrl),
    exchange: (code, verifier) => exchangeGoogleCode(baseUrl, key, code, verifier,
      async (url, options) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try { return await fetch(url, { ...options, signal: controller.signal }); }
        catch { throw new Error('Could not reach the Orbit sign-in server. Check your connection and try again.'); }
        finally { clearTimeout(timer); }
      },
      async tokens => {
        const { error } = await client.auth.setSession(tokens);
        if (error) throw new Error('Your Orbit session could not be verified. Please sign in again.');
      }),
  });
}
