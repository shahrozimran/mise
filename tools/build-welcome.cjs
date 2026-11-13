const {buildSync}=require('esbuild');
const fs=require('node:fs');
const path=require('node:path');
const mobile=path.resolve(__dirname,'../apps/mobile');
const result=buildSync({entryPoints:[path.join(__dirname,'welcome-scene.js')],bundle:true,minify:true,write:false,format:'iife',nodePaths:[path.join(mobile,'node_modules'),path.resolve(__dirname,'../node_modules')],legalComments:'inline'});
const html=`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;height:100%;overflow:hidden;background:#edf2e7}canvas{display:block}#fallback{display:none;place-items:center;height:100%;font-size:100px}</style></head><body><canvas></canvas><div id="fallback">🌿</div><script>${result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')}</script></body></html>`;
fs.writeFileSync(path.join(mobile,'src/data/welcome-html.json'),JSON.stringify(html));
