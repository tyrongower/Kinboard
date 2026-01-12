package com.kinboard.tv.ui.theme

import androidx.compose.ui.graphics.Color

// Primary Colors
val Primary = Color(0xFF60A5FA)           // blue-400 - Main brand color, focus rings, highlights
val PrimaryContainer = Color(0xFF1E3A8A)  // blue-900
val OnPrimary = Color(0xFFFFFFFF)
val OnPrimaryContainer = Color(0xFFDBEAFE) // blue-100

// Secondary/Accent Colors
val Secondary = Color(0xFF34D399)          // emerald-400 - Success states, "All done" text
val SecondaryContainer = Color(0xFF064E3B) // emerald-900
val OnSecondary = Color(0xFFFFFFFF)
val OnSecondaryContainer = Color(0xFFD1FAE5) // emerald-100

// Tertiary Colors
val Tertiary = Color(0xFF22D3EE)           // cyan-400 - Warnings, additional accents
val TertiaryContainer = Color(0xFF083344)  // cyan-900
val OnTertiary = Color(0xFFFFFFFF)
val OnTertiaryContainer = Color(0xFFCFFAFE) // cyan-100

// Status Colors
val Error = Color(0xFFF87171)              // red-400
val ErrorContainer = Color(0xFF7F1D1D)     // red-900
val OnError = Color(0xFFFFFFFF)
val OnErrorContainer = Color(0xFFFECACA)   // red-200
val Success = Color(0xFF22C55E)            // green-500
val Warning = Color(0xFFFBBF24)            // amber-400

// Background & Surface Colors
val Background = Color(0xFF0F1419)         // Main app background
val OnBackground = Color(0xFFF1F5F9)       // Primary text on background
val Surface = Color(0xFF232936)            // Card backgrounds, elevated surfaces
val OnSurface = Color(0xFFF1F5F9)          // Primary text on surfaces
val SurfaceVariant = Color(0xFF2D3548)     // Hover states, secondary surfaces
val OnSurfaceVariant = Color(0xFF94A3B8)   // Secondary text, muted content

// Border & Outline Colors
val Outline = Color(0xFF334155)            // slate-700 - Dividers, borders
val OutlineVariant = Color(0xFF475569)     // slate-600
val BorderSubtle = Color(0x1FFFFFFF)       // rgba(255,255,255,0.12)

// Elevation Levels (Surface tints)
val ElevationLevel0 = Color.Transparent
val ElevationLevel1 = Color(0xFF1A1F2E)    // Elevated background
val ElevationLevel2 = Color(0xFF232936)
val ElevationLevel3 = Color(0xFF2D3548)    // Focused button backgrounds
val ElevationLevel4 = Color(0xFF334155)
val ElevationLevel5 = Color(0xFF3E4C5E)

// Disabled States
val SurfaceDisabled = Color(0x1FF1F5F9)    // rgba(241, 245, 249, 0.12)
val OnSurfaceDisabled = Color(0x61F1F5F9)  // rgba(241, 245, 249, 0.38)
val Backdrop = Color(0xB30F1419)           // rgba(15, 20, 25, 0.7)

// Dynamic Colors from API
val DefaultUserColor = Color(0xFF6366F1)   // indigo - Default user color
val UnassignedJobsColor = Color(0xFF94A3B8) // slate-400 - Unassigned jobs color

// Focus Shadow Color
val FocusShadowColor = Primary             // #60a5fa with opacity 0.45
