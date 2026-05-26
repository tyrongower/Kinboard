package com.kinboard.tv.ui.screens.morning.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.wrapContentSize
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.tv.material3.Border
import androidx.tv.material3.ClickableSurfaceDefaults
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Icon
import androidx.tv.material3.Surface
import androidx.tv.material3.Text
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.kinboard.tv.R
import com.kinboard.tv.data.api.ApiClient
import com.kinboard.tv.data.model.User
import com.kinboard.tv.ui.theme.MorningGold
import com.kinboard.tv.ui.theme.MorningInk
import com.kinboard.tv.ui.theme.MorningInkSoft
import com.kinboard.tv.ui.theme.MorningRed
import com.kinboard.tv.ui.theme.MorningType

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun StoneTile(
    data: StoneData,
    kid: User,
    size: Dp,
    isNext: Boolean,
    showWalker: Boolean,
    focusRequester: FocusRequester,
    onFocused: () -> Unit,
    onToggle: () -> Unit
) {
    var isFocused by remember { mutableStateOf(false) }
    val isCompleted = data.asg.isCompleted == true
    val borderColor = when {
        isCompleted -> MorningInkSoft
        isNext -> MorningRed
        else -> MorningInk
    }
    val containerColor = if (isCompleted) Color(0xFFE8E0D4) else Color.White

    Box(Modifier.width(size + 30.dp).height(size + 80.dp)) {
        if (isNext) {
            NextBadge(
                Modifier
                    .align(Alignment.TopCenter)
                    .offset(y = (-30).dp)
            )
        }
        if (showWalker) {
            Walker(
                kidAvatarUrl = kid.avatarUrl,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .offset(y = (-58).dp)
            )
        }
        Surface(
            onClick = onToggle,
            modifier = Modifier
                .size(size)
                .align(Alignment.Center)
                .focusRequester(focusRequester)
                .onFocusChanged { fs ->
                    isFocused = fs.isFocused
                    if (fs.isFocused) onFocused()
                },
            shape = ClickableSurfaceDefaults.shape(shape = CircleShape),
            colors = ClickableSurfaceDefaults.colors(
                containerColor = containerColor,
                focusedContainerColor = containerColor,
                pressedContainerColor = containerColor
            ),
            scale = ClickableSurfaceDefaults.scale(focusedScale = 1.0f),
            border = ClickableSurfaceDefaults.border(
                border = Border(
                    border = BorderStroke(5.dp, borderColor),
                    shape = CircleShape
                ),
                focusedBorder = Border(
                    border = BorderStroke(6.dp, MorningGold),
                    shape = CircleShape
                )
            )
        ) {
            Box(
                Modifier
                    .fillMaxSize()
                    .padding(8.dp),
                contentAlignment = Alignment.Center
            ) {
                val fullUrl = "${ApiClient.getBaseUrl()}${data.job.imageUrl ?: ""}"
                AsyncImage(
                    model = ImageRequest.Builder(LocalContext.current)
                        .data(fullUrl)
                        .crossfade(true)
                        .build(),
                    contentDescription = data.job.title,
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape)
                        .alpha(if (isCompleted) 0.35f else 1f),
                    contentScale = ContentScale.Crop
                )
                if (isCompleted) {
                    Icon(
                        painter = painterResource(R.drawable.ic_check),
                        contentDescription = "completed",
                        tint = MorningInk,
                        modifier = Modifier
                            .fillMaxSize(0.62f)
                            .rotate(-12f)
                    )
                }
            }
        }
        StoneLabel(
            text = data.job.title,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .offset(y = (-4).dp)
                .width(size + 20.dp),
            completed = isCompleted
        )
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun NextBadge(modifier: Modifier = Modifier) {
    Box(
        modifier
            .wrapContentSize()
            .hardShadow(4.dp, MorningInk, 12.dp)
            .background(MorningRed, RoundedCornerShape(12.dp))
            .border(3.dp, MorningInk, RoundedCornerShape(12.dp))
            .padding(horizontal = 10.dp, vertical = 3.dp)
    ) {
        Text(
            text = "NEXT",
            style = MorningType.quicksand(13f, FontWeight.ExtraBold).copy(
                color = Color.White,
                letterSpacing = 0.22.em
            )
        )
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
private fun StoneLabel(text: String, modifier: Modifier = Modifier, completed: Boolean = false) {
    val labelBg = if (completed) Color(0xFFE8E0D4) else Color.White
    val labelInk = if (completed) MorningInkSoft else MorningInk
    Box(
        modifier
            .hardShadow(4.dp, MorningInk, 16.dp)
            .background(labelBg, RoundedCornerShape(16.dp))
            .border(3.dp, MorningInk, RoundedCornerShape(16.dp))
            .padding(horizontal = 12.dp, vertical = 4.dp)
    ) {
        Text(
            text = text,
            style = MorningType.quicksand(22f, FontWeight.Bold).copy(color = labelInk),
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )
    }
}
