package com.kinboard.tv.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.MaterialTheme
import androidx.tv.material3.darkColorScheme

// Custom color scheme for Kinboard TV
@OptIn(ExperimentalTvMaterial3Api::class)
private val KinboardDarkColorScheme = darkColorScheme(
    primary = Primary,
    onPrimary = OnPrimary,
    primaryContainer = PrimaryContainer,
    onPrimaryContainer = OnPrimaryContainer,
    secondary = Secondary,
    onSecondary = OnSecondary,
    secondaryContainer = SecondaryContainer,
    onSecondaryContainer = OnSecondaryContainer,
    tertiary = Tertiary,
    onTertiary = OnTertiary,
    tertiaryContainer = TertiaryContainer,
    onTertiaryContainer = OnTertiaryContainer,
    error = Error,
    onError = OnError,
    errorContainer = ErrorContainer,
    onErrorContainer = OnErrorContainer,
    background = Background,
    onBackground = OnBackground,
    surface = Surface,
    onSurface = OnSurface,
    surfaceVariant = SurfaceVariant,
    onSurfaceVariant = OnSurfaceVariant,
    border = Outline,
    borderVariant = OutlineVariant
)

// Extended colors that aren't part of the standard color scheme
data class ExtendedColors(
    val success: Color = Success,
    val warning: Color = Warning,
    val borderSubtle: Color = BorderSubtle,
    val elevationLevel0: Color = ElevationLevel0,
    val elevationLevel1: Color = ElevationLevel1,
    val elevationLevel2: Color = ElevationLevel2,
    val elevationLevel3: Color = ElevationLevel3,
    val elevationLevel4: Color = ElevationLevel4,
    val elevationLevel5: Color = ElevationLevel5,
    val surfaceDisabled: Color = SurfaceDisabled,
    val onSurfaceDisabled: Color = OnSurfaceDisabled,
    val backdrop: Color = Backdrop,
    val defaultUserColor: Color = DefaultUserColor,
    val unassignedJobsColor: Color = UnassignedJobsColor,
    val focusShadowColor: Color = FocusShadowColor
)

val LocalExtendedColors = staticCompositionLocalOf { ExtendedColors() }

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun KinboardTVTheme(
    content: @Composable () -> Unit
) {
    val extendedColors = ExtendedColors()
    
    CompositionLocalProvider(
        LocalExtendedColors provides extendedColors
    ) {
        MaterialTheme(
            colorScheme = KinboardDarkColorScheme,
            content = content
        )
    }
}

// Extension property to access extended colors
object KinboardTheme {
    val extendedColors: ExtendedColors
        @Composable
        get() = LocalExtendedColors.current
    
    val typography: KinboardTypography
        get() = KinboardTypography
}
