import {matchNetflixCatalog} from './netflixCatalog.ts';
import type {PublicNetflixEpisode} from './netflixCatalog';
import type {NetflixSnapshot} from './netflixDiagnostics';
export type ReferenceCatalog = {series:{seriesId:string;names:string[]}[];episodes:PublicNetflixEpisode[]};
export type RecognitionStatus = 'player_unavailable' | 'unusable_observation' | 'catalog_rejected' | 'no_candidate' | 'episode_candidate_only' | 'ambiguous' | 'context_conflict' | 'context_supports_candidate';
export type NetflixRecognition = {status:RecognitionStatus;candidates:{seriesId:string;contentId:string;season:number;episode:number}[];catalogSeriesCount:number;catalogEpisodeCount:number;distinctContextPresent:boolean;matchedContextSeriesCount:number;identityVerified:false;commandsAllowed:false};
const normalized=(value:unknown):string|null=>typeof value==='string' && value.length>0 && value.length<=512 && !/[\p{Cc}\p{Cf}]/u.test(value)?value.normalize('NFC').trim().replace(/\s+/g,' ').toLowerCase():null;
export function recognizeNetflixSnapshot(snapshot:NetflixSnapshot|null,catalog:ReferenceCatalog):NetflixRecognition {
  const catalogSeriesCount=catalog.series.length,catalogEpisodeCount=new Set(catalog.episodes.map(e=>e.contentId)).size;
  const result=(status:RecognitionStatus,candidates:NetflixRecognition['candidates']=[],distinctContextPresent=false,matchedContextSeriesCount=0):NetflixRecognition=>({status,candidates,catalogSeriesCount,catalogEpisodeCount,distinctContextPresent,matchedContextSeriesCount,identityVerified:false,commandsAllowed:false});
  if(!snapshot || snapshot.access!=='ready' || snapshot.session!=='active' || !['playing','paused'].includes(snapshot.state??'')) return result('player_unavailable');
  const labels=snapshot.displayMetadata;
  const match=matchNetflixCatalog({titleLabel:labels?.titleLabel,subtitleLabel:labels?.subtitleLabel,durationMs:snapshot.durationMs},catalog.episodes);
  if(match.status==='unusable_observation' || match.status==='catalog_rejected' || match.status==='no_candidate')return result(match.status);
  const excluded=new Set([normalized(labels?.titleLabel),normalized(labels?.subtitleLabel)]);
  const context=[snapshot.contextMetadata?.albumLabel,snapshot.contextMetadata?.artistLabel,snapshot.contextMetadata?.albumArtistLabel,labels?.standardTitleLabel].map(normalized).filter((s):s is string=>!!s && !excluded.has(s));
  const known=new Set(catalog.series.filter(s=>s.names.some(name=>context.includes(normalized(name)??''))).map(s=>s.seriesId));
  if(known.size>1 || match.status==='ambiguous')return result('ambiguous',match.candidates,context.length>0,known.size);
  if(known.size===1 && !known.has(match.candidates[0].seriesId))return result('context_conflict',match.candidates,true,1);
  return result(known.size===1?'context_supports_candidate':'episode_candidate_only',match.candidates,context.length>0,known.size);
}
