package com.kinboard.tv.ui.screens.morning.components

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.tv.material3.ExperimentalTvMaterial3Api
import androidx.tv.material3.Text
import com.kinboard.tv.ui.theme.MorningInkSoft
import com.kinboard.tv.ui.theme.MorningType

@OptIn(ExperimentalTvMaterial3Api::class)
@Composable
fun NoJobsToday(modifier: Modifier = Modifier) {
    Box(modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(
            text = "☀ no jobs today",
            style = MorningType.fraunces(54f, italic = true, weight = FontWeight.Black)
                .copy(color = MorningInkSoft),
        )
    }
}
