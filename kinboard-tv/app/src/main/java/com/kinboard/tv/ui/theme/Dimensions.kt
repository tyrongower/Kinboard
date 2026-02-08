package com.kinboard.tv.ui.theme

import androidx.compose.ui.unit.dp

// Spacing Scale
object Spacing {
    val xs = 4.dp
    val sm = 8.dp
    val md = 12.dp
    val lg = 16.dp
    val xl = 20.dp
    val xxl = 24.dp
    val xxxl = 32.dp
}

// Border Radius Scale
object BorderRadius {
    val sm = 8.dp
    val md = 12.dp      // Default roundness
    val lg = 16.dp
    val xl = 20.dp
    val full = 9999.dp  // Circular elements
}

// Component Sizes
object ComponentSize {
    // Avatar sizes
    val avatarDefault = 48.dp
    val avatarSmall = 40.dp
    
    // Button sizes
    val buttonHeight = 44.dp
    val iconButtonSize = 44.dp
    
    // Icon sizes
    val iconSmall = 20.dp
    val iconDefault = 24.dp
    val iconLarge = 28.dp
    
    // Logo
    val logoSize = 80.dp
    val logoBorderRadius = 20.dp
    
    // Progress bar
    val progressBarHeight = 6.dp
    
    // Card borders
    val cardLeftBorder = 4.dp
    val focusBorderWidth = 3.dp
    
    // Job item image
    val jobImageSize = 40.dp
    
    // Checkbox icon
    val checkboxSize = 28.dp
}

// Layout dimensions
object Layout {
    val maxContentWidth = 400.dp
    val screenPadding = 20.dp
    val cardGap = 16.dp
    val buttonGap = 12.dp
    val headerMarginBottom = 24.dp
}

// Shadow definitions
object Shadows {
    // Small Shadow
    val smallElevation = 1.dp
    
    // Medium Shadow
    val mediumElevation = 3.dp
    
    // Large Shadow
    val largeElevation = 5.dp
    
    // Focus Shadow (TV)
    val focusElevation = 6.dp
    val focusShadowRadius = 12.dp
    val focusShadowOpacity = 0.45f
    
    // Card active shadow
    val cardActiveShadowRadius = 14.dp
    val cardActiveElevation = 10.dp
}
