//
//  SonicWalkscapeApp.swift
//  SonicWalkscape
//
//  Created by Giuseppe Giordano on 26/12/25.
//

import SwiftUI
import Sentry

@main
struct SonicWalkscapeApp: App {
    @StateObject private var locationManager = LocationManager()
    @StateObject private var audioManager = AudioPlayerManager()

    init() {
        SentrySDK.start { options in
            // DSN is a public identifier, safe to commit
            options.dsn = "https://58f6bd18ed79cd8ffa41859f7488af36@o4511552711229440.ingest.de.sentry.io/4511552719683664"
            // Crash reporting only — no performance tracing
            options.tracesSampleRate = 0
            // App Hang Tracking V2 (hard-wired on iOS in sentry-cocoa 9.x) infers hangs purely
            // from missing frames, so it reports false "App Hang Fully Blocked" events when the
            // process stays alive with the screen locked (our audio + location background modes)
            // and the user then unlocks the phone. Main thread is idle in every report.
            // See getsentry/sentry-cocoa#8317 — re-enable once the heartbeat fix (PR #8840) ships.
            options.enableAppHangTracking = false
        }
    }

    var body: some Scene {
        WindowGroup {
            WelcomeView()
                .environmentObject(locationManager)
                .environmentObject(audioManager)
        }
    }
}
