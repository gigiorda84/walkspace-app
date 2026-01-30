import Foundation
import Network
import Combine

class TourDownloadManager: ObservableObject {
    static let shared = TourDownloadManager()

    @Published var downloadedTours: Set<String> = []

    private let fileManager = FileManager.default
    private let session: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 60.0
        config.timeoutIntervalForResource = 300.0
        self.session = URLSession(configuration: config)

        // Load previously downloaded tours
        loadDownloadedTours()
    }

    // MARK: - Public API

    /// Check if a tour is downloaded for a specific language
    func isDownloaded(tourId: String, language: String) -> Bool {
        let key = "\(tourId)_\(language)"
        return downloadedTours.contains(key)
    }

    /// Get local audio URL for a tour point, or nil if not downloaded
    func localAudioURL(tourId: String, language: String, pointId: String) -> URL? {
        let audioDir = getAudioDirectory(tourId: tourId, language: language)
        let audioFile = audioDir.appendingPathComponent("\(pointId).mp3")

        if fileManager.fileExists(atPath: audioFile.path) {
            return audioFile
        }
        return nil
    }

    /// Download tour content and return progress updates
    func downloadTour(tourId: String, language: String) -> AsyncThrowingStream<Double, Error> {
        AsyncThrowingStream { continuation in
            Task {
                do {
                    // Fetch manifest
                    let manifest = try await APIService.shared.fetchTourManifest(tourId: tourId, language: language)

                    let totalFiles = manifest.audio.count
                    var completedFiles = 0

                    // Create directories
                    let audioDir = self.getAudioDirectory(tourId: tourId, language: language)
                    try self.fileManager.createDirectory(at: audioDir, withIntermediateDirectories: true)

                    // Download each audio file
                    for audioFile in manifest.audio {
                        let localFile = audioDir.appendingPathComponent("\(audioFile.pointId).mp3")

                        // Skip if file already exists
                        if self.fileManager.fileExists(atPath: localFile.path) {
                            completedFiles += 1
                            let progress = Double(completedFiles) / Double(totalFiles)
                            continuation.yield(progress)
                            continue
                        }

                        guard let url = URL(string: audioFile.fileUrl) else { continue }

                        let (data, _) = try await self.session.data(from: url)

                        // Save to local storage
                        try data.write(to: localFile)

                        completedFiles += 1
                        let progress = Double(completedFiles) / Double(totalFiles)
                        continuation.yield(progress)
                    }

                    // Mark as downloaded
                    let key = "\(tourId)_\(language)"
                    await MainActor.run {
                        self.downloadedTours.insert(key)
                        self.saveDownloadedTours()
                    }

                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    /// Delete downloaded tour content
    func deleteTour(tourId: String, language: String) {
        let tourDir = getTourDirectory(tourId: tourId)

        do {
            if fileManager.fileExists(atPath: tourDir.path) {
                try fileManager.removeItem(at: tourDir)
            }

            let key = "\(tourId)_\(language)"
            downloadedTours.remove(key)
            saveDownloadedTours()

            DebugLogger.success("Deleted tour: \(tourId)")
        } catch {
            DebugLogger.error("Failed to delete tour: \(error.localizedDescription)")
        }
    }

    // MARK: - Private Helpers

    private func getTourDirectory(tourId: String) -> URL {
        let documentsDir = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]
        return documentsDir.appendingPathComponent("tours/\(tourId)")
    }

    private func getAudioDirectory(tourId: String, language: String) -> URL {
        return getTourDirectory(tourId: tourId).appendingPathComponent("audio/\(language)")
    }

    private func loadDownloadedTours() {
        if let data = UserDefaults.standard.data(forKey: "downloadedTours"),
           let tours = try? JSONDecoder().decode(Set<String>.self, from: data) {
            downloadedTours = tours
        }
    }

    private func saveDownloadedTours() {
        if let data = try? JSONEncoder().encode(downloadedTours) {
            UserDefaults.standard.set(data, forKey: "downloadedTours")
        }
    }
}

// MARK: - Network Connectivity Helper
class NetworkMonitor: ObservableObject {
    static let shared = NetworkMonitor()

    @Published var isConnected: Bool = true

    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")

    private init() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.isConnected = path.status == .satisfied
            }
        }
        monitor.start(queue: queue)
    }

    deinit {
        monitor.cancel()
    }
}
