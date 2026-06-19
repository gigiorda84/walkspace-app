import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("com.google.dagger.hilt.android")
    id("com.google.android.libraries.mapsplatform.secrets-gradle-plugin")
    kotlin("kapt")
    id("org.jetbrains.kotlin.plugin.compose")
    id("io.sentry.android.gradle")
    id("com.github.triplet.play")
}

// Load keystore properties
val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(keystorePropertiesFile.inputStream())
}

android {
    namespace = "com.bandite.sonicwalkscape"
    compileSdk = 35

    signingConfigs {
        create("release") {
            if (keystorePropertiesFile.exists()) {
                storeFile = file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
            }
        }
    }

    defaultConfig {
        applicationId = "com.bandite.sonicwalkscape"
        minSdk = 26
        targetSdk = 35
        versionCode = 20
        versionName = "1.1.7"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Compose BOM
    val composeBom = platform("androidx.compose:compose-bom:2024.02.00")
    implementation(composeBom)
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")

    // Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.activity:activity-compose:1.8.2")

    // Lifecycle
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-service:2.7.0")
    implementation("androidx.lifecycle:lifecycle-process:2.7.0")

    // AppCompat (for per-app language settings)
    implementation("androidx.appcompat:appcompat:1.6.1")

    // Navigation
    implementation("androidx.navigation:navigation-compose:2.7.6")

    // Hilt
    implementation("com.google.dagger:hilt-android:2.51.1")
    kapt("com.google.dagger:hilt-compiler:2.51.1")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")

    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Media3 (ExoPlayer)
    implementation("androidx.media3:media3-exoplayer:1.2.1")
    implementation("androidx.media3:media3-session:1.2.1")
    implementation("androidx.media3:media3-ui:1.2.1")

    // Location
    implementation("com.google.android.gms:play-services-location:21.1.0")

    // Maps
    implementation("com.google.maps.android:maps-compose:4.3.0")
    implementation("com.google.android.gms:play-services-maps:18.2.0")

    // DataStore
    implementation("androidx.datastore:datastore-preferences:1.0.0")

    // Coil (images)
    implementation("io.coil-kt:coil-compose:2.5.0")

    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")

    // Sentry crash reporting (core only — no NDK native libs, keeps app 16 KB
    // page-size compliant; ART/JVM crash capture is all this app needs)
    implementation("io.sentry:sentry-android-core:8.14.0")

    // Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}

kapt {
    correctErrorTypes = true
}

secrets {
    propertiesFileName = "secrets.properties"
    defaultPropertiesFileName = "local.defaults.properties"
}

// Google Play Publishing (Gradle Play Publisher).
// Credentials come from a service-account JSON that is gitignored (see README below).
// Publish with:  ./gradlew :app:publishReleaseBundle
// Change `track` to the track you want to release to (internal | alpha | beta | production).
play {
    val credentialsFile = rootProject.file("play-service-account.json")
    if (credentialsFile.exists()) {
        serviceAccountCredentials.set(credentialsFile)
    }
    defaultToAppBundles.set(true)
    track.set("internal")
    releaseStatus.set(com.github.triplet.gradle.androidpublisher.ReleaseStatus.COMPLETED)
}

sentry {
    // Crash reporting only — no performance tracing
    tracingInstrumentation {
        enabled.set(false)
    }
    // Don't auto-add the full sentry-android (it bundles NDK .so libs that are
    // not 16 KB page-aligned by AGP 8.3.2). We add sentry-android-core instead.
    autoInstallation {
        enabled.set(false)
    }
    // R8 mapping upload needs credentials from sentry.properties (gitignored);
    // skip it when the file is absent so builds never break
    autoUploadProguardMapping.set(rootProject.file("sentry.properties").exists())
    telemetry.set(false)
}
