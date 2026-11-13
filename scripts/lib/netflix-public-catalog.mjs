import ts from 'typescript';

const invalid = () => new Error('Unsupported public Netflix catalog representation.');
// Parse syntax only. No eval, VM, site-script execution, account object or playback endpoint.
function container(text, start) {
  const stack=[]; let quoted=false, escaped=false;
  for(let i=start;i<text.length && i-start<524288;i++) {
    const c=text[i];
    if(quoted) { if(escaped) escaped=false; else if(c==='\\') escaped=true; else if(c==='"') quoted=false; continue; }
    if(c==='"') quoted=true;
    else if(c==='{' || c==='[') { stack.push(c); if(stack.length>64) throw invalid(); }
    else if(c==='}' || c===']') {
      const opening=stack.pop();
      if(opening!==(c==='}'?'{':'[')) throw invalid();
      if(!stack.length) return text.slice(start,i+1);
    }
  }
  throw invalid();
}
function fields(node) {
  if(node && ts.isParenthesizedExpression(node)) node=node.expression;
  if(!node || !ts.isObjectLiteralExpression(node) || node.properties.length>128) throw invalid();
  const map=new Map();
  for(const property of node.properties) {
    if(!ts.isPropertyAssignment(property) || !(ts.isIdentifier(property.name) || ts.isStringLiteral(property.name))) throw invalid();
    const key=property.name.text;
    if(map.has(key) || ['__proto__','constructor','prototype'].includes(key)) throw invalid();
    map.set(key,property.initializer);
  }
  return map;
}
const string = node => { if(!node || !ts.isStringLiteral(node)) throw invalid(); return node.text; };
const number = node => { if(!node || !ts.isNumericLiteral(node) || !/^[0-9]+$/.test(node.text)) throw invalid(); const value=Number(node.text); if(!Number.isSafeInteger(value)) throw invalid(); return value; };
const id = node => { const value=node && ts.isStringLiteral(node)?node.text:String(number(node)); if(!/^[1-9][0-9]{0,11}$/.test(value)) throw invalid(); return value; };
function connection(node,type) {
  const map=fields(node);
  if(string(map.get('__typename'))!==type) throw invalid();
  const page=fields(map.get('pageInfo'));
  if(page.get('hasNextPage')?.kind!==ts.SyntaxKind.FalseKeyword) throw invalid();
  const edges=map.get('edges');
  if(!edges || !ts.isArrayLiteralExpression(edges) || edges.elements.length>1000) throw invalid();
  if(map.has('totalCount') && number(map.get('totalCount'))!==edges.elements.length) throw invalid();
  return edges.elements.map(edge=>fields(fields(edge).get('node')));
}
function seasonNumber(season) {
  const parse=value=>/^(?:Season|Temporada) ([1-9][0-9]{0,2})$/.exec(value);
  const explicit=parse(string(season.get('numberLabelV2')));
  if(!explicit) throw invalid();
  const number=Number(explicit[1]);
  // Descriptive season names are not numbering. Refuse only a conflicting explicit number.
  for(const key of ['shortTitle','title']) if(season.has(key)) {
    const label=parse(string(season.get(key)));
    if(label && Number(label[1])!==number) throw invalid();
  }
  return number;
}

export function parsePublicNetflixEpisodes(html,sourceUrl,seriesId) {
  if(typeof html!=='string' || html.length>8388608 || !/^[1-9][0-9]{0,11}$/.test(seriesId)) throw invalid();
  const url=new URL(sourceUrl);
  if(url.protocol!=='https:' || !['netflix.com','www.netflix.com'].includes(url.hostname) || url.username || url.password || url.port || url.search || url.hash || !new RegExp('^/(?:[a-z]{2}(?:-[a-z]{2})?/)?title/'+seriesId+'$').test(url.pathname)) throw invalid();
  const matches=[...html.matchAll(/"seasons"\s*:\s*/g)].filter(m=>html[m.index-1]!=='\\');
  if(matches.length!==1) throw invalid();
  const match=matches[0];
  const literal=container(html,match.index+match[0].length);
  const syntax=ts.createSourceFile('public-catalog.ts','const catalog = ('+literal+');',ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  if(syntax.parseDiagnostics.length || syntax.statements.length!==1) throw invalid();
  const root=syntax.statements[0]?.declarationList?.declarations[0]?.initializer;
  const seasons=connection(root,'SeasonsConnection');
  if(!seasons.length || seasons.length>100) throw invalid();
  const episodes=[]; const seenSeasons=new Set(), seenIds=new Set(), seenNumbers=new Set();
  for(const season of seasons) {
    if(string(season.get('__typename'))!=='Season') throw invalid();
    const seasonIndex=seasonNumber(season);
    if(seenSeasons.has(seasonIndex)) throw invalid(); seenSeasons.add(seasonIndex);
    for(const episode of connection(season.get('episodes'),'EpisodesConnection')) {
      if(string(episode.get('__typename'))!=='Episode') throw invalid();
      const contentId=id(episode.get('videoId')), episodeIndex=number(episode.get('number')), runtimeSec=number(episode.get('runtimeSec'));
      const title=string(episode.get('title')).normalize('NFC').trim();
      if(!title || title.length>512 || /[\p{Cc}\p{Cf}]/u.test(title) || episodeIndex<1 || episodeIndex>10000 || runtimeSec<1 || runtimeSec>86400 || seenIds.has(contentId) || seenNumbers.has(seasonIndex+':'+episodeIndex)) throw invalid();
      seenIds.add(contentId); seenNumbers.add(seasonIndex+':'+episodeIndex);
      episodes.push({seriesId,contentId,season:seasonIndex,episode:episodeIndex,title,runtimeSec,sourceUrl:url.href});
      if(episodes.length>10000) throw invalid();
    }
  }
  const names=new Set();
  for(const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data; try { data=JSON.parse(match[1]); } catch { continue; }
    for(const entry of Array.isArray(data)?data:[data]) {
      if(entry?.['@type']!=='TVSeries' || typeof entry.name!=='string' || typeof entry.url!=='string') continue;
      let link; try { link=new URL(entry.url); } catch { continue; }
      if(link.protocol==='https:' && ['netflix.com','www.netflix.com'].includes(link.hostname) && !link.username && !link.password && !link.port && !link.search && !link.hash && new RegExp('^/(?:[a-z]{2}(?:-[a-z]{2})?/)?title/'+seriesId+'$').test(link.pathname)) {
        const name=entry.name.normalize('NFC').trim();
        if(name && name.length<=512 && !/[\p{Cc}\p{Cf}]/u.test(name)) names.add(name);
      }
    }
  }
  return {seriesId,seriesTitle:names.size===1?[...names][0]:null,sourceUrl:url.href,seasonCount:seasons.length,completeWithinSeries:true,episodes};
}
