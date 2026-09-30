const fs=require('fs');
const path=require('path');
const bookmarks=JSON.parse(fs.readFileSync(path.join(process.env.LOCALAPPDATA,'Google/Chrome/User Data/Default/AccountBookmarks'),'utf8'));
const folders=[];
function find(node,parents=[]){
 if(node.type==='folder'&&node.name.toLowerCase()==='study')folders.push({node,path:[...parents,node.name]});
 for(const child of node.children||[])find(child,[...parents,node.name]);
}
Object.values(bookmarks.roots).forEach(root=>find(root));
if(folders.length!==1)throw Error(`Expected one Study folder, found ${folders.length}`);
const links=[];
function flatten(node,folders=[]){
 for(const child of node.children||[]){
  if(child.type==='folder')flatten(child,[...folders,child.name]);
  else if(child.type==='url')links.push({name:child.name,url:child.url,folders});
 }
}
flatten(folders[0].node);
const config=fs.readFileSync('src/config/collectionsApiConfig.ts','utf8');
const existingUrls=[...config.matchAll(/\burl:\s*"([^"]+)"/g)].map(match=>match[1]);
if(process.argv.includes('--prepare')){
 const clean=source=>{const u=new URL(source);for(const key of [...u.searchParams.keys()])if(/^utm_/i.test(key)||['share_source','share_medium','bbid','ts','spm_id_from'].includes(key))u.searchParams.delete(key);return u.href;};
 const canonical=source=>{const u=new URL(clean(source));return `${u.protocol}//${u.hostname.toLowerCase()}${u.port?':'+u.port:''}${u.pathname.replace(/\/$/,'')}${u.search}${u.hash}`;};
 const seen=new Set(existingUrls.map(canonical));const rows=[];const skips={duplicate:0,unsupported:0,credentials:0};let cleaned=0;
 for(const link of links){
  let u;try{u=new URL(link.url);}catch{skips.unsupported++;continue;}
  if(!['http:','https:'].includes(u.protocol)){skips.unsupported++;continue;}
  if(u.username||u.password||[...u.searchParams.keys()].some(key=>/^(token|access_token|refresh_token|authkey|password|api_key|apikey|sessionid|session_token)$/i.test(key))){skips.credentials++;continue;}
  const href=clean(link.url);if(href!==u.href)cleaned++;
  const key=canonical(href);if(seen.has(key)){skips.duplicate++;continue;}seen.add(key);
  rows.push({name:link.name.trim()||u.hostname,url:href,description:link.folders.length?'书签分类：'+link.folders.join(' / '):'收藏于 Study 的学习资源。',icon:`https://favicon.im/${u.hostname}`,enabled:true});
 }
 const offset=Number(process.argv[process.argv.indexOf('--offset')+1])||0;
 console.log(JSON.stringify({stats:{source:links.length,imported:rows.length,skips,cleaned},rows:rows.slice(offset,offset+60)}));
}else console.log(JSON.stringify({path:folders[0].path,links,existingUrls}));
