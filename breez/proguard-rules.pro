# ========================
# EAS + REACT NATIVE PROGUARD
# ========================

# Основные настройки
-dontobfuscate
-dontoptimize
-verbose

# React Native - ОБЯЗАТЕЛЬНЫЕ ПРАВИЛА
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Нативные методы
-keepclasseswithmembers class * {
    native <methods>;
}

# JavaScript модули
-keep class * extends com.facebook.react.bridge.JavaScriptModule { *; }

# View менеджеры
-keep class com.facebook.react.uimanager.** { *; }
-keep class * extends com.facebook.react.uimanager.ViewManager

# Expo модули
-keep class expo.modules.** { *; }
-keep class org.unimodules.** { *; }

# Ваше приложение
-keep class host.exp.exponent.** { *; }
-keep class com.warehouseapp.** { *; }

# React Navigation
-keep class com.swmansion.** { *; }

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# Классы с аннотациями React
-keepclasseswithmembers class * {
    @com.facebook.react.uimanager.annotations.ReactProp <methods>;
}
-keepclasseswithmembers class * {
    @com.facebook.react.uimanager.annotations.ReactPropGroup <methods>;
}