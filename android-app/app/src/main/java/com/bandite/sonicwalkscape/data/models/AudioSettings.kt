package com.bandite.sonicwalkscape.data.models

data class AudioSettings(
    val volume: Float = 1.0f,
    val playbackSpeed: Float = 1.0f,
    val subtitlesEnabled: Boolean = true,
    val autoPlayNext: Boolean = true
)
