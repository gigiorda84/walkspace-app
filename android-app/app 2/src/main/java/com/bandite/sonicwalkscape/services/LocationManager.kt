package com.bandite.sonicwalkscape.services

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.os.Looper
import androidx.core.content.ContextCompat
import com.bandite.sonicwalkscape.data.models.TourPoint
import com.bandite.sonicwalkscape.utils.Constants
import com.bandite.sonicwalkscape.utils.DebugLogger
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LocationManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    // State
    private val _currentLocation = MutableStateFlow<Location?>(null)
    val currentLocation: StateFlow<Location?> = _currentLocation.asStateFlow()

    private val _nearbyPoint = MutableStateFlow<TourPoint?>(null)
    val nearbyPoint: StateFlow<TourPoint?> = _nearbyPoint.asStateFlow()

    private val _currentPointIndex = MutableStateFlow(0)
    val currentPointIndex: StateFlow<Int> = _currentPointIndex.asStateFlow()

    private val _distanceToNextPoint = MutableStateFlow<Float?>(null)
    val distanceToNextPoint: StateFlow<Float?> = _distanceToNextPoint.asStateFlow()

    private val _isPointActive = MutableStateFlow(false)
    val isPointActive: StateFlow<Boolean> = _isPointActive.asStateFlow()

    private val _nextPointQueued = MutableStateFlow(false)
    val nextPointQueued: StateFlow<Boolean> = _nextPointQueued.asStateFlow()

    // Internal state
    private var tourPoints: List<TourPoint> = emptyList()
    private val triggeredPoints = mutableSetOf<String>()
    private var isTracking = false

    // Callback for point triggers
    var onPointTriggered: ((TourPoint) -> Unit)? = null

    private val locationRequest = LocationRequest.Builder(
        Priority.PRIORITY_HIGH_ACCURACY,
        Constants.Location.UPDATE_INTERVAL_MS
    ).apply {
        setMinUpdateIntervalMillis(Constants.Location.FASTEST_UPDATE_INTERVAL_MS)
        setMinUpdateDistanceMeters(Constants.Location.DISTANCE_FILTER_METERS)
    }.build()

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            result.lastLocation?.let { location ->
                _currentLocation.value = location
                checkSequentialPointProximity(location)
                DebugLogger.gps("Location update: ${location.latitude}, ${location.longitude} (accuracy: ${location.accuracy}m)")
            }
        }
    }

    // ========== Permission Checking ==========

    fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    fun hasBackgroundLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_BACKGROUND_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }

    // ========== Tour Points Management ==========

    fun setTourPoints(points: List<TourPoint>) {
        tourPoints = points.sortedBy { it.order }
        triggeredPoints.clear()
        _currentPointIndex.value = 0
        _nearbyPoint.value = null
        _isPointActive.value = false
        _nextPointQueued.value = false
        _distanceToNextPoint.value = null
        DebugLogger.gps("Set ${points.size} tour points")
    }

    fun resetTourProgress() {
        triggeredPoints.clear()
        _currentPointIndex.value = 0
        _nearbyPoint.value = null
        _isPointActive.value = false
        _nextPointQueued.value = false
        _distanceToNextPoint.value = null
        DebugLogger.gps("Reset tour progress")
    }

    // ========== Location Tracking ==========

    @SuppressLint("MissingPermission")
    fun startTracking() {
        if (!hasLocationPermission()) {
            DebugLogger.warning("Location permission not granted")
            return
        }

        if (isTracking) return

        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            Looper.getMainLooper()
        )
        isTracking = true
        DebugLogger.gps("Started location tracking")
    }

    fun stopTracking() {
        if (!isTracking) return

        fusedLocationClient.removeLocationUpdates(locationCallback)
        isTracking = false
        DebugLogger.gps("Stopped location tracking")
    }

    // ========== Sequential Point Proximity Logic ==========

    private fun checkSequentialPointProximity(location: Location) {
        if (tourPoints.isEmpty()) return

        val currentIndex = _currentPointIndex.value
        if (currentIndex >= tourPoints.size) return

        val currentPoint = tourPoints[currentIndex]
        val pointLocation = currentPoint.toAndroidLocation()
        val distance = location.distanceTo(pointLocation)

        _distanceToNextPoint.value = distance

        // Check if within trigger radius
        if (distance <= currentPoint.triggerRadiusMeters) {
            if (!triggeredPoints.contains(currentPoint.id)) {
                // New point triggered
                triggeredPoints.add(currentPoint.id)
                _nearbyPoint.value = currentPoint
                _isPointActive.value = true

                DebugLogger.gps("TRIGGERED point ${currentPoint.order}: ${currentPoint.title} (distance: ${distance.toInt()}m)")
                onPointTriggered?.invoke(currentPoint)
            }

            // Check if next point is also within range (queue it)
            checkNextPointForQueueing(location, currentIndex)
        } else {
            // Outside trigger radius
            if (_isPointActive.value && _nearbyPoint.value?.id == currentPoint.id) {
                // Only deactivate if we haven't moved to next point yet
                // Keep point active while audio is playing
            }
        }
    }

    private fun checkNextPointForQueueing(location: Location, currentIndex: Int) {
        val nextIndex = currentIndex + 1
        if (nextIndex >= tourPoints.size) return

        val nextPoint = tourPoints[nextIndex]
        val nextPointLocation = nextPoint.toAndroidLocation()
        val distanceToNext = location.distanceTo(nextPointLocation)

        if (distanceToNext <= nextPoint.triggerRadiusMeters) {
            if (!_nextPointQueued.value) {
                _nextPointQueued.value = true
                DebugLogger.gps("QUEUED next point ${nextPoint.order}: ${nextPoint.title}")
            }
        }
    }

    // ========== Point Advancement ==========

    fun advanceToNextPoint() {
        val wasQueued = _nextPointQueued.value
        val currentIndex = _currentPointIndex.value
        val nextIndex = currentIndex + 1

        if (nextIndex >= tourPoints.size) {
            DebugLogger.gps("Tour complete - no more points")
            _isPointActive.value = false
            _nearbyPoint.value = null
            return
        }

        _currentPointIndex.value = nextIndex
        _nextPointQueued.value = false
        _isPointActive.value = false

        DebugLogger.gps("Advanced to point index $nextIndex")

        // If next point was queued (user already there), trigger it immediately
        if (wasQueued) {
            val nextPoint = tourPoints[nextIndex]
            if (!triggeredPoints.contains(nextPoint.id)) {
                triggeredPoints.add(nextPoint.id)
                _nearbyPoint.value = nextPoint
                _isPointActive.value = true

                DebugLogger.gps("AUTO-TRIGGERED from queue: point ${nextPoint.order}")
                onPointTriggered?.invoke(nextPoint)
            }
        }
    }

    // ========== Utility ==========

    fun getCurrentPoint(): TourPoint? {
        val index = _currentPointIndex.value
        return if (index < tourPoints.size) tourPoints[index] else null
    }

    fun getTotalPoints(): Int = tourPoints.size

    fun isLastPoint(): Boolean = _currentPointIndex.value >= tourPoints.size - 1

    fun getTriggeredPointsCount(): Int = triggeredPoints.size
}
