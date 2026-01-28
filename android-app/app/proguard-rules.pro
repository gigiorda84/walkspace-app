# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /sdk/tools/proguard/proguard-android.txt

# Keep data classes for Gson
-keepclassmembers class com.bandite.sonicwalkscape.data.models.** {
    *;
}

# Keep Retrofit interfaces
-keepattributes Signature
-keepattributes Exceptions

# Keep Hilt
-keepnames @dagger.hilt.android.lifecycle.HiltViewModel class * extends androidx.lifecycle.ViewModel
