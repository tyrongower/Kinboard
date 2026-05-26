package com.kinboard.tv.ui.screens.morning.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.kinboard.tv.ui.theme.MorningSkyB1
import com.kinboard.tv.ui.theme.MorningSkyB2
import com.kinboard.tv.ui.theme.MorningSkyMid
import com.kinboard.tv.ui.theme.MorningSkyTop

@Composable
fun SceneryBackground(modifier: Modifier = Modifier) {
    Box(
        modifier.background(
            Brush.verticalGradient(
                0.00f to MorningSkyTop,
                0.36f to MorningSkyMid,
                0.64f to MorningSkyB1,
                1.00f to MorningSkyB2,
            )
        )
    ) {
        Cloud(x = 80.dp,   y = 50.dp,  w = 220.dp, h = 64.dp, alpha = 0.94f)
        Cloud(x = 520.dp,  y = 130.dp, w = 280.dp, h = 72.dp, alpha = 0.85f)
        Cloud(x = 980.dp,  y = 60.dp,  w = 200.dp, h = 56.dp, alpha = 0.90f)
        Cloud(x = 1280.dp, y = 160.dp, w = 180.dp, h = 52.dp, alpha = 0.80f)

        // mist band: 60dp tall, 130dp from bottom of 1080 canvas
        Box(
            Modifier
                .fillMaxWidth()
                .height(60.dp)
                .offset(y = (1080 - 130 - 60).dp)
                .background(
                    Brush.verticalGradient(
                        listOf(Color.Transparent, Color.White.copy(alpha = 0.4f))
                    )
                )
        )
    }
}

@Composable
private fun Cloud(x: Dp, y: Dp, w: Dp, h: Dp, alpha: Float) {
    val white = Color.White.copy(alpha = alpha)
    Box(Modifier.offset(x, y).size(w, h)) {
        // base rounded body
        Box(
            Modifier
                .fillMaxSize()
                .clip(RoundedCornerShape(60.dp))
                .background(white)
        )
        // overlapping puff #1 (CSS ::before: 60% w, 120% h, top -50%, left 18%)
        Box(
            Modifier
                .size(w * 0.6f, h * 1.2f)
                .align(Alignment.TopStart)
                .offset(x = w * 0.18f, y = -h * 0.5f)
                .clip(CircleShape)
                .background(white)
        )
        // overlapping puff #2 (CSS ::after: 42% w, 96% h, top -32%, left 55%)
        Box(
            Modifier
                .size(w * 0.42f, h * 0.96f)
                .align(Alignment.TopStart)
                .offset(x = w * 0.55f, y = -h * 0.32f)
                .clip(CircleShape)
                .background(white)
        )
    }
}
