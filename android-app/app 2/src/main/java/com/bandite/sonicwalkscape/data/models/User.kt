package com.bandite.sonicwalkscape.data.models

data class User(
    val id: String,
    val email: String,
    val name: String?,
    val profileImageUrl: String?,
    val preferences: UserPreferences,
    val createdAt: String
)

data class UserPreferences(
    val preferredLanguage: String = "en",
    val notificationsEnabled: Boolean = true,
    val analyticsEnabled: Boolean = true
)
