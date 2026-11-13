import { test } from 'node:test';
import assert from 'node:assert/strict';
import { releaseMetadata } from './release-metadata.mjs';
const expo = { version: '0.2.1', android: { versionCode: 3 } };
test('each push gets a distinct tag and increasing install version without a source version bump', () => {
  const first = releaseMetadata(expo, { RELEASE_MODE: 'automatic', BUILD_NUMBER: '5' });
  const next = releaseMetadata(expo, { RELEASE_MODE: 'automatic', BUILD_NUMBER: '6' });
  assert.equal(first.tag, 'v0.2.1-build.5');
  assert.notEqual(first.tag, next.tag);
  assert.ok(next.versionCode > first.versionCode);
  assert.ok(first.versionCode > expo.android.versionCode);
  assert.equal(first.existingTag, false);
  assert.deepEqual(expo, { version: '0.2.1', android: { versionCode: 3 } });
});
test('manual version tags still match the app version', () => {
  assert.equal(releaseMetadata(expo, { RELEASE_TAG: 'v0.2.1', BUILD_NUMBER: '7' }).existingTag, true);
  assert.throws(() => releaseMetadata(expo, { RELEASE_TAG: 'v9.0.0' }));
});
test('invalid or missing automatic build numbers fail before publishing', () => {
  for (const value of [undefined, '0', '-1', '1.5', 'bad', '2099900001'])
    assert.throws(() => releaseMetadata(expo, { RELEASE_MODE: 'automatic', BUILD_NUMBER: value }));
});
