package com.bandite.sonicwalkscape.services

import android.annotation.SuppressLint
import android.content.Context
import android.location.Location
import android.os.Looper
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

    private var tourPoints: List<TourPoint> = emptyList()
    private var currentPointIndex: Int = 0
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
        currentPointIndex = 0
        triggeredPoints.clear()
        _nearbyPoint.value = null
        DebugLogger.location("Set ${points.size} tour points")
    }

    @SuppressLint("MissingPermission")
    fun startTracking() {
        if (_isTracking.value) return

        fusedLocationClient.requestLocationUpdates(
            locationRequest,
            locationCallback,
            Looper.getMainLooper()
        )
        _isTracking.value = true
        DebugLogger.location("Started location tracking")
    }

    fun stopTracking() {
        fusedLocationClient.removeLocationUpdates(locationCallback)
        _isTracking.value = false
        DebugLogger.location("Stopped location tracking")
    }

    private fun checkSequentialPointProximity(location: Location) {
        if (tourPoints.isEmpty()) return
        if (currentPointIndex >= tourPoints.size) return

        val currentPoint = tourPoints[currentPointIndex]
        val distance = currentPoint.distanceTo(location.latitude, location.longitude)

        DebugLogger.location(
            "Distance to point ${currentPoint.order}: ${distance}m (trigger: ${currentPoint.triggerRadiusMeters}m)"
        )

        if (distance <= currentPoint.triggerRadiusMeters) {
            if (!triggeredPoints.contains(currentPoint.id)) {
                triggeredPoints.add(currentPoint.id)
                _nearbyPoint.value = currentPoint
                onPointTriggered?.invoke(currentPoint)
                DebugLogger.location("Triggered point ${currentPoint.order}: ${currentPoint.getDisplayTitle()}")
            }
        }
    }

    fun advanceToNextPoint() {
        if (currentPointIndex < tourPoints.size - 1) {
            currentPointIndex++
            _nearbyPoint.value = null
            DebugLogger.location("Advanced to point ${currentPointIndex + 1}")
        }
    }

    fun resetProgress() {
        currentPointIndex = 0
        triggeredPoints.clear()
        _nearbyPoint.value = null
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
        get() = if (tourPoints.isEmpty()) 0f else currentPointIndex.toFloat() / tourPoints.size

    val remainingPoints: Int
        get() = (tourPoints.size - currentPointIndex).coerceAtLeast(0)

    val hasMorePoints: Boolean
        get() = currentPointIndex < tourPoints.size - 1
}
