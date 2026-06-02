package com.kinboard.tv.ui.screens.morning

import androidx.compose.foundation.background
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import com.kinboard.tv.ui.screens.morning.components.ConfettiOverlay
import com.kinboard.tv.ui.screens.morning.components.MorningCalendarRibbon
import com.kinboard.tv.ui.screens.morning.components.MorningKidsBand
import com.kinboard.tv.ui.screens.morning.components.MorningTopBar
import com.kinboard.tv.ui.screens.morning.components.SceneryBackground
import com.kinboard.tv.ui.theme.MorningGold
import com.kinboard.tv.ui.theme.MorningInk
import com.kinboard.tv.ui.theme.MorningType
import com.kinboard.tv.ui.viewmodel.MorningPathViewModel
import com.kinboard.tv.ui.viewmodel.MorningUiState

@Composable
fun MorningPathScreen(state: MorningUiState, vm: MorningPathViewModel) {
    val configuration = LocalConfiguration.current
    val screenWPx = with(LocalDensity.current) { configuration.screenWidthDp.dp.toPx() }
    val screenHPx = with(LocalDensity.current) { configuration.screenHeightDp.dp.toPx() }
    val designDensity = minOf(screenWPx / 1920f, screenHPx / 1080f)

    CompositionLocalProvider(
        LocalDensity provides Density(density = designDensity, fontScale = 1f)
    ) {
        Box(
            Modifier
                .fillMaxSize()
                .background(Color.Black),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                Modifier
                    .size(1920.dp, 1080.dp)
                    .focusable()
            ) {
            SceneryBackground(Modifier.fillMaxSize())

            MorningTopBar(
                state = state,
                onToggleHideCompleted = { vm.toggleHideCompleted() },
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 36.dp, start = 60.dp, end = 60.dp)
                    .fillMaxWidth()
            )

            when {
                state.isLoading && state.users.isEmpty() && state.jobs.isEmpty() -> {
                    Box(
                        modifier = Modifier
                            .offset(y = 280.dp)
                            .fillMaxWidth()
                            .height(625.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(80.dp),
                            color = MorningInk
                        )
                    }
                }

                state.users.isEmpty() -> {
                    Box(
                        modifier = Modifier
                            .offset(y = 280.dp)
                            .fillMaxWidth()
                            .height(625.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = if (state.isOffline) {
                                "Offline — waiting for connection"
                            } else {
                                "Add a family member in admin"
                            },
                            style = MorningType.fraunces(48f, italic = true, weight = FontWeight.Black)
                                .copy(color = MorningInk)
                        )
                    }
                }

                else -> {
                    MorningKidsBand(
                        state = state,
                        vm = vm,
                        modifier = Modifier
                            .offset(y = 280.dp)
                            .fillMaxWidth()
                            .height(625.dp)
                    )
                }
            }

            MorningCalendarRibbon(
                events = state.calendarEvents,
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 36.dp, start = 60.dp, end = 60.dp)
                    .fillMaxWidth()
            )

            if (state.errorMessage != null) {
                ErrorBanner(
                    message = state.errorMessage,
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .offset(y = 8.dp)
                )
            }

            ConfettiOverlay(
                triggerKey = state.celebrateAssignmentId,
                originX = 0.5f,
                originY = if (state.focusedKidIndex == 0) 0.42f else 0.72f,
                onDone = { vm.clearCelebrate() }
            )
            }
        }
    }
}

@Composable
private fun ErrorBanner(message: String, modifier: Modifier = Modifier) {
    Box(
        modifier
            .background(MorningGold, RoundedCornerShape(14.dp))
            .padding(horizontal = 18.dp, vertical = 6.dp)
    ) {
        Text(
            text = message,
            style = MorningType.quicksand(18f, FontWeight.Bold).copy(color = MorningInk)
        )
    }
}
