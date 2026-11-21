const { withAppBuildGradle } = require('expo/config-plugins');

const MARKER = '// @generated with-apk-file-name';

/**
 * Names release APKs `<prefix>-<yyyyMMdd-HHmm>.apk` (build date/time).
 * Debug builds keep the default name because `expo run:android` installs
 * `app-debug.apk` by path.
 *
 * @param {import('expo/config-plugins').ExpoConfig} config
 * @param {{ prefix: string }} options
 */
function withApkFileName(config, { prefix }) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.contents.includes(MARKER)) return mod;
    mod.modResults.contents += `
${MARKER}
android.applicationVariants.configureEach { variant ->
    if (variant.buildType.name == "release") {
        def stamp = new Date().format("yyyyMMdd-HHmm")
        variant.outputs.configureEach { output ->
            output.outputFileName = "${prefix}-\${stamp}.apk"
        }
    }
}
`;
    return mod;
  });
}

module.exports = withApkFileName;
