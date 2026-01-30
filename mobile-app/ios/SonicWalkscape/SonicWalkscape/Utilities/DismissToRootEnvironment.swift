//
//  DismissToRootEnvironment.swift
//  SonicWalkscape
//
//  Environment key for dismissing all the way back to WelcomeView (root)
//

import SwiftUI

struct DismissToRootKey: EnvironmentKey {
    static let defaultValue: () -> Void = {}
}

extension EnvironmentValues {
    var dismissToRoot: () -> Void {
        get { self[DismissToRootKey.self] }
        set { self[DismissToRootKey.self] = newValue }
    }
}
