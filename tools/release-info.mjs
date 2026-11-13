import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { releaseMetadata } from './release-metadata.mjs';

const configPath = new URL('../apps/mobile/app.json', import.meta.url);
const config = JSON.parse(readFileSync(configPath, 'utf8'));
const result = releaseMetadata(config.expo, process.env);
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
if (process.env.BUILD_NUMBER) {
  config.expo.version = result.version;
  config.expo.android.versionCode = result.versionCode;
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}
if (process.env.GITHUB_OUTPUT)
  appendFileSync(process.env.GITHUB_OUTPUT,
    `tag=${result.tag}\nversion=${result.version}\ncommit=${commit}\nexisting_tag=${result.existingTag}\n`);
console.log(`Validated ${result.tag}, Android version code ${result.versionCode}, commit ${commit}.`);
