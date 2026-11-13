// Rasterize the repo-native vector mark for Android launcher assets.
const { Resvg } = require('@resvg/resvg-js');
const fs = require('node:fs');
const path = require('node:path');
const projectRoot = path.resolve(__dirname, '../apps/mobile');
(async () => {
  const svg = fs.readFileSync(path.join(projectRoot, 'assets/mise-mark.svg'), 'utf8');
  for (const [name, backgroundColor] of [['mise-icon.png', '#194C3C'], ['mise-foreground.png', 'transparent']]) {
    const image = new Resvg(svg, { fitTo: { mode: 'width', value: 1024 }, background: backgroundColor === 'transparent' ? undefined : backgroundColor });
    fs.writeFileSync(path.join(projectRoot, 'assets', name), image.render().asPng());
  }
  console.log('Rendered Mise launcher assets.');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
