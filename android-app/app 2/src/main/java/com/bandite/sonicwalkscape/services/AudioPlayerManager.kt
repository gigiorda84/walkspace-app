package com.bandite.sonicwalkscape.services

import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import com.bandite.sonicwalkscape.data.models.AudioSettings
import com.bandite.sonicwalkscape.utils.Constants
import com.bandite.sonicwalkscape.utils.DebugLogger
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AudioPlayerManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private var exoPlayer: ExoPlayer? = null
    private var progressJob: Job? = null
    private val scope = CoroutineScope(Dispatchers.Main)

    // State
    private val _isPlaying = MutableStateFlow(false)
    val isPlaying: StateFlow<Boolean> = _isPlaying.asStateFlow()

    private val _isBuffering = MutableStateFlow(false)
    val isBuffering: StateFlow<Boolean> = _isBuffering.asStateFlow()

    private val _currentTime = MutableStateFlow(0L)
    val currentTime: StateFlow<Long> = _currentTime.asStateFlow()

    private val _duration = MutableStateFlow(0L)
    val duration: StateFlow<Long> = _duration.asStateFlow()

    private val _didFinishPlaying = MutableStateFlow(false)
    val didFinishPlaying: StateFlow<Boolean> = _didFinishPlaying.asStateFlow()

    private val _settings = MutableStateFlow(AudioSettings.DEFAULT)
    val settings: StateFlow<AudioSettings> = _settings.asStateFlow()

    // Callback for playback completion
    var onPlaybackComplete: (() -> Unit)? = null

    private val playerListener = object : Player.Listener {
        override fun onIsPlayingChanged(isPlaying: Boolean) {
            _isPlaying.value = isPlaying
            if (isPlaying) {
                startProgressUpdates()
            } else {
                stopProgressUpdates()
            }
        }

        override fun onPlaybackStateChanged(playbackState: Int) {
            when (playbackState) {
                Player.STATE_BUFFERING -> {
                    _isBuffering.value = true
                    DebugLogger.audio("Buffering...")
                }
                Player.STATE_READY -> {
                    _isBuffering.value = false
                    _duration.value = exoPlayer?.duration ?: 0L
                    DebugLogger.audio("Ready - duration: ${_duration.value}ms")
                }
                Player.STATE_ENDED -> {
                    _isBuffering.value = false
                    _didFinishPlaying.value = true
                    DebugLogger.audio("Playback ended")
                    onPlaybackComplete?.invoke()
                }
                Player.STATE_IDLE -> {
                    _isBuffering.value = false
                }
            }
        }
    }

    // ========== Player Initialization ==========

    private fun getOrCreatePlayer(): ExoPlayer {
        return exoPlayer ?: ExoPlayer.Builder(context).build().also { player ->
            player.addListener(playerListener)
            player.volume = _settings.value.volume
            exoPlayer = player
            DebugLogger.audio("ExoPlayer created")
        }
    }

    // ========== Playback Control ==========

    fun playLocalFile(file: File) {
        if (!file.exists()) {
            DebugLogger.error("Audio file not found: ${file.absolutePath}")
            return
        }

        val player = getOrCreatePlayer()
        _didFinishPlaying.value = false
        _currentTime.value = 0L

        val mediaItem = MediaItem.fromUri(file.toURI().toString())
        player.setMediaItem(mediaItem)
        player.prepare()

        if (_settings.value.autoPlay) {
            player.play()
        }

        DebugLogger.audio("Playing local file: ${file.name}")
    }

    fun playRemoteUrl(url: String) {
        val player = getOrCreatePlayer()
        _didFinishPlaying.value = false
        _currentTime.value = 0L

        val mediaItem = MediaItem.fromUri(url)
        player.setMediaItem(mediaItem)
        player.prepare()

        if (_settings.value.autoPlay) {
            player.play()
        }

        DebugLogger.audio("Playing remote URL: $url")
    }

    fun play() {
        exoPlayer?.play()
        DebugLogger.audio("Play")
    }

    fun pause() {
        exoPlayer?.pause()
        DebugLogger.audio("Pause")
    }

    fun togglePlayPause() {
        exoPlayer?.let { player ->
            if (player.isPlaying) {
                player.pause()
            } else {
                player.play()
            }
        }
    }

    fun stop() {
        stopProgressUpdates()
        exoPlayer?.stop()
        exoPlayer?.clearMediaItems()
        _isPlaying.value = false
        _currentTime.value = 0L
        _duration.value = 0L
        DebugLogger.audio("Stop")
    }

    fun seekTo(positionMs: Long) {
        exoPlayer?.seekTo(positionMs)
        _currentTime.value = positionMs
        DebugLogger.audio("Seek to: ${positionMs}ms")
    }

    fun seekToPercent(percent: Float) {
        val position = (_duration.value * percent).toLong()
        seekTo(position)
    }

    // ========== Settings ==========

    fun setVolume(volume: Float) {
        val clampedVolume = volume.coerceIn(0f, 1f)
        _settings.value = _settings.value.copy(volume = clampedVolume)
        exoPlayer?.volume = clampedVolume
        DebugLogger.audio("Volume set to: $clampedVolume")
    }

    fun setAutoPlay(autoPlay: Boolean) {
        _settings.value = _settings.value.copy(autoPlay = autoPlay)
    }

    fun updateSettings(settings: AudioSettings) {
        _settings.value = settings
        exoPlayer?.volume = settings.volume
    }

    // ========== Progress Updates ==========

    private fun startProgressUpdates() {
        stopProgressUpdates()
        progressJob = scope.launch {
            while (isActive) {
                exoPlayer?.let { player ->
                    _currentTime.value = player.currentPosition
                }
                delay(Constants.Audio.PROGRESS_UPDATE_INTERVAL_MS)
            }
        }
    }

    private fun stopProgressUpdates() {
        progressJob?.cancel()
        progressJob = null
    }

    // ========== Cleanup ==========

    fun release() {
        stopProgressUpdates()
        exoPlayer?.removeListener(playerListener)
        exoPlayer?.release()
        exoPlayer = null
        DebugLogger.audio("ExoPlayer released")
    }

    // ========== Utility ==========

    fun resetFinishedFlag() {
        _didFinishPlaying.value = false
    }

    val progress: Float
        get() {
            val dur = _duration.value
            return if (dur > 0) {
                (_currentTime.value.toFloat() / dur.toFloat()).coerceIn(0f, 1f)
            } else 0f
        }

    fun formatTime(timeMs: Long): String {
        val totalSeconds = timeMs / 1000
        val minutes = totalSeconds / 60
        val seconds = totalSeconds % 60
        return "%d:%02d".format(minutes, seconds)
    }
}
