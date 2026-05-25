package com.kinboard.tv.ui.screens.morning.components

import androidx.compose.animation.core.EaseInOut
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.kinboard.tv.data.api.ApiClient
import com.kinboard.tv.ui.theme.MorningInk

@Composable
fun Walker(kidAvatarUrl: String?, modifier: Modifier = Modifier) {
    val infinite = rememberInfiniteTransition(label = "walker")
    val hop by infinite.animateFloat(
        initialValue = 0f,
        targetValue = -4f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 800, easing = EaseInOut),
            repeatMode = RepeatMode.Reverse
        ),
        label = "hop"
    )
    Box(modifier.offset(y = hop.dp)) {
        Box(
            Modifier
                .size(62.dp)
                .hardShadow(5.dp, MorningInk, 31.dp)
                .clip(CircleShape)
                .background(Color.White)
                .border(4.dp, MorningInk, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            val fullUrl = "${ApiClient.getBaseUrl()}${kidAvatarUrl ?: ""}"
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(fullUrl)
                    .crossfade(true)
                    .build(),
                contentDescription = null,
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
        }
        Canvas(
            Modifier
                .align(Alignment.BottomCenter)
                .size(width = 16.dp, height = 8.dp)
                .offset(y = 6.dp)
        ) {
            val p = Path().apply {
                moveTo(0f, 0f)
                lineTo(size.width, 0f)
                lineTo(size.width / 2, size.height)
                close()
            }
            drawPath(p, MorningInk)
        }
    }
}
