import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parsePublicNetflixEpisodes} from '../scripts/lib/netflix-public-catalog.mjs';
import {observedNetflixEpisode,matchNetflixCatalog} from '../src/netflixCatalog.ts';
const sourceUrl='https://www.netflix.com/mx/title/101';
const episode=(id='201',number=1,title='Fictional episode',runtimeSec=60)=>({__typename:'Episode',videoId:id,number,title,runtimeSec,shortSynopsis:'ignored'});
const season=(number=1,items=[episode()])=>({__typename:'Season',numberLabelV2:'Temporada '+number,shortTitle:'Temporada '+number,title:'Temporada '+number,videoId:'301',episodes:{__typename:'EpisodesConnection',edges:items.map(node=>({node})),pageInfo:{hasNextPage:false}}});
const document=items=>'<script>window.account={privateValue:"private_account_value"};window.catalog={"seasons":'+JSON.stringify({__typename:'SeasonsConnection',edges:items.map(node=>({node})),pageInfo:{hasNextPage:false},totalCount:items.length})+'};</script>';
const parse=html=>parsePublicNetflixEpisodes(html,sourceUrl,'101');
const record={seriesId:'101',contentId:'201',season:1,episode:3,title:'Fictional episode',runtimeSec:60,sourceUrl};
const observation={titleLabel:'Fictional episode',subtitleLabel:'S1:E3 - Fictional episode',durationMs:60000};

test('public reader extracts literal catalog fields without retaining unrelated data',()=>{
 const result=parse(document([season(2,[episode('202',1,'Other episode')]),season(1)]));
 assert.equal(result.seasonCount,2);assert.equal(result.episodes.length,2);assert.equal(result.episodes[0].season,2);
 assert.equal(result.episodes[0].contentId,'202');assert.equal(result.completeWithinSeries,true);
 assert.doesNotMatch(JSON.stringify(result),/private_account_value|shortSynopsis|privateValue/);
});

test('JavaScript escaped strings are parsed as syntax without executing scripts',()=>{
 const html=document([season(1,[episode('201',1,'Café & moon')])]).replace('Café & moon','Caf\\u00e9 \\x26 moon');
 assert.throws(()=>JSON.parse('{"title":"Caf\\u00e9 \\x26 moon"}'));
 assert.equal(parse(html).episodes[0].title,'Café & moon');
});

test('critical executable expressions and getters are rejected and never run',()=>{
 delete globalThis.__orbitCatalogExecuted;
 const html=document([season()]).replace('"title":"Fictional episode"','"title":(globalThis.__orbitCatalogExecuted=true,"Bad")');
 assert.throws(()=>parse(html),/Unsupported public/);assert.equal(globalThis.__orbitCatalogExecuted,undefined);
 const getter=document([season()]).replace('"title":"Fictional episode"','get title(){globalThis.__orbitCatalogExecuted=true;return "Bad"}');
 assert.throws(()=>parse(getter),/Unsupported public/);assert.equal(globalThis.__orbitCatalogExecuted,undefined);
});

test('reader refuses incomplete connections, count conflicts and missing schema',()=>{
 assert.throws(()=>parse(document([season()]).replaceAll('"hasNextPage":false','"hasNextPage":true')));
 assert.throws(()=>parse(document([season()]).replace('"totalCount":1','"totalCount":2')));
 assert.throws(()=>parse(document([season()]).replace('SeasonsConnection','UnknownConnection')));
 assert.throws(()=>parse('<html>No catalog</html>'));
});

test('reader refuses contradictory season numbering and duplicate item identities',()=>{
 const conflict=season();conflict.shortTitle='Temporada 2';assert.throws(()=>parse(document([conflict])));
 assert.throws(()=>parse(document([season(1,[episode(),episode()])])));
 assert.throws(()=>parse(document([season(1),season(1,[episode('202')])])));
 assert.throws(()=>parse(document([season(1),season(2)])));
 const duplicate=document([season()]).replace('"videoId":"201"','"videoId":"201","videoId":"202"');assert.throws(()=>parse(duplicate));
});

test('public catalog source is constrained to the corresponding canonical title page',()=>{
 for(const url of ['https://netflix.com.evil.test/title/101','https://secret@www.netflix.com/title/101','https://www.netflix.com/title/102','https://www.netflix.com/watch/101','https://www.netflix.com/title/101?token=secret','http://www.netflix.com/title/101']) assert.throws(()=>parsePublicNetflixEpisodes(document([season()]),url,'101'));
 assert.throws(()=>parse('x'.repeat(8388609)));
 assert.throws(()=>parse(document([season()]).slice(0,-70)));
});

test('observed episode parser supports actual tested syntax and refuses contradictions',()=>{
 assert.deepEqual(observedNetflixEpisode(observation),{season:1,episode:3,title:'fictional episode',runtimeSec:60});
 assert.equal(observedNetflixEpisode({...observation,titleLabel:'Other title'}),null);
 for(const subtitleLabel of ['S0:E3 - Fictional episode','S1:E0 - Fictional episode','S1:E3','T1:E3 - Fictional episode','S1:E3 - Fictional episode extra']) assert.equal(observedNetflixEpisode({...observation,subtitleLabel}),null);
 for(const durationMs of [null,undefined,NaN,Infinity,0,-1,60001]) assert.equal(observedNetflixEpisode({...observation,durationMs}),null);
 assert.equal(observedNetflixEpisode({...observation,titleLabel:'x'.repeat(513)}),null);
});

test('even a single full catalog match remains an unverified candidate',()=>{
 const result=matchNetflixCatalog(observation,[record]);
 assert.equal(result.status,'catalog_candidate');assert.equal(result.identityVerified,false);assert.equal(result.commandsAllowed,false);
 assert.deepEqual(result.candidates,[{seriesId:'101',contentId:'201',season:1,episode:3}]);
 assert.doesNotMatch(JSON.stringify(result),/Fictional|titleLabel|sourceUrl/);
});

test('cross-series collisions return ambiguity instead of authorizing the first match',()=>{
 const other={...record,seriesId:'102',contentId:'202',sourceUrl:'https://www.netflix.com/title/102'};
 const result=matchNetflixCatalog(observation,[record,other]);
 assert.equal(result.status,'ambiguous');assert.equal(result.candidates.length,2);assert.equal(result.commandsAllowed,false);
 assert.equal(matchNetflixCatalog(observation,[record,record]).candidates.length,1);
});

test('title, numbering and exact duration constrain matches without fuzzy guesses',()=>{
 for(const delta of [{title:'Different episode'},{season:2},{episode:4},{runtimeSec:61}]) assert.equal(matchNetflixCatalog(observation,[{...record,...delta}]).status,'no_candidate');
 assert.equal(matchNetflixCatalog({...observation,titleLabel:'Café',subtitleLabel:'S1:E3 - Café'},[{...record,title:'Café'}]).status,'catalog_candidate');
});

test('malformed catalog data and unsupported observations fail closed',()=>{
 assert.equal(matchNetflixCatalog({},[record]).status,'unusable_observation');
 for(const delta of [{seriesId:'00101'},{contentId:'opaque'},{runtimeSec:NaN},{season:0},{sourceUrl:'https://evil.test/title/101'},{sourceUrl:'https://www.netflix.com/title/999'}]) assert.equal(matchNetflixCatalog(observation,[{...record,...delta}]).status,'catalog_rejected');
 assert.equal(matchNetflixCatalog(observation,Array(10001).fill(record)).status,'catalog_rejected');
});


test('descriptive season names do not override explicit season numbering',()=>{
 const named=season();named.title='Fictional series';named.shortTitle='A descriptive season';
 assert.equal(parse(document([named])).episodes[0].season,1);
 named.numberLabelV2='A descriptive season';assert.throws(()=>parse(document([named])));
});
