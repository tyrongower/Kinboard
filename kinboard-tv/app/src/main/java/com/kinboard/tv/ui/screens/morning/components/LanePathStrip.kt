package com.kinboard.tv.ui.screens.morning.components

import androidx.compose.foundation.Canvas
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.unit.dp
import com.kinboard.tv.ui.theme.MorningInk
import com.kinboard.tv.ui.theme.MorningPathGreen1
import com.kinboard.tv.ui.theme.MorningPathGreen2
import com.kinboard.tv.ui.theme.MorningPathTan1
import com.kinboard.tv.ui.theme.MorningPathTan2

@Composable
fun LanePathStrip(laneIndex: Int, modifier: Modifier = Modifier) {
    Canvas(modifier) {
        val grad = if (laneIndex == 0) {
            Brush.verticalGradient(listOf(MorningPathTan1, MorningPathTan2))
        } else {
            Brush.verticalGradient(listOf(MorningPathGreen1, MorningPathGreen2))
        }
        val h = 54.dp.toPx()
        val cy = size.height / 2f
        val stripRect = Rect(0f, cy - h / 2f, size.width, cy + h / 2f)
        drawRect(brush = grad, topLeft = stripRect.topLeft, size = stripRect.size)

        val edgeDash = PathEffect.dashPathEffect(floatArrayOf(14.dp.toPx(), 10.dp.toPx()))
        drawLine(
            color = MorningInk,
            start = Offset(0f, stripRect.top),
            end = Offset(size.width, stripRect.top),
            strokeWidth = 4.dp.toPx(),
            pathEffect = edgeDash
        )
        drawLine(
            color = MorningInk,
            start = Offset(0f, stripRect.bottom),
            end = Offset(size.width, stripRect.bottom),
            strokeWidth = 4.dp.toPx(),
            pathEffect = edgeDash
        )
        val centerDash = PathEffect.dashPathEffect(floatArrayOf(14.dp.toPx(), 12.dp.toPx()))
        drawLine(
            color = MorningInk.copy(alpha = 0.4f),
            start = Offset(0f, cy),
            end = Offset(size.width, cy),
            strokeWidth = 6.dp.toPx(),
            pathEffect = centerDash
        )
    }
}
