import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {recognizeNetflixSnapshot} from '../src/netflixRecognition.ts';
const row={seriesId:'101',contentId:'201',season:1,episode:3,title:'Fictional episode',runtimeSec:60,sourceUrl:'https://www.netflix.com/title/101'};
const catalog={series:[{seriesId:'101',names:['Fictional series','Serie ficticia']}],episodes:[row]};
const snapshot={access:'ready',session:'active',state:'playing',contentId:null,durationMs:60000,displayMetadata:{titleLabel:'Fictional episode',subtitleLabel:'S1:E3 - Fictional episode'}};

test('missing, unauthorized, ambiguous and unavailable players yield no stale candidates',()=>{
 for(const value of [null,{...snapshot,access:'permission_required'},{...snapshot,session:'none'},{...snapshot,session:'ambiguous'},{...snapshot,state:'buffering'}]) {
  const result=recognizeNetflixSnapshot(value,catalog);assert.equal(result.status,'player_unavailable');assert.equal(result.candidates.length,0);assert.equal(result.commandsAllowed,false);
 }
});
test('automatic local episode matching never mutates the trusted native identity',()=>{
 const input=structuredClone(snapshot),result=recognizeNetflixSnapshot(input,catalog);
 assert.equal(result.status,'episode_candidate_only');assert.equal(result.candidates[0].contentId,'201');assert.deepEqual(input,snapshot);assert.equal(input.contentId,null);
 assert.equal(result.identityVerified,false);assert.equal(result.commandsAllowed,false);
});
test('a distinct provider context can support a candidate without authorizing sync',()=>{
 const result=recognizeNetflixSnapshot({...snapshot,contextMetadata:{albumLabel:'Serie ficticia'}},catalog);
 assert.equal(result.status,'context_supports_candidate');assert.equal(result.matchedContextSeriesCount,1);assert.equal(result.distinctContextPresent,true);assert.equal(result.identityVerified,false);assert.equal(result.commandsAllowed,false);
});
test('repeated episode labels never become independent series context',()=>{
 const result=recognizeNetflixSnapshot({...snapshot,displayMetadata:{...snapshot.displayMetadata,standardTitleLabel:'Fictional episode'},contextMetadata:{albumLabel:'Fictional episode',artistLabel:'S1:E3 - Fictional episode'}},catalog);
 assert.equal(result.status,'episode_candidate_only');assert.equal(result.distinctContextPresent,false);
});
test('contradictory known context is reported instead of silently selecting the episode match',()=>{
 const data={...catalog,series:[...catalog.series,{seriesId:'102',names:['Other series']}]};
 assert.equal(recognizeNetflixSnapshot({...snapshot,contextMetadata:{albumLabel:'Other series'}},data).status,'context_conflict');
 assert.equal(recognizeNetflixSnapshot({...snapshot,contextMetadata:{albumLabel:'Other series',artistLabel:'Fictional series'}},data).status,'ambiguous');
});
test('episode collisions remain ambiguous even when one context label appears to fit',()=>{
 const data={...catalog,episodes:[row,{...row,seriesId:'102',contentId:'202',sourceUrl:'https://www.netflix.com/title/102'}]};
 const result=recognizeNetflixSnapshot({...snapshot,contextMetadata:{albumLabel:'Fictional series'}},data);
 assert.equal(result.status,'ambiguous');assert.equal(result.candidates.length,2);assert.equal(result.commandsAllowed,false);
});
test('localized catalog duplicates are deduplicated by actual public IDs',()=>{
 const result=recognizeNetflixSnapshot({...snapshot,contextMetadata:{artistLabel:'serie ficticia'}},{...catalog,episodes:[row,{...row,sourceUrl:'https://www.netflix.com/mx/title/101'}]});
 assert.equal(result.catalogEpisodeCount,1);assert.equal(result.candidates.length,1);assert.equal(result.status,'context_supports_candidate');
});
test('new episodes replace old candidates and unsupported observations clear them',()=>{
 const data={...catalog,episodes:[row,{...row,contentId:'203',episode:4,title:'Next episode'}]};
 assert.equal(recognizeNetflixSnapshot(snapshot,data).candidates[0].contentId,'201');
 assert.equal(recognizeNetflixSnapshot({...snapshot,displayMetadata:{titleLabel:'Next episode',subtitleLabel:'S1:E4 - Next episode'}},data).candidates[0].contentId,'203');
 assert.equal(recognizeNetflixSnapshot({...snapshot,displayMetadata:{titleLabel:'Unknown',subtitleLabel:'S1:E4 - Unknown'}},data).candidates.length,0);
});
test('bundled reference catalogs retain explicit limited coverage and support all supplied localized records',()=>{
 const data=JSON.parse(fs.readFileSync(new URL('../src/data/netflix-reference-catalog.json',import.meta.url),'utf8'));
 assert.equal(data.coverage,'development_references_only');assert.equal(data.series.length,2);assert.equal(new Set(data.episodes.map(e=>e.contentId)).size,72);
 for(const episode of data.episodes){const result=recognizeNetflixSnapshot({...snapshot,durationMs:episode.runtimeSec*1000,displayMetadata:{titleLabel:episode.title,subtitleLabel:'S'+episode.season+':E'+episode.episode+' - '+episode.title}},data);assert.ok(result.candidates.some(c=>c.contentId===episode.contentId));assert.equal(result.identityVerified,false);assert.equal(result.commandsAllowed,false);}
});
test('unsupported formats and out-of-coverage content do not acquire guessed IDs',()=>{
 assert.equal(recognizeNetflixSnapshot({...snapshot,displayMetadata:{titleLabel:'Unknown',subtitleLabel:'T1:E3 - Unknown'}},catalog).status,'unusable_observation');
 assert.equal(recognizeNetflixSnapshot({...snapshot,durationMs:61000},catalog).status,'no_candidate');
});
