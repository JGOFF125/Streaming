export const browserEventCodes = [
  'loading', 'page_loaded', 'network_error', 'http_error', 'navigation_blocked',
  'certificate_error', 'authentication_blocked', 'renderer_stopped', 'browser_unavailable',
  'protected_media_required', 'protected_media_allowed', 'protected_media_denied',
  'protected_media_cancelled', 'permission_blocked', 'popup_blocked', 'download_blocked',
  'file_upload_blocked', 'fullscreen_unavailable', 'background_closed',
  'desktop_profile_applied', 'browser_profile_unavailable',
] as const;
export type BrowserEventCode = typeof browserEventCodes[number];
export type BrowserProfile = 'system' | 'desktop';
export type BrowserProfileEvidence = {mode:BrowserProfile;desktopApplied:boolean;clientHintsOverridden:boolean;formFactorsOverridden:boolean};
export type BrowserStatus = { code: BrowserEventCode; canGoBack: boolean; mediaPermissionPending: boolean; browserProfile?:BrowserProfile;desktopApplied?:boolean;clientHintsOverridden?:boolean;formFactorsOverridden?:boolean };
export type Observation = 'not_tested' | 'movie_played' | 'sign_in_only' | 'app_required' | 'provider_blocked';
type ReportEvent = BrowserEventCode | 'none';
export type BrowserHistory = {
  events: BrowserEventCode[];
  lastPageEvent: ReportEvent;
  lastBlockingEvent: ReportEvent;
  lifecycleEvent: 'background_closed' | 'none';
  profileEvidence?:BrowserProfileEvidence;
};
const codes = new Set<string>(browserEventCodes);
const blockers = new Set<BrowserEventCode>([
  'network_error', 'http_error', 'navigation_blocked', 'certificate_error',
  'authentication_blocked', 'renderer_stopped', 'browser_unavailable',
  'permission_blocked', 'popup_blocked', 'download_blocked', 'file_upload_blocked',
  'fullscreen_unavailable', 'protected_media_denied', 'browser_profile_unavailable',
]);
const observations = new Set<string>(['not_tested', 'movie_played', 'sign_in_only', 'app_required', 'provider_blocked']);
const knownEvent = (value: unknown): value is BrowserEventCode => typeof value === 'string' && codes.has(value);


function readProfile(value:unknown):BrowserProfileEvidence|null {
  if(!value || typeof value!=='object')return null;
  const data=value as Record<string,unknown>;
  if(data.mode!=='system' && data.mode!=='desktop')return null;
  const applied=data.mode==='desktop' && data.desktopApplied===true && data.clientHintsOverridden===true;
  return {mode:data.mode,desktopApplied:applied,clientHintsOverridden:applied,formFactorsOverridden:applied && data.formFactorsOverridden===true};
}

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
    ...(data.browserProfile==='system' || data.browserProfile==='desktop' ? {
      browserProfile:data.browserProfile,
      desktopApplied:data.browserProfile==='desktop' && data.desktopApplied===true && data.clientHintsOverridden===true,
      clientHintsOverridden:data.browserProfile==='desktop' && data.desktopApplied===true && data.clientHintsOverridden===true,
      formFactorsOverridden:data.browserProfile==='desktop' && data.desktopApplied===true && data.clientHintsOverridden===true && data.formFactorsOverridden===true,
    }:{}),
  };
}

export function recordBrowserEvent(previous: BrowserHistory, value: unknown): BrowserHistory {
  const status = readBrowserStatus(value);
  if (!status) return previous;
  const prior = previous.events.filter(knownEvent);
  const events = prior.at(-1) === status.code ? prior : [...prior, status.code];
  const profile=readProfile({mode:status.browserProfile,desktopApplied:status.desktopApplied,clientHintsOverridden:status.clientHintsOverridden,formFactorsOverridden:status.formFactorsOverridden}) ?? readProfile(previous.profileEvidence);
  return {
    ...(profile?{profileEvidence:profile}:{}),
    events: events.slice(-12),
    lastPageEvent: status.code === 'background_closed' ? previous.lastPageEvent : status.code,
    lastBlockingEvent: blockers.has(status.code) ? status.code : previous.lastBlockingEvent,
    lifecycleEvent: status.code === 'background_closed' ? status.code : previous.lifecycleEvent,
  };
}

export type NetflixEntryPoint = 'login' | 'browse' | 'watch_link';
export function embeddedNetflixReport(observation: Observation, history: BrowserHistory, entryPoint: NetflixEntryPoint = 'login'): string {
  const events = history.events.filter(knownEvent).slice(-12);
  const profile=readProfile(history.profileEvidence);
  return JSON.stringify({
    diagnostic: 'Orbit in-app Netflix v3',
    playerRoute: 'android_system_webview',
    browserMode: profile?.mode==='desktop'?'desktop_compatibility':'default',
    browserProfileEvidence:profile,
    entryPoint: entryPoint === 'browse' || entryPoint === 'watch_link' ? entryPoint : 'login',
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
