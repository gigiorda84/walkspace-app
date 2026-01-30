package com.bandite.sonicwalkscape.data.models

data class AudioSettings(
    val volume: Float = 0.8f,
    val autoPlay: Boolean = true,
    val backgroundAudioEnabled: Boolean = true,
    val spatialAudioEnabled: Boolean = false
) {
    companion object {
        val DEFAULT = AudioSettings()
    }
}
