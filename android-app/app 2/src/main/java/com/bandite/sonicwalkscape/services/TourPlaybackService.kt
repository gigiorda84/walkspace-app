package com.bandite.sonicwalkscape.services

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.os.Binder
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.bandite.sonicwalkscape.MainActivity
import com.bandite.sonicwalkscape.R
import com.bandite.sonicwalkscape.SonicWalkscapeApp
import com.bandite.sonicwalkscape.data.models.TourPoint
import com.bandite.sonicwalkscape.utils.DebugLogger
import dagger.hilt.android.AndroidEntryPoint
import javax.inject.Inject

@AndroidEntryPoint
class TourPlaybackService : Service() {

    @Inject
    lateinit var locationManager: LocationManager

    @Inject
    lateinit var audioPlayerManager: AudioPlayerManager

    private val binder = LocalBinder()
    private var currentTourId: String? = null
    private var currentPointTitle: String? = null

    inner class LocalBinder : Binder() {
        fun getService(): TourPlaybackService = this@TourPlaybackService
    }

    override fun onBind(intent: Intent): IBinder {
        return binder
    }

    override fun onCreate() {
        super.onCreate()
        DebugLogger.info("TourPlaybackService created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> {
                currentTourId = intent.getStringExtra(EXTRA_TOUR_ID)
                startForegroundService()
                startLocationTracking()
            }
            ACTION_STOP -> {
                stopTourPlayback()
            }
            ACTION_UPDATE_NOTIFICATION -> {
                val pointTitle = intent.getStringExtra(EXTRA_POINT_TITLE)
                val pointNumber = intent.getIntExtra(EXTRA_POINT_NUMBER, 0)
                updateNotification(pointNumber, pointTitle)
            }
        }
        return START_STICKY
    }

    private fun startForegroundService() {
        val notification = createNotification(0, null)
        startForeground(SonicWalkscapeApp.PLAYBACK_NOTIFICATION_ID, notification)
        DebugLogger.info("Foreground service started")
    }

    private fun startLocationTracking() {
        locationManager.startTracking()
    }

    private fun stopTourPlayback() {
        locationManager.stopTracking()
        audioPlayerManager.stop()
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
        DebugLogger.info("Tour playback stopped")
    }

    private fun updateNotification(pointNumber: Int, pointTitle: String?) {
        currentPointTitle = pointTitle
        val notification = createNotification(pointNumber, pointTitle)
        val notificationManager = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
        notificationManager.notify(SonicWalkscapeApp.PLAYBACK_NOTIFICATION_ID, notification)
    }

    private fun createNotification(pointNumber: Int, pointTitle: String?): Notification {
        val contentIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            contentIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, TourPlaybackService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val contentText = if (pointNumber > 0 && pointTitle != null) {
            getString(R.string.notification_point, pointNumber, pointTitle)
        } else {
            getString(R.string.notification_tour_active)
        }

        return NotificationCompat.Builder(this, SonicWalkscapeApp.PLAYBACK_CHANNEL_ID)
            .setContentTitle(getString(R.string.app_name))
            .setContentText(contentText)
            .setSmallIcon(R.drawable.ic_notification)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .addAction(
                R.drawable.ic_stop,
                getString(R.string.player_exit_confirm),
                stopPendingIntent
            )
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    override fun onDestroy() {
        super.onDestroy()
        locationManager.stopTracking()
        DebugLogger.info("TourPlaybackService destroyed")
    }

    companion object {
        const val ACTION_START = "com.bandite.sonicwalkscape.ACTION_START"
        const val ACTION_STOP = "com.bandite.sonicwalkscape.ACTION_STOP"
        const val ACTION_UPDATE_NOTIFICATION = "com.bandite.sonicwalkscape.ACTION_UPDATE_NOTIFICATION"

        const val EXTRA_TOUR_ID = "tour_id"
        const val EXTRA_POINT_TITLE = "point_title"
        const val EXTRA_POINT_NUMBER = "point_number"
    }
}
