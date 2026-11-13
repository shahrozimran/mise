const { withProjectBuildGradle } = require('expo/config-plugins');

// CMake/Ninja's Windows object paths can exceed MAX_PATH in a normal nested
// workspace. Ask CMake to hash long object names; do not patch dependencies.
const marker = '// mise-windows-cmake-paths';
module.exports = function withWindowsCMakePaths(config) {
  return withProjectBuildGradle(config, config => {
    if (config.modResults.language !== 'groovy') throw new Error('Mise expects the Expo Groovy root Gradle template.');
    if (!config.modResults.contents.includes(marker)) {
      const anchor = 'apply plugin: "expo-root-project"';
      if (!config.modResults.contents.includes(anchor)) throw new Error('Expected Expo root plugin anchor was not found.');
      // Register before Expo's root plugin, which can eagerly evaluate :app.
      const configuration = `
${marker}
if (System.getProperty('os.name').toLowerCase().contains('windows')) {
    def miseBuildKey = Integer.toHexString(rootProject.projectDir.absolutePath.hashCode())
    def miseNativeCache = new File(rootProject.projectDir.toPath().getRoot().toFile(), '.mise-cxx/' + miseBuildKey)
    subprojects { nativeProject ->
        ['com.android.library', 'com.android.application'].each { androidPlugin ->
            nativeProject.plugins.withId(androidPlugin) {
                nativeProject.android.defaultConfig.externalNativeBuild.cmake.arguments.add('-DCMAKE_OBJECT_PATH_MAX=240')
                nativeProject.android.externalNativeBuild.cmake.buildStagingDirectory = new File(miseNativeCache, nativeProject.name)
            }
        }
    }
}
`;
      config.modResults.contents = config.modResults.contents.replace(anchor, configuration + '\n' + anchor);
    }
    return config;
  });
};
