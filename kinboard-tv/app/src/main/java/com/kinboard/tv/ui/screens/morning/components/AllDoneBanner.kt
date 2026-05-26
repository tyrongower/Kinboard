package com.kinboard.tv.ui.screens.morning.components

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Text
import com.kinboard.tv.R
import com.kinboard.tv.data.model.User
import com.kinboard.tv.ui.theme.MorningGold
import com.kinboard.tv.ui.theme.MorningInk
import com.kinboard.tv.ui.theme.MorningType

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun AllDoneBanner(kid: User, modifier: Modifier = Modifier) {
    val scale = remember(kid.id) { Animatable(0.7f) }
    LaunchedEffect(kid.id) {
        scale.animateTo(1.0f, animationSpec = spring(dampingRatio = 0.42f, stiffness = 250f))
    }
    Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Box(
            Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.78f)
                .padding(horizontal = 24.dp)
                .graphicsLayer {
                    scaleX = scale.value
                    scaleY = scale.value
                }
                .hardShadow(offsetY = 8.dp, color = MorningInk, radius = 26.dp)
                .background(
                    Brush.verticalGradient(listOf(Color(0xFFFFE26B), MorningGold)),
                    RoundedCornerShape(26.dp),
                )
                .border(5.dp, MorningInk, RoundedCornerShape(26.dp))
                .padding(horizontal = 36.dp),
            contentAlignment = Alignment.Center,
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(28.dp),
            ) {
                Icon(
                    painter = painterResource(R.drawable.ic_trophy),
                    contentDescription = null,
                    modifier = Modifier.size(96.dp),
                    tint = Color.Unspecified,
                )
                Text(
                    text = "All done, ${kid.displayName}!",
                    style = MorningType.fraunces(64f, italic = true, weight = FontWeight.Black)
                        .copy(color = MorningInk),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                Icon(
                    painter = painterResource(R.drawable.ic_trophy),
                    contentDescription = null,
                    modifier = Modifier.size(96.dp),
                    tint = Color.Unspecified,
                )
            }
        }
    }
}
