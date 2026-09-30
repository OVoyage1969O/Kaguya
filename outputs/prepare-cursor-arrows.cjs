const fs=require('fs');
const icons=require('@iconify-json/material-symbols/icons.json').icons;
const name=process.argv[2];
const file=`public/assets/cursor-${name}.svg`;
const old=fs.readFileSync(file,'utf8').trim();
const arrow=icons['arrow-selector-tool-rounded'].body.replace('fill="currentColor"','fill="#faf9f5" stroke="#3d3029" stroke-width="1.5" stroke-linejoin="round"');
const layer=old.replace('<svg ','<svg x="8" y="8" ');
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">${layer}<g transform="translate(-3 -1)">${arrow}</g></svg>`;
console.log(JSON.stringify({file,old,svg}));
