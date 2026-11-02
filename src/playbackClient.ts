import { parsePlaybackEnvelope } from './playbackSync.ts';
import type { PlaybackEnvelope } from './playbackSync';

export type PlaybackRpc = (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;
export type PlaybackRead = { envelope: PlaybackEnvelope; sentAtMs: number; receivedAtMs: number };

export function playbackErrorMessage(error: unknown): string {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  if (['PGRST202', 'PGRST205', '42883', '42P01'].includes(code)) return 'Room playback setup needs finishing on the server.';
  if (['42501', 'PGRST301', 'PGRST302', 'PGRST303', '28000'].includes(code)) return 'Playback access was lost. Check your room membership and sign in again.';
  return 'Room playback is unavailable. Check your connection and refresh.';
}

export async function readPlayback(rpc: PlaybackRpc, roomId: string, clock: () => number = () => performance.now()): Promise<PlaybackRead> {
  const sentAtMs = clock();
  let response: { data: unknown; error: unknown };
  try { response = await rpc('orbit_get_playback', { p_room_id: roomId }); }
  catch (error) { throw new Error(playbackErrorMessage(error)); }
  const { data, error } = response;
  const receivedAtMs = clock();
  if (error) throw new Error(playbackErrorMessage(error));
  try { return { envelope: parsePlaybackEnvelope(data, roomId), sentAtMs, receivedAtMs }; }
  catch { throw new Error('The room playback response could not be verified.'); }
}

export function netflixContentId(value: string): string | null {
  const text = value.trim();
  if (/^[1-9][0-9]{0,11}$/.test(text)) return text;
  try {
    const url = new URL(text);
    if (url.protocol !== 'https:' || !['netflix.com', 'www.netflix.com'].includes(url.hostname) || url.username || url.password || url.port) return null;
    // Store only a public catalog ID. Never forward tracking parameters or URLs.
    return url.pathname.match(/^\/(?:title|watch)\/([1-9][0-9]{0,11})\/?$/)?.[1] ?? null;
  } catch { return null; }
}

export type NetflixSyncResult = { reason: string; reads: number; published: number; commands: number; durationMs: number };
export function netflixSyncMessage(result: NetflixSyncResult): string {
  const reasons: Record<string, string> = {
    completed: 'The one-minute test ended. Automatic adjustments have stopped. Confirm the visible playback on both devices.',
    cancelled: 'Sync test stopped. Commands already sent cannot be undone.',
    busy: 'Another Netflix control test is still running.',
    permission_required: 'Enable Netflix controls in Orbit first.',
    connecting: 'Android has not connected the Netflix controls yet.',
    no_session: 'No single Netflix player was found. Start the selected movie and retry.',
    session_changed: 'Netflix changed its player. Sync stopped to avoid controlling another session.',
    identity_unavailable: 'Netflix did not expose a supported catalog ID. Automatic control is blocked until we can verify the movie identity.',
    content_mismatch: 'Netflix is playing a different catalog item. Sync stopped.',
    content_bounds: 'The shared position is outside this movie. Sync stopped.',
    no_ack: 'Netflix did not acknowledge the requested adjustment. Sync stopped instead of repeating unverified commands.',
    no_state: 'Netflix did not provide a usable playback state.',
    no_position: 'Netflix did not provide a usable playback position.',
    unsupported: 'Netflix did not report the controls needed for this adjustment.',
    no_timeline: 'The host has not started sharing playback yet. Start the host test first.',
    unauthorized: 'Room access or the Orbit sign-in expired. Sync stopped. Sign in again and check membership.',
    backend_incomplete: 'The server playback setup needs finishing.',
    connection_failed: 'The room connection failed. Sync stopped; it will not replay cached commands.',
    slow_connection: 'The room connection is too slow for this test. Sync stopped.',
    rate_limited: 'The server playback command limit was reached. Wait a minute and retry.',
    invalid_snapshot: 'The playback response could not be verified. Sync stopped.',
    revision_conflict: 'Conflicting playback updates were detected. Sync stopped.',
  };
  return reasons[result.reason] ?? 'Sync stopped without a verified result. Refresh the room before retrying.';
}
