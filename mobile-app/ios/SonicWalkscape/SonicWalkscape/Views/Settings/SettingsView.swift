import SwiftUI
import CoreLocation

struct SettingsView: View {
    @StateObject private var preferencesManager = UserPreferencesManager.shared
    @StateObject private var locationManager = LocationManager()
    @Environment(\.dismiss) private var dismiss

    let languages = [
        ("en", "English", "🇬🇧"),
        ("fr", "Français", "🇫🇷"),
        ("it", "Italiano", "🇮🇹")
    ]

    private var strings: LocalizedStrings { LocalizedStrings.shared }

    var body: some View {
        NavigationView {
            ZStack {
                // Background
                Color.brandPurple
                    .ignoresSafeArea()

                ScrollView {
                    VStack(spacing: 24) {
                        // Language Section
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: strings.language)

                            VStack(spacing: 0) {
                                ForEach(Array(languages.enumerated()), id: \.element.0) { index, language in
                                    LanguageRow(
                                        code: language.0,
                                        name: language.1,
                                        flag: language.2,
                                        isSelected: preferencesManager.preferredLanguage == language.0
                                    ) {
                                        preferencesManager.preferredLanguage = language.0
                                    }

                                    if index < languages.count - 1 {
                                        Divider()
                                            .background(Color.brandBorderPurple)
                                    }
                                }
                            }
                            .background(Color.brandSurfacePurple)
                            .cornerRadius(12)
                        }

                        // Location Section
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: strings.location)

                            VStack(spacing: 0) {
                                LocationToggle(
                                    title: strings.enableLocation,
                                    description: strings.locationDescription,
                                    isEnabled: locationManager.authorizationStatus == .authorizedWhenInUse || locationManager.authorizationStatus == .authorizedAlways,
                                    onTap: {
                                        if locationManager.authorizationStatus == .notDetermined {
                                            locationManager.requestPermission()
                                        } else if locationManager.authorizationStatus == .denied || locationManager.authorizationStatus == .restricted {
                                            // Open app settings
                                            if let url = URL(string: UIApplication.openSettingsURLString) {
                                                UIApplication.shared.open(url)
                                            }
                                        }
                                    }
                                )
                            }
                            .background(Color.brandSurfacePurple)
                            .cornerRadius(12)
                        }

                        // App Info Section
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: strings.aboutSection)

                            VStack(spacing: 0) {
                                InfoRow(title: strings.version, value: "1.0.0")
                                Divider()
                                    .background(Color.brandBorderPurple)
                                InfoRow(title: strings.build, value: "1")
                            }
                            .background(Color.brandSurfacePurple)
                            .cornerRadius(12)
                        }

                        // Credits Section
                        VStack(alignment: .leading, spacing: 12) {
                            SectionHeader(title: strings.credits)

                            VStack(spacing: 12) {
                                Image("BanditeLogo")
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 80, height: 80)

                                Text(strings.developedBy)
                                    .font(.headline)
                                    .foregroundColor(.brandCream)

                                Text(strings.getInTouch)
                                    .font(.caption)
                                    .foregroundColor(.white)
                                    .multilineTextAlignment(.center)
                                    .padding(.top, 8)
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.brandSurfacePurple)
                            .cornerRadius(12)
                        }

                        Spacer(minLength: 40)
                    }
                    .padding()
                }
            }
            .navigationTitle("")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { dismiss() }) {
                        Image(systemName: "xmark")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                    }
                }
                ToolbarItem(placement: .principal) {
                    Text(strings.settings)
                        .font(.system(size: 24, weight: .bold))
                        .foregroundColor(.white)
                }
            }
        }
        .accentColor(.brandYellow)
    }
}

// MARK: - Supporting Views

struct SectionHeader: View {
    let title: String

    var body: some View {
        Text(title)
            .font(.headline)
            .foregroundColor(.brandCream)
            .padding(.horizontal, 4)
    }
}

struct LanguageRow: View {
    let code: String
    let name: String
    let flag: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Text(flag)
                    .font(.title3)

                Text(name)
                    .font(.body)
                    .foregroundColor(.brandCream)

                Spacer()

                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.brandYellow)
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct SettingsToggle: View {
    let title: String
    let description: String
    @Binding var isOn: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(title)
                        .font(.body)
                        .foregroundColor(.brandCream)

                    Text(description)
                        .font(.caption)
                        .foregroundColor(.white)
                        .fixedSize(horizontal: false, vertical: true)
                }

                Spacer()

                Toggle("", isOn: $isOn)
                    .labelsHidden()
                    .tint(.brandYellow)
            }
        }
        .padding()
    }
}

struct LocationToggle: View {
    let title: String
    let description: String
    let isEnabled: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(title)
                            .font(.body)
                            .foregroundColor(.brandCream)

                        Text(description)
                            .font(.caption)
                            .foregroundColor(.white)
                            .fixedSize(horizontal: false, vertical: true)
                    }

                    Spacer()

                    Image(systemName: isEnabled ? "checkmark.circle.fill" : "circle")
                        .font(.title2)
                        .foregroundColor(isEnabled ? .green : .white)
                }
            }
            .padding()
            .contentShape(Rectangle())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct InfoRow: View {
    let title: String
    let value: String

    var body: some View {
        HStack {
            Text(title)
                .font(.body)
                .foregroundColor(.brandCream)

            Spacer()

            Text(value)
                .font(.body)
                .foregroundColor(.white)
        }
        .padding()
    }
}

#Preview {
    SettingsView()
}
