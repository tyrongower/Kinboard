package io.tyrongower.kinboard.ui.theme

import androidx.compose.ui.graphics.Color

// Dark theme colors (default)
val ColorBg = Color(0xFF0F1419)
val ColorBgElevated = Color(0xFF1A1F2E)
val ColorSurface = Color(0xFF232936)
val ColorSurfaceHover = Color(0xFF2D3548)
val ColorText = Color(0xFFF1F5F9)
val ColorTextSecondary = Color(0xFF94A3B8)
val ColorTextMuted = Color(0xFF64748B)
val ColorDivider = Color(0xFF334155)

// Brand colors
val ColorPrimary = Color(0xFF60A5FA)
val ColorPrimaryHover = Color(0xFF3B82F6)
val ColorPrimaryMuted = Color(0xFF60A5FA).copy(alpha = 0.15f)
val ColorAccent = Color(0xFF34D399)
val ColorAccentHover = Color(0xFF10B981)
val ColorAccentMuted = Color(0xFF34D399).copy(alpha = 0.15f)

// Status colors
val ColorSuccess = Color(0xFF22C55E)
val ColorSuccessMuted = Color(0xFF22C55E).copy(alpha = 0.15f)
val ColorWarning = Color(0xFFFBBF24)
val ColorWarningMuted = Color(0xFFFBBF24).copy(alpha = 0.15f)
val ColorError = Color(0xFFF87171)
val ColorErrorMuted = Color(0xFFF87171).copy(alpha = 0.15f)

// Kinboard-prefixed aliases for compatibility
val KinboardColorBg = ColorBg
val KinboardColorBgElevated = ColorBgElevated
val KinboardColorSurface = ColorSurface
val KinboardColorSurfaceHover = ColorSurfaceHover
val KinboardColorText = ColorText
val KinboardColorTextSecondary = ColorTextSecondary
val KinboardColorTextMuted = ColorTextMuted
val KinboardColorDivider = ColorDivider
val KinboardColorPrimary = ColorPrimary
val KinboardColorPrimaryHover = ColorPrimaryHover
val KinboardColorPrimaryMuted = ColorPrimaryMuted
val KinboardColorAccent = ColorAccent
val KinboardColorAccentHover = ColorAccentHover
val KinboardColorAccentMuted = ColorAccentMuted
