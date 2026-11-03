/** Transport-independent sync planning. Not wired to Netflix or Android services. */
export const MAX_POSITION_MS = 86_400_000;
export type Timeline = { contentId: string; playing: boolean; positionMs: number; anchorTimeMs: number; revision: number };
export type PlaybackEnvelope = { roomId: string; serverTimeMs: number; timeline: Timeline | null };
export type PlayerSnapshot = {
  // Must identify the actual player content, not merely copy the room's content ID.
  contentId: string | null; state: 'playing' | 'paused' | 'buffering' | 'unknown';
  positionMs: number | null; canPlay: boolean; canPause: boolean; canSeek: boolean;
};
export type PlaybackAction = { type: 'play' | 'pause' } | { type: 'seek'; positionMs: number };
export type PlaybackPlan = { status: 'blocked' | 'aligned' | 'cooldown' | 'apply'; reason: string; actions: PlaybackAction[] };
const integer = (value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max;
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);

export function parsePlaybackEnvelope(value: unknown, roomId: string): PlaybackEnvelope {
  const invalid = () => new Error('Invalid playback response.');
  if (!record(value) || value.room_id !== roomId || !integer(value.server_time_ms, 0)) throw invalid();
  if (value.timeline === null) return { roomId, serverTimeMs: value.server_time_ms, timeline: null };
  const p = value.timeline;
  if (!record(p) || typeof p.content_id !== 'string' || !/^[0-9]{1,12}$/.test(p.content_id)
    || typeof p.playing !== 'boolean' || !integer(p.position_ms, 0, MAX_POSITION_MS)
    || !integer(p.anchor_time_ms, 0, value.server_time_ms) || !integer(p.revision, 1)) throw invalid();
  return { roomId, serverTimeMs: value.server_time_ms, timeline: {
    contentId: p.content_id, playing: p.playing, positionMs: p.position_ms,
    anchorTimeMs: p.anchor_time_ms, revision: p.revision,
  } };
}

/** Instantiate once per joined room; discard on sign-out, departure, or access loss.
 * Feed only fresh successful authorized RPC replies. The caller serializes actions
 * and supplies performance.now() timestamps, not changeable wall-clock time.
 */
export class PlaybackSynchronizer {
  private latest: Timeline | null = null;
  private lastCommandAt = -Infinity;
  private lastCommandRevision = 0;
  private readonly roomId: string;
  constructor(roomId: string) { this.roomId = roomId; }

  evaluate(raw: unknown, timing: { sentAtMs: number; receivedAtMs: number; nowMs: number }, player: PlayerSnapshot): PlaybackPlan {
    const blocked = (reason: string): PlaybackPlan => ({ status: 'blocked', reason, actions: [] });
    let envelope: PlaybackEnvelope;
    try { envelope = parsePlaybackEnvelope(raw, this.roomId); }
    catch { return blocked('invalid_snapshot'); }
    const { sentAtMs, receivedAtMs, nowMs } = timing;
    if (![sentAtMs, receivedAtMs, nowMs].every(n => Number.isFinite(n) && n >= 0)
      || receivedAtMs < sentAtMs || nowMs < receivedAtMs || receivedAtMs - sentAtMs > 2000
      || nowMs - receivedAtMs > 10000) return blocked('clock_sample_unusable');
    const timeline = envelope.timeline;
    if (!timeline) return blocked('no_timeline');
    if (this.latest && timeline.revision < this.latest.revision) return blocked('stale_revision');
    if (this.latest && timeline.revision === this.latest.revision &&
      (timeline.contentId !== this.latest.contentId || timeline.playing !== this.latest.playing ||
       timeline.positionMs !== this.latest.positionMs || timeline.anchorTimeMs !== this.latest.anchorTimeMs)) {
      return blocked('revision_conflict');
    }
    this.latest = { ...timeline };
    if (!player.contentId || player.contentId !== timeline.contentId) return blocked('content_mismatch');
    if (player.state === 'buffering') return blocked('buffering');
    if (player.state !== 'playing' && player.state !== 'paused') return blocked('player_state_unknown');
    if (player.positionMs == null || !Number.isFinite(player.positionMs) || player.positionMs < 0
      || player.positionMs > MAX_POSITION_MS) return blocked('position_unavailable');
    // Server timestamp sampled at the midpoint of the request. With RTT <= 2 s,
    // midpoint uncertainty is <= 1 s; the correction threshold is 1.5 s.
    const serverNow = envelope.serverTimeMs + nowMs - (sentAtMs + receivedAtMs) / 2;
    const target = Math.min(MAX_POSITION_MS, timeline.positionMs + (timeline.playing
      ? Math.max(0, serverNow - timeline.anchorTimeMs) : 0));
    const seek = Math.abs(target - player.positionMs) > 1500;
    const play = timeline.playing && player.state !== 'playing';
    const pause = !timeline.playing && player.state !== 'paused';
    const pauseAfterSeek = seek && !timeline.playing;
    if (seek && !player.canSeek || play && !player.canPlay || (pause || pauseAfterSeek) && !player.canPause) return blocked('control_unsupported');
    const actions: PlaybackAction[] = [];
    if (pause) actions.push({ type: 'pause' });
    if (seek) actions.push({ type: 'seek', positionMs: Math.round(target) });
    if (pauseAfterSeek) actions.push({ type: 'pause' });
    if (play) actions.push({ type: 'play' });
    if (!actions.length) return { status: 'aligned', reason: 'within_tolerance', actions };
    if (this.lastCommandRevision === timeline.revision && nowMs - this.lastCommandAt < 3000) {
      return { status: 'cooldown', reason: 'waiting_for_player', actions: [] };
    }
    this.lastCommandAt = nowMs; this.lastCommandRevision = timeline.revision;
    return { status: 'apply', reason: 'reconcile', actions };
  }
}
