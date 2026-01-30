package com.bandite.sonicwalkscape.services

import android.content.Context
import android.os.Build
import com.bandite.sonicwalkscape.data.api.AnalyticsEvent
import com.bandite.sonicwalkscape.data.api.AnalyticsEventsRequest
import com.bandite.sonicwalkscape.data.api.ApiClient
import com.bandite.sonicwalkscape.utils.Constants
import com.bandite.sonicwalkscape.utils.DebugLogger
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AnalyticsService @Inject constructor(
    @ApplicationContext private val context: Context,
    private val apiClient: ApiClient,
    private val preferencesManager: UserPreferencesManager
) {
    private val scope = CoroutineScope(Dispatchers.IO)
    private val pendingEvents = mutableListOf<AnalyticsEvent>()
    private var flushJob: Job? = null
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)

    // Anonymous ID (persisted)
    private val anonymousId: String by lazy {
        val prefs = context.getSharedPreferences("analytics", Context.MODE_PRIVATE)
        prefs.getString(Constants.Analytics.ANONYMOUS_ID_KEY, null) ?: run {
            val newId = UUID.randomUUID().toString()
            prefs.edit().putString(Constants.Analytics.ANONYMOUS_ID_KEY, newId).apply()
            newId
        }
    }

    // Event types
    object Events {
        const val TOUR_STARTED = "tour_started"
        const val POINT_TRIGGERED = "point_triggered"
        const val TOUR_COMPLETED = "tour_completed"
        const val TOUR_ABANDONED = "tour_abandoned"
        const val FOLLOW_US_CLICKED = "follow_us_clicked"
        const val CONTACT_CLICKED = "contact_clicked"
        const val DONATION_LINK_CLICKED = "donation_link_clicked"
    }

    init {
        startAutoFlush()
    }

    // ========== Event Tracking ==========

    fun trackTourStarted(tourId: String, language: String, triggerType: String) {
        track(
            Events.TOUR_STARTED,
            mapOf(
                "tourId" to tourId,
                "language" to language,
                "triggerType" to triggerType
            )
        )
    }

    fun trackPointTriggered(tourId: String, pointId: String, triggerType: String) {
        track(
            Events.POINT_TRIGGERED,
            mapOf(
                "tourId" to tourId,
                "pointId" to pointId,
                "triggerType" to triggerType
            )
        )
    }

    fun trackTourCompleted(tourId: String, durationMinutes: Int, triggerType: String) {
        track(
            Events.TOUR_COMPLETED,
            mapOf(
                "tourId" to tourId,
                "durationMinutes" to durationMinutes,
                "triggerType" to triggerType
            )
        )
    }

    fun trackTourAbandoned(tourId: String, durationMinutes: Int, lastPointIndex: Int) {
        track(
            Events.TOUR_ABANDONED,
            mapOf(
                "tourId" to tourId,
                "durationMinutes" to durationMinutes,
                "lastPointIndex" to lastPointIndex
            )
        )
    }

    fun trackFollowUsClicked(tourId: String) {
        track(Events.FOLLOW_US_CLICKED, mapOf("tourId" to tourId))
    }

    fun trackContactClicked(tourId: String, channel: String) {
        track(
            Events.CONTACT_CLICKED,
            mapOf(
                "tourId" to tourId,
                "channel" to channel
            )
        )
    }

    fun trackDonationLinkClicked(tourId: String) {
        track(Events.DONATION_LINK_CLICKED, mapOf("tourId" to tourId))
    }

    // ========== Core Tracking ==========

    private fun track(eventName: String, properties: Map<String, Any?>) {
        scope.launch {
            // Check consent
            if (!preferencesManager.analyticsEnabled.first()) {
                DebugLogger.info("Analytics disabled - dropping event: $eventName")
                return@launch
            }

            val event = AnalyticsEvent(
                eventName = eventName,
                anonymousId = anonymousId,
                timestamp = dateFormat.format(Date()),
                properties = properties + getDefaultProperties()
            )

            synchronized(pendingEvents) {
                pendingEvents.add(event)
                DebugLogger.info("Queued analytics event: $eventName")

                // Flush if batch is full
                if (pendingEvents.size >= Constants.Analytics.MAX_BATCH_SIZE) {
                    flushEvents()
                }
            }
        }
    }

    private fun getDefaultProperties(): Map<String, Any> {
        return mapOf(
            "platform" to "android",
            "device" to Build.MODEL,
            "osVersion" to "Android ${Build.VERSION.RELEASE}",
            "appVersion" to getAppVersion()
        )
    }

    private fun getAppVersion(): String {
        return try {
            val packageInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            packageInfo.versionName ?: "unknown"
        } catch (e: Exception) {
            "unknown"
        }
    }

    // ========== Batch Submission ==========

    private fun startAutoFlush() {
        flushJob?.cancel()
        flushJob = scope.launch {
            while (isActive) {
                delay(Constants.Analytics.FLUSH_INTERVAL_SECONDS * 1000)
                flushEvents()
            }
        }
    }

    fun flushEvents() {
        scope.launch {
            val eventsToSend: List<AnalyticsEvent>
            synchronized(pendingEvents) {
                if (pendingEvents.isEmpty()) return@launch
                eventsToSend = pendingEvents.toList()
                pendingEvents.clear()
            }

            try {
                val response = apiClient.apiService.submitAnalyticsEvents(
                    AnalyticsEventsRequest(eventsToSend)
                )

                if (response.isSuccessful) {
                    DebugLogger.info("Submitted ${eventsToSend.size} analytics events")
                } else {
                    // Re-queue events on failure
                    synchronized(pendingEvents) {
                        pendingEvents.addAll(0, eventsToSend)
                    }
                    DebugLogger.warning("Failed to submit analytics: ${response.code()}")
                }
            } catch (e: Exception) {
                // Re-queue events on error
                synchronized(pendingEvents) {
                    pendingEvents.addAll(0, eventsToSend)
                }
                DebugLogger.error("Analytics submission error", e)
            }
        }
    }

    fun clearPendingEvents() {
        synchronized(pendingEvents) {
            pendingEvents.clear()
        }
    }
}
