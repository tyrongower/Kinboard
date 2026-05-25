package com.kinboard.tv.ui.screens.morning.components

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.unit.Dp

/**
 * Mimics CSS `box-shadow: 0 {offsetY}px 0 {color}` — a hard, non-blurred offset shadow.
 * Apply BEFORE the foreground background modifier so the shadow renders behind.
 */
fun Modifier.hardShadow(offsetY: Dp, color: Color, radius: Dp): Modifier =
    drawBehind {
        drawRoundRect(
            color = color,
            topLeft = Offset(0f, offsetY.toPx()),
            size = Size(size.width, size.height),
            cornerRadius = CornerRadius(radius.toPx())
        )
    }
