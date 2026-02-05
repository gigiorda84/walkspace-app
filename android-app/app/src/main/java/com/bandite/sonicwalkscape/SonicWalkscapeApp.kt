package com.bandite.sonicwalkscape

import android.app.Application
import com.bandite.sonicwalkscape.utils.CrashHandler
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class SonicWalkscapeApp : Application() {
    override fun onCreate() {
        super.onCreate()
        CrashHandler(this).install()
    }
}
