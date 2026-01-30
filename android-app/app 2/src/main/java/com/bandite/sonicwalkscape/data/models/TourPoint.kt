package com.bandite.sonicwalkscape.data.models

import android.location.Location as AndroidLocation
import com.google.android.gms.maps.model.LatLng

data class TourPoint(
    val id: String,
    val order: Int,
    val title: String,
    val description: String,
    val location: Location,
    val triggerRadiusMeters: Double
) {
    // Convenience property for trigger radius
    val triggerRadius: Double
        get() = triggerRadiusMeters

    // Convert to LatLng for Google Maps
    val latLng: LatLng
        get() = LatLng(location.lat, location.lng)

    // Convert to Android Location for distance calculations
    fun toAndroidLocation(): AndroidLocation {
        return AndroidLocation("").apply {
            latitude = location.lat
            longitude = location.lng
        }
    }

    data class Location(
        val lat: Double,
        val lng: Double
    ) {
        fun toLatLng(): LatLng = LatLng(lat, lng)

        fun toAndroidLocation(): AndroidLocation {
            return AndroidLocation("").apply {
                latitude = lat
                longitude = lng
            }
        }
    }
}

// Simple coordinate data class for general use
data class Coordinate(
    val latitude: Double,
    val longitude: Double
) {
    fun toLatLng(): LatLng = LatLng(latitude, longitude)

    fun toAndroidLocation(): AndroidLocation {
        return AndroidLocation("").apply {
            latitude = this@Coordinate.latitude
            longitude = this@Coordinate.longitude
        }
    }

    companion object {
        fun fromLatLng(latLng: LatLng): Coordinate {
            return Coordinate(latLng.latitude, latLng.longitude)
        }

        fun fromAndroidLocation(location: AndroidLocation): Coordinate {
            return Coordinate(location.latitude, location.longitude)
        }
    }
}
