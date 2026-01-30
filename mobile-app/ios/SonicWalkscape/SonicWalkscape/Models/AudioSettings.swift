import Foundation

struct AudioSettings: Codable {
    var volume: Float = 0.8
    var autoPlay: Bool = true
    var backgroundAudioEnabled: Bool = true
    var spatialAudioEnabled: Bool = false

    init(volume: Float = 0.8, autoPlay: Bool = true, backgroundAudioEnabled: Bool = true, spatialAudioEnabled: Bool = false) {
        self.volume = volume
        self.autoPlay = autoPlay
        self.backgroundAudioEnabled = backgroundAudioEnabled
        self.spatialAudioEnabled = spatialAudioEnabled
    }
}
