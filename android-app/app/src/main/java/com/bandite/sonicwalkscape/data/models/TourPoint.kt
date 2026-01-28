package com.bandite.sonicwalkscape.data.models

data class TourPoint(
    val id: String,
    val order: Int,
    val title: Map<String, String>,
    val description: Map<String, String>,
    val location: Location,
    val triggerRadiusMeters: Int = 150,
    val audioUrl: String? = null,
    val imageUrl: String? = null,
    val subtitleUrl: String? = null
) {
    data class Location(
        val lat: Double,
        val lng: Double
    )

    fun getDisplayTitle(language: String = "en"): String {
        return title[language] ?: title["en"] ?: title.values.firstOrNull() ?: "Point $order"
    }

    fun getDisplayDescription(language: String = "en"): String {
        return description[language] ?: description["en"] ?: description.values.firstOrNull() ?: ""
    }

    fun distanceTo(lat: Double, lng: Double): Float {
        val results = FloatArray(1)
        android.location.Location.distanceBetween(
            location.lat, location.lng,
            lat, lng,
            results
        )
        return results[0]
    }
}
