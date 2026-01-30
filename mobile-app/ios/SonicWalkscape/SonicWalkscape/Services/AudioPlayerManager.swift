import Foundation
import AVFoundation
import Combine
import MediaPlayer

class AudioPlayerManager: NSObject, ObservableObject {
    // AVAudioPlayer for local files (downloaded mode)
    private var audioPlayer: AVAudioPlayer?

    // AVPlayer for streaming remote URLs
    private var streamPlayer: AVPlayer?
    private var playerItem: AVPlayerItem?
    private var playerItemObserver: NSKeyValueObservation?
    private var playerStatusObserver: NSKeyValueObservation?
    private var playerTimeObserver: Any?

    @Published var isPlaying: Bool = false
    @Published var currentTime: TimeInterval = 0
    @Published var duration: TimeInterval = 0
    @Published var settings: AudioSettings = AudioSettings()
    @Published var didFinishPlaying: Bool = false
    @Published var isBuffering: Bool = false

    private var timer: Timer?
    private var currentAudioURL: String?
    private var isUsingStreamPlayer: Bool = false

    override init() {
        super.init()
        setupAudioSession()
        setupRemoteCommandCenter()
    }

    private func setupAudioSession() {
        do {
            // Configure audio session for background playback
            // .playback category allows audio to continue when screen is locked
            try AVAudioSession.sharedInstance().setCategory(
                .playback,
                mode: .spokenAudio,
                options: [.duckOthers]
            )
            try AVAudioSession.sharedInstance().setActive(true)
            DebugLogger.success("Audio session configured for background playback")
        } catch {
            DebugLogger.error("Failed to setup audio session: \(error.localizedDescription)")
        }
    }

    /// Play audio from a remote URL (streaming) or local file
    /// - Parameters:
    ///   - audioURL: Remote URL string
    ///   - localURL: Optional local file URL (used if available for offline playback)
    func play(audioURL: String, localURL: URL? = nil) {
        // If we have a local file, use AVAudioPlayer directly
        if let localURL = localURL {
            playLocalFile(localURL)
            return
        }

        // Stream from remote URL using AVPlayer
        streamFromURL(audioURL)
    }

    // MARK: - Streaming Playback (AVPlayer)

    /// Stream audio from a remote URL - starts playing as soon as enough data is buffered
    private func streamFromURL(_ audioURL: String) {
        // Prevent duplicate streams of the same URL
        if currentAudioURL == audioURL && isUsingStreamPlayer {
            DebugLogger.log("Already streaming this audio, skipping duplicate request", category: .info)
            return
        }

        guard let url = URL(string: audioURL) else {
            DebugLogger.error("Invalid audio URL: \(audioURL)")
            return
        }

        // Cleanup previous players
        cleanupPlayers()

        currentAudioURL = audioURL
        isUsingStreamPlayer = true
        isBuffering = true

        DebugLogger.audio("Streaming audio from: \(audioURL)")

        // Create player item and player
        playerItem = AVPlayerItem(url: url)
        streamPlayer = AVPlayer(playerItem: playerItem)
        streamPlayer?.volume = settings.volume

        // Observe player item status to know when ready to play
        playerStatusObserver = playerItem?.observe(\.status, options: [.new]) { [weak self] item, _ in
            DispatchQueue.main.async {
                self?.handlePlayerItemStatusChange(item.status)
            }
        }

        // Observe when playback buffer is empty (buffering)
        playerItemObserver = playerItem?.observe(\.isPlaybackBufferEmpty, options: [.new]) { [weak self] item, _ in
            DispatchQueue.main.async {
                self?.isBuffering = item.isPlaybackBufferEmpty
            }
        }

        // Observe when playback finishes
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(playerDidFinishPlaying),
            name: .AVPlayerItemDidPlayToEndTime,
            object: playerItem
        )

        // Start performance timer
        let _ = PerformanceMonitor.shared.startAudioLoadTimer()
    }

    private func handlePlayerItemStatusChange(_ status: AVPlayerItem.Status) {
        switch status {
        case .readyToPlay:
            // Get duration
            if let item = playerItem {
                let durationCMTime = item.asset.duration
                duration = CMTimeGetSeconds(durationCMTime)
                if duration.isNaN || duration.isInfinite {
                    duration = 0
                }
            }

            isBuffering = false
            DebugLogger.audio("Stream ready: \(String(format: "%.1f", duration))s, autoPlay: \(settings.autoPlay)")

            if settings.autoPlay {
                streamPlayer?.play()
                isPlaying = true
                startStreamTimer()
            }

        case .failed:
            isBuffering = false
            DebugLogger.error("Stream failed: \(playerItem?.error?.localizedDescription ?? "Unknown error")")

        case .unknown:
            DebugLogger.log("Stream status: unknown", category: .info)

        @unknown default:
            break
        }
    }

    @objc private func playerDidFinishPlaying() {
        DispatchQueue.main.async { [weak self] in
            self?.isPlaying = false
            self?.currentTime = 0
            self?.stopStreamTimer()
            self?.didFinishPlaying = true
            DebugLogger.audio("Stream playback completed")
        }
    }

    private func startStreamTimer() {
        stopStreamTimer()

        // Use AVPlayer's time observer for accurate time updates
        let interval = CMTime(seconds: 0.1, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
        playerTimeObserver = streamPlayer?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            self?.currentTime = CMTimeGetSeconds(time)
        }
    }

    private func stopStreamTimer() {
        if let observer = playerTimeObserver {
            streamPlayer?.removeTimeObserver(observer)
            playerTimeObserver = nil
        }
    }

    // MARK: - Local File Playback (AVAudioPlayer)

    /// Play audio from a local file URL
    private func playLocalFile(_ localURL: URL) {
        DebugLogger.audio("Playing local file: \(localURL.lastPathComponent)")

        // Cleanup previous players
        cleanupPlayers()
        isUsingStreamPlayer = false

        do {
            audioPlayer = try AVAudioPlayer(contentsOf: localURL)
            audioPlayer?.delegate = self
            audioPlayer?.volume = settings.volume
            audioPlayer?.prepareToPlay()

            duration = audioPlayer?.duration ?? 0

            if settings.autoPlay {
                audioPlayer?.play()
                isPlaying = true
                startTimer()
            }

            DebugLogger.audio("Local audio ready: \(String(format: "%.1f", duration))s")
        } catch {
            DebugLogger.error("Failed to play local file: \(error.localizedDescription)")
        }
    }

    // MARK: - Playback Controls

    func togglePlayPause() {
        if isUsingStreamPlayer {
            toggleStreamPlayPause()
        } else {
            toggleAudioPlayerPlayPause()
        }
    }

    private func toggleStreamPlayPause() {
        guard let player = streamPlayer else { return }

        if isPlaying {
            player.pause()
            isPlaying = false
            DebugLogger.audio("Stream paused at \(String(format: "%.1f", currentTime))s")
        } else {
            player.play()
            isPlaying = true
            startStreamTimer()
            DebugLogger.audio("Stream resumed at \(String(format: "%.1f", currentTime))s")
        }
    }

    private func toggleAudioPlayerPlayPause() {
        guard let player = audioPlayer else { return }

        if player.isPlaying {
            player.pause()
            isPlaying = false
            stopTimer()
            DebugLogger.audio("Audio paused at \(String(format: "%.1f", currentTime))s")
        } else {
            player.play()
            isPlaying = true
            startTimer()
            DebugLogger.audio("Audio resumed at \(String(format: "%.1f", currentTime))s")
        }
    }

    func stop() {
        if isUsingStreamPlayer {
            streamPlayer?.pause()
            stopStreamTimer()
        } else {
            audioPlayer?.stop()
            stopTimer()
        }
        isPlaying = false
        currentTime = 0
    }

    func seek(to time: TimeInterval) {
        if isUsingStreamPlayer {
            let cmTime = CMTime(seconds: time, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
            streamPlayer?.seek(to: cmTime)
        } else {
            audioPlayer?.currentTime = time
        }
        currentTime = time
    }

    func setVolume(_ volume: Float) {
        settings.volume = volume
        streamPlayer?.volume = volume
        audioPlayer?.volume = volume
    }

    // MARK: - Cleanup

    private func cleanupPlayers() {
        // Cleanup stream player
        stopStreamTimer()
        playerStatusObserver?.invalidate()
        playerStatusObserver = nil
        playerItemObserver?.invalidate()
        playerItemObserver = nil
        NotificationCenter.default.removeObserver(self, name: .AVPlayerItemDidPlayToEndTime, object: playerItem)
        streamPlayer?.pause()
        streamPlayer = nil
        playerItem = nil

        // Cleanup audio player
        audioPlayer?.stop()
        audioPlayer?.delegate = nil
        audioPlayer = nil
        stopTimer()

        // Reset state
        isPlaying = false
        currentTime = 0
        isBuffering = false
        currentAudioURL = nil
    }

    // MARK: - Timer for AVAudioPlayer

    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            self?.currentTime = self?.audioPlayer?.currentTime ?? 0
        }
        if let timer = timer {
            RunLoop.current.add(timer, forMode: .common)
        }
    }

    private func stopTimer() {
        timer?.invalidate()
        timer = nil
    }

    // MARK: - Lock Screen Controls

    private func setupRemoteCommandCenter() {
        let commandCenter = MPRemoteCommandCenter.shared()

        commandCenter.playCommand.addTarget { [weak self] _ in
            self?.togglePlayPause()
            return .success
        }

        commandCenter.pauseCommand.addTarget { [weak self] _ in
            self?.togglePlayPause()
            return .success
        }
    }

    func updateNowPlayingInfo(title: String, artist: String = "Sonic Walkscape") {
        var nowPlayingInfo = [String: Any]()
        nowPlayingInfo[MPMediaItemPropertyTitle] = title
        nowPlayingInfo[MPMediaItemPropertyArtist] = artist
        nowPlayingInfo[MPMediaItemPropertyPlaybackDuration] = duration
        nowPlayingInfo[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentTime
        nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? 1.0 : 0.0

        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }

    func clearNowPlayingInfo() {
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
    }
}

extension AudioPlayerManager: AVAudioPlayerDelegate {
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        isPlaying = false
        currentTime = 0
        stopTimer()

        // Notify that audio finished
        didFinishPlaying = true

        if flag {
            DebugLogger.audio("Audio playback completed successfully")
        } else {
            DebugLogger.warning("Audio playback ended unexpectedly")
        }
    }
}
