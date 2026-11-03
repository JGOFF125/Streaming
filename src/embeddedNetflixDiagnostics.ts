export const browserEventCodes = [
  'loading', 'page_loaded', 'network_error', 'http_error', 'navigation_blocked',
  'certificate_error', 'authentication_blocked', 'renderer_stopped', 'browser_unavailable',
  'protected_media_required', 'protected_media_allowed', 'protected_media_denied',
  'protected_media_cancelled', 'permission_blocked', 'popup_blocked', 'download_blocked',
  'file_upload_blocked', 'fullscreen_unavailable', 'background_closed',
] as const;
export type BrowserEventCode = typeof browserEventCodes[number];
export type BrowserStatus = { code: BrowserEventCode; canGoBack: boolean; mediaPermissionPending: boolean };
export type Observation = 'not_tested' | 'movie_played' | 'sign_in_only' | 'app_required' | 'provider_blocked';
type ReportEvent = BrowserEventCode | 'none';
export type BrowserHistory = {
  events: BrowserEventCode[];
  lastPageEvent: ReportEvent;
  lastBlockingEvent: ReportEvent;
  lifecycleEvent: 'background_closed' | 'none';
};
const codes = new Set<string>(browserEventCodes);
const blockers = new Set<BrowserEventCode>([
  'network_error', 'http_error', 'navigation_blocked', 'certificate_error',
  'authentication_blocked', 'renderer_stopped', 'browser_unavailable',
  'permission_blocked', 'popup_blocked', 'download_blocked', 'file_upload_blocked',
  'fullscreen_unavailable', 'protected_media_denied',
]);
const observations = new Set<string>(['not_tested', 'movie_played', 'sign_in_only', 'app_required', 'provider_blocked']);
const knownEvent = (value: unknown): value is BrowserEventCode => typeof value === 'string' && codes.has(value);

export function initialBrowserHistory(): BrowserHistory {
  return { events: [], lastPageEvent: 'none', lastBlockingEvent: 'none', lifecycleEvent: 'none' };
}

// Never retain native extras, URLs, page text or unknown error strings.
export function readBrowserStatus(value: unknown): BrowserStatus | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  if (!knownEvent(data.code)) return null;
  return {
    code: data.code,
    canGoBack: data.canGoBack === true,
    mediaPermissionPending: data.mediaPermissionPending === true,
  };
}

export function recordBrowserEvent(previous: BrowserHistory, value: unknown): BrowserHistory {
  const status = readBrowserStatus(value);
  if (!status) return previous;
  const prior = previous.events.filter(knownEvent);
  const events = prior.at(-1) === status.code ? prior : [...prior, status.code];
  return {
    events: events.slice(-12),
    lastPageEvent: status.code === 'background_closed' ? previous.lastPageEvent : status.code,
    lastBlockingEvent: blockers.has(status.code) ? status.code : previous.lastBlockingEvent,
    lifecycleEvent: status.code === 'background_closed' ? status.code : previous.lifecycleEvent,
  };
}

export function embeddedNetflixReport(observation: Observation, history: BrowserHistory): string {
  const events = history.events.filter(knownEvent).slice(-12);
  return JSON.stringify({
    diagnostic: 'Orbit in-app Netflix v2',
    playerRoute: 'android_system_webview',
    browserMode: 'default',
    playback: observations.has(observation) ? observation : 'not_tested',
    evidence: 'user_reported',
    // Preserve page context independently of the app leaving the foreground.
    browserEvent: knownEvent(history.lastPageEvent) ? history.lastPageEvent : 'none',
    lastEvent: events.at(-1) ?? 'none',
    lastBlockingEvent: knownEvent(history.lastBlockingEvent) && blockers.has(history.lastBlockingEvent)
      ? history.lastBlockingEvent : 'none',
    lifecycleEvent: history.lifecycleEvent === 'background_closed' ? 'background_closed' : 'none',
    events,
    titleIdentityVerified: false,
    automaticSyncVerified: false,
  }, null, 2);
}
