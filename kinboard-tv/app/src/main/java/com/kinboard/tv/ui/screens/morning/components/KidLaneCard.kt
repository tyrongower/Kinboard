package com.kinboard.tv.ui.screens.morning.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.kinboard.tv.data.api.ApiClient
import com.kinboard.tv.data.model.User
import com.kinboard.tv.ui.theme.MorningGold
import com.kinboard.tv.ui.theme.MorningInk
import com.kinboard.tv.ui.theme.MorningKidMatBg
import com.kinboard.tv.ui.theme.MorningKidMatInk
import com.kinboard.tv.ui.theme.MorningKidWavBg
import com.kinboard.tv.ui.theme.MorningKidWavInk
import com.kinboard.tv.ui.theme.MorningType

@Composable
fun KidLaneCard(
    kid: User,
    doneCount: Int,
    totalCount: Int,
    laneIndex: Int,
    modifier: Modifier = Modifier
) {
    val bgRing = if (laneIndex == 0) MorningKidWavBg else MorningKidMatBg
    val inkName = if (laneIndex == 0) MorningKidWavInk else MorningKidMatInk
    val rotation = if (laneIndex == 0) -1.4f else 1.0f
    val pillBg = if (doneCount == 0) Color.White else MorningGold

    Box(
        modifier
            .width(200.dp)
            .rotate(rotation)
            .hardShadow(offsetY = 8.dp, color = MorningInk, radius = 26.dp)
            .background(Color.White, RoundedCornerShape(26.dp))
            .border(5.dp, MorningInk, RoundedCornerShape(26.dp))
            .padding(top = 14.dp, start = 12.dp, end = 12.dp, bottom = 12.dp)
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxSize()
        ) {
            Box(
                Modifier
                    .size(96.dp)
                    .hardShadow(4.dp, MorningInk, 48.dp)
                    .clip(CircleShape)
                    .background(bgRing)
                    .border(5.dp, MorningInk, CircleShape),
                contentAlignment = Alignment.Center
            ) {
                val fullUrl = "${ApiClient.getBaseUrl()}${kid.avatarUrl ?: ""}"
                AsyncImage(
                    model = ImageRequest.Builder(LocalContext.current)
                        .data(fullUrl)
                        .crossfade(true)
                        .build(),
                    contentDescription = kid.displayName,
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
            }
            Text(
                text = kid.displayName,
                style = MorningType.fraunces(38f).copy(color = inkName),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Box(
                Modifier
                    .hardShadow(4.dp, MorningInk, 18.dp)
                    .background(pillBg, RoundedCornerShape(18.dp))
                    .border(3.dp, MorningInk, RoundedCornerShape(18.dp))
                    .padding(horizontal = 16.dp, vertical = 6.dp)
            ) {
                Text(
                    text = "$doneCount / $totalCount",
                    style = MorningType.fraunces(28f).copy(color = MorningInk)
                )
            }
        }
    }
}
