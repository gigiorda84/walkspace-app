import SwiftUI

extension Color {
    // MARK: - Brand Colors (from DESIGN_REFERENCE.md)

    // Background Colors
    static let brandPurple = Color(hex: "1A5C61")          // Dark teal background
    static let brandSurfacePurple = Color(hex: "2A6F75")   // Card/surface backgrounds (teal)
    static let brandBorderPurple = Color(hex: "3D8389")    // Borders (lighter teal)
    static let brandDark = Color(hex: "0f0b14")            // Darkest elements

    // Accent Colors
    static let brandOrange = Color(hex: "d95808")          // Primary CTA, active states
    static let brandYellow = Color(hex: "f5b400")          // Secondary accent, highlights

    // Text Colors
    static let brandCream = Color(hex: "f8f5f0")           // Primary text
    static let brandMuted = Color(hex: "9b8fb5")           // Secondary text, labels

    // MARK: - Convenience Initializer for Hex Colors
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: // RGB (12-bit)
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: // RGB (24-bit)
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: // ARGB (32-bit)
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue:  Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
