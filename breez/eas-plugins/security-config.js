import { withProjectBuildGradle } from '@expo/config-plugins'

const withProguard = (config) => {
    return withProjectBuildGradle(config, (config) => {
        if (config.modResults.language === 'groovy') {
            config.modResults.contents = config.modResults.contents.replace(
                /buildTypes\s*{/,
                `buildTypes {
                    release {
                        minifyEnabled true
                        shrinkResources true
                        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
                        signingConfig signingConfigs.debug
                    }`
            )
        }
        return config
    })
}
export default withProguard