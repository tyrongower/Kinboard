package com.kinboard.tv.ui.screens.morning

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.unit.dp
import com.kinboard.tv.ui.screens.morning.components.MorningCalendarRibbon
import com.kinboard.tv.ui.screens.morning.components.MorningKidsBand
import com.kinboard.tv.ui.screens.morning.components.MorningTopBar
import com.kinboard.tv.ui.screens.morning.components.SceneryBackground
import com.kinboard.tv.ui.viewmodel.MorningPathViewModel
import com.kinboard.tv.ui.viewmodel.MorningUiState

@Composable
fun MorningPathScreen(state: MorningUiState, vm: MorningPathViewModel) {
    BoxWithConstraints(
        Modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        val sx = maxWidth.value / 1920f
        val sy = maxHeight.value / 1080f
        val scale = minOf(sx, sy)

        Box(
            Modifier
                .size(1920.dp, 1080.dp)
                .align(Alignment.Center)
                .graphicsLayer(
                    scaleX = scale,
                    scaleY = scale,
                    transformOrigin = TransformOrigin.Center
                )
        ) {
            SceneryBackground(Modifier.fillMaxSize())

            MorningTopBar(
                state = state,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 36.dp, start = 60.dp, end = 60.dp)
                    .fillMaxWidth()
            )

            MorningKidsBand(
                state = state,
                vm = vm,
                modifier = Modifier
                    .offset(y = 280.dp)
                    .fillMaxWidth()
                    .height(625.dp)
            )

            MorningCalendarRibbon(
                events = state.calendarEvents,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 36.dp, start = 60.dp, end = 60.dp)
                    .fillMaxWidth()
            )
        }
    }
}
