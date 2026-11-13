import fs from 'node:fs/promises';
import { parsePublicNetflixEpisodes } from './lib/netflix-public-catalog.mjs';
const input=process.argv[2];
let url; try { url=new URL(input); } catch { throw Error('Provide one official Netflix title URL.'); }
const path=/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?title\/([1-9][0-9]{0,11})$/.exec(url.pathname);
if(process.argv.length!==3 || !path || url.protocol!=='https:' || url.hostname!=='www.netflix.com' || url.username || url.password || url.port || url.search || url.hash) throw Error('Only a canonical www.netflix.com title URL is accepted.');
const response=await fetch(url,{redirect:'error',headers:{Accept:'text/html'},signal:AbortSignal.timeout(20000)});
if(!response.ok) throw Error('The public catalog request failed.');
const reader=response.body.getReader();const chunks=[];let size=0;
for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>8388608){await reader.cancel();throw Error('Public catalog response exceeds inspection bound.');}chunks.push(value);}
const catalog=parsePublicNetflixEpisodes(Buffer.concat(chunks).toString('utf8'),url.href,path[1]);
const folder='.expo/catalog-evidence';await fs.mkdir(folder,{recursive:true});
const output=folder+'/public-catalog-'+path[1]+'-'+(url.pathname.split('/').length===4?url.pathname.split('/')[1]:'default')+'.json';
await fs.writeFile(output,JSON.stringify({reviewedAt:new Date().toISOString(),authenticatedRequest:false,cookieJarUsed:false,htmlPersisted:false,...catalog},null,2));
console.log(JSON.stringify({sourceUrl:url.href,seasonCount:catalog.seasonCount,episodeCount:catalog.episodes.length,completeWithinSeries:catalog.completeWithinSeries,privateOutput:output,identityVerified:false}));
