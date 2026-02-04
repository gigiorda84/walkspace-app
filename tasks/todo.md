# Fix Gson/R8 ParameterizedType Error - Round 2

## Problem
The Android app shows error on the Discover screen:
```
java.lang.Class cannot be cast to java.lang.reflect.ParameterizedType
```

This persists in version 1.0.6 even after adding initial ProGuard rules.

## Root Cause Analysis

The error occurs in Gson's reflection code when deserializing generic types. The current ProGuard rules preserve:
- `Signature` attribute
- `*Annotation*` attributes
- Model classes

But they're missing **critical attributes** for inner classes and Kotlin reflection:
- `InnerClasses` - Required for nested classes like `TourManifest.AudioFile`, `TourPoint.Location`
- `EnclosingMethod` - Required for anonymous classes and lambdas
- Proper Kotlin metadata preservation

The `Tour` class has `Map<String, String>` fields. When Gson deserializes these with R8 minification, it needs full type information. R8's aggressive optimization can strip inner class relationships, causing the ParameterizedType cast to fail.

## Tasks

- [x] 1. Add `-keepattributes InnerClasses` and `-keepattributes EnclosingMethod` to ProGuard rules
- [x] 2. Add explicit keep rules for all nested/inner classes in data models
- [x] 3. Bump version to 1.0.7 for testing
- [x] 4. Build and install on device
- [ ] 5. User testing - verify Discovery page loads tours

## Changes Made

### proguard-rules.pro
- Added `-keepattributes InnerClasses` - preserves inner class metadata
- Added `-keepattributes EnclosingMethod` - preserves enclosing method metadata
- Added `-keep class com.bandite.sonicwalkscape.data.models.**$* { *; }` - explicitly keeps all nested classes
- Added `-keepclassmembers` rule for `@SerializedName` fields

### build.gradle.kts
- Bumped versionCode from 6 to 7
- Bumped versionName from "1.0.6" to "1.0.7"

## Status
App v1.0.7 installed on device. Awaiting user testing.
