import type {NetflixRecognition} from './netflixRecognition';
export type MediaCommand = 'play' | 'pause' | 'seek';
export type NetflixDisplayLabels = {
  // Raw labels stay in local screen memory; netflixReport exports only evidence flags.
  titleLabel?: string | null; standardTitleLabel?: string | null; subtitleLabel?: string | null; descriptionLabel?: string | null;
  titleSource?: string; titlePresent?: boolean; displayTitlePresent?: boolean;
  subtitlePresent?: boolean; descriptionPresent?: boolean;
};
export type NetflixLabelComparison = { available: boolean; titleChanged: boolean; subtitleChanged: boolean; descriptionChanged: boolean; standardTitleChanged?: boolean };
export function compareNetflixLabels(before: NetflixDisplayLabels | null, after: NetflixDisplayLabels | null): NetflixLabelComparison {
  const available = typeof before?.titleLabel === 'string' && !!before.titleLabel &&
    typeof after?.titleLabel === 'string' && !!after.titleLabel;
  return { available, standardTitleChanged: available && (before!.standardTitleLabel ?? null) !== (after!.standardTitleLabel ?? null), titleChanged: available && before!.titleLabel !== after!.titleLabel,
    subtitleChanged: available && (before!.subtitleLabel ?? null) !== (after!.subtitleLabel ?? null),
    descriptionChanged: available && (before!.descriptionLabel ?? null) !== (after!.descriptionLabel ?? null) };
}
export type NetflixQueueEvidence = {
  status?: string; candidateContentId?: string | null; mediaIdPresent?: boolean; mediaUriPresent?: boolean;
};
export type NetflixContextLabels = {albumLabel?:string|null;artistLabel?:string|null;albumArtistLabel?:string|null;albumPresent?:boolean;artistPresent?:boolean;albumArtistPresent?:boolean};
export type NetflixSnapshot = {
  appBuild?:{version?:string|null;code?:number|null};
  contextMetadata?:NetflixContextLabels;
  access: 'permission_required' | 'connecting' | 'ready';
  session: 'none' | 'active' | 'ambiguous';
  state?: 'playing' | 'paused' | 'buffering' | 'stopped' | 'error' | 'unknown';
  positionMs?: number | null;
  durationMs?: number | null;
  contentId?: string | null;
  identitySource?: string;
  displayMetadata?: NetflixDisplayLabels;
  queueEvidence?: NetflixQueueEvidence;
  mediaIdPresent?: boolean;
  mediaUriPresent?: boolean;
  canPlay?: boolean;
  canPause?: boolean;
  canSeek?: boolean;
};
export type NetflixTestResult = {
  command: MediaCommand;
  status: 'observed' | 'not_observed' | 'unavailable' | 'cancelled';
  reason: string;
  before?: NetflixSnapshot | null;
  after?: NetflixSnapshot | null;
};

export function netflixStatus(snapshot: NetflixSnapshot): string {
  if (snapshot.access === 'permission_required') return 'Netflix controls are off. Enable access below to test them.';
  if (snapshot.access === 'connecting') return 'Waiting for Android to connect the controls. Wait a moment, then refresh.';
  if (snapshot.session === 'ambiguous') return 'More than one Netflix player was found. Close extra Netflix playback and try again.';
  if (snapshot.session === 'none') return 'No Netflix player found. Start a movie in the Netflix app, then return to Orbit. If Netflix closes or resets during sign-in, resolve that in Netflix first; Orbit cannot sync until playback works.';
  const missing = [!snapshot.canPlay && 'play', !snapshot.canPause && 'pause', !snapshot.canSeek && 'seek',
    snapshot.positionMs == null && 'position', !snapshot.contentId && 'catalog ID'].filter(Boolean);
  return missing.length
    ? 'Netflix is visible, but these sync requirements are missing: ' + missing.join(', ') + '.'
    : 'Netflix reports the controls needed for sync. Run the tests below to check whether they work.';
}

export function netflixTestMessage(result: NetflixTestResult): string {
  if (result.status === 'cancelled') return 'Test cancelled. A command already sent cannot be undone.';
  if (result.status === 'observed') return 'Android reported the expected ' + result.command + ' change. Confirm that the movie changed too; this is a local test, not two-phone sync.';
  if (result.status === 'not_observed') return 'The command was sent, but Android did not report the expected change. Netflix control is not confirmed.';
  const reasons: Record<string, string> = {
    permission_required: 'Enable Netflix controls first.',
    connecting: 'Android has not connected the controls yet. Wait and try again.',
    no_session: 'Start a movie in Netflix before running the test.',
    ambiguous: 'Close extra Netflix playback before testing.',
    unsupported: 'Netflix does not report support for this command.',
    no_state: 'Netflix has not supplied its playback state.',
    wrong_state: result.command === 'play' ? 'Pause the movie in Netflix before testing play.' : 'Start playing the movie before testing pause or seek.',
    no_position: 'Netflix has not supplied a usable playback position.',
    near_end: 'Choose a position at least 15 seconds before the end of the movie.',
    session_changed: 'The Netflix player changed or disconnected. Reopen the movie and try again.',
    busy: 'Another test is still running.',
  };
  return reasons[result.reason] ?? 'The test could not run. Refresh the Netflix check and try again.';
}

export function formatPosition(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return 'Unavailable';
  const seconds = Math.floor(ms / 1000);
  return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
}

// Explicit allowlist: reports cannot accidentally include identities, tokens, titles,
// session handles, or notification content if the native snapshot changes later.
export function netflixReport(snapshot: NetflixSnapshot | null, result: NetflixTestResult | null, comparison: NetflixLabelComparison | null = null, recognition: NetflixRecognition | null = null): string {
  const describe = (value: NetflixSnapshot | null | undefined) => value ? {
    appBuild: value.appBuild ? {
      version: typeof value.appBuild.version==='string' && /^[0-9]{1,3}(?:\.[0-9]{1,3}){1,3}$/.test(value.appBuild.version)?value.appBuild.version:null,
      code: Number.isSafeInteger(value.appBuild.code) && value.appBuild.code!>0 && value.appBuild.code!<=2147483647?value.appBuild.code:null,
    }:null,
    contextEvidence: value.contextMetadata ? {albumPresent:value.contextMetadata.albumPresent===true,artistPresent:value.contextMetadata.artistPresent===true,albumArtistPresent:value.contextMetadata.albumArtistPresent===true,
      usableAlbumPresent:typeof value.contextMetadata.albumLabel==='string' && !!value.contextMetadata.albumLabel,
      usableArtistPresent:typeof value.contextMetadata.artistLabel==='string' && !!value.contextMetadata.artistLabel,
      usableAlbumArtistPresent:typeof value.contextMetadata.albumArtistLabel==='string' && !!value.contextMetadata.albumArtistLabel}:null,
    access: value.access, session: value.session, state: value.state,
    positionMs: value.positionMs, durationMs: value.durationMs,
    contentId: typeof value.contentId === 'string' && /^[1-9][0-9]{0,11}$/.test(value.contentId) ? value.contentId : null,
    identitySource: ['media_id', 'media_id_watch_url', 'media_uri_watch_url', 'matching_fields', 'conflicting_fields', 'unavailable'].includes(value.identitySource ?? '') ? value.identitySource : 'unavailable',
    mediaIdPresent: value.mediaIdPresent === true, mediaUriPresent: value.mediaUriPresent === true,
    queueEvidence: value.queueEvidence ? {
      status: ['no_active_item', 'active_item_changed', 'queue_unavailable', 'queue_too_large', 'active_item_missing',
        'ambiguous_active_item', 'conflicting_fields', 'metadata_conflict', 'no_canonical_identity', 'candidate', 'read_failed'].includes(value.queueEvidence.status ?? '') ? value.queueEvidence.status : 'unavailable',
      candidateContentId: value.queueEvidence.status === 'candidate' && typeof value.queueEvidence.candidateContentId === 'string' && /^[1-9][0-9]{0,11}$/.test(value.queueEvidence.candidateContentId) ? value.queueEvidence.candidateContentId : null,
      mediaIdPresent: value.queueEvidence.mediaIdPresent === true, mediaUriPresent: value.queueEvidence.mediaUriPresent === true,
    } : null,
    displayEvidence: value.displayMetadata ? {
      titleSource: ['display_title', 'title', 'unavailable'].includes(value.displayMetadata.titleSource ?? '') ? value.displayMetadata.titleSource : 'unavailable',
      titlePresent: value.displayMetadata.titlePresent === true, displayTitlePresent: value.displayMetadata.displayTitlePresent === true,
      subtitlePresent: value.displayMetadata.subtitlePresent === true, descriptionPresent: value.displayMetadata.descriptionPresent === true,
      usableTitleLabelPresent: typeof value.displayMetadata.titleLabel === 'string' && !!value.displayMetadata.titleLabel,
      usableStandardTitlePresent: typeof value.displayMetadata.standardTitleLabel === 'string' && !!value.displayMetadata.standardTitleLabel,
      standardTitleMatchesPrimary: typeof value.displayMetadata.standardTitleLabel === 'string' && !!value.displayMetadata.standardTitleLabel && typeof value.displayMetadata.titleLabel === 'string' && !!value.displayMetadata.titleLabel
        ? value.displayMetadata.standardTitleLabel === value.displayMetadata.titleLabel : null,
    } : null,
    canPlay: value.canPlay, canPause: value.canPause, canSeek: value.canSeek,
  } : null;
  return JSON.stringify({
    diagnostic: 'Orbit Netflix controls v4',
    catalogRecognition: recognition ? {
      status:['player_unavailable','unusable_observation','catalog_rejected','no_candidate','episode_candidate_only','ambiguous','context_conflict','context_supports_candidate'].includes(recognition.status)?recognition.status:'unavailable',
      catalogSeriesCount:Number.isSafeInteger(recognition.catalogSeriesCount) && recognition.catalogSeriesCount>=0 && recognition.catalogSeriesCount<=1000?recognition.catalogSeriesCount:null,
      catalogEpisodeCount:Number.isSafeInteger(recognition.catalogEpisodeCount) && recognition.catalogEpisodeCount>=0 && recognition.catalogEpisodeCount<=10000?recognition.catalogEpisodeCount:null,
      distinctContextPresent:recognition.distinctContextPresent===true,
      matchedContextSeriesCount:Number.isSafeInteger(recognition.matchedContextSeriesCount) && recognition.matchedContextSeriesCount>=0 && recognition.matchedContextSeriesCount<=1000?recognition.matchedContextSeriesCount:null,
      candidates:Array.isArray(recognition.candidates)?recognition.candidates.slice(0,100).filter(c=>c && typeof c==='object' && typeof c.seriesId==='string' && /^[1-9][0-9]{0,11}$/.test(c.seriesId) && typeof c.contentId==='string' && /^[1-9][0-9]{0,11}$/.test(c.contentId) && Number.isSafeInteger(c.season) && c.season>0 && c.season<1000 && Number.isSafeInteger(c.episode) && c.episode>0 && c.episode<10000).map(c=>({seriesId:c.seriesId,contentId:c.contentId,season:c.season,episode:c.episode})):[],
      identityVerified:false,commandsAllowed:false,
    }:null,
    automaticMovieIdentificationVerified: false,
    labelComparison: comparison ? { available: comparison.available === true, titleChanged: comparison.titleChanged === true, subtitleChanged: comparison.subtitleChanged === true, descriptionChanged: comparison.descriptionChanged === true, standardTitleChanged: comparison.standardTitleChanged === true } : null,
    automaticSyncVerified: false,
    snapshot: describe(snapshot),
    lastTest: result ? {
      command: result.command, status: result.status,
      // No raw exception or arbitrary native reason text in an exported report.
      message: netflixTestMessage(result),
      before: describe(result.before), after: describe(result.after),
    } : null,
  }, null, 2);
}
