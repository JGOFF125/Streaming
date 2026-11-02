import 'react-native-url-polyfill/auto';
import { createClient, processLock } from '@supabase/supabase-js';

// These are public connection details, never secret/service-role keys.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
const validUrl = !!url && /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url);
const validKey = !!key && /^sb_publishable_[A-Za-z0-9_-]+$/.test(key);

export const backendSetupMessage = !url || !key
  ? 'Private rooms need Supabase setup. Follow PHASE_2_SETUP.md in the project.'
  : !validUrl || !validKey
    ? 'Check the Supabase HTTPS project URL and public publishable key in .env.local.'
    : null;

export const supabase = backendSetupMessage ? null : createClient(url!, key!, {
  auth: {
    // First increment: keep Orbit sessions in memory, never unencrypted storage.
    // Restarting the app requires a fresh email code. Streaming sessions never enter Orbit.
    persistSession: false,
    // Google uses native S256 PKCE in googleSignIn.ts. The SDK only builds its
    // authorize URL; keep automatic SDK PKCE off to avoid duplicate challenges.
    flowType: 'implicit',
    autoRefreshToken: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});

export type RemoteRoom = {
  id: string;
  host_id: string;
  expires_at: string;
  closed: boolean;
  revision: number;
};
export type RoomMember = { user_id: string; nickname: string };
export type RoomResult = { room_id?: string; code?: string; error?: string };

export function readRoomResult(data: unknown): RoomResult {
  if (!data || typeof data !== 'object') throw new Error('The room server returned an unexpected response.');
  const result = data as RoomResult;
  if (typeof result.error === 'string') throw new Error(result.error);
  if (typeof result.room_id !== 'string') throw new Error('The room server did not confirm membership.');
  return result;
}
