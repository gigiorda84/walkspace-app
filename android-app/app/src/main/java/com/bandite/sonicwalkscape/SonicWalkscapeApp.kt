package com.bandite.sonicwalkscape

import android.app.Application
import androidx.lifecycle.DefaultLifecycleObserver
import androidx.lifecycle.LifecycleOwner
import androidx.lifecycle.ProcessLifecycleOwner
import com.bandite.sonicwalkscape.services.AnalyticsService
import com.bandite.sonicwalkscape.utils.CrashHandler
import dagger.hilt.android.HiltAndroidApp
import javax.inject.Inject

@HiltAndroidApp
class SonicWalkscapeApp : Application() {

    @Inject lateinit var analyticsService: AnalyticsService

    override fun onCreate() {
        super.onCreate()
        CrashHandler(this).install()

        ProcessLifecycleOwner.get().lifecycle.addObserver(object : DefaultLifecycleObserver {
            override fun onStop(owner: LifecycleOwner) {
                analyticsService.shutdown()
            }
        })
    }
}
