/** Public catalog matching is candidate evidence, never authorization to control a player. */
export type PublicNetflixEpisode = { seriesId: string; contentId: string; season: number; episode: number; title: string; runtimeSec: number; sourceUrl: string };
export type EpisodeObservation = { titleLabel?: string | null; subtitleLabel?: string | null; durationMs?: number | null };
const clean = (value: unknown): string | null => typeof value === 'string' && value.length>0 && value.length<=512 && !/[\p{Cc}\p{Cf}]/u.test(value)
  ? value.normalize('NFC').trim().replace(/\s+/g,' ').toLowerCase() : null;
const id = (value: unknown): value is string => typeof value==='string' && /^[1-9][0-9]{0,11}$/.test(value);
export function observedNetflixEpisode(value: EpisodeObservation) {
  const title=clean(value.titleLabel), subtitle=clean(value.subtitleLabel), duration=value.durationMs;
  if(!title || !subtitle || typeof duration!=='number' || !Number.isSafeInteger(duration) || duration<=0 || duration>86400000 || duration%1000!==0) return null;
  // Only the actually observed S1:E3 - title syntax is supported; no fuzzy localization guesses.
  const match=/^s([1-9][0-9]{0,2}):e([1-9][0-9]{0,3}) - (.+)$/.exec(subtitle);
  if(!match || clean(match[3])!==title) return null;
  return {season:Number(match[1]),episode:Number(match[2]),title,runtimeSec:duration/1000};
}
export function matchNetflixCatalog(observation: EpisodeObservation, records: PublicNetflixEpisode[]) {
  const hint=observedNetflixEpisode(observation);
  const result=(status: 'unusable_observation' | 'catalog_rejected' | 'no_candidate' | 'catalog_candidate' | 'ambiguous', candidates: {seriesId:string;contentId:string;season:number;episode:number}[]=[]) =>
    ({status,candidates,identityVerified:false as const,commandsAllowed:false as const});
  if(!hint) return result('unusable_observation');
  if(!Array.isArray(records) || records.length>10000) return result('catalog_rejected');
  const candidates=new Map<string,{seriesId:string;contentId:string;season:number;episode:number}>();
  for(const record of records) {
    if(!record || !id(record.seriesId) || !id(record.contentId) || !Number.isSafeInteger(record.season) || record.season<1 || record.season>999 || !Number.isSafeInteger(record.episode) || record.episode<1 || record.episode>9999 || !Number.isSafeInteger(record.runtimeSec) || record.runtimeSec<1 || record.runtimeSec>86400 || !clean(record.title)) return result('catalog_rejected');
    try {
      const url=new URL(record.sourceUrl);
      if(url.protocol!=='https:' || !['netflix.com','www.netflix.com'].includes(url.hostname) || url.username || url.password || url.port || url.search || url.hash || !new RegExp('^/(?:[a-z]{2}(?:-[a-z]{2})?/)?title/'+record.seriesId+'$').test(url.pathname)) return result('catalog_rejected');
    } catch { return result('catalog_rejected'); }
    if(record.season===hint.season && record.episode===hint.episode && clean(record.title)===hint.title && record.runtimeSec===hint.runtimeSec) {
      candidates.set(record.seriesId+':'+record.contentId,{seriesId:record.seriesId,contentId:record.contentId,season:record.season,episode:record.episode});
      if(candidates.size>100) return result('catalog_rejected');
    }
  }
  return result(candidates.size>1?'ambiguous':candidates.size===1?'catalog_candidate':'no_candidate',[...candidates.values()]);
}
