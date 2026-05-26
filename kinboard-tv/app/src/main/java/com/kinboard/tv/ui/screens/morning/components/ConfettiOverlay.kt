package com.kinboard.tv.ui.screens.morning.components

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import com.kinboard.tv.ui.theme.MorningGold
import com.kinboard.tv.ui.theme.MorningRed
import kotlinx.coroutines.delay
import nl.dionsegijn.konfetti.compose.KonfettiView
import nl.dionsegijn.konfetti.core.Party
import nl.dionsegijn.konfetti.core.Position
import nl.dionsegijn.konfetti.core.emitter.Emitter
import java.util.concurrent.TimeUnit

@Composable
fun ConfettiOverlay(
    triggerKey: Int?,
    originX: Float = 0.5f,
    originY: Float = 0.5f,
    onDone: () -> Unit,
) {
    if (triggerKey == null) return
    val party = remember(triggerKey) {
        Party(
            speed = 28f,
            maxSpeed = 50f,
            damping = 0.92f,
            spread = 360,
            angle = 270,
            colors = listOf(
                MorningGold.toArgb(),
                MorningRed.toArgb(),
                Color(0xFFEC4899).toArgb(),
                Color(0xFF3B82F6).toArgb(),
                Color(0xFF8B5CF6).toArgb(),
                0xFFFFFFFF.toInt(),
            ),
            emitter = Emitter(duration = 600, TimeUnit.MILLISECONDS).max(60),
            position = Position.Relative(originX.toDouble(), originY.toDouble()),
        )
    }
    KonfettiView(parties = listOf(party), modifier = Modifier.fillMaxSize())
    LaunchedEffect(triggerKey) {
        delay(1200)
        onDone()
    }
}
