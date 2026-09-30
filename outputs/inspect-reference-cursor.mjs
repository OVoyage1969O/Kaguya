const html = await (await fetch('https://lqq.ai/')).text();
const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map(match=>match[1]);
for (const url of scripts) {
  const source = await (await fetch(new URL(url,'https://lqq.ai/'))).text();
  const index = source.indexOf('goo-cursor-canvas');
  if (index >= 0) { const start=source.indexOf('Cursor:function');console.log(url,source.slice(start,start+7000)); }
}
