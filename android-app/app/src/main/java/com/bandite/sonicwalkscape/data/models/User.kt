package com.bandite.sonicwalkscape.data.models

data class User(
    val id: String,
    val email: String,
    val name: String? = null,
    val preferredLanguage: String = "en",
    val mailingListOptIn: Boolean = false
)

data class AuthResponse(
    val user: User,
    val tokens: Tokens
)

data class Tokens(
    val accessToken: String,
    val refreshToken: String
)
