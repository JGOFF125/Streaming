import fs from 'node:fs/promises';
// Deliberately small development coverage; never a global provider index or user history.
const ids=['80997085','80057281'],locales=['mx','ca'];
const series=[],episodes=[],consistent=new Map(),seenRows=new Set(),sources=[];
for(const seriesId of ids) {
  const names=new Set();
  for(const locale of locales) {
    const file='.expo/catalog-evidence/public-catalog-'+seriesId+'-'+locale+'.json';
    const data=JSON.parse(await fs.readFile(file,'utf8'));
    if(data.seriesId!==seriesId || data.sourceUrl!=='https://www.netflix.com/'+locale+'/title/'+seriesId || !data.completeWithinSeries || data.authenticatedRequest!==false || data.cookieJarUsed!==false || data.htmlPersisted!==false || typeof data.seriesTitle!=='string' || !data.seriesTitle || data.seriesTitle.length>512 || !Array.isArray(data.episodes) || data.episodes.length>1000)throw Error('Reference catalog provenance is incomplete.');
    names.add(data.seriesTitle);sources.push({url:data.sourceUrl,reviewedAt:data.reviewedAt});
    for(const row of data.episodes) {
      if(row.seriesId!==seriesId || row.sourceUrl!==data.sourceUrl || !/^[1-9][0-9]{0,11}$/.test(row.contentId) || !Number.isSafeInteger(row.season) || row.season<1 || !Number.isSafeInteger(row.episode) || row.episode<1 || !Number.isSafeInteger(row.runtimeSec) || row.runtimeSec<1 || row.runtimeSec>86400 || typeof row.title!=='string' || !row.title || row.title.length>512)throw Error('Invalid public reference episode.');
      const core=seriesId+':'+row.season+':'+row.episode+':'+row.runtimeSec;
      if(consistent.has(row.contentId) && consistent.get(row.contentId)!==core)throw Error('Reference locales disagree on episode identity or duration.');
      consistent.set(row.contentId,core);
      const key=row.contentId+':'+locale;
      if(seenRows.has(key))throw Error('Duplicate reference episode.');seenRows.add(key);
      episodes.push({seriesId,contentId:row.contentId,season:row.season,episode:row.episode,title:row.title,runtimeSec:row.runtimeSec,sourceUrl:row.sourceUrl});
    }
  }
  series.push({seriesId,names:[...names]});
}
const output={coverage:'development_references_only',generatedAt:new Date().toISOString(),sources,series,episodes};
await fs.mkdir('src/data',{recursive:true});await fs.writeFile('src/data/netflix-reference-catalog.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({seriesCount:series.length,uniqueEpisodeCount:consistent.size,localizedRecordCount:episodes.length,scope:output.coverage}));
