package com.bandite.sonicwalkscape.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Binder
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.bandite.sonicwalkscape.MainActivity
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.data.models.Tour
import com.bandite.sonicwalkscape.data.models.TourPoint
import com.bandite.sonicwalkscape.utils.Constants
import com.bandite.sonicwalkscape.utils.DebugLogger
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class TourPlaybackService : Service() {

    @Inject lateinit var locationManager: LocationManager
    @Inject lateinit var audioPlayerManager: AudioPlayerManager
    @Inject lateinit var tourDownloadManager: TourDownloadManager

    private val binder = LocalBinder()
    private var currentTour: Tour? = null
    private var currentLanguage: String = "en"

    inner class LocalBinder : Binder() {
        fun getService(): TourPlaybackService = this@TourPlaybackService
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        audioPlayerManager.initialize()

        locationManager.onPointTriggered = { point ->
            playPointAudio(point)
        }

        audioPlayerManager.onPlaybackCompleted = {
            locationManager.advanceToNextPoint()
        }

        DebugLogger.d("TourPlaybackService created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                val notification = createNotification("Tour in progress")
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    startForeground(
                        Constants.NOTIFICATION_ID,
                        notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION or
                                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                    )
                } else {
                    startForeground(Constants.NOTIFICATION_ID, notification)
                }
            }
            ACTION_STOP -> {
                stopSelf()
            }
            ACTION_PAUSE -> {
                audioPlayerManager.pause()
            }
            ACTION_RESUME -> {
                audioPlayerManager.play()
            }
        }
        return START_STICKY
    }

    fun startTour(tour: Tour, language: String) {
        currentTour = tour
        currentLanguage = language
        locationManager.setTourPoints(tour.points ?: emptyList())
        locationManager.startTracking()
        updateNotification("Playing: ${tour.getDisplayTitle(language)}")
        DebugLogger.d("Tour started: ${tour.id}")
    }

    fun stopTour() {
        locationManager.stopTracking()
        audioPlayerManager.stop()
        currentTour = null
        DebugLogger.d("Tour stopped")
    }

    private fun playPointAudio(point: TourPoint) {
        currentTour?.let { tour ->
            val audioFile = tourDownloadManager.getAudioFile(tour.id, point.id)
            if (audioFile != null) {
                audioPlayerManager.playFile(audioFile, point.id)
                updateNotification("Playing: ${point.getDisplayTitle(currentLanguage)}")
            } else {
                // Fallback to streaming if not downloaded
                point.audioUrl?.let { url ->
                    audioPlayerManager.playUrl(url, point.id)
                    updateNotification("Playing: ${point.getDisplayTitle(currentLanguage)}")
                }
            }
        }
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            Constants.NOTIFICATION_CHANNEL_ID,
            Constants.NOTIFICATION_CHANNEL_NAME,
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Tour playback notifications"
            setShowBadge(false)
        }
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.createNotificationChannel(channel)
    }

    private fun createNotification(content: String): Notification {
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, Constants.NOTIFICATION_CHANNEL_ID)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(content)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(content: String) {
        val notification = createNotification(content)
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(Constants.NOTIFICATION_ID, notification)
    }

    override fun onDestroy() {
        stopTour()
        audioPlayerManager.release()
        super.onDestroy()
        DebugLogger.d("TourPlaybackService destroyed")
    }

    companion object {
        const val ACTION_START = "com.bandite.sonicwalkscape.ACTION_START"
        const val ACTION_STOP = "com.bandite.sonicwalkscape.ACTION_STOP"
        const val ACTION_PAUSE = "com.bandite.sonicwalkscape.ACTION_PAUSE"
        const val ACTION_RESUME = "com.bandite.sonicwalkscape.ACTION_RESUME"
    }
}
