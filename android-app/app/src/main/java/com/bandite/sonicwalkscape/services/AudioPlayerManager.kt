package com.bandite.sonicwalkscape.services

import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import com.bandite.sonicwalkscape.utils.DebugLogger
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.io.File

class AudioPlayerManager(private val context: Context) {

    private var exoPlayer: ExoPlayer? = null

    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _currentPosition = MutableStateFlow(0L)
    val currentPosition: StateFlow<Long> = _currentPosition.asStateFlow()

    private val _duration = MutableStateFlow(0L)
    val duration: StateFlow<Long> = _duration.asStateFlow()

    private val _currentPointId = MutableStateFlow<String?>(null)
    val currentPointId: StateFlow<String?> = _currentPointId.asStateFlow()

    var onPlaybackCompleted: (() -> Unit)? = null

    private val playerListener = object : Player.Listener {
        override fun onIsPlayingChanged(isPlaying: Boolean) {
            _isPlaying.value = isPlaying
        }

        override fun onPlaybackStateChanged(playbackState: Int) {
            when (playbackState) {
                Player.STATE_READY -> {
                    _duration.value = exoPlayer?.duration ?: 0L
                    DebugLogger.audio("Player ready, duration: ${_duration.value}ms")
                }
                Player.STATE_ENDED -> {
                    DebugLogger.audio("Playback completed")
                    onPlaybackCompleted?.invoke()
                }
            }
        }
    }

    fun initialize() {
        if (exoPlayer == null) {
            exoPlayer = ExoPlayer.Builder(context).build().apply {
                addListener(playerListener)
            }
            DebugLogger.audio("ExoPlayer initialized")
        }
    }

    fun playFile(file: File, pointId: String? = null) {
        initialize()
        exoPlayer?.let { player ->
            val mediaItem = MediaItem.fromUri(file.toURI().toString())
            player.setMediaItem(mediaItem)
            player.prepare()
            player.play()
            _currentPointId.value = pointId
            DebugLogger.audio("Playing file: ${file.name}")
        }
    }

    fun playUrl(url: String, pointId: String? = null) {
        initialize()
        exoPlayer?.let { player ->
            val mediaItem = MediaItem.fromUri(url)
            player.setMediaItem(mediaItem)
            player.prepare()
            player.play()
            _currentPointId.value = pointId
            DebugLogger.audio("Playing URL: $url")
        }
    }

    fun play() {
        exoPlayer?.play()
    }

    fun pause() {
        exoPlayer?.pause()
    }

    fun stop() {
        exoPlayer?.stop()
        _currentPointId.value = null
    }

    fun seekTo(positionMs: Long) {
        exoPlayer?.seekTo(positionMs)
    }

    fun seekForward(ms: Long = 15000) {
        exoPlayer?.let { player ->
            val newPosition = (player.currentPosition + ms).coerceAtMost(player.duration)
            player.seekTo(newPosition)
        }
    }

    fun seekBackward(ms: Long = 15000) {
        exoPlayer?.let { player ->
            val newPosition = (player.currentPosition - ms).coerceAtLeast(0)
            player.seekTo(newPosition)
        }
    }

    fun updatePosition() {
        exoPlayer?.let { player ->
            _currentPosition.value = player.currentPosition
        }
    }

    fun release() {
        exoPlayer?.release()
        exoPlayer = null
        DebugLogger.audio("ExoPlayer released")
    }

    val progress: Float
        get() {
            val dur = _duration.value
            return if (dur > 0) _currentPosition.value.toFloat() / dur else 0f
        }
}
