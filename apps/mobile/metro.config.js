const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

const config = getDefaultConfig(__dirname);
const existing = config.resolver.blockList;
const cachePath = path.resolve(__dirname, '../../.cache').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
config.resolver.blockList = [
  ...(Array.isArray(existing) ? existing : existing ? [existing] : []),
  new RegExp('^' + cachePath + '[/\\\\]'),
  /[/\\](android|ios)[/\\](build|\.cxx)[/\\]/,
  /[/\\]apps[/\\]mobile[/\\]dist(-android)?[/\\]/,
];
config.maxWorkers = 2;
module.exports = config;
