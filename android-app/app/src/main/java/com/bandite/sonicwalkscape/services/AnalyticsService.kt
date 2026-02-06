package com.bandite.sonicwalkscape.services

import android.content.Context
import android.os.Build
import com.bandite.sonicwalkscape.data.api.AnalyticsEvent
import com.bandite.sonicwalkscape.data.api.AnalyticsRequest
import com.bandite.sonicwalkscape.data.api.ApiService
import com.bandite.sonicwalkscape.utils.Constants
import com.bandite.sonicwalkscape.utils.DebugLogger
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.first
import java.text.SimpleDateFormat
import java.util.*

class AnalyticsService(
    private val context: Context,
    private val apiService: ApiService,
    private val userPreferencesManager: UserPreferencesManager
) {
    private val eventQueue = mutableListOf<AnalyticsEvent>()
    private companion object { const val MAX_QUEUE_SIZE = 500 }
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var flushJob: Job? = null

    private val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }

    init {
        startPeriodicFlush()
    }

    private fun startPeriodicFlush() {
        flushJob = scope.launch {
            while (isActive) {
                delay(Constants.ANALYTICS_FLUSH_INTERVAL_MS)
                flush()
            }
        }
    }

    suspend fun track(
        eventName: String,
        tourId: String? = null,
        pointId: String? = null,
        properties: Map<String, Any>? = null
    ) {
        val isEnabled = userPreferencesManager.analyticsEnabled.first()
        if (!isEnabled) {
            DebugLogger.analytics("Analytics disabled, skipping: $eventName")
            return
        }

        val anonymousId = userPreferencesManager.ensureAnonymousId()
        val language = userPreferencesManager.preferredLanguage.first()

        val event = AnalyticsEvent(
            name = eventName,
            anonymousId = anonymousId,
            tourId = tourId,
            pointId = pointId,
            language = language,
            device = "${Build.MANUFACTURER} ${Build.MODEL}",
            osVersion = "Android ${Build.VERSION.RELEASE}",
            timestamp = dateFormat.format(Date()),
            properties = properties
        )

        synchronized(eventQueue) {
            if (eventQueue.size >= MAX_QUEUE_SIZE) {
                DebugLogger.analytics("Queue full ($MAX_QUEUE_SIZE), dropping oldest event")
                eventQueue.removeAt(0)
            }
            eventQueue.add(event)
        }

        DebugLogger.analytics("Queued event: $eventName")

        if (eventQueue.size >= Constants.ANALYTICS_BATCH_SIZE) {
            flush()
        }
    }

    suspend fun flush() {
        val eventsToSend: List<AnalyticsEvent>
        synchronized(eventQueue) {
            if (eventQueue.isEmpty()) return
            eventsToSend = eventQueue.toList()
            eventQueue.clear()
        }

        try {
            val response = apiService.sendAnalyticsEvents(AnalyticsRequest(eventsToSend))
            if (response.isSuccessful) {
                DebugLogger.analytics("Sent ${eventsToSend.size} events")
            } else {
                // Re-queue events on failure
                synchronized(eventQueue) {
                    eventQueue.addAll(0, eventsToSend)
                }
                DebugLogger.analytics("Failed to send events: ${response.code()}")
            }
        } catch (e: Exception) {
            // Re-queue events on failure
            synchronized(eventQueue) {
                eventQueue.addAll(0, eventsToSend)
            }
            DebugLogger.e("Analytics send failed", e)
        }
    }

    // Convenience methods for common events
    suspend fun trackAppOpen() = track("app_open")
    suspend fun trackTourViewed(tourId: String) = track("tour_viewed", tourId = tourId)
    suspend fun trackTourDownloadStarted(tourId: String) = track("tour_download_started", tourId = tourId)
    suspend fun trackTourDownloadCompleted(tourId: String) = track("tour_download_completed", tourId = tourId)
    suspend fun trackTourStarted(tourId: String) = track("tour_started", tourId = tourId)
    suspend fun trackPointTriggered(tourId: String, pointId: String) = track("point_triggered", tourId, pointId)
    suspend fun trackTourCompleted(tourId: String) {
        track("tour_completed", tourId = tourId)
        flush()
    }

    fun shutdown() {
        flushJob?.cancel()
        scope.cancel()
    }
}
