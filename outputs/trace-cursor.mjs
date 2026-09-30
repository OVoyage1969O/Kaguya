import sharp from 'sharp';
const {data,info}=await sharp('C:/Users/Lenovo/AppData/Local/Temp/codex-clipboard-2647a9b8-d203-4a1b-a760-4915bc319a48.png').raw().toBuffer({resolveWithObject:true});
const {width:w,height:h,channels:c}=info;
const filled=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&data[(y*w+x)*c+1]<210;
const edges=new Map();
const edge=(x,y,a,b)=>edges.set(`${x},${y}`,[a,b]);
for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(filled(x,y)){
 if(!filled(x,y-1))edge(x,y,x+1,y);
 if(!filled(x+1,y))edge(x+1,y,x+1,y+1);
 if(!filled(x,y+1))edge(x+1,y+1,x,y+1);
 if(!filled(x-1,y))edge(x,y+1,x,y);
}
const start=edges.keys().next().value;
let key=start;const points=[];
do {points.push(key.split(',').map(Number));const next=edges.get(key);if(!next)break;key=next.join(',');}while(key!==start&&points.length<10000);
function simplify(p){if(p.length<3)return p;const [a,b]=[p[0],p.at(-1)];let max=0,index=0;
 for(let i=1;i<p.length-1;i++){const dx=b[0]-a[0],dy=b[1]-a[1];const d=Math.abs(dy*p[i][0]-dx*p[i][1]+b[0]*a[1]-b[1]*a[0])/Math.max(1,Math.hypot(dx,dy));if(d>max){max=d;index=i;}}
 return max>1?simplify(p.slice(0,index+1)).slice(0,-1).concat(simplify(p.slice(index))):[a,b];}
const outline=simplify(points);
console.log(`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 ${w} ${h}"><path fill="#d97757" d="M${outline.map(p=>p.join(' ')).join('L')}Z"/></svg>`);
