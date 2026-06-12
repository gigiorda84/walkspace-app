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
