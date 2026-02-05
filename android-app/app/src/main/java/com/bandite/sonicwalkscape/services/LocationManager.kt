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
import com.google.android.gms.location.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class LocationManager(private val context: Context) {

    private val fusedLocationClient: FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    private val _currentLocation = MutableStateFlow<Location?>(null)
    val currentLocation: StateFlow<Location?> = _currentLocation.asStateFlow()

    private val _nearbyPoint = MutableStateFlow<TourPoint?>(null)
    val nearbyPoint: StateFlow<TourPoint?> = _nearbyPoint.asStateFlow()

    private val _isTracking = MutableStateFlow(false)
    val isTracking: StateFlow<Boolean> = _isTracking.asStateFlow()

    private val _currentPointIndex = MutableStateFlow(0)
    val currentPointIndex: StateFlow<Int> = _currentPointIndex.asStateFlow()

    private val _distanceToNextPoint = MutableStateFlow(0f)
    val distanceToNextPoint: StateFlow<Float> = _distanceToNextPoint.asStateFlow()

    private val _nextPointQueued = MutableStateFlow(false)
    val nextPointQueued: StateFlow<Boolean> = _nextPointQueued.asStateFlow()

    private var tourPoints: List<TourPoint> = emptyList()
    private val triggeredPoints = mutableSetOf<String>()

    var onPointTriggered: ((TourPoint) -> Unit)? = null

    private val locationRequest = LocationRequest.Builder(
        Priority.PRIORITY_HIGH_ACCURACY,
        Constants.LOCATION_UPDATE_INTERVAL_MS
    ).apply {
        setMinUpdateIntervalMillis(Constants.LOCATION_FASTEST_INTERVAL_MS)
        setMinUpdateDistanceMeters(Constants.LOCATION_MIN_DISPLACEMENT_METERS)
    }.build()

    private val locationCallback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            result.lastLocation?.let { location ->
                _currentLocation.value = location
                checkSequentialPointProximity(location)
            }
        }
    }

    fun setTourPoints(points: List<TourPoint>) {
        tourPoints = points.sortedBy { it.order }
        _currentPointIndex.value = 0
        triggeredPoints.clear()
        _nearbyPoint.value = null
        _nextPointQueued.value = false
        _distanceToNextPoint.value = 0f
        DebugLogger.location("Set ${points.size} tour points")
    }

    @SuppressLint("MissingPermission")
    fun startTracking() {
        if (_isTracking.value) return

        // Check if location permission is granted
        if (ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            DebugLogger.location("Location permission not granted - cannot start tracking")
            return
        }

        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            Looper.getMainLooper()
        )
        _isTracking.value = true
        DebugLogger.location("Started location tracking")

        // Check initial position immediately (in case user is already inside first point)
        checkInitialPosition()
    }

    @SuppressLint("MissingPermission")
    private fun checkInitialPosition() {
        fusedLocationClient.lastLocation.addOnSuccessListener { location ->
            location?.let {
                DebugLogger.location("Initial position check: ${it.latitude}, ${it.longitude}")
                checkSequentialPointProximity(it)
            }
        }
    }

    fun stopTracking() {
        fusedLocationClient.removeLocationUpdates(locationCallback)
        _isTracking.value = false
        DebugLogger.location("Stopped location tracking")
    }

    private fun checkSequentialPointProximity(location: Location) {
        if (tourPoints.isEmpty()) return
        val pointIndex = _currentPointIndex.value
        if (pointIndex >= tourPoints.size) return

        val currentPoint = tourPoints[pointIndex]
        val distance = currentPoint.distanceTo(location.latitude, location.longitude)
        _distanceToNextPoint.value = distance

        DebugLogger.location(
            "Distance to point ${currentPoint.order}: ${distance.toInt()}m (trigger: ${currentPoint.triggerRadiusMeters}m)"
        )

        if (distance <= currentPoint.triggerRadiusMeters) {
            if (!triggeredPoints.contains(currentPoint.id)) {
                triggeredPoints.add(currentPoint.id)
                _nearbyPoint.value = currentPoint
                onPointTriggered?.invoke(currentPoint)
                DebugLogger.location("Triggered point ${currentPoint.order}: ${currentPoint.getDisplayTitle()}")
            }
        }

        // Also check if user entered the NEXT point's radius (queue it for when current audio finishes)
        val nextIndex = pointIndex + 1
        if (nextIndex < tourPoints.size) {
            val nextPoint = tourPoints[nextIndex]
            val nextDistance = nextPoint.distanceTo(location.latitude, location.longitude)

            if (nextDistance <= nextPoint.triggerRadiusMeters && !_nextPointQueued.value) {
                _nextPointQueued.value = true
                DebugLogger.location("Point ${nextPoint.order} QUEUED at ${nextDistance.toInt()}m (will play after current audio)")
            }
        }
    }

    fun advanceToNextPoint() {
        val pointIndex = _currentPointIndex.value
        if (pointIndex >= tourPoints.size - 1) {
            DebugLogger.location("Tour completed!")
            return
        }

        // Check if next point was queued (user passed through while audio was playing)
        val wasQueued = _nextPointQueued.value

        _currentPointIndex.value = pointIndex + 1
        _nextPointQueued.value = false

        val nextPoint = tourPoints[_currentPointIndex.value]
        DebugLogger.location("Advanced to point ${_currentPointIndex.value + 1}: ${nextPoint.getDisplayTitle()}")

        // If the point was queued, trigger it immediately
        if (wasQueued) {
            triggeredPoints.add(nextPoint.id)
            _nearbyPoint.value = nextPoint
            onPointTriggered?.invoke(nextPoint)
            DebugLogger.location("Point ${nextPoint.order} AUTO-TRIGGERED from queue")
        } else {
            _nearbyPoint.value = null
        }
    }

    fun resetProgress() {
        _currentPointIndex.value = 0
        triggeredPoints.clear()
        _nearbyPoint.value = null
        _nextPointQueued.value = false
        _distanceToNextPoint.value = 0f
    }

    fun setPointIndex(index: Int) {
        if (index < 0 || index >= tourPoints.size) return
        _currentPointIndex.value = index
        triggeredPoints.add(tourPoints[index].id)
        _nearbyPoint.value = null
        _nextPointQueued.value = false
        DebugLogger.location("Set point index to ${index + 1}")
    }

    @SuppressLint("MissingPermission")
    suspend fun getCurrentLocationOnce(): Location? {
        return try {
            val task = fusedLocationClient.lastLocation
            var location: Location? = null
            task.addOnSuccessListener { loc -> location = loc }
            // Wait briefly for result
            kotlinx.coroutines.delay(500)
            location
        } catch (e: Exception) {
            DebugLogger.e("Failed to get current location", e)
            null
        }
    }

    val currentPointProgress: Float
        get() = if (tourPoints.isEmpty()) 0f else _currentPointIndex.value.toFloat() / tourPoints.size

    val remainingPoints: Int
        get() = (tourPoints.size - _currentPointIndex.value).coerceAtLeast(0)

    val hasMorePoints: Boolean
        get() = _currentPointIndex.value < tourPoints.size - 1

    val totalPoints: Int
        get() = tourPoints.size

    fun getTourPoints(): List<TourPoint> = tourPoints
}
