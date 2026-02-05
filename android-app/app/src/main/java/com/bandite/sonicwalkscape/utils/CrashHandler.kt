package com.bandite.sonicwalkscape.utils

import android.content.Context
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter
import java.text.SimpleDateFormat
import java.util.*

/**
 * Saves crash stack traces to files for in-app viewing,
 * then re-throws to the default handler so Play Console still sees the crash.
 */
class CrashHandler(private val context: Context) : Thread.UncaughtExceptionHandler {

    private val defaultHandler = Thread.getDefaultUncaughtExceptionHandler()

    fun install() {
        Thread.setDefaultUncaughtExceptionHandler(this)
    }

    override fun uncaughtException(thread: Thread, throwable: Throwable) {
        try {
            saveCrashToFile(throwable)
        } catch (_: Exception) {
            // Don't let our handler cause another crash
        }
        // Re-throw to default handler so Play Console Android Vitals captures it
        defaultHandler?.uncaughtException(thread, throwable)
    }

    private fun saveCrashToFile(throwable: Throwable) {
        val crashDir = File(context.filesDir, "crashes")
        crashDir.mkdirs()

        // Keep only last 10 crash files
        val existing = crashDir.listFiles()?.sortedBy { it.lastModified() } ?: emptyList()
        if (existing.size >= 10) {
            existing.take(existing.size - 9).forEach { it.delete() }
        }

        val timestamp = SimpleDateFormat("yyyy-MM-dd_HH-mm-ss", Locale.US).format(Date())
        val file = File(crashDir, "crash_$timestamp.txt")

        val sw = StringWriter()
        val pw = PrintWriter(sw)
        pw.println("Crash at: ${SimpleDateFormat("yyyy-MM-dd HH:mm:ss", Locale.US).format(Date())}")
        pw.println("Device: ${android.os.Build.MANUFACTURER} ${android.os.Build.MODEL}")
        pw.println("Android: ${android.os.Build.VERSION.RELEASE} (SDK ${android.os.Build.VERSION.SDK_INT})")
        pw.println("App version: ${getAppVersion()}")
        pw.println()
        throwable.printStackTrace(pw)
        pw.flush()

        file.writeText(sw.toString())
    }

    private fun getAppVersion(): String {
        return try {
            val pInfo = context.packageManager.getPackageInfo(context.packageName, 0)
            "${pInfo.versionName} (${pInfo.longVersionCode})"
        } catch (_: Exception) {
            "unknown"
        }
    }

    companion object {
        fun getCrashFiles(context: Context): List<File> {
            val crashDir = File(context.filesDir, "crashes")
            return crashDir.listFiles()?.sortedByDescending { it.lastModified() } ?: emptyList()
        }

        fun getAllCrashText(context: Context): String {
            return getCrashFiles(context).joinToString("\n${"=".repeat(60)}\n") { it.readText() }
        }

        fun clearCrashes(context: Context) {
            val crashDir = File(context.filesDir, "crashes")
            crashDir.listFiles()?.forEach { it.delete() }
        }
    }
}
