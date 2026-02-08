package com.kinboard.tv.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.Dp
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Text
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.kinboard.tv.data.api.ApiClient
import com.kinboard.tv.ui.theme.*

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun UserAvatar(
    displayName: String,
    colorHex: String,
    avatarUrl: String?,
    modifier: Modifier = Modifier,
    size: Dp = ComponentSize.avatarDefault,
    contentDescription: String? = null
) {
    val userColor = try {
        Color(android.graphics.Color.parseColor(colorHex))
    } catch (e: Exception) {
        DefaultUserColor
    }
    
    Box(
        modifier = modifier
            .size(size)
            .clip(CircleShape)
            .background(userColor),
        contentAlignment = Alignment.Center
    ) {
        if (avatarUrl != null) {
            val fullUrl = "${ApiClient.getBaseUrl()}$avatarUrl"
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(fullUrl)
                    .crossfade(true)
                    .build(),
                contentDescription = contentDescription ?: "Avatar for $displayName",
                modifier = Modifier
                    .size(size)
                    .clip(CircleShape),
                contentScale = ContentScale.Crop
            )
        } else {
            // Show first letter of name
            val initial = displayName.firstOrNull()?.uppercaseChar()?.toString() ?: "?"
            Text(
                text = initial,
                style = if (size >= ComponentSize.avatarDefault) {
                    KinboardTypography.titleLarge
                } else {
                    KinboardTypography.titleMedium
                },
                color = Color.White
            )
        }
    }
}

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun JobImage(
    imageUrl: String?,
    jobTitle: String,
    modifier: Modifier = Modifier,
    size: Dp = ComponentSize.jobImageSize
) {
    if (imageUrl != null) {
        val fullUrl = "${ApiClient.getBaseUrl()}$imageUrl"
        AsyncImage(
            model = ImageRequest.Builder(LocalContext.current)
                .data(fullUrl)
                .crossfade(true)
                .build(),
            contentDescription = "Image for $jobTitle",
            modifier = modifier
                .size(size)
                .clip(CircleShape),
            contentScale = ContentScale.Crop
        )
    }
}
