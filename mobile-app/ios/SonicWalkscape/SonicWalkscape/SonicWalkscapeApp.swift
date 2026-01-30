//
//  SonicWalkscapeApp.swift
//  SonicWalkscape
//
//  Created by Giuseppe Giordano on 26/12/25.
//

import SwiftUI

@main
struct SonicWalkscapeApp: App {
    @StateObject private var locationManager = LocationManager()
    @StateObject private var audioManager = AudioPlayerManager()

    var body: some Scene {
        WindowGroup {
            WelcomeView()
                .environmentObject(locationManager)
                .environmentObject(audioManager)
        }
    }
}
