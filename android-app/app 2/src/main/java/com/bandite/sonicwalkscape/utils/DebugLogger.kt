package com.bandite.sonicwalkscape.utils

import android.util.Log
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Categorized debug logger with timestamps
 */
object DebugLogger {

    private const val TAG = "SonicWalkscape"
    private val dateFormat = SimpleDateFormat("HH:mm:ss.SSS", Locale.US)

    enum class Category(val emoji: String) {
        GPS("📍"),
        AUDIO("🔊"),
        NETWORK("🌐"),
        DOWNLOAD("📥"),
        WARNING("⚠️"),
        ERROR("❌"),
        SUCCESS("✅"),
        INFO("ℹ️")
    }

    private fun timestamp(): String = dateFormat.format(Date())

    private fun log(category: Category, message: String) {
        val formattedMessage = "[${timestamp()}] ${category.emoji} $message"
        when (category) {
            Category.ERROR -> Log.e(TAG, formattedMessage)
            Category.WARNING -> Log.w(TAG, formattedMessage)
            else -> Log.d(TAG, formattedMessage)
        }
    }

    fun gps(message: String) = log(Category.GPS, message)

    fun audio(message: String) = log(Category.AUDIO, message)

    fun network(message: String) = log(Category.NETWORK, message)

    fun download(message: String) = log(Category.DOWNLOAD, message)

    fun warning(message: String) = log(Category.WARNING, message)

    fun error(message: String) = log(Category.ERROR, message)

    fun error(message: String, throwable: Throwable) {
        log(Category.ERROR, "$message: ${throwable.message}")
        Log.e(TAG, message, throwable)
    }

    fun success(message: String) = log(Category.SUCCESS, message)

    fun info(message: String) = log(Category.INFO, message)
}
