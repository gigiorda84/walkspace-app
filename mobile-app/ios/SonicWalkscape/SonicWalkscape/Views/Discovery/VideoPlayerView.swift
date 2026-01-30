import SwiftUI
import AVFoundation
import AVKit
import Combine

/// A video player view for tour cover trailers with play and mute controls
struct VideoPlayerView: View {
    let videoURL: URL
    @StateObject private var playerViewModel = PlayerViewModel()

    var body: some View {
        ZStack {
            // Video layer
            if playerViewModel.isLoading {
                Rectangle()
                    .fill(Color.brandDark)
                    .overlay(
                        ProgressView()
                            .tint(.brandYellow)
                    )
            } else {
                PlayerViewRepresentable(player: playerViewModel.player)
            }

            // Play button overlay (shown when paused)
            if !playerViewModel.isPlaying && !playerViewModel.isLoading {
                Button(action: {
                    playerViewModel.play()
                }) {
                    Image(systemName: "play.circle.fill")
                        .font(.system(size: 50))
                        .foregroundColor(.white.opacity(0.9))
                        .shadow(color: .black.opacity(0.5), radius: 4)
                }
            }

            // Mute button (bottom right)
            if !playerViewModel.isLoading {
                VStack {
                    Spacer()
                    HStack {
                        Spacer()
                        Button(action: {
                            playerViewModel.toggleMute()
                        }) {
                            Image(systemName: playerViewModel.isMuted ? "speaker.slash.fill" : "speaker.wave.2.fill")
                                .font(.system(size: 16))
                                .foregroundColor(.white)
                                .padding(8)
                                .background(Color.black.opacity(0.5))
                                .clipShape(Circle())
                        }
                        .padding(8)
                    }
                }
            }
        }
        .onAppear {
            playerViewModel.setupPlayer(with: videoURL)
        }
        .onDisappear {
            playerViewModel.cleanup()
        }
    }

    /// View model to manage AVPlayer lifecycle
    @MainActor
    class PlayerViewModel: ObservableObject {
        @Published var isLoading = true
        @Published var isPlaying = false
        @Published var isMuted = true
        var player: AVPlayer?
        private var playerItem: AVPlayerItem?
        private var loopObserver: Any?

        func setupPlayer(with url: URL) {
            // Create player item and player
            let asset = AVAsset(url: url)
            let playerItem = AVPlayerItem(asset: asset)
            self.playerItem = playerItem

            let player = AVPlayer(playerItem: playerItem)
            player.isMuted = true  // Start muted
            player.automaticallyWaitsToMinimizeStalling = false
            self.player = player

            // Setup looping
            loopObserver = NotificationCenter.default.addObserver(
                forName: .AVPlayerItemDidPlayToEndTime,
                object: playerItem,
                queue: .main
            ) { [weak self] _ in
                guard let self = self else { return }
                Task { @MainActor [weak self] in
                    guard let self = self else { return }
                    self.player?.seek(to: .zero)
                    if self.isPlaying {
                        self.player?.play()
                    }
                }
            }

            // Do NOT autoplay - wait for user to tap play
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                self.isLoading = false
            }
        }

        func play() {
            player?.play()
            isPlaying = true
        }

        func pause() {
            player?.pause()
            isPlaying = false
        }

        func toggleMute() {
            isMuted.toggle()
            player?.isMuted = isMuted
        }

        func cleanup() {
            player?.pause()
            player?.replaceCurrentItem(with: nil)
            if let observer = loopObserver {
                NotificationCenter.default.removeObserver(observer)
            }
            player = nil
            playerItem = nil
            isPlaying = false
        }
    }
}

/// UIViewRepresentable wrapper for AVPlayerLayer
struct PlayerViewRepresentable: UIViewRepresentable {
    let player: AVPlayer?

    func makeUIView(context: Context) -> PlayerUIView {
        return PlayerUIView(player: player)
    }

    func updateUIView(_ uiView: PlayerUIView, context: Context) {
        uiView.player = player
    }
}

/// Custom UIView that hosts an AVPlayerLayer
class PlayerUIView: UIView {
    private var playerLayer: AVPlayerLayer?

    var player: AVPlayer? {
        didSet {
            if let player = player {
                let layer = AVPlayerLayer(player: player)
                layer.videoGravity = .resizeAspect  // Fit video without cutting
                layer.backgroundColor = UIColor.black.cgColor
                self.layer.addSublayer(layer)
                self.playerLayer = layer
            }
        }
    }

    init(player: AVPlayer?) {
        self.player = player
        super.init(frame: .zero)
        self.backgroundColor = .black

        if let player = player {
            let layer = AVPlayerLayer(player: player)
            layer.videoGravity = .resizeAspect  // Fit video without cutting
            layer.backgroundColor = UIColor.black.cgColor
            self.layer.addSublayer(layer)
            self.playerLayer = layer
        }
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func layoutSubviews() {
        super.layoutSubviews()
        playerLayer?.frame = bounds
    }
}
