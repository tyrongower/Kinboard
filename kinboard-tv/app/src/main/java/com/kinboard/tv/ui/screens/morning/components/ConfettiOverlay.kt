package com.kinboard.tv.ui.screens.morning.components

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.rotate
import com.kinboard.tv.ui.theme.MorningGold
import com.kinboard.tv.ui.theme.MorningRed
import kotlinx.coroutines.delay
import kotlin.math.cos
import kotlin.math.sin
import kotlin.random.Random

private const val PARTICLE_COUNT = 80
private const val DURATION_MS = 1200L
private const val FRAME_MS = 16L

private data class Particle(
    val color: Color,
    val angle: Float,
    val speed: Float,
    val gravity: Float,
    val rotation: Float,
    val rotationSpeed: Float,
    val sizePx: Float,
)

@Composable
fun ConfettiOverlay(
    triggerKey: Int?,
    originX: Float = 0.5f,
    originY: Float = 0.5f,
    onDone: () -> Unit,
) {
    if (triggerKey == null) return

    val palette = listOf(
        MorningGold, MorningRed,
        Color(0xFFEC4899), Color(0xFF3B82F6),
        Color(0xFF8B5CF6), Color.White,
    )
    val particles = remember(triggerKey) {
        List(PARTICLE_COUNT) {
            val angleDeg = Random.nextFloat() * 360f
            Particle(
                color = palette[Random.nextInt(palette.size)],
                angle = Math.toRadians(angleDeg.toDouble()).toFloat(),
                speed = 400f + Random.nextFloat() * 600f,
                gravity = 900f + Random.nextFloat() * 400f,
                rotation = Random.nextFloat() * 360f,
                rotationSpeed = (Random.nextFloat() - 0.5f) * 720f,
                sizePx = 8f + Random.nextFloat() * 10f,
            )
        }
    }
    var elapsed by remember(triggerKey) { mutableFloatStateOf(0f) }

    LaunchedEffect(triggerKey) {
        val start = System.currentTimeMillis()
        while (true) {
            val now = System.currentTimeMillis()
            elapsed = (now - start) / 1000f
            if (now - start >= DURATION_MS) break
            delay(FRAME_MS)
        }
        onDone()
    }

    Canvas(modifier = Modifier.fillMaxSize()) {
        val ox = size.width * originX
        val oy = size.height * originY
        val t = elapsed
        val fade = (1f - (t / (DURATION_MS / 1000f))).coerceIn(0f, 1f)
        particles.forEach { p ->
            val vx = cos(p.angle) * p.speed
            val vy = sin(p.angle) * p.speed
            val x = ox + vx * t
            val y = oy + vy * t + 0.5f * p.gravity * t * t
            val rotDeg = p.rotation + p.rotationSpeed * t
            rotate(degrees = rotDeg, pivot = Offset(x, y)) {
                drawRect(
                    color = p.color.copy(alpha = fade),
                    topLeft = Offset(x - p.sizePx / 2f, y - p.sizePx / 2f),
                    size = Size(p.sizePx, p.sizePx * 0.4f),
                )
            }
        }
    }
}
