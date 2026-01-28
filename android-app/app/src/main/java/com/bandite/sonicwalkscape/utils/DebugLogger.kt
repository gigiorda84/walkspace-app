package com.bandite.sonicwalkscape.utils

import android.util.Log
import com.bandite.sonicwalkscape.BuildConfig

object DebugLogger {
    private const val TAG = "SonicWalkscape"

    var isEnabled: Boolean = BuildConfig.DEBUG

    fun d(message: String, tag: String = TAG) {
        if (isEnabled) {
            Log.d(tag, message)
        }
    }

    fun i(message: String, tag: String = TAG) {
        if (isEnabled) {
            Log.i(tag, message)
        }
    }

    fun w(message: String, tag: String = TAG) {
        if (isEnabled) {
            Log.w(tag, message)
        }
    }

    fun e(message: String, throwable: Throwable? = null, tag: String = TAG) {
        if (isEnabled) {
            if (throwable != null) {
                Log.e(tag, message, throwable)
            } else {
                Log.e(tag, message)
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
