//
//  DebugLogger.swift
//  SonicWalkscape
//
//  Enhanced logging utility for debugging GPS and audio behavior
//

import Foundation

enum DebugLogger {
    enum Category: String {
        case gps = "📍 GPS"
        case audio = "🎵 Audio"
        case network = "🌐 Network"
        case download = "⬇️ Download"
        case warning = "⚠️ Warning"
        case error = "❌ Error"
        case success = "✅ Success"
        case info = "ℹ️ Info"
    }

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss.SSS"
        return formatter
    }()

    static func log(_ message: String, category: Category = .info) {
        let timestamp = dateFormatter.string(from: Date())
        print("[\(timestamp)] \(category.rawValue) \(message)")
    }

    static func gps(_ message: String) {
        log(message, category: .gps)
    }

    static func audio(_ message: String) {
        log(message, category: .audio)
    }

    static func network(_ message: String) {
        log(message, category: .network)
    }

    static func download(_ message: String) {
        log(message, category: .download)
    }

    static func warning(_ message: String) {
        log(message, category: .warning)
    }

    static func error(_ message: String) {
        log(message, category: .error)
    }

    static func success(_ message: String) {
        log(message, category: .success)
    }
}
