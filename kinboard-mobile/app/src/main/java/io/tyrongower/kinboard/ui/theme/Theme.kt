package io.tyrongower.kinboard.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp

private val DarkColorScheme = darkColorScheme(
    primary = ColorPrimary,
    onPrimary = ColorText,
    primaryContainer = ColorPrimaryHover,
    onPrimaryContainer = ColorText,
    secondary = ColorAccent,
    onSecondary = ColorText,
    secondaryContainer = ColorAccentHover,
    onSecondaryContainer = ColorText,
    tertiary = ColorAccent,
    onTertiary = ColorText,
    background = ColorBg,
    onBackground = ColorText,
    surface = ColorSurface,
    onSurface = ColorText,
    surfaceVariant = ColorSurfaceHover,
    onSurfaceVariant = ColorTextSecondary,
    error = ColorError,
    onError = ColorText,
    outline = ColorDivider,
    outlineVariant = ColorDivider
)

private val AppShapes = Shapes(
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(20.dp)
)

@Composable
fun KinboardTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    // Always use dark theme for Kinboard
    val colorScheme = DarkColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        shapes = AppShapes,
        content = content
    )
}
