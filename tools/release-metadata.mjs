export function releaseMetadata(expo, env) {
  const automatic = env.RELEASE_MODE === 'automatic';
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(expo.version))
    throw new Error('Set a valid app version before releasing.');
  if (!Number.isInteger(expo.android.versionCode) || expo.android.versionCode < 1)
    throw new Error('Set a positive integer Android versionCode before releasing.');
  const run = Number(env.BUILD_NUMBER);
  if ((automatic || env.BUILD_NUMBER) &&
      (!Number.isSafeInteger(run) || run < 1 || run > 2099900000))
    throw new Error('A valid GitHub workflow run number is required.');
  const version = automatic ? `${expo.version}-build.${run}` : expo.version;
  const tag = automatic ? `v${version}` : env.RELEASE_TAG;
  if (tag !== `v${version}`)
    throw new Error(`Release tag must match v${version}.`);
  return {
    version, tag, existingTag: !automatic,
    versionCode: env.BUILD_NUMBER ? 100000 + run : expo.android.versionCode,
  };
}
