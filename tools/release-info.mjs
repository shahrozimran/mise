import { readFileSync, appendFileSync } from 'node:fs';

const tag = process.env.RELEASE_TAG ?? '';
const { expo } = JSON.parse(readFileSync(new URL('../apps/mobile/app.json', import.meta.url), 'utf8'));
if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag))
  throw new Error('Release tags must look like v0.2.0.');
if (tag !== `v${expo.version}`)
  throw new Error(`Tag ${tag} must match apps/mobile/app.json version v${expo.version}.`);
if (!Number.isInteger(expo.android.versionCode) || expo.android.versionCode < 1)
  throw new Error('Set a positive integer Android versionCode before releasing.');
if (process.env.GITHUB_OUTPUT)
  appendFileSync(process.env.GITHUB_OUTPUT, `tag=${tag}\nversion=${expo.version}\n`);
console.log(`Validated ${tag}, Android version code ${expo.android.versionCode}.`);
