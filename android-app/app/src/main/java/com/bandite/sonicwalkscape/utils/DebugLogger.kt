package com.bandite.sonicwalkscape.utils

import android.util.Log
import java.text.SimpleDateFormat
import java.util.*

object DebugLogger {
    private const val TAG = "SonicWalkscape"
    private const val MAX_LOG_ENTRIES = 500

    // Always enabled for closed testing builds
    var isEnabled: Boolean = true

    private val logBuffer = ArrayDeque<LogEntry>(MAX_LOG_ENTRIES)
    private val dateFormat = SimpleDateFormat("HH:mm:ss.SSS", Locale.US)

    data class LogEntry(
        val timestamp: Long,
        val level: String,
        val category: String,
        val message: String
    ) {
        fun formatted(): String {
            val time = SimpleDateFormat("HH:mm:ss.SSS", Locale.US).format(Date(timestamp))
            return "$time [$level] $category $message"
        }
    }

    private fun addToBuffer(level: String, category: String, message: String) {
        synchronized(logBuffer) {
            if (logBuffer.size >= MAX_LOG_ENTRIES) {
                logBuffer.removeFirst()
            }
            logBuffer.addLast(LogEntry(System.currentTimeMillis(), level, category, message))
        }
    }

    fun getRecentLogs(): List<LogEntry> {
        synchronized(logBuffer) {
            return logBuffer.toList()
        }
    }

    fun getLogsAsText(): String {
        return getRecentLogs().joinToString("\n") { it.formatted() }
    }

    fun clearLogs() {
        synchronized(logBuffer) {
            logBuffer.clear()
        }
    }

    fun d(message: String, tag: String = TAG) {
        if (isEnabled) {
            Log.d(tag, message)
            addToBuffer("D", tag, message)
        }
    }

    fun i(message: String, tag: String = TAG) {
        if (isEnabled) {
            Log.i(tag, message)
            addToBuffer("I", tag, message)
        }
    }

    fun w(message: String, tag: String = TAG) {
        if (isEnabled) {
            Log.w(tag, message)
            addToBuffer("W", tag, message)
        }
    }

    fun e(message: String, throwable: Throwable? = null, tag: String = TAG) {
        if (isEnabled) {
            if (throwable != null) {
                Log.e(tag, message, throwable)
                addToBuffer("E", tag, "$message: ${throwable.message}")
            } else {
                Log.e(tag, message)
                addToBuffer("E", tag, message)
            }
        }
    }

    fun location(message: String) {
        d("[LOCATION] $message")
    }

    fun audio(message: String) {
        d("[AUDIO] $message")
    }

    fun network(message: String) {
        d("[NETWORK] $message")
    }

    fun analytics(message: String) {
        d("[ANALYTICS] $message")
    }
}
