package com.kinboard.tv.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.kinboard.tv.ui.theme.*

@Composable
fun JobProgressBar(
    progress: Float, // 0f to 1f
    colorHex: String,
    modifier: Modifier = Modifier
) {
    val animatedProgress by animateFloatAsState(
        targetValue = progress.coerceIn(0f, 1f),
        animationSpec = tween(durationMillis = 300),
        label = "progress"
    )
    
    val fillColor = try {
        Color(android.graphics.Color.parseColor(colorHex))
    } catch (e: Exception) {
        DefaultUserColor
    }
    
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(ComponentSize.progressBarHeight)
            .clip(RoundedCornerShape(3.dp))
            .background(SurfaceVariant)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth(animatedProgress)
                .height(ComponentSize.progressBarHeight)
                .clip(RoundedCornerShape(3.dp))
                .background(fillColor)
        )
    }
}
