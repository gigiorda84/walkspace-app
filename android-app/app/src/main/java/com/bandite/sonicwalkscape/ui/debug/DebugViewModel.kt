package com.bandite.sonicwalkscape.ui.debug

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.LocationManager
import android.os.Build
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModel
import com.bandite.sonicwalkscape.services.AudioPlayerManager
import com.bandite.sonicwalkscape.utils.CrashHandler
import com.bandite.sonicwalkscape.utils.DebugLogger
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

data class DebugState(
    val deviceModel: String = "",
    val androidVersion: String = "",
    val appVersion: String = "",
    val appVersionCode: String = "",
    val locationPermission: String = "",
    val gpsEnabled: Boolean = false,
    val audioState: String = "",
    val logs: List<DebugLogger.LogEntry> = emptyList(),
    val crashText: String = "",
    val crashCount: Int = 0
)

@HiltViewModel
class DebugViewModel @Inject constructor(
    @ApplicationContext private val context: Context,
    private val audioPlayerManager: AudioPlayerManager
) : ViewModel() {

    private val _state = MutableStateFlow(DebugState())
    val state: StateFlow<DebugState> = _state.asStateFlow()

    fun refresh() {
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

        val fineLocation = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        val backgroundLocation = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_BACKGROUND_LOCATION
        ) == PackageManager.PERMISSION_GRANTED

        val permissionText = when {
            backgroundLocation -> "Fine + Background"
            fineLocation -> "Fine only (no background)"
            else -> "DENIED"
        }

        val isPlaying = audioPlayerManager.isPlaying.value
        val position = audioPlayerManager.currentPosition.value
        val duration = audioPlayerManager.duration.value
        val audioState = if (duration > 0L) {
            "${if (isPlaying) "Playing" else "Paused"} ${formatMs(position)}/${formatMs(duration)}"
        } else {
            "No audio loaded"
        }

        val crashFiles = CrashHandler.getCrashFiles(context)

        _state.value = DebugState(
            deviceModel = "${Build.MANUFACTURER} ${Build.MODEL}",
            androidVersion = "${Build.VERSION.RELEASE} (SDK ${Build.VERSION.SDK_INT})",
            appVersion = getAppVersion(),
            appVersionCode = getAppVersionCode(),
            locationPermission = permissionText,
            gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER),
            audioState = audioState,
            logs = DebugLogger.getRecentLogs().reversed(),
            crashText = CrashHandler.getAllCrashText(context),
            crashCount = crashFiles.size
        )
    }

    fun getExportText(): String {
        val s = _state.value
        val sb = StringBuilder()
        sb.appendLine("=== Sonic Walkscape Debug Report ===")
        sb.appendLine("Device: ${s.deviceModel}")
        sb.appendLine("Android: ${s.androidVersion}")
        sb.appendLine("App: ${s.appVersion} (${s.appVersionCode})")
        sb.appendLine("Location permission: ${s.locationPermission}")
        sb.appendLine("GPS enabled: ${s.gpsEnabled}")
        sb.appendLine("Audio: ${s.audioState}")
        sb.appendLine()
        sb.appendLine("=== Recent Logs (${s.logs.size} entries) ===")
        sb.appendLine(DebugLogger.getLogsAsText())
        if (s.crashText.isNotEmpty()) {
            sb.appendLine()
            sb.appendLine("=== Crash Logs ===")
            sb.appendLine(s.crashText)
        }
        return sb.toString()
    }

    fun clearCrashes() {
        CrashHandler.clearCrashes(context)
        refresh()
    }

    fun clearLogs() {
        DebugLogger.clearLogs()
        refresh()
    }

    private fun getAppVersion(): String {
        return try {
            context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "?"
        } catch (_: Exception) { "?" }
    }

    private fun getAppVersionCode(): String {
        return try {
            context.packageManager.getPackageInfo(context.packageName, 0).longVersionCode.toString()
        } catch (_: Exception) { "?" }
    }

    private fun formatMs(ms: Long): String {
        val s = ms / 1000
        return "${s / 60}:${String.format("%02d", s % 60)}"
    }
}
